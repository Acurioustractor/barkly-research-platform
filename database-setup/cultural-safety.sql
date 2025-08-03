-- Cultural Safety and Protocol Management Database Schema
-- This schema supports cultural safety protocols, content moderation, and elder review processes

-- Cultural safety levels and their definitions
CREATE TABLE IF NOT EXISTS cultural_safety_levels (
    level VARCHAR(20) PRIMARY KEY CHECK (level IN ('public', 'community', 'restricted', 'sacred')),
    description TEXT NOT NULL,
    access_rules TEXT[] NOT NULL,
    review_required BOOLEAN DEFAULT FALSE,
    elder_approval_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default safety levels
INSERT INTO cultural_safety_levels (level, description, access_rules, review_required, elder_approval_required) VALUES
('public', 'Content safe for general public viewing with no cultural restrictions', ARRAY['Available to all users', 'No special permissions required'], FALSE, FALSE),
('community', 'Content appropriate for community members with basic cultural context', ARRAY['Available to registered community members', 'Cultural context provided'], TRUE, FALSE),
('restricted', 'Culturally sensitive content requiring special permissions and context', ARRAY['Requires specific permissions', 'Cultural authority approval needed', 'Limited sharing'], TRUE, TRUE),
('sacred', 'Sacred or highly sensitive cultural content with strict access controls', ARRAY['Elder approval required', 'Ceremony or protocol specific', 'No sharing without permission'], TRUE, TRUE)
ON CONFLICT (level) DO NOTHING;

-- Cultural protocols table
CREATE TABLE IF NOT EXISTS cultural_protocols (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(255) NOT NULL,
    protocol_type VARCHAR(100) CHECK (protocol_type IN (
        'content', 'access', 'sharing', 'ceremony', 'knowledge', 'storytelling', 'media'
    )),
    description TEXT NOT NULL,
    applicable_content TEXT[] DEFAULT '{}', -- Content types this protocol applies to
    restrictions TEXT[] DEFAULT '{}', -- Specific restrictions
    required_approvals TEXT[] DEFAULT '{}', -- Required approval types
    consequences TEXT[] DEFAULT '{}', -- Consequences of violations
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP,
    deactivation_reason TEXT,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', protocol_name || ' ' || description)
    ) STORED
);

-- Cultural moderation queue
CREATE TABLE IF NOT EXISTS cultural_moderation_queue (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
        'document', 'story', 'insight', 'comment', 'media', 'event'
    )),
    submitted_by VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    cultural_flags TEXT[] DEFAULT '{}', -- Cultural concerns identified
    automatic_flags TEXT[] DEFAULT '{}', -- System-generated flags
    assigned_moderator VARCHAR(255),
    estimated_review_time INTEGER DEFAULT 24, -- Hours
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'in_review', 'completed')),
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cultural content reviews
CREATE TABLE IF NOT EXISTS cultural_content_reviews (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    review_type VARCHAR(20) DEFAULT 'community' CHECK (review_type IN (
        'automatic', 'community', 'elder', 'authority'
    )),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'needs_revision'
    )),
    cultural_safety_level VARCHAR(20) REFERENCES cultural_safety_levels(level),
    review_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    escalation_required BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Elders table for cultural authority management
CREATE TABLE IF NOT EXISTS elders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Elder',
    cultural_authority_areas TEXT[] DEFAULT '{}', -- Areas of cultural expertise
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    contact_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    appointed_date DATE DEFAULT CURRENT_DATE,
    appointed_by VARCHAR(255),
    cultural_credentials TEXT,
    languages_spoken TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Elder reviews
CREATE TABLE IF NOT EXISTS elder_reviews (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    elder_id INTEGER REFERENCES elders(id) ON DELETE CASCADE,
    cultural_concerns TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    protocol_violations TEXT[] DEFAULT '{}',
    review_decision VARCHAR(20) CHECK (review_decision IN ('approve', 'reject', 'modify', 'escalate')),
    review_notes TEXT,
    review_date TIMESTAMP,
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'escalated')),
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cultural escalations for complex cases
CREATE TABLE IF NOT EXISTS cultural_escalations (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES cultural_content_reviews(id) ON DELETE CASCADE,
    elder_review_id INTEGER REFERENCES elder_reviews(id) ON DELETE SET NULL,
    escalation_reason TEXT NOT NULL,
    escalated_to VARCHAR(255), -- Cultural authority or elder council
    escalated_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_review', 'resolved', 'referred'
    )),
    resolution TEXT,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content cultural safety tracking
