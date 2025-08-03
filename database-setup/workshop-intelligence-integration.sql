-- Workshop Intelligence Integration Database Schema
-- This schema supports integration of workshop outputs with the intelligence system

-- Workshop Insights Table
-- Stores processed insights extracted from workshop knowledge captures
CREATE TABLE workshop_insights (
    id VARCHAR(255) PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES workshop_sessions(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('community_need', 'service_gap', 'success_pattern', 'cultural_knowledge', 'action_item')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT[] DEFAULT '{}',
    themes TEXT[] DEFAULT '{}',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    stakeholders TEXT[] DEFAULT '{}',
    location VARCHAR(255),
    timeframe VARCHAR(100),
    resources TEXT[] DEFAULT '{}',
    outcomes TEXT[] DEFAULT '{}',
    follow_up_required BOOLEAN DEFAULT false,
    related_documents TEXT[] DEFAULT '{}',
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence NUMERIC(3,2) DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Intelligence Reports Table
-- Stores comprehensive intelligence reports generated from workshop analysis
CREATE TABLE workshop_intelligence_reports (
    id VARCHAR(255) PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    session_count INTEGER NOT NULL DEFAULT 0,
    total_captures INTEGER NOT NULL DEFAULT 0,
    processed_insights INTEGER NOT NULL DEFAULT 0,
    community_needs_count INTEGER NOT NULL DEFAULT 0,
    service_gaps_count INTEGER NOT NULL DEFAULT 0,
    success_patterns_count INTEGER NOT NULL DEFAULT 0,
    cultural_knowledge_count INTEGER NOT NULL DEFAULT 0,
    action_items_count INTEGER NOT NULL DEFAULT 0,
    key_themes JSONB DEFAULT '[]',
    stakeholder_map JSONB DEFAULT '[]',
    follow_up_actions JSONB DEFAULT '[]',
    cultural_considerations TEXT[] DEFAULT '{}',
    recommended_next_steps TEXT[] DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Follow-up Actions Table
-- Tracks action items and follow-up tasks from workshops
CREATE TABLE workshop_follow_up_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    insight_id VARCHAR(255) REFERENCES workshop_insights(id) ON DELETE CASCADE,
    action_title VARCHAR(255) NOT NULL,
    action_description TEXT,
    assigned_to VARCHAR(255),
    assigned_role VARCHAR(100),
    due_date DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    completion_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(255),
    cultural_considerations TEXT[] DEFAULT '{}',
    resources_needed TEXT[] DEFAULT '{}',
    success_metrics TEXT[] DEFAULT '{}',
    related_stakeholders TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Impact Tracking Table
-- Tracks the impact and outcomes of workshop-generated insights
CREATE TABLE workshop_impact_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    insight_id VARCHAR(255) REFERENCES workshop_insights(id) ON DELETE CASCADE,
    impact_type VARCHAR(50) NOT NULL CHECK (impact_type IN ('policy_change', 'service_improvement', 'community_engagement', 'cultural_preservation', 'capacity_building')),
    impact_description TEXT NOT NULL,
    impact_level VARCHAR(20) NOT NULL CHECK (impact_level IN ('individual', 'family', 'community', 'regional', 'systemic')),
    evidence_of_impact TEXT[] DEFAULT '{}',
    metrics_improved JSONB DEFAULT '{}',
    stakeholders_affected TEXT[] DEFAULT '{}',
    timeframe_to_impact VARCHAR(100),
    sustainability_factors TEXT[] DEFAULT '{}',
    challenges_encountered TEXT[] DEFAULT '{}',
    lessons_learned TEXT[] DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    recorded_by VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Intelligence Integration Log Table
-- Logs integration activities with other intelligence systems
CREATE TABLE workshop_intelligence_integration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('needs_analysis', 'service_gaps', 'success_patterns', 'community_health', 'status_tracking')),
    target_system VARCHAR(100) NOT NULL,
    insights_processed INTEGER NOT NULL DEFAULT 0,
    integration_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (integration_status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
    integration_details JSONB DEFAULT '{}',
    error_messages TEXT[] DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processing_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Stakeholder Engagement Table
-- Tracks stakeholder engagement and involvement from workshops
CREATE TABLE workshop_stakeholder_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    stakeholder_name VARCHAR(255) NOT NULL,
    stakeholder_type VARCHAR(100) NOT NULL CHECK (stakeholder_type IN ('community_member', 'elder', 'youth', 'service_provider', 'government', 'ngo', 'business', 'cultural_authority')),
    engagement_level VARCHAR(20) NOT NULL CHECK (engagement_level IN ('observer', 'participant', 'contributor', 'leader', 'facilitator')),
    contributions TEXT[] DEFAULT '{}',
    insights_provided INTEGER DEFAULT 0,
    follow_up_commitments TEXT[] DEFAULT '{}',
    contact_information JSONB DEFAULT '{}',
    cultural_role VARCHAR(100),
    expertise_areas TEXT[] DEFAULT '{}',
    availability_for_followup BOOLEAN DEFAULT false,
    preferred_communication VARCHAR(50),
    consent_for_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Knowledge Integration Table
-- Links workshop knowledge with existing community knowledge base
CREATE TABLE workshop_knowledge_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    knowledge_capture_id UUID NOT NULL REFERENCES knowledge_captures(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('document_analysis', 'story_integration', 'cultural_context', 'intelligence_update')),
    target_document_id UUID,
    target_story_id UUID,
    integration_summary TEXT,
    knowledge_themes TEXT[] DEFAULT '{}',
    cultural_significance VARCHAR(20) CHECK (cultural_significance IN ('low', 'medium', 'high', 'sacred')),
    preservation_priority VARCHAR(20) DEFAULT 'medium' CHECK (preservation_priority IN ('low', 'medium', 'high', 'critical')),
    access_restrictions TEXT[] DEFAULT '{}',
    integration_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (integration_status IN ('pending', 'in_progress', 'completed', 'rejected')),
    integration_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workshop_insights_event ON workshop_insights(event_id);
CREATE INDEX idx_workshop_insights_type ON workshop_insights(insight_type);
CREATE INDEX idx_workshop_insights_priority ON workshop_insights(priority);
CREATE INDEX idx_workshop_insights_cultural_safety ON workshop_insights(cultural_safety);
CREATE INDEX idx_workshop_insights_extracted_at ON workshop_insights(extracted_at);
CREATE INDEX idx_workshop_insights_themes ON workshop_insights USING GIN(themes);
CREATE INDEX idx_workshop_insights_stakeholders ON workshop_insights USING GIN(stakeholders);

CREATE INDEX idx_workshop_intelligence_reports_event ON workshop_intelligence_reports(event_id);
CREATE INDEX idx_workshop_intelligence_reports_generated_at ON workshop_intelligence_reports(generated_at);

CREATE INDEX idx_workshop_follow_up_actions_event ON workshop_follow_up_actions(event_id);
CREATE INDEX idx_workshop_follow_up_actions_status ON workshop_follow_up_actions(status);
CREATE INDEX idx_workshop_follow_up_actions_priority ON workshop_follow_up_actions(priority);
CREATE INDEX idx_workshop_follow_up_actions_due_date ON workshop_follow_up_actions(due_date);
CREATE INDEX idx_workshop_follow_up_actions_assigned_to ON workshop_follow_up_actions(assigned_to);

CREATE INDEX idx_workshop_impact_tracking_event ON workshop_impact_tracking(event_id);
CREATE INDEX idx_workshop_impact_tracking_type ON workshop_impact_tracking(impact_type);
CREATE INDEX idx_workshop_impact_tracking_level ON workshop_impact_tracking(impact_level);
CREATE INDEX idx_workshop_impact_tracking_recorded_at ON workshop_impact_tracking(recorded_at);

CREATE INDEX idx_workshop_intelligence_integration_log_event ON workshop_intelligence_integration_log(event_id);
CREATE INDEX idx_workshop_intelligence_integration_log_type ON workshop_intelligence_integration_log(integration_type);
CREATE INDEX idx_workshop_intelligence_integration_log_status ON workshop_intelligence_integration_log(integration_status);

CREATE INDEX idx_workshop_stakeholder_engagement_event ON workshop_stakeholder_engagement(event_id);
CREATE INDEX idx_workshop_stakeholder_engagement_type ON workshop_stakeholder_engagement(stakeholder_type);
CREATE INDEX idx_workshop_stakeholder_engagement_level ON workshop_stakeholder_engagement(engagement_level);

CREATE INDEX idx_workshop_knowledge_integration_event ON workshop_knowledge_integration(event_id);
CREATE INDEX idx_workshop_knowledge_integration_capture ON workshop_knowledge_integration(knowledge_capture_id);
CREATE INDEX idx_workshop_knowledge_integration_type ON workshop_knowledge_integration(integration_type);
CREATE INDEX idx_workshop_knowledge_integration_status ON workshop_knowledge_integration(integration_status);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_workshop_insights_updated_at BEFORE UPDATE ON workshop_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshop_intelligence_reports_updated_at BEFORE UPDATE ON workshop_intelligence_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshop_follow_up_actions_updated_at BEFORE UPDATE ON workshop_follow_up_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshop_stakeholder_engagement_updated_at BEFORE UPDATE ON workshop_stakeholder_engagement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update follow-up action status based on due dates
CREATE OR REPLACE FUNCTION update_overdue_workshop_actions()
RETURNS TRIGGER AS $
BEGIN
    -- Mark actions as overdue if past due date and still pending/in_progress
    UPDATE workshop_follow_up_actions 
    SET status = 'overdue',
        updated_at = NOW()
    WHERE due_date < CURRENT_DATE 
    AND status IN ('pending', 'in_progress');
    
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Trigger to run daily to update overdue actions
CREATE OR REPLACE FUNCTION schedule_overdue_check()
RETURNS TRIGGER AS $
BEGIN
    PERFORM update_overdue_workshop_actions();
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Function to calculate workshop intelligence metrics
CREATE OR REPLACE FUNCTION get_workshop_intelligence_metrics(
    p_event_id UUID
)
RETURNS TABLE (
    total_insights BIGINT,
    high_priority_insights BIGINT,
    cultural_knowledge_items BIGINT,
    action_items BIGINT,
    completed_actions BIGINT,
    stakeholder_count BIGINT,
    integration_success_rate NUMERIC
) AS $
BEGIN
    RETURN QUERY
    WITH insight_metrics AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE priority IN ('high', 'critical')) as high_priority,
            COUNT(*) FILTER (WHERE insight_type = 'cultural_knowledge') as cultural,
            COUNT(*) FILTER (WHERE insight_type = 'action_item') as actions
        FROM workshop_insights
        WHERE event_id = p_event_id
    ),
    action_metrics AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM workshop_follow_up_actions
        WHERE event_id = p_event_id
    ),
    stakeholder_metrics AS (
        SELECT COUNT(DISTINCT stakeholder_name) as stakeholders
        FROM workshop_stakeholder_engagement
        WHERE event_id = p_event_id
    ),
    integration_metrics AS (
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                    COUNT(*) FILTER (WHERE integration_status = 'completed')::NUMERIC / 
                    COUNT(*)::NUMERIC * 100, 2
                )
            END as success_rate
        FROM workshop_intelligence_integration_log
        WHERE event_id = p_event_id
    )
    SELECT 
        im.total,
        im.high_priority,
        im.cultural,
        im.actions,
        COALESCE(am.completed, 0),
        COALESCE(sm.stakeholders, 0),
        COALESCE(igm.success_rate, 0)
    FROM insight_metrics im
    CROSS JOIN action_metrics am
    CROSS JOIN stakeholder_metrics sm
    CROSS JOIN integration_metrics igm;
