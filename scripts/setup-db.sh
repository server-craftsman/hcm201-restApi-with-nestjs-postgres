#!/bin/bash

# Database Setup Script for SmartChat
echo "🚀 Setting up SmartChat Database..."

# Define PostgreSQL paths
PG_BIN_DIRS=(
    "C:\Program Files\PostgreSQL\16\bin"
    "C:\Program Files\PostgreSQL\15\bin"
    "C:\Program Files\PostgreSQL\14\bin"
    "C:\Program Files\PostgreSQL\13\bin"
)

# Find PostgreSQL installation
PG_ISREADY=""
PSQL=""

for dir in "${PG_BIN_DIRS[@]}"; do
    if [ -f "$dir/pg_isready.exe" ]; then
        PG_ISREADY="$dir/pg_isready.exe"
        PSQL="$dir/psql.exe"
        echo "✅ Found PostgreSQL in: $dir"
        break
    fi
done

if [ -z "$PG_ISREADY" ]; then
    echo "❌ PostgreSQL not found in common locations"
    echo "💡 Please ensure PostgreSQL is installed or add it to PATH"
    exit 1
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! "$PG_ISREADY" -h localhost -p 5432 -U postgres 2>/dev/null; then
    echo "❌ PostgreSQL is not running or cannot connect"
    echo "💡 Please:"
    echo "   1. Start PostgreSQL service in Windows Services"
    echo "   2. Check if password for 'postgres' user is correct"
    echo "   3. Try connecting manually: $PSQL -U postgres -h localhost"
    exit 1
fi

echo "✅ PostgreSQL is running and accessible"

# Create database and user
echo "📝 Creating database and user..."
"$PSQL" -U postgres -h localhost -c "CREATE DATABASE smartchat_db;" 2>/dev/null || echo "Database already exists"
"$PSQL" -U postgres -h localhost -c "CREATE USER postgres WITH PASSWORD '19102003';" 2>/dev/null || echo "User already exists"
"$PSQL" -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE smartchat_db TO postgres;" 2>/dev/null || echo "Privileges already granted"

echo "✅ Database setup completed"

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Push schema to database
echo "🔄 Pushing schema to database..."
pnpm prisma db push

# Seed database
echo "🌱 Seeding database..."
pnpm prisma db seed

echo "✅ Database setup completed successfully!"
echo ""
echo "📊 You can now:"
echo "  - Start the app: pnpm start:dev"
echo "  - Open Prisma Studio: pnpm db:studio"
echo "  - View API docs: http://localhost:51213/ambatukam" 