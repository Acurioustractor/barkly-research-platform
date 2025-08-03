-- =====================================================
-- Community Status Tracking Table
-- Stores historical status updates and changes
-- =====================================================

-- Create community status updates table
CREATE TABLE IF NOT EXISTS community_status_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL,
    
    -- Status snapshot
    timestamp TIMESTAMPTZ NOT NULL,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    status TEXT NOT NULL CHECK (status IN ('thriving', 'developing', 'struggling', 'improving')),
    
    -- Individual indicators at time of update
    indicators JSONB NOT NULL DEFAULT '{}',
    
    -- Update metadata
    trigger_event TEXT, -- what caused this update
    metadata JSONB DEFAULT '{}', -- additional context
    
    -- System timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id, timestamp)
);

-- Add foreign key constraint (if communities table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities') THEN
        ALTER TABLE community_status_updates 
        ADD CONSTRAINT fk_status_updates_community 
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_updates_community ON community_status_updates(community_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_timestamp ON community_status_updates(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_status_updates_status ON community_status_updates(status);
CREATE INDEX IF NOT EXISTS idx_status_updates_score ON community_status_updates(health_score);
CREATE INDEX IF NOT EXISTS idx_status_updates_trigger ON community_status_updates(trigger_event);

-- Create composite index for trend analysis
CREATE INDEX IF NOT EXISTS idx_status_updates_trends 
ON community_status_updates(community_id, timestamp DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_status_updates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER status_updates_update_timestamp
    BEFORE UPDATE ON community_status_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_status_updates_timestamp();

-- Create view for latest status per community
CREATE OR REPLACE VIEW community_latest_status AS
SELECT DISTINCT ON (community_id)
    csu.community_id,
    c.name as community_name,
    csu.timestamp,
    csu.health_score,
    csu.status,
    csu.indicators,
    csu.trigger_event,
    csu.metadata
FROM community_status_updates csu
LEFT JOIN communities c ON csu.community_id = c.id
ORDER BY csu.community_id, csu.timestamp DESC;

-- Create function to get status changes over time
CREATE OR REPLACE FUNCTION get_community_status_history(
    target_community_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    health_score INTEGER,
    status TEXT,
    score_change INTEGER,
    status_changed BOOLEAN,
    trigger_event TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH status_with_changes AS (
        SELECT 
            csu.timestamp,
            csu.health_score,
            csu.status,
            csu.trigger_event,
            LAG(csu.health_score) OVER (ORDER BY csu.timestamp) as prev_score,
            LAG(csu.status) OVER (ORDER BY csu.timestamp) as prev_status
        FROM community_status_updates csu
        WHERE csu.community_id = target_community_id
        AND csu.timestamp > NOW() - INTERVAL '1 day' * days_back
        ORDER BY csu.timestamp
    )
    SELECT 
        swc.timestamp,
        swc.health_score,
        swc.status,
        COALESCE(swc.health_score - swc.prev_score, 0) as score_change,
        COALESCE(swc.status != swc.prev_status, false) as status_changed,
        swc.trigger_event
    FROM status_with_changes swc
    ORDER BY swc.timestamp;
END;
$$ LANGUAGE plpgsql;

-- Create function to get communities with recent status changes
CREATE OR REPLACE FUNCTION get_recent_status_changes(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    current_status TEXT,
    previous_status TEXT,
    current_score INTEGER,
    previous_score INTEGER,
    change_date TIMESTAMPTZ,
    trigger_event TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_changes AS (
        SELECT 
            csu.community_id,
            csu.timestamp,
            csu.health_score,
            csu.status,
            csu.trigger_event,
            LAG(csu.health_score) OVER (PARTITION BY csu.community_id ORDER BY csu.timestamp) as prev_score,
            LAG(csu.status) OVER (PARTITION BY csu.community_id ORDER BY csu.timestamp) as prev_status,
            ROW_NUMBER() OVER (PARTITION BY csu.community_id ORDER BY csu.timestamp DESC) as rn
        FROM community_status_updates csu
        WHERE csu.timestamp > NOW() - INTERVAL '1 day' * days_back
    )
    SELECT 
        rc.community_id,
        c.name as community_name,
        rc.status as current_status,
        rc.prev_status as previous_status,
        rc.health_score as current_score,
        rc.prev_score as previous_score,
        rc.timestamp as change_date,
        rc.trigger_event
    FROM recent_changes rc
    LEFT JOIN communities c ON rc.community_id = c.id
    WHERE rc.rn = 1 -- Latest record per community
    AND (rc.status != rc.prev_status OR ABS(rc.health_score - COALESCE(rc.prev_score, 0)) >= 5)
    ORDER BY rc.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get status trend analysis
CREATE OR REPLACE FUNCTION get_status_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    trend_direction TEXT,
    trend_velocity NUMERIC,
    confidence_score NUMERIC,
    data_points INTEGER,
    score_range_min INTEGER,
    score_range_max INTEGER,
    latest_score INTEGER,
    latest_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH trend_data AS (
        SELECT 
            csu.community_id,
            c.name as community_name,
            COUNT(*) as data_points,
            MIN(csu.health_score) as score_min,
            MAX(csu.health_score) as score_max,
            -- Simple linear regression for trend
            CASE 
                WHEN COUNT(*) > 1 THEN
                    (COUNT(*) * SUM(EXTRACT(EPOCH FROM csu.timestamp) * csu.health_score) - 
                     SUM(EXTRACT(EPOCH FROM csu.timestamp)) * SUM(csu.health_score)) /
                    (COUNT(*) * SUM(POWER(EXTRACT(EPOCH FROM csu.timestamp), 2)) - 
                     POWER(SUM(EXTRACT(EPOCH FROM csu.timestamp)), 2))
                ELSE 0
            END as slope,
            -- Latest values
            (SELECT health_score FROM community_status_updates 
             WHERE community_id = csu.community_id 
             ORDER BY timestamp DESC LIMIT 1) as latest_score,
            (SELECT status FROM community_status_updates 
             WHERE community_id = csu.community_id 
             ORDER BY timestamp DESC LIMIT 1) as latest_status
        FROM community_status_updates csu
        LEFT JOIN communities c ON csu.community_id = c.id
        WHERE csu.timestamp > NOW() - INTERVAL '1 day' * days_back
        GROUP BY csu.community_id, c.name
    )
    SELECT 
        td.community_id,
        td.community_name,
        CASE 
            WHEN td.slope > 0.001 THEN 'improving'
            WHEN td.slope < -0.001 THEN 'declining'
            ELSE 'stable'
        END as trend_direction,
        ROUND(ABS(td.slope * 86400)::numeric, 4) as trend_velocity, -- Convert to daily change
        ROUND(LEAST(1.0, td.data_points / 10.0)::numeric, 2) as confidence_score,
        td.data_points,
        td.score_min as score_range_min,
        td.score_max as score_range_max,
        td.latest_score,
        td.latest_status
    FROM trend_data td
    WHERE td.data_points > 0
    ORDER BY td.latest_score DESC, td.community_name;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies if auth system is available
DO $$
BEGIN
    -- Enable RLS if auth functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auth') THEN
        ALTER TABLE community_status_updates ENABLE ROW LEVEL SECURITY;
        
        -- Policy for viewing status updates
        CREATE POLICY "Users can view community status updates" ON community_status_updates
            FOR SELECT USING (true); -- Public read access for status updates
        
        -- Policy for inserting status updates (system only)
        CREATE POLICY "System can insert status updates" ON community_status_updates
            FOR INSERT WITH CHECK (
                current_setting('role') = 'service_role' OR
                current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
            );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Continue without RLS if auth system not available
        NULL;
END $$;

-- Validation function
CREATE OR REPLACE FUNCTION validate_status_tracking_setup()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check table exists
    RETURN QUERY
    SELECT 
        'Status Updates Table'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_status_updates') 
             THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Community status updates tracking table'::TEXT;
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'Status tracking indexes: ' || COUNT(*)::TEXT
    FROM pg_indexes
    WHERE tablename = 'community_status_updates';
    
    -- Check functions
    RETURN QUERY
    SELECT 
        'Status Functions'::TEXT,
        CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'Status tracking functions: ' || COUNT(*)::TEXT
    FROM pg_proc
    WHERE proname IN ('get_community_status_history', 'get_recent_status_changes', 'get_status_trends');
    
    -- Check view
    RETURN QUERY
    SELECT 
        'Latest Status View'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'community_latest_status') 
             THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Community latest status view'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT 'Community Status Tracking Setup Validation:' as message;
SELECT * FROM validate_status_tracking_setup();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Community Status Tracking System Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Status Updates Table: CREATED';
    RAISE NOTICE 'Historical Tracking: ENABLED';
    RAISE NOTICE 'Trend Analysis: AVAILABLE';
    RAISE NOTICE 'Change Detection: ACTIVE';
    RAISE NOTICE 'Real-time Status Updates: READY';
    RAISE NOTICE '==============================================';
END $$;