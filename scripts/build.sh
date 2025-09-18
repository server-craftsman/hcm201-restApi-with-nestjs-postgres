#!/bin/bash

# Render Build Script for SmartChat API
set -e

echo "🚀 Starting SmartChat API build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project root."
    exit 1
fi

echo "📦 Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

echo "🗄️ Generating Prisma client..."
pnpm prisma generate

echo "🔨 Building NestJS application..."
pnpm run build

echo "✅ Build completed successfully!"
echo "📊 Build summary:"
echo "   - Dependencies: Installed"
echo "   - Prisma Client: Generated"
echo "   - Application: Built"
echo "   - Ready for deployment!" 