@echo off
echo ==========================================
echo 🗄️ SmartChat Database Setup
echo ==========================================

echo 📋 Setting up database for SmartChat API...
echo.

echo 1. Checking if containers are running...
docker-compose ps

echo.
echo 2. Generating Prisma client...
docker-compose exec api pnpm prisma generate

echo.
echo 3. Pushing database schema...
docker-compose exec api pnpm prisma db push

echo.
echo 4. Checking database status...
docker-compose exec api pnpm prisma db status

echo.
echo 5. Showing database tables...
docker-compose exec postgres psql -U postgres -d smartchat_db -c "\dt"

echo.
echo ==========================================
echo ✅ Database setup completed!
echo ==========================================
echo.
echo 🌐 Now you can test the API:
echo   - Register: POST http://localhost:51213/api/v1/auth/email/register
echo   - Login: POST http://localhost:51213/api/v1/auth/email/login
echo   - Users: GET http://localhost:51213/api/v1/users
echo. 