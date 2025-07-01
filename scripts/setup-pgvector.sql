-- Setup script for pgvector extension and vector columns
-- Run this script against your PostgreSQL database to enable vector search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to chunks table if they don't exist
DO $$ 
BEGIN
    -- Check if embedding column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chunks' 
        AND column_name = 'embedding'
    ) THEN
        -- Add embedding column (1536 dimensions for OpenAI text-embedding-3-small)
        ALTER TABLE chunks ADD COLUMN embedding vector(1536);
        
        -- Add metadata columns for tracking
        ALTER TABLE chunks ADD COLUMN embedding_model VARCHAR(100);
        ALTER TABLE chunks ADD COLUMN embedding_updated_at TIMESTAMP;
        
        RAISE NOTICE 'Added embedding columns to chunks table';
    ELSE
        RAISE NOTICE 'Embedding column already exists';
    END IF;
END $$;

-- Create indexes for efficient vector similarity search
-- Using IVFFlat index for better performance with large datasets
CREATE INDEX IF NOT EXISTS chunks_embedding_cosine_idx 
ON chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: HNSW index (better recall but uses more memory)
-- CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
-- ON chunks 
-- USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- Create a function to search for similar chunks
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    document_ids text[] DEFAULT NULL
)
RETURNS TABLE (
    chunk_id text,
    document_id text,
    content text,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chunk_id,
        c."documentId" as document_id,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity,
        c.metadata
    FROM chunks c
    WHERE 
        c.embedding IS NOT NULL
        AND (document_ids IS NULL OR c."documentId" = ANY(document_ids))
        AND 1 - (c.embedding <=> query_embedding) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create a function to find chunks without embeddings
CREATE OR REPLACE FUNCTION find_chunks_without_embeddings(
    limit_count int DEFAULT 100
)
RETURNS TABLE (
    chunk_id text,
    document_id text,
    content_length int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chunk_id,
        c."documentId" as document_id,
        LENGTH(c.content) as content_length
    FROM chunks c
    WHERE c.embedding IS NULL
    ORDER BY c."createdAt" DESC
    LIMIT limit_count;
END;
$$;

-- Create a view for document-level embeddings (average of chunk embeddings)
CREATE OR REPLACE VIEW document_embeddings AS
WITH doc_vectors AS (
    SELECT 
        "documentId",
        AVG(embedding) as avg_embedding,
        COUNT(*) as chunk_count,
        COUNT(embedding) as embedded_chunk_count
    FROM chunks
    GROUP BY "documentId"
)
SELECT 
    d.id as document_id,
    d."originalName" as document_name,
    dv.avg_embedding,
    dv.chunk_count,
    dv.embedded_chunk_count,
    CASE 
        WHEN dv.chunk_count > 0 
        THEN ROUND((dv.embedded_chunk_count::float / dv.chunk_count) * 100, 2)
        ELSE 0 
    END as embedding_coverage_percent
FROM documents d
LEFT JOIN doc_vectors dv ON d.id = dv."documentId";

-- Create a materialized view for faster document similarity searches
CREATE MATERIALIZED VIEW IF NOT EXISTS document_embeddings_mat AS
SELECT * FROM document_embeddings
WHERE avg_embedding IS NOT NULL;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS document_embeddings_mat_idx 
ON document_embeddings_mat 
USING ivfflat (avg_embedding vector_cosine_ops)
WITH (lists = 50);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_document_embeddings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY document_embeddings_mat;
END;
$$;

-- Create a function to calculate embedding statistics
CREATE OR REPLACE FUNCTION embedding_statistics()
RETURNS TABLE (
    total_chunks bigint,
    chunks_with_embeddings bigint,
    embedding_coverage_percent numeric,
    total_documents bigint,
    documents_fully_embedded bigint,
    avg_chunks_per_document numeric,
    total_vector_storage_mb numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_chunks,
            COUNT(embedding) as chunks_with_embeddings,
            COUNT(DISTINCT "documentId") as total_documents
        FROM chunks
    ),
    doc_stats AS (
        SELECT 
            COUNT(*) as documents_fully_embedded
        FROM (
            SELECT "documentId"
            FROM chunks
            GROUP BY "documentId"
            HAVING COUNT(*) = COUNT(embedding)
        ) fully_embedded
    ),
    storage_stats AS (
        SELECT 
            SUM(pg_column_size(embedding))::numeric / 1024 / 1024 as vector_storage_mb
        FROM chunks
        WHERE embedding IS NOT NULL
    )
    SELECT 
        s.total_chunks,
        s.chunks_with_embeddings,
        ROUND((s.chunks_with_embeddings::numeric / GREATEST(s.total_chunks, 1)) * 100, 2),
        s.total_documents,
        ds.documents_fully_embedded,
        ROUND(s.total_chunks::numeric / GREATEST(s.total_documents, 1), 2),
        COALESCE(ss.vector_storage_mb, 0)
    FROM stats s, doc_stats ds, storage_stats ss;
END;
$$;

-- Grant permissions (adjust role names as needed)
-- GRANT SELECT ON chunks TO your_app_role;
-- GRANT EXECUTE ON FUNCTION search_similar_chunks TO your_app_role;

-- Maintenance: Analyze tables for query optimization
ANALYZE chunks;

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE 'pgvector setup completed successfully!';
    RAISE NOTICE 'Run SELECT * FROM embedding_statistics() to see current status';
END $$;