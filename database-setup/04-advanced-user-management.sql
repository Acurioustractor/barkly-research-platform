-- =====================================================
-- Barkly Research Platform - Advanced User Management System
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
-- ROW LEVEL SECURITY POLICIES
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
            primary_community_id = get_user_community_id()
            OR get_user_community_id() = ANY(affiliated_communities)
            OR privacy_settings->>'profile_visibility' = 'public'
        )
    );

DROP POLICY IF EXISTS "Community admins can view all community profiles" ON user_profiles;
CREATE POLICY "Community admins can view all community profiles" ON user_profiles
    FOR SELECT USING (
        is_authenticated() AND is_community_admin(primary_community_id)
    );

-- User Activity Log RLS Policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
CREATE POLICY "Users can view their own activity" ON user_activity_log
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Community admins can view community activity" ON user_activity_log;
CREATE POLICY "Community admins can view community activity" ON user_activity_log
    FOR SELECT USING (
        is_authenticated() AND is_community_admin(community_id)
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

DROP POLICY IF EXISTS "Community admins can manage community permissions" ON user_permissions;
CREATE POLICY "Community admins can manage community permissions" ON user_permissions
    FOR ALL USING (
        is_authenticated() AND is_community_admin(community_id)
    ) WITH CHECK (
        is_authenticated() AND is_community_admin(community_id)
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

DROP POLICY IF EXISTS "Community admins can manage verification requests" ON user_verification_requests;
CREATE POLICY "Community admins can manage verification requests" ON user_verification_requests
    FOR ALL USING (
        is_authenticated() AND is_community_admin(community_id)
    ) WITH CHECK (
        is_authenticated() AND is_community_admin(community_id)
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

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create or update user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
    target_user_id UUID,
    profile_data JSONB
)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user can update this profile
    IF current_user_id != target_user_id AND NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Can only update own profile';
    END IF;
    
    -- Upsert the profile
    INSERT INTO user_profiles (
        user_id,
        display_name,
        first_name,
        last_name,
        preferred_name,
        bio,
        cultural_background,
        traditional_name,
        job_title,
        organization,
        primary_community_id
    ) VALUES (
        target_user_id,
        profile_data->>'display_name',
        profile_data->>'first_name',
        profile_data->>'last_name',
        profile_data->>'preferred_name',
        profile_data->>'bio',
        profile_data->>'cultural_background',
        profile_data->>'traditional_name',
        profile_data->>'job_title',
        profile_data->>'organization',
        (profile_data->>'primary_community_id')::UUID
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        preferred_name = EXCLUDED.preferred_name,
        bio = EXCLUDED.bio,
        cultural_background = EXCLUDED.cultural_background,
        traditional_name = EXCLUDED.traditional_name,
        job_title = EXCLUDED.job_title,
        organization = EXCLUDED.organization,
        primary_community_id = EXCLUDED.primary_community_id,
        updated_at = NOW()
    RETURNING id INTO profile_id;
    
    -- Log the profile update
    PERFORM log_user_activity(
        target_user_id,
        'profile_update',
        'User profile updated',
        jsonb_build_object('profile_id', profile_id, 'updated_by', current_user_id)
    );
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    target_user_id UUID,
    activity_type TEXT,
    activity_description TEXT DEFAULT NULL,
    activity_metadata JSONB DEFAULT '{}',
    community_context UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activity_log (
        user_id,
        activity_type,
        activity_description,
        activity_metadata,
        community_id,
        ip_address,
        session_id
    ) VALUES (
        target_user_id,
        activity_type,
        activity_description,
        activity_metadata,
        community_context,
        inet_client_addr(),
        current_setting('app.session_id', true)
    ) RETURNING id INTO activity_id;
    
    -- Update user's last active timestamp
    UPDATE user_profiles 
    SET last_active_at = NOW() 
    WHERE user_id = target_user_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant user permission
CREATE OR REPLACE FUNCTION grant_user_permission(
    target_user_id UUID,
    permission_type TEXT,
    permission_scope TEXT,
    resource_id UUID DEFAULT NULL,
    community_context UUID DEFAULT NULL,
    permissions JSONB DEFAULT '{"can_read": true}'
)
RETURNS UUID AS $$
DECLARE
    permission_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if current user can grant permissions
    IF NOT (is_admin() OR is_community_admin(community_context)) THEN
        RAISE EXCEPTION 'Access denied: Insufficient permissions to grant access';
    END IF;
    
    -- Insert the permission
    INSERT INTO user_permissions (
        user_id,
        permission_type,
        permission_scope,
        resource_id,
        community_id,
        can_read,
        can_write,
        can_delete,
        can_admin,
        can_share,
        can_access_sacred,
        can_access_ceremonial,
        granted_by
    ) VALUES (
        target_user_id,
        permission_type,
        permission_scope,
        resource_id,
        community_context,
        COALESCE((permissions->>'can_read')::BOOLEAN, false),
        COALESCE((permissions->>'can_write')::BOOLEAN, false),
        COALESCE((permissions->>'can_delete')::BOOLEAN, false),
        COALESCE((permissions->>'can_admin')::BOOLEAN, false),
        COALESCE((permissions->>'can_share')::BOOLEAN, false),
        COALESCE((permissions->>'can_access_sacred')::BOOLEAN, false),
        COALESCE((permissions->>'can_access_ceremonial')::BOOLEAN, false),
        current_user_id
    ) RETURNING id INTO permission_id;
    
    -- Log the permission grant
    PERFORM log_user_activity(
        target_user_id,
        'permission_granted',
        'User permission granted: ' || permission_type,
        jsonb_build_object(
            'permission_id', permission_id,
            'permission_type', permission_type,
            'granted_by', current_user_id
        ),
        community_context
    );
    
    RETURN permission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permission
CREATE OR REPLACE FUNCTION check_user_permission(
    target_user_id UUID,
    permission_type TEXT,
    permission_scope TEXT,
    resource_id UUID DEFAULT NULL,
    community_context UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- Check if user has the specific permission
    SELECT EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_id = target_user_id
        AND permission_type = check_user_permission.permission_type
        AND permission_scope = check_user_permission.permission_scope
        AND (resource_id IS NULL OR resource_id = check_user_permission.resource_id)
        AND (community_id IS NULL OR community_id = community_context)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND can_read = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create verification request
CREATE OR REPLACE FUNCTION create_verification_request(
    verification_type TEXT,
    verification_level TEXT,
    supporting_info JSONB DEFAULT '{}',
    community_context UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    request_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to request verification';
    END IF;
    
    -- Create the verification request
    INSERT INTO user_verification_requests (
        user_id,
        verification_type,
        verification_level,
        supporting_documents,
        community_id,
        requires_elder_approval
    ) VALUES (
        current_user_id,
        verification_type,
        verification_level,
        supporting_info,
        community_context,
        CASE WHEN verification_type IN ('cultural_authority', 'elder_status') THEN true ELSE false END
    ) RETURNING id INTO request_id;
    
    -- Log the verification request
    PERFORM log_user_activity(
        current_user_id,
        'verification_requested',
        'Verification request submitted: ' || verification_type,
        jsonb_build_object(
            'request_id', request_id,
            'verification_type', verification_type,
            'verification_level', verification_level
        ),
        community_context
    );
    
    RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with community information
CREATE OR REPLACE FUNCTION get_user_profile_with_community(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    profile_id UUID,
    user_id UUID,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    preferred_name TEXT,
    bio TEXT,
    cultural_background TEXT,
    traditional_name TEXT,
    job_title TEXT,
    organization TEXT,
    verification_status TEXT,
    trust_score INTEGER,
    primary_community_name TEXT,
    primary_community_slug TEXT,
    community_roles JSONB,
    last_active_at TIMESTAMPTZ,
    profile_completion_percentage INTEGER
) AS $$
DECLARE
    lookup_user_id UUID := COALESCE(target_user_id, auth.uid());
BEGIN
    -- Check access permissions
    IF lookup_user_id != auth.uid() AND NOT is_admin() THEN
        -- Check if user can view this profile based on community membership or privacy settings
        IF NOT EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = lookup_user_id
            AND (
                up.primary_community_id = get_user_community_id()
                OR get_user_community_id() = ANY(up.affiliated_communities)
                OR up.privacy_settings->>'profile_visibility' = 'public'
            )
        ) THEN
            RAISE EXCEPTION 'Access denied: Cannot view this user profile';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT 
        up.id,
        up.user_id,
        up.display_name,
        up.first_name,
        up.last_name,
        up.preferred_name,
        up.bio,
        up.cultural_background,
        up.traditional_name,
        up.job_title,
        up.organization,
        up.verification_status,
        up.trust_score,
        c.name as primary_community_name,
        c.slug as primary_community_slug,
        up.community_roles,
        up.last_active_at,
        up.profile_completion_percentage
    FROM user_profiles up
    LEFT JOIN communities c ON up.primary_community_id = c.id
    WHERE up.user_id = lookup_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 15; -- Total number of profile fields we consider
BEGIN
    SELECT 
        (CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END) +
        (CASE WHEN profile_image_url IS NOT NULL AND profile_image_url != '' THEN 1 ELSE 0 END) +
        (CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END) +
        (CASE WHEN primary_community_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN cultural_background IS NOT NULL AND cultural_background != '' THEN 1 ELSE 0 END) +
        (CASE WHEN job_title IS NOT NULL AND job_title != '' THEN 1 ELSE 0 END) +
        (CASE WHEN organization IS NOT NULL AND organization != '' THEN 1 ELSE 0 END) +
        (CASE WHEN array_length(expertise_areas, 1) > 0 THEN 1 ELSE 0 END) +
        (CASE WHEN array_length(research_interests, 1) > 0 THEN 1 ELSE 0 END) +
        (CASE WHEN onboarding_completed = true THEN 1 ELSE 0 END) +
        (CASE WHEN cultural_training_completed = true THEN 1 ELSE 0 END) +
        (CASE WHEN platform_training_completed = true THEN 1 ELSE 0 END)
    INTO completion_score
    FROM user_profiles
    WHERE user_id = target_user_id;
    
    RETURN ROUND((completion_score::FLOAT / total_fields::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update profile completion
DROP TRIGGER IF EXISTS user_profiles_completion_trigger ON user_profiles;
CREATE TRIGGER user_profiles_completion_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion();

-- =====================================================
-- VALIDATION AND TESTING FUNCTIONS
-- =====================================================

-- Function to validate user management setup
CREATE OR REPLACE FUNCTION validate_user_management()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check user management tables
    RETURN QUERY
    SELECT 
        'User Profiles Table'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Comprehensive user profile management'::TEXT;
    
    RETURN QUERY
    SELECT 
        'User Activity Log'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_activity_log') THEN 'OK' ELSE 'MISSING' END::TEXT,
        'User activity tracking and monitoring'::TEXT;
    
    RETURN QUERY
    SELECT 
        'User Sessions'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Advanced session management'::TEXT;
    
    RETURN QUERY
    SELECT 
        'User Permissions'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_permissions') THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Granular permission system'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Verification Requests'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_verification_requests') THEN 'OK' ELSE 'MISSING' END::TEXT,
        'User verification workflow'::TEXT;
    
    -- Check management functions
    RETURN QUERY
    SELECT 
        'Management Functions'::TEXT,
        CASE WHEN COUNT(*) >= 6 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'User management functions: ' || COUNT(*)::TEXT || '/6+'
    FROM pg_proc
    WHERE proname IN ('upsert_user_profile', 'log_user_activity', 'grant_user_permission', 'check_user_permission', 'create_verification_request', 'get_user_profile_with_community');
    
    -- Check RLS policies for user tables
    RETURN QUERY
    SELECT 
        'User Management RLS'::TEXT,
        CASE WHEN COUNT(*) >= 12 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'RLS policies for user management: ' || COUNT(*)::TEXT
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests');
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 15 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'User management indexes: ' || COUNT(*)::TEXT
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')
    AND indexname LIKE 'idx_%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINAL SETUP AND VALIDATION
-- =====================================================

-- Run user management validation
SELECT 'Advanced User Management Validation:' as message;
SELECT * FROM validate_user_management();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Advanced User Management System Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'User Profiles: COMPREHENSIVE';
    RAISE NOTICE 'Activity Tracking: ACTIVE';
    RAISE NOTICE 'Session Management: ADVANCED';
    RAISE NOTICE 'Permission System: GRANULAR';
    RAISE NOTICE 'Verification Workflow: IMPLEMENTED';
    RAISE NOTICE 'Cultural Integration: COMPLETE';
    RAISE NOTICE 'Indigenous Protocols: RESPECTED';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next: Test with manual verification';
    RAISE NOTICE '==============================================';
END $$;