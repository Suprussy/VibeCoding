@echo off
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed.
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing packages...
    call npm install
)

echo Starting Quiz Game...
echo Close this window to stop the server.
echo.

node start-dev.js
if %errorlevel% neq 0 (
    echo.
    echo Error occurred.
    pause
)
