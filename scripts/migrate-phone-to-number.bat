@echo off
echo 🔄 Starting phone field migration from string to number...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    exit /b 1
)

REM Step 1: Generate Prisma client with new schema
echo ✅ Generating Prisma client...
call pnpm prisma generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

REM Step 2: Create migration for phone field change
echo ✅ Creating migration for phone field change...
call pnpm prisma migrate dev --name phone_field_to_number
if errorlevel 1 (
    echo ❌ Failed to create migration
    exit /b 1
)

REM Step 3: Apply the migration
echo ✅ Applying migration...
call pnpm prisma migrate deploy
if errorlevel 1 (
    echo ❌ Failed to apply migration
    exit /b 1
)

REM Step 4: Generate Prisma client again to ensure types are updated
echo ✅ Regenerating Prisma client...
call pnpm prisma generate
if errorlevel 1 (
    echo ❌ Failed to regenerate Prisma client
    exit /b 1
)

echo ✅ Migration completed successfully!
echo ⚠️  Note: Existing phone data in string format will need to be converted manually if needed
echo ✅ Phone field is now stored as number type in the database 