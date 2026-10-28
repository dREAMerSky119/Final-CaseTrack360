@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title CaseTrack 360 Launcher

echo ==========================================
echo       CaseTrack 360 - Local Launcher
echo ==========================================
echo.

where py >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python launcher 'py' was not found.
  echo Install Python 3.10 or newer, enable the Python launcher, then try again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found.
  echo Install Node.js 18 or newer, then close and reopen this launcher.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo Created project-root .env from .env.example.
  ) else (
    echo WARNING: .env.example is missing. AI configuration may need to be added manually.
  )
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -3 -m venv backend\.venv
  if errorlevel 1 (
    echo ERROR: Could not create backend virtual environment.
    goto failed
  )
)

echo Checking backend dependencies...
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 (
  echo ERROR: Backend dependencies could not be installed.
  goto failed
)

if not exist "package.json" (
  echo ERROR: package.json is missing from %CD%.
  goto failed
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Frontend dependencies are missing or incomplete. Installing from package-lock.json...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed. Check the network and the npm error above.
    goto failed
  )
)

if not exist "node_modules\.bin\vite.cmd" (
  echo ERROR: Vite is still missing after npm install.
  echo Run "npm install" in this folder and review the output.
  goto failed
)

echo.
echo Starting Flask backend and Vite frontend...
start "CaseTrack 360 Backend" /D "%~dp0backend" cmd.exe /k ".venv\Scripts\python.exe app.py"
start "CaseTrack 360 Frontend" /D "%~dp0" cmd.exe /k "npm run dev"

echo.
echo Backend health: http://127.0.0.1:5000/api/health
echo Frontend:       http://localhost:5173
echo Keep both terminal windows open while using CaseTrack 360.
echo.
exit /b 0

:failed
echo.
echo Startup stopped because a required step failed.
pause
exit /b 1
