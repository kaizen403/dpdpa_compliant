-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('DOCUMENT', 'FINANCIAL', 'MEDICAL', 'LEGAL', 'PERSONAL', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'FILE_UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_VIEW';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_DOWNLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_VIEW';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'NOTE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'NOTE_VIEW';
ALTER TYPE "AuditAction" ADD VALUE 'NOTE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'NOTE_DELETE';

-- CreateTable
CREATE TABLE "secure_files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "category" "FileCategory" NOT NULL,
    "filePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secure_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "websiteName" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT,
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secure_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "category" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secure_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "secure_files_userId_idx" ON "secure_files"("userId");

-- CreateIndex
CREATE INDEX "secure_files_category_idx" ON "secure_files"("category");

-- CreateIndex
CREATE INDEX "password_entries_userId_idx" ON "password_entries"("userId");

-- CreateIndex
CREATE INDEX "password_entries_category_idx" ON "password_entries"("category");

-- CreateIndex
CREATE INDEX "secure_notes_userId_idx" ON "secure_notes"("userId");

-- CreateIndex
CREATE INDEX "secure_notes_isPinned_idx" ON "secure_notes"("isPinned");

-- AddForeignKey
ALTER TABLE "secure_files" ADD CONSTRAINT "secure_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_entries" ADD CONSTRAINT "password_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secure_notes" ADD CONSTRAINT "secure_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
