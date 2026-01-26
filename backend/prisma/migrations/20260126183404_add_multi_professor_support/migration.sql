-- Multi-professor support migration
-- This migration adds professorId to letter_request and template tables,
-- and adds isAdmin flag to professor table

-- Step 1: Add isAdmin column to professor (default false)
ALTER TABLE "professor" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Set the first professor as admin
UPDATE "professor" SET "is_admin" = true
WHERE "id" = (SELECT "id" FROM "professor" ORDER BY "created_at" ASC LIMIT 1);

-- Step 3: Add professor_id columns as nullable first
ALTER TABLE "letter_request" ADD COLUMN "professor_id" TEXT;
ALTER TABLE "template" ADD COLUMN "professor_id" TEXT;

-- Step 4: Populate existing records with the first professor's ID
UPDATE "letter_request" SET "professor_id" = (SELECT "id" FROM "professor" ORDER BY "created_at" ASC LIMIT 1);
UPDATE "template" SET "professor_id" = (SELECT "id" FROM "professor" ORDER BY "created_at" ASC LIMIT 1);

-- Step 5: Make professor_id NOT NULL
ALTER TABLE "letter_request" ALTER COLUMN "professor_id" SET NOT NULL;
ALTER TABLE "template" ALTER COLUMN "professor_id" SET NOT NULL;

-- Step 6: Create indexes for performance
CREATE INDEX "letter_request_professor_id_idx" ON "letter_request"("professor_id");
CREATE INDEX "template_professor_id_idx" ON "template"("professor_id");

-- Step 7: Add foreign key constraints
ALTER TABLE "letter_request" ADD CONSTRAINT "letter_request_professor_id_fkey"
  FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template" ADD CONSTRAINT "template_professor_id_fkey"
  FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
