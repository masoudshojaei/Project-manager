@echo off
cd /d "%~dp0"
echo Checking TypeScript syntax...
call npx tsc --noEmit
if errorlevel 1 (
  echo.
  echo TYPESCRIPT ERRORS FOUND
  echo.
  pause
  exit /b 1
)
echo.
echo SUCCESS - No TypeScript errors!
echo.
pause
