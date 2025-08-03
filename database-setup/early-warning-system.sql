-- Early Warning System Database Schema
-- Supports alert generation, monitoring, and management for community issues

-- Early Warning Alerts table
CREATE TABLE IF NOT EXISTS early_warning_alerts (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    community_name TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('emerging_issue', 'service_strain', 'funding_opportunity', 'resource_match', 'cultural_concern')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    indicators JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    cultural_considerations TEXT[] DEFAULT ARRAY[]::TEXT[],
    stakeholders TEXT[] DEFAULT ARRAY[]::TEXT[],
    timeframe TEXT NOT NULL CHECK (timeframe IN ('immediate', 'short_term', 'medium_term')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    assigned_to TEXT,
    community_response TEXT,
    follow_up_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Indexes for performance
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Alert History table for tracking changes
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    alert_id TEXT NOT NULL REFERENCES early_warning_alerts(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'acknowledged', 'resolved', 'reopened')),
    performed_by TEXT,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service Strain Metrics table
CREATE TABLE IF NOT EXISTS service_strain_metrics (
    id SERIAL PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('healthcare', 'education', 'social_services', 'cultural_programs', 'emergency_response')),
    current_demand INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 0,
    utilization_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    wait_times INTEGER NOT NULL DEFAULT 0, -- in days
    quality_metrics JSONB DEFAULT '{}'::jsonb,
    staffing_levels DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (staffing_levels >= 0 AND staffing_levels <= 2),
    resource_availability DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (resource_availability >= 0 AND resource_availability <= 1),
    community_feedback DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (community_feedback >= 0 AND community_feedback <= 1),
    trend_direction TEXT NOT NULL DEFAULT 'stable' CHECK (trend_direction IN ('improving', 'stable', 'declining', 'critical')),
    last_assessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Opportunity Matches table
CREATE TABLE IF NOT EXISTS opportunity_matches (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('funding', 'partnership', 'resource_sharing', 'knowledge_exchange', 'capacity_building')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL,
    eligibility_criteria TEXT[] DEFAULT ARRAY[]::TEXT[],
    matching_communities TEXT[] DEFAULT ARRAY[]::TEXT[],
    match_score DECIMAL(3,2) DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 1),
    deadline TIMESTAMP WITH TIME ZONE,
    estimated_value INTEGER DEFAULT 0,
    requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_alignment DECIMAL(3,2) DEFAULT 0 CHECK (cultural_alignment >= 0 AND cultural_alignment <= 1),
    community_benefit TEXT,
    application_process TEXT,
    contact_information TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'applied', 'awarded', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emerging Issue Patterns table
CREATE TABLE IF NOT EXISTS emerging_issue_patterns (
    id TEXT PRIMARY KEY,
    pattern TEXT NOT NULL,
    description TEXT NOT NULL,
    indicators TEXT[] DEFAULT ARRAY[]::TEXT[],
    affected_communities TEXT[] DEFAULT ARRAY[]::TEXT[],
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    related_issues TEXT[] DEFAULT ARRAY[]::TEXT[],
    prevention_strategies TEXT[] DEFAULT ARRAY[]::TEXT[],
    intervention_options TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_factors TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Alert Thresholds configuration table
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id SERIAL PRIMARY KEY,
    threshold_type TEXT NOT NULL UNIQUE,
    threshold_value DECIMAL(5,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Needs table (if not exists)
CREATE TABLE IF NOT EXISTS community_needs (
    id SERIAL PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    need_description TEXT NOT NULL,
    urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    affected_population INTEGER DEFAULT 0,
    current_resources TEXT[] DEFAULT ARRAY[]::TEXT[],
    resource_gaps TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_considerations TEXT[] DEFAULT ARRAY[]::TEXT[],
    identified_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_assessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'being_addressed', 'resolved', 'deferred'))
);

-- Alert Notifications table
CREATE TABLE IF NOT EXISTS alert_notifications (
    id SERIAL PRIMARY KEY,
    alert_id TEXT NOT NULL REFERENCES early_warning_alerts(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('community_leader', 'service_provider', 'government_official', 'elder', 'stakeholder')),
    recipient_id TEXT,
    notification_method TEXT NOT NULL CHECK (notification_method IN ('email', 'sms', 'in_app', 'phone')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_early_warning_alerts_community_id ON early_warning_alerts(community_id);
CREATE INDEX IF NOT EXISTS idx_early_warning_alerts_status ON early_warning_alerts(status);
CREATE INDEX IF NOT EXISTS idx_early_warning_alerts_severity ON early_warning_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_early_warning_alerts_alert_type ON early_warning_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_early_warning_alerts_created_at ON early_warning_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_early_warning_alerts_timeframe ON early_warning_alerts(timeframe);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_timestamp ON alert_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_service_strain_metrics_community_id ON service_strain_metrics(community_id);
CREATE INDEX IF NOT EXISTS idx_service_strain_metrics_service_type ON service_strain_metrics(service_type);
CREATE INDEX IF NOT EXISTS idx_service_strain_metrics_last_assessed ON service_strain_metrics(last_assessed);

CREATE INDEX IF NOT EXISTS idx_opportunity_matches_status ON opportunity_matches(status);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_deadline ON opportunity_matches(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_type ON opportunity_matches(type);

CREATE INDEX IF NOT EXISTS idx_emerging_issue_patterns_severity ON emerging_issue_patterns(severity);
CREATE INDEX IF NOT EXISTS idx_emerging_issue_patterns_first_detected ON emerging_issue_patterns(first_detected);

CREATE INDEX IF NOT EXISTS idx_community_needs_community_id ON community_needs(community_id);
CREATE INDEX IF NOT EXISTS idx_community_needs_urgency ON community_needs(urgency);
CREATE INDEX IF NOT EXISTS idx_community_needs_status ON community_needs(status);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);

-- Insert default alert thresholds
INSERT INTO alert_thresholds (threshold_type, threshold_value, description) VALUES
    ('service_strain', 0.70, 'Service utilization threshold for strain alerts'),
    ('emerging_issue_confidence', 0.60, 'Minimum confidence level for emerging issue alerts'),
    ('opportunity_match', 0.70, 'Minimum match score for opportunity alerts'),
    ('critical_response_time', 24.00, 'Maximum response time for critical alerts (hours)'),
    ('high_response_time', 72.00, 'Maximum response time for high priority alerts (hours)')
ON CONFLICT (threshold_type) DO NOTHING;

-- Insert sample service strain metrics for testing
INSERT INTO service_strain_metrics (
    community_id, 
    service_type, 
    current_demand, 
    capacity, 
    utilization_rate, 
    wait_times, 
    quality_metrics, 
    staffing_levels, 
    resource_availability, 
    community_feedback, 
    trend_direction
) VALUES
    ('community-1', 'healthcare', 120, 100, 1.20, 14, '{"satisfaction": 0.7, "effectiveness": 0.8}', 0.8, 0.6, 0.6, 'declining'),
    ('community-1', 'education', 80, 100, 0.80, 0, '{"satisfaction": 0.9, "effectiveness": 0.85}', 0.9, 0.8, 0.9, 'stable'),
    ('community-2', 'social_services', 150, 120, 1.25, 21, '{"satisfaction": 0.6, "effectiveness": 0.7}', 0.7, 0.5, 0.5, 'declining')
ON CONFLICT DO NOTHING;

-- Insert sample opportunity matches
INSERT INTO opportunity_matches (
    id,
    type,
    title,
    description,
    source,
    eligibility_criteria,
    estimated_value,
    requirements,
    cultural_alignment,
    community_benefit,
    application_process,
    contact_information,
    status
) VALUES
    ('opp-health-2024-001', 'funding', 'Community Health Initiative Grant', 
     'Funding for community-led health programs focusing on preventive care and traditional healing integration',
     'Indigenous Health Foundation', 
     ARRAY['Indigenous communities', 'Population under 5000', 'Rural or remote location'],
     50000,
     ARRAY['Community health assessment', 'Elder support letter', 'Traditional healer involvement'],
     0.9,
     'Improved health outcomes through culturally appropriate care',
     'Online application with community consultation requirement',
     'grants@indigenoushealthfoundation.org',
     'available'),
    ('opp-education-2024-002', 'funding', 'Cultural Education Preservation Grant',
     'Support for programs that preserve and teach traditional knowledge and languages',
     'Cultural Heritage Foundation',
     ARRAY['Indigenous communities', 'Language preservation focus', 'Elder involvement'],
     75000,
     ARRAY['Language assessment', 'Elder teacher identification', 'Curriculum development plan'],
     0.95,
     'Preservation of traditional knowledge and language revitalization',
     'Application requires community approval and elder endorsement',
     'programs@culturalheritage.org',
     'available')
ON CONFLICT (id) DO NOTHING;

-- Insert sample community needs
INSERT INTO community_needs (
    community_id,
    category,
    need_description,
    urgency,
    affected_population,
    current_resources,
    resource_gaps,
    cultural_considerations,
    status
) VALUES
    ('community-1', 'healthcare', 'Mental health support services for youth', 'high', 45,
     ARRAY['Community health nurse', 'Elder counselors'],
     ARRAY['Licensed therapist', 'Youth-specific programs', 'Crisis intervention'],
     ARRAY['Traditional healing integration', 'Family involvement', 'Cultural ceremonies'],
     'active'),
    ('community-1', 'housing', 'Affordable housing for young families', 'critical', 12,
     ARRAY['Housing authority', 'Construction materials'],
     ARRAY['Skilled workers', 'Funding', 'Land development'],
     ARRAY['Traditional building methods', 'Extended family considerations', 'Land use protocols'],
     'active'),
    ('community-2', 'education', 'Early childhood education program', 'medium', 25,
     ARRAY['Community center', 'Volunteer teachers'],
     ARRAY['Certified educators', 'Educational materials', 'Transportation'],
     ARRAY['Language immersion', 'Traditional knowledge integration', 'Family participation'],
     'being_addressed')
ON CONFLICT DO NOTHING;

-- Create functions for alert management

-- Function to automatically update alert history
CREATE OR REPLACE FUNCTION log_alert_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO alert_history (alert_id, action, new_status, timestamp)
        VALUES (NEW.id, 'created', NEW.status, CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO alert_history (alert_id, action, previous_status, new_status, timestamp)
            VALUES (NEW.id, 
                   CASE 
                       WHEN NEW.status = 'acknowledged' THEN 'acknowledged'
                       WHEN NEW.status = 'resolved' THEN 'resolved'
                       WHEN NEW.status = 'active' AND OLD.status = 'resolved' THEN 'reopened'
                       ELSE 'updated'
                   END,
                   OLD.status, NEW.status, CURRENT_TIMESTAMP);
        END IF;
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for alert history logging
DROP TRIGGER IF EXISTS alert_history_trigger ON early_warning_alerts;
CREATE TRIGGER alert_history_trigger
    AFTER INSERT OR UPDATE ON early_warning_alerts
    FOR EACH ROW EXECUTE FUNCTION log_alert_changes();

-- Function to calculate service strain level
CREATE OR REPLACE FUNCTION calculate_service_strain(
    p_utilization_rate DECIMAL,
    p_wait_times INTEGER,
    p_quality_metrics JSONB,
    p_staffing_levels DECIMAL,
    p_resource_availability DECIMAL,
    p_community_feedback DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    utilization_strain DECIMAL;
    wait_time_strain DECIMAL;
    quality_strain DECIMAL;
    staffing_strain DECIMAL;
    resource_strain DECIMAL;
    feedback_strain DECIMAL;
    avg_quality DECIMAL;
    strain_level DECIMAL;
BEGIN
    -- Calculate individual strain components
    utilization_strain := LEAST(p_utilization_rate, 2.0) / 2.0;
    wait_time_strain := LEAST(p_wait_times::DECIMAL / 30.0, 1.0);
    
    -- Calculate average quality score
    SELECT AVG(value::DECIMAL) INTO avg_quality
    FROM jsonb_each_text(p_quality_metrics);
    quality_strain := 1.0 - COALESCE(avg_quality, 0.5);
    
    staffing_strain := 1.0 - p_staffing_levels;
    resource_strain := 1.0 - p_resource_availability;
    feedback_strain := 1.0 - p_community_feedback;
    
    -- Calculate overall strain level
    strain_level := (utilization_strain + wait_time_strain + quality_strain + 
                    staffing_strain + resource_strain + feedback_strain) / 6.0;
    
    RETURN LEAST(strain_level, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Function to get alert statistics
CREATE OR REPLACE FUNCTION get_alert_statistics(
    p_community_id TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_alerts INTEGER,
    critical_alerts INTEGER,
    high_alerts INTEGER,
    medium_alerts INTEGER,
    low_alerts INTEGER,
    active_alerts INTEGER,
    resolved_alerts INTEGER,
    avg_response_time DECIMAL,
    resolution_rate DECIMAL
) AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    start_date := CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_alerts,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END)::INTEGER as critical_alerts,
        COUNT(CASE WHEN severity = 'high' THEN 1 END)::INTEGER as high_alerts,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END)::INTEGER as medium_alerts,
        COUNT(CASE WHEN severity = 'low' THEN 1 END)::INTEGER as low_alerts,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_alerts,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END)::INTEGER as resolved_alerts,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::DECIMAL as avg_response_time,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN status = 'resolved' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
            ELSE 0 
        END as resolution_rate
    FROM early_warning_alerts
    WHERE created_at >= start_date
    AND (p_community_id IS NULL OR community_id = p_community_id);
END;
$$ LANGUAGE plpgsql;

-- Create view for active alerts summary
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT 
    a.id,
    a.community_id,
    a.community_name,
    a.alert_type,
    a.severity,
    a.title,
    a.timeframe,
    a.confidence,
    a.created_at,
    a.assigned_to,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at))/3600 as hours_since_created,
    CASE 
        WHEN a.severity = 'critical' AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at))/3600 > 24 THEN 'overdue'
        WHEN a.severity = 'high' AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at))/3600 > 72 THEN 'overdue'
        ELSE 'on_time'
    END as response_status
FROM early_warning_alerts a
WHERE a.status = 'active'
ORDER BY 
    CASE a.severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    a.created_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON early_warning_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_strain_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emerging_issue_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_needs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_notifications TO authenticated;
GRANT SELECT, UPDATE ON alert_thresholds TO authenticated;

GRANT SELECT ON active_alerts_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_alert_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_service_strain TO authenticated;

-- Enable Row Level Security
ALTER TABLE early_warning_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_strain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE emerging_issue_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - should be customized based on actual auth requirements)
CREATE POLICY "Users can view alerts for their communities" ON early_warning_alerts
    FOR SELECT USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Users can create alerts" ON early_warning_alerts
    FOR INSERT WITH CHECK (true); -- Adjust based on actual auth logic

CREATE POLICY "Users can update alerts for their communities" ON early_warning_alerts
    FOR UPDATE USING (true); -- Adjust based on actual auth logic