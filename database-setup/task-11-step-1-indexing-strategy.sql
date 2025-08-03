-- =====================================================
-- TASK 11 - STEP 1: Comprehensive Indexing Strategy
-- Advanced Database Performance Optimization
-- =====================================================

-- Create index management table for tracking and optimization
CREATE TABLE IF NOT EXISTS database_indexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Index Information
    index_name TEXT NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    column_names TEXT[] NOT NULL,
    index_type TEXT NOT NULL
        CHECK (index_type IN ('btree', 'hash', 'gin', 'gist', 'spgist', 'brin', 'bloom')),
    
    -- Index Purpose and Context
    index_purpose TEXT NOT NULL
        CHECK (index_purpose IN ('primary_key', 'foreign_key', 'unique_constraint', 'search_optimization', 'sort_optimization', 'join_optimization', 'cultural_filtering', 'performance_critical')),
    index_description TEXT,
    
    -- Performance Metrics
    index_size_bytes BIGINT,
    index_scans BIGINT DEFAULT 0,
    tuples_read BIGINT DEFAULT 0,
    tuples_fetched BIGINT DEFAULT 0,
    
    -- Usage Statistics
    last_used TIMESTAMPTZ,
    usage_frequency TEXT DEFAULT 'unknown'
        CHECK (usage_frequency IN ('very_high', 'high', 'medium', 'low', 'very_low', 'unused', 'unknown')),
    
    -- Maintenance Information
    last_analyzed TIMESTAMPTZ,
    last_vacuumed TIMESTAMPTZ,
    bloat_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Cultural Context
    cultural_index BOOLEAN DEFAULT false,
    supports_cultural_filtering BOOLEAN DEFAULT false,
    elder_access_optimization BOOLEAN DEFAULT false,
    
    -- Status and Recommendations
    is_active BOOLEAN DEFAULT true,
    is_recommended BOOLEAN DEFAULT true,
    optimization_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create query performance tracking table
CREATE TABLE IF NOT EXISTS query_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query Information
    query_hash TEXT NOT NULL, -- Hash of normalized query
    query_text TEXT NOT NULL,
    query_type TEXT NOT NULL
        CHECK (query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'SEARCH', 'AGGREGATE')),
    
    -- Performance Metrics
    execution_count BIGINT DEFAULT 1,
    total_execution_time_ms BIGINT DEFAULT 0,
    avg_execution_time_ms DECIMAL(10,3) DEFAULT 0,
    min_execution_time_ms BIGINT DEFAULT 0,
    max_execution_time_ms BIGINT DEFAULT 0,
    
    -- Resource Usage
    shared_blks_hit BIGINT DEFAULT 0,
    shared_blks_read BIGINT DEFAULT 0,
    shared_blks_dirtied BIGINT DEFAULT 0,
    temp_blks_read BIGINT DEFAULT 0,
    temp_blks_written BIGINT DEFAULT 0,
    
    -- Cultural Context
    accesses_cultural_data BOOLEAN DEFAULT false,
    requires_elder_permissions BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT,
    
    -- Query Context
    table_names TEXT[] DEFAULT '{}',
    index_names_used TEXT[] DEFAULT '{}',
    
    -- Performance Classification
    performance_class TEXT DEFAULT 'normal'
        CHECK (performance_class IN ('fast', 'normal', 'slow', 'very_slow', 'critical')),
    
    -- Optimization Status
    needs_optimization BOOLEAN DEFAULT false,
    optimization_suggestions TEXT[] DEFAULT '{}',
    
    -- System Fields
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADVANCED INDEXING FUNCTIONS
-- =====================================================

-- Function to analyze and recommend indexes
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    table_name TEXT,
    index_name TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    index_size TEXT,
    usage_recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        CASE 
            WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
            WHEN idx_scan < 100 THEN 'LOW USAGE - Review necessity'
            WHEN idx_scan < 1000 THEN 'MODERATE USAGE - Monitor'
            WHEN idx_scan < 10000 THEN 'HIGH USAGE - Keep and optimize'
            ELSE 'CRITICAL - Essential for performance'
        END as usage_recommendation
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC, pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify missing indexes
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE(
    table_name TEXT,
    column_name TEXT,
    suggestion_reason TEXT,
    estimated_benefit TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH table_stats AS (
        SELECT 
            schemaname,
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
    ),
    column_stats AS (
        SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation
        FROM pg_stats
        WHERE schemaname = 'public'
    )
    SELECT 
        ts.tablename,
        cs.attname,
        CASE 
            WHEN ts.seq_scan > ts.idx_scan * 2 AND cs.n_distinct > 100 THEN 'High sequential scans on selective column'
            WHEN cs.correlation < -0.5 OR cs.correlation > 0.5 THEN 'High correlation suggests index benefit'
            WHEN cs.n_distinct > ts.seq_tup_read * 0.1 THEN 'Good selectivity for indexing'
            ELSE 'General performance improvement'
        END as suggestion_reason,
        CASE 
            WHEN ts.seq_scan > 10000 THEN 'HIGH - Significant performance gain expected'
            WHEN ts.seq_scan > 1000 THEN 'MEDIUM - Moderate performance improvement'
            ELSE 'LOW - Minor performance benefit'
        END as estimated_benefit
    FROM table_stats ts
    JOIN column_stats cs ON ts.tablename = cs.tablename
    WHERE ts.seq_scan > 100
    AND cs.n_distinct > 10
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = ts.tablename 
        AND indexdef LIKE '%' || cs.attname || '%'
    )
    ORDER BY ts.seq_scan DESC, cs.n_distinct DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create cultural sensitivity indexes
CREATE OR REPLACE FUNCTION create_cultural_indexes()
RETURNS INTEGER AS $$
DECLARE
    index_count INTEGER := 0;
