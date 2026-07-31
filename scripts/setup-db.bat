@echo off
title ZANECO DB Setup
setlocal enabledelayedexpansion

set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
if exist "%PG_BIN%" set "PATH=%PG_BIN%;%PATH%"

if "%DB_NAME%"=="" set "DB_NAME=zaneco_appointments"
if "%DB_USER%"=="" set "DB_USER=zaneco"
if "%DB_PASS%"=="" set "DB_PASS=secret"

echo Checking psql availability...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo psql is not found. Make sure PostgreSQL is installed and psql is in your PATH.
    echo Download from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo Creating role and database...

psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='%DB_USER%'" 2>nul | findstr /c:"1" >nul
if %errorlevel% equ 0 (
    echo Role '%DB_USER%' already exists
) else (
    psql -U postgres -c "CREATE ROLE %DB_USER% WITH LOGIN PASSWORD '%DB_PASS%';"
    if %errorlevel% neq 0 (
        echo Failed to create role '%DB_USER%'
        exit /b 1
    )
    echo Created role '%DB_USER%'
)

psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" 2>nul | findstr /c:"1" >nul
if %errorlevel% equ 0 (
    echo Database '%DB_NAME%' already exists
) else (
    psql -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"
    if %errorlevel% neq 0 (
        echo Failed to create database '%DB_NAME%'
        exit /b 1
    )
    echo Created database '%DB_NAME%'
)

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -U postgres -d "%DB_NAME%" -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" 2>nul

echo PostgreSQL setup complete.