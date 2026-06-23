@echo off
title ZANECO Appointments System

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js 18+ is required but not found.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

:: Enable corepack (built-in pnpm; npm install -g corepack for Node 25+)
corepack enable >nul 2>&1
if %errorlevel% neq 0 (
    echo corepack not bundled — installing via npm...
    call npm install -g corepack
    if %errorlevel% neq 0 (
        echo Failed to install corepack. Try: npm install -g pnpm
        pause
        exit /b 1
    )
    corepack enable
)

:: Install dependencies if needed
if not exist node_modules\.pnpm (
    echo Installing dependencies...
    call pnpm install
)

:: Seed database if empty
if not exist backend\data\zaneco.db (
    echo Seeding database...
    call pnpm run seed
)

echo Starting servers...

:: Start backend (new window)
start "ZANECO Backend" cmd /c "pnpm run dev:backend && pause"

:: Start frontend (new window)
start "ZANECO Frontend" cmd /c "pnpm run dev:frontend && pause"

:: Wait for servers to be ready
timeout /t 4 /nobreak >nul

:: Open browser
start http://localhost:3500

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3500
echo Admin:   http://localhost:3500/admin/login
echo.
echo Close the server windows to stop.
echo.
pause
