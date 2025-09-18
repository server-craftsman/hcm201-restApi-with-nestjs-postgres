#!/bin/bash

# SmartChat Environment Switch Script
# Usage: ./scripts/switch-env.sh [dev|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to switch to development
switch_to_dev() {
    print_status "Switching to development environment..."
    
    if [ -f .env.production ]; then
        cp .env.production .env.production.backup
        print_success "Backed up production environment"
    fi
    
    if [ -f .env ]; then
        cp .env .env.backup
        print_success "Backed up current environment"
    fi
    
    # Copy development environment
    cp .env.example .env
    
    # Update development-specific values
    sed -i 's/APP_DEBUG=false/APP_DEBUG=true/' .env
    sed -i 's/LOG_LEVEL=info/LOG_LEVEL=debug/' .env
    sed -i 's/CACHE_TTL=300/CACHE_TTL=300/' .env
    sed -i 's/RATE_LIMIT_MAX=100/RATE_LIMIT_MAX=100/' .env
    
    print_success "Switched to development environment"
    print_status "Current environment: Development"
    print_status "Debug mode: Enabled"
    print_status "Log level: Debug"
}

# Function to switch to production
switch_to_prod() {
    print_status "Switching to production environment..."
    
    if [ -f .env.production ]; then
        cp .env.production .env
        print_success "Switched to production environment"
    else
        print_error "Production environment file (.env.production) not found!"
        print_status "Please configure .env.production first"
        exit 1
    fi
    
    print_success "Switched to production environment"
    print_status "Current environment: Production"
    print_status "Debug mode: Disabled"
    print_status "Log level: Info"
}

# Function to show current environment
show_current_env() {
    if [ -f .env ]; then
        NODE_ENV=$(grep "^NODE_ENV=" .env | cut -d'=' -f2)
        APP_DEBUG=$(grep "^APP_DEBUG=" .env | cut -d'=' -f2)
        LOG_LEVEL=$(grep "^LOG_LEVEL=" .env | cut -d'=' -f2)
        
        echo "=========================================="
        echo "🌟 Current Environment Status"
        echo "=========================================="
        echo "Environment: $NODE_ENV"
        echo "Debug Mode: $APP_DEBUG"
        echo "Log Level: $LOG_LEVEL"
        echo "=========================================="
    else
        print_error "No .env file found!"
    fi
}

# Function to validate environment
validate_env() {
    print_status "Validating environment configuration..."
    
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    # Check required variables
    required_vars=(
        "DATABASE_URL"
        "AUTH_JWT_SECRET"
        "REDIS_HOST"
        "MAIL_HOST"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "Environment validation passed"
    else
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "SmartChat Environment Switch Script"
    echo ""
    echo "Usage: $0 [dev|prod|status|validate]"
    echo ""
    echo "Commands:"
    echo "  dev       Switch to development environment"
    echo "  prod      Switch to production environment"
    echo "  status    Show current environment status"
    echo "  validate  Validate environment configuration"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev     # Switch to development"
    echo "  $0 prod    # Switch to production"
    echo "  $0 status  # Show current status"
}

# Main script logic
case "${1:-help}" in
    "dev"|"development")
        switch_to_dev
        ;;
    "prod"|"production")
        switch_to_prod
        ;;
    "status")
        show_current_env
        ;;
    "validate")
        validate_env
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Invalid command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 