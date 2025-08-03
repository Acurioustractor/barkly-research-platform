-- Event Management System Database Schema
-- This schema supports workshop and event planning with knowledge capture

-- Community Events Table
-- Main table for all community events and workshops
CREATE TABLE community_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'workshop' CHECK (event_type IN ('workshop', 'meeting', 'ceremony', 'training', 'consultation', 'celebration')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    organizer_id VARCHAR(255) NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    
    -- Cultural considerations
    cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    requires_elder_presence BOOLEAN DEFAULT false,
    cultural_protocols TEXT[] DEFAULT '{}',
    traditional_elements TEXT[] DEFAULT '{}',
    
    -- Workshop-specific fields
    facilitators TEXT[] DEFAULT '{}',
    materials TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    
    -- Registration settings
    requires_registration BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    registration_questions JSONB DEFAULT '[]',
    
    -- Knowledge capture settings
    knowledge_capture_enabled BOOLEAN DEFAULT false,
    capture_settings JSONB DEFAULT '{
        "allowRecording": false,
        "allowPhotos": false,
        "allowNotes": true,
        "requiresConsent": true
    }',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    related_documents TEXT[] DEFAULT '{}',
    related_stories TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Event Registrations Table
-- Tracks who has registered for events
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    user_id UUID, -- Optional link to user account
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(50),
    community_role VARCHAR(100),
    responses JSONB DEFAULT '{}', -- Answers to registration questions
    status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'no_show', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    attended_at TIMESTAMP WITH TIME ZONE,
    cultural_considerations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Workshop Sessions Table
-- Individual sessions within workshops or events
CREATE TABLE workshop_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    session_title VARCHAR(255) NOT NULL,
    session_description TEXT,
    facilitator VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    materials TEXT[] DEFAULT '{}',
    objectives TEXT[] DEFAULT '{}',
    notes TEXT,
    recordings TEXT[] DEFAULT '{}', -- URLs to recordings
    photos TEXT[] DEFAULT '{}', -- URLs to photos
    documents TEXT[] DEFAULT '{}', -- URLs to documents
    attendees TEXT[] DEFAULT '{}', -- List of attendee names/IDs
    key_insights TEXT[] DEFAULT '{}',
    action_items JSONB DEFAULT '[]', -- Array of action item objects
    cultural_notes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Knowledge Captures Table
-- Real-time knowledge capture during events
CREATE TABLE knowledge_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES workshop_sessions(id) ON DELETE CASCADE,
    capture_type VARCHAR(50) NOT NULL CHECK (capture_type IN ('notes', 'recording', 'photo', 'document', 'insight')),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    captured_by VARCHAR(255) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    requires_review BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Event Facilitators Table
-- Track facilitators and their roles
CREATE TABLE event_facilitators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    facilitator_name VARCHAR(255) NOT NULL,
    facilitator_email VARCHAR(255),
    facilitator_role VARCHAR(100),
    expertise_areas TEXT[] DEFAULT '{}',
    cultural_authority BOOLEAN DEFAULT false,
    is_elder BOOLEAN DEFAULT false,
    bio TEXT,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Event Resources Table
-- Materials and resources for events
CREATE TABLE event_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES workshop_sessions(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('material', 'handout', 'presentation', 'video', 'audio', 'document', 'link')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    external_link TEXT,
    is_required BOOLEAN DEFAULT false,
    cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    access_restrictions TEXT[] DEFAULT '{}',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Event Feedback Table
-- Collect feedback from attendees
CREATE TABLE event_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES event_registrations(id) ON DELETE CASCADE,
    attendee_name VARCHAR(255),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    facilitation_rating INTEGER CHECK (facilitation_rating >= 1 AND facilitation_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    comments TEXT,
    suggestions TEXT,
    would_recommend BOOLEAN,
    cultural_appropriateness_rating INTEGER CHECK (cultural_appropriateness_rating >= 1 AND cultural_appropriateness_rating <= 5),
    cultural_feedback TEXT,
    anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Event Notifications Table
-- Track notifications sent about events
CREATE TABLE event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('registration_open', 'registration_reminder', 'event_reminder', 'event_update', 'event_cancelled', 'follow_up')),
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('all_community', 'registered_attendees', 'specific_users', 'facilitators')),
    recipients TEXT[] DEFAULT '{}', -- Email addresses or user IDs
    subject VARCHAR(255),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Event Analytics Table
-- Track event performance and engagement
CREATE TABLE event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, metric_name, metric_date)
);

-- Indexes for performance
CREATE INDEX idx_community_events_community ON community_events(community_id);
CREATE INDEX idx_community_events_status ON community_events(status);
CREATE INDEX idx_community_events_type ON community_events(event_type);
CREATE INDEX idx_community_events_dates ON community_events(start_date, end_date);
CREATE INDEX idx_community_events_cultural_safety ON community_events(cultural_safety);
CREATE INDEX idx_community_events_organizer ON community_events(organizer_id);

CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_email ON event_registrations(attendee_email);

