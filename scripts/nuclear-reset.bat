@echo off
echo 🚀 NUCLEAR RESET - Xóa hoàn toàn tất cả...
echo.

echo 📦 Stopping all containers...
docker stop $(docker ps -aq) 2>nul
docker rm $(docker ps -aq) 2>nul

echo.
echo 🗑️ Removing all volumes...
docker volume rm $(docker volume ls -q) 2>nul

echo.
echo 🌐 Removing all networks...
docker network rm $(docker network ls -q) 2>nul

echo.
echo 🖼️ Removing all images...
docker rmi $(docker images -q) -f 2>nul

echo.
echo 🧹 Cleaning build cache...
docker builder prune -a -f

echo.
echo 🗂️ Removing local files...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "dist" rmdir /s /q "dist"
if exist "prisma\migrations" rmdir /s /q "prisma\migrations"

echo.
echo ✅ NUCLEAR RESET COMPLETED!
echo.
echo 📊 Docker Status:
docker ps -a
echo.
docker images
echo.
docker volume ls
echo.
docker network ls
echo.
echo 🚀 Ready to start fresh!
echo.
pause
