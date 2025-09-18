@echo off
echo ==========================================
echo 🔧 SmartChat Docker Fix (Windows)
echo ==========================================

echo 🛑 Stopping all containers...
docker-compose down

echo 🧹 Cleaning up volumes...
docker-compose down -v

echo 🗑️ Removing old containers...
docker container prune -f

echo 🗑️ Removing old images...
docker image prune -f

echo 🗑️ Removing old volumes...
docker volume prune -f

echo 🏗️ Rebuilding and starting services...
docker-compose up -d --build

echo ⏳ Waiting for services to be ready...
timeout /t 45 /nobreak >nul

echo 📊 Checking service status...
docker-compose ps

echo ==========================================
echo ✅ Docker fix completed!
echo ==========================================
echo.
echo If PostgreSQL is still unhealthy, try:
echo   1. Check logs: docker-compose logs postgres
echo   2. Restart only postgres: docker-compose restart postgres
echo   3. Manual fix: docker-compose exec postgres pg_isready -U postgres
echo. 