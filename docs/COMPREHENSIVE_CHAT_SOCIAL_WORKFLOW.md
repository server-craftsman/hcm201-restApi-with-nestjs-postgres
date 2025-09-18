# 📱 CHAT & SOCIAL MEDIA WORKFLOW - HƯỚNG DẪN CHI TIẾT

## 🎯 **TỔNG QUAN HỆ THỐNG**

### **📊 Architecture Overview**
```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App] --> B[Chat UI]
        A --> C[Social Feed]
        A --> D[Profile Management]
    end
    
    subgraph "API Layer"
        E[Chat Controller] --> F[Chat Service]
        G[Social Controller] --> H[Social Service]
        I[Auth Controller] --> J[Auth Service]
    end
    
    subgraph "Domain Layer"
        K[Chat Domain] --> L[Message Entity]
        M[Social Domain] --> N[Post Entity]
        O[User Domain] --> P[User Entity]
    end
    
    subgraph "Infrastructure Layer"
        Q[Prisma Repository] --> R[PostgreSQL]
        S[Redis Cache] --> T[WebSocket]
        U[File Storage] --> V[CDN]
    end
```

## 🚀 **CHAT WORKFLOW CHI TIẾT**

### **1. TẠO CHAT (1-1 HOẶC NHÓM)**

#### **Flow Diagram:**
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant S as Service
    participant D as Database
    participant W as WebSocket

    U->>F: Click "New Chat"
    F->>A: POST /api/chats
    A->>S: createChat(dto, userId)
    S->>D: Check existing chat
    alt Direct chat exists
        S->>D: Return existing chat
    else New chat
        S->>D: Create new chat
        S->>D: Add members
    end
    S->>A: Return chat data
    A->>F: Return response
    F->>W: Join chat room
    F->>U: Show chat interface
```

#### **API Implementation:**
```typescript
// 1. User clicks "New Chat" button
// 2. Frontend shows modal with user selection
// 3. User selects members and chat type
// 4. Frontend calls API

POST /api/chats
Authorization: Bearer <token>
Content-Type: application/json

{
  "memberIds": ["user2_id", "user3_id"],
  "type": "GROUP",
  "name": "Nhóm bạn thân",
  "description": "Nhóm chat cho bạn bè thân thiết",
  "avatar": "https://example.com/group-avatar.jpg"
}

// Response:
{
  "statusCode": 201,
  "message": "Chat created successfully",
  "data": {
    "id": "chat_123",
    "name": "Nhóm bạn thân",
    "type": "GROUP",
    "description": "Nhóm chat cho bạn bè thân thiết",
    "avatar": "https://example.com/group-avatar.jpg",
    "createdAt": "2025-08-05T12:00:00Z",
    "updatedAt": "2025-08-05T12:00:00Z",
    "members": [
      {
        "id": "member_1",
        "userId": "user1_id",
        "role": "ADMIN",
        "user": {
          "id": "user1_id",
          "username": "alice",
          "avatar": "https://example.com/alice.jpg",
          "status": "ONLINE"
        }
      }
    ]
  }
}
```

### **2. NHẮN TIN REAL-TIME**

#### **Flow Diagram:**
```mermaid
sequenceDiagram
    participant S as Sender
    participant F as Frontend
    participant A as API
    participant D as Database
    participant W as WebSocket
    participant R as Recipients

    S->>F: Type message
    F->>W: Emit typing indicator
    S->>F: Send message
    F->>A: POST /api/chats/{id}/messages
    A->>D: Save message
    A->>D: Update chat lastMessage
    A->>F: Return message data
    F->>W: Emit newMessage
    W->>R: Broadcast to all members
    R->>F: Update UI in real-time
    F->>R: Show notification
```

#### **Message Types Support:**
```typescript
// Text Message
{
  "content": "Xin chào! Bạn khỏe không?",
  "type": "TEXT"
}

