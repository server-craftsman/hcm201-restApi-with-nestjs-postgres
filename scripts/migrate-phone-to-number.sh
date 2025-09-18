#!/bin/bash

echo "🔄 Starting phone field migration from string to number..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Generate Prisma client with new schema
print_status "Generating Prisma client..."
pnpm prisma generate

if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 2: Create migration for phone field change
print_status "Creating migration for phone field change..."
pnpm prisma migrate dev --name phone_field_to_number

if [ $? -ne 0 ]; then
    print_error "Failed to create migration"
    exit 1
fi

# Step 3: Apply the migration
print_status "Applying migration..."
pnpm prisma migrate deploy

if [ $? -ne 0 ]; then
    print_error "Failed to apply migration"
    exit 1
fi

# Step 4: Generate Prisma client again to ensure types are updated
print_status "Regenerating Prisma client..."
pnpm prisma generate

if [ $? -ne 0 ]; then
    print_error "Failed to regenerate Prisma client"
    exit 1
fi

print_status "Migration completed successfully!"
print_warning "Note: Existing phone data in string format will need to be converted manually if needed"
print_status "Phone field is now stored as number type in the database" 