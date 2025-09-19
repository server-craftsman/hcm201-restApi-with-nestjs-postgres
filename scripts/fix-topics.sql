-- Fix topics table
ALTER TABLE topics DROP COLUMN "ownerId";
ALTER TABLE topics ADD COLUMN "ownerId" UUID NOT NULL;
