-- Consent Management System Database Schema
-- This schema supports comprehensive consent tracking for cultural content

-- Consent Records Table
-- Tracks individual consent records for content
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('story', 'document', 'media', 'data', 'insight')),
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('individual', 'collective', 'family', 'community')),
    grantor VARCHAR(255) NOT NULL,
    grantor_role VARCHAR(255) NOT NULL,
    consent_scope TEXT[] NOT NULL DEFAULT '{}',
    permissions JSONB NOT NULL DEFAULT '{
        "canShare": false,
        "canModify": false,
        "canRepublish": false,
        "canUseForResearch": false,
        "canUseCommercially": false
    }',
    restrictions TEXT[] NOT NULL DEFAULT '{}',
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_revocable BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    witnessed_by TEXT[] DEFAULT '{}',
    cultural_authority VARCHAR(255),
    community_id UUID REFERENCES communities(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Collective Consent Table
-- Tracks consent decisions made by groups, families, or communities
CREATE TABLE collective_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    collective_type VARCHAR(50) NOT NULL CHECK (collective_type IN ('family', 'clan', 'community', 'language_group')),
    collective_name VARCHAR(255) NOT NULL,
    authorized_representatives TEXT[] NOT NULL,
    consent_decision VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (consent_decision IN ('granted', 'denied', 'conditional', 'pending')),
    conditions TEXT[] DEFAULT '{}',
    voting_record JSONB,
    decision_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    cultural_protocols TEXT[] DEFAULT '{}',
    community_id UUID NOT NULL REFERENCES communities(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Consent Audit Trail
-- Tracks all changes and actions related to consent records
CREATE TABLE consent_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('granted', 'modified', 'revoked', 'expired', 'renewed')),
    performed_by VARCHAR(255) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reason TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    witnessed_by TEXT[] DEFAULT '{}',
    cultural_authority_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Consent Templates
-- Predefined templates for different types of content consent
CREATE TABLE consent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    default_permissions JSONB NOT NULL DEFAULT '{
        "canShare": false,
        "canModify": false,
        "canRepublish": false,
        "canUseForResearch": false,
        "canUseCommercially": false
    }',
    required_fields TEXT[] NOT NULL DEFAULT '{}',
    cultural_considerations TEXT[] DEFAULT '{}',
    recommended_restrictions TEXT[] DEFAULT '{}',
    expiry_period INTEGER, -- days
    requires_witness BOOLEAN NOT NULL DEFAULT false,
    requires_cultural_authority BOOLEAN NOT NULL DEFAULT false,
    community_id UUID REFERENCES communities(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Consent Notifications
-- Tracks notifications sent regarding consent requests and decisions
CREATE TABLE consent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID REFERENCES consent_records(id) ON DELETE CASCADE,
    collective_consent_id UUID REFERENCES collective_consent(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'consent_request', 
        'collective_consent_request', 
        'consent_granted', 
        'consent_revoked', 
        'consent_expiring', 
        'consent_expired'
    )),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_consent_reference CHECK (
        (consent_id IS NOT NULL AND collective_consent_id IS NULL) OR
        (consent_id IS NULL AND collective_consent_id IS NOT NULL)
    )
);

