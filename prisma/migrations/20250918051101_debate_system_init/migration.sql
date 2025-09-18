/*
  Warnings:

  - You are about to drop the `ai_chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `friend_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `friendships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_join_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_mentions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_reactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `poll_votes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `polls` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `story_replies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `story_views` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_status_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_chats" DROP CONSTRAINT "ai_chats_userId_fkey";

-- DropForeignKey
ALTER TABLE "ai_messages" DROP CONSTRAINT "ai_messages_aiChatId_fkey";

-- DropForeignKey
ALTER TABLE "chat_members" DROP CONSTRAINT "chat_members_chatId_fkey";

-- DropForeignKey
ALTER TABLE "chat_members" DROP CONSTRAINT "chat_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "chat_settings" DROP CONSTRAINT "chat_settings_chatId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_lastMessageId_fkey";

-- DropForeignKey
ALTER TABLE "friend_requests" DROP CONSTRAINT "friend_requests_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "friend_requests" DROP CONSTRAINT "friend_requests_senderId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_friendId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_userId_fkey";

-- DropForeignKey
ALTER TABLE "group_join_requests" DROP CONSTRAINT "group_join_requests_groupId_fkey";

-- DropForeignKey
ALTER TABLE "message_mentions" DROP CONSTRAINT "message_mentions_messageId_fkey";

-- DropForeignKey
ALTER TABLE "message_mentions" DROP CONSTRAINT "message_mentions_userId_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_messageId_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_chatId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_replyToMessageId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "poll_votes" DROP CONSTRAINT "poll_votes_pollId_fkey";

-- DropForeignKey
ALTER TABLE "poll_votes" DROP CONSTRAINT "poll_votes_userId_fkey";

-- DropForeignKey
ALTER TABLE "polls" DROP CONSTRAINT "polls_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "polls" DROP CONSTRAINT "polls_messageId_fkey";

-- DropForeignKey
ALTER TABLE "stories" DROP CONSTRAINT "stories_userId_fkey";

-- DropForeignKey
ALTER TABLE "story_replies" DROP CONSTRAINT "story_replies_storyId_fkey";

-- DropForeignKey
ALTER TABLE "story_replies" DROP CONSTRAINT "story_replies_userId_fkey";

-- DropForeignKey
ALTER TABLE "story_views" DROP CONSTRAINT "story_views_storyId_fkey";

-- DropForeignKey
ALTER TABLE "story_views" DROP CONSTRAINT "story_views_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_activities" DROP CONSTRAINT "user_activities_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_status_history" DROP CONSTRAINT "user_status_history_userId_fkey";

-- DropTable
DROP TABLE "ai_chats";

-- DropTable
DROP TABLE "ai_messages";

-- DropTable
DROP TABLE "chat_members";

-- DropTable
DROP TABLE "chat_settings";

-- DropTable
DROP TABLE "chats";

-- DropTable
DROP TABLE "friend_requests";

-- DropTable
DROP TABLE "friendships";

-- DropTable
DROP TABLE "group_join_requests";

-- DropTable
DROP TABLE "message_mentions";

-- DropTable
DROP TABLE "message_reactions";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "poll_votes";

-- DropTable
DROP TABLE "polls";

-- DropTable
DROP TABLE "stories";

-- DropTable
DROP TABLE "story_replies";

-- DropTable
DROP TABLE "story_views";

-- DropTable
DROP TABLE "user_activities";

-- DropTable
DROP TABLE "user_status_history";

-- DropEnum
DROP TYPE "AIRole";

-- DropEnum
DROP TYPE "ActivityType";

-- DropEnum
DROP TYPE "ChatType";

-- DropEnum
DROP TYPE "FriendRequestStatus";

-- DropEnum
DROP TYPE "FriendshipStatus";

-- DropEnum
DROP TYPE "GroupCategory";

-- DropEnum
DROP TYPE "GroupJoinRequestStatus";

-- DropEnum
DROP TYPE "GroupType";

-- DropEnum
DROP TYPE "MediaType";

-- DropEnum
DROP TYPE "MemberRole";

-- DropEnum
DROP TYPE "MessageType";

-- DropEnum
DROP TYPE "ReactionType";

-- DropEnum
DROP TYPE "StatusType";

-- DropEnum
DROP TYPE "StoryReplyType";

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arguments" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arguments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arguments" ADD CONSTRAINT "arguments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arguments" ADD CONSTRAINT "arguments_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
