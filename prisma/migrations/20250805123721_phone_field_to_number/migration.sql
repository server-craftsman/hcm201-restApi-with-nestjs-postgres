-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('PUBLIC', 'PRIVATE', 'SECRET');

-- CreateEnum
CREATE TYPE "GroupCategory" AS ENUM ('GENERAL', 'GAMING', 'TECHNOLOGY', 'ENTERTAINMENT', 'SPORTS', 'EDUCATION', 'BUSINESS', 'LIFESTYLE');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'CARE');

-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "StoryReplyType" AS ENUM ('EVERYONE', 'FRIENDS', 'CLOSE_FRIENDS', 'NO_ONE');

-- CreateEnum
CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ONLINE', 'TYPING', 'RECORDING', 'UPLOADING', 'PLAYING', 'LISTENING');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('AVAILABLE', 'BUSY', 'AWAY', 'INVISIBLE', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MemberRole" ADD VALUE 'OWNER';
ALTER TYPE "MemberRole" ADD VALUE 'MODERATOR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'STICKER';
ALTER TYPE "MessageType" ADD VALUE 'GIF';
ALTER TYPE "MessageType" ADD VALUE 'LOCATION';
ALTER TYPE "MessageType" ADD VALUE 'POLL';
ALTER TYPE "MessageType" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "chat_members" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leftAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "allowAutoJoin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "category" "GroupCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "groupType" "GroupType",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMessageId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "replyToMessageId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "hash" TEXT,
ADD COLUMN     "hashExpires" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" INTEGER,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "website" TEXT,
ALTER COLUMN "lastSeen" DROP NOT NULL,
ALTER COLUMN "lastSeen" DROP DEFAULT;

-- CreateTable
CREATE TABLE "chat_settings" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "allowMemberInvite" BOOLEAN NOT NULL DEFAULT true,
    "allowMemberPost" BOOLEAN NOT NULL DEFAULT true,
    "moderationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slowModeDelay" INTEGER NOT NULL DEFAULT 0,
    "maxMembers" INTEGER,
    "joinApprovalRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_mentions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "allowMultipleChoice" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "options" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" "MediaType",
    "allowReplies" "StoryReplyType" NOT NULL DEFAULT 'FRIENDS',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_views" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_replies" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_join_requests" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activity" "ActivityType" NOT NULL,
    "chatId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_status_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "StatusType" NOT NULL,
    "customMessage" TEXT,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_settings_chatId_key" ON "chat_settings"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_key" ON "message_reactions"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_mentions_messageId_userId_key" ON "message_mentions"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "polls_messageId_key" ON "polls"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_pollId_userId_key" ON "poll_votes"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "friend_requests_senderId_receiverId_key" ON "friend_requests"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId_friendId_key" ON "friendships"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "story_views_storyId_userId_key" ON "story_views"("storyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_join_requests_groupId_userId_key" ON "group_join_requests"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_settings" ADD CONSTRAINT "chat_settings_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_replies" ADD CONSTRAINT "story_replies_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_replies" ADD CONSTRAINT "story_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
