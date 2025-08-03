-- Community Member Dashboard Database Schema
-- This schema supports the community member dashboard with services, stories, opportunities, and events

-- Community services table
CREATE TABLE IF NOT EXISTS community_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN (
        'health', 'education', 'employment', 'housing', 'legal', 'cultural',
        'youth', 'elderly', 'family', 'mental_health', 'substance_abuse',
        'disability', 'transport', 'food', 'emergency', 'general'
    )),
    location TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    website VARCHAR(500),
    hours TEXT,
    availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN (
        'available', 'limited', 'waitlist', 'unavailable'
    )),
    culturally_safe BOOLEAN DEFAULT FALSE,
    languages TEXT[], -- Array of languages supported
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || description || ' ' || COALESCE(category, ''))
    ) STORED
);

-- Community stories table
CREATE TABLE IF NOT EXISTS community_stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_name VARCHAR(255),
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN (
        'success', 'challenge', 'culture', 'youth', 'education', 'health',
        'employment', 'family', 'community', 'tradition', 'change', 'general'
    )),
    media_type VARCHAR(20) DEFAULT 'text' CHECK (media_type IN ('text', 'audio', 'video')),
    media_url TEXT,
    cultural_safety VARCHAR(20) DEFAULT 'public' CHECK (cultural_safety IN (
        'public', 'community', 'restricted', 'sacred'
    )),
    themes TEXT[], -- Array of themes/tags
    likes_count INTEGER DEFAULT 0,
    is_inspiring BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || content || ' ' || COALESCE(array_to_string(themes, ' '), ''))
    ) STORED
);

-- Community opportunities table
CREATE TABLE IF NOT EXISTS community_opportunities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN (
        'employment', 'education', 'volunteer', 'funding', 'program',
        'training', 'scholarship', 'grant', 'internship', 'general'
    )),
    organization VARCHAR(255),
    deadline TIMESTAMP,
    location TEXT,
    requirements TEXT[], -- Array of requirements
    contact_info TEXT,
    application_url TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || description || ' ' || COALESCE(organization, ''))
    ) STORED
);

-- Community events table
CREATE TABLE IF NOT EXISTS community_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location TEXT,
    organizer VARCHAR(255),
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN (
        'cultural', 'educational', 'social', 'health', 'youth', 'family',
        'ceremony', 'workshop', 'meeting', 'celebration', 'sport', 'general'
    )),
    registration_required BOOLEAN DEFAULT FALSE,
    registration_url TEXT,
    cultural_protocols TEXT[], -- Array of cultural protocols
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || description || ' ' || COALESCE(organizer, ''))
    ) STORED
);

-- Story likes tracking
CREATE TABLE IF NOT EXISTS story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES community_stories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES community_events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN (
        'registered', 'attended', 'cancelled', 'no_show'
    )),
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Service feedback
CREATE TABLE IF NOT EXISTS service_feedback (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES community_services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community feedback (general)
CREATE TABLE IF NOT EXISTS community_feedback (
    id SERIAL PRIMARY KEY,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN (
        'services', 'events', 'communication', 'participation', 'safety',
        'culture', 'youth', 'elderly', 'accessibility', 'general'
    )),
    feedback_text TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'reviewed', 'in_progress', 'resolved', 'closed'
    )),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_services_community ON community_services(community_id);
CREATE INDEX IF NOT EXISTS idx_community_services_category ON community_services(category);
CREATE INDEX IF NOT EXISTS idx_community_services_availability ON community_services(availability);
CREATE INDEX IF NOT EXISTS idx_community_services_active ON community_services(active);
CREATE INDEX IF NOT EXISTS idx_community_services_search ON community_services USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_community_stories_community ON community_stories(community_id);
CREATE INDEX IF NOT EXISTS idx_community_stories_published ON community_stories(published);
CREATE INDEX IF NOT EXISTS idx_community_stories_category ON community_stories(category);
CREATE INDEX IF NOT EXISTS idx_community_stories_cultural_safety ON community_stories(cultural_safety);
CREATE INDEX IF NOT EXISTS idx_community_stories_published_at ON community_stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_stories_search ON community_stories USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_community_opportunities_community ON community_opportunities(community_id);
CREATE INDEX IF NOT EXISTS idx_community_opportunities_type ON community_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_community_opportunities_active ON community_opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_community_opportunities_urgent ON community_opportunities(is_urgent);
CREATE INDEX IF NOT EXISTS idx_community_opportunities_deadline ON community_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_community_opportunities_search ON community_opportunities USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_community_events_community ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_date ON community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_category ON community_events(category);
CREATE INDEX IF NOT EXISTS idx_community_events_active ON community_events(is_active);
CREATE INDEX IF NOT EXISTS idx_community_events_search ON community_events USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

