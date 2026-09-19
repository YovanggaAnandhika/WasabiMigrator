@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Wasabi Migrator - Multi-Arch Build
echo ============================================

:: Output folder
set DIST=dist
if not exist %DIST% mkdir %DIST%

:: Get version from tauri.conf.json (simple grep)
for /f "tokens=2 delims=:," %%a in ('findstr /i "version" src-tauri\tauri.conf.json') do (
    set RAW_VER=%%a
    goto :got_ver
)
:got_ver
set VERSION=%RAW_VER: =%
set VERSION=%VERSION:"=%

echo Version: %VERSION%
echo.

:: ─────────────────────────────────────────────
:: 1. Build ARM64 (native)
:: ─────────────────────────────────────────────
echo [1/2] Building ARM64...
rustup target add aarch64-pc-windows-msvc >nul 2>&1
call bun tauri build --target aarch64-pc-windows-msvc
if errorlevel 1 (
    echo ERROR: ARM64 build failed!
    exit /b 1
)

:: Copy ARM64 output to dist/
set ARM64_SRC=src-tauri\target\aarch64-pc-windows-msvc\release\bundle
for %%f in (%ARM64_SRC%\nsis\*.exe) do (
    echo Copying: %%~nxf -^> wasabi-migrator_%VERSION%_arm64-setup.exe
    copy "%%f" "%DIST%\wasabi-migrator_%VERSION%_arm64-setup.exe" >nul
)
for %%f in (%ARM64_SRC%\msi\*.msi) do (
    echo Copying: %%~nxf -^> wasabi-migrator_%VERSION%_arm64.msi
    copy "%%f" "%DIST%\wasabi-migrator_%VERSION%_arm64.msi" >nul
)

echo ARM64 done.
echo.

:: ─────────────────────────────────────────────
:: 2. Build x64 (cross-compile)
:: ─────────────────────────────────────────────
echo [2/2] Building x64...
rustup target add x86_64-pc-windows-msvc >nul 2>&1
call bun tauri build --target x86_64-pc-windows-msvc
if errorlevel 1 (
    echo ERROR: x64 build failed!
    exit /b 1
)

:: Copy x64 output to dist/
set X64_SRC=src-tauri\target\x86_64-pc-windows-msvc\release\bundle
for %%f in (%X64_SRC%\nsis\*.exe) do (
    echo Copying: %%~nxf -^> wasabi-migrator_%VERSION%_x64-setup.exe
    copy "%%f" "%DIST%\wasabi-migrator_%VERSION%_x64-setup.exe" >nul
)
for %%f in (%X64_SRC%\msi\*.msi) do (
    echo Copying: %%~nxf -^> wasabi-migrator_%VERSION%_x64.msi
    copy "%%f" "%DIST%\wasabi-migrator_%VERSION%_x64.msi" >nul
)

echo x64 done.
echo.

:: ─────────────────────────────────────────────
:: Summary
:: ─────────────────────────────────────────────
echo ============================================
echo   Build Complete! Output in .\dist\
echo ============================================
dir /b %DIST%

endlocal
