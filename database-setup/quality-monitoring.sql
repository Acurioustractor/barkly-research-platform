-- Quality Monitoring System Database Schema

-- Quality Metrics Table
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('accuracy', 'bias', 'cultural_sensitivity', 'completeness', 'relevance')),
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(5,3) NOT NULL,
    threshold DECIMAL(5,3) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('good', 'warning', 'critical')),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    insight_type VARCHAR(50),
    time_period VARCHAR(20) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Bias Detection Table
CREATE TABLE IF NOT EXISTS bias_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    bias_type VARCHAR(50) NOT NULL CHECK (bias_type IN ('demographic', 'cultural', 'geographic', 'temporal', 'confirmation')),
    bias_score DECIMAL(3,2) NOT NULL CHECK (bias_score >= 0 AND bias_score <= 1),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT NOT NULL,
    affected_groups TEXT[] DEFAULT '{}',
    mitigation_suggestions TEXT[] DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'reviewed', 'mitigated', 'false_positive')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT
);

-- Accuracy Tracking Table
CREATE TABLE IF NOT EXISTS accuracy_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    predicted_accuracy DECIMAL(3,2) NOT NULL CHECK (predicted_accuracy >= 0 AND predicted_accuracy <= 1),
    validated_accuracy DECIMAL(3,2) NOT NULL CHECK (validated_accuracy >= 0 AND validated_accuracy <= 5),
    accuracy_delta DECIMAL(3,2) NOT NULL,
    validation_count INTEGER NOT NULL DEFAULT 0,
    consensus_level DECIMAL(3,2) NOT NULL DEFAULT 0,
    cultural_appropriateness DECIMAL(3,2) NOT NULL DEFAULT 0,
    source_reliability DECIMAL(3,2) NOT NULL DEFAULT 0,
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Alerts Table
CREATE TABLE IF NOT EXISTS quality_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('accuracy_drop', 'bias_detected', 'cultural_concern', 'validation_failure')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_insights TEXT[] DEFAULT '{}',
    affected_communities TEXT[] DEFAULT '{}',
    recommended_actions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Quality Monitoring Configuration
CREATE TABLE IF NOT EXISTS quality_monitoring_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    threshold_good DECIMAL(5,3) NOT NULL,
    threshold_warning DECIMAL(5,3) NOT NULL,
    threshold_critical DECIMAL(5,3) NOT NULL,
    monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    alert_frequency VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (alert_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
    notification_recipients TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, metric_type)
);

-- Model Performance Tracking
CREATE TABLE IF NOT EXISTS model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    performance_metric VARCHAR(50) NOT NULL,
    metric_value DECIMAL(5,3) NOT NULL,
    test_dataset_size INTEGER NOT NULL,
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evaluation_notes TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    insight_type VARCHAR(50)
);

-- Cultural Bias Monitoring
CREATE TABLE IF NOT EXISTS cultural_bias_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    bias_indicators JSONB NOT NULL DEFAULT '{}',
    cultural_reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    bias_severity VARCHAR(20) NOT NULL CHECK (bias_severity IN ('none', 'low', 'medium', 'high', 'critical')),
    cultural_context_missing BOOLEAN NOT NULL DEFAULT FALSE,
    traditional_knowledge_misrepresented BOOLEAN NOT NULL DEFAULT FALSE,
    stereotypes_present BOOLEAN NOT NULL DEFAULT FALSE,
    cultural_protocols_violated BOOLEAN NOT NULL DEFAULT FALSE,
    mitigation_applied TEXT[],
    monitored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE
);

-- Quality Improvement Tracking
CREATE TABLE IF NOT EXISTS quality_improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    improvement_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    target_metric VARCHAR(50) NOT NULL,
    baseline_value DECIMAL(5,3) NOT NULL,
    target_value DECIMAL(5,3) NOT NULL,
    current_value DECIMAL(5,3),
    implementation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    responsible_team VARCHAR(100),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    impact_assessment JSONB DEFAULT '{}'
);

