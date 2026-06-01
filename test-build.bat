@echo on
cd /d "%~dp0"
echo Running TypeScript check and Vite build...
echo.
call npm run build
echo.
if errorlevel 1 (
  echo.
  echo BUILD FAILED
  echo.
  pause
  exit /b 1
) else (
  echo.
  echo BUILD SUCCESSFUL
  echo.
  pause
)
