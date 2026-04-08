# Environment Switch Script for AGORA (PowerShell)
# Usage: .\switch-env.ps1 [dev|prod]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

Write-Host "Switching to $ENVIRONMENT environment..." -ForegroundColor Green

# Stop any running containers
Write-Host "Stopping running containers..." -ForegroundColor Yellow
docker compose -f compose.prod.yml down 2>$null
docker compose -f compose.dev.yml down 2>$null

if ($Environment -eq "dev") {
    Write-Host "Setting up DEVELOPMENT environment..." -ForegroundColor Blue
    
    # Copy development environment file
    Copy-Item ".env.dev" ".env" -Force
    
    Write-Host "Environment switched to DEVELOPMENT" -ForegroundColor Green
    Write-Host "Start with: docker compose -f compose.dev.yml up --build" -ForegroundColor Cyan
    Write-Host "Access at: http://localhost:5173" -ForegroundColor Cyan
}
elseif ($Environment -eq "prod") {
    Write-Host "Setting up PRODUCTION environment..." -ForegroundColor Blue
    
    # Copy production environment file
    Copy-Item ".env.prod" ".env" -Force
    
    Write-Host "Environment switched to PRODUCTION" -ForegroundColor Green
    Write-Host "Start with: docker compose -f compose.prod.yml up --build -d" -ForegroundColor Cyan
    Write-Host "Access at: https://agorachain.es" -ForegroundColor Cyan
}

Write-Host "Current environment: $Environment" -ForegroundColor Magenta
Write-Host "To check configuration: docker compose config" -ForegroundColor Yellow
