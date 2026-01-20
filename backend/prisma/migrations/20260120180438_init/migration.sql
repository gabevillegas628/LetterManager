-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('PENDING', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('PENDING', 'SENT', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "submission_method" AS ENUM ('EMAIL', 'DOWNLOAD', 'PORTAL');

-- CreateTable
CREATE TABLE "professor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "institution" TEXT,
    "signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_request" (
    "id" TEXT NOT NULL,
    "access_code" TEXT NOT NULL,
    "status" "request_status" NOT NULL DEFAULT 'PENDING',
    "student_name" TEXT,
    "student_email" TEXT,
    "student_phone" TEXT,
    "program_applying" TEXT,
    "institution_applying" TEXT,
    "degree_type" TEXT,
    "course_taken" TEXT,
    "grade" TEXT,
    "semester_year" TEXT,
    "relationship_description" TEXT,
    "achievements" TEXT,
    "personal_statement" TEXT,
    "additional_notes" TEXT,
    "custom_fields" JSONB,
    "deadline" TIMESTAMP(3),
    "professor_notes" TEXT,
    "code_generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "student_submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_destination" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "program_name" TEXT,
    "recipient_name" TEXT,
    "recipient_email" TEXT,
    "portal_url" TEXT,
    "portal_instructions" TEXT,
    "method" "submission_method" NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "template_id" TEXT,
    "destination_id" TEXT,
    "content" TEXT NOT NULL,
    "pdf_path" TEXT,
    "pdf_generated_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "is_master" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professor_email_key" ON "professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "letter_request_access_code_key" ON "letter_request"("access_code");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "letter_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_destination" ADD CONSTRAINT "submission_destination_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "letter_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter" ADD CONSTRAINT "letter_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "letter_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter" ADD CONSTRAINT "letter_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter" ADD CONSTRAINT "letter_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "submission_destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
