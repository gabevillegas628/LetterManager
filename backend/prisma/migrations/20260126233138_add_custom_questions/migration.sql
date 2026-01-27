-- AlterTable
ALTER TABLE "letter_request" ADD COLUMN     "questions" JSONB;

-- AlterTable
ALTER TABLE "professor" ADD COLUMN     "custom_questions" JSONB;
