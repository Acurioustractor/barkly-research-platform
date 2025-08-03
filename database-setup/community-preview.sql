-- Community Preview and Feedback System Database Schema

-- Preview Sessions Table
CREATE TABLE IF NOT EXISTS preview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    facilitator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    participant_count INTEGER NOT NULL DEFAULT 0,
    feedback_collected BOOLEAN NOT NULL DEFAULT FALSE,
    cultural_protocols JSONB NOT NULL DEFAULT '{}',
    data_subset JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preview Feedback Table
CREATE TABLE IF NOT EXISTS preview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES preview_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    participant_role VARCHAR(50) NOT NULL CHECK (participant_role IN ('community_member', 'elder', 'youth', 'leader', 'external')),
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('feature_usability', 'cultural_appropriateness', 'intelligence_accuracy', 'general')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    specific_feature VARCHAR(100),
    improvement_suggestions TEXT[] DEFAULT '{}',
    cultural_concerns TEXT[] DEFAULT '{}',
    privacy_concerns TEXT[] DEFAULT '{}',
    accessibility_issues TEXT[] DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stakeholder Feedback Table
CREATE TABLE IF NOT EXISTS stakeholder_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stakeholder_type VARCHAR(50) NOT NULL CHECK (stakeholder_type IN ('government', 'ngo', 'funder', 'researcher', 'community_leader')),
    organization VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    feedback_category VARCHAR(50) NOT NULL CHECK (feedback_category IN ('platform_utility', 'data_quality', 'policy_impact', 'technical_requirements')),
    detailed_feedback JSONB NOT NULL DEFAULT '{}',
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    implementation_timeline VARCHAR(100),
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback Analysis Table
CREATE TABLE IF NOT EXISTS feedback_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES preview_sessions(id) ON DELETE CASCADE,
    analysis JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Feedback Implementation Tracking
CREATE TABLE IF NOT EXISTS feedback_implementation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES preview_sessions(id) ON DELETE CASCADE,
    implemented_changes TEXT[] NOT NULL DEFAULT '{}',
    implementation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    implementation_notes TEXT,
    impact_assessment JSONB DEFAULT '{}'
);

-- Preview Session Participants
CREATE TABLE IF NOT EXISTS preview_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES preview_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    feedback_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, user_id)
);

-- Community Feedback Themes
CREATE TABLE IF NOT EXISTS community_feedback_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) NOT NULL,
    theme_description TEXT,
    frequency_count INTEGER NOT NULL DEFAULT 1,
    sentiment_score DECIMAL(3,2) DEFAULT 0.0,
    urgency_level VARCHAR(20) DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    first_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_features TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'deferred'))
);

