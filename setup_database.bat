@echo off
cd /d "%~dp0backend"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0backend\setup_database.ps1"
if errorlevel 1 (
  echo Database setup failed. Read the error above and the MySQL log under %LOCALAPPDATA%\GSBusanzaAccounting.
  pause
  exit /b 1
)
echo Database ready. Run run_backend.bat and run_frontend_dev.bat in separate windows.
pause