END;
$ LANGUAGE plpgsql;

-- Function to get workshop insights summary by community
CREATE OR REPLACE FUNCTION get_community_workshop_insights_summary(
    p_community_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '6 months',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_workshops BIGINT,
    total_insights BIGINT,
    community_needs BIGINT,
    service_gaps BIGINT,
    success_patterns BIGINT,
    cultural_knowledge BIGINT,
    action_items BIGINT,
    completed_actions BIGINT,
    top_themes TEXT[],
    key_stakeholders TEXT[]
) AS $
BEGIN
    RETURN QUERY
    WITH workshop_events AS (
        SELECT id
        FROM community_events
        WHERE community_id = p_community_id
        AND start_date BETWEEN p_start_date AND p_end_date
        AND event_type IN ('workshop', 'training', 'consultation')
    ),
    insight_summary AS (
        SELECT 
            COUNT(DISTINCT wi.event_id) as workshops,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE wi.insight_type = 'community_need') as needs,
            COUNT(*) FILTER (WHERE wi.insight_type = 'service_gap') as gaps,
            COUNT(*) FILTER (WHERE wi.insight_type = 'success_pattern') as patterns,
            COUNT(*) FILTER (WHERE wi.insight_type = 'cultural_knowledge') as cultural,
            COUNT(*) FILTER (WHERE wi.insight_type = 'action_item') as actions,
            array_agg(DISTINCT unnest(wi.themes)) FILTER (WHERE array_length(wi.themes, 1) > 0) as all_themes,
            array_agg(DISTINCT unnest(wi.stakeholders)) FILTER (WHERE array_length(wi.stakeholders, 1) > 0) as all_stakeholders
        FROM workshop_insights wi
        JOIN workshop_events we ON wi.event_id = we.id
    ),
    action_summary AS (
        SELECT COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM workshop_follow_up_actions wfa
        JOIN workshop_events we ON wfa.event_id = we.id
    ),
    theme_frequency AS (
        SELECT theme, COUNT(*) as freq
        FROM (
            SELECT unnest(themes) as theme
            FROM workshop_insights wi
            JOIN workshop_events we ON wi.event_id = we.id
        ) t
        GROUP BY theme
        ORDER BY freq DESC
        LIMIT 10
    ),
    stakeholder_frequency AS (
        SELECT stakeholder, COUNT(*) as freq
        FROM (
            SELECT unnest(stakeholders) as stakeholder
            FROM workshop_insights wi
            JOIN workshop_events we ON wi.event_id = we.id
        ) s
        GROUP BY stakeholder
        ORDER BY freq DESC
        LIMIT 10
    )
    SELECT 
        COALESCE(ins.workshops, 0),
        COALESCE(ins.total, 0),
        COALESCE(ins.needs, 0),
        COALESCE(ins.gaps, 0),
        COALESCE(ins.patterns, 0),
        COALESCE(ins.cultural, 0),
        COALESCE(ins.actions, 0),
        COALESCE(acts.completed, 0),
        COALESCE(array_agg(tf.theme ORDER BY tf.freq DESC), '{}'),
        COALESCE(array_agg(sf.stakeholder ORDER BY sf.freq DESC), '{}')
    FROM insight_summary ins
    CROSS JOIN action_summary acts
    LEFT JOIN theme_frequency tf ON true
    LEFT JOIN stakeholder_frequency sf ON true
    GROUP BY ins.workshops, ins.total, ins.needs, ins.gaps, ins.patterns, ins.cultural, ins.actions, acts.completed;
