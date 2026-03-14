#!/bin/bash

# Environment Switch Script for AGORA
# Usage: ./switch-env.sh [dev|prod]

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 [dev|prod]"
    echo "  dev  - Switch to development environment"
    echo "  prod - Switch to production environment"
    exit 1
fi

case $ENVIRONMENT in
    "dev")
        echo "Switching to DEVELOPMENT environment..."
        
        # Stop any running containers
        docker-compose -f compose.prod.yml down 2>/dev/null || true
        docker-compose -f compose.dev.yml down 2>/dev/null || true
        
        # Copy development environment file
        cp .env.dev .env
        
        echo "Environment switched to DEVELOPMENT"
        echo "Start with: docker-compose -f compose.dev.yml up --build"
        echo "Access at: http://localhost:5173"
        ;;
        
    "prod")
        echo "Switching to PRODUCTION environment..."
        
        # Stop any running containers
        docker-compose -f compose.dev.yml down 2>/dev/null || true
        docker-compose -f compose.prod.yml down 2>/dev/null || true
        
        # Copy production environment file
        cp .env.prod .env
        
        echo "Environment switched to PRODUCTION"
        echo "Start with: docker-compose -f compose.prod.yml up --build -d"
        echo "Access at: https://agorachain.es"
        ;;
        
    *)
        echo "Invalid environment: $ENVIRONMENT"
        echo "Use 'dev' or 'prod'"
        exit 1
        ;;
esac

echo "Current environment: $ENVIRONMENT"
echo "To check configuration: docker-compose config"
