$ErrorActionPreference = 'Stop'

$mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.4'
$serverPath = Join-Path $mysqlHome 'bin\mysqld.exe'
$dataPath = Join-Path $env:LOCALAPPDATA 'GSBusanzaAccounting\mysql-data'
$logPath = Join-Path (Split-Path $dataPath -Parent) 'mysql-error.log'
$port = 3307

if (-not (Test-Path $serverPath)) {
  throw "MySQL Server 8.4 was not found at $serverPath. Install MySQL or configure an existing MySQL server in backend\.env."
}
if (-not (Test-Path (Join-Path $dataPath 'auto.cnf'))) {
  throw 'The local MySQL data directory is not initialized. Run setup_database.bat once first.'
}

$connection = [System.Net.Sockets.TcpClient]::new()
try {
  $connection.Connect('127.0.0.1', $port)
  $connection.Close()
  exit 0
} catch {
  $connection.Dispose()
}

$dataParent = Split-Path $dataPath -Parent
New-Item -ItemType Directory -Force -Path $dataParent | Out-Null
$arguments = "--basedir=`"$mysqlHome`" --datadir=`"$dataPath`" --port=$port --bind-address=127.0.0.1 --mysqlx=0 --log-error=`"$logPath`""
Start-Process -FilePath $serverPath -ArgumentList $arguments -WindowStyle Hidden | Out-Null

for ($attempt = 0; $attempt -lt 30; $attempt++) {
  Start-Sleep -Seconds 1
  $connection = [System.Net.Sockets.TcpClient]::new()
  try {
    $connection.Connect('127.0.0.1', $port)
    $connection.Close()
    exit 0
  } catch {
    $connection.Dispose()
  }
}

$logTail = if (Test-Path $logPath) { Get-Content $logPath -Tail 30 | Out-String } else { 'No MySQL error log was created.' }
throw "MySQL did not start listening on 127.0.0.1:$port. $logTail"
