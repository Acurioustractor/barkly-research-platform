-- Two-Way Communication System Database Schema
-- Supports community feedback routing, meeting summaries, and consultation tracking

-- Communication Channels table
CREATE TABLE IF NOT EXISTS communication_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feedback_portal', 'meeting_summary', 'consultation', 'working_group', 'community_forum', 'direct_message')),
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    moderators TEXT[] DEFAULT ARRAY[]::TEXT[],
    participants TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_protocols TEXT[] DEFAULT ARRAY[]::TEXT[],
    access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'community', 'restricted', 'private')),
    languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Feedback table
CREATE TABLE IF NOT EXISTS community_feedback (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
    submitted_by TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    submitter_role TEXT NOT NULL CHECK (submitter_role IN ('community_member', 'elder', 'leader', 'organization', 'government')),
    community_id TEXT NOT NULL,
    community_name TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('suggestion', 'concern', 'complaint', 'question', 'compliment', 'request')),
    category TEXT NOT NULL CHECK (category IN ('healthcare', 'education', 'housing', 'employment', 'culture', 'environment', 'governance', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    cultural_context TEXT,
    traditional_knowledge_involved BOOLEAN DEFAULT false,
    elder_consultation_required BOOLEAN DEFAULT false,
    routing_info JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'routed', 'assigned', 'in_progress', 'responded', 'resolved', 'escalated')),
    responses JSONB DEFAULT '[]'::jsonb,
    follow_up_actions JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Working Groups table
CREATE TABLE IF NOT EXISTS working_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    mandate TEXT NOT NULL,
    members JSONB DEFAULT '[]'::jsonb,
    chair TEXT,
    secretary TEXT,
    meeting_schedule TEXT,
    responsibility_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_advisors TEXT[] DEFAULT ARRAY[]::TEXT[],
    contact_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Summaries table
CREATE TABLE IF NOT EXISTS meeting_summaries (
    id TEXT PRIMARY KEY,
    working_group_id TEXT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
    working_group_name TEXT NOT NULL,
    meeting_type TEXT NOT NULL CHECK (meeting_type IN ('regular', 'special', 'emergency', 'consultation', 'public')),
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    location TEXT NOT NULL,
    facilitator TEXT NOT NULL,
    attendees JSONB DEFAULT '[]'::jsonb,
    agenda JSONB DEFAULT '[]'::jsonb,
    discussions JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    next_meeting TIMESTAMP WITH TIME ZONE,
    cultural_protocols TEXT[] DEFAULT ARRAY[]::TEXT[],
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'review', 'approved', 'published', 'restricted')),
    access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'community', 'members_only', 'confidential')),
    summary TEXT NOT NULL,
    key_outcomes TEXT[] DEFAULT ARRAY[]::TEXT[],
    community_impact TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Consultation Sessions table
CREATE TABLE IF NOT EXISTS consultation_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('public_consultation', 'community_meeting', 'focus_group', 'survey', 'workshop', 'elder_circle')),
    topic TEXT NOT NULL,
    organizer TEXT NOT NULL,
    facilitators TEXT[] DEFAULT ARRAY[]::TEXT[],
    target_audience TEXT[] DEFAULT ARRAY[]::TEXT[],
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    location TEXT NOT NULL,
    max_participants INTEGER,
    registration_required BOOLEAN DEFAULT false,
    cultural_protocols TEXT[] DEFAULT ARRAY[]::TEXT[],
    materials JSONB DEFAULT '[]'::jsonb,
    participants JSONB DEFAULT '[]'::jsonb,
    outcomes JSONB DEFAULT '[]'::jsonb,
    feedback JSONB DEFAULT '[]'::jsonb,
    follow_up_plan TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'open_registration', 'in_progress', 'completed', 'cancelled', 'postponed')),
    publication_level TEXT NOT NULL DEFAULT 'public' CHECK (publication_level IN ('public', 'community', 'restricted')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Routing Rules table
CREATE TABLE IF NOT EXISTS feedback_routing_rules (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    working_group_id TEXT NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
    priority_override TEXT CHECK (priority_override IN ('low', 'medium', 'high', 'urgent')),
    cultural_review_required BOOLEAN DEFAULT false,
    elder_consultation_required BOOLEAN DEFAULT false,
    estimated_response_hours INTEGER DEFAULT 168, -- 1 week default
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communication Metrics table
CREATE TABLE IF NOT EXISTS communication_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_feedback INTEGER DEFAULT 0,
    feedback_by_category JSONB DEFAULT '{}'::jsonb,
    feedback_by_priority JSONB DEFAULT '{}'::jsonb,
    response_rate DECIMAL(5,2) DEFAULT 0,
    average_response_time DECIMAL(10,2) DEFAULT 0, -- in hours
    satisfaction_scores JSONB DEFAULT '{}'::jsonb,
    channel_usage JSONB DEFAULT '{}'::jsonb,
    working_group_performance JSONB DEFAULT '{}'::jsonb,
    consultation_metrics JSONB DEFAULT '{}'::jsonb,
    cultural_compliance_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Notifications table
CREATE TABLE IF NOT EXISTS feedback_notifications (
    id SERIAL PRIMARY KEY,
    feedback_id TEXT NOT NULL REFERENCES community_feedback(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('acknowledgment', 'routing', 'response', 'escalation', 'resolution')),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('submitter', 'working_group', 'moderator', 'elder')),
    recipient_id TEXT NOT NULL,
    message TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'in_app', 'phone', 'in_person')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
);

