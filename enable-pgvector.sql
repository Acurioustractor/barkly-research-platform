-- Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to document_chunks table
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);