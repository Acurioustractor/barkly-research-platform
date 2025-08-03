-- =====================================================
-- Barkly Research Platform - Advanced User Management System (Simplified)
-- Task 4: Implement advanced user management
-- =====================================================

-- This script creates a comprehensive user management system that integrates
-- with the community management system and supports Indigenous cultural protocols

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================

-- Create comprehensive user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Profile Information
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    preferred_name TEXT, -- For cultural names or preferred identity
    bio TEXT,
    profile_image_url TEXT,
    
    -- Contact Information
    email TEXT, -- Synced from auth.users but can be updated
    phone_number TEXT,
    preferred_contact_method TEXT DEFAULT 'email' 
        CHECK (preferred_contact_method IN ('email', 'phone', 'platform_message')),
    
    -- Community Relationships
    primary_community_id UUID REFERENCES communities(id),
    affiliated_communities UUID[] DEFAULT '{}', -- Array of community IDs
    community_roles JSONB DEFAULT '{}', -- Role per community
    
    -- Cultural Information
    cultural_background TEXT,
    traditional_name TEXT,
    cultural_protocols JSONB DEFAULT '{}', -- Personal cultural preferences
    language_preferences TEXT[] DEFAULT '{}', -- Preferred languages
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('public', 'standard', 'sensitive', 'private')),
    
    -- Professional Information
    job_title TEXT,
    organization TEXT,
    expertise_areas TEXT[] DEFAULT '{}',
    research_interests TEXT[] DEFAULT '{}',
    qualifications JSONB DEFAULT '{}',
    
    -- Platform Preferences
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "platform_notifications": true,
        "research_updates": true,
        "community_updates": true,
        "system_announcements": true
    }',
    privacy_settings JSONB DEFAULT '{
        "profile_visibility": "community",
        "contact_visibility": "members",
        "research_visibility": "public"
    }',
    accessibility_preferences JSONB DEFAULT '{}',
    
    -- Verification and Trust
    verification_status TEXT DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified', 'pending', 'verified', 'trusted', 'suspended')),
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
    
    -- Activity and Engagement
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    total_login_count INTEGER DEFAULT 0,
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
    
    -- Onboarding and Training
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,
    cultural_training_completed BOOLEAN DEFAULT false,
    cultural_training_completed_at TIMESTAMPTZ,
    platform_training_completed BOOLEAN DEFAULT false,
    platform_training_completed_at TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER ACTIVITY TRACKING
-- =====================================================

-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity Details
    activity_type TEXT NOT NULL
        CHECK (activity_type IN ('login', 'logout', 'profile_update', 'document_access', 'document_upload', 'search', 'community_join', 'research_participation', 'policy_agreement', 'cultural_protocol_acknowledgment')),
    activity_description TEXT,
    activity_metadata JSONB DEFAULT '{}',
    
    -- Context Information
    community_id UUID REFERENCES communities(id), -- Community context if applicable
    resource_type TEXT, -- Type of resource accessed (document, project, etc.)
    resource_id UUID, -- ID of the resource
    
    -- Technical Details
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Cultural Compliance
    cultural_protocols_acknowledged JSONB DEFAULT '{}',
    data_sovereignty_compliance BOOLEAN DEFAULT true,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user activity log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER SESSIONS MANAGEMENT
-- =====================================================

-- Create user sessions table for advanced session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session Details
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT,
    session_type TEXT DEFAULT 'web'
        CHECK (session_type IN ('web', 'mobile', 'api', 'admin')),
    
    -- Session Metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    
    -- Session Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Security
    security_flags JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Cultural Context
    community_context UUID REFERENCES communities(id), -- Active community during session
    cultural_protocols_active JSONB DEFAULT '{}'
);

-- Enable RLS on user sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER PERMISSIONS AND ROLES
-- =====================================================

-- Create user permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Permission Details
    permission_type TEXT NOT NULL
        CHECK (permission_type IN ('system_admin', 'community_admin', 'researcher', 'data_curator', 'cultural_keeper', 'elder', 'member', 'guest')),
    permission_scope TEXT NOT NULL
        CHECK (permission_scope IN ('global', 'community', 'project', 'document', 'user')),
    resource_id UUID, -- ID of the resource this permission applies to
    
    -- Permission Specifics
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_admin BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    
    -- Cultural Permissions
    can_access_sacred BOOLEAN DEFAULT false,
    can_access_ceremonial BOOLEAN DEFAULT false,
    can_modify_cultural_data BOOLEAN DEFAULT false,
    requires_elder_approval BOOLEAN DEFAULT false,
    
    -- Permission Lifecycle
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Cultural Context
    community_id UUID REFERENCES communities(id),
    cultural_justification TEXT, -- Reason for cultural permissions
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, permission_type, permission_scope, resource_id, community_id)
);

