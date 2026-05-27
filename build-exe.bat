@echo off
echo ==========================================
echo Building Project Manager Executable
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/5] Building production frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: frontend build failed
    pause
    exit /b 1
)

echo.
echo [3/5] Installing cargo-tauri (one-time)...
cargo install tauri-cli
if errorlevel 1 (
    echo ERROR: cargo-tauri install failed
    pause
    exit /b 1
)

echo.
echo [4/5] Building Windows executable...
cargo tauri build
if errorlevel 1 (
    echo ERROR: Tauri build failed
    pause
    exit /b 1
)

echo.
echo ==========================================
echo BUILD COMPLETE!
echo ==========================================
echo.
echo Your executable is located at:
echo   src-tauri\target\release\Project Manager.exe
echo.
echo Copy this single .exe to any Windows PC.
echo No other software needed on the target machine.
echo.
pause
