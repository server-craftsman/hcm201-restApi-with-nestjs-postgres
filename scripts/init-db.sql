-- Initialize Debate System Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if not exists (PostgreSQL creates it automatically from environment)
-- The database 'debate_db' is created by POSTGRES_DB environment variable

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create custom ENUM types for Debate System
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ONLINE', 'OFFLINE', 'AWAY', 'BUSY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE debate_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create indexes for better performance (these will be created by Prisma, but we can add some here)
-- Note: Prisma will handle most of the schema creation

-- Log successful initialization
SELECT 'Debate System database initialized successfully' as status; 