-- Enable RLS on user permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER VERIFICATION WORKFLOW
-- =====================================================

-- Create user verification requests table
CREATE TABLE IF NOT EXISTS user_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Verification Details
    verification_type TEXT NOT NULL
        CHECK (verification_type IN ('identity', 'community_membership', 'cultural_authority', 'professional_credentials', 'elder_status', 'researcher_credentials')),
    verification_level TEXT NOT NULL
        CHECK (verification_level IN ('basic', 'standard', 'enhanced', 'cultural_authority')),
    
    -- Supporting Information
    supporting_documents JSONB DEFAULT '{}', -- Document references
    community_endorsements UUID[] DEFAULT '{}', -- Community member endorsements
    cultural_references UUID[] DEFAULT '{}', -- Cultural authority references
    professional_references JSONB DEFAULT '{}',
    
    -- Verification Process
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'additional_info_required', 'approved', 'rejected', 'expired')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    decision_reason TEXT,
    
    -- Cultural Considerations
    community_id UUID REFERENCES communities(id),
    requires_elder_approval BOOLEAN DEFAULT false,
    elder_approvals UUID[] DEFAULT '{}',
    cultural_protocols_followed JSONB DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user verification requests
ALTER TABLE user_verification_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_community ON user_profiles(primary_community_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification ON user_profiles(verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(last_active_at DESC) WHERE verification_status IN ('verified', 'trusted');

-- User activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type_time ON user_activity_log(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_community ON user_activity_log(community_id, created_at DESC) WHERE community_id IS NOT NULL;

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, is_active, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_cleanup ON user_sessions(expires_at) WHERE is_active = true;

-- User permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_user ON user_permissions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_type_scope ON user_permissions(permission_type, permission_scope, is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_community ON user_permissions(community_id, permission_type) WHERE community_id IS NOT NULL;

-- User verification requests indexes
CREATE INDEX IF NOT EXISTS idx_verification_user ON user_verification_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_verification_type ON user_verification_requests(verification_type, status);
CREATE INDEX IF NOT EXISTS idx_verification_community ON user_verification_requests(community_id, status) WHERE community_id IS NOT NULL;

-- =====================================================
-- BASIC ROW LEVEL SECURITY POLICIES
-- =====================================================

-- User Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (
        is_authenticated() AND user_id = auth.uid()
    ) WITH CHECK (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Community members can view community profiles" ON user_profiles;
CREATE POLICY "Community members can view community profiles" ON user_profiles
    FOR SELECT USING (
        is_authenticated() AND (
            privacy_settings->>'profile_visibility' = 'public'
            OR EXISTS (
                SELECT 1 FROM community_memberships cm
                WHERE cm.user_id = auth.uid()
                AND cm.community_id = user_profiles.primary_community_id
                AND cm.status = 'active'
            )
        )
    );

-- User Activity Log RLS Policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
CREATE POLICY "Users can view their own activity" ON user_activity_log
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "System can insert activity logs" ON user_activity_log;
CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (true); -- System-level logging

-- User Sessions RLS Policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (
        is_authenticated() AND user_id = auth.uid()
    ) WITH CHECK (
        is_authenticated() AND user_id = auth.uid()
    );

-- User Permissions RLS Policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
CREATE POLICY "Users can view their own permissions" ON user_permissions
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

-- User Verification Requests RLS Policies
DROP POLICY IF EXISTS "Users can view their own verification requests" ON user_verification_requests;
CREATE POLICY "Users can view their own verification requests" ON user_verification_requests
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create their own verification requests" ON user_verification_requests;
CREATE POLICY "Users can create their own verification requests" ON user_verification_requests
    FOR INSERT WITH CHECK (
        is_authenticated() AND user_id = auth.uid()
    );

-- =====================================================
-- ADD AUDIT TRIGGERS
-- =====================================================

-- Add audit triggers to all user management tables
DROP TRIGGER IF EXISTS user_profiles_audit_trigger ON user_profiles;
CREATE TRIGGER user_profiles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS user_activity_log_audit_trigger ON user_activity_log;
CREATE TRIGGER user_activity_log_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_activity_log
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS user_sessions_audit_trigger ON user_sessions;
CREATE TRIGGER user_sessions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS user_permissions_audit_trigger ON user_permissions;
CREATE TRIGGER user_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS user_verification_requests_audit_trigger ON user_verification_requests;
CREATE TRIGGER user_verification_requests_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_verification_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- UPDATE TRIGGERS FOR AUTOMATIC FIELDS
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_permissions_updated_at ON user_permissions;
CREATE TRIGGER user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_verification_requests_updated_at ON user_verification_requests;
CREATE TRIGGER user_verification_requests_updated_at
    BEFORE UPDATE ON user_verification_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();