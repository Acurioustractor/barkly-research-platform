-- =====================================================
-- TASK 8 - STEP 1: Full-Text Search with Custom Configurations
-- Advanced Search Capabilities for Indigenous Research Platform
-- =====================================================

-- Create custom text search configurations for Indigenous content
CREATE TEXT SEARCH CONFIGURATION indigenous_english (COPY = english);

-- Create custom dictionary for Indigenous terms (placeholder - would be populated with actual terms)
CREATE TEXT SEARCH DICTIONARY indigenous_terms (
    TEMPLATE = simple,
    STOPWORDS = english
);

-- Add Indigenous terms to the configuration (this would be expanded with actual terms)
ALTER TEXT SEARCH CONFIGURATION indigenous_english
    ALTER MAPPING FOR asciiword WITH indigenous_terms, english_stem;

-- Create search configurations table for managing different search contexts
CREATE TABLE IF NOT EXISTS search_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration Information
    config_name TEXT NOT NULL UNIQUE,
    config_description TEXT,
    ts_config_name TEXT NOT NULL, -- PostgreSQL text search config name
    
    -- Cultural Context
    cultural_context TEXT DEFAULT 'general'
        CHECK (cultural_context IN ('general', 'cultural', 'sacred', 'ceremonial')),
    supports_indigenous_terms BOOLEAN DEFAULT false,
    
    -- Search Behavior
    default_operator TEXT DEFAULT 'and'
        CHECK (default_operator IN ('and', 'or')),
    enable_fuzzy_search BOOLEAN DEFAULT true,
    enable_phrase_search BOOLEAN DEFAULT true,
    enable_proximity_search BOOLEAN DEFAULT false,
    
    -- Ranking Configuration
    title_weight DECIMAL(3,2) DEFAULT 1.0,
    content_weight DECIMAL(3,2) DEFAULT 0.4,
    keywords_weight DECIMAL(3,2) DEFAULT 0.8,
    cultural_terms_weight DECIMAL(3,2) DEFAULT 1.2,
    
    -- System Fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default search configurations
INSERT INTO search_configurations (config_name, config_description, ts_config_name, cultural_context, supports_indigenous_terms) VALUES
('standard_english', 'Standard English text search', 'english', 'general', false),
('indigenous_english', 'English with Indigenous terms support', 'indigenous_english', 'cultural', true),
('cultural_sensitive', 'Cultural content with sensitivity filtering', 'indigenous_english', 'sacred', true);

