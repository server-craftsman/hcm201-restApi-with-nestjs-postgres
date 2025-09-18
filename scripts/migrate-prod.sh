#!/bin/bash

# Production Migration Script
echo "🚀 Starting Production Migration..."

# Set environment
export NODE_ENV=production

# Load production environment
if [ -f .env.production ]; then
    echo "📄 Loading production environment..."
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Deploy migrations
echo "🚀 Deploying migrations..."
pnpm prisma migrate deploy

# Verify database connection
echo "🔍 Verifying database connection..."
pnpm prisma db pull

echo "✅ Production migration completed!" 