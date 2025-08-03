-- =====================================================
-- TASK 8 - STEP 3: Search Analytics and Optimization
-- Search Performance Monitoring and User Analytics
-- =====================================================

-- Create search queries log table for analytics
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query Information
    query_text TEXT NOT NULL,
    query_hash TEXT NOT NULL, -- Hash of normalized query for deduplication
    search_type TEXT DEFAULT 'documents'
        CHECK (search_type IN ('documents', 'chunks', 'themes', 'quotes', 'combined')),
    
    -- Search Configuration
    search_config TEXT DEFAULT 'standard_english',
    cultural_sensitivity_filter TEXT DEFAULT 'community_safe',
    filters_applied JSONB DEFAULT '{}',
    sort_by TEXT DEFAULT 'relevance',
    
    -- User Context
    user_id UUID, -- Would reference auth.users in real system
    community_id UUID REFERENCES communities(id),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Results Information
    results_count INTEGER DEFAULT 0,
    results_returned INTEGER DEFAULT 0,
    has_results BOOLEAN DEFAULT false,
    
    -- Performance Metrics
    query_duration_ms INTEGER,
    index_usage JSONB DEFAULT '{}', -- Which indexes were used
    
    -- User Interaction
    clicked_results UUID[] DEFAULT '{}', -- IDs of results clicked
    click_through_rate DECIMAL(5,4) DEFAULT 0.0,
    user_satisfaction_score INTEGER, -- 1-5 rating if provided
    
    -- Cultural Context
    accessed_sacred_content BOOLEAN DEFAULT false,
    cultural_protocols_triggered JSONB DEFAULT '{}',
    elder_approval_required BOOLEAN DEFAULT false,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search result clicks table for detailed analytics
CREATE TABLE IF NOT EXISTS search_result_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to search query
    search_query_id UUID NOT NULL REFERENCES search_queries(id) ON DELETE CASCADE,
    
    -- Clicked Result Information
    result_type TEXT NOT NULL
        CHECK (result_type IN ('document', 'chunk', 'theme', 'quote')),
    result_id UUID NOT NULL,
    result_rank INTEGER, -- Position in search results (1-based)
    
    -- Click Context
    click_timestamp TIMESTAMPTZ DEFAULT NOW(),
    time_to_click_ms INTEGER, -- Time from search to click
    
    -- User Context
    user_id UUID,
    community_id UUID REFERENCES communities(id),
    
    -- Cultural Context
    cultural_sensitivity_level TEXT,
    required_cultural_approval BOOLEAN DEFAULT false,
    
    -- Engagement Metrics
    time_spent_seconds INTEGER, -- Time spent viewing the result
    follow_up_actions JSONB DEFAULT '{}' -- Downloads, shares, etc.
);

-- Create search performance metrics table
CREATE TABLE IF NOT EXISTS search_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Period
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_hour INTEGER, -- Hour of day (0-23) for hourly metrics
    
    -- Community Context
    community_id UUID REFERENCES communities(id),
    
    -- Search Volume Metrics
    total_searches INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    unique_queries INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_query_duration_ms DECIMAL(8,2),
    median_query_duration_ms DECIMAL(8,2),
    p95_query_duration_ms DECIMAL(8,2),
    slow_queries_count INTEGER DEFAULT 0, -- Queries > 1000ms
    
    -- Result Quality Metrics
    avg_results_count DECIMAL(8,2),
    zero_results_rate DECIMAL(5,4), -- % of queries with no results
    avg_click_through_rate DECIMAL(5,4),
    avg_user_satisfaction DECIMAL(3,2),
    
    -- Cultural Metrics
    cultural_searches_count INTEGER DEFAULT 0,
    sacred_content_accessed INTEGER DEFAULT 0,
    elder_approvals_required INTEGER DEFAULT 0,
    cultural_protocols_triggered INTEGER DEFAULT 0,
    
    -- Popular Queries
    top_queries JSONB DEFAULT '{}', -- Top 10 queries with counts
    top_zero_result_queries JSONB DEFAULT '{}', -- Queries with no results
    
    -- Search Types Distribution
    document_searches INTEGER DEFAULT 0,
    chunk_searches INTEGER DEFAULT 0,
    theme_searches INTEGER DEFAULT 0,
    quote_searches INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(metric_date, metric_hour, community_id)
);

