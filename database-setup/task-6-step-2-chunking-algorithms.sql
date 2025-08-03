-- =====================================================
-- TASK 6 - STEP 2: Intelligent Text Chunking Algorithms
-- =====================================================

-- Function to calculate text statistics
CREATE OR REPLACE FUNCTION calculate_text_stats(content TEXT)
RETURNS JSONB AS $$
DECLARE
    word_count INTEGER;
    char_count INTEGER;
    sentence_count INTEGER;
    paragraph_count INTEGER;
    readability_score DECIMAL(5,2);
BEGIN
    -- Basic counts
    char_count := length(content);
    word_count := array_length(string_to_array(trim(content), ' '), 1);
    sentence_count := array_length(string_to_array(content, '.'), 1) - 1;
    paragraph_count := array_length(string_to_array(content, E'\n\n'), 1);
    
    -- Simple readability score (Flesch-like approximation)
    -- Higher score = more readable
    IF word_count > 0 AND sentence_count > 0 THEN
        readability_score := 206.835 - (1.015 * (word_count::DECIMAL / sentence_count)) - (84.6 * (char_count::DECIMAL / word_count));
    ELSE
        readability_score := 0;
    END IF;
    
    RETURN jsonb_build_object(
        'word_count', word_count,
        'char_count', char_count,
        'sentence_count', sentence_count,
        'paragraph_count', paragraph_count,
        'readability_score', readability_score,
        'avg_words_per_sentence', CASE WHEN sentence_count > 0 THEN word_count::DECIMAL / sentence_count ELSE 0 END,
        'avg_chars_per_word', CASE WHEN word_count > 0 THEN char_count::DECIMAL / word_count ELSE 0 END
    );
END;
$$ LANGUAGE plpgsql;

