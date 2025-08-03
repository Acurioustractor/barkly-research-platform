-- Automated Progress Monitoring Database Schema
-- This schema supports comprehensive community progress tracking with automated monitoring capabilities

-- Progress monitoring configuration table
CREATE TABLE IF NOT EXISTS progress_monitoring_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    configuration JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_id)
);

-- Progress indicators table
CREATE TABLE IF NOT EXISTS progress_indicators (
    id TEXT PRIMARY KEY, -- Custom ID format: category-name-communityId
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('health', 'education', 'economic', 'cultural', 'social', 'environmental', 'governance')),
    name TEXT NOT NULL,
    description TEXT,
    current_value DECIMAL NOT NULL,
    previous_value DECIMAL,
    target_value DECIMAL,
    unit TEXT NOT NULL,
    trend TEXT NOT NULL CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')),
    trend_strength TEXT NOT NULL CHECK (trend_strength IN ('weak', 'moderate', 'strong')),
    change_percentage DECIMAL,
    confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    cultural_context TEXT,
    stakeholders TEXT[] DEFAULT '{}',
    related_indicators TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress indicator history for trend analysis
CREATE TABLE IF NOT EXISTS progress_indicator_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id TEXT NOT NULL REFERENCES progress_indicators(id) ON DELETE CASCADE,
    value DECIMAL NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress alerts table