CREATE TABLE IF NOT EXISTS content_cultural_safety (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    safety_level VARCHAR(20) REFERENCES cultural_safety_levels(level),
    access_restrictions JSONB, -- Specific access rules
    cultural_context TEXT, -- Cultural context information
    consent_obtained BOOLEAN DEFAULT FALSE,
    consent_details JSONB, -- Consent tracking information
    last_reviewed TIMESTAMP,
    reviewed_by VARCHAR(255),
    expires_at TIMESTAMP, -- When review expires
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, content_type)
);

-- Cultural protocol violations tracking
CREATE TABLE IF NOT EXISTS protocol_violations (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    protocol_id INTEGER REFERENCES cultural_protocols(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    violation_description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    detected_by VARCHAR(20) DEFAULT 'system' CHECK (detected_by IN ('system', 'moderator', 'elder', 'community')),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution_status VARCHAR(20) DEFAULT 'open' CHECK (resolution_status IN (
        'open', 'acknowledged', 'resolved', 'dismissed'
    )),
    resolution_notes TEXT,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP,
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cultural training and certification tracking
CREATE TABLE IF NOT EXISTS cultural_training (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    training_type VARCHAR(100) NOT NULL,
    training_name VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    certification_level VARCHAR(50),
    expires_at DATE,
    trainer_name VARCHAR(255),
    training_hours INTEGER,
    competencies TEXT[] DEFAULT '{}',
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles for cultural safety system
CREATE TABLE IF NOT EXISTS cultural_user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'moderator', 'elder', 'cultural_authority', 'community_leader', 'admin'
    )),
    permissions TEXT[] DEFAULT '{}',
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    appointed_by VARCHAR(255),
    appointed_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, role, community_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cultural_protocols_type ON cultural_protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_cultural_protocols_community ON cultural_protocols(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_protocols_active ON cultural_protocols(is_active);
CREATE INDEX IF NOT EXISTS idx_cultural_protocols_search ON cultural_protocols USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON cultural_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON cultural_moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned ON cultural_moderation_queue(assigned_moderator);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_submitted ON cultural_moderation_queue(submitted_at);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content ON cultural_moderation_queue(content_id, content_type);

CREATE INDEX IF NOT EXISTS idx_content_reviews_content ON cultural_content_reviews(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON cultural_content_reviews(status);
CREATE INDEX IF NOT EXISTS idx_content_reviews_type ON cultural_content_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_content_reviews_safety_level ON cultural_content_reviews(cultural_safety_level);
CREATE INDEX IF NOT EXISTS idx_content_reviews_reviewed ON cultural_content_reviews(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_elders_community ON elders(community_id);
CREATE INDEX IF NOT EXISTS idx_elders_active ON elders(is_active);
CREATE INDEX IF NOT EXISTS idx_elders_user ON elders(user_id);

CREATE INDEX IF NOT EXISTS idx_elder_reviews_elder ON elder_reviews(elder_id);
CREATE INDEX IF NOT EXISTS idx_elder_reviews_content ON elder_reviews(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_elder_reviews_status ON elder_reviews(status);
CREATE INDEX IF NOT EXISTS idx_elder_reviews_urgency ON elder_reviews(urgency);
CREATE INDEX IF NOT EXISTS idx_elder_reviews_date ON elder_reviews(review_date);

CREATE INDEX IF NOT EXISTS idx_cultural_escalations_review ON cultural_escalations(review_id);
CREATE INDEX IF NOT EXISTS idx_cultural_escalations_status ON cultural_escalations(status);
CREATE INDEX IF NOT EXISTS idx_cultural_escalations_created ON cultural_escalations(created_at);

CREATE INDEX IF NOT EXISTS idx_content_safety_content ON content_cultural_safety(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_safety_level ON content_cultural_safety(safety_level);
CREATE INDEX IF NOT EXISTS idx_content_safety_community ON content_cultural_safety(community_id);
CREATE INDEX IF NOT EXISTS idx_content_safety_expires ON content_cultural_safety(expires_at);

CREATE INDEX IF NOT EXISTS idx_protocol_violations_content ON protocol_violations(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_protocol_violations_protocol ON protocol_violations(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_violations_severity ON protocol_violations(severity);
CREATE INDEX IF NOT EXISTS idx_protocol_violations_status ON protocol_violations(resolution_status);

CREATE INDEX IF NOT EXISTS idx_cultural_training_user ON cultural_training(user_id);
CREATE INDEX IF NOT EXISTS idx_cultural_training_expires ON cultural_training(expires_at);
CREATE INDEX IF NOT EXISTS idx_cultural_training_community ON cultural_training(community_id);

CREATE INDEX IF NOT EXISTS idx_cultural_user_roles_user ON cultural_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_cultural_user_roles_role ON cultural_user_roles(role);
CREATE INDEX IF NOT EXISTS idx_cultural_user_roles_community ON cultural_user_roles(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_user_roles_active ON cultural_user_roles(is_active);

-- Update triggers
CREATE OR REPLACE FUNCTION update_cultural_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cultural_protocols_updated_at
    BEFORE UPDATE ON cultural_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

CREATE TRIGGER trigger_update_moderation_queue_updated_at
    BEFORE UPDATE ON cultural_moderation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

CREATE TRIGGER trigger_update_content_reviews_updated_at
    BEFORE UPDATE ON cultural_content_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

CREATE TRIGGER trigger_update_elders_updated_at
    BEFORE UPDATE ON elders
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

CREATE TRIGGER trigger_update_elder_reviews_updated_at
    BEFORE UPDATE ON elder_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

CREATE TRIGGER trigger_update_cultural_escalations_updated_at
    BEFORE UPDATE ON cultural_escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

CREATE TRIGGER trigger_update_content_safety_updated_at
    BEFORE UPDATE ON content_cultural_safety
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_updated_at();

-- Views for common queries

-- Active moderation queue with elder review requirements
CREATE OR REPLACE VIEW active_moderation_queue AS
SELECT 
    cmq.*,
    c.name as community_name,
    ccs.safety_level as current_safety_level,
    CASE 
        WHEN cmq.priority = 'urgent' THEN 1
        WHEN cmq.priority = 'high' THEN 2
        WHEN cmq.priority = 'medium' THEN 3
        ELSE 4
    END as priority_order,
    CASE 
        WHEN array_length(cmq.cultural_flags, 1) > 0 THEN true
        ELSE false
    END as has_cultural_concerns
FROM cultural_moderation_queue cmq
LEFT JOIN communities c ON cmq.community_id = c.id
LEFT JOIN content_cultural_safety ccs ON cmq.content_id = ccs.content_id AND cmq.content_type = ccs.content_type
WHERE cmq.status IN ('queued', 'in_review')
ORDER BY priority_order, cmq.submitted_at;

-- Elder review workload
CREATE OR REPLACE VIEW elder_review_workload AS
SELECT 
    e.id as elder_id,
    e.name as elder_name,
    e.role as elder_role,
    c.name as community_name,
    COUNT(er.id) FILTER (WHERE er.status = 'pending') as pending_reviews,
    COUNT(er.id) FILTER (WHERE er.status = 'completed') as completed_reviews,
    COUNT(er.id) FILTER (WHERE er.urgency = 'urgent' AND er.status = 'pending') as urgent_pending,
    AVG(EXTRACT(hours FROM (er.review_date - er.submitted_at))) FILTER (WHERE er.status = 'completed') as avg_review_hours
FROM elders e
LEFT JOIN communities c ON e.community_id = c.id
LEFT JOIN elder_reviews er ON e.id = er.elder_id
WHERE e.is_active = true
GROUP BY e.id, e.name, e.role, c.name
ORDER BY pending_reviews DESC, urgent_pending DESC;

-- Cultural safety compliance overview
CREATE OR REPLACE VIEW cultural_safety_compliance AS
SELECT 
    ccs.community_id,
    c.name as community_name,
    COUNT(*) as total_content,
    COUNT(*) FILTER (WHERE ccs.safety_level = 'public') as public_content,
    COUNT(*) FILTER (WHERE ccs.safety_level = 'community') as community_content,
    COUNT(*) FILTER (WHERE ccs.safety_level = 'restricted') as restricted_content,
    COUNT(*) FILTER (WHERE ccs.safety_level = 'sacred') as sacred_content,
    COUNT(*) FILTER (WHERE ccs.consent_obtained = true) as consented_content,
    COUNT(*) FILTER (WHERE ccs.expires_at < CURRENT_TIMESTAMP) as expired_reviews,
    ROUND(
        (COUNT(*) FILTER (WHERE ccs.consent_obtained = true)::DECIMAL / COUNT(*)) * 100, 1
    ) as consent_rate
FROM content_cultural_safety ccs
LEFT JOIN communities c ON ccs.community_id = c.id
GROUP BY ccs.community_id, c.name
ORDER BY total_content DESC;

-- Protocol violation summary
CREATE OR REPLACE VIEW protocol_violation_summary AS
SELECT 
    cp.id as protocol_id,
    cp.protocol_name,
    cp.protocol_type,
    c.name as community_name,
    COUNT(pv.id) as total_violations,
    COUNT(pv.id) FILTER (WHERE pv.severity = 'critical') as critical_violations,
    COUNT(pv.id) FILTER (WHERE pv.resolution_status = 'open') as open_violations,
    COUNT(pv.id) FILTER (WHERE pv.resolution_status = 'resolved') as resolved_violations,
    ROUND(
        (COUNT(pv.id) FILTER (WHERE pv.resolution_status = 'resolved')::DECIMAL / 
         NULLIF(COUNT(pv.id), 0)) * 100, 1
    ) as resolution_rate
FROM cultural_protocols cp
LEFT JOIN communities c ON cp.community_id = c.id
LEFT JOIN protocol_violations pv ON cp.id = pv.protocol_id
WHERE cp.is_active = true
GROUP BY cp.id, cp.protocol_name, cp.protocol_type, c.name
ORDER BY total_violations DESC, critical_violations DESC;

-- Cultural training status
CREATE OR REPLACE VIEW cultural_training_status AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    cur.role as cultural_role,
    c.name as community_name,
    COUNT(ct.id) as total_trainings,
    COUNT(ct.id) FILTER (WHERE ct.expires_at > CURRENT_DATE) as current_certifications,
    COUNT(ct.id) FILTER (WHERE ct.expires_at <= CURRENT_DATE) as expired_certifications,
    MAX(ct.completion_date) as latest_training_date,
    CASE 
        WHEN COUNT(ct.id) FILTER (WHERE ct.expires_at > CURRENT_DATE) >= 2 THEN 'certified'
        WHEN COUNT(ct.id) FILTER (WHERE ct.expires_at > CURRENT_DATE) >= 1 THEN 'partially_certified'
        ELSE 'not_certified'
    END as certification_status
FROM users u
JOIN cultural_user_roles cur ON u.id = cur.user_id
LEFT JOIN communities c ON cur.community_id = c.id
LEFT JOIN cultural_training ct ON u.id = ct.user_id
WHERE cur.is_active = true
GROUP BY u.id, u.name, cur.role, c.name
ORDER BY certification_status, latest_training_date DESC;

-- Comments for documentation
COMMENT ON TABLE cultural_safety_levels IS 'Defines the different levels of cultural safety and their requirements';
COMMENT ON TABLE cultural_protocols IS 'Cultural protocols and rules that govern content and behavior';
COMMENT ON TABLE cultural_moderation_queue IS 'Queue of content awaiting cultural safety review';
COMMENT ON TABLE cultural_content_reviews IS 'Records of cultural safety reviews performed on content';
COMMENT ON TABLE elders IS 'Community elders who provide cultural authority and guidance';
COMMENT ON TABLE elder_reviews IS 'Reviews performed by elders on culturally sensitive content';
COMMENT ON TABLE cultural_escalations IS 'Escalated cultural safety issues requiring higher authority';
COMMENT ON TABLE content_cultural_safety IS 'Cultural safety status and restrictions for content';
COMMENT ON TABLE protocol_violations IS 'Tracking of cultural protocol violations';
COMMENT ON TABLE cultural_training IS 'Cultural safety training and certification records';
COMMENT ON TABLE cultural_user_roles IS 'User roles and permissions within the cultural safety system';

COMMENT ON VIEW active_moderation_queue IS 'Active moderation queue with priority ordering and cultural flags';
COMMENT ON VIEW elder_review_workload IS 'Elder review workload and performance metrics';
COMMENT ON VIEW cultural_safety_compliance IS 'Cultural safety compliance overview by community';
COMMENT ON VIEW protocol_violation_summary IS 'Summary of protocol violations by protocol type';
COMMENT ON VIEW cultural_training_status IS 'Cultural training and certification status by user';