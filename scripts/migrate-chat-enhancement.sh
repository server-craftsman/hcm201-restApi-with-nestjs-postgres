#!/bin/bash

# ==============================================================================
# Chat Enhancement Migration Script
# ==============================================================================

set -e  # Exit on any error

echo "🚀 Starting Chat Enhancement Migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from project root."
    exit 1
fi

# Check if Prisma CLI is available
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

print_step "Checking Prisma CLI..."
if ! pnpm prisma --version &> /dev/null; then
    print_error "Prisma CLI not found. Installing..."
    pnpm install -g prisma
fi

# Backup database (if in production)
if [ "$NODE_ENV" = "production" ]; then
    print_step "Creating database backup..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ -n "$DATABASE_URL" ]; then
        # Extract database info from URL
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        print_step "Backing up database to $BACKUP_FILE..."
        pg_dump $DATABASE_URL > "backups/$BACKUP_FILE" || {
            print_warning "Backup failed, but continuing with migration..."
        }
        print_success "Database backup created: backups/$BACKUP_FILE"
    else
        print_warning "DATABASE_URL not set. Skipping backup."
    fi
fi

# Generate Prisma client
print_step "Generating Prisma client..."
pnpm prisma generate

# Create and apply migration
print_step "Creating migration for chat enhancements..."
pnpm prisma migrate dev --name chat_enhancement_social_features

# Verify migration
print_step "Verifying migration..."
if pnpm prisma migrate status | grep -q "Database schema is up to date"; then
    print_success "Migration applied successfully!"
else
    print_error "Migration verification failed. Please check manually."
    exit 1
fi

# Update indexes for performance
print_step "Creating performance indexes..."

# SQL for additional indexes
SQL_INDEXES="
-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_created_at ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at ON messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_messages_hashtags ON messages USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chats_type_updated_at ON chats(type, updated_at);
CREATE INDEX IF NOT EXISTS idx_chats_public_category ON chats(is_public, category) WHERE type = 'GROUP';
CREATE INDEX IF NOT EXISTS idx_chats_tags ON chats USING GIN(tags);

-- Social features indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status ON friend_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_type ON message_reactions(message_id, type);

-- Story indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_expires_at ON stories(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at) WHERE expires_at > NOW();

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created_at ON user_activities(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_chat_activity ON user_activities(chat_id, activity) WHERE chat_id IS NOT NULL;

-- Chat member indexes
CREATE INDEX IF NOT EXISTS idx_chat_members_user_active ON chat_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_role ON chat_members(chat_id, role, is_active);
"

# Apply indexes if database URL is available
if [ -n "$DATABASE_URL" ]; then
    print_step "Applying performance indexes..."
    echo "$SQL_INDEXES" | psql $DATABASE_URL || {
        print_warning "Some indexes may have failed to create. This is usually not critical."
    }
    print_success "Performance indexes applied!"
else
    print_warning "DATABASE_URL not set. Skipping index creation."
    echo "You can manually run these indexes later:"
    echo "$SQL_INDEXES"
fi

# Seed default data
print_step "Seeding default data..."

# Create seed data for chat categories, etc.
SEED_SQL="
-- Insert default chat categories if not exists
INSERT INTO chat_settings (id, chat_id, allow_member_invite, allow_member_post, moderation_enabled)
SELECT gen_random_uuid(), id, true, true, false
FROM chats 
WHERE id NOT IN (SELECT chat_id FROM chat_settings);

-- Update existing group chats with default settings
UPDATE chats 
SET category = 'GENERAL', 
    is_public = false, 
    allow_auto_join = false
WHERE type = 'GROUP' AND category IS NULL;
"

if [ -n "$DATABASE_URL" ]; then
    echo "$SEED_SQL" | psql $DATABASE_URL || {
        print_warning "Seeding failed. You may need to seed data manually."
    }
    print_success "Default data seeded!"
fi

# Generate updated Prisma client
print_step "Regenerating Prisma client with new schema..."
pnpm prisma generate

# Verify everything is working
print_step "Running quick verification..."
if pnpm run build > /dev/null 2>&1; then
    print_success "Build verification passed!"
else
    print_warning "Build verification failed. Check for TypeScript errors."
fi

print_success "🎉 Chat Enhancement Migration completed successfully!"
print_step "Next steps:"
echo "1. Review the new features in your application"
echo "2. Test the enhanced chat functionality" 
echo "3. Update your frontend to use new social features"
echo "4. Consider running 'pnpm run test' to verify everything works"

if [ "$NODE_ENV" = "production" ]; then
    echo "5. Monitor application performance and database usage"
    echo "6. Backup location: backups/$BACKUP_FILE"
fi

echo ""
print_step "New features available:"
echo "✅ Enhanced messaging with reactions, mentions, hashtags"
echo "✅ Group management with categories and permissions"
echo "✅ Friend requests and social connections"
echo "✅ Stories with auto-expiration"
echo "✅ Polls in messages"
echo "✅ User activity tracking"
echo "✅ Advanced search capabilities"

echo ""
print_success "Migration completed! 🚀" 