#!/bin/bash

# Development Migration Script
echo "🚀 Starting Development Migration..."

# Set environment
export NODE_ENV=development

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Create migration
echo "📝 Creating migration..."
pnpm prisma migrate dev --name $(date +%Y%m%d_%H%M%S)_dev

# Push schema to database
echo "🔄 Pushing schema to database..."
pnpm prisma db push

# Seed database (if needed)
echo "🌱 Seeding database..."
# pnpm prisma db seed

echo "✅ Development migration completed!" 