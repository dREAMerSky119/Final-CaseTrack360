@echo off
setlocal
cd /d "%~dp0backend"
echo ==========================================
echo   CaseTrack 360 - Administrator Setup
echo ==========================================
echo.
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -m flask --app app create-admin
) else (
  echo Backend virtual environment not found.
  echo Please run the main run.bat once first so dependencies are installed.
  pause
  exit /b 1
)
echo.
if errorlevel 1 (
  echo Administrator setup did not complete. Review the message above.
) else (
  echo Administrator account configured. Use the same email and password to sign in.
)
pause
