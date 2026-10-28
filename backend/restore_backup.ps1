param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'
$mysqlPath = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
$rootPasswordPath = Join-Path $env:LOCALAPPDATA 'GSBusanzaAccounting\mysql-root-password.txt'

function Get-Setting([string]$key, [string]$default = '') {
  $line = Get-Content $envPath | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
  if (-not $line) { return $default }
  return $line.Substring($key.Length + 1)
}

if (-not (Test-Path $envPath)) { throw 'backend\.env is missing.' }
if (-not (Test-Path $mysqlPath)) { throw "MySQL client not found: $mysqlPath" }
if (-not (Test-Path $rootPasswordPath)) { throw "Local MySQL administrator password is missing: $rootPasswordPath" }
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
if ($resolvedBackup -notmatch '\.sql\.gz$') { throw 'Restore input must be a .sql.gz backup.' }

$checksumFile = "$resolvedBackup.sha256"
if (-not (Test-Path $checksumFile)) { throw "Backup checksum file is missing: $checksumFile" }
$expectedHash = ((Get-Content $checksumFile -Raw).Trim() -split '\s+')[0]
$actualHash = (Get-FileHash -LiteralPath $resolvedBackup -Algorithm SHA256).Hash
if ($actualHash -ne $expectedHash) { throw 'Backup checksum does not match; the backup may be damaged or modified.' }

$database = Get-Setting 'DB_NAME' 'gs_busanza_accounting'
$hostName = Get-Setting 'DB_HOST' '127.0.0.1'
$port = Get-Setting 'DB_PORT' '3307'
if ($database -notmatch '^[A-Za-z0-9_]+$') {
  throw 'Database name in backend\.env is invalid.'
}
$password = (Get-Content $rootPasswordPath -Raw).Trim()
if (-not $password) { throw 'The local MySQL administrator password file is empty.' }

if (-not $Force) {
  $confirmation = Read-Host "Restoring will replace all current data in '$database'. Type RESTORE to continue"
  if ($confirmation -cne 'RESTORE') { throw 'Restore cancelled; the database was not changed.' }
}

$previousPassword = $env:MYSQL_PWD
try {
  $env:MYSQL_PWD = $password
  $arguments = @(
    '--protocol=TCP',
    "--host=$hostName",
    "--port=$port",
    '--user=root'
  )
  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $mysqlPath
  $startInfo.Arguments = ($arguments | ForEach-Object { '"' + $_.Replace('"', '\"') + '"' }) -join ' '
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.EnvironmentVariables['MYSQL_PWD'] = $password
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  if (-not $process.Start()) {
    throw 'Could not start the MySQL restore process.'
  }
  $restoreErrorTask = $process.StandardError.ReadToEndAsync()
  $inputStream = [System.IO.File]::OpenRead($resolvedBackup)
  $gzipStream = [System.IO.Compression.GZipStream]::new($inputStream, [System.IO.Compression.CompressionMode]::Decompress)
  $copyError = $null
  try {
    $gzipStream.CopyTo($process.StandardInput.BaseStream)
  } catch {
    $copyError = $_
  } finally {
    $process.StandardInput.Close()
    $gzipStream.Dispose()
    $inputStream.Dispose()
  }
  $process.WaitForExit()
  $restoreError = $restoreErrorTask.GetAwaiter().GetResult().Trim()
  if ($copyError) { throw $copyError }
  if ($process.ExitCode -ne 0) {
    throw "MySQL restore failed (exit code $($process.ExitCode)): $restoreError"
  }
  Write-Output "Database '$database' restored from $resolvedBackup."
} finally {
  if ($null -eq $previousPassword) { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
  else { $env:MYSQL_PWD = $previousPassword }
}
