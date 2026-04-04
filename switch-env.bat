@echo off
REM Environment Switch Script for AGORA (Windows)
REM Usage: switch-env.bat [dev|prod]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1

if "%ENVIRONMENT%"=="" (
    echo Usage: %0 [dev^|prod]
    echo   dev  - Switch to development environment
    echo   prod - Switch to production environment
    exit /b 1
)

if "%ENVIRONMENT%"=="dev" (
    echo Switching to DEVELOPMENT environment...
    
    REM Stop any running containers
    docker compose -f compose.prod.yml down >nul 2>&1
    docker compose -f compose.dev.yml down >nul 2>&1
    
    REM Copy development environment file
    copy .env.dev .env >nul
    
    echo Environment switched to DEVELOPMENT
    echo Start with: docker compose -f compose.dev.yml up --build
    echo Access at: http://localhost:5173
    goto :end
)

if "%ENVIRONMENT%"=="prod" (
    echo Switching to PRODUCTION environment...
    
    REM Stop any running containers
    docker compose -f compose.dev.yml down >nul 2>&1
    docker compose -f compose.prod.yml down >nul 2>&1
    
    REM Copy production environment file
    copy .env.prod .env >nul
    
    echo Environment switched to PRODUCTION
    echo Start with: docker compose -f compose.prod.yml up --build -d
    echo Access at: https://agorachain.es
    goto :end
)

echo Invalid environment: %ENVIRONMENT%
echo Use 'dev' or 'prod'
exit /b 1

:end
echo Current environment: %ENVIRONMENT%
echo To check configuration: docker compose config