CREATE INDEX idx_workshop_sessions_event ON workshop_sessions(event_id);
CREATE INDEX idx_workshop_sessions_times ON workshop_sessions(start_time, end_time);
CREATE INDEX idx_workshop_sessions_facilitator ON workshop_sessions(facilitator);

CREATE INDEX idx_knowledge_captures_event ON knowledge_captures(event_id);
CREATE INDEX idx_knowledge_captures_session ON knowledge_captures(session_id);
CREATE INDEX idx_knowledge_captures_type ON knowledge_captures(capture_type);
CREATE INDEX idx_knowledge_captures_timestamp ON knowledge_captures(timestamp);
CREATE INDEX idx_knowledge_captures_captured_by ON knowledge_captures(captured_by);
CREATE INDEX idx_knowledge_captures_cultural_safety ON knowledge_captures(cultural_safety);

CREATE INDEX idx_event_facilitators_event ON event_facilitators(event_id);
CREATE INDEX idx_event_facilitators_name ON event_facilitators(facilitator_name);

CREATE INDEX idx_event_resources_event ON event_resources(event_id);
CREATE INDEX idx_event_resources_session ON event_resources(session_id);
CREATE INDEX idx_event_resources_type ON event_resources(resource_type);

CREATE INDEX idx_event_feedback_event ON event_feedback(event_id);
CREATE INDEX idx_event_feedback_registration ON event_feedback(registration_id);
CREATE INDEX idx_event_feedback_rating ON event_feedback(overall_rating);

CREATE INDEX idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_type ON event_notifications(notification_type);
CREATE INDEX idx_event_notifications_status ON event_notifications(delivery_status);

