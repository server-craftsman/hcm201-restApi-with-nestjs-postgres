@echo off
echo 🗄️ Complete Database Reset...
echo.

echo 📦 Stopping all containers...
docker-compose -f docker-compose.dev.yml down -v

echo.
echo 🧹 Cleaning Docker system...
docker system prune -f

echo.
echo 🗑️ Removing old migration files...
if exist "prisma\migrations" rmdir /s /q "prisma\migrations"

echo.
echo 🚀 Starting fresh database...
docker-compose -f docker-compose.dev.yml up -d postgres

echo.
echo ⏳ Waiting for database to be ready...
timeout /t 15 /nobreak > nul

echo.
echo 📋 Creating fresh migration...
npx prisma db push --accept-data-loss

echo.
echo 🌱 Seeding database...
npx prisma db seed

echo.
echo 🚀 Starting all services...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo ✅ Complete reset finished!
echo.
echo 📊 Services running:
echo - API: http://localhost:51213
echo - Swagger: http://localhost:51213/swagger-ui
echo - pgAdmin: http://localhost:5050
echo - Redis Commander: http://localhost:8081
echo.
pause
