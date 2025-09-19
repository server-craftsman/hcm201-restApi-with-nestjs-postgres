@echo off
echo 🗄️ Resetting Database...
echo.

echo 📦 Stopping Docker containers...
docker-compose -f docker-compose.dev.yml down -v

echo.
echo 🚀 Starting fresh containers...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo.
echo 🌱 Seeding database...
npx prisma db seed

echo.
echo ✅ Database reset completed!
echo.
echo 📊 Services running:
echo - API: http://localhost:51213
echo - Swagger: http://localhost:51213/swagger-ui
echo - pgAdmin: http://localhost:5050
echo - Redis Commander: http://localhost:8081
echo.
pause
