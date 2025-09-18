@echo off
chcp 65001 >nul
cls

echo.
call scripts\show-logo.bat
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ pnpm is not installed. Installing pnpm...
    npm install -g pnpm
)

echo ✅ Docker and pnpm are installed

REM Start Docker services
echo 📦 Starting Docker services (PostgreSQL, Redis)...
docker-compose up -d postgres redis

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ Docker services are running
) else (
    echo ❌ Failed to start Docker services
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Setup environment
echo 🔧 Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file from .env.example
) else (
    echo ⚠️ .env file already exists
)

REM Run database migrations
echo 🗄️ Running database migrations...
pnpm prisma generate
pnpm prisma db push

REM Build the application
echo 🔨 Building the application...
pnpm run build

echo ==========================================
echo ✅ Setup completed successfully!
echo ==========================================
echo.
echo 🌐 API Documentation: http://localhost:51213/ambatukam
echo 🗄️ PostgreSQL: localhost:5432
echo 🔴 Redis: localhost:6379
echo 📊 pgAdmin: http://localhost:8080 (admin@smartchat.com / admin123)
echo 🔍 Redis Commander: http://localhost:8081
echo.
echo To start the application:
echo   pnpm run start:dev
echo.
echo To stop Docker services:
echo   docker-compose down
echo. 