-- Feedback Response Templates
CREATE TABLE IF NOT EXISTS feedback_response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    template_category VARCHAR(50) NOT NULL,
    template_content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    cultural_context VARCHAR(50),
    language_code VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_preview_sessions_community ON preview_sessions(community_id);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_status ON preview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_date ON preview_sessions(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_preview_feedback_session ON preview_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_preview_feedback_participant ON preview_feedback(participant_id);
CREATE INDEX IF NOT EXISTS idx_preview_feedback_type ON preview_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_preview_feedback_rating ON preview_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_type ON stakeholder_feedback(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_category ON stakeholder_feedback(feedback_category);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_priority ON stakeholder_feedback(priority_level);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_followup ON stakeholder_feedback(follow_up_required);

CREATE INDEX IF NOT EXISTS idx_feedback_analysis_session ON feedback_analysis(session_id);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON preview_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON preview_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_confirmed ON preview_session_participants(confirmed);

CREATE INDEX IF NOT EXISTS idx_feedback_themes_community ON community_feedback_themes(community_id);
CREATE INDEX IF NOT EXISTS idx_feedback_themes_urgency ON community_feedback_themes(urgency_level);
CREATE INDEX IF NOT EXISTS idx_feedback_themes_status ON community_feedback_themes(status);

-- Row Level Security Policies

-- Preview Sessions
ALTER TABLE preview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's preview sessions"
    ON preview_sessions FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR 
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Facilitators can manage preview sessions"
    ON preview_sessions FOR ALL
    USING (
        facilitator_id = auth.uid()
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Preview Feedback
ALTER TABLE preview_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and submit their own feedback"
    ON preview_feedback FOR ALL
    USING (participant_id = auth.uid());

CREATE POLICY "Facilitators can view session feedback"
    ON preview_feedback FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM preview_sessions WHERE facilitator_id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Stakeholder Feedback
ALTER TABLE stakeholder_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit stakeholder feedback"
    ON stakeholder_feedback FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and moderators can view all stakeholder feedback"
    ON stakeholder_feedback FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Feedback Analysis
ALTER TABLE feedback_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view analysis for their community sessions"
    ON feedback_analysis FOR SELECT
    USING (
        session_id IN (
            SELECT ps.id FROM preview_sessions ps
            JOIN users u ON u.community_id = ps.community_id
            WHERE u.id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Preview Session Participants
ALTER TABLE preview_session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own participation"
    ON preview_session_participants FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Facilitators can manage session participants"
    ON preview_session_participants FOR ALL
    USING (
        session_id IN (
            SELECT id FROM preview_sessions WHERE facilitator_id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Community Feedback Themes
ALTER TABLE community_feedback_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their community's feedback themes"
    ON community_feedback_themes FOR SELECT
    USING (
        community_id IN (
            SELECT community_id FROM users WHERE id = auth.uid()
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'moderator')
        )
    );

-- Feedback Response Templates
ALTER TABLE feedback_response_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active templates"
    ON feedback_response_templates FOR SELECT
    USING (is_active = TRUE AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage templates"
    ON feedback_response_templates FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- Functions for feedback analysis

-- Function to calculate session satisfaction score
CREATE OR REPLACE FUNCTION calculate_session_satisfaction(session_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT AVG(rating) INTO avg_rating
    FROM preview_feedback
    WHERE session_id = session_uuid;
    
    RETURN COALESCE(avg_rating, 0.0);
END;
$$ LANGUAGE plpgsql;

-- Function to get common feedback themes
CREATE OR REPLACE FUNCTION get_common_feedback_themes(session_uuid UUID)
RETURNS TABLE(theme TEXT, frequency BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(improvement_suggestions) as theme,
        COUNT(*) as frequency
    FROM preview_feedback
    WHERE session_id = session_uuid
    GROUP BY unnest(improvement_suggestions)
    ORDER BY frequency DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to update feedback themes
CREATE OR REPLACE FUNCTION update_community_feedback_themes()
RETURNS TRIGGER AS $$
DECLARE
    theme_text TEXT;
    community_uuid UUID;
BEGIN
    -- Get community ID from session
    SELECT ps.community_id INTO community_uuid
    FROM preview_sessions ps
    WHERE ps.id = NEW.session_id;
    
    -- Process improvement suggestions
    FOREACH theme_text IN ARRAY NEW.improvement_suggestions
    LOOP
        INSERT INTO community_feedback_themes (
            community_id, 
            theme_name, 
            theme_description,
            frequency_count,
            first_mentioned,
            last_mentioned
        )
        VALUES (
            community_uuid,
            theme_text,
            'Theme identified from community feedback',
            1,
            NOW(),
            NOW()
        )
        ON CONFLICT (community_id, theme_name) 
        DO UPDATE SET
            frequency_count = community_feedback_themes.frequency_count + 1,
            last_mentioned = NOW();
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update themes when feedback is submitted
CREATE TRIGGER update_themes_on_feedback
    AFTER INSERT ON preview_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_community_feedback_themes();

-- Function to generate feedback summary
CREATE OR REPLACE FUNCTION generate_feedback_summary(session_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_feedback INTEGER;
    avg_satisfaction DECIMAL(3,2);
    cultural_issues INTEGER;
    accessibility_issues INTEGER;
BEGIN
    -- Get basic metrics
    SELECT COUNT(*) INTO total_feedback
    FROM preview_feedback
    WHERE session_id = session_uuid;
    
    SELECT AVG(rating) INTO avg_satisfaction
    FROM preview_feedback
    WHERE session_id = session_uuid;
    
    SELECT COUNT(*) INTO cultural_issues
    FROM preview_feedback
    WHERE session_id = session_uuid
    AND array_length(cultural_concerns, 1) > 0;
    
    SELECT COUNT(*) INTO accessibility_issues
    FROM preview_feedback
    WHERE session_id = session_uuid
    AND array_length(accessibility_issues, 1) > 0;
    
    -- Build result JSON
    result := jsonb_build_object(
        'total_feedback', total_feedback,
        'average_satisfaction', COALESCE(avg_satisfaction, 0),
        'cultural_issues_count', cultural_issues,
        'accessibility_issues_count', accessibility_issues,
        'cultural_compliance_score', CASE 
            WHEN total_feedback > 0 THEN 100 - (cultural_issues::DECIMAL / total_feedback * 100)
            ELSE 100
        END,
        'accessibility_score', CASE 
            WHEN total_feedback > 0 THEN 100 - (accessibility_issues::DECIMAL / total_feedback * 100)
            ELSE 100
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert default response templates
INSERT INTO feedback_response_templates (template_name, template_category, template_content, variables, cultural_context) VALUES
('Thank You - General', 'acknowledgment', 'Thank you for your valuable feedback on the Community Intelligence Platform. Your input helps us improve the platform to better serve your community.', '{"participant_name": "string"}', 'general'),
('Thank You - Elder', 'acknowledgment', 'We are deeply grateful for your wisdom and guidance in reviewing the Community Intelligence Platform. Your cultural insights are invaluable in ensuring the platform respects and serves our community appropriately.', '{"elder_name": "string"}', 'indigenous'),
('Follow Up - Critical Issue', 'follow_up', 'Thank you for bringing this critical issue to our attention. We are prioritizing this concern and will provide an update within {{timeline}} days.', '{"issue_description": "string", "timeline": "number"}', 'general'),
('Cultural Concern Response', 'cultural', 'We take cultural concerns very seriously. Your feedback has been forwarded to our cultural advisory committee for immediate review. We will ensure appropriate protocols are followed.', '{"concern_details": "string"}', 'indigenous'),
('Accessibility Issue Response', 'accessibility', 'Thank you for identifying this accessibility concern. We are committed to ensuring the platform is accessible to all community members and will address this issue promptly.', '{"accessibility_issue": "string"}', 'general')
ON CONFLICT DO NOTHING;

-- Create materialized view for feedback analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS feedback_analytics_summary AS
SELECT 
    ps.community_id,
    ps.id as session_id,
    ps.title as session_title,
    ps.scheduled_date,
    COUNT(pf.id) as total_feedback,
    AVG(pf.rating) as average_rating,
    COUNT(CASE WHEN array_length(pf.cultural_concerns, 1) > 0 THEN 1 END) as cultural_concerns_count,
    COUNT(CASE WHEN array_length(pf.accessibility_issues, 1) > 0 THEN 1 END) as accessibility_issues_count,
    COUNT(CASE WHEN pf.rating <= 2 THEN 1 END) as low_satisfaction_count,
    array_agg(DISTINCT pf.feedback_type) as feedback_types,
    array_agg(DISTINCT pf.specific_feature) FILTER (WHERE pf.specific_feature IS NOT NULL) as features_mentioned
FROM preview_sessions ps
LEFT JOIN preview_feedback pf ON ps.id = pf.session_id
GROUP BY ps.community_id, ps.id, ps.title, ps.scheduled_date;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_community ON feedback_analytics_summary(community_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analytics_session ON feedback_analytics_summary(session_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_feedback_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY feedback_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE preview_sessions IS 'Community preview sessions for gathering feedback on platform features';
COMMENT ON TABLE preview_feedback IS 'Feedback collected from community members during preview sessions';
COMMENT ON TABLE stakeholder_feedback IS 'Feedback from external stakeholders including government and NGOs';
COMMENT ON TABLE feedback_analysis IS 'Analyzed feedback data with insights and recommendations';
COMMENT ON TABLE community_feedback_themes IS 'Common themes extracted from community feedback';
COMMENT ON TABLE feedback_response_templates IS 'Templates for responding to different types of feedback';