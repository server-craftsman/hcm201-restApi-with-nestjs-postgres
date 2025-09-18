-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ONLINE', 'OFFLINE', 'AWAY', 'BUSY');

-- CreateEnum
CREATE TYPE "public"."ChatType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."AIRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "public"."ChatType" NOT NULL DEFAULT 'DIRECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" "public"."MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "senderId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" "public"."AIRole" NOT NULL,
    "aiChatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_userId_chatId_key" ON "public"."chat_members"("userId", "chatId");

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_chats" ADD CONSTRAINT "ai_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_messages" ADD CONSTRAINT "ai_messages_aiChatId_fkey" FOREIGN KEY ("aiChatId") REFERENCES "public"."ai_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
