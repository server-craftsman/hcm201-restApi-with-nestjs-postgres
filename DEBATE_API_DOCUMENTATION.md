# 📚 Debate System API Documentation

## 🎯 Tổng quan

Hệ thống Debate API cung cấp các endpoint để quản lý tranh luận có cấu trúc với 3 thành phần chính:
- **Topic** (Chủ đề): Chủ đề tranh luận chính
- **Question** (Câu hỏi): Câu hỏi cụ thể trong chủ đề  
- **Argument** (Luận điểm): Ý kiến, quan điểm về câu hỏi

## 🔐 Authentication

Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

## 📋 API Endpoints

### 🏷️ Topic Management

#### 1. Tạo chủ đề mới
```http
POST /api/v1/debate/topics
```

**Request Body:**
```json
{
  "title": "Tư tưởng Hồ Chí Minh về độc lập dân tộc",
  "description": "Thảo luận về quan điểm của Hồ Chí Minh về việc giành và giữ độc lập dân tộc trong bối cảnh lịch sử Việt Nam"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Tư tưởng Hồ Chí Minh về độc lập dân tộc",
  "description": "Thảo luận về quan điểm của Hồ Chí Minh...",
  "ownerId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Lấy danh sách tất cả chủ đề
```http
GET /api/v1/debate/topics
```

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Tư tưởng Hồ Chí Minh về độc lập dân tộc",
    "description": "Thảo luận về quan điểm của Hồ Chí Minh...",
    "ownerId": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### 3. Lấy chủ đề của tôi
```http
GET /api/v1/debate/topics/my
```

#### 4. Lấy chi tiết chủ đề
```http
GET /api/v1/debate/topics/{id}
```

#### 5. Cập nhật chủ đề
```http
PATCH /api/v1/debate/topics/{id}
```

**Request Body:**
```json
{
  "title": "Tư tưởng Hồ Chí Minh về độc lập dân tộc (Đã cập nhật)",
  "description": "Thảo luận chi tiết về quan điểm của Hồ Chí Minh..."
}
```

#### 6. Xóa chủ đề
```http
DELETE /api/v1/debate/topics/{id}
```

**Response (200):**
```json
{
  "message": "Topic deleted successfully"
}
```

### ❓ Question Management

#### 1. Tạo câu hỏi mới
```http
POST /api/v1/debate/topics/{topicId}/questions
```

**Request Body:**
```json
{
  "content": "Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc trong cuộc đấu tranh giải phóng dân tộc?"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc...",
  "topicId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Lấy danh sách câu hỏi theo chủ đề
```http
GET /api/v1/debate/topics/{topicId}/questions
```

#### 3. Lấy chi tiết câu hỏi
```http
GET /api/v1/debate/questions/{id}
```

#### 4. Cập nhật câu hỏi
```http
PATCH /api/v1/debate/questions/{id}
```

**Request Body:**
```json
{
  "content": "Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc trong cuộc đấu tranh giải phóng dân tộc? (Đã cập nhật)"
}
```

#### 5. Xóa câu hỏi
```http
DELETE /api/v1/debate/questions/{id}
```

### 💬 Argument Management

#### 1. Tạo luận điểm mới
```http
POST /api/v1/debate/questions/{questionId}/arguments
```

**Request Body:**
```json
{
  "body": "Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo thông qua việc kết hợp đấu tranh chính trị với đấu tranh vũ trang, tạo nên sức mạnh tổng hợp để đánh bại các thế lực thực dân và đế quốc."
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "body": "Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc...",
  "authorId": "123e4567-e89b-12d3-a456-426614174000",
  "questionId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Lấy danh sách luận điểm theo câu hỏi
```http
GET /api/v1/debate/questions/{questionId}/arguments
```

#### 3. Lấy luận điểm của tôi
```http
GET /api/v1/debate/arguments/my
```

#### 4. Lấy chi tiết luận điểm
```http
GET /api/v1/debate/arguments/{id}
```

#### 5. Cập nhật luận điểm
```http
PATCH /api/v1/debate/arguments/{id}
```

**Request Body:**
```json
{
  "body": "Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo... (Đã cập nhật)"
}
```

#### 6. Xóa luận điểm
```http
DELETE /api/v1/debate/arguments/{id}
```

## 🌐 WebSocket Events

### Kết nối
```javascript
const socket = io('ws://localhost:51213/debate', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### 1. Tham gia/Rời khỏi Topic
```javascript
// Tham gia
socket.emit('joinTopic', { topicId: 'topic_id' });
socket.on('joinedTopic', (data) => {
  console.log('Đã tham gia topic:', data.topicId);
});

// Rời khỏi
socket.emit('leaveTopic', { topicId: 'topic_id' });
socket.on('leftTopic', (data) => {
  console.log('Đã rời khỏi topic:', data.topicId);
});
```

#### 2. Tạo câu hỏi mới (Real-time)
```javascript
// Gửi câu hỏi mới
socket.emit('newQuestion', {
  topicId: 'topic_id',
  question: { content: 'Nội dung câu hỏi' },
  userId: 'user_id'
});

// Nhận thông báo câu hỏi mới
socket.on('questionAdded', (data) => {
  console.log('Câu hỏi mới:', data.question);
});
```

#### 3. Tạo luận điểm mới (Real-time)
```javascript
// Gửi luận điểm mới
socket.emit('newArgument', {
  questionId: 'question_id',
  argument: { body: 'Nội dung luận điểm' },
  userId: 'user_id'
});

// Nhận thông báo luận điểm mới
socket.on('argumentAdded', (data) => {
  console.log('Luận điểm mới:', data.argument);
});
```

#### 4. Trạng thái đang gõ
```javascript
// Gửi trạng thái đang gõ
socket.emit('typing', {
  topicId: 'topic_id',
  userId: 'user_id',
  isTyping: true
});

// Nhận thông báo ai đang gõ
socket.on('userTyping', (data) => {
  console.log('User đang gõ:', data.userId, data.isTyping);
});
```

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Dữ liệu đầu vào không hợp lệ |
| 401 | Unauthorized - Chưa xác thực hoặc token không hợp lệ |
| 403 | Forbidden - Không có quyền thực hiện thao tác |
| 404 | Not Found - Không tìm thấy resource |

## 🔒 Authorization Rules

### Topic
- **Create**: Mọi user đã xác thực
- **Read**: Mọi user đã xác thực
- **Update**: Chỉ chủ sở hữu
- **Delete**: Chỉ chủ sở hữu

### Question
- **Create**: Mọi user đã xác thực
- **Read**: Mọi user đã xác thực
- **Update**: Mọi user đã xác thực
- **Delete**: Mọi user đã xác thực

### Argument
- **Create**: Mọi user đã xác thực
- **Read**: Mọi user đã xác thực
- **Update**: Chỉ tác giả
- **Delete**: Chỉ tác giả

## 🚀 Frontend Integration Example

### React Hook
```javascript
const useDebate = (topicId) => {
  const [questions, setQuestions] = useState([]);
  const [arguments, setArguments] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const socket = io('/debate');
    
    socket.emit('joinTopic', { topicId });
    
    socket.on('questionAdded', (data) => {
      setQuestions(prev => [...prev, data.question]);
    });
    
    socket.on('argumentAdded', (data) => {
      setArguments(prev => [...prev, data.argument]);
    });
    
    socket.on('userTyping', (data) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return [...prev.filter(u => u !== data.userId), data.userId];
        } else {
          return prev.filter(u => u !== data.userId);
        }
      });
    });

    return () => {
      socket.emit('leaveTopic', { topicId });
      socket.disconnect();
    };
  }, [topicId]);

  return { questions, arguments, typingUsers };
};
```

### API Calls
```javascript
// Tạo chủ đề mới
const createTopic = async (topicData) => {
  const response = await fetch('/api/v1/debate/topics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(topicData)
  });
  return response.json();
};

// Tạo câu hỏi mới
const createQuestion = async (topicId, questionData) => {
  const response = await fetch(`/api/v1/debate/topics/${topicId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(questionData)
  });
  return response.json();
};

// Tạo luận điểm mới
const createArgument = async (questionId, argumentData) => {
  const response = await fetch(`/api/v1/debate/questions/${questionId}/arguments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(argumentData)
  });
  return response.json();
};
```

## 📝 Validation Rules

### Topic
- `title`: Required, max 200 characters
- `description`: Optional, max 1000 characters

### Question
- `content`: Required, max 500 characters

### Argument
- `body`: Required, max 2000 characters

## 🔄 Real-time Features

1. **Live Updates**: Tất cả câu hỏi và luận điểm mới được gửi real-time
2. **Typing Indicators**: Hiển thị ai đang gõ
3. **Room-based Broadcasting**: Chỉ gửi thông báo cho user trong cùng topic
4. **Connection Management**: Tự động join/leave topic rooms

## 🛠️ Development Tools

- **Swagger UI**: `/swagger-ui` - Interactive API documentation
- **WebSocket Testing**: Sử dụng Socket.IO client tools
- **Database**: PostgreSQL với Prisma ORM
- **Real-time**: Socket.IO với Redis adapter (optional)

Hệ thống Debate API được thiết kế để hỗ trợ tranh luận có cấu trúc, tương tác real-time và trải nghiệm người dùng mượt mà cho nhiều người tham gia cùng lúc.
