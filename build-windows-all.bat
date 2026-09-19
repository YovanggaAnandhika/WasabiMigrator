@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Wasabi Migrator - Multi-Arch Build
echo ============================================

:: Detect CARGO_TARGET_DIR (custom) or default
if defined CARGO_TARGET_DIR (
    set TARGET_BASE=%CARGO_TARGET_DIR%
) else (
    set TARGET_BASE=src-tauri\target
)
echo Target dir: %TARGET_BASE%

:: Output folder
set DIST=dist
if not exist %DIST% mkdir %DIST%

:: Get version from tauri.conf.json
for /f "tokens=2 delims=:," %%a in ('findstr /i "\"version\"" src-tauri\tauri.conf.json') do (
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

set ARM64_BUNDLE=%TARGET_BASE%\aarch64-pc-windows-msvc\release\bundle
echo Collecting ARM64 from: %ARM64_BUNDLE%

for %%f in ("%ARM64_BUNDLE%\nsis\*.exe") do (
    echo   %%~nxf -^> wasabi-migrator_%VERSION%_arm64-setup.exe
    copy "%%f" "%DIST%\wasabi-migrator_%VERSION%_arm64-setup.exe" >nul
)
for %%f in ("%ARM64_BUNDLE%\msi\*.msi") do (
    echo   %%~nxf -^> wasabi-migrator_%VERSION%_arm64.msi
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

set X64_BUNDLE=%TARGET_BASE%\x86_64-pc-windows-msvc\release\bundle
echo Collecting x64 from: %X64_BUNDLE%

for %%f in ("%X64_BUNDLE%\nsis\*.exe") do (
    echo   %%~nxf -^> wasabi-migrator_%VERSION%_x64-setup.exe
    copy "%%f" "%DIST%\wasabi-migrator_%VERSION%_x64-setup.exe" >nul
)
for %%f in ("%X64_BUNDLE%\msi\*.msi") do (
    echo   %%~nxf -^> wasabi-migrator_%VERSION%_x64.msi
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
dir /b "%DIST%"

endlocal
