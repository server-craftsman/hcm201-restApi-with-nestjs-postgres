#!/bin/sh
set -e

echo "🚀 Starting SmartChat API Container..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
while ! pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -q; do
  echo "🔄 Database is not ready, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Run Prisma operations
echo "🔧 Running Prisma operations..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
pnpm prisma db push --force-reset

echo "✅ Prisma operations completed!"

# Execute the command passed to the container
echo "🌟 Starting application..."
exec "$@" 