BEGIN
    -- Cultural sensitivity filtering indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_cultural_community_date 
        ON documents(cultural_sensitivity_level, community_id, created_at DESC);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_documents_cultural_community_date already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_cultural_community 
        ON document_chunks(cultural_sensitivity_level, community_id, processing_status);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_chunks_cultural_community already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_themes_cultural_confidence 
        ON document_themes(cultural_significance, confidence_score DESC, community_id);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_themes_cultural_confidence already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_cultural_significance 
        ON document_quotes(cultural_significance, significance_score DESC, community_id);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_quotes_cultural_significance already exists or failed to create';
    END;
    
    -- Elder access optimization indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_elder_review 
        ON documents(requires_elder_approval, cultural_sensitivity_level, community_id) 
        WHERE requires_elder_approval = true;
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_documents_elder_review already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_themes_elder_review 
        ON document_themes(requires_elder_review, elder_reviewed, cultural_significance, community_id) 
        WHERE requires_elder_review = true;
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_themes_elder_review already exists or failed to create';
    END;
    
    -- Research collaboration indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collaborations_elder_cultural 
        ON research_collaborations(elder_status, cultural_authority_areas, status) 
        WHERE elder_status = true;
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_collaborations_elder_cultural already exists or failed to create';
    END;
    
    -- Activity feed cultural filtering
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_cultural_elder 
        ON activity_feed(community_id, created_at DESC) 
        WHERE jsonb_extract_path_text(activity_metadata, 'cultural_significance') IN ('sacred', 'ceremonial');
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_activity_cultural_elder already exists or failed to create';
    END;
    
    RETURN index_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create performance-critical indexes
CREATE OR REPLACE FUNCTION create_performance_indexes()
RETURNS INTEGER AS $$
DECLARE
    index_count INTEGER := 0;
BEGIN
    -- Search performance indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_search_performance 
        ON documents USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(text_content, '')));
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_documents_search_performance already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_search_performance 
        ON document_chunks USING gin(to_tsvector('english', content));
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_chunks_search_performance already exists or failed to create';
    END;
    
    -- Join optimization indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_documents_join 
        ON collection_documents(collection_id, document_id, sort_order);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_collection_documents_join already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_chunks_join 
        ON document_chunks(document_id, chunk_index, processing_status);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_document_chunks_join already exists or failed to create';
    END;
    
    -- Analytics and reporting indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_queries_analytics 
        ON search_queries(community_id, created_at DESC, has_results);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_search_queries_analytics already exists or failed to create';
    END;
    
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_analytics 
        ON user_sessions(community_id, status, last_activity_at DESC);
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_user_sessions_analytics already exists or failed to create';
    END;
    
    -- Audit and compliance indexes
    BEGIN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_cultural_compliance 
        ON audit_log(community_id, created_at DESC) 
        WHERE cultural_protocols_involved = true;
        index_count := index_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Index idx_audit_log_cultural_compliance already exists or failed to create';
    END;
    
    RETURN index_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update index statistics
CREATE OR REPLACE FUNCTION update_index_statistics()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT 
            indexname,
            tablename,
            pg_relation_size(indexrelid) as size_bytes,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
    LOOP
        INSERT INTO database_indexes (
            index_name,
            table_name,
            index_size_bytes,
            index_scans,
            tuples_read,
            tuples_fetched,
            last_analyzed,
            usage_frequency,
            index_type,
            column_names,
            index_purpose
        ) VALUES (
            index_record.indexname,
            index_record.tablename,
            index_record.size_bytes,
            index_record.idx_scan,
            index_record.idx_tup_read,
            index_record.idx_tup_fetch,
            NOW(),
            CASE 
                WHEN index_record.idx_scan = 0 THEN 'unused'
                WHEN index_record.idx_scan < 100 THEN 'very_low'
                WHEN index_record.idx_scan < 1000 THEN 'low'
                WHEN index_record.idx_scan < 10000 THEN 'medium'
                WHEN index_record.idx_scan < 100000 THEN 'high'
                ELSE 'very_high'
            END,
            'btree', -- Default assumption
            ARRAY[index_record.indexname], -- Simplified
            'performance_critical'
        ) ON CONFLICT (index_name) DO UPDATE SET
            index_size_bytes = EXCLUDED.index_size_bytes,
            index_scans = EXCLUDED.index_scans,
            tuples_read = EXCLUDED.tuples_read,
            tuples_fetched = EXCLUDED.tuples_fetched,
            last_analyzed = EXCLUDED.last_analyzed,
            usage_frequency = EXCLUDED.usage_frequency,
            updated_at = NOW();
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES FOR INDEX MANAGEMENT
-- =====================================================

-- Database indexes table indexes
CREATE INDEX IF NOT EXISTS idx_database_indexes_table ON database_indexes(table_name, is_active, usage_frequency);
CREATE INDEX IF NOT EXISTS idx_database_indexes_usage ON database_indexes(usage_frequency, index_scans DESC, index_size_bytes DESC);
CREATE INDEX IF NOT EXISTS idx_database_indexes_cultural ON database_indexes(cultural_index, supports_cultural_filtering, elder_access_optimization);

-- Query performance table indexes
CREATE INDEX IF NOT EXISTS idx_query_performance_hash ON query_performance(query_hash, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_slow ON query_performance(performance_class, avg_execution_time_ms DESC) WHERE performance_class IN ('slow', 'very_slow', 'critical');
CREATE INDEX IF NOT EXISTS idx_query_performance_cultural ON query_performance(accesses_cultural_data, requires_elder_permissions, cultural_sensitivity_level);

SELECT 'Comprehensive indexing strategy implemented successfully' as status;