CREATE INDEX IF NOT EXISTS idx_service_feedback_service ON service_feedback(service_id);
CREATE INDEX IF NOT EXISTS idx_service_feedback_rating ON service_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_community_feedback_community ON community_feedback(community_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_category ON community_feedback(category);
CREATE INDEX IF NOT EXISTS idx_community_feedback_status ON community_feedback(status);
CREATE INDEX IF NOT EXISTS idx_community_feedback_priority ON community_feedback(priority);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_services_updated_at
    BEFORE UPDATE ON community_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_community_stories_updated_at
    BEFORE UPDATE ON community_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_community_opportunities_updated_at
    BEFORE UPDATE ON community_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_community_events_updated_at
    BEFORE UPDATE ON community_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_community_feedback_updated_at
    BEFORE UPDATE ON community_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update story likes count
CREATE OR REPLACE FUNCTION update_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_stories 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_stories 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_story_likes_count
    AFTER INSERT OR DELETE ON story_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_story_likes_count();

-- Function to update event registration count
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_events 
        SET registered_count = registered_count + 1 
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_events 
        SET registered_count = GREATEST(registered_count - 1, 0) 
        WHERE id = OLD.event_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes (e.g., cancelled registrations)
        IF OLD.status = 'registered' AND NEW.status != 'registered' THEN
            UPDATE community_events 
            SET registered_count = GREATEST(registered_count - 1, 0) 
            WHERE id = NEW.event_id;
        ELSIF OLD.status != 'registered' AND NEW.status = 'registered' THEN
            UPDATE community_events 
            SET registered_count = registered_count + 1 
            WHERE id = NEW.event_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_registration_count
    AFTER INSERT OR UPDATE OR DELETE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_event_registration_count();

-- Views for common queries

-- Active services by community
CREATE OR REPLACE VIEW active_community_services AS
SELECT 
    cs.*,
    c.name as community_name
FROM community_services cs
JOIN communities c ON cs.community_id = c.id
WHERE cs.active = true
ORDER BY cs.name;

-- Published stories with engagement metrics
CREATE OR REPLACE VIEW published_community_stories AS
SELECT 
    cs.*,
    c.name as community_name,
    COALESCE(cs.likes_count, 0) as total_likes
FROM community_stories cs
JOIN communities c ON cs.community_id = c.id
WHERE cs.published = true
ORDER BY cs.published_at DESC;

-- Active opportunities with urgency
CREATE OR REPLACE VIEW active_community_opportunities AS
SELECT 
    co.*,
    c.name as community_name,
    CASE 
        WHEN co.deadline IS NOT NULL AND co.deadline < CURRENT_TIMESTAMP + INTERVAL '7 days' 
        THEN true 
        ELSE co.is_urgent 
    END as is_deadline_urgent
FROM community_opportunities co
JOIN communities c ON co.community_id = c.id
WHERE co.is_active = true
AND (co.deadline IS NULL OR co.deadline > CURRENT_TIMESTAMP)
ORDER BY co.is_urgent DESC, co.deadline ASC NULLS LAST;

-- Upcoming events with registration info
CREATE OR REPLACE VIEW upcoming_community_events AS
SELECT 
    ce.*,
    c.name as community_name,
    CASE 
        WHEN ce.capacity IS NOT NULL 
        THEN ROUND((ce.registered_count::DECIMAL / ce.capacity) * 100, 1)
        ELSE NULL 
    END as capacity_percentage,
    CASE 
        WHEN ce.capacity IS NOT NULL AND ce.registered_count >= ce.capacity 
        THEN true 
        ELSE false 
    END as is_full
FROM community_events ce
JOIN communities c ON ce.community_id = c.id
WHERE ce.is_active = true
AND ce.event_date > CURRENT_TIMESTAMP
ORDER BY ce.event_date ASC;

-- Community engagement summary
CREATE OR REPLACE VIEW community_engagement_summary AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    COUNT(DISTINCT cs.id) as active_services_count,
    COUNT(DISTINCT cst.id) as published_stories_count,
    COUNT(DISTINCT co.id) as active_opportunities_count,
    COUNT(DISTINCT ce.id) as upcoming_events_count,
    COALESCE(SUM(cst.likes_count), 0) as total_story_likes,
    COUNT(DISTINCT cf.id) as feedback_count
FROM communities c
LEFT JOIN community_services cs ON c.id = cs.community_id AND cs.active = true
LEFT JOIN community_stories cst ON c.id = cst.community_id AND cst.published = true
LEFT JOIN community_opportunities co ON c.id = co.community_id AND co.is_active = true
LEFT JOIN community_events ce ON c.id = ce.community_id AND ce.is_active = true AND ce.event_date > CURRENT_TIMESTAMP
LEFT JOIN community_feedback cf ON c.id = cf.community_id
GROUP BY c.id, c.name;

-- Comments for documentation
COMMENT ON TABLE community_services IS 'Local services available to community members';
COMMENT ON TABLE community_stories IS 'Community stories shared by members';
COMMENT ON TABLE community_opportunities IS 'Employment, education, and other opportunities';
COMMENT ON TABLE community_events IS 'Community events and gatherings';
COMMENT ON TABLE story_likes IS 'Tracking likes on community stories';
COMMENT ON TABLE event_registrations IS 'Event registration tracking';
COMMENT ON TABLE service_feedback IS 'Feedback on community services';
COMMENT ON TABLE community_feedback IS 'General community feedback and suggestions';

COMMENT ON VIEW active_community_services IS 'Active services with community information';
COMMENT ON VIEW published_community_stories IS 'Published stories with engagement metrics';
COMMENT ON VIEW active_community_opportunities IS 'Active opportunities with urgency indicators';
COMMENT ON VIEW upcoming_community_events IS 'Upcoming events with registration information';
COMMENT ON VIEW community_engagement_summary IS 'Summary of community engagement metrics';