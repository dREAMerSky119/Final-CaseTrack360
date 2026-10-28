@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (
  echo Backend virtual environment not found. Run run.bat once first.
  pause
  exit /b 1
)
echo WARNING: This permanently replaces all current demo complaints and institutions in this project's SQLite database.
set /p CONFIRM=Type RESET to continue: 
if /I not "%CONFIRM%"=="RESET" (
  echo Cancelled. No data was changed.
  pause
  exit /b 0
)
pushd backend
.venv\Scripts\flask.exe --app app reset-demo-data --yes
set RESET_RESULT=%ERRORLEVEL%
popd
if not "%RESET_RESULT%"=="0" goto failed
echo Demo dataset reset complete.
pause
exit /b 0

:failed
echo Reset failed. Check the error above.
pause
exit /b 1
