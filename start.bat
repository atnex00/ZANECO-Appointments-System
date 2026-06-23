@echo off
title ZANECO Appointments System
cd /d "%~dp0"

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js 18+ is required but not found.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

:: Check pnpm first; try corepack enable only if missing
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm not found — enabling corepack...
    corepack enable >nul 2>&1
    if %errorlevel% neq 0 (
        echo corepack enable failed ^(try running as Administrator once^)
        echo Or install pnpm manually: npm install -g pnpm
        pause
        exit /b 1
    )
)
echo pnpm is ready.

:: Install dependencies if needed
if not exist node_modules\.pnpm (
    echo Installing dependencies...
    call pnpm install
)

:: Generate Prisma client
echo Generating Prisma client...
cd /d "%~dp0backend"
call pnpm exec prisma generate
cd /d "%~dp0"

:: Apply schema & seed (warn if PostgreSQL unavailable)
echo Applying database schema...
cd /d "%~dp0backend"
call pnpm exec prisma db push --accept-data-loss
if %errorlevel% neq 0 echo Warning: DB schema sync failed (is PostgreSQL running?)
cd /d "%~dp0"

call pnpm run seed
if %errorlevel% neq 0 echo Warning: Seed failed (is PostgreSQL running?)

echo Starting servers...

:: Start backend (new window)
start "ZANECO Backend" cmd /c "pnpm run dev:backend & pause"

:: Start frontend (new window)
start "ZANECO Frontend" cmd /c "pnpm run dev:frontend & pause"

:: Wait for servers to be ready
timeout /t 4 /nobreak >nul

:: Open browser
start http://localhost:3500

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3500
echo Admin:   http://localhost:3500/admin/login
echo.
echo PostgreSQL must be running at DATABASE_URL (default: postgresql://zaneco:secret@localhost:5432/zaneco_appointments)
echo.
echo Close the server windows to stop.
echo.
pause
