param(
  [ValidateSet('daily', 'weekly', 'manual')]
  [string]$BackupType = 'manual'
)

$ErrorActionPreference = 'Stop'
$backendPath = $PSScriptRoot
$projectRoot = Split-Path $backendPath -Parent
$envPath = Join-Path $backendPath '.env'
$logPath = Join-Path $env:LOCALAPPDATA 'GSBusanzaAccounting\backup.log'
$mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.4'
$dumpPath = Join-Path $mysqlHome 'bin\mysqldump.exe'

function Get-Setting([string]$key, [string]$default = '') {
  $line = Get-Content $envPath | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
  if (-not $line) { return $default }
  return $line.Substring($key.Length + 1)
}

function Write-BackupLog([string]$message) {
  $parent = Split-Path $logPath -Parent
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Add-Content -Path $logPath -Encoding utf8 -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $message"
}

if (-not (Test-Path $envPath)) { throw "Database configuration is missing: $envPath" }
if (-not (Test-Path $dumpPath)) { throw "MySQL dump utility was not found: $dumpPath" }

$database = Get-Setting 'DB_NAME' 'gs_busanza_accounting'
$hostName = Get-Setting 'DB_HOST' '127.0.0.1'
$port = Get-Setting 'DB_PORT' '3307'
$username = Get-Setting 'DB_USER' ''
$password = Get-Setting 'DB_PASSWORD' ''
$retentionDays = 30
$retentionSetting = Get-Setting 'BACKUP_RETENTION_DAYS' '30'
if (-not [int]::TryParse($retentionSetting, [ref]$retentionDays) -or $retentionDays -lt 1 -or $retentionDays -gt 3650) {
  throw 'BACKUP_RETENTION_DAYS must be between 1 and 3650.'
}
if ($database -notmatch '^[A-Za-z0-9_]+$' -or -not $username -or -not $password) {
  throw 'Database name or credentials in backend\.env are invalid.'
}

$backupDirectory = Get-Setting 'BACKUP_DIRECTORY' (Join-Path $env:LOCALAPPDATA 'GSBusanzaAccounting\backups')
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$backupUserSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls.exe $backupDirectory /inheritance:r /grant:r `
  "*$($backupUserSid):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Could not restrict backup directory permissions: $backupDirectory"
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$name = "gs_busanza_accounting_${BackupType}_$timestamp"
$sqlPath = Join-Path $backupDirectory "$name.sql.tmp"
$gzipPath = Join-Path $backupDirectory "$name.sql.gz.tmp"
$backupPath = Join-Path $backupDirectory "$name.sql.gz"
$errorPath = Join-Path $backupDirectory "$name.error.tmp"
$previousPassword = $env:MYSQL_PWD

try {
  & (Join-Path $backendPath 'start_database.ps1')
  $env:MYSQL_PWD = $password
  $arguments = @(
    '--protocol=TCP',
    "--host=$hostName",
    "--port=$port",
    "--user=$username",
    '--single-transaction',
    '--quick',
    '--routines',
    '--triggers',
    '--events',
    '--no-tablespaces',
    '--databases',
    $database
  )
  $process = Start-Process -FilePath $dumpPath -ArgumentList $arguments -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput $sqlPath -RedirectStandardError $errorPath
  if ($process.ExitCode -ne 0) {
    $dumpError = if (Test-Path $errorPath) { (Get-Content $errorPath -Raw).Trim() } else { 'mysqldump returned an error without a message.' }
    throw "mysqldump failed (exit code $($process.ExitCode)): $dumpError"
  }
  if (-not (Test-Path $sqlPath) -or (Get-Item $sqlPath).Length -eq 0) {
    throw 'mysqldump completed without producing a backup file.'
  }

  $inputStream = [System.IO.File]::OpenRead($sqlPath)
  try {
    $outputStream = [System.IO.File]::Create($gzipPath)
    try {
      $gzipStream = [System.IO.Compression.GZipStream]::new(
        $outputStream,
        [System.IO.Compression.CompressionLevel]::Optimal
      )
      try {
        $inputStream.CopyTo($gzipStream)
      } finally {
        $gzipStream.Dispose()
      }
    } finally {
      $outputStream.Dispose()
    }
  } finally {
    $inputStream.Dispose()
  }

  Move-Item -Path $gzipPath -Destination $backupPath
  $hash = (Get-FileHash -Path $backupPath -Algorithm SHA256).Hash
  Set-Content -Path "$backupPath.sha256" -Value "$hash  $(Split-Path $backupPath -Leaf)" -Encoding ascii
  Write-BackupLog "SUCCESS type=$BackupType file=$(Split-Path $backupPath -Leaf) bytes=$((Get-Item $backupPath).Length) sha256=$hash"

  $cutoff = (Get-Date).AddDays(-$retentionDays)
  Get-ChildItem -Path $backupDirectory -File -Filter 'gs_busanza_accounting_*.sql.gz' |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    ForEach-Object {
      Remove-Item -LiteralPath $_.FullName
      $checksumPath = "$($_.FullName).sha256"
      if (Test-Path $checksumPath) { Remove-Item -LiteralPath $checksumPath }
      Write-BackupLog "RETIRED file=$($_.Name)"
    }

  if (Test-Path $errorPath) { Remove-Item -LiteralPath $errorPath }
  Write-Output "Backup created: $backupPath"
} catch {
  Write-BackupLog "FAILED type=$BackupType error=$($_.Exception.Message)"
  throw
} finally {
  if ($null -eq $previousPassword) { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
  else { $env:MYSQL_PWD = $previousPassword }
  foreach ($temporaryPath in @($sqlPath, $gzipPath, $errorPath)) {
    if (Test-Path $temporaryPath) { Remove-Item -LiteralPath $temporaryPath -ErrorAction SilentlyContinue }
  }
}
