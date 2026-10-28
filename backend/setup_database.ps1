$ErrorActionPreference = 'Stop'

$backendPath = $PSScriptRoot
$projectRoot = Split-Path $backendPath -Parent
$mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.4'
$serverPath = Join-Path $mysqlHome 'bin\mysqld.exe'
$clientPath = Join-Path $mysqlHome 'bin\mysql.exe'
$dataParent = Join-Path $env:LOCALAPPDATA 'GSBusanzaAccounting'
$dataPath = Join-Path $dataParent 'mysql-data'
$rootPasswordPath = Join-Path $dataParent 'mysql-root-password.txt'
$envPath = Join-Path $backendPath '.env'
$logPath = Join-Path $dataParent 'mysql-error.log'
$port = 3307

function New-LocalSecret([int]$byteCount) {
  $bytes = New-Object byte[] $byteCount
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Protect-LocalFile([string]$path) {
  $acl = Get-Acl $path
  $acl.SetAccessRuleProtection($true, $false)
  foreach ($rule in @($acl.Access)) {
    $acl.RemoveAccessRuleSpecific($rule)
  }
  $principals = @(
    [System.Security.Principal.WindowsIdentity]::GetCurrent().User,
    [System.Security.Principal.SecurityIdentifier]::new('S-1-5-18'),
    [System.Security.Principal.SecurityIdentifier]::new('S-1-5-32-544')
  )
  foreach ($principal in $principals) {
    $rule = [System.Security.AccessControl.FileSystemAccessRule]::new(
      $principal,
      [System.Security.AccessControl.FileSystemRights]::FullControl,
      [System.Security.AccessControl.AccessControlType]::Allow
    )
    $acl.AddAccessRule($rule)
  }
  Set-Acl -Path $path -AclObject $acl
}

function Test-DatabasePort {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $client.Connect('127.0.0.1', $port)
    return $true
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Invoke-MySql([string]$sql, [string]$username, [string]$password) {
  $previousPassword = $env:MYSQL_PWD
  try {
    if ($password) { $env:MYSQL_PWD = $password } else { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
    $sql | & $clientPath --protocol=TCP --host=127.0.0.1 --port=$port --user=$username --batch
    if ($LASTEXITCODE -ne 0) {
      throw "MySQL command failed with exit code $LASTEXITCODE."
    }
  } finally {
    if ($null -eq $previousPassword) { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
    else { $env:MYSQL_PWD = $previousPassword }
  }
}

function Read-EnvValue([string]$key) {
  $line = Get-Content $envPath | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
  if (-not $line) { throw "Missing $key in backend\.env." }
  return $line.Substring($key.Length + 1)
}

function Test-RootPassword([string]$password) {
  $previousPassword = $env:MYSQL_PWD
  try {
    if ($password) { $env:MYSQL_PWD = $password } else { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
    $null = & $clientPath --protocol=TCP --host=127.0.0.1 --port=$port --user=root --connect-timeout=3 --execute='SELECT 1' 2>$null
    return $LASTEXITCODE -eq 0
  } finally {
    if ($null -eq $previousPassword) { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
    else { $env:MYSQL_PWD = $previousPassword }
  }
}

if (-not (Test-Path $serverPath) -or -not (Test-Path $clientPath)) {
  throw "MySQL Server 8.4 was not found at $mysqlHome. Install MySQL Server 8.4 first."
}
if (Test-DatabasePort) {
  throw "Port $port is already in use. Stop that service or configure it manually in backend\.env before setup."
}

New-Item -ItemType Directory -Force -Path $dataParent | Out-Null
if (-not (Test-Path $envPath) -and -not (Test-Path $dataPath)) {
  $databasePassword = New-LocalSecret 32
  $rootPassword = New-LocalSecret 32
  $adminPassword = New-LocalSecret 24
  $jwtSecret = New-LocalSecret 48
  @"
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=$port
DB_USER=gs_accounting_app
DB_PASSWORD=$databasePassword
DB_NAME=gs_busanza_accounting
FRONTEND_ORIGIN=http://localhost:5173
ADMIN_USERNAME=accountant
ADMIN_PASSWORD=$adminPassword
ADMIN_DISPLAY_NAME=Aline Mukamana
JWT_SECRET=$jwtSecret
"@ | Set-Content -Path $envPath -Encoding ascii
  $rootPassword | Set-Content -Path $rootPasswordPath -Encoding ascii
Protect-LocalFile $envPath
Protect-LocalFile $rootPasswordPath
  & $serverPath "--basedir=`"$mysqlHome`"" "--datadir=`"$dataPath`"" --initialize-insecure --console
  if ($LASTEXITCODE -ne 0) {
    throw "MySQL data initialization failed with exit code $LASTEXITCODE."
  }
} elseif (-not (Test-Path $envPath) -or -not (Test-Path $dataPath) -or -not (Test-Path $rootPasswordPath)) {
  throw "Database setup is partially initialized. Inspect $dataPath, backend\.env, and $rootPasswordPath before continuing; no files were overwritten."
} else {
  $databasePassword = Read-EnvValue 'DB_PASSWORD'
  $rootPassword = (Get-Content $rootPasswordPath -Raw).Trim()
}

try {
  & (Join-Path $backendPath 'start_database.ps1')

  if (Test-RootPassword '') {
    Invoke-MySql "ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';" 'root' ''
  } elseif (-not (Test-RootPassword $rootPassword)) {
    throw 'Unable to authenticate to the local MySQL administrator account. Check the saved local root password before retrying.'
  }

  $env:MYSQL_PWD = $rootPassword
  try {
    $schema = Get-Content (Join-Path $backendPath 'schema.sql') -Raw
    $schema | & $clientPath --protocol=TCP --host=127.0.0.1 --port=$port --user=root --batch
    if ($LASTEXITCODE -ne 0) {
      throw "Database schema setup failed with exit code $LASTEXITCODE."
    }
  } finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
  }

  Invoke-MySql @"
CREATE USER IF NOT EXISTS 'gs_accounting_app'@'127.0.0.1' IDENTIFIED BY '$databasePassword';
ALTER USER 'gs_accounting_app'@'127.0.0.1' IDENTIFIED BY '$databasePassword';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, LOCK TABLES, SHOW VIEW, TRIGGER, EVENT ON gs_busanza_accounting.* TO 'gs_accounting_app'@'127.0.0.1';
FLUSH PRIVILEGES;
"@ 'root' $rootPassword

  Write-Output 'MySQL database initialized and connected to the accounting application.'
  Write-Output "Database: gs_busanza_accounting on 127.0.0.1:$port"
  Write-Output 'Generated accountant sign-in credentials and database secrets are saved in backend\.env. That file is private and excluded from Git.'
  Write-Output "MySQL administrator password is saved locally at $rootPasswordPath."
} catch {
  Write-Error "Database setup did not complete: $($_.Exception.Message)"
  Write-Error "The generated local configuration is retained for diagnosis. Inspect $logPath before retrying."
  exit 1
}
