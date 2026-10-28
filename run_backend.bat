@echo off
cd /d "%~dp0backend"
if not exist ".env" (
  echo MySQL database is not configured. Run setup_database.bat once first.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0backend\start_database.ps1"
if errorlevel 1 (
  echo Could not start the local MySQL database.
  pause
  exit /b 1
)
npm run dev
