# 🎯 Hệ Thống Debate Nâng Cao - Tính Năng Mới

## 📋 Tổng Quan

Hệ thống debate đã được mở rộng với nhiều tính năng mới để tạo ra một nền tảng tranh luận hoàn chỉnh cho môn Tư tưởng Hồ Chí Minh:

## 🗳️ 1. Hệ Thống Voting (Upvote/Downvote)

### Tính năng chính:
- **Vote luận điểm**: Users có thể upvote/downvote các luận điểm
- **Bỏ vote**: Có thể bỏ vote hoặc đổi loại vote
- **Tính điểm tự động**: Hệ thống tự động tính điểm (upvotes - downvotes)
- **Thống kê vote**: Xem chi tiết ai đã vote và loại vote

### API Endpoints:
```
POST   /debate/arguments/:argumentId/vote     - Vote cho luận điểm
DELETE /debate/arguments/:argumentId/vote     - Bỏ vote
GET    /debate/arguments/:argumentId/vote-stats - Thống kê vote
GET    /debate/arguments/top                  - Top luận điểm điểm cao
GET    /debate/arguments/trending             - Luận điểm trending
GET    /debate/my-votes                       - Vote của tôi
```

### Ví dụ sử dụng:
```json
// Vote upvote
POST /debate/arguments/123e4567-e89b-12d3-a456-426614174000/vote
{
  "argumentId": "123e4567-e89b-12d3-a456-426614174000",
  "voteType": "UPVOTE"
}
```

## ⏰ 2. Debate Sessions với Giới Hạn Thời Gian

### Tính năng chính:
- **Tạo session**: Tạo phiên tranh luận với thời gian cụ thể
- **Quản lý tham gia**: Giới hạn số lượng người tham gia
- **Giới hạn thời gian**: Thiết lập thời gian tối đa cho mỗi câu trả lời
- **Trạng thái session**: SCHEDULED, ACTIVE, PAUSED, ENDED, CANCELLED
- **Vai trò tham gia**: PARTICIPANT, MODERATOR, OBSERVER

### API Endpoints:
```
POST   /debate/sessions                       - Tạo session mới
GET    /debate/sessions                       - Danh sách sessions
GET    /debate/sessions/:id                   - Chi tiết session
PATCH  /debate/sessions/:id                   - Cập nhật session
POST   /debate/sessions/:id/join              - Tham gia session
POST   /debate/sessions/:id/leave             - Rời khỏi session
POST   /debate/sessions/:id/start             - Bắt đầu session
POST   /debate/sessions/:id/end               - Kết thúc session
GET    /debate/sessions/:id/participants      - Danh sách tham gia
GET    /debate/sessions/:id/time-remaining    - Thời gian còn lại
```

### Ví dụ tạo session:
```json
POST /debate/sessions
{
  "topicId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Tranh luận về Tư tưởng Hồ Chí Minh - Buổi 1",
  "description": "Buổi tranh luận đầu tiên về tư tưởng độc lập dân tộc",
  "startTime": "2024-01-20T14:00:00Z",
  "endTime": "2024-01-20T16:00:00Z",
  "timeLimit": 5,
  "maxParticipants": 10
}
```

## 📊 3. Hệ Thống Đánh Giá Sau Debate

### Tính năng chính:
- **Đánh giá participant**: Đánh giá từng người tham gia sau khi session kết thúc
- **Điểm số 1-10**: Hệ thống chấm điểm từ 1 đến 10
- **Đánh giá chi tiết**: Phản hồi và đánh giá theo nhiều tiêu chí
- **Thống kê đánh giá**: Xem điểm trung bình và phân tích
- **Top participants**: Xếp hạng người tham gia có điểm cao nhất

### API Endpoints:
```
POST   /debate/evaluations                    - Tạo đánh giá
PATCH  /debate/evaluations/:id                - Cập nhật đánh giá
DELETE /debate/evaluations/:id                - Xóa đánh giá
GET    /debate/sessions/:sessionId/evaluations/participant/:participantId - Đánh giá của participant
GET    /debate/sessions/:sessionId/evaluations/my - Đánh giá của tôi
GET    /debate/sessions/:sessionId/evaluation-stats - Thống kê đánh giá session
GET    /debate/evaluations/top-participants   - Top participants
```

