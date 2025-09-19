@echo off
echo 🔄 Converting CUID to UUID format...

REM Check if database is running
echo 📊 Checking database connection...
npx prisma db execute --file prisma/migrations/convert_cuid_to_uuid.sql

if %errorlevel% equ 0 (
    echo ✅ Migration completed successfully!
    echo 🔄 Regenerating Prisma client...
    npx prisma generate
    
    echo 🎉 All done! Your database now uses UUID format.
    echo 📝 New records will have UUID format like: 123e4567-e89b-12d3-a456-426614174000
) else (
    echo ❌ Migration failed!
    echo 💡 You may need to reset the database if there are conflicts.
    echo    Run: npx prisma migrate reset --force
    exit /b 1
)
