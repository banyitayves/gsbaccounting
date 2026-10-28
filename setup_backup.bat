@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0backend\setup_backup_tasks.ps1"
if errorlevel 1 (
  echo Backup schedule setup failed. Read the error above.
  pause
  exit /b 1
)
echo Backup schedule is configured.
pause