-- Consent Violations
-- Tracks instances where content was used without proper consent
CREATE TABLE consent_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN (
        'no_consent', 
        'expired_consent', 
        'revoked_consent', 
        'insufficient_permissions', 
        'restriction_violation'
    )),
    description TEXT NOT NULL,
    detected_by VARCHAR(255),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    community_id UUID REFERENCES communities(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cultural Authority Approvals
-- Tracks approvals from cultural authorities for sensitive content
CREATE TABLE cultural_authority_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
    authority_name VARCHAR(255) NOT NULL,
    authority_role VARCHAR(255) NOT NULL,
    authority_credentials TEXT,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'denied', 'conditional')),
    approval_conditions TEXT[] DEFAULT '{}',
    cultural_protocols_verified TEXT[] DEFAULT '{}',
    approval_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    community_id UUID REFERENCES communities(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_consent_records_content ON consent_records(content_id, content_type);
CREATE INDEX idx_consent_records_status ON consent_records(status);
CREATE INDEX idx_consent_records_expiry ON consent_records(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_consent_records_community ON consent_records(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX idx_consent_records_grantor ON consent_records(grantor);

CREATE INDEX idx_collective_consent_content ON collective_consent(content_id, content_type);
CREATE INDEX idx_collective_consent_community ON collective_consent(community_id);
CREATE INDEX idx_collective_consent_decision ON collective_consent(consent_decision);
CREATE INDEX idx_collective_consent_valid_until ON collective_consent(valid_until) WHERE valid_until IS NOT NULL;

CREATE INDEX idx_consent_audit_consent ON consent_audit(consent_id);
CREATE INDEX idx_consent_audit_performed_at ON consent_audit(performed_at);
CREATE INDEX idx_consent_audit_action ON consent_audit(action);

CREATE INDEX idx_consent_templates_content_type ON consent_templates(content_type);
CREATE INDEX idx_consent_templates_community ON consent_templates(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX idx_consent_templates_active ON consent_templates(is_active);

CREATE INDEX idx_consent_notifications_recipient ON consent_notifications(recipient);
CREATE INDEX idx_consent_notifications_status ON consent_notifications(status);
CREATE INDEX idx_consent_notifications_type ON consent_notifications(notification_type);

CREATE INDEX idx_consent_violations_content ON consent_violations(content_id, content_type);
CREATE INDEX idx_consent_violations_status ON consent_violations(status);
CREATE INDEX idx_consent_violations_severity ON consent_violations(severity);
CREATE INDEX idx_consent_violations_community ON consent_violations(community_id) WHERE community_id IS NOT NULL;

CREATE INDEX idx_cultural_authority_consent ON cultural_authority_approvals(consent_id);
CREATE INDEX idx_cultural_authority_status ON cultural_authority_approvals(approval_status);
CREATE INDEX idx_cultural_authority_community ON cultural_authority_approvals(community_id) WHERE community_id IS NOT NULL;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON consent_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collective_consent_updated_at BEFORE UPDATE ON collective_consent FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consent_templates_updated_at BEFORE UPDATE ON consent_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consent_notifications_updated_at BEFORE UPDATE ON consent_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consent_violations_updated_at BEFORE UPDATE ON consent_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_authority_approvals_updated_at BEFORE UPDATE ON cultural_authority_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire consents
CREATE OR REPLACE FUNCTION expire_old_consents()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE consent_records 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND expiry_date IS NOT NULL 
    AND expiry_date < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Create audit entries for expired consents
    INSERT INTO consent_audit (consent_id, action, performed_by, reason)
    SELECT id, 'expired', 'system', 'Consent expired automatically'
    FROM consent_records 
    WHERE status = 'expired' 
    AND updated_at >= NOW() - INTERVAL '1 minute';
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check consent validity for content use
CREATE OR REPLACE FUNCTION check_content_consent_validity(
    p_content_id VARCHAR(255),
    p_content_type VARCHAR(50),
    p_intended_use VARCHAR(50)
)
RETURNS TABLE (
    has_valid_consent BOOLEAN,
    consent_count INTEGER,
    restrictions TEXT[],
    expiry_warnings TEXT[]
) AS $$
DECLARE
    permission_field VARCHAR(50);
    valid_consents INTEGER := 0;
    total_consents INTEGER := 0;
    all_restrictions TEXT[] := '{}';
    warnings TEXT[] := '{}';
    consent_record RECORD;
BEGIN
    -- Map intended use to permission field
    permission_field := CASE p_intended_use
        WHEN 'share' THEN 'canShare'
        WHEN 'modify' THEN 'canModify'
        WHEN 'republish' THEN 'canRepublish'
        WHEN 'research' THEN 'canUseForResearch'
        WHEN 'commercial' THEN 'canUseCommercially'
        ELSE 'canShare'
    END;
    
    -- Check all active consent records for this content
    FOR consent_record IN 
        SELECT cr.*, (cr.permissions->>permission_field)::boolean as has_permission
        FROM consent_records cr
        WHERE cr.content_id = p_content_id 
        AND cr.content_type = p_content_type 
        AND cr.status = 'active'
    LOOP
        total_consents := total_consents + 1;
        
        -- Check if consent has required permission
        IF consent_record.has_permission THEN
            valid_consents := valid_consents + 1;
        END IF;
        
        -- Collect restrictions
        all_restrictions := all_restrictions || consent_record.restrictions;
        
        -- Check for expiry warnings (within 30 days)
        IF consent_record.expiry_date IS NOT NULL THEN
            IF consent_record.expiry_date < NOW() + INTERVAL '30 days' THEN
                warnings := warnings || (consent_record.grantor || ' consent expires on ' || consent_record.expiry_date::date);
            END IF;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        (valid_consents > 0) as has_valid_consent,
        total_consents as consent_count,
        array_remove(all_restrictions, NULL) as restrictions,
        warnings as expiry_warnings;
END;
$$ LANGUAGE plpgsql;

-- Function to get consent statistics
CREATE OR REPLACE FUNCTION get_consent_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_community_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_consents BIGINT,
    active_consents BIGINT,
    revoked_consents BIGINT,
    expired_consents BIGINT,
    pending_consents BIGINT,
    upcoming_expirations BIGINT,
    consent_by_type JSONB,
    consent_by_content_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH consent_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'active') as active,
            COUNT(*) FILTER (WHERE status = 'revoked') as revoked,
            COUNT(*) FILTER (WHERE status = 'expired') as expired,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'active' AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') as expiring,
            jsonb_object_agg(consent_type, type_count) as by_type,
            jsonb_object_agg(content_type, content_count) as by_content
        FROM (
            SELECT 
                status,
                expiry_date,
                consent_type,
                content_type,
                COUNT(*) OVER (PARTITION BY consent_type) as type_count,
                COUNT(*) OVER (PARTITION BY content_type) as content_count
            FROM consent_records
            WHERE granted_at BETWEEN p_start_date AND p_end_date
            AND (p_community_id IS NULL OR community_id = p_community_id)
        ) sub
        GROUP BY ()
    )
    SELECT 
        cs.total,
        cs.active,
        cs.revoked,
        cs.expired,
        cs.pending,
        cs.expiring,
        cs.by_type,
        cs.by_content
    FROM consent_stats cs;
END;
$$ LANGUAGE plpgsql;

-- Insert default consent templates
INSERT INTO consent_templates (template_name, content_type, default_permissions, required_fields, cultural_considerations, expiry_period, requires_witness, requires_cultural_authority) VALUES
('Story Sharing Template', 'story', '{"canShare": true, "canModify": false, "canRepublish": false, "canUseForResearch": true, "canUseCommercially": false}', '["grantor", "grantorRole", "consentScope"]', '["Respect cultural protocols", "Ensure appropriate attribution", "Consider community sensitivities"]', 365, false, true),
('Document Research Template', 'document', '{"canShare": false, "canModify": false, "canRepublish": false, "canUseForResearch": true, "canUseCommercially": false}', '["grantor", "grantorRole", "consentScope", "restrictions"]', '["Verify cultural authority", "Respect confidentiality", "Ensure proper context"]', 730, true, true),
('Media Sharing Template', 'media', '{"canShare": true, "canModify": false, "canRepublish": true, "canUseForResearch": true, "canUseCommercially": false}', '["grantor", "grantorRole", "consentScope"]', '["Respect image rights", "Consider cultural significance", "Ensure appropriate use"]', 365, false, false),
('Data Analysis Template', 'data', '{"canShare": false, "canModify": true, "canRepublish": false, "canUseForResearch": true, "canUseCommercially": false}', '["grantor", "grantorRole", "consentScope", "restrictions"]', '["Anonymize personal information", "Respect data sovereignty", "Follow ethical guidelines"]', 1095, true, true);

-- Create a view for consent overview
CREATE VIEW consent_overview AS
SELECT 
    cr.id,
    cr.content_id,
    cr.content_type,
    cr.consent_type,
    cr.grantor,
    cr.grantor_role,
    cr.status,
    cr.granted_at,
    cr.expiry_date,
    CASE 
        WHEN cr.expiry_date IS NOT NULL AND cr.expiry_date <= NOW() + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN cr.expiry_date IS NOT NULL AND cr.expiry_date <= NOW() THEN 'expired'
        ELSE 'normal'
    END as expiry_status,
    cr.permissions,
    cr.restrictions,
    cr.community_id,
    c.name as community_name
FROM consent_records cr
LEFT JOIN communities c ON cr.community_id = c.id;

COMMENT ON TABLE consent_records IS 'Individual consent records for cultural content';
COMMENT ON TABLE collective_consent IS 'Collective consent decisions made by groups or communities';
COMMENT ON TABLE consent_audit IS 'Audit trail for all consent-related actions';
COMMENT ON TABLE consent_templates IS 'Predefined templates for different types of consent';
COMMENT ON TABLE consent_notifications IS 'Notifications related to consent requests and decisions';
COMMENT ON TABLE consent_violations IS 'Tracking of consent violations and breaches';
COMMENT ON TABLE cultural_authority_approvals IS 'Approvals from cultural authorities for sensitive content';