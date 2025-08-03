-- Decision Transparency System Database Schema
-- Supports government decision publication, tracking, and community communication

-- Government Decisions table
CREATE TABLE IF NOT EXISTS government_decisions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('policy', 'budget', 'program', 'service', 'infrastructure', 'emergency')),
    category TEXT NOT NULL,
    affected_communities TEXT[] DEFAULT ARRAY[]::TEXT[],
    decision_makers JSONB DEFAULT '[]'::jsonb,
    consultation_process JSONB DEFAULT '{}'::jsonb,
    cultural_impact_assessment JSONB DEFAULT '{}'::jsonb,
    resource_allocation JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'consultation', 'review', 'approved', 'implemented', 'cancelled')),
    publication_status TEXT NOT NULL DEFAULT 'pending' CHECK (publication_status IN ('pending', 'cultural_review', 'approved', 'published', 'restricted')),
    transparency_level TEXT NOT NULL DEFAULT 'public' CHECK (transparency_level IN ('public', 'community_restricted', 'confidential')),
    documents JSONB DEFAULT '[]'::jsonb,
    community_feedback JSONB DEFAULT '[]'::jsonb,
    implementation_progress JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    published_by TEXT
);

-- Policy Changes table
CREATE TABLE IF NOT EXISTS policy_changes (
    id TEXT PRIMARY KEY,
    policy_name TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('new', 'amendment', 'repeal', 'suspension')),
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    affected_communities TEXT[] DEFAULT ARRAY[]::TEXT[],
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transition_period TEXT,
    support_measures TEXT[] DEFAULT ARRAY[]::TEXT[],
    communication_plan JSONB DEFAULT '{}'::jsonb,
    impact_assessment JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'consultation', 'approved', 'implemented', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decision Notifications table
CREATE TABLE IF NOT EXISTS decision_notifications (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('community', 'stakeholder', 'public', 'media')),
    recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
    notification_type TEXT NOT NULL CHECK (notification_type IN ('announcement', 'consultation_invite', 'status_update', 'implementation_update')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    culturally_adapted BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'postal', 'in_person', 'website', 'social_media')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Public Announcements table
CREATE TABLE IF NOT EXISTS public_announcements (
    id TEXT PRIMARY KEY,
    decision_id TEXT REFERENCES government_decisions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    announcement_type TEXT NOT NULL CHECK (announcement_type IN ('decision_publication', 'policy_change', 'consultation_invite', 'implementation_update')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('public', 'communities', 'stakeholders', 'media')),
    publication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'expired', 'withdrawn')),
    views INTEGER DEFAULT 0,
    engagement_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource Allocation Log table
CREATE TABLE IF NOT EXISTS resource_allocation_log (
    id SERIAL PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    allocation_id TEXT NOT NULL,
    status_change TEXT NOT NULL,
    previous_status TEXT,
    amount DECIMAL(15,2),
    notes TEXT,
    logged_by TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decision Documents table
CREATE TABLE IF NOT EXISTS decision_documents (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('proposal', 'assessment', 'consultation_report', 'decision_record', 'implementation_plan')),
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'community', 'restricted', 'confidential')),
    cultural_sensitivity TEXT NOT NULL DEFAULT 'none' CHECK (cultural_sensitivity IN ('none', 'low', 'medium', 'high')),
    language TEXT DEFAULT 'en',
    translation_available TEXT[] DEFAULT ARRAY[]::TEXT[],
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0
);

-- Community Consultation Sessions table
CREATE TABLE IF NOT EXISTS community_consultation_sessions (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    community_id TEXT NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('community_meeting', 'focus_group', 'survey', 'elder_consultation', 'online_forum')),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    facilitator TEXT,
    participants_expected INTEGER DEFAULT 0,
    participants_actual INTEGER DEFAULT 0,
    cultural_protocols TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    outcomes JSONB DEFAULT '[]'::jsonb,
    feedback_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Decision Impact Tracking table
CREATE TABLE IF NOT EXISTS decision_impact_tracking (
    id SERIAL PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    community_id TEXT NOT NULL,
    impact_category TEXT NOT NULL CHECK (impact_category IN ('economic', 'social', 'cultural', 'environmental', 'health', 'education')),
    baseline_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    target_value DECIMAL(15,2),
    measurement_unit TEXT,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_source TEXT,
    notes TEXT,
    reported_by TEXT
);