-- Meeting Action Items Tracking table
CREATE TABLE IF NOT EXISTS meeting_action_items (
    id TEXT PRIMARY KEY,
    meeting_summary_id TEXT NOT NULL REFERENCES meeting_summaries(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    assigned_to_name TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
    resources TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_protocols TEXT[] DEFAULT ARRAY[]::TEXT[],
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consultation Registration table
CREATE TABLE IF NOT EXISTS consultation_registrations (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_role TEXT NOT NULL,
    organization TEXT,
    community_affiliation TEXT NOT NULL,
    cultural_role TEXT,
    contact_info JSONB DEFAULT '{}'::jsonb,
    contribution_level TEXT NOT NULL DEFAULT 'participant' CHECK (contribution_level IN ('observer', 'participant', 'presenter', 'facilitator')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT false,
    attendance_confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Cultural Review Queue table
CREATE TABLE IF NOT EXISTS cultural_review_queue (
    id SERIAL PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('feedback', 'meeting_summary', 'consultation', 'response')),
    content_id TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    review_priority TEXT NOT NULL DEFAULT 'medium' CHECK (review_priority IN ('low', 'medium', 'high', 'urgent')),
    cultural_sensitivity TEXT NOT NULL DEFAULT 'medium' CHECK (cultural_sensitivity IN ('low', 'medium', 'high', 'critical')),
    traditional_knowledge_involved BOOLEAN DEFAULT false,
    elder_review_required BOOLEAN DEFAULT false,
    assigned_reviewer TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'approved', 'requires_changes', 'rejected')),
    review_notes TEXT,
    cultural_recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_communication_channels_type ON communication_channels(type);
CREATE INDEX IF NOT EXISTS idx_communication_channels_access_level ON communication_channels(access_level);
CREATE INDEX IF NOT EXISTS idx_communication_channels_is_active ON communication_channels(is_active);

CREATE INDEX IF NOT EXISTS idx_community_feedback_channel_id ON community_feedback(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_community_id ON community_feedback(community_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_category ON community_feedback(category);
CREATE INDEX IF NOT EXISTS idx_community_feedback_priority ON community_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_community_feedback_status ON community_feedback(status);
CREATE INDEX IF NOT EXISTS idx_community_feedback_submitted_at ON community_feedback(submitted_at);
CREATE INDEX IF NOT EXISTS idx_community_feedback_routing_info ON community_feedback USING GIN(routing_info);

CREATE INDEX IF NOT EXISTS idx_working_groups_is_active ON working_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_working_groups_responsibility_areas ON working_groups USING GIN(responsibility_areas);

CREATE INDEX IF NOT EXISTS idx_meeting_summaries_working_group_id ON meeting_summaries(working_group_id);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_date ON meeting_summaries(date);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_publication_status ON meeting_summaries(publication_status);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_access_level ON meeting_summaries(access_level);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_scheduled_date ON consultation_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON consultation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_type ON consultation_sessions(type);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_publication_level ON consultation_sessions(publication_level);

CREATE INDEX IF NOT EXISTS idx_feedback_routing_rules_category ON feedback_routing_rules(category);
CREATE INDEX IF NOT EXISTS idx_feedback_routing_rules_working_group_id ON feedback_routing_rules(working_group_id);
CREATE INDEX IF NOT EXISTS idx_feedback_routing_rules_is_active ON feedback_routing_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_communication_metrics_metric_date ON communication_metrics(metric_date);

CREATE INDEX IF NOT EXISTS idx_feedback_notifications_feedback_id ON feedback_notifications(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_status ON feedback_notifications(status);
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_sent_at ON feedback_notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_summary_id ON meeting_action_items(meeting_summary_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_assigned_to ON meeting_action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_due_date ON meeting_action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_status ON meeting_action_items(status);

CREATE INDEX IF NOT EXISTS idx_consultation_registrations_consultation_id ON consultation_registrations(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_registrations_registered_at ON consultation_registrations(registered_at);

CREATE INDEX IF NOT EXISTS idx_cultural_review_queue_content_type ON cultural_review_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_cultural_review_queue_review_status ON cultural_review_queue(review_status);
CREATE INDEX IF NOT EXISTS idx_cultural_review_queue_submitted_at ON cultural_review_queue(submitted_at);

-- Insert sample data for testing

-- Insert sample communication channels
INSERT INTO communication_channels (
    id, name, type, description, moderators, access_level, languages
) VALUES
    ('channel-feedback-portal', 'Community Feedback Portal', 'feedback_portal', 
     'Main portal for community members to submit feedback and suggestions',
     ARRAY['moderator-1', 'moderator-2'], 'public', ARRAY['en', 'indigenous']),
    ('channel-meeting-summaries', 'Meeting Summaries', 'meeting_summary',
     'Publication channel for working group meeting summaries',
     ARRAY['secretary-1'], 'public', ARRAY['en', 'indigenous']),
    ('channel-consultations', 'Public Consultations', 'consultation',
     'Channel for organizing and managing public consultation sessions',
     ARRAY['consultation-coordinator'], 'public', ARRAY['en', 'indigenous'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample working groups
INSERT INTO working_groups (
    id, name, description, mandate, chair, secretary, meeting_schedule, 
    responsibility_areas, cultural_advisors, is_active
) VALUES
    ('health-working-group', 'Health Working Group', 
     'Responsible for community health initiatives and healthcare service coordination',
     'To improve health outcomes and ensure culturally appropriate healthcare services',
     'Dr. Sarah Johnson', 'Nurse Mary Wilson', 'Second Tuesday of each month',
     ARRAY['healthcare', 'mental_health', 'traditional_healing'], 
     ARRAY['Elder Tom Bearcloud'], true),
    ('education-working-group', 'Education Working Group',
     'Oversees educational programs and cultural knowledge preservation',
     'To ensure quality education while preserving traditional knowledge and language',
     'Principal James Thompson', 'Teacher Lisa Whitehorse', 'First Thursday of each month',
     ARRAY['education', 'language_preservation', 'youth_programs'],
     ARRAY['Elder Mary Whitehorse'], true),
    ('housing-working-group', 'Housing Working Group',
     'Addresses housing needs and infrastructure development',
     'To ensure adequate, culturally appropriate housing for all community members',
     'Housing Manager Robert Eagle', 'Assistant Manager Susan Crow', 'Third Monday of each month',
     ARRAY['housing', 'infrastructure', 'utilities'],
     ARRAY['Elder Joseph Strongbear'], true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample feedback routing rules
INSERT INTO feedback_routing_rules (
    category, working_group_id, cultural_review_required, estimated_response_hours
) VALUES
    ('healthcare', 'health-working-group', true, 72),
    ('education', 'education-working-group', true, 72),
    ('housing', 'housing-working-group', false, 168),
    ('culture', 'education-working-group', true, 48),
    ('environment', 'health-working-group', false, 168),
    ('governance', 'health-working-group', true, 48)
ON CONFLICT DO NOTHING;

-- Insert sample community feedback
INSERT INTO community_feedback (
    id, channel_id, submitted_by, submitter_name, submitter_role, community_id, community_name,
    feedback_type, category, priority, subject, content, cultural_context, traditional_knowledge_involved,
    routing_info, status
) VALUES
    ('feedback-001', 'channel-feedback-portal', 'user-001', 'Maria Thunderheart', 'community_member',
     'community-1', 'Bearcloud First Nation', 'concern', 'healthcare', 'high',
     'Need for Traditional Healing Integration', 
     'Our community clinic should better integrate traditional healing practices with modern medicine. Many elders prefer traditional methods but feel they are not respected in the current system.',
     'Traditional healing has been practiced in our community for generations and is an important part of our cultural identity.',
     true,
     '{"routedTo": "health-working-group", "routedToName": "Health Working Group", "routingReason": "Healthcare category", "routedBy": "system", "routedAt": "2024-01-15T10:00:00Z", "estimatedResponseTime": 72}'::jsonb,
     'routed'),
    ('feedback-002', 'channel-feedback-portal', 'user-002', 'David Youngbear', 'community_member',
     'community-1', 'Bearcloud First Nation', 'suggestion', 'education', 'medium',
     'Language Immersion Program Expansion',
     'The current language program is great, but we need more hours and more teachers. My children are very interested in learning our traditional language.',
     'Language preservation is crucial for maintaining our cultural identity.',
     false,
     '{"routedTo": "education-working-group", "routedToName": "Education Working Group", "routingReason": "Education category", "routedBy": "system", "routedAt": "2024-01-16T14:30:00Z", "estimatedResponseTime": 72}'::jsonb,
     'in_progress')
ON CONFLICT (id) DO NOTHING;

-- Insert sample meeting summaries
INSERT INTO meeting_summaries (
    id, working_group_id, working_group_name, meeting_type, title, date, duration, location,
    facilitator, summary, key_outcomes, community_impact, publication_status, access_level, created_by
) VALUES
    ('meeting-001', 'health-working-group', 'Health Working Group', 'regular',
     'January 2024 Health Working Group Meeting', '2024-01-10T19:00:00Z', 120, 'Community Center',
     'Dr. Sarah Johnson',
     'The working group discussed integration of traditional healing practices, reviewed community health statistics, and planned upcoming health initiatives.',
     ARRAY['Approved traditional healer certification program', 'Allocated budget for mental health services', 'Scheduled community health fair'],
     'These decisions will improve access to culturally appropriate healthcare and strengthen the connection between traditional and modern healing practices.',
     'published', 'public', 'secretary-health'),
    ('meeting-002', 'education-working-group', 'Education Working Group', 'regular',
     'January 2024 Education Working Group Meeting', '2024-01-04T18:30:00Z', 90, 'School Library',
     'Principal James Thompson',
     'Discussion focused on expanding the traditional language program, reviewing student performance, and planning cultural education activities.',
     ARRAY['Approved hiring of additional language teacher', 'Planned traditional knowledge workshop series', 'Established partnership with elders council'],
     'These initiatives will strengthen cultural education and improve language preservation efforts for future generations.',
     'published', 'public', 'secretary-education')
ON CONFLICT (id) DO NOTHING;

-- Insert sample consultation sessions
INSERT INTO consultation_sessions (
    id, title, description, type, topic, organizer, scheduled_date, duration, location,
    registration_required, cultural_protocols, status, publication_level, created_by
) VALUES
    ('consultation-001', 'Community Health Services Planning', 
     'Public consultation to gather input on future health services and traditional healing integration',
     'public_consultation', 'Healthcare Planning', 'Health Working Group',
     '2024-02-15T19:00:00Z', 180, 'Community Center Main Hall',
     true, ARRAY['Opening prayer', 'Elder speaking protocol', 'Traditional closing'],
     'open_registration', 'public', 'health-coordinator'),
    ('consultation-002', 'Youth Education Priorities',
     'Focus group session with parents and youth to discuss educational priorities and cultural programming',
     'focus_group', 'Education Planning', 'Education Working Group',
     '2024-02-20T18:00:00Z', 120, 'School Gymnasium',
     true, ARRAY['Youth voice priority', 'Parent consultation', 'Elder wisdom sharing'],
     'planned', 'community', 'education-coordinator')
ON CONFLICT (id) DO NOTHING;

-- Create functions for communication management

-- Function to route feedback automatically
CREATE OR REPLACE FUNCTION route_feedback_automatically()
RETURNS TRIGGER AS $$
DECLARE
    routing_rule RECORD;
    working_group_name TEXT;
BEGIN
    -- Find routing rule for the feedback category
    SELECT * INTO routing_rule 
    FROM feedback_routing_rules 
    WHERE category = NEW.category AND is_active = true
    LIMIT 1;
    
    IF FOUND THEN
        -- Get working group name
        SELECT name INTO working_group_name 
        FROM working_groups 
        WHERE id = routing_rule.working_group_id;
        
        -- Update routing info
        NEW.routing_info = jsonb_build_object(
            'routedTo', routing_rule.working_group_id,
            'routedToName', COALESCE(working_group_name, 'Unknown Working Group'),
            'routingReason', 'Automatic routing based on category: ' || NEW.category,
            'routedBy', 'system',
            'routedAt', CURRENT_TIMESTAMP,
            'estimatedResponseTime', routing_rule.estimated_response_hours
        );
        
        NEW.status = 'routed';
        
        -- Add to cultural review queue if required
        IF routing_rule.cultural_review_required OR NEW.traditional_knowledge_involved THEN
            INSERT INTO cultural_review_queue (
                content_type, content_id, submitted_by, cultural_sensitivity,
                traditional_knowledge_involved, elder_review_required
            ) VALUES (
                'feedback', NEW.id, NEW.submitted_by, 'medium',
                NEW.traditional_knowledge_involved, routing_rule.elder_consultation_required
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic feedback routing
DROP TRIGGER IF EXISTS trigger_route_feedback ON community_feedback;
CREATE TRIGGER trigger_route_feedback
    BEFORE INSERT ON community_feedback
    FOR EACH ROW EXECUTE FUNCTION route_feedback_automatically();

-- Function to update communication metrics
CREATE OR REPLACE FUNCTION update_communication_metrics()
RETURNS VOID AS $$
DECLARE
    metric_date DATE := CURRENT_DATE;
    total_feedback_count INTEGER;
    feedback_by_category JSONB;
    feedback_by_priority JSONB;
    response_rate_calc DECIMAL;
    avg_response_time DECIMAL;
BEGIN
    -- Calculate total feedback for today
    SELECT COUNT(*) INTO total_feedback_count
    FROM community_feedback
    WHERE DATE(submitted_at) = metric_date;
    
    -- Calculate feedback by category
    SELECT jsonb_object_agg(category, count) INTO feedback_by_category
    FROM (
        SELECT category, COUNT(*) as count
        FROM community_feedback
        WHERE DATE(submitted_at) = metric_date
        GROUP BY category
    ) category_counts;
    
    -- Calculate feedback by priority
    SELECT jsonb_object_agg(priority, count) INTO feedback_by_priority
    FROM (
        SELECT priority, COUNT(*) as count
        FROM community_feedback
        WHERE DATE(submitted_at) = metric_date
        GROUP BY priority
    ) priority_counts;
    
    -- Calculate response rate
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN status IN ('responded', 'resolved') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0 
        END INTO response_rate_calc
    FROM community_feedback
    WHERE DATE(submitted_at) = metric_date;
    
    -- Calculate average response time (in hours)
    SELECT AVG(
        EXTRACT(EPOCH FROM (
            (responses->0->>'respondedAt')::TIMESTAMP - submitted_at
        )) / 3600
    ) INTO avg_response_time
    FROM community_feedback
    WHERE DATE(submitted_at) = metric_date
    AND jsonb_array_length(responses) > 0;
    
    -- Insert or update metrics
    INSERT INTO communication_metrics (
        metric_date, total_feedback, feedback_by_category, feedback_by_priority,
        response_rate, average_response_time
    ) VALUES (
        metric_date, total_feedback_count, 
        COALESCE(feedback_by_category, '{}'::jsonb),
        COALESCE(feedback_by_priority, '{}'::jsonb),
        COALESCE(response_rate_calc, 0),
        COALESCE(avg_response_time, 0)
    )
    ON CONFLICT (metric_date) DO UPDATE SET
        total_feedback = EXCLUDED.total_feedback,
        feedback_by_category = EXCLUDED.feedback_by_category,
        feedback_by_priority = EXCLUDED.feedback_by_priority,
        response_rate = EXCLUDED.response_rate,
        average_response_time = EXCLUDED.average_response_time,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to get communication dashboard data
CREATE OR REPLACE FUNCTION get_communication_dashboard(
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_feedback INTEGER,
    pending_feedback INTEGER,
    response_rate DECIMAL,
    avg_response_time DECIMAL,
    feedback_by_category JSONB,
    working_group_performance JSONB,
    upcoming_consultations INTEGER,
    recent_meetings INTEGER
) AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    start_date := CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(cf.*)::INTEGER as total_feedback,
        COUNT(CASE WHEN cf.status IN ('received', 'routed', 'assigned', 'in_progress') THEN 1 END)::INTEGER as pending_feedback,
        CASE 
            WHEN COUNT(cf.*) > 0 THEN 
                (COUNT(CASE WHEN cf.status IN ('responded', 'resolved') THEN 1 END)::DECIMAL / COUNT(cf.*)::DECIMAL * 100)
            ELSE 0 
        END as response_rate,
        AVG(
            CASE 
                WHEN jsonb_array_length(cf.responses) > 0 THEN
                    EXTRACT(EPOCH FROM (
                        (cf.responses->0->>'respondedAt')::TIMESTAMP - cf.submitted_at
                    )) / 3600
                ELSE NULL
            END
        )::DECIMAL as avg_response_time,
        (
            SELECT jsonb_object_agg(category, count)
            FROM (
                SELECT category, COUNT(*) as count
                FROM community_feedback
                WHERE submitted_at >= start_date
                GROUP BY category
            ) cat_counts
        ) as feedback_by_category,
        (
            SELECT jsonb_object_agg(wg.name, jsonb_build_object(
                'feedbackCount', wg_stats.feedback_count,
                'responseRate', wg_stats.response_rate,
                'avgResponseTime', wg_stats.avg_response_time
            ))
            FROM working_groups wg
            LEFT JOIN (
                SELECT 
                    cf.routing_info->>'routedTo' as working_group_id,
                    COUNT(*) as feedback_count,
                    (COUNT(CASE WHEN cf.status IN ('responded', 'resolved') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100) as response_rate,
                    AVG(
                        CASE 
                            WHEN jsonb_array_length(cf.responses) > 0 THEN
                                EXTRACT(EPOCH FROM (
                                    (cf.responses->0->>'respondedAt')::TIMESTAMP - cf.submitted_at
                                )) / 3600
                            ELSE NULL
                        END
                    ) as avg_response_time
                FROM community_feedback cf
                WHERE cf.submitted_at >= start_date
                GROUP BY cf.routing_info->>'routedTo'
            ) wg_stats ON wg.id = wg_stats.working_group_id
            WHERE wg.is_active = true
        ) as working_group_performance,
        (
            SELECT COUNT(*)::INTEGER
            FROM consultation_sessions
            WHERE scheduled_date >= CURRENT_TIMESTAMP
            AND status IN ('planned', 'open_registration')
        ) as upcoming_consultations,
        (
            SELECT COUNT(*)::INTEGER
            FROM meeting_summaries
            WHERE date >= start_date
            AND publication_status = 'published'
        ) as recent_meetings
    FROM community_feedback cf
    WHERE cf.submitted_at >= start_date;
END;
$$ LANGUAGE plpgsql;

-- Create view for public meeting summaries
CREATE OR REPLACE VIEW public_meeting_summaries AS
SELECT 
    ms.id,
    ms.working_group_name,
    ms.meeting_type,
    ms.title,
    ms.date,
    ms.duration,
    ms.location,
    ms.summary,
    ms.key_outcomes,
    ms.community_impact,
    ms.published_at,
    jsonb_array_length(ms.attendees) as attendee_count,
    jsonb_array_length(ms.decisions) as decisions_made,
    jsonb_array_length(ms.action_items) as action_items_count
FROM meeting_summaries ms
WHERE ms.publication_status = 'published'
AND ms.access_level IN ('public', 'community')
ORDER BY ms.date DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON communication_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON working_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON consultation_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feedback_routing_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON communication_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feedback_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_action_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON consultation_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cultural_review_queue TO authenticated;

GRANT SELECT ON public_meeting_summaries TO authenticated;
GRANT EXECUTE ON FUNCTION update_communication_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_communication_dashboard TO authenticated;

-- Enable Row Level Security
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - should be customized based on actual auth requirements)
CREATE POLICY "Public channels are viewable by all" ON communication_channels
    FOR SELECT USING (access_level = 'public');

CREATE POLICY "Community feedback is viewable by community members" ON community_feedback
    FOR SELECT USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Users can submit feedback" ON community_feedback
    FOR INSERT WITH CHECK (true); -- Adjust based on actual auth logic

CREATE POLICY "Working group members can update feedback" ON community_feedback
    FOR UPDATE USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Published meeting summaries are viewable by all" ON meeting_summaries
    FOR SELECT USING (publication_status = 'published' AND access_level IN ('public', 'community'));

CREATE POLICY "Public consultations are viewable by all" ON consultation_sessions
    FOR SELECT USING (publication_level = 'public');