-- Function to log search queries
CREATE OR REPLACE FUNCTION log_search_query(
    p_query_text TEXT,
    p_search_type TEXT DEFAULT 'documents',
    p_search_config TEXT DEFAULT 'standard_english',
    p_community_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_filters JSONB DEFAULT '{}',
    p_results_count INTEGER DEFAULT 0,
    p_query_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    query_id UUID;
    query_hash TEXT;
    normalized_query TEXT;
BEGIN
    -- Normalize query for hashing (lowercase, trim, remove extra spaces)
    normalized_query := regexp_replace(lower(trim(p_query_text)), '\s+', ' ', 'g');
    query_hash := encode(digest(normalized_query || p_search_type || p_search_config, 'sha256'), 'hex');
    
    INSERT INTO search_queries (
        query_text,
        query_hash,
        search_type,
        search_config,
        community_id,
        user_id,
        filters_applied,
        results_count,
        results_returned,
        has_results,
        query_duration_ms
    ) VALUES (
        p_query_text,
        query_hash,
        p_search_type,
        p_search_config,
        p_community_id,
        p_user_id,
        p_filters,
        p_results_count,
        least(p_results_count, 20), -- Assuming default limit of 20
        p_results_count > 0,
        p_query_duration_ms
    ) RETURNING id INTO query_id;
    
    RETURN query_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log search result clicks
CREATE OR REPLACE FUNCTION log_search_click(
    p_search_query_id UUID,
    p_result_type TEXT,
    p_result_id UUID,
    p_result_rank INTEGER DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_time_to_click_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    click_id UUID;
    result_community_id UUID;
    result_cultural_level TEXT;
BEGIN
    -- Get result context based on type
    CASE p_result_type
        WHEN 'document' THEN
            SELECT community_id, cultural_sensitivity_level 
            INTO result_community_id, result_cultural_level
            FROM documents WHERE id = p_result_id;
        WHEN 'chunk' THEN
            SELECT community_id, cultural_sensitivity_level 
            INTO result_community_id, result_cultural_level
            FROM document_chunks WHERE id = p_result_id;
        WHEN 'theme' THEN
            SELECT community_id, cultural_significance 
            INTO result_community_id, result_cultural_level
            FROM document_themes WHERE id = p_result_id;
        WHEN 'quote' THEN
            SELECT community_id, cultural_significance 
            INTO result_community_id, result_cultural_level
            FROM document_quotes WHERE id = p_result_id;
    END CASE;
    
    INSERT INTO search_result_clicks (
        search_query_id,
        result_type,
        result_id,
        result_rank,
        user_id,
        community_id,
        cultural_sensitivity_level,
        required_cultural_approval,
        time_to_click_ms
    ) VALUES (
        p_search_query_id,
        p_result_type,
        p_result_id,
        p_result_rank,
        p_user_id,
        result_community_id,
        result_cultural_level,
        result_cultural_level IN ('sacred', 'ceremonial'),
        p_time_to_click_ms
    ) RETURNING id INTO click_id;
    
    -- Update search query with click information
    UPDATE search_queries 
    SET clicked_results = array_append(clicked_results, p_result_id),
        click_through_rate = (
            SELECT count(*)::DECIMAL / results_returned 
            FROM search_result_clicks 
            WHERE search_query_id = p_search_query_id
        )
    WHERE id = p_search_query_id;
    
    RETURN click_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily search metrics
CREATE OR REPLACE FUNCTION generate_search_metrics(
    p_date DATE DEFAULT CURRENT_DATE,
    p_community_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    community_record RECORD;
BEGIN
    -- If community_id is provided, process only that community
    IF p_community_id IS NOT NULL THEN
        PERFORM update_community_search_metrics(p_date, p_community_id);
    ELSE
        -- Process all communities
        FOR community_record IN SELECT id FROM communities
        LOOP
            PERFORM update_community_search_metrics(p_date, community_record.id);
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to update search metrics for a specific community
CREATE OR REPLACE FUNCTION update_community_search_metrics(
    p_date DATE,
    p_community_id UUID
)
RETURNS VOID AS $$
DECLARE
    metrics_data RECORD;
    top_queries JSONB;
    zero_result_queries JSONB;
BEGIN
    -- Calculate metrics for the date and community
    SELECT 
        count(*) as total_searches,
        count(DISTINCT user_id) as unique_users,
        count(DISTINCT query_hash) as unique_queries,
        avg(query_duration_ms) as avg_duration,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY query_duration_ms) as median_duration,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY query_duration_ms) as p95_duration,
        count(*) FILTER (WHERE query_duration_ms > 1000) as slow_queries,
        avg(results_count) as avg_results,
        count(*) FILTER (WHERE results_count = 0)::DECIMAL / count(*) as zero_results_rate,
        avg(click_through_rate) as avg_ctr,
        avg(user_satisfaction_score) as avg_satisfaction,
        count(*) FILTER (WHERE accessed_sacred_content = true) as sacred_accessed,
        count(*) FILTER (WHERE elder_approval_required = true) as elder_approvals,
        count(*) FILTER (WHERE search_type = 'documents') as doc_searches,
        count(*) FILTER (WHERE search_type = 'chunks') as chunk_searches,
        count(*) FILTER (WHERE search_type = 'themes') as theme_searches,
        count(*) FILTER (WHERE search_type = 'quotes') as quote_searches
    INTO metrics_data
    FROM search_queries 
    WHERE date(created_at) = p_date 
    AND (p_community_id IS NULL OR community_id = p_community_id);
    
    -- Get top queries
    SELECT jsonb_object_agg(query_text, query_count)
    INTO top_queries
    FROM (
        SELECT query_text, count(*) as query_count
        FROM search_queries 
        WHERE date(created_at) = p_date 
        AND (p_community_id IS NULL OR community_id = p_community_id)
        GROUP BY query_text
        ORDER BY count(*) DESC
        LIMIT 10
    ) top_q;
    
    -- Get top zero-result queries
    SELECT jsonb_object_agg(query_text, query_count)
    INTO zero_result_queries
    FROM (
        SELECT query_text, count(*) as query_count
        FROM search_queries 
        WHERE date(created_at) = p_date 
        AND (p_community_id IS NULL OR community_id = p_community_id)
        AND results_count = 0
        GROUP BY query_text
        ORDER BY count(*) DESC
        LIMIT 10
    ) zero_q;
    
    -- Insert or update metrics
    INSERT INTO search_performance_metrics (
        metric_date,
        community_id,
        total_searches,
        unique_users,
        unique_queries,
        avg_query_duration_ms,
        median_query_duration_ms,
        p95_query_duration_ms,
        slow_queries_count,
        avg_results_count,
        zero_results_rate,
        avg_click_through_rate,
        avg_user_satisfaction,
        sacred_content_accessed,
        elder_approvals_required,
        top_queries,
        top_zero_result_queries,
        document_searches,
        chunk_searches,
        theme_searches,
        quote_searches
    ) VALUES (
        p_date,
        p_community_id,
        COALESCE(metrics_data.total_searches, 0),
        COALESCE(metrics_data.unique_users, 0),
        COALESCE(metrics_data.unique_queries, 0),
        metrics_data.avg_duration,
        metrics_data.median_duration,
        metrics_data.p95_duration,
        COALESCE(metrics_data.slow_queries, 0),
        metrics_data.avg_results,
        COALESCE(metrics_data.zero_results_rate, 0),
        metrics_data.avg_ctr,
        metrics_data.avg_satisfaction,
        COALESCE(metrics_data.sacred_accessed, 0),
        COALESCE(metrics_data.elder_approvals, 0),
        COALESCE(top_queries, '{}'),
        COALESCE(zero_result_queries, '{}'),
        COALESCE(metrics_data.doc_searches, 0),
        COALESCE(metrics_data.chunk_searches, 0),
        COALESCE(metrics_data.theme_searches, 0),
        COALESCE(metrics_data.quote_searches, 0)
    ) ON CONFLICT (metric_date, metric_hour, community_id) DO UPDATE SET
        total_searches = EXCLUDED.total_searches,
        unique_users = EXCLUDED.unique_users,
        unique_queries = EXCLUDED.unique_queries,
        avg_query_duration_ms = EXCLUDED.avg_query_duration_ms,
        median_query_duration_ms = EXCLUDED.median_query_duration_ms,
        p95_query_duration_ms = EXCLUDED.p95_query_duration_ms,
        slow_queries_count = EXCLUDED.slow_queries_count,
        avg_results_count = EXCLUDED.avg_results_count,
        zero_results_rate = EXCLUDED.zero_results_rate,
        avg_click_through_rate = EXCLUDED.avg_click_through_rate,
        avg_user_satisfaction = EXCLUDED.avg_user_satisfaction,
        sacred_content_accessed = EXCLUDED.sacred_content_accessed,
        elder_approvals_required = EXCLUDED.elder_approvals_required,
        top_queries = EXCLUDED.top_queries,
        top_zero_result_queries = EXCLUDED.top_zero_result_queries,
        document_searches = EXCLUDED.document_searches,
        chunk_searches = EXCLUDED.chunk_searches,
        theme_searches = EXCLUDED.theme_searches,
        quote_searches = EXCLUDED.quote_searches;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Search queries indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_hash ON search_queries(query_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_community_date ON search_queries(community_id, date(created_at), search_type);
CREATE INDEX IF NOT EXISTS idx_search_queries_performance ON search_queries(query_duration_ms DESC, results_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_cultural ON search_queries(accessed_sacred_content, elder_approval_required, created_at DESC);

-- Search result clicks indexes
CREATE INDEX IF NOT EXISTS idx_search_clicks_query ON search_result_clicks(search_query_id, click_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_clicks_result ON search_result_clicks(result_type, result_id, click_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_clicks_community ON search_result_clicks(community_id, cultural_sensitivity_level, click_timestamp DESC);

-- Search performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_search_metrics_date_community ON search_performance_metrics(metric_date DESC, community_id);
CREATE INDEX IF NOT EXISTS idx_search_metrics_performance ON search_performance_metrics(avg_query_duration_ms DESC, zero_results_rate DESC);

SELECT 'Search analytics and optimization system created successfully' as status;