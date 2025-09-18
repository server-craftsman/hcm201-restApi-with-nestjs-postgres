# Hướng dẫn sử dụng Scripts - Debate System

## 📋 Tổng quan Scripts

Hệ thống Debate đã được cập nhật với các scripts quản lý toàn diện cho cả Windows và Linux.

## 🚀 Scripts chính

### 1. Setup Scripts
```bash
# Windows
pnpm run setup
pnpm run setup:db

# Linux/Mac
pnpm run setup:linux
pnpm run setup:db:linux
```

**Chức năng:**
- Tạo file .env từ template
- Cài đặt dependencies
- Generate Prisma client
- Chạy database migrations
- Seed dữ liệu mẫu

### 2. Manager Scripts (Quản lý tổng thể)
```bash
# Windows
pnpm run manager

# Linux/Mac
pnpm run manager:linux
```

**Menu quản lý:**
1. Setup Database (First time)
2. Start Development
3. Start Production
4. Stop All Services
5. View Logs
6. Database Management
7. Clean Everything
8. Exit

### 3. Docker Scripts
```bash
# Development
pnpm run docker:dev

# Production
pnpm run docker:prod

# Basic Docker
pnpm run docker:up
pnpm run docker:down
pnpm run docker:logs
pnpm run docker:build
pnpm run docker:rebuild
pnpm run docker:clean
```

### 4. Database Scripts
```bash
# Setup database
pnpm run db:setup

# Reset database
pnpm run db:reset

# Open Prisma Studio
pnpm run db:studio

# Prisma commands
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:migrate:prod
pnpm run prisma:reset
pnpm run prisma:seed
pnpm run prisma:studio
pnpm run prisma:deploy
```

### 5. Development Scripts
```bash
# Development
pnpm run dev

# Production
pnpm run prod

# Debug
pnpm run debug
```

## 🐳 Docker Environments

### Development Environment
```bash
pnpm run docker:dev
```
**Services:**
- API Server (port 51213)
- PostgreSQL (port 5432)
- Redis (port 6379)
- pgAdmin (port 8080)
- Redis Commander (port 8081)

### Production Environment
```bash
pnpm run docker:prod
```
**Services:**
- API Server (port 51213)
- PostgreSQL
- Redis
- Nginx Reverse Proxy (ports 80, 443)

## 📁 File Structure

```
scripts/
├── setup-debate-db.bat          # Windows setup script
├── setup-debate-db.sh           # Linux setup script
├── debate-manager.bat           # Windows manager script
├── debate-manager.sh            # Linux manager script
└── init-db.sql                  # Database initialization

docker-compose.yml               # Default compose file
docker-compose.dev.yml           # Development environment
docker-compose.prod.yml          # Production environment

env.debate.example               # Development environment template
env.production.example           # Production environment template
```

## 🔧 Cấu hình Environment

### Development
```bash
# Copy template
cp env.debate.example .env

# Edit .env file với thông tin database của bạn
```

### Production
```bash
# Copy template
cp env.production.example .env.production

# Edit .env.production với thông tin production
```

## 🚀 Quick Start

### Lần đầu setup:
```bash
# Windows
pnpm run setup

# Linux/Mac
pnpm run setup:linux
```

### Chạy development:
```bash
# Windows
pnpm run manager
# Chọn option 2: Start Development

# Linux/Mac
pnpm run manager:linux
# Chọn option 2: Start Development
```

### Chạy production:
```bash
# Windows
pnpm run manager
# Chọn option 3: Start Production

# Linux/Mac
pnpm run manager:linux
# Chọn option 3: Start Production
```

## 🛠️ Troubleshooting

### Database connection issues:
```bash
# Reset database
pnpm run db:reset

# Or use manager
pnpm run manager
# Chọn option 6: Database Management
# Chọn option 2: Reset Database
```

### Docker issues:
```bash
# Clean everything
pnpm run docker:clean

# Or use manager
pnpm run manager
# Chọn option 7: Clean Everything
```

### Port conflicts:
```bash
# Stop all services
pnpm run docker:down

# Check what's using ports
netstat -tulpn | grep :51213
netstat -tulpn | grep :5432
netstat -tulpn | grep :6379
```

## 📊 Monitoring

### View logs:
```bash
# All services
pnpm run docker:logs

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Health checks:
- API: http://localhost:51213/health
- pgAdmin: http://localhost:8080
- Redis Commander: http://localhost:8081

## 🔐 Security Notes

### Development:
- Sử dụng passwords đơn giản cho development
- CORS mở rộng cho testing
- JWT secrets có thể đơn giản

### Production:
- Sử dụng passwords mạnh
- CORS hạn chế theo domain
- JWT secrets phức tạp
- SSL/TLS certificates
- Environment variables bảo mật

## 📝 Logs và Debugging

### Application logs:
```bash
# Development
docker-compose -f docker-compose.dev.yml logs -f api

# Production
docker-compose -f docker-compose.prod.yml logs -f api
```

### Database logs:
```bash
docker-compose logs -f postgres
```

### Redis logs:
```bash
docker-compose logs -f redis
```

## 🎯 Best Practices

1. **Development:**
   - Sử dụng `pnpm run manager` để quản lý
   - Luôn chạy `pnpm run setup` lần đầu
   - Sử dụng development environment cho coding

2. **Production:**
   - Sử dụng production environment
   - Cấu hình environment variables cẩn thận
   - Monitor logs thường xuyên
   - Backup database định kỳ

3. **Database:**
   - Chạy migrations trước khi deploy
   - Backup trước khi reset
   - Sử dụng Prisma Studio để quản lý data

4. **Docker:**
   - Clean up containers không sử dụng
   - Monitor resource usage
   - Sử dụng health checks