### Ví dụ tạo đánh giá:
```json
POST /debate/evaluations
{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "participantId": "123e4567-e89b-12d3-a456-426614174000",
  "score": 8,
  "feedback": "Luận điểm rất sắc bén và có tính thuyết phục cao.",
  "criteria": {
    "logic": 8,
    "evidence": 7,
    "presentation": 9,
    "engagement": 8,
    "originality": 6
  }
}
```

## 📈 4. Thống Kê Tổng Quan

### API Endpoint:
```
GET    /debate/stats                          - Thống kê tổng quan hệ thống
```

### Thông tin thống kê:
- Tổng số chủ đề, câu hỏi, luận điểm
- Số debate sessions đang hoạt động
- Tổng số vote và đánh giá
- Điểm trung bình của tất cả đánh giá

## 🔄 5. Workflow Tranh Luận Hoàn Chỉnh

### Quy trình tranh luận:

1. **Tạo chủ đề** → Admin/User tạo chủ đề về Tư tưởng Hồ Chí Minh
2. **Tạo câu hỏi** → Đặt câu hỏi cụ thể trong chủ đề
3. **Tạo debate session** → Lên lịch phiên tranh luận với thời gian cụ thể
4. **Tham gia session** → Users đăng ký tham gia với vai trò
5. **Bắt đầu tranh luận** → Moderator bắt đầu session
6. **Đưa ra luận điểm** → Participants đưa ra luận điểm (có giới hạn thời gian)
7. **Vote luận điểm** → Mọi người vote cho các luận điểm
8. **Kết thúc session** → Moderator kết thúc phiên tranh luận
9. **Đánh giá** → Participants đánh giá lẫn nhau
10. **Xem kết quả** → Xem thống kê và xếp hạng

## 🎯 6. Các Tính Năng Nổi Bật

### ⏱️ Giới Hạn Thời Gian Thông Minh:
- Kiểm tra thời gian còn lại để trả lời
- Tự động cập nhật trạng thái session
- Thông báo khi hết thời gian

### 🏆 Hệ Thống Điểm Số:
- Điểm vote: upvotes - downvotes
- Điểm đánh giá: trung bình từ 1-10
- Xếp hạng top participants
- Thống kê chi tiết theo tiêu chí

### 👥 Quản Lý Tham Gia:
- Vai trò rõ ràng: Participant, Moderator, Observer
- Giới hạn số lượng tham gia
- Theo dõi thời gian tham gia/rời khỏi

### 📊 Phân Tích Dữ Liệu:
- Luận điểm trending
- Top luận điểm điểm cao
- Thống kê session chi tiết
- Báo cáo đánh giá

## 🚀 7. Cách Sử Dụng

### Bước 1: Tạo Debate Session
```bash
curl -X POST http://localhost:3000/debate/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "topic-uuid",
    "title": "Tranh luận về Tư tưởng Hồ Chí Minh",
    "startTime": "2024-01-20T14:00:00Z",
    "timeLimit": 5,
    "maxParticipants": 10
  }'
```

### Bước 2: Tham Gia Session
```bash
curl -X POST http://localhost:3000/debate/sessions/session-uuid/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "PARTICIPANT"}'
```

### Bước 3: Vote Luận Điểm
```bash
curl -X POST http://localhost:3000/debate/arguments/argument-uuid/vote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voteType": "UPVOTE"}'
```

### Bước 4: Đánh Giá Sau Khi Kết Thúc
```bash
curl -X POST http://localhost:3000/debate/evaluations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-uuid",
    "participantId": "participant-uuid",
    "score": 8,
    "feedback": "Luận điểm rất tốt!"
  }'
```

## 🎉 Kết Luận

Hệ thống debate đã được nâng cấp thành một nền tảng tranh luận hoàn chỉnh với:
- ✅ Hệ thống vote thông minh
- ✅ Quản lý session với giới hạn thời gian
- ✅ Đánh giá và xếp hạng participants
- ✅ Thống kê và phân tích chi tiết
- ✅ Workflow tranh luận hoàn chỉnh

Tất cả các tính năng đều được tích hợp với Swagger documentation và có thể test ngay qua API endpoints.
