# SmartChat Database Migration Guide

## 🚀 Quick Start

### Development Environment

1. **Setup Database:**
   ```bash
   # Tạo database và user
   psql -U postgres
   CREATE DATABASE smartchat_db;
   CREATE USER smartchat_user WITH PASSWORD '19102003';
   GRANT ALL PRIVILEGES ON DATABASE smartchat_db TO smartchat_user;
   ```

2. **Generate Prisma Client:**
   ```bash
   pnpm db:generate
   ```

3. **Push Schema to Database:**
   ```bash
   pnpm db:push
   ```

4. **Seed Database (Optional):**
   ```bash
   pnpm db:seed
   ```

### Production Environment

1. **Update .env.production:**
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database"
   ```

2. **Deploy Migrations:**
   ```bash
   pnpm migrate:prod
   ```

## 📋 Migration Commands

### Development Commands
```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes
pnpm db:push

# Create new migration
pnpm db:migrate:dev

# Reset database
pnpm db:migrate:reset

# Check migration status
pnpm db:migrate:status

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed

# Full development setup
pnpm setup:dev
```

### Production Commands
```bash
# Deploy migrations
pnpm db:migrate:deploy

# Full production setup
pnpm setup:prod

# Production migration script
pnpm migrate:prod
```

## 🐳 Docker Development

### Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Individual Services
```bash
# Start only PostgreSQL
docker-compose up postgres

# Start only Redis
docker-compose up redis

# Start only app
docker-compose up app
```

## 🔧 Database Management

### PostgreSQL Commands
```bash
# Connect to database
psql -U smartchat_user -h localhost -d smartchat_db

# List tables
\dt

# Describe table
\d users

# Backup database
pg_dump -U smartchat_user -h localhost smartchat_db > backup.sql

# Restore database
psql -U smartchat_user -h localhost smartchat_db < backup.sql
```

### Prisma Commands
```bash
# Generate client
pnpm prisma generate

# Push schema
pnpm prisma db push

# Create migration
pnpm prisma migrate dev --name migration_name

# Deploy migrations
pnpm prisma migrate deploy

# Reset database
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma studio

# Pull schema from database
pnpm prisma db pull
```

## 📊 Database Schema

### Tables
- `users` - User accounts
- `chats` - Chat rooms
- `chat_members` - Chat membership
- `messages` - Chat messages
- `ai_chats` - AI chat sessions
- `ai_messages` - AI chat messages

### Enums
- `UserStatus` - ONLINE, OFFLINE, AWAY, BUSY
- `ChatType` - DIRECT, GROUP
- `MemberRole` - ADMIN, MEMBER
- `MessageType` - TEXT, IMAGE, FILE, AUDIO, VIDEO
- `AIRole` - USER, ASSISTANT

## 🔐 Environment Variables

### Development (.env)
```env
NODE_ENV=development
DATABASE_URL="postgresql://smartchat_user:19102003@localhost:5432/smartchat_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL="postgresql://username:password@host:5432/database"
JWT_SECRET="your-production-jwt-secret-key-change-this"
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused:**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Authentication failed:**
   ```bash
   # Reset password
   sudo -u postgres psql
   ALTER USER smartchat_user PASSWORD '19102003';
   ```

3. **Database not found:**
   ```sql
   CREATE DATABASE smartchat_db;
   ```

4. **Permission denied:**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE smartchat_db TO smartchat_user;
   ```

5. **Prisma client not generated:**
   ```bash
   pnpm prisma generate
   ```

### Reset Everything
```bash
# Stop all services
docker-compose down -v

# Remove volumes
docker volume rm smartchat_postgres_data smartchat_redis_data

# Restart
docker-compose up -d

# Setup database
pnpm setup:dev
```

## 📈 Monitoring

### Database Performance
```sql
-- Active connections
SELECT * FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('smartchat_db'));

-- Slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Application Logs
```bash
# View app logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres
```

## 🔄 Migration Workflow

### Development Workflow
1. Make schema changes in `prisma/schema.prisma`
2. Run `pnpm db:push` to apply changes
3. Test changes locally
4. Create migration: `pnpm db:migrate:dev --name descriptive_name`
5. Commit migration files

### Production Workflow
1. Deploy code to production
2. Run `pnpm migrate:prod` to apply migrations
3. Verify database connection
4. Monitor application logs

## 📝 Best Practices

1. **Always backup before migrations**
2. **Test migrations in staging first**
3. **Use descriptive migration names**
4. **Keep migrations small and focused**
5. **Document schema changes**
6. **Monitor performance after migrations**
7. **Have rollback plan ready** 