-- Quality Audit Log
CREATE TABLE IF NOT EXISTS quality_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(50),
    changes JSONB DEFAULT '{}',
    audit_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quality_metrics_type ON quality_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_community ON quality_metrics(community_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_calculated ON quality_metrics(calculated_at);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_status ON quality_metrics(status);

CREATE INDEX IF NOT EXISTS idx_bias_detections_insight ON bias_detections(insight_id);
CREATE INDEX IF NOT EXISTS idx_bias_detections_type ON bias_detections(bias_type);
CREATE INDEX IF NOT EXISTS idx_bias_detections_status ON bias_detections(status);
CREATE INDEX IF NOT EXISTS idx_bias_detections_detected ON bias_detections(detected_at);

CREATE INDEX IF NOT EXISTS idx_accuracy_tracking_insight ON accuracy_tracking(insight_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_tracking_tracked ON accuracy_tracking(tracked_at);
CREATE INDEX IF NOT EXISTS idx_accuracy_tracking_delta ON accuracy_tracking(accuracy_delta);

CREATE INDEX IF NOT EXISTS idx_quality_alerts_type ON quality_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_severity ON quality_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_created ON quality_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_resolved ON quality_alerts(resolved_at);

CREATE INDEX IF NOT EXISTS idx_quality_config_community ON quality_monitoring_config(community_id);
CREATE INDEX IF NOT EXISTS idx_quality_config_type ON quality_monitoring_config(metric_type);

CREATE INDEX IF NOT EXISTS idx_model_performance_name ON model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_model_performance_community ON model_performance(community_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_date ON model_performance(evaluation_date);

CREATE INDEX IF NOT EXISTS idx_cultural_bias_insight ON cultural_bias_monitoring(insight_id);
CREATE INDEX IF NOT EXISTS idx_cultural_bias_community ON cultural_bias_monitoring(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_bias_severity ON cultural_bias_monitoring(bias_severity);

CREATE INDEX IF NOT EXISTS idx_quality_improvements_type ON quality_improvements(improvement_type);
CREATE INDEX IF NOT EXISTS idx_quality_improvements_status ON quality_improvements(status);
CREATE INDEX IF NOT EXISTS idx_quality_improvements_community ON quality_improvements(community_id);

CREATE INDEX IF NOT EXISTS idx_quality_audit_type ON quality_audit_log(audit_type);
CREATE INDEX IF NOT EXISTS idx_quality_audit_entity ON quality_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_quality_audit_timestamp ON quality_audit_log(audit_timestamp);

-- Row Level Security Policies

-- Quality Metrics
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's quality metrics"
    ON quality_metrics FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR 
        community_id IS NULL
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "System can insert quality metrics"
    ON quality_metrics FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator', 'system')
        )
    );

-- Bias Detections
ALTER TABLE bias_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view bias detections for their community insights"
    ON bias_detections FOR SELECT
    USING (
        insight_id IN (
            SELECT ii.id FROM intelligence_insights ii
            JOIN users u ON u.community_id = ii.community_id
            WHERE u.id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Reviewers can update bias detection status"
    ON bias_detections FOR UPDATE
    USING (
        reviewed_by = auth.uid()
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Accuracy Tracking
ALTER TABLE accuracy_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view accuracy tracking for their community insights"
    ON accuracy_tracking FOR SELECT
    USING (
        insight_id IN (
            SELECT ii.id FROM intelligence_insights ii
            JOIN users u ON u.community_id = ii.community_id
            WHERE u.id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Quality Alerts
ALTER TABLE quality_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality alerts for their communities"
    ON quality_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND (
                u.community_id = ANY(affected_communities::UUID[])
                OR u.role IN ('admin', 'moderator')
            )
        )
    );

CREATE POLICY "Authorized users can resolve alerts"
    ON quality_alerts FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Quality Monitoring Configuration
ALTER TABLE quality_monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's monitoring config"
    ON quality_monitoring_config FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can manage monitoring configuration"
    ON quality_monitoring_config FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Cultural Bias Monitoring
ALTER TABLE cultural_bias_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view cultural bias monitoring for their community"
    ON cultural_bias_monitoring FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Functions for quality monitoring

-- Function to calculate overall quality score
CREATE OR REPLACE FUNCTION calculate_overall_quality_score(community_uuid UUID, time_period VARCHAR DEFAULT '30d')
RETURNS DECIMAL(3,2) AS $$
DECLARE
    accuracy_score DECIMAL(3,2);
    bias_score DECIMAL(3,2);
    cultural_score DECIMAL(3,2);
    completeness_score DECIMAL(3,2);
    relevance_score DECIMAL(3,2);
    overall_score DECIMAL(3,2);
    days_back INTEGER;
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Parse time period
    days_back := CAST(REPLACE(time_period, 'd', '') AS INTEGER);
    start_date := NOW() - INTERVAL '1 day' * days_back;
    
    -- Get latest metrics for each type
    SELECT value INTO accuracy_score
    FROM quality_metrics
    WHERE community_id = community_uuid
    AND metric_type = 'accuracy'
    AND calculated_at >= start_date
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    SELECT (1 - value) INTO bias_score  -- Invert bias score (lower bias = higher quality)
    FROM quality_metrics
    WHERE community_id = community_uuid
    AND metric_type = 'bias'
    AND calculated_at >= start_date
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    SELECT value INTO cultural_score
    FROM quality_metrics
    WHERE community_id = community_uuid
    AND metric_type = 'cultural_sensitivity'
    AND calculated_at >= start_date
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    SELECT value INTO completeness_score
    FROM quality_metrics
    WHERE community_id = community_uuid
    AND metric_type = 'completeness'
    AND calculated_at >= start_date
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    SELECT value INTO relevance_score
    FROM quality_metrics
    WHERE community_id = community_uuid
    AND metric_type = 'relevance'
    AND calculated_at >= start_date
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    -- Calculate weighted average (normalize to 0-1 scale)
    overall_score := (
        COALESCE(accuracy_score / 5.0, 0) * 0.25 +
        COALESCE(bias_score, 0) * 0.20 +
        COALESCE(cultural_score, 0) * 0.25 +
        COALESCE(completeness_score / 5.0, 0) * 0.15 +
        COALESCE(relevance_score / 5.0, 0) * 0.15
    );
    
    RETURN GREATEST(0, LEAST(1, overall_score));
END;
$$ LANGUAGE plpgsql;

-- Function to detect quality degradation
CREATE OR REPLACE FUNCTION detect_quality_degradation()
RETURNS TRIGGER AS $$
DECLARE
    previous_value DECIMAL(5,3);
    degradation_threshold DECIMAL(5,3) := 0.1; -- 10% degradation threshold
BEGIN
    -- Get previous value for the same metric type and community
    SELECT value INTO previous_value
    FROM quality_metrics
    WHERE metric_type = NEW.metric_type
    AND COALESCE(community_id, 'null'::UUID) = COALESCE(NEW.community_id, 'null'::UUID)
    AND calculated_at < NEW.calculated_at
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    -- Check for significant degradation
    IF previous_value IS NOT NULL AND (previous_value - NEW.value) > degradation_threshold THEN
        -- Create quality alert
        INSERT INTO quality_alerts (
            alert_type,
            severity,
            title,
            description,
            affected_communities,
            recommended_actions
        ) VALUES (
            CASE NEW.metric_type
                WHEN 'accuracy' THEN 'accuracy_drop'
                WHEN 'bias' THEN 'bias_detected'
                WHEN 'cultural_sensitivity' THEN 'cultural_concern'
                ELSE 'validation_failure'
            END,
            CASE 
                WHEN (previous_value - NEW.value) > 0.3 THEN 'critical'
                WHEN (previous_value - NEW.value) > 0.2 THEN 'high'
                ELSE 'medium'
            END,
            'Quality Degradation Detected: ' || NEW.metric_name,
            'Quality metric ' || NEW.metric_name || ' has decreased from ' || 
            previous_value || ' to ' || NEW.value,
            CASE WHEN NEW.community_id IS NOT NULL THEN ARRAY[NEW.community_id::TEXT] ELSE ARRAY[]::TEXT[] END,
            ARRAY[
                'Review recent insights for quality issues',
                'Check AI model performance',
                'Increase validation requirements',
                'Review cultural safety protocols'
            ]
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quality degradation detection
CREATE TRIGGER quality_degradation_trigger
    AFTER INSERT ON quality_metrics
    FOR EACH ROW
    EXECUTE FUNCTION detect_quality_degradation();

-- Function to update bias detection status
CREATE OR REPLACE FUNCTION update_bias_detection_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reviewed timestamp and reviewer
    NEW.reviewed_at := NOW();
    NEW.reviewed_by := auth.uid();
    
    -- Log the review action
    INSERT INTO quality_audit_log (
        audit_type,
        entity_type,
        entity_id,
        action,
        actor_id,
        changes
    ) VALUES (
        'bias_review',
        'bias_detection',
        NEW.id,
        'status_update',
        auth.uid(),
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'review_notes', NEW.review_notes
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bias detection status updates
CREATE TRIGGER bias_detection_status_trigger
    BEFORE UPDATE ON bias_detections
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_bias_detection_status();

-- Function to calculate bias trend
CREATE OR REPLACE FUNCTION calculate_bias_trend(community_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_period_start TIMESTAMP WITH TIME ZONE;
    previous_period_start TIMESTAMP WITH TIME ZONE;
    current_bias_rate DECIMAL(3,2);
    previous_bias_rate DECIMAL(3,2);
    trend_direction VARCHAR(20);
BEGIN
    current_period_start := NOW() - INTERVAL '1 day' * days_back;
    previous_period_start := NOW() - INTERVAL '1 day' * (days_back * 2);
    
    -- Calculate current period bias rate
    SELECT COALESCE(AVG(bias_score), 0) INTO current_bias_rate
    FROM bias_detections bd
    JOIN intelligence_insights ii ON ii.id = bd.insight_id
    WHERE ii.community_id = community_uuid
    AND bd.detected_at >= current_period_start;
    
    -- Calculate previous period bias rate
    SELECT COALESCE(AVG(bias_score), 0) INTO previous_bias_rate
    FROM bias_detections bd
    JOIN intelligence_insights ii ON ii.id = bd.insight_id
    WHERE ii.community_id = community_uuid
    AND bd.detected_at >= previous_period_start
    AND bd.detected_at < current_period_start;
    
    -- Determine trend direction
    IF current_bias_rate > previous_bias_rate + 0.05 THEN
        trend_direction := 'increasing';
    ELSIF current_bias_rate < previous_bias_rate - 0.05 THEN
        trend_direction := 'decreasing';
    ELSE
        trend_direction := 'stable';
    END IF;
    
    result := jsonb_build_object(
        'current_bias_rate', current_bias_rate,
        'previous_bias_rate', previous_bias_rate,
        'trend_direction', trend_direction,
        'change_magnitude', ABS(current_bias_rate - previous_bias_rate)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for quality dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS quality_dashboard_summary AS
SELECT 
    COALESCE(qm.community_id, 'global') as community_id,
    qm.metric_type,
    AVG(qm.value) as avg_value,
    MIN(qm.value) as min_value,
    MAX(qm.value) as max_value,
    COUNT(CASE WHEN qm.status = 'good' THEN 1 END) as good_count,
    COUNT(CASE WHEN qm.status = 'warning' THEN 1 END) as warning_count,
    COUNT(CASE WHEN qm.status = 'critical' THEN 1 END) as critical_count,
    MAX(qm.calculated_at) as last_calculated
FROM quality_metrics qm
WHERE qm.calculated_at >= NOW() - INTERVAL '30 days'
GROUP BY COALESCE(qm.community_id, 'global'), qm.metric_type;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_quality_dashboard_community ON quality_dashboard_summary(community_id);
CREATE INDEX IF NOT EXISTS idx_quality_dashboard_type ON quality_dashboard_summary(metric_type);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_quality_dashboard()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY quality_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Insert default quality monitoring configurations
INSERT INTO quality_monitoring_config (community_id, metric_type, threshold_good, threshold_warning, threshold_critical) VALUES
(NULL, 'accuracy', 3.5, 3.0, 2.5),
(NULL, 'bias', 0.2, 0.4, 0.6),
(NULL, 'cultural_sensitivity', 0.9, 0.8, 0.7),
(NULL, 'completeness', 3.5, 3.0, 2.5),
(NULL, 'relevance', 3.5, 3.0, 2.5)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE quality_metrics IS 'Quality metrics tracking for AI-generated insights';
COMMENT ON TABLE bias_detections IS 'Detected bias in intelligence insights';
COMMENT ON TABLE accuracy_tracking IS 'Tracking accuracy of AI predictions vs community validation';
COMMENT ON TABLE quality_alerts IS 'Quality-related alerts and notifications';
COMMENT ON TABLE cultural_bias_monitoring IS 'Specialized monitoring for cultural bias and appropriateness';
COMMENT ON TABLE quality_improvements IS 'Tracking quality improvement initiatives and their impact';