-- Create search indexes table for managing search performance
CREATE TABLE IF NOT EXISTS search_indexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Index Information
    index_name TEXT NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    column_names TEXT[] NOT NULL,
    index_type TEXT NOT NULL
        CHECK (index_type IN ('gin', 'gist', 'btree', 'hash')),
    
    -- Search Configuration
    search_config_id UUID REFERENCES search_configurations(id),
    ts_vector_expression TEXT, -- The tsvector expression used
    
    -- Performance Metrics
    index_size_bytes BIGINT,
    last_analyzed TIMESTAMPTZ,
    usage_count BIGINT DEFAULT 0,
    avg_query_time_ms DECIMAL(8,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive search function for documents
CREATE OR REPLACE FUNCTION search_documents(
    p_query TEXT,
    p_community_id UUID DEFAULT NULL,
    p_search_config TEXT DEFAULT 'standard_english',
    p_cultural_sensitivity_filter TEXT DEFAULT 'all',
    p_document_types TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    document_id UUID,
    title TEXT,
    filename TEXT,
    cultural_sensitivity_level TEXT,
    rank REAL,
    headline TEXT,
    snippet TEXT,
    match_type TEXT
) AS $$
DECLARE
    search_config_name TEXT;
    ts_query tsquery;
    cultural_filter TEXT;
BEGIN
    -- Get search configuration
    SELECT ts_config_name INTO search_config_name 
    FROM search_configurations 
    WHERE config_name = p_search_config AND is_active = true;
    
    IF search_config_name IS NULL THEN
        search_config_name := 'english';
    END IF;
    
    -- Build tsquery
    ts_query := plainto_tsquery(search_config_name, p_query);
    
    -- Build cultural sensitivity filter
    CASE p_cultural_sensitivity_filter
        WHEN 'public_only' THEN cultural_filter := 'public';
        WHEN 'community_safe' THEN cultural_filter := 'public,community';
        WHEN 'all_accessible' THEN cultural_filter := 'public,community,restricted';
        ELSE cultural_filter := 'public,community,restricted,sacred,ceremonial';
    END CASE;
    
    RETURN QUERY
    WITH search_results AS (
        SELECT 
            d.id,
            d.title,
            d.filename,
            d.cultural_sensitivity_level,
            -- Calculate comprehensive ranking
            (
                ts_rank_cd(
                    setweight(to_tsvector(search_config_name, coalesce(d.title, '')), 'A') ||
                    setweight(to_tsvector(search_config_name, coalesce(d.description, '')), 'B') ||
                    setweight(to_tsvector(search_config_name, coalesce(d.text_content, '')), 'C') ||
                    setweight(to_tsvector(search_config_name, array_to_string(d.keywords, ' ')), 'D'),
                    ts_query,
                    32 -- normalization flag
                ) * 
                -- Cultural relevance boost
                CASE 
                    WHEN d.cultural_sensitivity_level IN ('sacred', 'ceremonial') AND p_search_config = 'indigenous_english' THEN 1.5
                    WHEN d.cultural_sensitivity_level = 'restricted' AND p_search_config = 'cultural_sensitive' THEN 1.2
                    ELSE 1.0
                END *
                -- Recency boost (newer documents get slight boost)
                (1.0 + (EXTRACT(EPOCH FROM NOW() - d.created_at) / (365 * 24 * 3600))::DECIMAL * -0.1)
            ) as rank,
            -- Generate headline
            ts_headline(
                search_config_name,
                coalesce(d.title || ' ' || d.description, d.filename),
                ts_query,
                'MaxWords=20, MinWords=5, ShortWord=3, HighlightAll=false'
            ) as headline,
            -- Generate snippet from content
            ts_headline(
                search_config_name,
                coalesce(d.text_content, d.description, 'No content available'),
                ts_query,
                'MaxWords=50, MinWords=10, ShortWord=3, HighlightAll=false'
            ) as snippet,
            -- Determine match type
            CASE 
                WHEN to_tsvector(search_config_name, coalesce(d.title, '')) @@ ts_query THEN 'title'
                WHEN to_tsvector(search_config_name, coalesce(d.description, '')) @@ ts_query THEN 'description'
                WHEN to_tsvector(search_config_name, array_to_string(d.keywords, ' ')) @@ ts_query THEN 'keywords'
                ELSE 'content'
            END as match_type
        FROM documents d
        WHERE 
            -- Text search match
            (
                to_tsvector(search_config_name, coalesce(d.title, '')) ||
                to_tsvector(search_config_name, coalesce(d.description, '')) ||
                to_tsvector(search_config_name, coalesce(d.text_content, '')) ||
                to_tsvector(search_config_name, array_to_string(d.keywords, ' '))
            ) @@ ts_query
            -- Community filter
            AND (p_community_id IS NULL OR d.community_id = p_community_id)
            -- Cultural sensitivity filter
            AND d.cultural_sensitivity_level = ANY(string_to_array(cultural_filter, ','))
            -- Document type filter
            AND (p_document_types IS NULL OR d.document_type = ANY(p_document_types))
            -- Access control (basic - would integrate with RLS)
            AND (
                d.access_level = 'public' 
                OR d.cultural_sensitivity_level NOT IN ('sacred', 'ceremonial')
            )
    )
    SELECT 
        sr.id,
        sr.title,
        sr.filename,
        sr.cultural_sensitivity_level,
        sr.rank,
        sr.headline,
        sr.snippet,
        sr.match_type
    FROM search_results sr
    ORDER BY sr.rank DESC, sr.cultural_sensitivity_level DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to search chunks with context
CREATE OR REPLACE FUNCTION search_chunks(
    p_query TEXT,
    p_community_id UUID DEFAULT NULL,
    p_search_config TEXT DEFAULT 'standard_english',
    p_cultural_sensitivity_filter TEXT DEFAULT 'community_safe',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    chunk_id UUID,
    document_id UUID,
    document_title TEXT,
    chunk_content TEXT,
    cultural_sensitivity_level TEXT,
    rank REAL,
    headline TEXT,
    chunk_index INTEGER
) AS $$
DECLARE
    search_config_name TEXT;
    ts_query tsquery;
    cultural_filter TEXT;
BEGIN
    -- Get search configuration
    SELECT ts_config_name INTO search_config_name 
    FROM search_configurations 
    WHERE config_name = p_search_config AND is_active = true;
    
    IF search_config_name IS NULL THEN
        search_config_name := 'english';
    END IF;
    
    -- Build tsquery
    ts_query := plainto_tsquery(search_config_name, p_query);
    
    -- Build cultural sensitivity filter
    CASE p_cultural_sensitivity_filter
        WHEN 'public_only' THEN cultural_filter := 'public';
        WHEN 'community_safe' THEN cultural_filter := 'public,community';
        WHEN 'all_accessible' THEN cultural_filter := 'public,community,restricted';
        ELSE cultural_filter := 'public,community,restricted,sacred,ceremonial';
    END CASE;
    
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        d.title,
        dc.content,
        dc.cultural_sensitivity_level,
        ts_rank_cd(
            setweight(to_tsvector(search_config_name, dc.content), 'A') ||
            setweight(to_tsvector(search_config_name, array_to_string(dc.keywords, ' ')), 'B'),
            ts_query,
            32
        ) * 
        -- Cultural relevance boost
        CASE 
            WHEN dc.cultural_sensitivity_level IN ('sacred', 'ceremonial') AND p_search_config = 'indigenous_english' THEN 1.3
            ELSE 1.0
        END as rank,
        ts_headline(
            search_config_name,
            dc.content,
            ts_query,
            'MaxWords=30, MinWords=5, ShortWord=3, HighlightAll=false'
        ) as headline,
        dc.chunk_index
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE 
        -- Text search match
        to_tsvector(search_config_name, dc.content) @@ ts_query
        -- Community filter
        AND (p_community_id IS NULL OR dc.community_id = p_community_id)
        -- Cultural sensitivity filter
        AND dc.cultural_sensitivity_level = ANY(string_to_array(cultural_filter, ','))
        -- Processing status
        AND dc.processing_status = 'completed'
    ORDER BY rank DESC, dc.cultural_sensitivity_level DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to search themes
CREATE OR REPLACE FUNCTION search_themes(
    p_query TEXT,
    p_community_id UUID DEFAULT NULL,
    p_search_config TEXT DEFAULT 'standard_english',
    p_cultural_sensitivity_filter TEXT DEFAULT 'community_safe',
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    theme_id UUID,
    theme_name TEXT,
    theme_description TEXT,
    cultural_significance TEXT,
    confidence_score DECIMAL(5,4),
    document_count BIGINT,
    rank REAL
) AS $$
DECLARE
    search_config_name TEXT;
    ts_query tsquery;
BEGIN
    -- Get search configuration
    SELECT ts_config_name INTO search_config_name 
    FROM search_configurations 
    WHERE config_name = p_search_config AND is_active = true;
    
    IF search_config_name IS NULL THEN
        search_config_name := 'english';
    END IF;
    
    -- Build tsquery
    ts_query := plainto_tsquery(search_config_name, p_query);
    
    RETURN QUERY
    SELECT 
        dt.id,
        dt.theme_name,
        dt.theme_description,
        dt.cultural_significance,
        dt.confidence_score,
        count(*) OVER (PARTITION BY dt.theme_slug) as document_count,
        ts_rank_cd(
            setweight(to_tsvector(search_config_name, dt.theme_name), 'A') ||
            setweight(to_tsvector(search_config_name, coalesce(dt.theme_description, '')), 'B') ||
            setweight(to_tsvector(search_config_name, array_to_string(dt.key_phrases, ' ')), 'C'),
            ts_query,
            32
        ) as rank
    FROM document_themes dt
    WHERE 
        -- Text search match
        (
            to_tsvector(search_config_name, dt.theme_name) ||
            to_tsvector(search_config_name, coalesce(dt.theme_description, '')) ||
            to_tsvector(search_config_name, array_to_string(dt.key_phrases, ' '))
        ) @@ ts_query
        -- Community filter
        AND (p_community_id IS NULL OR dt.community_id = p_community_id)
        -- Cultural sensitivity filter
        AND CASE p_cultural_sensitivity_filter
            WHEN 'public_only' THEN dt.cultural_significance = 'standard'
            WHEN 'community_safe' THEN dt.cultural_significance IN ('standard', 'sensitive')
            WHEN 'all_accessible' THEN dt.cultural_significance IN ('standard', 'sensitive', 'sacred')
            ELSE true
        END
        -- Processing status
        AND dt.processing_status IN ('completed', 'approved')
    ORDER BY rank DESC, dt.confidence_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

SELECT 'Full-text search system with cultural sensitivity created successfully' as status;