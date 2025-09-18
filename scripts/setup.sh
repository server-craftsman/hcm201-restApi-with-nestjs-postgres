#!/bin/bash

# SmartChat API Setup Script
# This script sets up the development environment

clear

call scripts/show-logo.bat

set -e

echo "🚀 Starting SmartChat API Setup..."

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi

    print_success "Node.js and pnpm are installed"
}

# Start Docker services
start_services() {
    print_status "Starting Docker services (PostgreSQL, Redis)..."
    
    docker-compose up -d postgres redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker services are running"
    else
        print_error "Failed to start Docker services"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Setup environment
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_warning ".env file already exists"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Generate Prisma client
    pnpm prisma generate
    
    # Push schema to database
    pnpm prisma db push
    
    print_success "Database migrations completed"
}

# Build the application
build_app() {
    print_status "Building the application..."
    pnpm run build
    print_success "Application built successfully"
}

# Start the application
start_app() {
    print_status "Starting the application..."
    pnpm run start:dev
}

# Main setup function
main() {
    echo "=========================================="
    echo "🌟 SmartChat API Setup"
    echo "=========================================="
    
    check_docker
    check_node
    setup_env
    start_services
    install_dependencies
    run_migrations
    build_app
    
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "🌐 API Documentation: http://localhost:51213/ambatukam"
    echo "🗄️  PostgreSQL: localhost:5432"
    echo "🔴 Redis: localhost:6379"
    echo "📊 pgAdmin: http://localhost:8080 (admin@smartchat.com / admin123)"
    echo "🔍 Redis Commander: http://localhost:8081"
    echo ""
    echo "To start the application:"
    echo "  pnpm run start:dev"
    echo ""
    echo "To stop Docker services:"
    echo "  docker-compose down"
    echo ""
}

# Run main function
main "$@" 