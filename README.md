# Debate API

A real-time chat application with AI assistant built with NestJS, PostgreSQL, Redis, and Socket.IO.

## 🚀 Features

- **Real-time Messaging**: 1-1 and group chat with Socket.IO
- **AI Assistant**: Private chat, auto-reply suggestions, message summarization
- **User Management**: Registration, login, email verification, role-based access
- **Performance**: Redis caching, rate limiting, compression
- **Security**: JWT authentication, RBAC, DDoS protection
- **Documentation**: Comprehensive Swagger API docs

## 🐳 Docker Setup

### Quick Start (Development)

```bash
# Clone the repository
git clone <repository-url>
cd smartchat-api

# Run Docker setup (Windows)
pnpm run setup

# Or manually start Docker services
docker-compose up -d --build
```

### Production Deployment

```bash
# Build and start production environment
pnpm run docker:prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📋 Prerequisites

- **Docker & Docker Compose**
- **Node.js 18+** (for local development)
- **pnpm** (recommended package manager)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   PostgreSQL    │
│   (Client)      │◄──►│   (NestJS)      │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   (Session/     │
                       │    Cache)       │
                       └─────────────────┘
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| **API Server** | 51213 | NestJS application |
| **PostgreSQL** | 5432 | Database |
| **Redis** | 6379 | Cache & Session |
| **pgAdmin** | 8080 | Database management |
| **Redis Commander** | 8081 | Redis management |
| **Nginx** | 80/443 | Reverse proxy (prod) |

## 📁 Project Structure

```
smartchat-api/
├── src/
│   ├── auth/           # Authentication & Authorization
│   ├── user/           # User management
│   ├── chat/           # Real-time chat
│   ├── ai-chat/        # AI assistant
│   ├── common/         # Shared utilities
│   ├── config/         # Configuration
│   ├── mail/           # Email services
│   └── mailer/         # Email templates
├── prisma/             # Database schema & migrations
├── scripts/            # Setup & utility scripts
├── nginx/              # Nginx configuration
├── docker-compose.yml  # Development environment
├── docker-compose.prod.yml # Production environment
├── Dockerfile.dev      # Development container
└── Dockerfile.prod     # Production container
```

## 🔧 Configuration

### Environment Variables

Create `.env` file from `.env.example`:

```bash
# Copy environment template
cp .env.example .env
```

Key configuration sections:
- **Database**: PostgreSQL connection settings
- **Redis**: Cache and session settings
- **Authentication**: JWT secrets and expiration
- **Mail**: SMTP settings for email verification
- **Security**: Rate limiting, CORS, compression

### Docker Environment

The application automatically configures for Docker environment:
- Database host: `postgres` (container name)
- Redis host: `redis` (container name)
- All services communicate via Docker network

## 🚀 Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start database and Redis
docker-compose up -d postgres redis

# Run migrations
pnpm prisma generate
pnpm prisma db push

# Start development server
pnpm run start:dev
```

### Docker Development

```bash
# Start all services with hot reload
docker-compose up -d

# View logs
docker-compose logs -f api

# Execute commands in container
docker-compose exec api pnpm prisma db push
```

## 🏭 Production

### Production Deployment

```bash
# Build and start production environment
pnpm run docker:prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
```

### Production Features

- **Multi-stage builds** for optimized images
- **Non-root user** for security
- **Health checks** for all services
- **Nginx reverse proxy** with rate limiting
- **SSL/TLS support** (configure in nginx.conf)
- **Persistent volumes** for data storage

## 📊 Monitoring & Management

### Health Checks

```bash
# API health
curl http://localhost:51213/health

# Docker services
docker-compose ps
```

### Database Management

- **pgAdmin**: http://localhost:8080
  - Email: `admin@smartchat.com`
  - Password: `admin123`

### Redis Management

- **Redis Commander**: http://localhost:8081

## 🔧 Useful Commands

```bash
# Docker commands
pnpm run docker:up          # Start development
pnpm run docker:down        # Stop all services
pnpm run docker:logs        # View logs
pnpm run docker:rebuild     # Rebuild and restart
pnpm run docker:prod        # Start production
pnpm run docker:clean       # Clean volumes

# Database commands
pnpm run db:generate        # Generate Prisma client
pnpm run db:push           # Push schema to database
pnpm run db:studio         # Open Prisma Studio

# Cache commands
pnpm run cache:clear       # Clear Redis cache
pnpm run redis:flush       # Flush Redis data

# Environment commands
pnpm run env:dev           # Switch to development
pnpm run env:prod          # Switch to production
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-Based Access Control** (RBAC)
- **Rate Limiting** with Redis
- **DDoS Protection** via throttling
- **Security Headers** (Helmet)
- **CORS Configuration**
- **Input Validation** (class-validator)
- **Password Hashing** (bcryptjs)

## 📈 Performance Features

- **Redis Caching** for API responses
- **Compression** (gzip) for responses
- **Database Indexing** for queries
- **Connection Pooling** for database
- **Rate Limiting** for API protection
- **Health Checks** for monitoring

## 🧪 Testing

```bash
# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e
```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:51213/api
- **Health Check**: http://localhost:51213/health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 51213, 5432, 6379 are available
2. **Database connection**: Check if PostgreSQL container is running
3. **Redis connection**: Verify Redis container is healthy
4. **Permission issues**: Run Docker commands with appropriate permissions

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f
```

### Reset Environment

```bash
# Complete reset
docker-compose down -v
docker system prune -a --volumes
pnpm run setup
```
