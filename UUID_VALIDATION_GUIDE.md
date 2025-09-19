# 🔧 UUID Validation Guide

## ❌ Lỗi UUID Validation

Nếu bạn gặp lỗi:
```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

## ✅ Giải pháp

### 1. **Định dạng UUID đúng**
UUID phải có định dạng: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**❌ Sai:**
```
clx1234567890abcdef
1234567890abcdef
```

**✅ Đúng:**
```
123e4567-e89b-12d3-a456-426614174000
550e8400-e29b-41d4-a716-446655440000
6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

### 2. **Test UUID Validation**

Sử dụng endpoint test để kiểm tra UUID:
```http
GET /api/v1/debate/test-uuid/{your-uuid}
```

**Ví dụ:**
```http
GET /api/v1/debate/test-uuid/123e4567-e89b-12d3-a456-426614174000
```

### 3. **Các endpoint yêu cầu UUID**

#### Topic Endpoints:
- `GET /api/v1/debate/topics/{id}`
- `PATCH /api/v1/debate/topics/{id}`
- `DELETE /api/v1/debate/topics/{id}`
- `POST /api/v1/debate/topics/{topicId}/questions`
- `GET /api/v1/debate/topics/{topicId}/questions`

#### Question Endpoints:
- `GET /api/v1/debate/questions/{id}`
- `PATCH /api/v1/debate/questions/{id}`
- `DELETE /api/v1/debate/questions/{id}`
- `POST /api/v1/debate/questions/{questionId}/arguments`
- `GET /api/v1/debate/questions/{questionId}/arguments`

#### Argument Endpoints:
- `GET /api/v1/debate/arguments/{id}`
- `PATCH /api/v1/debate/arguments/{id}`
- `DELETE /api/v1/debate/arguments/{id}`

### 4. **Tạo UUID mới**

#### JavaScript/Node.js:
```javascript
const { v4: uuidv4 } = require('uuid');
const newUuid = uuidv4();
console.log(newUuid); // 123e4567-e89b-12d3-a456-426614174000
```

#### Online UUID Generator:
- https://www.uuidgenerator.net/
- https://www.uuid.org/

#### Command Line:
```bash
# Windows (PowerShell)
[System.Guid]::NewGuid()

# Linux/Mac
uuidgen
```

### 5. **Error Messages mới**

Với custom UUID validation pipe, bạn sẽ nhận được thông báo lỗi chi tiết hơn:

```json
{
  "message": "Invalid UUID format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, received: clx1234567890abcdef",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 6. **Frontend Integration**

#### React Example:
```javascript
import { v4 as uuidv4 } from 'uuid';

// Tạo UUID mới
const topicId = uuidv4();

// Gọi API
const response = await fetch(`/api/v1/debate/topics/${topicId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Validation trong Frontend:
```javascript
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Sử dụng
if (!isValidUUID(topicId)) {
  console.error('Invalid UUID format');
  return;
}
```

### 7. **Database UUID**

Nếu bạn đang sử dụng Prisma với PostgreSQL, UUID sẽ được tự động tạo:

```prisma
model Topic {
  id        String   @id @default(uuid()) @db.Uuid
  title     String
  createdAt DateTime @default(now())
}
```

### 8. **Troubleshooting**

#### Kiểm tra UUID trong database:
```sql
-- PostgreSQL
SELECT id, title FROM topics WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- Kiểm tra format UUID
SELECT id FROM topics WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
```

#### Log UUID trong API:
```javascript
console.log('Received UUID:', id);
console.log('UUID type:', typeof id);
console.log('UUID length:', id.length);
```

## 🎯 Tóm tắt

1. **Sử dụng định dạng UUID đúng**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. **Test với endpoint**: `/api/v1/debate/test-uuid/{uuid}`
3. **Sử dụng thư viện UUID**: `uuid` package cho JavaScript/Node.js
4. **Kiểm tra error messages**: Thông báo lỗi chi tiết hơn
5. **Validate trong frontend**: Kiểm tra format trước khi gửi API

Với những thay đổi này, UUID validation sẽ hoạt động chính xác và cung cấp thông báo lỗi rõ ràng hơn!
