@echo off
title Debate System Manager

:menu
cls
echo.
echo ========================================
echo    DEBATE SYSTEM MANAGER
echo ========================================
echo.
echo 1. Setup Database (First time)
echo 2. Start Development
echo 3. Start Production
echo 4. Stop All Services
echo 5. View Logs
echo 6. Database Management
echo 7. Clean Everything
echo 8. Exit
echo.
set /p choice="Choose an option (1-8): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto dev
if "%choice%"=="3" goto prod
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto db
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto exit
goto menu

:setup
echo.
echo Setting up database...
call scripts\setup-debate-db.bat
pause
goto menu

:dev
echo.
echo Starting development environment...
docker-compose -f docker-compose.dev.yml up -d
echo.
echo Development environment started!
echo API: http://localhost:51213
echo WebSocket: ws://localhost:51213/debate
echo pgAdmin: http://localhost:8080
echo Redis Commander: http://localhost:8081
pause
goto menu

:prod
echo.
echo Starting production environment...
echo Make sure you have set up .env.production file!
docker-compose -f docker-compose.prod.yml up -d
echo.
echo Production environment started!
pause
goto menu

:stop
echo.
echo Stopping all services...
docker-compose down
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down
echo.
echo All services stopped!
pause
goto menu

:logs
echo.
echo Viewing logs...
docker-compose logs -f
pause
goto menu

:db
echo.
echo Database Management:
echo 1. Open Prisma Studio
echo 2. Reset Database
echo 3. Seed Database
echo 4. Generate Prisma Client
echo 5. Back to Main Menu
echo.
set /p dbchoice="Choose an option (1-5): "

if "%dbchoice%"=="1" (
    echo Opening Prisma Studio...
    npx prisma studio
)
if "%dbchoice%"=="2" (
    echo Resetting database...
    npx prisma migrate reset --force
    npx prisma db seed
)
if "%dbchoice%"=="3" (
    echo Seeding database...
    npx prisma db seed
)
if "%dbchoice%"=="4" (
    echo Generating Prisma client...
    npx prisma generate
)
if "%dbchoice%"=="5" goto menu
pause
goto db

:clean
echo.
echo WARNING: This will remove all containers, volumes, and data!
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    echo Cleaning everything...
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
    echo.
    echo Everything cleaned!
) else (
    echo Clean cancelled.
)
pause
goto menu

:exit
echo.
echo Goodbye!
exit
