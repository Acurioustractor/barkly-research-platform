-- Intelligence Schema Enhancement
-- This script enhances the existing database schema to support community intelligence features
-- while maintaining compatibility with existing structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================
-- INTELLIGENCE INSIGHTS CORE TABLES
-- =============================================

-- Main intelligence insights table
CREATE TABLE IF NOT EXISTS intelligence_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
        'community_need', 'service_gap', 'success_pattern', 
        'risk_factor', 'opportunity', 'trend_analysis'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high', 'transformational')),
    
    -- Source attribution
    source_documents UUID[] DEFAULT '{}',
    source_stories UUID[] DEFAULT '{}',
    source_workshops UUID[] DEFAULT '{}',
    
    -- AI generation metadata
    ai_model_version VARCHAR(50),
    generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_duration_ms INTEGER,
    
    -- Validation and quality
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN (
        'pending', 'community_validated', 'expert_validated', 'rejected', 'needs_review'
    )),
    validation_score DECIMAL(3,2),
    validation_feedback TEXT,
    validated_by UUID,
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Cultural safety
    cultural_review_required BOOLEAN DEFAULT true,
    cultural_review_status VARCHAR(20) DEFAULT 'pending' CHECK (cultural_review_status IN (
        'pending', 'approved', 'requires_modification', 'rejected'
    )),
    elder_consultation_id UUID,
    cultural_context JSONB DEFAULT '{}',
    
    -- Lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded')),
    superseded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Metadata and tags
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (superseded_by) REFERENCES intelligence_insights(id)
);

-- Document-insight relationship mapping
CREATE TABLE IF NOT EXISTS document_insight_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,
    insight_id UUID NOT NULL,
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    evidence_text TEXT,
    evidence_location JSONB, -- page, paragraph, timestamp for multimedia
    extraction_method VARCHAR(50), -- 'ai_analysis', 'manual_annotation', 'pattern_matching'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    UNIQUE(document_id, insight_id)
);

-- Community insight aggregations for performance
CREATE TABLE IF NOT EXISTS community_insight_aggregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL,
    aggregation_date DATE NOT NULL,
    
    -- Insight counts by type
    total_insights INTEGER DEFAULT 0,
    community_needs_count INTEGER DEFAULT 0,
    service_gaps_count INTEGER DEFAULT 0,
    success_patterns_count INTEGER DEFAULT 0,
    risk_factors_count INTEGER DEFAULT 0,
    opportunities_count INTEGER DEFAULT 0,
    
    -- Quality metrics
    avg_confidence_score DECIMAL(3,2),
    validated_insights_count INTEGER DEFAULT 0,
    validation_rate DECIMAL(3,2),
    
    -- Cultural safety metrics
    culturally_reviewed_count INTEGER DEFAULT 0,
    elder_approved_count INTEGER DEFAULT 0,
    cultural_compliance_rate DECIMAL(3,2),
    
    -- Urgency distribution
    critical_insights_count INTEGER DEFAULT 0,
    high_urgency_count INTEGER DEFAULT 0,
    medium_urgency_count INTEGER DEFAULT 0,
    low_urgency_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    UNIQUE(community_id, aggregation_date)
);

-- =============================================
-- REAL-TIME ANALYTICS EVENT TRACKING
-- =============================================

-- Analytics events for real-time tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN (
        'intelligence_generation', 'user_interaction', 'system_performance',
        'cultural_safety', 'validation', 'dashboard_usage'
    )),
    
    -- Context
    community_id UUID,
    user_id UUID,
    session_id VARCHAR(100),
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance metrics
    processing_time_ms INTEGER,
    memory_usage_mb DECIMAL(10,2),
    
    -- Geographic and device context
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20),
    
    -- Batch processing
    batch_id UUID,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Real-time metrics aggregation
CREATE TABLE IF NOT EXISTS realtime_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    community_id UUID,
    
    -- Metric values
    metric_value DECIMAL(15,4),
    metric_count INTEGER,
    metric_data JSONB DEFAULT '{}',
    
    -- Time window
    time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    window_duration_minutes INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- =============================================
-- INTELLIGENCE RELATIONSHIP MAPPINGS
-- =============================================

