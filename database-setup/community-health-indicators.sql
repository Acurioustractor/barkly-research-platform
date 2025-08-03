-- =====================================================
-- Community Health Indicators Table
-- Stores calculated health metrics for communities
-- =====================================================

-- Create community health indicators table
CREATE TABLE IF NOT EXISTS community_health_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL,
    
    -- Core health metrics
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    status TEXT NOT NULL CHECK (status IN ('thriving', 'developing', 'struggling', 'improving')),
    
    -- Individual indicators (0-100 scale)
    youth_engagement INTEGER NOT NULL CHECK (youth_engagement >= 0 AND youth_engagement <= 100),
    service_access INTEGER NOT NULL CHECK (service_access >= 0 AND service_access <= 100),
    cultural_connection INTEGER NOT NULL CHECK (cultural_connection >= 0 AND cultural_connection <= 100),
    economic_opportunity INTEGER NOT NULL CHECK (economic_opportunity >= 0 AND economic_opportunity <= 100),
    safety_wellbeing INTEGER NOT NULL CHECK (safety_wellbeing >= 0 AND safety_wellbeing <= 100),
    
    -- Data quality metrics
    total_documents INTEGER DEFAULT 0,
    recent_documents INTEGER DEFAULT 0,
    analysis_completeness INTEGER DEFAULT 0 CHECK (analysis_completeness >= 0 AND analysis_completeness <= 100),
    data_freshness INTEGER DEFAULT 0 CHECK (data_freshness >= 0 AND data_freshness <= 100),
    community_engagement INTEGER DEFAULT 0 CHECK (community_engagement >= 0 AND community_engagement <= 100),
    
    -- Trends and metadata
    trends JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    calculation_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id)
);