-- Function to extract keywords from text
CREATE OR REPLACE FUNCTION extract_keywords(content TEXT, max_keywords INTEGER DEFAULT 10)
RETURNS TEXT[] AS $$
DECLARE
    keywords TEXT[];
    word_freq RECORD;
    stop_words TEXT[] := ARRAY['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
BEGIN
    -- Extract words, filter stop words, and get most frequent
    WITH word_counts AS (
        SELECT 
            lower(word) as word,
            count(*) as frequency
        FROM (
            SELECT unnest(string_to_array(regexp_replace(lower(content), '[^a-zA-Z\s]', '', 'g'), ' ')) as word
        ) words
        WHERE 
            length(word) > 2 
            AND NOT (word = ANY(stop_words))
            AND word ~ '^[a-z]+$'
        GROUP BY lower(word)
        ORDER BY count(*) DESC, word
        LIMIT max_keywords
    )
    SELECT array_agg(word) INTO keywords FROM word_counts;
    
    RETURN COALESCE(keywords, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Function to detect cultural entities and indicators
CREATE OR REPLACE FUNCTION detect_cultural_indicators(content TEXT)
RETURNS JSONB AS $$
DECLARE
    cultural_indicators TEXT[] := ARRAY[];
    cultural_entities JSONB := '{}';
    traditional_terms TEXT[] := ARRAY['traditional', 'indigenous', 'aboriginal', 'native', 'tribal', 'ancestral', 'elder', 'ceremony', 'ritual', 'sacred', 'spiritual', 'cultural', 'heritage', 'customs', 'beliefs', 'practices', 'knowledge', 'wisdom', 'storytelling', 'oral', 'tradition'];
    content_lower TEXT;
    term TEXT;
    sensitivity_level TEXT := 'community';
BEGIN
    content_lower := lower(content);
    
    -- Check for traditional/cultural terms
    FOREACH term IN ARRAY traditional_terms
    LOOP
        IF content_lower LIKE '%' || term || '%' THEN
            cultural_indicators := array_append(cultural_indicators, term);
            
            -- Determine sensitivity level
            IF term IN ('sacred', 'ceremony', 'ritual', 'spiritual') THEN
                sensitivity_level := 'sacred';
            ELSIF term IN ('elder', 'traditional', 'ancestral') THEN
                sensitivity_level := 'restricted';
            END IF;
        END IF;
    END LOOP;
    
    -- Build cultural entities object
    cultural_entities := jsonb_build_object(
        'indicators', cultural_indicators,
        'sensitivity_level', sensitivity_level,
        'requires_elder_review', sensitivity_level IN ('sacred', 'ceremonial'),
        'traditional_knowledge', array_length(cultural_indicators, 1) > 2
    );
    
    RETURN cultural_entities;
END;
$$ LANGUAGE plpgsql;

-- Main function to chunk a document intelligently
CREATE OR REPLACE FUNCTION chunk_document(
    p_document_id UUID,
    p_chunk_size INTEGER DEFAULT 500, -- Target words per chunk
    p_overlap INTEGER DEFAULT 50,     -- Overlap words between chunks
    p_chunk_type TEXT DEFAULT 'paragraph'
)
RETURNS INTEGER AS $$
DECLARE
    doc_record RECORD;
    content_text TEXT;
    paragraphs TEXT[];
    current_chunk TEXT := '';
    current_word_count INTEGER := 0;
    chunk_index INTEGER := 0;
    start_pos INTEGER := 1;
    end_pos INTEGER;
    chunk_stats JSONB;
    keywords TEXT[];
    cultural_info JSONB;
    chunk_id UUID;
    total_chunks INTEGER := 0;
BEGIN
    -- Get document content
    SELECT * INTO doc_record FROM documents WHERE id = p_document_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
    END IF;
    
    content_text := COALESCE(doc_record.text_content, '');
    
    IF length(content_text) = 0 THEN
        RAISE NOTICE 'Document has no text content to chunk';
        RETURN 0;
    END IF;
    
    -- Split into paragraphs
    paragraphs := string_to_array(content_text, E'\n\n');
    
    -- Process each paragraph
    FOR i IN 1..array_length(paragraphs, 1)
    LOOP
        DECLARE
            para_text TEXT := trim(paragraphs[i]);
            para_word_count INTEGER;
        BEGIN
            CONTINUE WHEN length(para_text) = 0;
            
            para_word_count := array_length(string_to_array(para_text, ' '), 1);
            
            -- If adding this paragraph would exceed chunk size, save current chunk
            IF current_word_count + para_word_count > p_chunk_size AND current_word_count > 0 THEN
                -- Calculate end position
                end_pos := start_pos + length(current_chunk) - 1;
                
                -- Calculate statistics
                chunk_stats := calculate_text_stats(current_chunk);
                keywords := extract_keywords(current_chunk, 5);
                cultural_info := detect_cultural_indicators(current_chunk);
                
                -- Insert chunk
                INSERT INTO document_chunks (
                    document_id,
                    community_id,
                    chunk_index,
                    chunk_type,
                    content,
                    content_length,
                    word_count,
                    start_position,
                    end_position,
                    keywords,
                    readability_score,
                    confidence_score,
                    cultural_sensitivity_level,
                    cultural_entities,
                    traditional_knowledge_indicators,
                    requires_elder_review,
                    processing_status
                ) VALUES (
                    p_document_id,
                    doc_record.community_id,
                    chunk_index,
                    p_chunk_type,
                    current_chunk,
                    length(current_chunk),
                    (chunk_stats->>'word_count')::INTEGER,
                    start_pos,
                    end_pos,
                    keywords,
                    (chunk_stats->>'readability_score')::DECIMAL(5,2),
                    1.0,
                    (cultural_info->>'sensitivity_level')::TEXT,
                    cultural_info,
                    ARRAY(SELECT jsonb_array_elements_text(cultural_info->'indicators')),
                    (cultural_info->>'requires_elder_review')::BOOLEAN,
                    'completed'
                );
                
                chunk_index := chunk_index + 1;
                total_chunks := total_chunks + 1;
                
                -- Start new chunk with overlap
                IF p_overlap > 0 THEN
                    DECLARE
                        overlap_words TEXT[];
                        overlap_text TEXT;
                    BEGIN
                        overlap_words := (string_to_array(current_chunk, ' '))[greatest(1, current_word_count - p_overlap):current_word_count];
                        overlap_text := array_to_string(overlap_words, ' ');
                        current_chunk := overlap_text || ' ' || para_text;
                        current_word_count := array_length(string_to_array(current_chunk, ' '), 1);
                        start_pos := end_pos - length(overlap_text);
                    END;
                ELSE
                    current_chunk := para_text;
                    current_word_count := para_word_count;
                    start_pos := end_pos + 1;
                END IF;
            ELSE
                -- Add paragraph to current chunk
                IF current_word_count = 0 THEN
                    current_chunk := para_text;
                ELSE
                    current_chunk := current_chunk || E'\n\n' || para_text;
                END IF;
                current_word_count := current_word_count + para_word_count;
            END IF;
        END;
    END LOOP;
    
    -- Handle remaining content
    IF current_word_count > 0 THEN
        end_pos := start_pos + length(current_chunk) - 1;
        chunk_stats := calculate_text_stats(current_chunk);
        keywords := extract_keywords(current_chunk, 5);
        cultural_info := detect_cultural_indicators(current_chunk);
        
        INSERT INTO document_chunks (
            document_id,
            community_id,
            chunk_index,
            chunk_type,
            content,
            content_length,
            word_count,
            start_position,
            end_position,
            keywords,
            readability_score,
            confidence_score,
            cultural_sensitivity_level,
            cultural_entities,
            traditional_knowledge_indicators,
            requires_elder_review,
            processing_status
        ) VALUES (
            p_document_id,
            doc_record.community_id,
            chunk_index,
            p_chunk_type,
            current_chunk,
            length(current_chunk),
            (chunk_stats->>'word_count')::INTEGER,
            start_pos,
            end_pos,
            keywords,
            (chunk_stats->>'readability_score')::DECIMAL(5,2),
            1.0,
            (cultural_info->>'sensitivity_level')::TEXT,
            cultural_info,
            ARRAY(SELECT jsonb_array_elements_text(cultural_info->'indicators')),
            (cultural_info->>'requires_elder_review')::BOOLEAN,
            'completed'
        );
        
        total_chunks := total_chunks + 1;
    END IF;
    
    -- Update document processing status
    UPDATE documents 
    SET processing_status = 'completed',
        processing_completed_at = NOW()
    WHERE id = p_document_id;
    
    RETURN total_chunks;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar chunks (without vector similarity for now)
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
            -- Calculate keyword similarity (Jaccard index approximation)
            CASE 
                WHEN array_length(source_chunk.keywords, 1) > 0 AND array_length(dc.keywords, 1) > 0 THEN
                    (array_length(source_chunk.keywords & dc.keywords, 1)::DECIMAL / 
                     array_length(source_chunk.keywords | dc.keywords, 1))
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

SELECT 'Intelligent chunking algorithms created successfully' as status;