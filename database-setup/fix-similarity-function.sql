-- Fix the similarity function to work without array intersection operators
CREATE OR REPLACE FUNCTION find_similar_chunks(
    p_chunk_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    chunk_id UUID,
    similarity_score DECIMAL(5,4),
    content_preview TEXT
) AS $$
DECLARE
    source_chunk RECORD;
BEGIN
    -- Get source chunk
    SELECT * INTO source_chunk FROM document_chunks WHERE id = p_chunk_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Chunk not found: %', p_chunk_id;
    END IF;
    
    -- Find similar chunks based on keyword overlap and cultural indicators
    RETURN QUERY
    WITH similarity_calc AS (
        SELECT 
            dc.id,
            dc.content,
            -- Calculate keyword similarity using array overlap
            CASE 
                WHEN array_length(source_chunk.keywords, 1) > 0 AND array_length(dc.keywords, 1) > 0 THEN
                    -- Count overlapping keywords
                    (SELECT count(*)::DECIMAL FROM unnest(source_chunk.keywords) k1 
                     WHERE k1 = ANY(dc.keywords)) / 
                    (array_length(source_chunk.keywords, 1) + array_length(dc.keywords, 1))
                ELSE 0
            END as keyword_similarity,
            -- Cultural similarity bonus
            CASE 
                WHEN source_chunk.cultural_sensitivity_level = dc.cultural_sensitivity_level THEN 0.2
                ELSE 0
            END as cultural_similarity,
            -- Content length similarity
            CASE 
                WHEN abs(source_chunk.content_length - dc.content_length) < 100 THEN 0.1
                ELSE 0
            END as length_similarity
        FROM document_chunks dc
        WHERE dc.id != p_chunk_id
        AND dc.community_id = source_chunk.community_id
        AND dc.processing_status = 'completed'
    )
    SELECT 
        sc.id,
        (sc.keyword_similarity + sc.cultural_similarity + sc.length_similarity)::DECIMAL(5,4),
        left(sc.content, 100) || '...'
    FROM similarity_calc sc
    WHERE (sc.keyword_similarity + sc.cultural_similarity + sc.length_similarity) > 0.1
    ORDER BY (sc.keyword_similarity + sc.cultural_similarity + sc.length_similarity) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

SELECT 'Similarity function fixed' as status;