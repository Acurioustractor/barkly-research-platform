-- Intelligence Validation System Database Schema

-- Intelligence Insights Table
CREATE TABLE IF NOT EXISTS intelligence_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('community_need', 'service_gap', 'success_pattern', 'health_indicator', 'trend_analysis')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    source_documents TEXT[] DEFAULT '{}',
    ai_confidence DECIMAL(3,2) NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    validation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'in_review', 'validated', 'rejected', 'needs_revision')),
    validation_score DECIMAL(3,2) CHECK (validation_score >= 0 AND validation_score <= 5),
    cultural_appropriateness VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (cultural_appropriateness IN ('pending', 'approved', 'concerns', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Experts Table
CREATE TABLE IF NOT EXISTS community_experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    expertise_areas TEXT[] NOT NULL DEFAULT '{}',
    cultural_role VARCHAR(50) NOT NULL,
    validation_history JSONB NOT NULL DEFAULT '{"total_validations": 0, "accuracy_rating": 0, "response_time_avg": 0}',
    availability_status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    preferred_languages TEXT[] DEFAULT '{"en"}',
    cultural_protocols JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

-- Validation Requests Table
CREATE TABLE IF NOT EXISTS validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    validator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    validator_role VARCHAR(50) NOT NULL CHECK (validator_role IN ('community_expert', 'elder', 'cultural_advisor', 'subject_expert', 'community_member')),
    validation_type VARCHAR(50) NOT NULL CHECK (validation_type IN ('accuracy', 'cultural_appropriateness', 'relevance', 'completeness')),
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Validation Responses Table
CREATE TABLE IF NOT EXISTS validation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES validation_requests(id) ON DELETE CASCADE,
    validator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    accuracy_score INTEGER NOT NULL CHECK (accuracy_score >= 1 AND accuracy_score <= 5),
    relevance_score INTEGER NOT NULL CHECK (relevance_score >= 1 AND relevance_score <= 5),
    completeness_score INTEGER NOT NULL CHECK (completeness_score >= 1 AND completeness_score <= 5),
    cultural_appropriateness_score INTEGER NOT NULL CHECK (cultural_appropriateness_score >= 1 AND cultural_appropriateness_score <= 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    feedback_comments TEXT,
    suggested_improvements TEXT[] DEFAULT '{}',
    cultural_concerns TEXT[] DEFAULT '{}',
    factual_corrections TEXT[] DEFAULT '{}',
    source_verification JSONB NOT NULL DEFAULT '{"sources_accurate": true, "missing_sources": [], "additional_sources": []}',
    recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('approve', 'approve_with_changes', 'reject', 'needs_more_review')),
    confidence_level DECIMAL(3,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, validator_id)
);

-- Validation Metrics Table
CREATE TABLE IF NOT EXISTS validation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    metrics JSONB NOT NULL DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(insight_id)
);

-- Expert Performance Tracking
CREATE TABLE IF NOT EXISTS expert_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID REFERENCES community_experts(id) ON DELETE CASCADE,
    validation_id UUID REFERENCES validation_responses(id) ON DELETE CASCADE,
    response_time_hours INTEGER NOT NULL,
    accuracy_feedback DECIMAL(3,2), -- Feedback from other validators or community
    community_satisfaction INTEGER CHECK (community_satisfaction >= 1 AND community_satisfaction <= 5),
    cultural_sensitivity_rating INTEGER CHECK (cultural_sensitivity_rating >= 1 AND cultural_sensitivity <= 5),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation Notifications
