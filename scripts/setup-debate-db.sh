#!/bin/bash

echo "🚀 Setting up Debate System Database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp env.debate.example .env
    echo "✅ .env file created. Please update the database credentials."
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name debate_system

# Seed the database
echo "🌱 Seeding database with sample data..."
npx prisma db seed

echo "✅ Debate System setup completed!"
echo ""
echo "📊 Next steps:"
echo "1. Update .env file with your database credentials"
echo "2. Run: pnpm run start:dev"
echo "3. Access API at: http://localhost:51213"
echo "4. WebSocket at: ws://localhost:51213/debate"
echo ""
echo "🔑 Sample accounts:"
echo "- Admin: admin@debate.com / admin123"
echo "- Student 1: student1@debate.com / student123"
echo "- Student 2: student2@debate.com / student123"
