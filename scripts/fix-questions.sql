-- Fix questions table
ALTER TABLE questions DROP COLUMN "topicId";
ALTER TABLE questions ADD COLUMN "topicId" UUID NOT NULL;