CREATE INDEX idx_event_analytics_event ON event_analytics(event_id);
CREATE INDEX idx_event_analytics_metric ON event_analytics(metric_name);
CREATE INDEX idx_event_analytics_date ON event_analytics(metric_date);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_community_events_updated_at BEFORE UPDATE ON community_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshop_sessions_updated_at BEFORE UPDATE ON workshop_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increase count for new registration
        UPDATE community_events 
        SET current_attendees = current_attendees + 1,
            updated_at = NOW()
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            IF OLD.status = 'registered' AND NEW.status = 'cancelled' THEN
                -- Decrease count when cancelled
                UPDATE community_events 
                SET current_attendees = GREATEST(current_attendees - 1, 0),
                    updated_at = NOW()
                WHERE id = NEW.event_id;
            ELSIF OLD.status = 'cancelled' AND NEW.status = 'registered' THEN
                -- Increase count when re-registered
                UPDATE community_events 
                SET current_attendees = current_attendees + 1,
                    updated_at = NOW()
                WHERE id = NEW.event_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease count for deleted registration
        UPDATE community_events 
        SET current_attendees = GREATEST(current_attendees - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_attendee_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Function to automatically create analytics entries
CREATE OR REPLACE FUNCTION create_event_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Create analytics entry when event is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO event_analytics (event_id, metric_name, metric_value, metadata)
        VALUES 
            (NEW.id, 'completion_date', EXTRACT(EPOCH FROM NOW()), '{"completed_at": "' || NOW() || '"}'),
            (NEW.id, 'total_attendees', NEW.current_attendees, '{}'),
            (NEW.id, 'duration_hours', EXTRACT(EPOCH FROM (NEW.end_date - NEW.start_date))/3600, '{}');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_analytics_trigger
    AFTER UPDATE ON community_events
    FOR EACH ROW EXECUTE FUNCTION create_event_analytics();

-- Function to get event statistics
CREATE OR REPLACE FUNCTION get_event_statistics(
    p_community_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_events BIGINT,
    completed_events BIGINT,
    total_attendees BIGINT,
    average_attendance NUMERIC,
    events_by_type JSONB,
    knowledge_captured BIGINT,
    cultural_events BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH event_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            SUM(current_attendees) as attendees,
            AVG(current_attendees) FILTER (WHERE status = 'completed') as avg_attendance,
            COUNT(*) FILTER (WHERE cultural_safety != 'public') as cultural,
            jsonb_object_agg(event_type, type_count) as by_type
        FROM (
            SELECT 
                status,
                current_attendees,
                cultural_safety,
                event_type,
                COUNT(*) OVER (PARTITION BY event_type) as type_count
            FROM community_events
            WHERE community_id = p_community_id
            AND start_date BETWEEN p_start_date AND p_end_date
        ) sub
        GROUP BY ()
    ),
    knowledge_stats AS (
        SELECT COUNT(*) as captured
        FROM knowledge_captures kc
        JOIN community_events ce ON kc.event_id = ce.id
        WHERE ce.community_id = p_community_id
        AND kc.timestamp BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        es.total,
        es.completed,
        COALESCE(es.attendees, 0),
        COALESCE(es.avg_attendance, 0),
        es.by_type,
        ks.captured,
        es.cultural
    FROM event_stats es
    CROSS JOIN knowledge_stats ks;
END;
$$ LANGUAGE plpgsql;

-- Function to check event capacity
CREATE OR REPLACE FUNCTION check_event_capacity(p_event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    event_record RECORD;
BEGIN
    SELECT max_attendees, current_attendees INTO event_record
    FROM community_events
    WHERE id = p_event_id;
    
    IF event_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If no max limit set, always allow
    IF event_record.max_attendees IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if under capacity
    RETURN event_record.current_attendees < event_record.max_attendees;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(
    p_community_id UUID,
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR(255),
    event_type VARCHAR(50),
    start_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    current_attendees INTEGER,
    max_attendees INTEGER,
    requires_registration BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.event_type,
        ce.start_date,
        ce.location,
        ce.current_attendees,
        ce.max_attendees,
        ce.requires_registration
    FROM community_events ce
    WHERE ce.community_id = p_community_id
    AND ce.status IN ('published', 'ongoing')
    AND ce.start_date BETWEEN NOW() AND NOW() + (p_days_ahead || ' days')::INTERVAL
    ORDER BY ce.start_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a view for event overview
CREATE VIEW event_overview AS
SELECT 
    e.id,
    e.title,
    e.event_type,
    e.status,
    e.start_date,
    e.end_date,
    e.location,
    e.is_virtual,
    e.current_attendees,
    e.max_attendees,
    e.cultural_safety,
    e.requires_elder_presence,
    e.organizer_name,
    c.name as community_name,
    CASE 
        WHEN e.max_attendees IS NULL THEN 'unlimited'
        WHEN e.current_attendees >= e.max_attendees THEN 'full'
        WHEN e.current_attendees >= (e.max_attendees * 0.8) THEN 'nearly_full'
        ELSE 'available'
    END as capacity_status,
    CASE 
        WHEN e.start_date > NOW() THEN 'upcoming'
        WHEN e.start_date <= NOW() AND e.end_date >= NOW() THEN 'ongoing'
        WHEN e.end_date < NOW() THEN 'past'
    END as time_status
FROM community_events e
LEFT JOIN communities c ON e.community_id = c.id;

-- Insert sample event types and templates
INSERT INTO community_events (
    title, description, event_type, status, start_date, end_date, 
    location, community_id, organizer_id, organizer_name,
    cultural_safety, facilitators, learning_objectives, materials,
    requires_registration, knowledge_capture_enabled
)
SELECT 
    event.title,
    event.description,
    event.event_type,
    'draft',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
    event.location,
    c.id,
    'system',
    'Community Coordinator',
    event.cultural_safety,
    event.facilitators,
    event.learning_objectives,
    event.materials,
    event.requires_registration,
    event.knowledge_capture_enabled
FROM communities c
CROSS JOIN (
    VALUES 
    (
        'Traditional Knowledge Sharing Workshop',
        'A workshop focused on sharing and preserving traditional knowledge within our community',
        'workshop',
        'Tennant Creek Community Centre',
        'community',
        ARRAY['Elder Mary Johnson', 'Cultural Officer'],
        ARRAY['Preserve traditional knowledge', 'Engage youth in cultural learning', 'Document important practices'],
        ARRAY['Recording equipment', 'Notebooks', 'Traditional artifacts'],
        true,
        true
    ),
    (
        'Community Health and Wellbeing Meeting',
        'Monthly meeting to discuss community health initiatives and wellbeing programs',
        'meeting',
        'Health Centre Meeting Room',
        'public',
        ARRAY['Health Coordinator', 'Community Nurse'],
        ARRAY['Review health programs', 'Identify community needs', 'Plan health initiatives'],
        ARRAY['Health reports', 'Program materials', 'Feedback forms'],
        false,
        true
    ),
    (
        'Youth Leadership Training',
        'Training program to develop leadership skills among young community members',
        'training',
        'Youth Centre',
        'public',
        ARRAY['Youth Coordinator', 'Leadership Mentor'],
        ARRAY['Develop leadership skills', 'Build confidence', 'Create youth networks'],
        ARRAY['Training materials', 'Activity sheets', 'Certificates'],
        true,
        true
    )
) AS event(title, description, event_type, location, cultural_safety, facilitators, learning_objectives, materials, requires_registration, knowledge_capture_enabled)
WHERE c.name LIKE '%Tennant Creek%' OR c.name LIKE '%Barkly%'
LIMIT 1;

COMMENT ON TABLE community_events IS 'Main table for community events and workshops';
COMMENT ON TABLE event_registrations IS 'Registration records for community events';
COMMENT ON TABLE workshop_sessions IS 'Individual sessions within workshops or events';
COMMENT ON TABLE knowledge_captures IS 'Real-time knowledge capture during events';
COMMENT ON TABLE event_facilitators IS 'Facilitators and their roles for events';
COMMENT ON TABLE event_resources IS 'Materials and resources for events';
COMMENT ON TABLE event_feedback IS 'Feedback collected from event attendees';
COMMENT ON TABLE event_analytics IS 'Performance and engagement analytics for events';