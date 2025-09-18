#!/bin/bash

# Simple Database Setup Script for SmartChat
echo "🚀 Setting up SmartChat Database (Simple Mode)..."

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
echo ""
echo "💡 If you get database connection errors:"
echo "  1. Make sure PostgreSQL is running"
echo "  2. Check your .env file DATABASE_URL"
echo "  3. Try: docker-compose -f docker-compose.dev.yml up -d postgres" 