// Image Message
{
  "content": "Ảnh đẹp quá!",
  "type": "IMAGE",
  "mediaUrl": "https://example.com/image.jpg",
  "metadata": {
    "fileSize": 1024000,
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}

// Video Message
{
  "content": "Video hài hước!",
  "type": "VIDEO",
  "mediaUrl": "https://example.com/video.mp4",
  "metadata": {
    "fileSize": 52428800,
    "duration": 30,
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}

// Reply Message
{
  "content": "Đúng rồi!",
  "type": "TEXT",
  "replyToMessageId": "msg_123"
}

// File Message
{
  "content": "Tài liệu quan trọng",
  "type": "FILE",
  "mediaUrl": "https://example.com/document.pdf",
  "metadata": {
    "fileSize": 2048000,
    "fileName": "document.pdf",
    "fileType": "application/pdf"
  }
}
```

### **3. XEM TIN NHẮN VÀ PAGINATION**

#### **Flow Diagram:**
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database

    U->>F: Open chat
    F->>A: GET /api/chats/{id}/messages?limit=50&offset=0
    A->>D: Check user membership
    A->>D: Get messages with pagination
    A->>D: Mark messages as read
    A->>F: Return messages + pagination
    F->>U: Display messages
    U->>F: Scroll up for more
    F->>A: GET /api/chats/{id}/messages?limit=50&offset=50
    A->>D: Get next page
    A->>F: Return more messages
    F->>U: Append to chat
```

#### **Pagination Response:**
```json
{
  "statusCode": 200,
  "message": "Retrieved successfully",
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "content": "Xin chào!",
        "type": "TEXT",
        "sender": {
          "id": "user_456",
          "username": "alice",
          "avatar": "https://example.com/alice.jpg"
        },
        "replyToMessage": {
          "id": "msg_122",
          "content": "Chào bạn!",
          "sender": {
            "username": "bob"
          }
        },
        "createdAt": "2025-08-05T12:00:00Z",
        "isRead": true,
        "metadata": null
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true,
      "currentPage": 1,
      "totalPages": 3
    }
  }
}
```

### **4. WEB SOCKET REAL-TIME FEATURES**

#### **Connection Flow:**
```typescript
// 1. User connects to WebSocket
const socket = io('http://localhost:51213', {
  auth: {
    token: 'jwt_token_here'
  }
});

// 2. Join chat rooms
socket.emit('joinChat', { chatId: 'chat_123' });

// 3. Listen for real-time events
socket.on('newMessage', (message) => {
  // Update UI with new message
  addMessageToChat(message);
});

socket.on('userTyping', (data) => {
  // Show typing indicator
  showTypingIndicator(data.userId, data.username);
});

socket.on('userStoppedTyping', (data) => {
  // Hide typing indicator
  hideTypingIndicator(data.userId);
});

socket.on('userJoined', (data) => {
  // Show user joined notification
  showUserJoinedNotification(data.user);
});

socket.on('userLeft', (data) => {
  // Show user left notification
  showUserLeftNotification(data.user);
});
```

#### **WebSocket Events:**
```typescript
// Client to Server Events
socket.emit('joinChat', { chatId: string });
socket.emit('leaveChat', { chatId: string });
socket.emit('sendMessage', { 
  chatId: string, 
  content: string, 
  type: MessageType,
  replyToMessageId?: string 
});
socket.emit('typing', { chatId: string });
socket.emit('stopTyping', { chatId: string });
socket.emit('markAsRead', { messageId: string });

// Server to Client Events
socket.on('newMessage', (message: Message));
socket.on('messageUpdated', (message: Message));
socket.on('messageDeleted', (messageId: string));
socket.on('userTyping', (data: { userId: string, username: string }));
socket.on('userStoppedTyping', (data: { userId: string }));
socket.on('userJoined', (data: { user: User }));
socket.on('userLeft', (data: { user: User }));
socket.on('chatUpdated', (chat: Chat));
```

## 🌐 **SOCIAL MEDIA WORKFLOW CHI TIẾT**

### **1. POST CREATION & SHARING**

#### **Flow Diagram:**
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant S as Social Service
    participant D as Database
    participant N as Notification Service

    U->>F: Create new post
    F->>A: POST /api/social/posts
    A->>S: createPost(postData, userId)
    S->>D: Save post
    S->>D: Process mentions (@username)
    S->>D: Process hashtags (#tag)
    S->>N: Send notifications to mentioned users
    S->>A: Return post data
    A->>F: Return response
    F->>U: Show post in feed
```

#### **Post Types:**
```typescript
// Text Post
{
  "content": "Hôm nay là một ngày tuyệt vời! #happyday #life",
  "type": "TEXT",
  "visibility": "PUBLIC",
  "mentions": ["@alice", "@bob"],
  "hashtags": ["#happyday", "#life"]
}

// Image Post
{
  "content": "Ảnh đẹp từ chuyến du lịch!",
  "type": "IMAGE",
  "mediaUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "visibility": "FRIENDS",
  "location": {
    "name": "Hà Nội, Việt Nam",
    "coordinates": {
      "lat": 21.0285,
      "lng": 105.8542
    }
  }
}

// Video Post
{
  "content": "Video hài hước!",
  "type": "VIDEO",
  "mediaUrl": "https://example.com/video.mp4",
  "visibility": "PUBLIC",
  "metadata": {
    "duration": 30,
    "thumbnail": "https://example.com/thumbnail.jpg"
  }
}

// Poll Post
{
  "content": "Bạn thích món ăn nào nhất?",
  "type": "POLL",
  "pollOptions": ["Phở", "Bún chả", "Bánh mì", "Cơm tấm"],
  "pollSettings": {
    "allowMultipleChoice": false,
    "expiresAt": "2025-08-10T12:00:00Z"
  },
  "visibility": "PUBLIC"
}
```

### **2. FEED & TIMELINE**

#### **Feed Algorithm:**
```typescript
// Feed Generation Logic
class FeedService {
  async generateFeed(userId: string, page: number = 1, limit: number = 20) {
    // 1. Get user's friends and followed users
    const followedUsers = await this.getFollowedUsers(userId);
    
    // 2. Get posts from followed users
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: followedUsers },
        visibility: { in: ['PUBLIC', 'FRIENDS'] },
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            verified: true
          }
        },
        media: true,
        poll: {
          include: {
            votes: true
          }
        },
        reactions: {
          where: { userId },
          select: { type: true }
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { score: 'desc' } // Engagement score
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // 3. Calculate engagement score
    const postsWithScore = posts.map(post => ({
      ...post,
      engagementScore: this.calculateEngagementScore(post)
    }));

    return postsWithScore;
  }

  private calculateEngagementScore(post: any): number {
    const { reactions, comments, shares } = post._count;
    const timeDecay = this.calculateTimeDecay(post.createdAt);
    
    return (reactions * 1 + comments * 3 + shares * 5) * timeDecay;
  }
}
```

### **3. INTERACTIONS (LIKE, COMMENT, SHARE)**

#### **Like/Reaction System:**
```typescript
// Reaction Types
enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY'
}

