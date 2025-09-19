-- Fix column types to UUID
ALTER TABLE topics ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;
ALTER TABLE questions ALTER COLUMN "topicId" TYPE UUID USING "topicId"::uuid;
ALTER TABLE arguments ALTER COLUMN "authorId" TYPE UUID USING "authorId"::uuid;
ALTER TABLE arguments ALTER COLUMN "questionId" TYPE UUID USING "questionId"::uuid;

-- Add foreign key constraints
ALTER TABLE topics ADD CONSTRAINT "topics_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE questions ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE arguments ADD CONSTRAINT "arguments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE arguments ADD CONSTRAINT "arguments_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
