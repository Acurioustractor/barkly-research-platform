-- Quick fix: Add missing systemsMetadata column to documents table
-- Run this in your Supabase SQL editor or database console

ALTER TABLE documents ADD COLUMN IF NOT EXISTS "systemsMetadata" JSONB;

-- Add any other missing columns that might be needed
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- Update the status enum if needed (this might already exist)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProcessingStatus') THEN
--         CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
--     END IF;
-- END
-- $$;