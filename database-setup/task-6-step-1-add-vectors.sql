-- =====================================================
-- TASK 6 - STEP 1: Add Vector Embeddings to Document Chunks
-- Now that pgvector is enabled in Supabase
-- =====================================================

-- Add vector embedding column to existing document_chunks table
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536); -- OpenAI embedding size

-- Update the has_embedding column to be more useful
ALTER TABLE document_chunks 
ALTER COLUMN has_embedding SET DEFAULT false;

-- Create vector similarity indexes for fast semantic search
-- HNSW index for approximate nearest neighbor (best for most queries)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks 
    USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);

-- IVFFlat index for different query patterns (good for exact searches)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat ON document_chunks 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- Create a function to find similar chunks using vector similarity
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.8,
    max_results integer DEFAULT 10,
    community_filter uuid DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    content text,
    similarity_score float,
    cultural_sensitivity_level text,
    chunk_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id as chunk_id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) as similarity_score,
        dc.cultural_sensitivity_level,
        dc.chunk_type
    FROM document_chunks dc
    WHERE 
        dc.embedding IS NOT NULL
        AND (community_filter IS NULL OR dc.community_id = community_filter)
        AND (1 - (dc.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find chunks by text similarity (hybrid search)
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
    search_text text,
    query_embedding vector(1536) DEFAULT NULL,
    community_filter uuid DEFAULT NULL,
    cultural_level_filter text DEFAULT NULL,
    max_results integer DEFAULT 20
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    content text,
    text_rank float,
    vector_similarity float,
    combined_score float,
    cultural_sensitivity_level text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id as chunk_id,
        dc.document_id,
        dc.content,
        ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', search_text)) as text_rank,
        CASE 
            WHEN query_embedding IS NOT NULL AND dc.embedding IS NOT NULL 
            THEN 1 - (dc.embedding <=> query_embedding)
            ELSE 0.0
        END as vector_similarity,
        -- Combined scoring: 60% vector similarity + 40% text relevance
        CASE 
            WHEN query_embedding IS NOT NULL AND dc.embedding IS NOT NULL 
            THEN (0.6 * (1 - (dc.embedding <=> query_embedding))) + 
                 (0.4 * ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', search_text)))
            ELSE ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', search_text))
        END as combined_score,
        dc.cultural_sensitivity_level
    FROM document_chunks dc
    WHERE 
        to_tsvector('english', dc.content) @@ plainto_tsquery('english', search_text)
        AND (community_filter IS NULL OR dc.community_id = community_filter)
        AND (cultural_level_filter IS NULL OR dc.cultural_sensitivity_level = cultural_level_filter)
        AND dc.processing_status = 'completed'
    ORDER BY combined_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create function to update chunk embeddings (for batch processing)
CREATE OR REPLACE FUNCTION update_chunk_embedding(
    chunk_id_param uuid,
    embedding_param vector(1536),
    model_name text DEFAULT 'text-embedding-ada-002'
)
RETURNS boolean AS $$
BEGIN
    UPDATE document_chunks 
    SET 
        embedding = embedding_param,
        embedding_model = model_name,
        embedding_created_at = NOW(),
        has_embedding = true,
        processing_status = CASE 
            WHEN processing_status = 'pending' THEN 'completed'
            ELSE processing_status
        END
    WHERE id = chunk_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to batch update embeddings
CREATE OR REPLACE FUNCTION batch_update_embeddings(
    chunk_embeddings jsonb, -- Format: [{"chunk_id": "uuid", "embedding": [1,2,3...]}]
    model_name text DEFAULT 'text-embedding-ada-002'
)
RETURNS integer AS $$
DECLARE
    chunk_data jsonb;
    updated_count integer := 0;
BEGIN
    FOR chunk_data IN SELECT jsonb_array_elements(chunk_embeddings)
    LOOP
        UPDATE document_chunks 
        SET 
            embedding = (chunk_data->>'embedding')::vector(1536),
            embedding_model = model_name,
            embedding_created_at = NOW(),
            has_embedding = true,
            processing_status = CASE 
                WHEN processing_status = 'pending' THEN 'completed'
                ELSE processing_status
            END
        WHERE id = (chunk_data->>'chunk_id')::uuid;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

SELECT 'Vector embeddings added to document chunks successfully' as status;

-- Test the vector functionality with sample data
SELECT 'Testing vector operations...' as test_status;

-- Test vector creation and similarity
SELECT 
    '[1,2,3]'::vector(3) <=> '[1,2,4]'::vector(3) as cosine_distance,
    '[1,2,3]'::vector(3) <-> '[1,2,4]'::vector(3) as l2_distance,
    '[1,2,3]'::vector(3) <#> '[1,2,4]'::vector(3) as inner_product;