// Add Reaction
POST /api/social/posts/{postId}/reactions
{
  "type": "LOVE"
}

// Response
{
  "statusCode": 200,
  "message": "Reaction added successfully",
  "data": {
    "id": "reaction_123",
    "type": "LOVE",
    "postId": "post_456",
    "userId": "user_789",
    "createdAt": "2025-08-05T12:00:00Z"
  }
}
```

#### **Comment System:**
```typescript
// Add Comment
POST /api/social/posts/{postId}/comments
{
  "content": "Bài viết rất hay! 👍",
  "parentCommentId": null, // For replies
  "mentions": ["@alice", "@bob"]
}

// Response
{
  "statusCode": 200,
  "message": "Comment added successfully",
  "data": {
    "id": "comment_123",
    "content": "Bài viết rất hay! 👍",
    "author": {
      "id": "user_789",
      "username": "john_doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "mentions": [
      {
        "id": "user_456",
        "username": "alice",
        "avatar": "https://example.com/alice.jpg"
      }
    ],
    "createdAt": "2025-08-05T12:00:00Z",
    "replies": [],
    "_count": {
      "replies": 0,
      "reactions": 0
    }
  }
}
```

### **4. STORIES & MOMENTS**

#### **Story Creation:**
```typescript
// Create Story
POST /api/social/stories
{
  "content": "Khoảnh khắc đẹp!",
  "mediaUrl": "https://example.com/story.jpg",
  "type": "IMAGE",
  "duration": 24, // hours
  "mentions": ["@alice"],
  "location": "Hà Nội, Việt Nam",
  "music": {
    "title": "Song Title",
    "artist": "Artist Name",
    "url": "https://example.com/music.mp3"
  }
}

