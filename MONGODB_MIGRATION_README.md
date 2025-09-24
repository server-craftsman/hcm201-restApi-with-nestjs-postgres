# MongoDB Migration Guide

## Overview
This project has been migrated from PostgreSQL with Prisma to MongoDB with Mongoose. The new system implements a comprehensive debate platform with content moderation and transparency features.

## Key Features

### 1. Debate Thread Management
- **Thread Creation**: Only admins and moderators can create debate threads
- **Thread Status**: DRAFT, ACTIVE, PAUSED, CLOSED, ARCHIVED
- **Moderator Assignment**: Each thread can have multiple moderators

### 2. Voting System
- **Vote Types**: SUPPORT or OPPOSE
- **One Vote Per User**: Users can change their vote but only have one vote per thread
- **Real-time Statistics**: Track support vs oppose votes

### 3. Argument System
- **Argument Types**: SUPPORT, OPPOSE, NEUTRAL
- **Content Moderation**: All arguments require approval by moderators
- **Status Tracking**: PENDING, APPROVED, REJECTED, FLAGGED

### 4. Content Moderation
- **Mandatory Review**: All arguments must be reviewed before publication
- **Moderation Actions**: APPROVE, REJECT, FLAG, HIGHLIGHT, UNHIGHLIGHT
- **Transparency**: Rejected and pending arguments are publicly accessible
- **Audit Trail**: Complete moderation logs for accountability

### 5. Transparency Features
- **Public Access**: Users can view rejected and pending arguments
- **Moderation Logs**: All moderation actions are logged with reasons
- **Accountability**: Prevents accusations of bias by making all content visible

## Database Schema

### User Schema
```typescript
{
  email: string (unique)
  username: string (unique)
  password?: string
  firstName?: string
  lastName?: string
  role: USER | MODERATOR | ADMIN | SUPER_ADMIN
  status: ONLINE | OFFLINE | AWAY | BUSY
  // ... other fields
}
```

### DebateThread Schema
```typescript
{
  title: string
  description?: string
  createdBy: ObjectId (User)
  moderators: ObjectId[] (User[])
  status: DRAFT | ACTIVE | PAUSED | CLOSED | ARCHIVED
  totalVotes: number
  totalArguments: number
  totalApprovedArguments: number
  allowVoting: boolean
  allowArguments: boolean
  requireModeration: boolean
}
```

### Vote Schema
```typescript
{
  userId: ObjectId (User)
  threadId: ObjectId (DebateThread)
  voteType: SUPPORT | OPPOSE
  votedAt: Date
}
```

### Argument Schema
```typescript
{
  title: string
  content: string
  authorId: ObjectId (User)
  threadId: ObjectId (DebateThread)
  argumentType: SUPPORT | OPPOSE | NEUTRAL
  status: PENDING | APPROVED | REJECTED | FLAGGED
  moderatedBy?: ObjectId (User)
  moderationNotes?: string
  rejectionReason?: string
  upvotes: number
  downvotes: number
  isHighlighted: boolean
}
```

### ModerationLog Schema
```typescript
{
  moderatorId: ObjectId (User)
  argumentId: ObjectId (Argument)
  action: APPROVE | REJECT | FLAG | HIGHLIGHT | UNHIGHLIGHT
  reason?: string
  notes?: string
  actionDate: Date
}
```

## API Endpoints

### Thread Management
- `POST /api/v1/debate/threads` - Create thread (Admin/Moderator only)
- `GET /api/v1/debate/threads` - Get all threads
- `GET /api/v1/debate/threads/:id` - Get specific thread
- `PUT /api/v1/debate/threads/:id/status` - Update thread status

### Voting
- `POST /api/v1/debate/vote` - Vote on thread
- `GET /api/v1/debate/threads/:threadId/votes` - Get vote statistics
- `GET /api/v1/debate/threads/:threadId/my-vote` - Get user's vote

### Arguments
- `POST /api/v1/debate/arguments` - Create argument
- `GET /api/v1/debate/threads/:threadId/arguments` - Get thread arguments
- `GET /api/v1/debate/arguments/:id` - Get specific argument

### Moderation
- `POST /api/v1/debate/moderate` - Moderate argument (Admin/Moderator only)
- `GET /api/v1/debate/moderation-logs` - Get moderation logs
- `GET /api/v1/debate/threads/:threadId/rejected-arguments` - Get rejected arguments
- `GET /api/v1/debate/threads/:threadId/pending-arguments` - Get pending arguments

## Environment Variables

Create a `.env` file with the following variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/debate-system

# Authentication
AUTH_JWT_SECRET=your-super-secret-jwt-key-here
AUTH_JWT_TOKEN_EXPIRES_IN=1d

# Application
NODE_ENV=development
PORT=51213
APP_DEBUG=true
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Setup MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

3. **Run the Application**
   ```bash
   pnpm run start:dev
   ```

4. **Seed Database** (Optional)
   ```bash
   pnpm run db:seed
   ```

## Key Benefits of the New System

### 1. Content Quality Control
- **Mandatory Moderation**: Prevents spam and inappropriate content
- **Political Sensitivity**: Ensures content is appropriate for political discussions
- **Personal Attack Prevention**: Moderators can reject content that attacks individuals

### 2. Transparency & Trust
- **Public Access**: All content (approved, rejected, pending) is visible
- **Audit Trail**: Complete logs of all moderation actions
- **Accountability**: Prevents accusations of bias or censorship

### 3. User Experience
- **Clear Status**: Users know the status of their submissions
- **Fair Process**: Transparent moderation process builds trust
- **Quality Content**: Only high-quality, approved content is prominently displayed

### 4. Moderation Efficiency
- **Batch Processing**: Moderators can process multiple arguments
- **Clear Guidelines**: Structured moderation with reasons and notes
- **Workflow Management**: Track pending items and moderation progress

## Migration Notes

- **Removed**: All Prisma dependencies and PostgreSQL configuration
- **Added**: MongoDB with Mongoose ODM
- **Updated**: All services to use MongoDB schemas
- **Enhanced**: Added comprehensive moderation and transparency features
- **Improved**: Better content quality control and user trust

## Security Considerations

1. **Authentication**: JWT-based authentication with role-based access control
2. **Authorization**: Strict permission checks for moderation actions
3. **Input Validation**: Comprehensive validation for all user inputs
4. **Rate Limiting**: Protection against spam and abuse
5. **Content Filtering**: Moderation system prevents inappropriate content

## Future Enhancements

1. **AI-Powered Moderation**: Automated content screening
2. **Advanced Analytics**: Detailed debate statistics and insights
3. **Notification System**: Real-time updates for moderation actions
4. **Mobile App**: Native mobile application support
5. **Multi-language Support**: Internationalization for global debates
