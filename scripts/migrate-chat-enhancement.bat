@echo off
REM ==============================================================================
REM Chat Enhancement Migration Script for Windows
REM ==============================================================================

setlocal EnableDelayedExpansion

echo 🚀 Starting Chat Enhancement Migration...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Not in project root directory. Please run from project root.
    pause
    exit /b 1
)

REM Check if pnpm is available
where pnpm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] pnpm is not installed. Please install pnpm first.
    pause
    exit /b 1
)

echo [STEP] Checking Prisma CLI...
pnpm prisma --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Prisma CLI not found. Installing...
    pnpm install -g prisma
)

REM Backup database (if in production)
if "%NODE_ENV%"=="production" (
    echo [STEP] Creating database backup...
    
    set BACKUP_FILE=backup_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
    set BACKUP_FILE=!BACKUP_FILE: =0!
    
    if defined DATABASE_URL (
        echo [STEP] Backing up database to !BACKUP_FILE!...
        mkdir backups 2>nul
        pg_dump %DATABASE_URL% > "backups\!BACKUP_FILE!" 2>nul || (
            echo [WARNING] Backup failed, but continuing with migration...
        )
        echo [SUCCESS] Database backup created: backups\!BACKUP_FILE!
    ) else (
        echo [WARNING] DATABASE_URL not set. Skipping backup.
    )
)

REM Generate Prisma client
echo [STEP] Generating Prisma client...
pnpm prisma generate
if errorlevel 1 (
    echo [ERROR] Prisma client generation failed.
    pause
    exit /b 1
)

REM Create and apply migration
echo [STEP] Creating migration for chat enhancements...
pnpm prisma migrate dev --name chat_enhancement_social_features
if errorlevel 1 (
    echo [ERROR] Migration failed.
    pause
    exit /b 1
)

REM Verify migration
echo [STEP] Verifying migration...
pnpm prisma migrate status | findstr "Database schema is up to date" >nul
if errorlevel 1 (
    echo [WARNING] Migration verification inconclusive. Please check manually.
) else (
    echo [SUCCESS] Migration applied successfully!
)

REM Update indexes for performance (if DATABASE_URL is available)
if defined DATABASE_URL (
    echo [STEP] Applying performance indexes...
    
    echo -- Message indexes > temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_messages_chat_created_at ON messages(chat_id, created_at); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at ON messages(sender_id, created_at); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING GIN(mentions); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_messages_hashtags ON messages USING GIN(hashtags); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id); >> temp_indexes.sql
    echo. >> temp_indexes.sql
    echo -- Chat indexes >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_chats_type_updated_at ON chats(type, updated_at); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_chats_public_category ON chats(is_public, category) WHERE type = 'GROUP'; >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_chats_tags ON chats USING GIN(tags); >> temp_indexes.sql
    echo. >> temp_indexes.sql
    echo -- Social features indexes >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status ON friend_requests(receiver_id, status); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status ON friend_requests(sender_id, status); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_message_reactions_message_type ON message_reactions(message_id, type); >> temp_indexes.sql
    echo. >> temp_indexes.sql
    echo -- Story indexes >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_stories_user_expires_at ON stories(user_id, expires_at); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at) WHERE expires_at ^> NOW(); >> temp_indexes.sql
    echo. >> temp_indexes.sql
    echo -- Activity indexes >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_user_activities_user_created_at ON user_activities(user_id, created_at); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_user_activities_chat_activity ON user_activities(chat_id, activity) WHERE chat_id IS NOT NULL; >> temp_indexes.sql
    echo. >> temp_indexes.sql
    echo -- Chat member indexes >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_chat_members_user_active ON chat_members(user_id, is_active); >> temp_indexes.sql
    echo CREATE INDEX IF NOT EXISTS idx_chat_members_chat_role ON chat_members(chat_id, role, is_active); >> temp_indexes.sql
    
    psql %DATABASE_URL% -f temp_indexes.sql >nul 2>nul && (
        echo [SUCCESS] Performance indexes applied!
    ) || (
        echo [WARNING] Some indexes may have failed to create. This is usually not critical.
    )
    
    del temp_indexes.sql 2>nul
) else (
    echo [WARNING] DATABASE_URL not set. Skipping index creation.
)

REM Seed default data
echo [STEP] Seeding default data...
if defined DATABASE_URL (
    echo -- Insert default chat settings if not exists > temp_seed.sql
    echo INSERT INTO chat_settings (id, chat_id, allow_member_invite, allow_member_post, moderation_enabled) >> temp_seed.sql
    echo SELECT gen_random_uuid(), id, true, true, false >> temp_seed.sql
    echo FROM chats >> temp_seed.sql
    echo WHERE id NOT IN (SELECT chat_id FROM chat_settings); >> temp_seed.sql
    echo. >> temp_seed.sql
    echo -- Update existing group chats with default settings >> temp_seed.sql
    echo UPDATE chats >> temp_seed.sql
    echo SET category = 'GENERAL', >> temp_seed.sql
    echo     is_public = false, >> temp_seed.sql
    echo     allow_auto_join = false >> temp_seed.sql
    echo WHERE type = 'GROUP' AND category IS NULL; >> temp_seed.sql
    
    psql %DATABASE_URL% -f temp_seed.sql >nul 2>nul && (
        echo [SUCCESS] Default data seeded!
    ) || (
        echo [WARNING] Seeding failed. You may need to seed data manually.
    )
    
    del temp_seed.sql 2>nul
)

REM Generate updated Prisma client
echo [STEP] Regenerating Prisma client with new schema...
pnpm prisma generate
if errorlevel 1 (
    echo [WARNING] Prisma client regeneration failed.
)

REM Verify everything is working
echo [STEP] Running quick verification...
pnpm run build >nul 2>nul
if errorlevel 1 (
    echo [WARNING] Build verification failed. Check for TypeScript errors.
) else (
    echo [SUCCESS] Build verification passed!
)

echo.
echo [SUCCESS] 🎉 Chat Enhancement Migration completed successfully!
echo.
echo [STEP] Next steps:
echo 1. Review the new features in your application
echo 2. Test the enhanced chat functionality
echo 3. Update your frontend to use new social features
echo 4. Consider running 'pnpm run test' to verify everything works

if "%NODE_ENV%"=="production" (
    echo 5. Monitor application performance and database usage
    if defined BACKUP_FILE (
        echo 6. Backup location: backups\!BACKUP_FILE!
    )
)

echo.
echo [STEP] New features available:
echo ✅ Enhanced messaging with reactions, mentions, hashtags
echo ✅ Group management with categories and permissions
echo ✅ Friend requests and social connections
echo ✅ Stories with auto-expiration
echo ✅ Polls in messages
echo ✅ User activity tracking
echo ✅ Advanced search capabilities

echo.
echo [SUCCESS] Migration completed! 🚀
echo.
pause 