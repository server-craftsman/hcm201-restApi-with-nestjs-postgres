@echo off
chcp 65001 >nul
cls

REM SmartChat Docker Setup Script

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo 📥 Download from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Check if Docker Compose is available (try both docker-compose and docker compose)
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available. Please install Docker Compose first.
        echo 📥 Download from: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    ) else (
        set DOCKER_COMPOSE_CMD=docker compose
        echo ✅ Docker and Docker Compose (v2) are installed
    )
) else (
    set DOCKER_COMPOSE_CMD=docker-compose
    echo ✅ Docker and Docker Compose (v1) are installed
)

REM Check if Docker daemon is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker daemon is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker daemon is running

REM Stop any running containers
echo 🛑 Stopping existing containers...
%DOCKER_COMPOSE_CMD% down

REM Remove old volumes (optional)
set /p CLEAN_VOLUMES="Do you want to clean old volumes? (y/N): "
if /i "%CLEAN_VOLUMES%"=="y" (
    echo 🧹 Cleaning old volumes...
    %DOCKER_COMPOSE_CMD% down -v
    echo 🧹 Pruning unused Docker volumes...
    docker volume prune -f
)

REM Clean Docker build cache to ensure fresh build with scripts
echo 🧹 Cleaning Docker build cache...
docker builder prune -f

REM Ensure scripts have correct permissions
echo 🔧 Setting up script permissions...

REM Build and start development environment
echo 🏗️ Building and starting development environment...
%DOCKER_COMPOSE_CMD% up -d --build --force-recreate

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 45 /nobreak >nul

REM Check if services are running
echo 📊 Checking service status...
%DOCKER_COMPOSE_CMD% ps

REM Show logs to verify logo is displayed
echo 📋 Checking container logs for logo display...
%DOCKER_COMPOSE_CMD% logs api | findstr "SmartChat\|███\|🚀"

REM Wait a bit more for database to be fully ready
echo ⏳ Waiting for database to be fully ready...
timeout /t 15 /nobreak >nul

REM Run database migrations with error handling
echo 🗄️ Running database migrations...
echo 📦 Generating Prisma client...
%DOCKER_COMPOSE_CMD% exec api pnpm prisma generate
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Prisma generate failed. Retrying in 10 seconds...
    timeout /t 10 /nobreak >nul
    %DOCKER_COMPOSE_CMD% exec api pnpm prisma generate
)

echo 🗄️ Pushing database schema...
%DOCKER_COMPOSE_CMD% exec api pnpm prisma db push
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Database push failed. Retrying in 10 seconds...
    timeout /t 10 /nobreak >nul
    %DOCKER_COMPOSE_CMD% exec api pnpm prisma db push
)

echo ==========================================
echo ✅ Docker setup completed successfully!
echo ==========================================
echo.
echo 🌐 API Server: http://localhost:51213
echo 📚 API Documentation: http://localhost:51213/ambatukam
echo 🗄️ PostgreSQL: localhost:5432
echo 🔴 Redis: localhost:6379
echo 📊 pgAdmin: http://localhost:8080 (admin@smartchat.com / admin123)
echo 🔍 Redis Commander: http://localhost:8081
echo.
echo 📋 Useful commands:
echo   %DOCKER_COMPOSE_CMD% logs -f api        # View API logs
echo   %DOCKER_COMPOSE_CMD% logs -f postgres   # View database logs
echo   %DOCKER_COMPOSE_CMD% logs -f redis      # View Redis logs
echo   %DOCKER_COMPOSE_CMD% down               # Stop all services
echo   %DOCKER_COMPOSE_CMD% restart api        # Restart API only
echo   %DOCKER_COMPOSE_CMD% exec api sh        # Access API container shell
echo.
echo 🚀 To start production environment:
echo   %DOCKER_COMPOSE_CMD% -f docker-compose.prod.yml up -d --build
echo.
echo 🔍 If you encounter issues, check logs with:
echo   %DOCKER_COMPOSE_CMD% logs api
echo.
pause 