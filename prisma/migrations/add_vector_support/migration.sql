-- Add pgvector support to document_chunks table

-- Note: The pgvector extension must be installed in the database first
-- Run: CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to document_chunks table
ALTER TABLE "document_chunks" 
ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536),
ADD COLUMN IF NOT EXISTS "embedding_model" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMP;

-- Add metadata column for chunk analysis
ALTER TABLE "document_chunks" 
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Update existing embedding column type if needed
-- This preserves any existing JSON embeddings while allowing vector operations
DO $$ 
BEGIN
    -- Check if we need to migrate from JSON to vector
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'document_chunks' 
        AND column_name = 'embedding'
        AND data_type = 'json'
    ) THEN
        -- Add new vector column
        ALTER TABLE "document_chunks" ADD COLUMN "embedding_vector" vector(1536);
        
        -- Note: Actual data migration would need to be done in application code
        -- as JSON structure needs to be converted to vector format
        
        RAISE NOTICE 'Added embedding_vector column. JSON embeddings need migration.';
    END IF;
END $$;

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_vector_cosine_idx" 
ON "document_chunks" 
USING ivfflat ("embedding_vector" vector_cosine_ops)
WITH (lists = 100)
WHERE "embedding_vector" IS NOT NULL;

-- Add index for model type
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_model_idx" 
ON "document_chunks" ("embedding_model")
WHERE "embedding_model" IS NOT NULL;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS "document_chunks_metadata_idx" 
ON "document_chunks" 
USING gin ("metadata")
WHERE "metadata" IS NOT NULL;

-- Update chunk table with better naming
ALTER TABLE "document_chunks" RENAME COLUMN "text" TO "content";

-- Create helper view for chunks
CREATE OR REPLACE VIEW "chunks" AS 
SELECT 
    id,
    "documentId",
    "chunkIndex" as chunk_number,
    content,
    "wordCount" as word_count,
    "startChar" as start_char,
    "endChar" as end_char,
    "embedding_vector" as embedding,
    "embedding_model",
    "embedding_updated_at",
    metadata,
    "startPage" as start_page,
    "endPage" as end_page
FROM "document_chunks";

-- Add comment for clarity
COMMENT ON VIEW "chunks" IS 'Simplified view of document_chunks with consistent naming';