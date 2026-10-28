@echo off
cd /d "%~dp0backend"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0backend\backup_database.ps1"
if errorlevel 1 (
  echo Backup failed. Check %LOCALAPPDATA%\GSBusanzaAccounting\backup.log.
  pause
  exit /b 1
)
pause
