-- Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- First, drop the column if it exists with wrong type
ALTER TABLE document_chunks 
DROP COLUMN IF EXISTS embedding;

-- Add embedding column with correct vector type
ALTER TABLE document_chunks 
ADD COLUMN embedding vector(1536);

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);