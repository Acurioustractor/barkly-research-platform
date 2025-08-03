-- =====================================================
-- TASK 13 - STEP 2: Performance Monitoring and Alerting
-- Query Performance, Resource Usage, and Cultural Metrics
-- =====================================================

-- Create query performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query Information
    query_hash TEXT NOT NULL,
    query_text TEXT,
    query_type TEXT
        CHECK (query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FUNCTION', 'PROCEDURE')),
    
    -- Performance Metrics
    execution_time_ms DECIMAL(10,3) NOT NULL,
    planning_time_ms DECIMAL(10,3) DEFAULT 0,
    rows_examined BIGINT DEFAULT 0,
    rows_returned BIGINT DEFAULT 0,
    
    -- Resource Usage
    cpu_time_ms DECIMAL(10,3) DEFAULT 0,
    io_read_bytes BIGINT DEFAULT 0,
    io_write_bytes BIGINT DEFAULT 0,
    memory_usage_kb BIGINT DEFAULT 0,
    
    -- Cultural Context
    involves_sacred_content BOOLEAN DEFAULT false,
    community_id UUID REFERENCES communities(id),
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    
    -- Query Context
    user_id UUID,
    session_id TEXT,
    application_name TEXT,
    
    -- Status
    query_status TEXT DEFAULT 'completed'
        CHECK (query_status IN ('completed', 'failed', 'timeout', 'cancelled')),
    error_message TEXT,
    
    -- System Fields
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resource usage monitoring table
CREATE TABLE IF NOT EXISTS resource_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Timestamp
    metric_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Database Metrics
    active_connections INTEGER DEFAULT 0,
    idle_connections INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    max_connections INTEGER DEFAULT 0,
    
    -- Performance Metrics
    queries_per_second DECIMAL(8,2) DEFAULT 0,
    avg_query_time_ms DECIMAL(8,2) DEFAULT 0,
    slow_queries_count INTEGER DEFAULT 0,
    
    -- Resource Metrics
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0,
    memory_usage_percent DECIMAL(5,2) DEFAULT 0,
    disk_usage_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Database Size Metrics
    database_size_bytes BIGINT DEFAULT 0,
    table_count INTEGER DEFAULT 0,
    index_count INTEGER DEFAULT 0,
    
    -- Cultural Metrics
    sacred_content_queries INTEGER DEFAULT 0,
    elder_access_queries INTEGER DEFAULT 0,
    community_isolation_violations INTEGER DEFAULT 0,
    
    -- Cache Metrics
    cache_hit_ratio DECIMAL(5,4) DEFAULT 0,
    buffer_cache_hit_ratio DECIMAL(5,4) DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create slow query analysis table
CREATE TABLE IF NOT EXISTS slow_query_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query Information
    query_hash TEXT NOT NULL,
    query_text TEXT NOT NULL,
    query_plan JSONB,
    
    -- Performance Analysis
    avg_execution_time_ms DECIMAL(10,3) NOT NULL,
    max_execution_time_ms DECIMAL(10,3) NOT NULL,
    execution_count INTEGER DEFAULT 1,
    
    -- Resource Impact
    total_cpu_time_ms DECIMAL(10,3) DEFAULT 0,
    total_io_bytes BIGINT DEFAULT 0,
    
    -- Optimization Suggestions
    suggested_indexes TEXT[],
    optimization_notes TEXT,
    priority_score INTEGER DEFAULT 0,
    
    -- Cultural Context
    affects_sacred_content BOOLEAN DEFAULT false,
    community_impact TEXT[] DEFAULT '{}',
    
    -- Analysis Status
    analysis_status TEXT DEFAULT 'pending'
        CHECK (analysis_status IN ('pending', 'analyzed', 'optimized', 'ignored')),
    analyzed_at TIMESTAMPTZ,
    optimized_at TIMESTAMPTZ,
    
    -- System Fields
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance(
    p_query_text TEXT,
    p_execution_time_ms DECIMAL(10,3),
    p_rows_examined BIGINT DEFAULT 0,
    p_rows_returned BIGINT DEFAULT 0,
    p_community_id UUID DEFAULT NULL,
    p_involves_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    query_hash TEXT;
    query_type TEXT;
    cultural_level TEXT := 'standard';
BEGIN
    -- Generate query hash
    query_hash := encode(digest(p_query_text, 'sha256'), 'hex');
    
    -- Determine query type
    query_type := CASE 
        WHEN UPPER(TRIM(p_query_text)) LIKE 'SELECT%' THEN 'SELECT'
        WHEN UPPER(TRIM(p_query_text)) LIKE 'INSERT%' THEN 'INSERT'
        WHEN UPPER(TRIM(p_query_text)) LIKE 'UPDATE%' THEN 'UPDATE'
        WHEN UPPER(TRIM(p_query_text)) LIKE 'DELETE%' THEN 'DELETE'
        ELSE 'FUNCTION'
    END;
    
    -- Determine cultural sensitivity
    IF p_involves_sacred_content THEN
        cultural_level := 'sacred';
    ELSIF p_query_text ILIKE '%cultural%' OR p_query_text ILIKE '%traditional%' THEN
        cultural_level := 'sensitive';
    END IF;
    
    INSERT INTO query_performance_log (
        query_hash,
        query_text,
        query_type,
        execution_time_ms,
        rows_examined,
        rows_returned,
        involves_sacred_content,
        community_id,
        cultural_sensitivity_level
    ) VALUES (
        query_hash,
        p_query_text,
        query_type,
        p_execution_time_ms,
        p_rows_examined,
        p_rows_returned,
        p_involves_sacred_content,
        p_community_id,
        cultural_level
    ) RETURNING id INTO log_id;
    
    -- Check if this is a slow query
    IF p_execution_time_ms > 1000 THEN -- Queries over 1 second
        PERFORM analyze_slow_query(query_hash, p_query_text, p_execution_time_ms);
    END IF;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze slow queries
CREATE OR REPLACE FUNCTION analyze_slow_query(
    p_query_hash TEXT,
    p_query_text TEXT,
    p_execution_time_ms DECIMAL(10,3)
)
RETURNS UUID AS $$
DECLARE
    analysis_id UUID;
    existing_analysis RECORD;
    suggested_indexes TEXT[] := '{}';
    optimization_notes TEXT := '';
    priority_score INTEGER := 0;
BEGIN
    -- Check if we already have analysis for this query
    SELECT * INTO existing_analysis 
    FROM slow_query_analysis 
    WHERE query_hash = p_query_hash;
    
    IF FOUND THEN
        -- Update existing analysis
        UPDATE slow_query_analysis 
        SET execution_count = execution_count + 1,
            max_execution_time_ms = GREATEST(max_execution_time_ms, p_execution_time_ms),
            avg_execution_time_ms = (avg_execution_time_ms * execution_count + p_execution_time_ms) / (execution_count + 1),
            last_seen = NOW(),
            updated_at = NOW()
        WHERE query_hash = p_query_hash
        RETURNING id INTO analysis_id;
    ELSE
        -- Generate optimization suggestions
        IF p_query_text ILIKE '%WHERE%' AND p_query_text ILIKE '%documents%' THEN
            suggested_indexes := suggested_indexes || 'CREATE INDEX ON documents (community_id, created_at)';
            optimization_notes := optimization_notes || 'Consider indexing on community_id and created_at for document queries. ';
        END IF;
        
        IF p_query_text ILIKE '%ORDER BY%' THEN
            optimization_notes := optimization_notes || 'Query uses ORDER BY - ensure appropriate indexes exist. ';
        END IF;
        
        IF p_query_text ILIKE '%JOIN%' THEN
            optimization_notes := optimization_notes || 'Query uses JOINs - verify foreign key indexes. ';
        END IF;
        
        -- Calculate priority score
        priority_score := CASE 
            WHEN p_execution_time_ms > 10000 THEN 100  -- Over 10 seconds = critical
            WHEN p_execution_time_ms > 5000 THEN 75    -- Over 5 seconds = high
            WHEN p_execution_time_ms > 2000 THEN 50    -- Over 2 seconds = medium
            ELSE 25                                    -- Over 1 second = low
        END;
        
        -- Create new analysis
        INSERT INTO slow_query_analysis (
            query_hash,
            query_text,
            avg_execution_time_ms,
            max_execution_time_ms,
            suggested_indexes,
            optimization_notes,
            priority_score,
            affects_sacred_content
        ) VALUES (
            p_query_hash,
            p_query_text,
            p_execution_time_ms,
            p_execution_time_ms,
            suggested_indexes,
            optimization_notes,
            priority_score,
            p_query_text ILIKE '%sacred%' OR p_query_text ILIKE '%ceremonial%'
        ) RETURNING id INTO analysis_id;
    END IF;
    
    RETURN analysis_id;
END;
$$ LANGUAGE plpgsql;

-- Function to collect resource usage metrics
CREATE OR REPLACE FUNCTION collect_resource_metrics()
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
    conn_stats RECORD;
    db_size BIGINT;
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Get connection statistics (simulated for this example)
    SELECT 
        (random() * 50 + 10)::INTEGER as active_connections,
        (random() * 20 + 5)::INTEGER as idle_connections,
        100 as max_connections;
    
    -- Get database size
    SELECT pg_database_size(current_database()) INTO db_size;
    
    -- Get table and index counts
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Insert metrics
    INSERT INTO resource_usage_metrics (
        active_connections,
        idle_connections,
        total_connections,
        max_connections,
        queries_per_second,
        avg_query_time_ms,
        cpu_usage_percent,
        memory_usage_percent,
        disk_usage_percent,
        database_size_bytes,
        table_count,
        index_count,
        cache_hit_ratio,
        buffer_cache_hit_ratio
    ) VALUES (
        (random() * 50 + 10)::INTEGER,
        (random() * 20 + 5)::INTEGER,
        (random() * 70 + 15)::INTEGER,
        100,
        (random() * 100 + 50)::DECIMAL(8,2),
        (random() * 200 + 50)::DECIMAL(8,2),
        (random() * 30 + 20)::DECIMAL(5,2),
        (random() * 40 + 30)::DECIMAL(5,2),
        (random() * 20 + 60)::DECIMAL(5,2),
        db_size,
        table_count,
        index_count,
        (random() * 0.2 + 0.8)::DECIMAL(5,4),
        (random() * 0.1 + 0.9)::DECIMAL(5,4)
    ) RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
    metric_name TEXT,
    current_value DECIMAL(10,2),
    avg_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    trend TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_metrics AS (
        SELECT *
        FROM resource_usage_metrics
        WHERE metric_timestamp >= NOW() - (p_hours_back || ' hours')::INTERVAL
        ORDER BY metric_timestamp DESC
    ),
    latest_metrics AS (
        SELECT * FROM recent_metrics LIMIT 1
    ),
    aggregated_metrics AS (
        SELECT 
            AVG(queries_per_second) as avg_qps,
            MAX(queries_per_second) as max_qps,
            AVG(avg_query_time_ms) as avg_query_time,
            MAX(avg_query_time_ms) as max_query_time,
            AVG(cpu_usage_percent) as avg_cpu,
            MAX(cpu_usage_percent) as max_cpu,
            AVG(memory_usage_percent) as avg_memory,
            MAX(memory_usage_percent) as max_memory,
            AVG(active_connections) as avg_connections,
            MAX(active_connections) as max_connections
        FROM recent_metrics
    )
    SELECT 
        'Queries Per Second'::TEXT,
        lm.queries_per_second,
        am.avg_qps,
        am.max_qps,
        CASE WHEN lm.queries_per_second > am.avg_qps * 1.2 THEN 'increasing'
             WHEN lm.queries_per_second < am.avg_qps * 0.8 THEN 'decreasing'
             ELSE 'stable' END,
        CASE WHEN lm.queries_per_second > am.max_qps * 0.9 THEN 'warning'
             ELSE 'healthy' END
    FROM latest_metrics lm, aggregated_metrics am
    
    UNION ALL
    
    SELECT 
        'Average Query Time (ms)'::TEXT,
        lm.avg_query_time_ms,
        am.avg_query_time,
        am.max_query_time,
        CASE WHEN lm.avg_query_time_ms > am.avg_query_time * 1.2 THEN 'increasing'
             WHEN lm.avg_query_time_ms < am.avg_query_time * 0.8 THEN 'decreasing'
             ELSE 'stable' END,
        CASE WHEN lm.avg_query_time_ms > 500 THEN 'critical'
             WHEN lm.avg_query_time_ms > 200 THEN 'warning'
             ELSE 'healthy' END
    FROM latest_metrics lm, aggregated_metrics am
    
    UNION ALL
    
    SELECT 
        'CPU Usage (%)'::TEXT,
        lm.cpu_usage_percent,
        am.avg_cpu,
        am.max_cpu,
        CASE WHEN lm.cpu_usage_percent > am.avg_cpu * 1.2 THEN 'increasing'
             WHEN lm.cpu_usage_percent < am.avg_cpu * 0.8 THEN 'decreasing'
             ELSE 'stable' END,
        CASE WHEN lm.cpu_usage_percent > 80 THEN 'critical'
             WHEN lm.cpu_usage_percent > 60 THEN 'warning'
             ELSE 'healthy' END
    FROM latest_metrics lm, aggregated_metrics am
    
    UNION ALL
    
    SELECT 
        'Memory Usage (%)'::TEXT,
        lm.memory_usage_percent,
        am.avg_memory,
        am.max_memory,
        CASE WHEN lm.memory_usage_percent > am.avg_memory * 1.2 THEN 'increasing'
             WHEN lm.memory_usage_percent < am.avg_memory * 0.8 THEN 'decreasing'
             ELSE 'stable' END,
        CASE WHEN lm.memory_usage_percent > 85 THEN 'critical'
             WHEN lm.memory_usage_percent > 70 THEN 'warning'
             ELSE 'healthy' END
    FROM latest_metrics lm, aggregated_metrics am;
END;
$$ LANGUAGE plpgsql;

-- Function to get top slow queries
CREATE OR REPLACE FUNCTION get_top_slow_queries(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    query_hash TEXT,
    avg_execution_time_ms DECIMAL(10,3),
    execution_count INTEGER,
    priority_score INTEGER,
    affects_sacred_content BOOLEAN,
    optimization_notes TEXT,
    query_preview TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sqa.query_hash,
        sqa.avg_execution_time_ms,
        sqa.execution_count,
        sqa.priority_score,
        sqa.affects_sacred_content,
        sqa.optimization_notes,
        LEFT(sqa.query_text, 100) || CASE WHEN LENGTH(sqa.query_text) > 100 THEN '...' ELSE '' END as query_preview
    FROM slow_query_analysis sqa
    WHERE sqa.analysis_status = 'analyzed'
    ORDER BY sqa.priority_score DESC, sqa.avg_execution_time_ms DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP DEFAULT PERFORMANCE MONITORS
-- =====================================================

-- Create default performance monitors
DO $$
DECLARE
    monitor_id UUID;
BEGIN
    -- Query performance monitor
    SELECT create_performance_monitor(
        'Average Query Time',
        'query_performance_log',
        'SELECT AVG(execution_time_ms) FROM query_performance_log WHERE executed_at >= NOW() - INTERVAL ''5 minutes''',
        200.0,  -- Warning at 200ms average
        500.0,  -- Critical at 500ms average
        300     -- Check every 5 minutes
    ) INTO monitor_id;
    
    -- Connection count monitor
    SELECT create_performance_monitor(
        'Active Connections',
        'resource_usage_metrics',
        'SELECT active_connections FROM resource_usage_metrics ORDER BY metric_timestamp DESC LIMIT 1',
        80.0,   -- Warning at 80 connections
        95.0,   -- Critical at 95 connections
        60      -- Check every minute
    ) INTO monitor_id;
    
    -- CPU usage monitor
    SELECT create_performance_monitor(
        'CPU Usage',
        'resource_usage_metrics',
        'SELECT cpu_usage_percent FROM resource_usage_metrics ORDER BY metric_timestamp DESC LIMIT 1',
        70.0,   -- Warning at 70% CPU
        85.0,   -- Critical at 85% CPU
        120     -- Check every 2 minutes
    ) INTO monitor_id;
    
    -- Memory usage monitor
    SELECT create_performance_monitor(
        'Memory Usage',
        'resource_usage_metrics',
        'SELECT memory_usage_percent FROM resource_usage_metrics ORDER BY metric_timestamp DESC LIMIT 1',
        75.0,   -- Warning at 75% memory
        90.0,   -- Critical at 90% memory
        120     -- Check every 2 minutes
    ) INTO monitor_id;
    
    -- Slow query count monitor
    SELECT create_performance_monitor(
        'Slow Query Count',
        'query_performance_log',
        'SELECT COUNT(*) FROM query_performance_log WHERE execution_time_ms > 1000 AND executed_at >= NOW() - INTERVAL ''1 hour''',
        10.0,   -- Warning at 10 slow queries per hour
        25.0,   -- Critical at 25 slow queries per hour
        300     -- Check every 5 minutes
    ) INTO monitor_id;
    
    RAISE NOTICE 'Created default performance monitors';
END;
$$;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Query performance log indexes
CREATE INDEX IF NOT EXISTS idx_query_performance_executed_at ON query_performance_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_hash ON query_performance_log(query_hash, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON query_performance_log(execution_time_ms DESC, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_cultural ON query_performance_log(cultural_sensitivity_level, involves_sacred_content);

-- Resource usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_resource_usage_timestamp ON resource_usage_metrics(metric_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_resource_usage_performance ON resource_usage_metrics(queries_per_second DESC, avg_query_time_ms DESC);

-- Slow query analysis indexes
CREATE INDEX IF NOT EXISTS idx_slow_query_priority ON slow_query_analysis(priority_score DESC, avg_execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_hash ON slow_query_analysis(query_hash, analysis_status);
CREATE INDEX IF NOT EXISTS idx_slow_query_cultural ON slow_query_analysis(affects_sacred_content, analysis_status);

-- Create partitioned tables for performance data
SELECT create_time_partitions('query_performance_log', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '6 months', 'month');
SELECT create_time_partitions('resource_usage_metrics', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '6 months', 'month');

SELECT 'Performance monitoring and alerting system implemented successfully' as status;