-- Decision Feedback Responses table
CREATE TABLE IF NOT EXISTS decision_feedback_responses (
    id TEXT PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    feedback_id TEXT NOT NULL,
    response_text TEXT NOT NULL,
    response_type TEXT NOT NULL CHECK (response_type IN ('acknowledgment', 'clarification', 'action_plan', 'rejection_explanation')),
    responded_by TEXT NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'acknowledged', 'disputed'))
);

-- Decision Transparency Metrics table
CREATE TABLE IF NOT EXISTS decision_transparency_metrics (
    id SERIAL PRIMARY KEY,
    decision_id TEXT NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('publication_timeliness', 'community_engagement', 'feedback_response_rate', 'implementation_progress', 'cultural_compliance')),
    metric_value DECIMAL(10,4) NOT NULL,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    benchmark_value DECIMAL(10,4),
    performance_rating TEXT CHECK (performance_rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')),
    notes TEXT
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_government_decisions_status ON government_decisions(status);
CREATE INDEX IF NOT EXISTS idx_government_decisions_publication_status ON government_decisions(publication_status);
CREATE INDEX IF NOT EXISTS idx_government_decisions_transparency_level ON government_decisions(transparency_level);
CREATE INDEX IF NOT EXISTS idx_government_decisions_decision_type ON government_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_government_decisions_created_at ON government_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_government_decisions_published_at ON government_decisions(published_at);
CREATE INDEX IF NOT EXISTS idx_government_decisions_affected_communities ON government_decisions USING GIN(affected_communities);

CREATE INDEX IF NOT EXISTS idx_policy_changes_status ON policy_changes(status);
CREATE INDEX IF NOT EXISTS idx_policy_changes_effective_date ON policy_changes(effective_date);
CREATE INDEX IF NOT EXISTS idx_policy_changes_affected_communities ON policy_changes USING GIN(affected_communities);

CREATE INDEX IF NOT EXISTS idx_decision_notifications_decision_id ON decision_notifications(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_notifications_delivery_status ON decision_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_decision_notifications_sent_at ON decision_notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_public_announcements_status ON public_announcements(status);
CREATE INDEX IF NOT EXISTS idx_public_announcements_publication_date ON public_announcements(publication_date);
CREATE INDEX IF NOT EXISTS idx_public_announcements_target_audience ON public_announcements(target_audience);

CREATE INDEX IF NOT EXISTS idx_resource_allocation_log_decision_id ON resource_allocation_log(decision_id);
CREATE INDEX IF NOT EXISTS idx_resource_allocation_log_logged_at ON resource_allocation_log(logged_at);

CREATE INDEX IF NOT EXISTS idx_decision_documents_decision_id ON decision_documents(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_documents_access_level ON decision_documents(access_level);
CREATE INDEX IF NOT EXISTS idx_decision_documents_cultural_sensitivity ON decision_documents(cultural_sensitivity);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_decision_id ON community_consultation_sessions(decision_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_community_id ON community_consultation_sessions(community_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_scheduled_date ON community_consultation_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON community_consultation_sessions(status);

CREATE INDEX IF NOT EXISTS idx_impact_tracking_decision_id ON decision_impact_tracking(decision_id);
CREATE INDEX IF NOT EXISTS idx_impact_tracking_community_id ON decision_impact_tracking(community_id);
CREATE INDEX IF NOT EXISTS idx_impact_tracking_measurement_date ON decision_impact_tracking(measurement_date);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_decision_id ON decision_feedback_responses(decision_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_responded_at ON decision_feedback_responses(responded_at);

CREATE INDEX IF NOT EXISTS idx_transparency_metrics_decision_id ON decision_transparency_metrics(decision_id);
CREATE INDEX IF NOT EXISTS idx_transparency_metrics_measurement_date ON decision_transparency_metrics(measurement_date);

-- Insert sample data for testing
INSERT INTO government_decisions (
    id,
    title,
    description,
    decision_type,
    category,
    affected_communities,
    decision_makers,
    consultation_process,
    cultural_impact_assessment,
    resource_allocation,
    timeline,
    status,
    publication_status,
    transparency_level,
    created_by
) VALUES
    ('decision-001', 'Community Health Center Expansion', 
     'Proposal to expand the community health center to serve additional 500 residents',
     'infrastructure', 'Healthcare',
     ARRAY['community-1', 'community-2'],
     '[{"id": "dm-001", "name": "Dr. Sarah Johnson", "role": "Health Director", "organization": "Regional Health Authority"}]'::jsonb,
     '{"id": "consultation-001", "type": "community_meeting", "description": "Community consultation scheduled", "participants": 0, "duration": "2 hours", "culturalProtocols": ["Elder consultation", "Traditional meeting format"], "outcomes": [], "feedback": [], "conductedAt": "2024-01-15T10:00:00Z", "facilitator": "Community Liaison"}'::jsonb,
     '{"id": "assessment-001", "assessor": "Cultural Advisor", "assessmentDate": "2024-01-10T00:00:00Z", "culturalSensitivity": "medium", "traditionalKnowledgeImpact": "Minimal impact on traditional healing practices", "communityValuesAlignment": 0.8, "elderReviewRequired": true, "elderReviewStatus": "pending", "mitigationMeasures": ["Incorporate traditional healing space"], "recommendations": ["Consult with traditional healers"], "approvalStatus": "pending"}'::jsonb,
     '[{"id": "allocation-001", "category": "Construction", "description": "Building expansion costs", "amount": 250000, "currency": "CAD", "source": "Provincial Health Fund", "recipient": "Regional Health Authority", "timeline": "12 months", "conditions": ["Community approval", "Environmental assessment"], "reportingRequirements": ["Monthly progress reports"], "culturalConsiderations": ["Traditional ceremony for groundbreaking"], "status": "allocated"}]'::jsonb,
     '{"phases": [{"id": "phase-001", "name": "Planning", "description": "Initial planning and design", "startDate": "2024-01-01T00:00:00Z", "endDate": "2024-03-31T00:00:00Z", "status": "active", "deliverables": ["Architectural plans", "Community consultation report"], "stakeholders": ["Health Authority", "Community Leaders"]}], "milestones": [{"id": "milestone-001", "title": "Community Approval", "description": "Obtain community consent for expansion", "targetDate": "2024-02-15T00:00:00Z", "status": "pending", "significance": "high"}], "criticalDates": [{"id": "date-001", "event": "Funding deadline", "date": "2024-06-30T00:00:00Z", "importance": "Must secure funding by this date", "culturalSignificance": ""}]}'::jsonb,
     'consultation', 'cultural_review', 'public', 'system'),
    
    ('decision-002', 'Traditional Language Education Program',
     'Implementation of traditional language immersion program in local schools',
     'program', 'Education',
     ARRAY['community-1'],
     '[{"id": "dm-002", "name": "Elder Mary Whitehorse", "role": "Education Elder", "organization": "Community Council"}, {"id": "dm-003", "name": "James Thompson", "role": "Education Director", "organization": "School District"}]'::jsonb,
     '{"id": "consultation-002", "type": "elder_consultation", "description": "Elder council consultation on language program", "participants": 12, "duration": "3 hours", "culturalProtocols": ["Traditional opening ceremony", "Elder speaking order"], "outcomes": ["Strong support for program", "Identified qualified teachers"], "feedback": ["Need for cultural materials", "Importance of traditional stories"], "conductedAt": "2024-01-20T14:00:00Z", "facilitator": "Elder Mary Whitehorse"}'::jsonb,
     '{"id": "assessment-002", "assessor": "Cultural Education Specialist", "assessmentDate": "2024-01-18T00:00:00Z", "culturalSensitivity": "high", "traditionalKnowledgeImpact": "Positive impact on language preservation", "communityValuesAlignment": 0.95, "elderReviewRequired": true, "elderReviewStatus": "approved", "elderComments": "This program honors our ancestors and secures our future", "mitigationMeasures": [], "recommendations": ["Include traditional storytelling", "Involve community elders as teachers"], "approvalStatus": "approved"}'::jsonb,
     '[{"id": "allocation-002", "category": "Program Funding", "description": "Annual program operating costs", "amount": 75000, "currency": "CAD", "source": "Indigenous Education Fund", "recipient": "School District", "timeline": "Annual", "conditions": ["Elder involvement", "Community oversight"], "reportingRequirements": ["Quarterly progress reports", "Annual cultural impact assessment"], "culturalConsiderations": ["Payment to elder teachers", "Traditional materials budget"], "status": "disbursed"}]'::jsonb,
     '{"phases": [{"id": "phase-002", "name": "Program Development", "description": "Curriculum development and teacher training", "startDate": "2024-02-01T00:00:00Z", "endDate": "2024-08-31T00:00:00Z", "status": "active", "deliverables": ["Curriculum materials", "Teacher training program"], "stakeholders": ["Elders", "Teachers", "Community"]}], "milestones": [{"id": "milestone-002", "title": "First Class Launch", "description": "Launch first traditional language class", "targetDate": "2024-09-01T00:00:00Z", "status": "pending", "significance": "critical"}], "criticalDates": [{"id": "date-002", "event": "School year start", "date": "2024-09-01T00:00:00Z", "importance": "Program must be ready for new school year", "culturalSignificance": "Traditional new year ceremony"}]}'::jsonb,
     'approved', 'published', 'public', 'system')
ON CONFLICT (id) DO NOTHING;

-- Insert sample policy changes
INSERT INTO policy_changes (
    id,
    policy_name,
    change_type,
    description,
    rationale,
    affected_communities,
    effective_date,
    transition_period,
    support_measures,
    communication_plan,
    impact_assessment,
    status
) VALUES
    ('policy-001', 'Community Consultation Requirements',
     'amendment', 'Updated requirements for community consultation on government decisions',
     'Strengthen community voice in decision-making processes',
     ARRAY['community-1', 'community-2', 'community-3'],
     '2024-04-01T00:00:00Z', '90 days',
     ARRAY['Training for government staff', 'Community liaison support', 'Translation services'],
     '{"channels": [{"type": "community_meeting", "description": "Town halls in each community", "reach": 500, "culturalAppropriate": true, "language": ["en", "indigenous"], "frequency": "monthly"}], "timeline": [{"phase": "Announcement", "date": "2024-02-01T00:00:00Z", "activities": ["Press release", "Community notifications"], "responsible": "Communications Team", "status": "completed"}], "targetAudiences": ["Community leaders", "General public", "Government staff"], "keyMessages": ["Enhanced community participation", "Respect for traditional governance"], "culturalAdaptations": ["Elder consultation protocols", "Traditional meeting formats"], "feedbackMechanisms": ["Community surveys", "Open forums", "Elder councils"]}'::jsonb,
     '{"economicImpact": "Minimal cost increase for consultation processes", "socialImpact": "Improved community engagement and trust", "culturalImpact": "Better integration of traditional governance", "environmentalImpact": "No significant environmental impact", "riskAssessment": ["Potential delays in decision-making", "Resource requirements for consultation"], "mitigationStrategies": ["Streamlined consultation processes", "Dedicated consultation budget"], "monitoringPlan": ["Quarterly consultation reports", "Community satisfaction surveys"], "successMetrics": ["Number of consultations held", "Community participation rates", "Satisfaction scores"]}'::jsonb,
     'approved')
ON CONFLICT (id) DO NOTHING;

-- Insert sample public announcements
INSERT INTO public_announcements (
    id,
    decision_id,
    title,
    summary,
    announcement_type,
    target_audience,
    publication_date,
    status
) VALUES
    ('announcement-001', 'decision-002',
     'New Traditional Language Education Program Approved',
     'The community-requested traditional language immersion program has been approved and will begin in September 2024. This program will help preserve our traditional language for future generations.',
     'decision_publication', 'public',
     '2024-01-25T09:00:00Z', 'published'),
    
    ('announcement-002', NULL,
     'Updated Community Consultation Policy Now in Effect',
     'New requirements for community consultation on government decisions are now in effect, ensuring stronger community voice in decision-making.',
     'policy_change', 'communities',
     '2024-04-01T08:00:00Z', 'published')
ON CONFLICT (id) DO NOTHING;

-- Insert sample consultation sessions
INSERT INTO community_consultation_sessions (
    id,
    decision_id,
    community_id,
    session_type,
    title,
    description,
    scheduled_date,
    duration_minutes,
    location,
    facilitator,
    participants_expected,
    participants_actual,
    cultural_protocols,
    status,
    outcomes,
    feedback_summary
) VALUES
    ('session-001', 'decision-001', 'community-1',
     'community_meeting', 'Health Center Expansion Consultation',
     'Community meeting to discuss the proposed health center expansion',
     '2024-02-10T19:00:00Z', 120, 'Community Center',
     'Sarah Johnson', 50, 45,
     ARRAY['Opening prayer', 'Elder speaking first', 'Traditional closing'],
     'completed',
     '["Strong community support", "Concerns about parking", "Request for traditional healing space"]'::jsonb,
     'Overall positive response with specific requests for cultural integration'),
    
    ('session-002', 'decision-002', 'community-1',
     'elder_consultation', 'Language Program Elder Review',
     'Elder council consultation on traditional language education program',
     '2024-01-20T14:00:00Z', 180, 'Elder Center',
     'Mary Whitehorse', 12, 12,
     ARRAY['Traditional opening ceremony', 'Smudging', 'Elder speaking order'],
     'completed',
     '["Unanimous approval", "Identified qualified elder teachers", "Emphasized importance of traditional stories"]'::jsonb,
     'Elders strongly support the program and are committed to participating as teachers')
ON CONFLICT (id) DO NOTHING;

-- Create functions for decision transparency management

-- Function to update decision status with automatic notifications
CREATE OR REPLACE FUNCTION update_decision_status(
    p_decision_id TEXT,
    p_new_status TEXT,
    p_updated_by TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    decision_record RECORD;
    notification_id TEXT;
BEGIN
    -- Get current decision
    SELECT * INTO decision_record FROM government_decisions WHERE id = p_decision_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Decision not found: %', p_decision_id;
    END IF;
    
    -- Update decision status
    UPDATE government_decisions 
    SET status = p_new_status, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_decision_id;
    
    -- Create notifications for affected communities
    FOR community_id IN SELECT UNNEST(decision_record.affected_communities)
    LOOP
        notification_id := 'notification-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) || '-' || 
                          SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
        
        INSERT INTO decision_notifications (
            id, decision_id, recipient_type, recipients, notification_type,
            title, message, culturally_adapted, language, delivery_method,
            sent_at, delivery_status
        ) VALUES (
            notification_id, p_decision_id, 'community', ARRAY[community_id], 'status_update',
            'Decision Status Update: ' || decision_record.title,
            'The status of decision "' || decision_record.title || '" has been updated to ' || p_new_status,
            true, 'en', 'email',
            CURRENT_TIMESTAMP, 'pending'
        );
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate transparency metrics
CREATE OR REPLACE FUNCTION calculate_transparency_metrics(
    p_decision_id TEXT
) RETURNS TABLE (
    metric_type TEXT,
    metric_value DECIMAL,
    performance_rating TEXT
) AS $$
DECLARE
    decision_record RECORD;
    consultation_count INTEGER;
    feedback_count INTEGER;
    response_rate DECIMAL;
    publication_delay INTEGER;
BEGIN
    -- Get decision details
    SELECT * INTO decision_record FROM government_decisions WHERE id = p_decision_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Decision not found: %', p_decision_id;
    END IF;
    
    -- Calculate consultation engagement
    SELECT COUNT(*) INTO consultation_count 
    FROM community_consultation_sessions 
    WHERE decision_id = p_decision_id AND status = 'completed';
    
    -- Calculate feedback metrics
    SELECT COUNT(*) INTO feedback_count 
    FROM government_decisions 
    WHERE id = p_decision_id AND jsonb_array_length(community_feedback) > 0;
    
    -- Publication timeliness (days from creation to publication)
    IF decision_record.published_at IS NOT NULL THEN
        publication_delay := EXTRACT(DAY FROM (decision_record.published_at - decision_record.created_at));
        
        RETURN QUERY SELECT 
            'publication_timeliness'::TEXT,
            publication_delay::DECIMAL,
            CASE 
                WHEN publication_delay <= 30 THEN 'excellent'
                WHEN publication_delay <= 60 THEN 'good'
                WHEN publication_delay <= 90 THEN 'satisfactory'
                ELSE 'needs_improvement'
            END::TEXT;
    END IF;
    
    -- Community engagement
    RETURN QUERY SELECT 
        'community_engagement'::TEXT,
        consultation_count::DECIMAL,
        CASE 
            WHEN consultation_count >= 3 THEN 'excellent'
            WHEN consultation_count >= 2 THEN 'good'
            WHEN consultation_count >= 1 THEN 'satisfactory'
            ELSE 'needs_improvement'
        END::TEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get decision transparency dashboard data
CREATE OR REPLACE FUNCTION get_transparency_dashboard(
    p_community_id TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 90
) RETURNS TABLE (
    total_decisions INTEGER,
    published_decisions INTEGER,
    pending_review INTEGER,
    avg_publication_days DECIMAL,
    community_consultations INTEGER,
    feedback_items INTEGER,
    transparency_score DECIMAL
) AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    start_date := CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_decisions,
        COUNT(CASE WHEN publication_status = 'published' THEN 1 END)::INTEGER as published_decisions,
        COUNT(CASE WHEN publication_status IN ('pending', 'cultural_review') THEN 1 END)::INTEGER as pending_review,
        AVG(EXTRACT(DAY FROM (COALESCE(published_at, CURRENT_TIMESTAMP) - created_at)))::DECIMAL as avg_publication_days,
        (SELECT COUNT(*)::INTEGER FROM community_consultation_sessions 
         WHERE decision_id IN (SELECT id FROM government_decisions WHERE created_at >= start_date)
         AND (p_community_id IS NULL OR community_id = p_community_id)) as community_consultations,
        SUM(jsonb_array_length(COALESCE(community_feedback, '[]'::jsonb)))::INTEGER as feedback_items,
        -- Simple transparency score calculation
        (COUNT(CASE WHEN publication_status = 'published' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(*)::DECIMAL, 0) * 100)::DECIMAL as transparency_score
    FROM government_decisions
    WHERE created_at >= start_date
    AND (p_community_id IS NULL OR affected_communities @> ARRAY[p_community_id]);
END;
$$ LANGUAGE plpgsql;

-- Create view for public decision transparency
CREATE OR REPLACE VIEW public_decision_transparency AS
SELECT 
    gd.id,
    gd.title,
    gd.description,
    gd.decision_type,
    gd.category,
    gd.affected_communities,
    gd.status,
    gd.publication_status,
    gd.created_at,
    gd.published_at,
    gd.updated_at,
    COALESCE(jsonb_array_length(gd.community_feedback), 0) as feedback_count,
    COALESCE(consultation_stats.session_count, 0) as consultation_sessions,
    COALESCE(consultation_stats.total_participants, 0) as total_participants,
    CASE 
        WHEN gd.published_at IS NOT NULL THEN 
            EXTRACT(DAY FROM (gd.published_at - gd.created_at))
        ELSE NULL 
    END as days_to_publication,
    CASE 
        WHEN gd.status = 'implemented' THEN 'Completed'
        WHEN gd.status = 'approved' AND gd.publication_status = 'published' THEN 'Published'
        WHEN gd.status IN ('consultation', 'review') THEN 'In Progress'
        ELSE 'Draft'
    END as public_status
FROM government_decisions gd
LEFT JOIN (
    SELECT 
        decision_id,
        COUNT(*) as session_count,
        SUM(participants_actual) as total_participants
    FROM community_consultation_sessions
    WHERE status = 'completed'
    GROUP BY decision_id
) consultation_stats ON gd.id = consultation_stats.decision_id
WHERE gd.transparency_level = 'public'
ORDER BY gd.created_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON government_decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_changes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public_announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON resource_allocation_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_consultation_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_impact_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_feedback_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_transparency_metrics TO authenticated;

GRANT SELECT ON public_decision_transparency TO authenticated;
GRANT EXECUTE ON FUNCTION update_decision_status TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_transparency_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_transparency_dashboard TO authenticated;

-- Enable Row Level Security
ALTER TABLE government_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_consultation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - should be customized based on actual auth requirements)
CREATE POLICY "Public decisions are viewable by all" ON government_decisions
    FOR SELECT USING (transparency_level = 'public' AND publication_status = 'published');

CREATE POLICY "Community decisions are viewable by community members" ON government_decisions
    FOR SELECT USING (transparency_level IN ('public', 'community_restricted'));

CREATE POLICY "Users can create decisions" ON government_decisions
    FOR INSERT WITH CHECK (true); -- Adjust based on actual auth logic

CREATE POLICY "Decision makers can update their decisions" ON government_decisions
    FOR UPDATE USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Public announcements are viewable by all" ON public_announcements
    FOR SELECT USING (status = 'published');

CREATE POLICY "Community consultation sessions are viewable by community members" ON community_consultation_sessions
    FOR SELECT USING (true); -- Adjust based on actual auth logic