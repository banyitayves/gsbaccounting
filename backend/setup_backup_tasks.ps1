$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path $PSScriptRoot -Parent
$backupScript = Join-Path $PSScriptRoot 'backup_database.ps1'
$envPath = Join-Path $PSScriptRoot '.env'
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

if (-not (Test-Path $envPath)) {
  throw 'Run setup_database.bat before setting up scheduled backups.'
}
if (-not (Test-Path $backupScript)) {
  throw "Backup script not found: $backupScript"
}

$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries
$taskPath = '\'
$tasks = @(
  @{ Name = 'Daily MySQL Backup'; Type = 'daily'; Trigger = New-ScheduledTaskTrigger -Daily -At '2:00 AM' },
  @{ Name = 'Weekly MySQL Backup'; Type = 'weekly'; Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '2:30 AM' }
)

foreach ($task in $tasks) {
  $action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -BackupType $($task.Type)" `
    -WorkingDirectory $projectRoot
  Register-ScheduledTask `
    -TaskName "GS Busanza Accounting - $($task.Name)" `
    -TaskPath $taskPath `
    -Description "Create a compressed, checksummed GS Busanza MySQL backup and apply retention." `
    -Action $action `
    -Trigger $task.Trigger `
    -Principal $principal `
    -Settings $settings `
    -Force | Out-Null
}

Write-Output "Registered daily (2:00 AM) and weekly (Sunday, 2:30 AM) backup tasks for $user."
Write-Output 'Tasks run when your Windows account is signed in; missed runs start when the task can run.'