CREATE TABLE IF NOT EXISTS validation_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    related_request_id UUID REFERENCES validation_requests(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Validation Audit Log
CREATE TABLE IF NOT EXISTS validation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(50),
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cultural Review Queue
CREATE TABLE IF NOT EXISTS cultural_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    cultural_sensitivity_level VARCHAR(20) NOT NULL CHECK (cultural_sensitivity_level IN ('low', 'medium', 'high')),
    assigned_elder_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_cultural_advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'needs_consultation')),
    review_notes TEXT,
    cultural_protocols_followed BOOLEAN DEFAULT FALSE,
    elder_consultation_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_community ON intelligence_insights(community_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_type ON intelligence_insights(type);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_status ON intelligence_insights(validation_status);
CREATE INDEX IF NOT EXISTS idx_intelligence_insights_cultural ON intelligence_insights(cultural_appropriateness);

CREATE INDEX IF NOT EXISTS idx_community_experts_community ON community_experts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_experts_user ON community_experts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_experts_availability ON community_experts(availability_status);
CREATE INDEX IF NOT EXISTS idx_community_experts_expertise ON community_experts USING GIN(expertise_areas);

CREATE INDEX IF NOT EXISTS idx_validation_requests_insight ON validation_requests(insight_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_validator ON validation_requests(validator_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_status ON validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_validation_requests_deadline ON validation_requests(deadline);

CREATE INDEX IF NOT EXISTS idx_validation_responses_request ON validation_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_validation_responses_validator ON validation_responses(validator_id);
CREATE INDEX IF NOT EXISTS idx_validation_responses_rating ON validation_responses(overall_rating);

CREATE INDEX IF NOT EXISTS idx_validation_metrics_insight ON validation_metrics(insight_id);

CREATE INDEX IF NOT EXISTS idx_expert_performance_expert ON expert_performance(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_performance_validation ON expert_performance(validation_id);

CREATE INDEX IF NOT EXISTS idx_validation_notifications_recipient ON validation_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_validation_notifications_read ON validation_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_validation_notifications_type ON validation_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_validation_audit_insight ON validation_audit_log(insight_id);
CREATE INDEX IF NOT EXISTS idx_validation_audit_actor ON validation_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_validation_audit_timestamp ON validation_audit_log(timestamp);

CREATE INDEX IF NOT EXISTS idx_cultural_review_community ON cultural_review_queue(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_review_status ON cultural_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_cultural_review_priority ON cultural_review_queue(priority_level);

-- Row Level Security Policies

-- Intelligence Insights
ALTER TABLE intelligence_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's insights"
    ON intelligence_insights FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR 
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Experts can create insights for validation"
    ON intelligence_insights FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM community_experts WHERE community_id = intelligence_insights.community_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Community Experts
ALTER TABLE community_experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's experts"
    ON community_experts FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can manage their own expert profile"
    ON community_experts FOR ALL
    USING (user_id = auth.uid());

-- Validation Requests
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validators can view their assigned requests"
    ON validation_requests FOR SELECT
    USING (
        validator_id = auth.uid()
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "System can create validation requests"
    ON validation_requests FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator', 'system')
        )
    );

-- Validation Responses
ALTER TABLE validation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validators can submit their own responses"
    ON validation_responses FOR INSERT
    WITH CHECK (validator_id = auth.uid());

CREATE POLICY "Validators can view their own responses"
    ON validation_responses FOR SELECT
    USING (
        validator_id = auth.uid()
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Validation Metrics
ALTER TABLE validation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view metrics for their community insights"
    ON validation_metrics FOR SELECT
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

-- Expert Performance
ALTER TABLE expert_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts can view their own performance"
    ON expert_performance FOR SELECT
    USING (
        expert_id IN (
            SELECT id FROM community_experts WHERE user_id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Validation Notifications
ALTER TABLE validation_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON validation_notifications FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON validation_notifications FOR UPDATE
    USING (recipient_id = auth.uid());

-- Cultural Review Queue
ALTER TABLE cultural_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's cultural reviews"
    ON cultural_review_queue FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Functions for validation processing

-- Function to calculate expert accuracy rating
CREATE OR REPLACE FUNCTION calculate_expert_accuracy(expert_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_accuracy DECIMAL(3,2);
BEGIN
    SELECT AVG(accuracy_feedback) INTO avg_accuracy
    FROM expert_performance ep
    JOIN community_experts ce ON ce.id = ep.expert_id
    WHERE ce.user_id = expert_uuid
    AND ep.accuracy_feedback IS NOT NULL;
    
    RETURN COALESCE(avg_accuracy, 0.0);
END;
$$ LANGUAGE plpgsql;

-- Function to get validation consensus
CREATE OR REPLACE FUNCTION get_validation_consensus(insight_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_responses INTEGER;
    avg_rating DECIMAL(3,2);
    consensus_level DECIMAL(3,2);
BEGIN
    -- Get response statistics
    SELECT 
        COUNT(*),
        AVG(overall_rating)
    INTO total_responses, avg_rating
    FROM validation_responses vr
    JOIN validation_requests vreq ON vreq.id = vr.request_id
    WHERE vreq.insight_id = insight_uuid;
    
    -- Calculate consensus (how much validators agree)
    WITH rating_variance AS (
        SELECT VARIANCE(overall_rating) as var
        FROM validation_responses vr
        JOIN validation_requests vreq ON vreq.id = vr.request_id
        WHERE vreq.insight_id = insight_uuid
    )
    SELECT GREATEST(0, 1 - (var / 4)) INTO consensus_level
    FROM rating_variance;
    
    result := jsonb_build_object(
        'total_responses', COALESCE(total_responses, 0),
        'average_rating', COALESCE(avg_rating, 0),
        'consensus_level', COALESCE(consensus_level, 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update expert performance
CREATE OR REPLACE FUNCTION update_expert_performance()
RETURNS TRIGGER AS $$
DECLARE
    expert_uuid UUID;
    response_time INTEGER;
BEGIN
    -- Get expert ID and calculate response time
    SELECT ce.id, EXTRACT(EPOCH FROM (NEW.submitted_at - vr.assigned_at))/3600
    INTO expert_uuid, response_time
    FROM community_experts ce
    JOIN validation_requests vr ON vr.validator_id = ce.user_id
    WHERE vr.id = NEW.request_id;
    
    -- Insert performance record
    INSERT INTO expert_performance (
        expert_id,
        validation_id,
        response_time_hours
    ) VALUES (
        expert_uuid,
        NEW.id,
        response_time
    );
    
    -- Update expert's validation history
    UPDATE community_experts
    SET validation_history = jsonb_set(
        jsonb_set(
            validation_history,
            '{total_validations}',
            ((validation_history->>'total_validations')::INTEGER + 1)::TEXT::JSONB
        ),
        '{response_time_avg}',
        (
            (
                (validation_history->>'response_time_avg')::DECIMAL * (validation_history->>'total_validations')::INTEGER + response_time
            ) / ((validation_history->>'total_validations')::INTEGER + 1)
        )::TEXT::JSONB
    )
    WHERE id = expert_uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update expert performance when validation is submitted
CREATE TRIGGER update_expert_performance_trigger
    AFTER INSERT ON validation_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_performance();

-- Function to create validation audit log
CREATE OR REPLACE FUNCTION log_validation_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO validation_audit_log (
        insight_id,
        action,
        actor_id,
        actor_role,
        details
    ) VALUES (
        COALESCE(NEW.insight_id, OLD.insight_id),
        TG_OP,
        auth.uid(),
        (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1),
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for audit logging
CREATE TRIGGER intelligence_insights_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON intelligence_insights
    FOR EACH ROW
    EXECUTE FUNCTION log_validation_action();

CREATE TRIGGER validation_responses_audit_trigger
    AFTER INSERT OR UPDATE ON validation_responses
    FOR EACH ROW
    EXECUTE FUNCTION log_validation_action();

-- Function to send validation notifications
CREATE OR REPLACE FUNCTION send_validation_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification when validation request is assigned
    IF TG_OP = 'INSERT' THEN
        INSERT INTO validation_notifications (
            recipient_id,
            notification_type,
            title,
            message,
            related_insight_id,
            related_request_id
        ) VALUES (
            NEW.validator_id,
            'validation_assigned',
            'New Validation Request',
            'You have been assigned to validate an intelligence insight.',
            NEW.insight_id,
            NEW.id
        );
    END IF;
    
    -- Send notification when validation is completed
    IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        INSERT INTO validation_notifications (
            recipient_id,
            notification_type,
            title,
            message,
            related_insight_id,
            related_request_id
        )
        SELECT 
            ii.community_id, -- This would need to be adjusted to get actual community members
            'validation_completed',
            'Validation Completed',
            'A validation has been completed for an insight in your community.',
            NEW.insight_id,
            NEW.id
        FROM intelligence_insights ii
        WHERE ii.id = NEW.insight_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for validation notifications
CREATE TRIGGER validation_notification_trigger
    AFTER INSERT OR UPDATE ON validation_requests
    FOR EACH ROW
    EXECUTE FUNCTION send_validation_notification();

-- Create materialized view for validation dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS validation_dashboard_summary AS
SELECT 
    ii.community_id,
    ii.type as insight_type,
    COUNT(*) as total_insights,
    COUNT(CASE WHEN ii.validation_status = 'validated' THEN 1 END) as validated_insights,
    COUNT(CASE WHEN ii.validation_status = 'pending' THEN 1 END) as pending_insights,
    COUNT(CASE WHEN ii.validation_status = 'rejected' THEN 1 END) as rejected_insights,
    AVG(ii.validation_score) as avg_validation_score,
    AVG(ii.ai_confidence) as avg_ai_confidence,
    COUNT(CASE WHEN ii.cultural_appropriateness = 'approved' THEN 1 END) as culturally_approved,
    COUNT(CASE WHEN ii.cultural_appropriateness = 'rejected' THEN 1 END) as culturally_rejected
FROM intelligence_insights ii
GROUP BY ii.community_id, ii.type;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_validation_dashboard_community ON validation_dashboard_summary(community_id);
CREATE INDEX IF NOT EXISTS idx_validation_dashboard_type ON validation_dashboard_summary(insight_type);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_validation_dashboard()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY validation_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE intelligence_insights IS 'AI-generated insights awaiting community validation';
COMMENT ON TABLE community_experts IS 'Community members qualified to validate intelligence insights';
COMMENT ON TABLE validation_requests IS 'Requests for community experts to validate insights';
COMMENT ON TABLE validation_responses IS 'Expert responses to validation requests';
COMMENT ON TABLE validation_metrics IS 'Calculated metrics from validation responses';
COMMENT ON TABLE expert_performance IS 'Performance tracking for community experts';
COMMENT ON TABLE cultural_review_queue IS 'Queue for cultural appropriateness review of insights';