@echo on
cls
echo ==========================================
echo Building Project Manager Executable
echo ==========================================
echo.
echo Current directory: %CD%
echo.
pause

cd /d "%~dp0"

echo.
echo ==========================================
echo [1/5] Installing frontend dependencies...
echo ==========================================
call npm install
if errorlevel 1 (
    echo.
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: npm install failed
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    pause
    exit /b 1
)
echo [1/5] SUCCESS - Dependencies installed
pause

echo.
echo ==========================================
echo [2/5] Building production frontend...
echo ==========================================
call npm run build
if errorlevel 1 (
    echo.
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: frontend build failed
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    pause
    exit /b 1
)
echo [2/5] SUCCESS - Frontend built
pause

echo.
echo ==========================================
echo [3/5] Installing cargo-tauri (one-time)...
echo ==========================================
cargo install tauri-cli
if errorlevel 1 (
    echo.
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: cargo-tauri install failed
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    pause
    exit /b 1
)
echo [3/5] SUCCESS - Cargo tauri installed
pause

echo.
echo ==========================================
echo [4/5] Cleaning old build artifacts...
echo ==========================================
if exist src-tauri\target (
    echo Removing old build directory...
    rmdir /s /q src-tauri\target
    echo Old build cleaned
)
pause

echo.
echo ==========================================
echo [5/5] Building Windows executable...
echo ==========================================
echo This may take 2-5 minutes...
echo.
cd src-tauri
cargo clean
if errorlevel 1 (
    echo.
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: cargo clean failed
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    pause
    exit /b 1
)
cd ..
cargo tauri build
if errorlevel 1 (
    echo.
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: Tauri build failed
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    pause
    exit /b 1
)

echo.
echo.
echo ==========================================
echo BUILD COMPLETE!
echo ==========================================
echo.
echo Your executable is located at:
echo   src-tauri\target\release\project-manager.exe
echo.
echo You can now:
echo   1. Run the EXE locally to test
echo   2. Copy it to any Windows PC
echo.
echo No dependencies needed on target machine!
echo.
pause
