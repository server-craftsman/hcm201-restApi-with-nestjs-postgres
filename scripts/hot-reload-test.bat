@echo off
chcp 65001 >nul
cls

call scripts\show-logo.bat

echo.

echo 📝 Testing hot reload functionality...
echo.

echo 1. Restarting API container with new configuration...
docker-compose restart api

echo.
echo 2. Waiting for container to be ready...
timeout /t 10 /nobreak >nul

echo.
echo 3. Checking container status...
docker-compose ps api

echo.
echo 4. Viewing logs (press Ctrl+C to stop)...
echo.
echo 📋 Instructions:
echo   - Edit any file in src/ folder
echo   - Save the file
echo   - Watch the logs below for recompilation
echo   - Test the API endpoint
echo.
echo 🌐 Test URLs:
echo   - Swagger UI: http://localhost:51213/ambatukam
echo   - Health Check: http://localhost:51213/health
echo.

docker-compose logs -f api 