-- Cross-community pattern relationships
CREATE TABLE IF NOT EXISTS cross_community_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_name VARCHAR(200) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    
    -- Communities involved
    primary_community_id UUID NOT NULL,
    related_community_ids UUID[] DEFAULT '{}',
    
    -- Pattern strength and confidence
    pattern_strength DECIMAL(3,2) CHECK (pattern_strength >= 0 AND pattern_strength <= 1),
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Supporting insights
    supporting_insights UUID[] DEFAULT '{}',
    contradicting_insights UUID[] DEFAULT '{}',
    
    -- Pattern metadata
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detection_frequency INTEGER DEFAULT 1,
    
    -- Geographic and demographic context
    geographic_scope VARCHAR(50), -- 'local', 'regional', 'provincial', 'national'
    demographic_factors JSONB DEFAULT '{}',
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (primary_community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- Insight evolution tracking
CREATE TABLE IF NOT EXISTS insight_evolution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL,
    
    -- Change tracking
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'confidence_update', 'validation_change', 'cultural_review',
        'evidence_added', 'superseded', 'merged', 'split'
    )),
    
    -- Before and after states
    previous_state JSONB,
    new_state JSONB,
    change_reason TEXT,
    
    -- Change metadata
    changed_by UUID,
    change_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    automated_change BOOLEAN DEFAULT false,
    
    -- Impact assessment
    impact_score DECIMAL(3,2),
    affected_communities UUID[] DEFAULT '{}',
    
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Intelligence insights indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_community_id ON intelligence_insights(community_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_type ON intelligence_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_status ON intelligence_insights(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_urgency ON intelligence_insights(urgency_level);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_validation ON intelligence_insights(validation_status);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_cultural ON intelligence_insights(cultural_review_status);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_created_at ON intelligence_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_confidence ON intelligence_insights(confidence_score DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_community_type_status 
    ON intelligence_insights(community_id, insight_type, status);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_community_urgency_created 
    ON intelligence_insights(community_id, urgency_level, created_at DESC);

-- Document mapping indexes
CREATE INDEX IF NOT EXISTS idx_document_insight_mappings_document_id ON document_insight_mappings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_insight_mappings_insight_id ON document_insight_mappings(insight_id);
CREATE INDEX IF NOT EXISTS idx_document_insight_mappings_relevance ON document_insight_mappings(relevance_score DESC);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_community_id ON analytics_events(community_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_processed ON analytics_events(processed, event_timestamp);

-- Composite indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_community_type_timestamp 
    ON analytics_events(community_id, event_type, event_timestamp DESC);

-- Real-time metrics indexes
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_name ON realtime_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_category ON realtime_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_community_id ON realtime_metrics(community_id);
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_time_window ON realtime_metrics(time_window_start, time_window_end);

-- Cross-community patterns indexes
CREATE INDEX IF NOT EXISTS idx_cross_community_patterns_primary ON cross_community_patterns(primary_community_id);
CREATE INDEX IF NOT EXISTS idx_cross_community_patterns_type ON cross_community_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_cross_community_patterns_strength ON cross_community_patterns(pattern_strength DESC);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_source_documents_gin 
    ON intelligence_insights USING gin(source_documents);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_tags_gin 
    ON intelligence_insights USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_metadata_gin 
    ON intelligence_insights USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_analytics_events_data_gin 
    ON analytics_events USING gin(event_data);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_intelligence_insights_updated_at 
    BEFORE UPDATE ON intelligence_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_insight_aggregations_updated_at 
    BEFORE UPDATE ON community_insight_aggregations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_community_patterns_updated_at 
    BEFORE UPDATE ON cross_community_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aggregation update trigger
CREATE OR REPLACE FUNCTION update_community_aggregations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily aggregations when insights change
    INSERT INTO community_insight_aggregations (
        community_id, 
        aggregation_date,
        total_insights,
        community_needs_count,
        service_gaps_count,
        success_patterns_count,
        risk_factors_count,
        opportunities_count,
        avg_confidence_score,
        validated_insights_count,
        validation_rate,
        culturally_reviewed_count,
        elder_approved_count,
        cultural_compliance_rate,
        critical_insights_count,
        high_urgency_count,
        medium_urgency_count,
        low_urgency_count
    )
    SELECT 
        NEW.community_id,
        CURRENT_DATE,
        COUNT(*),
        COUNT(*) FILTER (WHERE insight_type = 'community_need'),
        COUNT(*) FILTER (WHERE insight_type = 'service_gap'),
        COUNT(*) FILTER (WHERE insight_type = 'success_pattern'),
        COUNT(*) FILTER (WHERE insight_type = 'risk_factor'),
        COUNT(*) FILTER (WHERE insight_type = 'opportunity'),
        AVG(confidence_score),
        COUNT(*) FILTER (WHERE validation_status IN ('community_validated', 'expert_validated')),
        (COUNT(*) FILTER (WHERE validation_status IN ('community_validated', 'expert_validated')) * 100.0 / COUNT(*)),
        COUNT(*) FILTER (WHERE cultural_review_status != 'pending'),
        COUNT(*) FILTER (WHERE cultural_review_status = 'approved'),
        (COUNT(*) FILTER (WHERE cultural_review_status = 'approved') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE cultural_review_status != 'pending'), 0)),
        COUNT(*) FILTER (WHERE urgency_level = 'critical'),
        COUNT(*) FILTER (WHERE urgency_level = 'high'),
        COUNT(*) FILTER (WHERE urgency_level = 'medium'),
        COUNT(*) FILTER (WHERE urgency_level = 'low')
    FROM intelligence_insights 
    WHERE community_id = NEW.community_id 
      AND status = 'active'
      AND DATE(created_at) = CURRENT_DATE
    ON CONFLICT (community_id, aggregation_date) 
    DO UPDATE SET
        total_insights = EXCLUDED.total_insights,
        community_needs_count = EXCLUDED.community_needs_count,
        service_gaps_count = EXCLUDED.service_gaps_count,
        success_patterns_count = EXCLUDED.success_patterns_count,
        risk_factors_count = EXCLUDED.risk_factors_count,
        opportunities_count = EXCLUDED.opportunities_count,
        avg_confidence_score = EXCLUDED.avg_confidence_score,
        validated_insights_count = EXCLUDED.validated_insights_count,
        validation_rate = EXCLUDED.validation_rate,
        culturally_reviewed_count = EXCLUDED.culturally_reviewed_count,
        elder_approved_count = EXCLUDED.elder_approved_count,
        cultural_compliance_rate = EXCLUDED.cultural_compliance_rate,
        critical_insights_count = EXCLUDED.critical_insights_count,
        high_urgency_count = EXCLUDED.high_urgency_count,
        medium_urgency_count = EXCLUDED.medium_urgency_count,
        low_urgency_count = EXCLUDED.low_urgency_count,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_aggregations_trigger
    AFTER INSERT OR UPDATE ON intelligence_insights
    FOR EACH ROW EXECUTE FUNCTION update_community_aggregations();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Community intelligence summary view
CREATE OR REPLACE VIEW community_intelligence_summary AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    COUNT(ii.*) as total_insights,
    COUNT(*) FILTER (WHERE ii.insight_type = 'community_need') as needs_count,
    COUNT(*) FILTER (WHERE ii.insight_type = 'service_gap') as gaps_count,
    COUNT(*) FILTER (WHERE ii.insight_type = 'success_pattern') as patterns_count,
    COUNT(*) FILTER (WHERE ii.urgency_level = 'critical') as critical_count,
    AVG(ii.confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE ii.validation_status IN ('community_validated', 'expert_validated')) as validated_count,
    COUNT(*) FILTER (WHERE ii.cultural_review_status = 'approved') as culturally_approved_count,
    MAX(ii.created_at) as latest_insight_date
FROM communities c
LEFT JOIN intelligence_insights ii ON c.id = ii.community_id AND ii.status = 'active'
GROUP BY c.id, c.name;

-- Recent intelligence activity view
CREATE OR REPLACE VIEW recent_intelligence_activity AS
SELECT 
    ii.id,
    ii.community_id,
    c.name as community_name,
    ii.insight_type,
    ii.title,
    ii.urgency_level,
    ii.confidence_score,
    ii.validation_status,
    ii.cultural_review_status,
    ii.created_at,
    ii.created_by,
    u.name as creator_name
FROM intelligence_insights ii
JOIN communities c ON ii.community_id = c.id
LEFT JOIN users u ON ii.created_by = u.id
WHERE ii.status = 'active'
  AND ii.created_at >= NOW() - INTERVAL '7 days'
ORDER BY ii.created_at DESC;

-- High-priority insights view
CREATE OR REPLACE VIEW high_priority_insights AS
SELECT 
    ii.*,
    c.name as community_name,
    CASE 
        WHEN ii.urgency_level = 'critical' THEN 4
        WHEN ii.urgency_level = 'high' THEN 3
        WHEN ii.urgency_level = 'medium' THEN 2
        ELSE 1
    END as priority_score
FROM intelligence_insights ii
JOIN communities c ON ii.community_id = c.id
WHERE ii.status = 'active'
  AND ii.urgency_level IN ('critical', 'high')
  AND ii.validation_status != 'rejected'
ORDER BY priority_score DESC, ii.confidence_score DESC, ii.created_at DESC;

-- =============================================
-- FUNCTIONS FOR INTELLIGENCE OPERATIONS
-- =============================================

-- Function to create intelligence insight with validation
CREATE OR REPLACE FUNCTION create_intelligence_insight(
    p_community_id UUID,
    p_insight_type VARCHAR(50),
    p_title TEXT,
    p_description TEXT,
    p_confidence_score DECIMAL(3,2),
    p_urgency_level VARCHAR(20),
    p_impact_level VARCHAR(20),
    p_source_documents UUID[] DEFAULT '{}',
    p_source_stories UUID[] DEFAULT '{}',
    p_ai_model_version VARCHAR(50) DEFAULT NULL,
    p_processing_duration_ms INTEGER DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    insight_id UUID;
BEGIN
    INSERT INTO intelligence_insights (
        community_id, insight_type, title, description, confidence_score,
        urgency_level, impact_level, source_documents, source_stories,
        ai_model_version, processing_duration_ms, created_by, tags, metadata
    ) VALUES (
        p_community_id, p_insight_type, p_title, p_description, p_confidence_score,
        p_urgency_level, p_impact_level, p_source_documents, p_source_stories,
        p_ai_model_version, p_processing_duration_ms, p_created_by, p_tags, p_metadata
    ) RETURNING id INTO insight_id;
    
    -- Log analytics event
    INSERT INTO analytics_events (
        event_type, event_category, community_id, user_id,
        event_data, processing_time_ms
    ) VALUES (
        'insight_created', 'intelligence_generation', p_community_id, p_created_by,
        jsonb_build_object(
            'insight_id', insight_id,
            'insight_type', p_insight_type,
            'confidence_score', p_confidence_score,
            'urgency_level', p_urgency_level
        ),
        p_processing_duration_ms
    );
    
    RETURN insight_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record analytics event
CREATE OR REPLACE FUNCTION record_analytics_event(
    p_event_type VARCHAR(100),
    p_event_category VARCHAR(50),
    p_community_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}',
    p_processing_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO analytics_events (
        event_type, event_category, community_id, user_id, session_id,
        event_data, processing_time_ms
    ) VALUES (
        p_event_type, p_event_category, p_community_id, p_user_id, p_session_id,
        p_event_data, p_processing_time_ms
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA AND CONFIGURATION
-- =============================================

-- Create default metric categories
INSERT INTO realtime_metrics (metric_name, metric_category, metric_value, time_window_start, time_window_end, window_duration_minutes)
VALUES 
    ('system_health', 'system_performance', 1.0, NOW() - INTERVAL '1 hour', NOW(), 60),
    ('intelligence_generation_rate', 'intelligence_generation', 0.0, NOW() - INTERVAL '1 hour', NOW(), 60),
    ('cultural_compliance_rate', 'cultural_safety', 1.0, NOW() - INTERVAL '1 hour', NOW(), 60),
    ('validation_rate', 'validation', 0.0, NOW() - INTERVAL '1 hour', NOW(), 60)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE ON intelligence_insights TO authenticated;
-- GRANT SELECT, INSERT ON analytics_events TO authenticated;
-- GRANT SELECT ON community_intelligence_summary TO authenticated;
-- GRANT SELECT ON recent_intelligence_activity TO authenticated;
-- GRANT SELECT ON high_priority_insights TO authenticated;

COMMENT ON TABLE intelligence_insights IS 'Core table for storing AI-generated community intelligence insights';
COMMENT ON TABLE document_insight_mappings IS 'Maps documents to the insights they support with evidence';
COMMENT ON TABLE community_insight_aggregations IS 'Pre-computed aggregations for community intelligence metrics';
COMMENT ON TABLE analytics_events IS 'Real-time event tracking for system analytics and monitoring';
COMMENT ON TABLE realtime_metrics IS 'Aggregated metrics for real-time dashboard displays';
COMMENT ON TABLE cross_community_patterns IS 'Patterns detected across multiple communities';
COMMENT ON TABLE insight_evolution IS 'Tracks changes and evolution of insights over time';