# Hệ thống Tranh luận Tư tưởng Hồ Chí Minh

## Tổng quan

Hệ thống tranh luận trực tuyến về các chủ đề, câu hỏi của môn Tư tưởng Hồ Chí Minh, cho phép người dùng đưa ra, bổ sung luận điểm và tham gia thảo luận đa chiều với tính năng realtime.

## Kiến trúc hệ thống

### Domain-Driven Design (DDD)
- **Domain Layer**: Entities, Repository Interfaces
- **Infrastructure Layer**: Prisma Adapters
- **Application Layer**: Services, DTOs
- **Presentation Layer**: Controllers, WebSocket Gateway

### Cấu trúc dữ liệu
```
User (Người dùng)
├── Topic (Chủ đề tranh luận)
│   └── Question (Câu hỏi)
│       └── Argument (Luận điểm)
```

## API Endpoints

### Topics (Chủ đề)
- `GET /debate/topics` - Lấy danh sách tất cả chủ đề
- `GET /debate/topics/my` - Lấy chủ đề của tôi
- `GET /debate/topics/:id` - Lấy chi tiết chủ đề
- `POST /debate/topics` - Tạo chủ đề mới
- `PATCH /debate/topics/:id` - Cập nhật chủ đề
- `DELETE /debate/topics/:id` - Xóa chủ đề

### Questions (Câu hỏi)
- `GET /debate/topics/:topicId/questions` - Lấy câu hỏi theo chủ đề
- `GET /debate/questions/:id` - Lấy chi tiết câu hỏi
- `POST /debate/topics/:topicId/questions` - Tạo câu hỏi mới
- `PATCH /debate/questions/:id` - Cập nhật câu hỏi
- `DELETE /debate/questions/:id` - Xóa câu hỏi

### Arguments (Luận điểm)
- `GET /debate/questions/:questionId/arguments` - Lấy luận điểm theo câu hỏi
- `GET /debate/arguments/my` - Lấy luận điểm của tôi
- `GET /debate/arguments/:id` - Lấy chi tiết luận điểm
- `POST /debate/questions/:questionId/arguments` - Tạo luận điểm mới
- `PATCH /debate/arguments/:id` - Cập nhật luận điểm
- `DELETE /debate/arguments/:id` - Xóa luận điểm

## WebSocket Events

### Client → Server
- `joinTopic` - Tham gia phòng tranh luận
- `leaveTopic` - Rời khỏi phòng tranh luận
- `newQuestion` - Tạo câu hỏi mới
- `newArgument` - Tạo luận điểm mới
- `typing` - Trạng thái đang gõ

### Server → Client
- `joinedTopic` - Xác nhận tham gia phòng
- `leftTopic` - Xác nhận rời phòng
- `questionAdded` - Câu hỏi mới được thêm
- `argumentAdded` - Luận điểm mới được thêm
- `userTyping` - Người dùng đang gõ
- `topicUpdated` - Chủ đề được cập nhật
- `questionUpdated` - Câu hỏi được cập nhật
- `argumentUpdated` - Luận điểm được cập nhật

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
pnpm install
```

### 2. Cấu hình database
```bash
# Copy file environment
cp env.debate.example .env

# Chạy migration
npx prisma migrate dev

# Seed dữ liệu mẫu
npx prisma db seed
```

### 3. Chạy với Docker
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Chạy local development
```bash
# Start database
docker-compose up postgres redis -d

# Start application
pnpm run start:dev
```

## Dữ liệu mẫu

Hệ thống được seed với dữ liệu mẫu về các chủ đề Tư tưởng Hồ Chí Minh:

1. **Tư tưởng Hồ Chí Minh về độc lập dân tộc và chủ nghĩa xã hội**
2. **Tư tưởng Hồ Chí Minh về đạo đức cách mạng**
3. **Tư tưởng Hồ Chí Minh về đoàn kết quốc tế**
4. **Tư tưởng Hồ Chí Minh về văn hóa và giáo dục**

## Tài khoản mẫu

- **Admin**: `admin@debate.com` / `admin123`
- **Student 1**: `student1@debate.com` / `student123`
- **Student 2**: `student2@debate.com` / `student123`

## Tính năng chính

### 1. Quản lý chủ đề tranh luận
- Tạo, sửa, xóa chủ đề
- Phân quyền theo chủ sở hữu

### 2. Hệ thống câu hỏi
- Tạo câu hỏi cho từng chủ đề
- Quản lý câu hỏi

### 3. Tranh luận đa chiều
- Thêm luận điểm cho câu hỏi
- Phân quyền chỉnh sửa theo tác giả

### 4. Realtime Communication
- WebSocket cho cập nhật realtime
- Thông báo khi có câu hỏi/luận điểm mới
- Trạng thái typing

### 5. Authentication & Authorization
- JWT authentication
- Role-based access control
- User management

## Công nghệ sử dụng

- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL với Prisma ORM
- **Cache**: Redis
- **WebSocket**: Socket.IO
- **Authentication**: JWT
- **Containerization**: Docker
- **Validation**: class-validator

## Cấu trúc thư mục

```
src/
├── debate/                    # Debate module
│   ├── domain/               # Domain layer
│   │   ├── entities/         # Domain entities
│   │   └── repositories/     # Repository interfaces
│   ├── infrastructure/       # Infrastructure layer
│   │   └── *.repository.ts   # Prisma adapters
│   ├── dto/                  # Data Transfer Objects
│   ├── debate.controller.ts  # REST API controller
│   ├── debate.gateway.ts     # WebSocket gateway
│   ├── debate.service.ts     # Business logic
│   └── debate.module.ts      # Module definition
├── auth/                     # Authentication module
├── user/                     # User management
├── prisma/                   # Database service
└── common/                   # Shared utilities
```

## API Documentation

Sau khi chạy ứng dụng, truy cập:
- **API Docs**: `http://localhost:51213/api` (Swagger)
- **Health Check**: `http://localhost:51213/health`
- **WebSocket**: `ws://localhost:51213/debate`

## Phát triển thêm

### Thêm tính năng mới
1. Tạo entity trong `domain/entities/`
2. Tạo repository interface trong `domain/repositories/`
3. Implement repository trong `infrastructure/`
4. Tạo DTOs trong `dto/`
5. Thêm business logic vào service
6. Tạo controller endpoints
7. Thêm WebSocket events nếu cần

### Testing
```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Deployment

### Production Environment
1. Cập nhật environment variables
2. Build Docker image
3. Deploy với docker-compose.prod.yml
4. Chạy database migrations
5. Seed dữ liệu nếu cần

### Monitoring
- Health check endpoint
- Database connection monitoring
- Redis connection monitoring
- WebSocket connection tracking

## Liên hệ

Để được hỗ trợ hoặc đóng góp vào dự án, vui lòng liên hệ qua email hoặc tạo issue trên repository.