END;
$ LANGUAGE plpgsql;

-- Function to track workshop impact over time
CREATE OR REPLACE FUNCTION track_workshop_impact(
    p_event_id UUID,
    p_impact_type VARCHAR(50),
    p_impact_description TEXT,
    p_impact_level VARCHAR(20),
    p_evidence TEXT[],
    p_recorded_by VARCHAR(255)
)
RETURNS UUID AS $
DECLARE
    impact_id UUID;
BEGIN
    INSERT INTO workshop_impact_tracking (
        event_id,
        impact_type,
        impact_description,
        impact_level,
        evidence_of_impact,
        recorded_by
    ) VALUES (
        p_event_id,
        p_impact_type,
        p_impact_description,
        p_impact_level,
        p_evidence,
        p_recorded_by
    ) RETURNING id INTO impact_id;
    
    RETURN impact_id;
END;
$ LANGUAGE plpgsql;

-- Create a view for workshop intelligence dashboard
CREATE VIEW workshop_intelligence_dashboard AS
SELECT 
    ce.id as event_id,
    ce.title as event_title,
    ce.start_date,
    ce.end_date,
    ce.status as event_status,
    c.name as community_name,
    wir.processed_insights,
    wir.community_needs_count,
    wir.service_gaps_count,
    wir.success_patterns_count,
    wir.cultural_knowledge_count,
    wir.action_items_count,
    COUNT(wfa.id) as total_follow_up_actions,
    COUNT(wfa.id) FILTER (WHERE wfa.status = 'completed') as completed_actions,
    COUNT(wfa.id) FILTER (WHERE wfa.status = 'overdue') as overdue_actions,
    COUNT(DISTINCT wse.stakeholder_name) as unique_stakeholders,
    wir.generated_at as report_generated_at
