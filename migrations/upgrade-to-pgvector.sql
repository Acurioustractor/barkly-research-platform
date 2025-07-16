-- Upgrade embedding storage from JSON to pgvector
-- This migration safely converts existing JSON embeddings to proper vector type

BEGIN;

-- Step 1: Add new vector column
ALTER TABLE document_chunks ADD COLUMN embedding_vector vector(1536);

-- Step 2: Convert existing JSON embeddings to vector format
-- Only convert if the JSON contains a valid array of numbers
UPDATE document_chunks 
SET embedding_vector = (
  SELECT array_to_string(
    ARRAY(
      SELECT jsonb_array_elements_text(embedding::jsonb)
    ), ','
  )::vector(1536)
)
WHERE 
  embedding IS NOT NULL 
  AND jsonb_typeof(embedding::jsonb) = 'array'
  AND jsonb_array_length(embedding::jsonb) = 1536;

-- Step 3: Drop old JSON column
ALTER TABLE document_chunks DROP COLUMN embedding;

-- Step 4: Rename new column to original name
ALTER TABLE document_chunks RENAME COLUMN embedding_vector TO embedding;

-- Step 5: Add vector similarity index for performance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_cosine_idx 
ON document_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Step 6: Add vector similarity index for L2 distance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_l2_idx 
ON document_chunks USING ivfflat (embedding vector_l2_ops) 
WITH (lists = 100);

COMMIT;