CREATE TABLE IF NOT EXISTS progress_alerts (
    id TEXT PRIMARY KEY, -- Custom ID format: alert-indicatorId-timestamp
    type TEXT NOT NULL CHECK (type IN ('improvement', 'decline', 'milestone', 'threshold', 'anomaly')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    indicator_id TEXT NOT NULL REFERENCES progress_indicators(id) ON DELETE CASCADE,
    indicator_name TEXT NOT NULL,
    current_value DECIMAL NOT NULL,
    threshold_value DECIMAL,
    change_amount DECIMAL NOT NULL,
    change_percentage DECIMAL NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_notes TEXT,
    action_required BOOLEAN DEFAULT FALSE,
    suggested_actions TEXT[] DEFAULT '{}',
    stakeholders_to_notify TEXT[] DEFAULT '{}',
    cultural_considerations TEXT[] DEFAULT '{}',
    related_alerts TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress reports table
CREATE TABLE IF NOT EXISTS progress_reports (
    id TEXT PRIMARY KEY, -- Custom ID format: progress-report-communityId-timestamp
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    community_name TEXT NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    overall_trend TEXT NOT NULL CHECK (overall_trend IN ('improving', 'stable', 'declining')),
    category_scores JSONB NOT NULL DEFAULT '{}',
    key_insights JSONB NOT NULL DEFAULT '{}',
    indicators_summary JSONB NOT NULL DEFAULT '{}',
    alerts_summary JSONB NOT NULL DEFAULT '{}',
    progress_highlights JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_report_due TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring automation log
CREATE TABLE IF NOT EXISTS monitoring_automation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    details JSONB DEFAULT '{}',
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_indicators_community_id ON progress_indicators(community_id);
CREATE INDEX IF NOT EXISTS idx_progress_indicators_category ON progress_indicators(category);
CREATE INDEX IF NOT EXISTS idx_progress_indicators_priority ON progress_indicators(priority);
CREATE INDEX IF NOT EXISTS idx_progress_indicators_trend ON progress_indicators(trend);
CREATE INDEX IF NOT EXISTS idx_progress_indicators_last_updated ON progress_indicators(last_updated);

CREATE INDEX IF NOT EXISTS idx_progress_indicator_history_indicator_id ON progress_indicator_history(indicator_id);
CREATE INDEX IF NOT EXISTS idx_progress_indicator_history_recorded_at ON progress_indicator_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_progress_alerts_indicator_id ON progress_alerts(indicator_id);
CREATE INDEX IF NOT EXISTS idx_progress_alerts_severity ON progress_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_progress_alerts_acknowledged ON progress_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_progress_alerts_detected_at ON progress_alerts(detected_at);

CREATE INDEX IF NOT EXISTS idx_progress_reports_community_id ON progress_reports(community_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_report_date ON progress_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_progress_reports_next_report_due ON progress_reports(next_report_due);

CREATE INDEX IF NOT EXISTS idx_monitoring_automation_log_community_id ON monitoring_automation_log(community_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_automation_log_started_at ON monitoring_automation_log(started_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_progress_monitoring_config_updated_at 
    BEFORE UPDATE ON progress_monitoring_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_indicators_updated_at 
    BEFORE UPDATE ON progress_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_alerts_updated_at 
    BEFORE UPDATE ON progress_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create indicator history entries
CREATE OR REPLACE FUNCTION create_indicator_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if the value has changed
    IF OLD.current_value IS DISTINCT FROM NEW.current_value THEN
        INSERT INTO progress_indicator_history (
            indicator_id,
            value,
            recorded_at,
            data_source,
            notes
        ) VALUES (
            NEW.id,
            NEW.current_value,
            NEW.last_updated,
            NEW.data_source,
            'Automated update from progress monitoring'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_progress_indicator_history 
    AFTER UPDATE ON progress_indicators 
    FOR EACH ROW EXECUTE FUNCTION create_indicator_history();

-- Function to get community progress summary
CREATE OR REPLACE FUNCTION get_community_progress_summary(p_community_id UUID)
RETURNS TABLE (
    total_indicators INTEGER,
    improving_indicators INTEGER,
    stable_indicators INTEGER,
    declining_indicators INTEGER,
    critical_indicators INTEGER,
    recent_alerts INTEGER,
    unacknowledged_alerts INTEGER,
    overall_score DECIMAL,
    last_report_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM progress_indicators WHERE community_id = p_community_id),
        (SELECT COUNT(*)::INTEGER FROM progress_indicators WHERE community_id = p_community_id AND trend = 'improving'),
        (SELECT COUNT(*)::INTEGER FROM progress_indicators WHERE community_id = p_community_id AND trend = 'stable'),
        (SELECT COUNT(*)::INTEGER FROM progress_indicators WHERE community_id = p_community_id AND trend = 'declining'),
        (SELECT COUNT(*)::INTEGER FROM progress_indicators WHERE community_id = p_community_id AND priority = 'critical'),
        (SELECT COUNT(*)::INTEGER FROM progress_alerts pa 
         JOIN progress_indicators pi ON pa.indicator_id = pi.id 
         WHERE pi.community_id = p_community_id 
         AND pa.detected_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'),
        (SELECT COUNT(*)::INTEGER FROM progress_alerts pa 
         JOIN progress_indicators pi ON pa.indicator_id = pi.id 
         WHERE pi.community_id = p_community_id 
         AND pa.acknowledged = FALSE),
        (SELECT pr.overall_score FROM progress_reports pr 
         WHERE pr.community_id = p_community_id 
         ORDER BY pr.report_date DESC LIMIT 1),
        (SELECT pr.report_date FROM progress_reports pr 
         WHERE pr.community_id = p_community_id 
         ORDER BY pr.report_date DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get indicator trends over time
CREATE OR REPLACE FUNCTION get_indicator_trend_data(
    p_indicator_id TEXT,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    recorded_at TIMESTAMP WITH TIME ZONE,
    value DECIMAL,
    data_source TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pih.recorded_at,
        pih.value,
        pih.data_source
    FROM progress_indicator_history pih
    WHERE pih.indicator_id = p_indicator_id
    AND pih.recorded_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL
    ORDER BY pih.recorded_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate category averages
CREATE OR REPLACE FUNCTION get_category_averages(p_community_id UUID)
RETURNS TABLE (
    category TEXT,
    average_score DECIMAL,
    indicator_count INTEGER,
    improving_count INTEGER,
    declining_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.category,
        AVG(pi.current_value) as average_score,
        COUNT(*)::INTEGER as indicator_count,
        COUNT(CASE WHEN pi.trend = 'improving' THEN 1 END)::INTEGER as improving_count,
        COUNT(CASE WHEN pi.trend = 'declining' THEN 1 END)::INTEGER as declining_count
    FROM progress_indicators pi
    WHERE pi.community_id = p_community_id
    GROUP BY pi.category
    ORDER BY pi.category;
END;
$$ LANGUAGE plpgsql;

-- Function to identify indicators needing attention
CREATE OR REPLACE FUNCTION get_indicators_needing_attention(p_community_id UUID)
RETURNS TABLE (
    indicator_id TEXT,
    indicator_name TEXT,
    category TEXT,
    current_value DECIMAL,
    trend TEXT,
    priority TEXT,
    days_since_update INTEGER,
    recent_alerts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id,
        pi.name,
        pi.category,
        pi.current_value,
        pi.trend,
        pi.priority,
        EXTRACT(DAY FROM CURRENT_TIMESTAMP - pi.last_updated)::INTEGER as days_since_update,
        (SELECT COUNT(*)::INTEGER FROM progress_alerts pa 
         WHERE pa.indicator_id = pi.id 
         AND pa.detected_at >= CURRENT_TIMESTAMP - INTERVAL '7 days') as recent_alerts
    FROM progress_indicators pi
    WHERE pi.community_id = p_community_id
    AND (
        pi.trend = 'declining' 
        OR pi.priority = 'critical'
        OR pi.last_updated < CURRENT_TIMESTAMP - INTERVAL '7 days'
        OR EXISTS (
            SELECT 1 FROM progress_alerts pa 
            WHERE pa.indicator_id = pi.id 
            AND pa.acknowledged = FALSE
        )
    )
    ORDER BY 
        CASE pi.priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        pi.last_updated ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample monitoring configuration
INSERT INTO progress_monitoring_config (community_id, configuration) 
SELECT 
    c.id,
    jsonb_build_object(
        'enabled', true,
        'reportingFrequency', 'weekly',
        'alertThresholds', jsonb_build_object(
            'improvement', 10,
            'decline', -5,
            'critical', -15
        ),
        'categories', jsonb_build_object(
            'health', jsonb_build_object('enabled', true, 'weight', 0.2),
            'education', jsonb_build_object('enabled', true, 'weight', 0.15),
            'economic', jsonb_build_object('enabled', true, 'weight', 0.15),
            'cultural', jsonb_build_object('enabled', true, 'weight', 0.2),
            'social', jsonb_build_object('enabled', true, 'weight', 0.15),
            'environmental', jsonb_build_object('enabled', true, 'weight', 0.1),
            'governance', jsonb_build_object('enabled', true, 'weight', 0.05)
        ),
        'culturalProtocols', jsonb_build_array(
            'Respect traditional knowledge in all monitoring',
            'Ensure community ownership of data',
            'Maintain cultural safety in all communications'
        ),
        'customIndicators', jsonb_build_array()
    )
FROM communities c
WHERE NOT EXISTS (
    SELECT 1 FROM progress_monitoring_config pmc 
    WHERE pmc.community_id = c.id
)
LIMIT 5; -- Only add to first 5 communities as example

-- Add some sample progress indicators
INSERT INTO progress_indicators (
    id, community_id, category, name, description, current_value, unit, 
    trend, trend_strength, confidence, last_updated, data_source, 
    frequency, priority, stakeholders
)
SELECT 
    'health-overall-' || c.id,
    c.id,
    'health',
    'Overall Community Health Score',
    'Composite score of community health and wellbeing indicators',
    75.0 + (RANDOM() * 20 - 10), -- Random score between 65-85
    'score',
    CASE 
        WHEN RANDOM() < 0.4 THEN 'improving'
        WHEN RANDOM() < 0.8 THEN 'stable'
        ELSE 'declining'
    END,
    'moderate',
    0.85,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '7 days'),
    'Community Health Service',
    'weekly',
    'high',
    ARRAY['Health Coordinator', 'Community Leaders']
FROM communities c
WHERE EXISTS (
    SELECT 1 FROM progress_monitoring_config pmc 
    WHERE pmc.community_id = c.id
)
LIMIT 5;

INSERT INTO progress_indicators (
    id, community_id, category, name, description, current_value, unit, 
    trend, trend_strength, confidence, last_updated, data_source, 
    frequency, priority, cultural_context, stakeholders
)
SELECT 
    'cultural-events-' || c.id,
    c.id,
    'cultural',
    'Cultural Events and Ceremonies',
    'Number of cultural events and traditional ceremonies held',
    5.0 + (RANDOM() * 10), -- Random between 5-15 events
    'events',
    CASE 
        WHEN RANDOM() < 0.5 THEN 'improving'
        WHEN RANDOM() < 0.8 THEN 'stable'
        ELSE 'declining'
    END,
    'strong',
    0.95,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '5 days'),
    'Event Management System',
    'monthly',
    'critical',
    'Traditional ceremonies are vital for cultural continuity',
    ARRAY['Elders', 'Cultural Authorities', 'Community Leaders']
FROM communities c
WHERE EXISTS (
    SELECT 1 FROM progress_monitoring_config pmc 
    WHERE pmc.community_id = c.id
)
LIMIT 5;

INSERT INTO progress_indicators (
    id, community_id, category, name, description, current_value, unit, 
    trend, trend_strength, confidence, last_updated, data_source, 
    frequency, priority, stakeholders
)
SELECT 
    'social-engagement-' || c.id,
    c.id,
    'social',
    'Community Engagement Level',
    'Total participation in community events and activities',
    150.0 + (RANDOM() * 100), -- Random between 150-250 participants
    'participants',
    CASE 
        WHEN RANDOM() < 0.6 THEN 'improving'
        WHEN RANDOM() < 0.9 THEN 'stable'
        ELSE 'declining'
    END,
    'moderate',
    0.9,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '3 days'),
    'Event Management System',
    'weekly',
    'medium',
    ARRAY['Community Coordinator', 'Event Organizers']
FROM communities c
WHERE EXISTS (
    SELECT 1 FROM progress_monitoring_config pmc 
    WHERE pmc.community_id = c.id
)
LIMIT 5;

-- Add some sample alerts
INSERT INTO progress_alerts (
    id, type, severity, title, description, indicator_id, indicator_name,
    current_value, change_amount, change_percentage, detected_at,
    suggested_actions, stakeholders_to_notify
)
SELECT 
    'alert-health-overall-' || c.id || '-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT,
    'decline',
    'warning',
    'Health Score Showing Decline',
    'Overall community health score has declined by 8% over the past week',
    'health-overall-' || c.id,
    'Overall Community Health Score',
    70.0,
    -6.0,
    -8.0,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '2 days'),
    ARRAY[
        'Investigate causes of decline',
        'Engage with health coordinators',
        'Review current health programs'
    ],
    ARRAY['Health Coordinator', 'Community Leaders']
FROM communities c
WHERE EXISTS (
    SELECT 1 FROM progress_indicators pi 
    WHERE pi.id = 'health-overall-' || c.id
)
AND RANDOM() < 0.3 -- Only create alerts for 30% of communities
LIMIT 2;

COMMENT ON TABLE progress_monitoring_config IS 'Configuration settings for automated progress monitoring per community';
COMMENT ON TABLE progress_indicators IS 'Current progress indicators with values, trends, and metadata';
COMMENT ON TABLE progress_indicator_history IS 'Historical values for progress indicators to enable trend analysis';
COMMENT ON TABLE progress_alerts IS 'Automated alerts generated based on indicator changes and thresholds';
COMMENT ON TABLE progress_reports IS 'Generated progress reports with comprehensive community insights';
COMMENT ON TABLE monitoring_automation_log IS 'Log of automated monitoring system activities and performance';