FROM community_events ce
LEFT JOIN communities c ON ce.community_id = c.id
LEFT JOIN workshop_intelligence_reports wir ON ce.id = wir.event_id
LEFT JOIN workshop_follow_up_actions wfa ON ce.id = wfa.event_id
LEFT JOIN workshop_stakeholder_engagement wse ON ce.id = wse.event_id
WHERE ce.event_type IN ('workshop', 'training', 'consultation')
GROUP BY 
    ce.id, ce.title, ce.start_date, ce.end_date, ce.status,
    c.name, wir.processed_insights, wir.community_needs_count,
    wir.service_gaps_count, wir.success_patterns_count,
    wir.cultural_knowledge_count, wir.action_items_count,
    wir.generated_at;

COMMENT ON TABLE workshop_insights IS 'Processed insights extracted from workshop knowledge captures';
COMMENT ON TABLE workshop_intelligence_reports IS 'Comprehensive intelligence reports generated from workshop analysis';
COMMENT ON TABLE workshop_follow_up_actions IS 'Action items and follow-up tasks from workshops';
COMMENT ON TABLE workshop_impact_tracking IS 'Tracks the impact and outcomes of workshop-generated insights';
COMMENT ON TABLE workshop_intelligence_integration_log IS 'Logs integration activities with other intelligence systems';
COMMENT ON TABLE workshop_stakeholder_engagement IS 'Tracks stakeholder engagement and involvement from workshops';
COMMENT ON TABLE workshop_knowledge_integration IS 'Links workshop knowledge with existing community knowledge base';
COMMENT ON VIEW workshop_intelligence_dashboard IS 'Dashboard view for workshop intelligence metrics and status';