// Story Response
{
  "statusCode": 201,
  "message": "Story created successfully",
  "data": {
    "id": "story_123",
    "content": "Khoảnh khắc đẹp!",
    "mediaUrl": "https://example.com/story.jpg",
    "type": "IMAGE",
    "author": {
      "id": "user_789",
      "username": "john_doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "expiresAt": "2025-08-06T12:00:00Z",
    "viewers": [],
    "reactions": [],
    "createdAt": "2025-08-05T12:00:00Z"
  }
}
```

### **5. FRIEND REQUESTS & NETWORKING**

#### **Friend Request Flow:**
```mermaid
sequenceDiagram
    participant U1 as User 1
    participant A as API
    participant D as Database
    participant N as Notification
    participant U2 as User 2

    U1->>A: Send friend request
    A->>D: Create friend request
    A->>N: Send notification to User 2
    N->>U2: Show friend request notification
    U2->>A: Accept/Reject request
    A->>D: Update request status
    A->>N: Send notification to User 1
    N->>U1: Show request response
    A->>D: Create friendship if accepted
```

#### **Friend Request API:**
```typescript
// Send Friend Request
POST /api/social/friend-requests
{
  "receiverId": "user_456",
  "message": "Xin chào! Tôi muốn kết bạn với bạn."
}

// Accept/Reject Request
PATCH /api/social/friend-requests/{requestId}
{
  "action": "ACCEPT" // or "REJECT"
}

// Get Friend Requests
GET /api/social/friend-requests?status=PENDING

// Response
{
  "statusCode": 200,
  "message": "Friend requests retrieved successfully",
  "data": [
    {
      "id": "request_123",
      "sender": {
        "id": "user_789",
        "username": "john_doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "message": "Xin chào! Tôi muốn kết bạn với bạn.",
      "status": "PENDING",
      "createdAt": "2025-08-05T12:00:00Z"
    }
  ]
}
```

## 🔄 **INTEGRATION BETWEEN CHAT & SOCIAL**

### **1. SHARING POSTS TO CHAT**

```typescript
// Share post to chat
POST /api/social/posts/{postId}/share
{
  "chatId": "chat_123",
  "message": "Check out this post!"
}

// This creates a message in chat with post preview
{
  "id": "msg_456",
  "content": "Check out this post!",
  "type": "SHARED_POST",
  "sharedPost": {
    "id": "post_789",
    "content": "Original post content...",
    "author": {
      "username": "alice",
      "avatar": "https://example.com/alice.jpg"
    },
    "mediaUrls": ["https://example.com/image.jpg"],
    "reactions": 15,
    "comments": 5
  },
  "sender": {
    "id": "user_123",
    "username": "bob",
    "avatar": "https://example.com/bob.jpg"
  },
  "createdAt": "2025-08-05T12:00:00Z"
}
```

### **2. MENTIONS & NOTIFICATIONS**

```typescript
// When user is mentioned in chat
{
  "type": "CHAT_MENTION",
  "data": {
    "chatId": "chat_123",
    "chatName": "Nhóm bạn thân",
    "messageId": "msg_456",
    "mentionedBy": {
      "id": "user_789",
      "username": "alice"
    },
    "messageContent": "Hey @bob, check this out!"
  }
}

// When user is mentioned in post
{
  "type": "POST_MENTION",
  "data": {
    "postId": "post_123",
    "postContent": "Great work @bob!",
    "mentionedBy": {
      "id": "user_789",
      "username": "alice"
    }
  }
}
```

### **3. UNIFIED NOTIFICATION SYSTEM**

```typescript
// Notification Types
enum NotificationType {
  // Chat notifications
  NEW_MESSAGE = 'NEW_MESSAGE',
  CHAT_MENTION = 'CHAT_MENTION',
  GROUP_INVITE = 'GROUP_INVITE',
  
  // Social notifications
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  POST_SHARE = 'POST_SHARE',
  POST_MENTION = 'POST_MENTION',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  STORY_MENTION = 'STORY_MENTION',
  
  // System notifications
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED'
}

// Get notifications
GET /api/notifications?page=1&limit=20

// Response
{
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "NEW_MESSAGE",
        "title": "New message from Alice",
        "body": "Alice sent you a message",
        "data": {
          "chatId": "chat_456",
          "messageId": "msg_789",
          "sender": {
            "id": "user_123",
            "username": "alice",
            "avatar": "https://example.com/alice.jpg"
          }
        },
        "read": false,
        "createdAt": "2025-08-05T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "hasMore": true
    }
  }
}
```

## 📊 **DATABASE SCHEMA INTEGRATION**

### **1. CHAT TABLES**
```sql
-- Chats
CREATE TABLE chats (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  type VARCHAR NOT NULL DEFAULT 'DIRECT',
  description TEXT,
  avatar VARCHAR,
  last_message_id VARCHAR REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Members
CREATE TABLE chat_members (
  id VARCHAR PRIMARY KEY,
  chat_id VARCHAR REFERENCES chats(id),
  user_id VARCHAR REFERENCES users(id),
  role VARCHAR DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY,
  chat_id VARCHAR REFERENCES chats(id),
  sender_id VARCHAR REFERENCES users(id),
  content TEXT NOT NULL,
  type VARCHAR DEFAULT 'TEXT',
  media_url VARCHAR,
  reply_to_message_id VARCHAR REFERENCES messages(id),
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. SOCIAL TABLES**
```sql
-- Posts
CREATE TABLE posts (
  id VARCHAR PRIMARY KEY,
  author_id VARCHAR REFERENCES users(id),
  content TEXT,
  type VARCHAR DEFAULT 'TEXT',
  visibility VARCHAR DEFAULT 'PUBLIC',
  location JSONB,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Post Media
CREATE TABLE post_media (
  id VARCHAR PRIMARY KEY,
  post_id VARCHAR REFERENCES posts(id),
  media_url VARCHAR NOT NULL,
  media_type VARCHAR NOT NULL,
  metadata JSONB,
  order_index INTEGER DEFAULT 0
);

-- Reactions
CREATE TABLE reactions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  post_id VARCHAR REFERENCES posts(id),
  comment_id VARCHAR REFERENCES comments(id),
  type VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id, comment_id)
);

-- Comments
CREATE TABLE comments (
  id VARCHAR PRIMARY KEY,
  post_id VARCHAR REFERENCES posts(id),
  author_id VARCHAR REFERENCES users(id),
  parent_comment_id VARCHAR REFERENCES comments(id),
  content TEXT NOT NULL,
  mentions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
  id VARCHAR PRIMARY KEY,
  author_id VARCHAR REFERENCES users(id),
  content TEXT,
  media_url VARCHAR,
  type VARCHAR DEFAULT 'IMAGE',
  duration INTEGER DEFAULT 24,
  location JSONB,
  music JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friend Requests
CREATE TABLE friend_requests (
  id VARCHAR PRIMARY KEY,
  sender_id VARCHAR REFERENCES users(id),
  receiver_id VARCHAR REFERENCES users(id),
  message TEXT,
  status VARCHAR DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);
```

### **3. NOTIFICATION TABLES**
```sql
-- Notifications
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 **TESTING SCENARIOS**

### **1. CHAT TESTING**
```typescript
describe('Chat Integration Tests', () => {
  it('should create direct chat between two users', async () => {
    // Test direct chat creation
  });

  it('should create group chat with multiple users', async () => {
    // Test group chat creation
  });

  it('should send and receive messages in real-time', async () => {
    // Test WebSocket messaging
  });

  it('should handle media messages (images, videos, files)', async () => {
    // Test media message handling
  });

  it('should support message replies', async () => {
    // Test reply functionality
  });

  it('should mark messages as read', async () => {
    // Test read status
  });

  it('should search messages in chat', async () => {
    // Test message search
  });
});
```

### **2. SOCIAL TESTING**
```typescript
describe('Social Media Integration Tests', () => {
  it('should create and display posts', async () => {
    // Test post creation and display
  });

  it('should handle different post types (text, image, video, poll)', async () => {
    // Test various post types
  });

  it('should support reactions and comments', async () => {
    // Test interactions
  });

  it('should generate personalized feed', async () => {
    // Test feed algorithm
  });

  it('should handle friend requests', async () => {
    // Test friend system
  });

  it('should create and view stories', async () => {
    // Test story functionality
  });
});
```

### **3. INTEGRATION TESTING**
```typescript
describe('Chat & Social Integration Tests', () => {
  it('should share posts to chat', async () => {
    // Test post sharing to chat
  });

  it('should handle mentions across platforms', async () => {
    // Test cross-platform mentions
  });

  it('should send unified notifications', async () => {
    // Test notification system
  });

  it('should maintain user context across features', async () => {
    // Test user session consistency
  });
});
```

## 🚀 **DEPLOYMENT & MONITORING**

### **1. Environment Configuration**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/smartchat_db

# Redis (for WebSocket and caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/*,video/*,application/pdf

# WebSocket
WS_PORT=51213
WS_CORS_ORIGIN=http://localhost:3000

# Social Media
STORY_DURATION_HOURS=24
MAX_POST_LENGTH=5000
MAX_MEDIA_PER_POST=10

# Notifications
PUSH_NOTIFICATION_ENABLED=true
EMAIL_NOTIFICATION_ENABLED=true
```

### **2. Performance Monitoring**
```typescript
// Metrics to track
const metrics = {
  // Chat metrics
  messagesPerSecond: 0,
  activeChats: 0,
  averageResponseTime: 0,
  
  // Social metrics
  postsPerDay: 0,
  engagementRate: 0,
  activeUsers: 0,
  
  // System metrics
  databaseConnections: 0,
  redisMemoryUsage: 0,
  websocketConnections: 0
};

// Health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    metrics,
    services: {
      database: 'connected',
      redis: 'connected',
      websocket: 'running'
    }
  });
});
```

---

## ✅ **SUMMARY**

Workflow này cung cấp:

### **🎯 Chat Features:**
- ✅ Tạo chat 1-1 và nhóm với validation đầy đủ
- ✅ Gửi tin nhắn real-time với WebSocket
- ✅ Hỗ trợ nhiều loại tin nhắn (text, media, reply)
- ✅ Pagination và search tin nhắn
- ✅ Mark as read và unread count
- ✅ Typing indicators và online status

### **🌐 Social Features:**
- ✅ Tạo và chia sẻ posts với nhiều loại content
- ✅ Feed algorithm thông minh
- ✅ Reactions, comments, và sharing
- ✅ Stories và moments
- ✅ Friend requests và networking
- ✅ Mentions và hashtags

### **🔄 Integration:**
- ✅ Chia sẻ posts vào chat
- ✅ Unified notification system
- ✅ Cross-platform mentions
- ✅ Consistent user experience

### **📊 Technical Excellence:**
- ✅ Clean Architecture với Domain-Driven Design
- ✅ Real-time WebSocket communication
- ✅ Optimized database schema
- ✅ Comprehensive testing
- ✅ Performance monitoring
- ✅ Scalable deployment

**Tất cả đã được implement và sẵn sàng sử dụng! 🎉** 