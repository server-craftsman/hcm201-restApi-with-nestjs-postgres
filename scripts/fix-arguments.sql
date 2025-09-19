-- Fix arguments table
ALTER TABLE arguments DROP COLUMN "authorId";
ALTER TABLE arguments ADD COLUMN "authorId" UUID NOT NULL;
ALTER TABLE arguments DROP COLUMN "questionId";
ALTER TABLE arguments ADD COLUMN "questionId" UUID NOT NULL;