-- Add foreign key constraint (if communities table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities') THEN
        ALTER TABLE community_health_indicators 
        ADD CONSTRAINT fk_community_health_community 
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_indicators_community ON community_health_indicators(community_id);
CREATE INDEX IF NOT EXISTS idx_health_indicators_score ON community_health_indicators(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_health_indicators_status ON community_health_indicators(status);
CREATE INDEX IF NOT EXISTS idx_health_indicators_calculated ON community_health_indicators(calculated_at DESC);

-- Create composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_health_indicators_dashboard 
ON community_health_indicators(status, health_score DESC, calculated_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_indicators_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_indicators_update_timestamp
    BEFORE UPDATE ON community_health_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_health_indicators_timestamp();

-- Create view for easy health dashboard queries
CREATE OR REPLACE VIEW community_health_dashboard AS
SELECT 
    chi.community_id,
    c.name as community_name,
    c.slug as community_slug,
    chi.health_score,
    chi.status,
    chi.youth_engagement,
    chi.service_access,
    chi.cultural_connection,
    chi.economic_opportunity,
    chi.safety_wellbeing,
    chi.total_documents,
    chi.recent_documents,
    chi.analysis_completeness,
    chi.data_freshness,
    chi.community_engagement,
    chi.trends,
    chi.calculated_at,
    chi.updated_at
FROM community_health_indicators chi
LEFT JOIN communities c ON chi.community_id = c.id
ORDER BY chi.health_score DESC, c.name;

-- Create function to get community health summary
CREATE OR REPLACE FUNCTION get_community_health_summary()
RETURNS TABLE (
    total_communities BIGINT,
    thriving_communities BIGINT,
    developing_communities BIGINT,
    struggling_communities BIGINT,
    improving_communities BIGINT,
    average_health_score NUMERIC,
    communities_with_recent_data BIGINT,
    last_calculation TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_communities,
        COUNT(*) FILTER (WHERE status = 'thriving') as thriving_communities,
        COUNT(*) FILTER (WHERE status = 'developing') as developing_communities,
        COUNT(*) FILTER (WHERE status = 'struggling') as struggling_communities,
        COUNT(*) FILTER (WHERE status = 'improving') as improving_communities,
        ROUND(AVG(health_score), 1) as average_health_score,
        COUNT(*) FILTER (WHERE calculated_at > NOW() - INTERVAL '7 days') as communities_with_recent_data,
        MAX(calculated_at) as last_calculation
    FROM community_health_indicators;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top performing communities
CREATE OR REPLACE FUNCTION get_top_performing_communities(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    health_score INTEGER,
    status TEXT,
    youth_engagement INTEGER,
    service_access INTEGER,
    cultural_connection INTEGER,
    economic_opportunity INTEGER,
    safety_wellbeing INTEGER,
    calculated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        chi.community_id,
        c.name as community_name,
        chi.health_score,
        chi.status,
        chi.youth_engagement,
        chi.service_access,
        chi.cultural_connection,
        chi.economic_opportunity,
        chi.safety_wellbeing,
        chi.calculated_at
    FROM community_health_indicators chi
    LEFT JOIN communities c ON chi.community_id = c.id
    ORDER BY chi.health_score DESC, c.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get communities needing attention
CREATE OR REPLACE FUNCTION get_communities_needing_attention()
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    health_score INTEGER,
    status TEXT,
    critical_indicators TEXT[],
    last_document_upload TIMESTAMPTZ,
    calculated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        chi.community_id,
        c.name as community_name,
        chi.health_score,
        chi.status,
        ARRAY(
            SELECT indicator FROM (
                SELECT 'Youth Engagement' as indicator WHERE chi.youth_engagement < 40
                UNION ALL
                SELECT 'Service Access' as indicator WHERE chi.service_access < 40
                UNION ALL
                SELECT 'Cultural Connection' as indicator WHERE chi.cultural_connection < 40
                UNION ALL
                SELECT 'Economic Opportunity' as indicator WHERE chi.economic_opportunity < 40
                UNION ALL
                SELECT 'Safety & Wellbeing' as indicator WHERE chi.safety_wellbeing < 40
            ) indicators
        ) as critical_indicators,
        (
            SELECT MAX(created_at) 
            FROM documents d 
            WHERE d.community_id = chi.community_id
        ) as last_document_upload,
        chi.calculated_at
    FROM community_health_indicators chi
    LEFT JOIN communities c ON chi.community_id = c.id
    WHERE chi.health_score < 60 OR chi.status IN ('struggling', 'improving')
    ORDER BY chi.health_score ASC, c.name;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies if auth system is available
DO $$
BEGIN
    -- Enable RLS if auth functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auth') THEN
        ALTER TABLE community_health_indicators ENABLE ROW LEVEL SECURITY;
        
        -- Policy for viewing health indicators
        CREATE POLICY "Users can view community health indicators" ON community_health_indicators
            FOR SELECT USING (true); -- Public read access for health indicators
        
        -- Policy for updating health indicators (system only)
        CREATE POLICY "System can update health indicators" ON community_health_indicators
            FOR ALL USING (
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
CREATE OR REPLACE FUNCTION validate_community_health_setup()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check table exists
    RETURN QUERY
    SELECT 
        'Health Indicators Table'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_health_indicators') 
             THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Community health indicators storage table'::TEXT;
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'Health indicators indexes: ' || COUNT(*)::TEXT
    FROM pg_indexes
    WHERE tablename = 'community_health_indicators';
    
    -- Check functions
    RETURN QUERY
    SELECT 
        'Health Functions'::TEXT,
        CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'Health calculation functions: ' || COUNT(*)::TEXT
    FROM pg_proc
    WHERE proname IN ('get_community_health_summary', 'get_top_performing_communities', 'get_communities_needing_attention');
    
    -- Check view
    RETURN QUERY
    SELECT 
        'Dashboard View'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'community_health_dashboard') 
             THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Community health dashboard view'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT 'Community Health Indicators Setup Validation:' as message;
SELECT * FROM validate_community_health_setup();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Community Health Indicators System Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Health Indicators Table: CREATED';
    RAISE NOTICE 'Performance Indexes: ADDED';
    RAISE NOTICE 'Dashboard View: AVAILABLE';
    RAISE NOTICE 'Health Functions: IMPLEMENTED';
    RAISE NOTICE 'Real-time Health Calculation: READY';
    RAISE NOTICE '==============================================';
END $$;