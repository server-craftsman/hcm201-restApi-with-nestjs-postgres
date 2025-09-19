# 🔄 UUID Migration Guide

## ❌ Vấn đề hiện tại

ID đang được tạo với format CUID thay vì UUID:
```json
{
  "id": "cmfqbkyiy0001l0f4d48c5x3e"  // ❌ CUID format
}
```

## ✅ Giải pháp

### **Option 1: Migration an toàn (Khuyến nghị)**

#### **Bước 1: Chạy migration script**
```bash
# Windows
scripts\migrate-to-uuid.bat

# Linux/Mac
chmod +x scripts/migrate-to-uuid.sh
./scripts/migrate-to-uuid.sh
```

#### **Bước 2: Kiểm tra kết quả**
```bash
npx prisma generate
npx prisma db seed
```

### **Option 2: Reset database (Mất dữ liệu)**

Nếu bạn không cần giữ dữ liệu cũ:

```bash
npx prisma migrate reset --force
npx prisma db seed
```

## 🎯 Kết quả mong đợi

Sau khi migration, ID sẽ có format UUID:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"  // ✅ UUID format
}
```

## 📋 Chi tiết thay đổi

### **Prisma Schema đã được cập nhật:**

```prisma
model User {
  id          String     @id @default(uuid()) @db.Uuid
  // ... other fields
}

model Topic {
  id          String     @id @default(uuid()) @db.Uuid
  // ... other fields
}

model Question {
  id        String   @id @default(uuid()) @db.Uuid
  // ... other fields
}

model Argument {
  id          String   @id @default(uuid()) @db.Uuid
  // ... other fields
}
```

### **Migration Script sẽ:**

1. ✅ **Thêm cột UUID mới** cho tất cả bảng
2. ✅ **Tạo UUID** cho các record hiện có
3. ✅ **Cập nhật foreign key** references
4. ✅ **Xóa cột CUID cũ**
5. ✅ **Đổi tên cột mới** thành tên gốc
6. ✅ **Thêm constraints** và indexes

## 🧪 Test sau migration

### **1. Test tạo Topic mới:**
```http
POST /api/v1/debate/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test UUID Topic",
  "description": "Testing UUID format"
}
```

**Expected Response:**
```json
{
  "statusCode": 201,
  "message": "Created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",  // ✅ UUID format
    "title": "Test UUID Topic",
    "description": "Testing UUID format",
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",  // ✅ UUID format
    "createdAt": "2025-09-19T04:08:39.369Z"
  }
}
```

### **2. Test UUID validation:**
```http
GET /api/v1/debate/test-uuid/123e4567-e89b-12d3-a456-426614174000
```

**Expected Response:**
```json
{
  "message": "UUID is valid",
  "uuid": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 🔧 Troubleshooting

### **Lỗi: "Drift detected"**
```bash
# Reset migration history
npx prisma migrate reset --force
npx prisma db seed
```

### **Lỗi: "Foreign key constraint"**
```bash
# Drop và recreate database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
npx prisma migrate dev
npx prisma db seed
```

### **Lỗi: "UUID extension not found"**
```sql
-- Chạy trong PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 📊 So sánh format

| Format | Example | Length | Description |
|--------|---------|--------|-------------|
| **CUID** | `cmfqbkyiy0001l0f4d48c5x3e` | 25 chars | Collision-resistant unique identifier |
| **UUID** | `123e4567-e89b-12d3-a456-426614174000` | 36 chars | Universally unique identifier |

## 🎉 Lợi ích của UUID

1. ✅ **Standard format** - Được hỗ trợ rộng rãi
2. ✅ **Better validation** - Regex validation dễ dàng
3. ✅ **Database compatibility** - PostgreSQL native support
4. ✅ **Frontend friendly** - Dễ xử lý trong JavaScript
5. ✅ **API documentation** - Swagger examples chuẩn

## 🚀 Sau khi migration

1. ✅ **Tất cả ID mới** sẽ có format UUID
2. ✅ **UUID validation** sẽ hoạt động chính xác
3. ✅ **Swagger documentation** sẽ hiển thị examples đúng
4. ✅ **Frontend integration** sẽ dễ dàng hơn
5. ✅ **Database queries** sẽ hiệu quả hơn

Chạy migration script để chuyển đổi sang UUID format!
