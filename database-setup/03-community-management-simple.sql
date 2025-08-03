-- =====================================================
-- Barkly Research Platform - Community Management System
-- Task 3: Create community management system (Simplified)
-- =====================================================

-- This script creates a comprehensive community management system
-- that supports Indigenous data sovereignty and community self-governance

-- =====================================================
-- COMMUNITY CONFIGURATION EXTENSIONS
-- =====================================================

-- Add additional community configuration fields
ALTER TABLE communities ADD COLUMN IF NOT EXISTS 
    community_type TEXT DEFAULT 'indigenous_community' 
    CHECK (community_type IN ('indigenous_community', 'research_institution', 'government_agency', 'ngo'));

ALTER TABLE communities ADD COLUMN IF NOT EXISTS geographic_region TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS traditional_territory TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT '{}';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS population_size INTEGER;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_logo_url TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS contact_person_name TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS contact_person_role TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_website TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}';

-- Add community status and verification
ALTER TABLE communities ADD COLUMN IF NOT EXISTS 
    verification_status TEXT DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'verified', 'suspended', 'archived'));

ALTER TABLE communities ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- =====================================================
-- COMMUNITY MEMBERSHIP MANAGEMENT
-- =====================================================

-- Create community memberships table for detailed member management
CREATE TABLE IF NOT EXISTS community_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Membership details
    role TEXT NOT NULL DEFAULT 'member' 
        CHECK (role IN ('member', 'researcher', 'elder', 'cultural_keeper', 'admin', 'community_admin')),
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
    
    -- Permissions and access
    permissions JSONB DEFAULT '{}',
    access_level TEXT DEFAULT 'standard' 
        CHECK (access_level IN ('restricted', 'standard', 'elevated', 'full')),
    
    -- Cultural context
    cultural_role TEXT,
    cultural_permissions JSONB DEFAULT '{}',
    
    -- Membership timeline
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id, user_id)
);

-- Enable RLS on community memberships
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMUNITY DATA GOVERNANCE POLICIES
-- =====================================================

-- Create table for detailed data governance policies
CREATE TABLE IF NOT EXISTS community_data_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Policy details
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL 
        CHECK (policy_type IN ('data_access', 'data_sharing', 'cultural_protocol', 'research_ethics', 'publication')),
    policy_version TEXT DEFAULT '1.0',
    
    -- Policy content
    policy_description TEXT NOT NULL,
    policy_rules JSONB NOT NULL DEFAULT '{}',
    enforcement_level TEXT DEFAULT 'mandatory' 
        CHECK (enforcement_level IN ('advisory', 'recommended', 'mandatory', 'strict')),
    
    -- Cultural context
    cultural_significance TEXT DEFAULT 'standard' 
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    traditional_law_basis TEXT,
    elder_approval_required BOOLEAN DEFAULT false,
    
    -- Approval and activation
    status TEXT DEFAULT 'draft' 
        CHECK (status IN ('draft', 'review', 'approved', 'active', 'suspended', 'archived')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on community data policies
ALTER TABLE community_data_policies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMUNITY RESEARCH PROJECTS
-- =====================================================

-- Create table for community research projects
CREATE TABLE IF NOT EXISTS community_research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Project details
    project_name TEXT NOT NULL,
    project_description TEXT,
    research_question TEXT,
    methodology TEXT,
    
    -- Project classification
    project_type TEXT DEFAULT 'community_led' 
        CHECK (project_type IN ('community_led', 'collaborative', 'external_partnership', 'academic_research')),
    research_area TEXT,
    
    -- Cultural considerations
    cultural_sensitivity_level TEXT DEFAULT 'community' 
        CHECK (cultural_sensitivity_level IN ('public', 'community', 'restricted', 'sacred')),
    cultural_protocols_required JSONB DEFAULT '{}',
    elder_oversight_required BOOLEAN DEFAULT false,
    
    -- Project timeline
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    
    -- Project status
    status TEXT DEFAULT 'planning' 
        CHECK (status IN ('planning', 'approved', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Collaboration
    lead_researcher UUID REFERENCES auth.users(id),
    collaborators UUID[] DEFAULT '{}',
    external_partners TEXT[] DEFAULT '{}',
    
    -- Funding and resources
    funding_source TEXT,
    budget_allocated DECIMAL(10,2),
    resources_required JSONB DEFAULT '{}',
    
    -- Outcomes and impact
    expected_outcomes TEXT,
    community_benefits TEXT,
    knowledge_sharing_plan TEXT,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on community research projects
ALTER TABLE community_research_projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Community memberships indexes
CREATE INDEX IF NOT EXISTS idx_memberships_community ON community_memberships(community_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON community_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON community_memberships(role, access_level);
CREATE INDEX IF NOT EXISTS idx_memberships_active ON community_memberships(last_active_at DESC) WHERE status = 'active';

-- Community data policies indexes
CREATE INDEX IF NOT EXISTS idx_data_policies_community ON community_data_policies(community_id, status);
CREATE INDEX IF NOT EXISTS idx_data_policies_type ON community_data_policies(policy_type, enforcement_level);
CREATE INDEX IF NOT EXISTS idx_data_policies_active ON community_data_policies(community_id, activated_at DESC) WHERE status = 'active';

-- Community research projects indexes
CREATE INDEX IF NOT EXISTS idx_research_projects_community ON community_research_projects(community_id, status);
CREATE INDEX IF NOT EXISTS idx_research_projects_lead ON community_research_projects(lead_researcher, status);
CREATE INDEX IF NOT EXISTS idx_research_projects_type ON community_research_projects(project_type, research_area);
CREATE INDEX IF NOT EXISTS idx_research_projects_active ON community_research_projects(status, start_date DESC) WHERE status IN ('active', 'approved');

-- =====================================================
-- BASIC RLS POLICIES
-- =====================================================

-- Community Memberships RLS Policies
DROP POLICY IF EXISTS "Members can view their own memberships" ON community_memberships;
CREATE POLICY "Members can view their own memberships" ON community_memberships
    FOR SELECT USING (
        is_authenticated() AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Community admins can view all memberships" ON community_memberships;
CREATE POLICY "Community admins can view all memberships" ON community_memberships
    FOR SELECT USING (
        is_authenticated() AND is_community_admin(community_id)
    );

DROP POLICY IF EXISTS "Community admins can manage memberships" ON community_memberships;
CREATE POLICY "Community admins can manage memberships" ON community_memberships
    FOR ALL USING (
        is_authenticated() AND is_community_admin(community_id)
    ) WITH CHECK (
        is_authenticated() AND is_community_admin(community_id)
    );

-- Community Data Policies RLS Policies
DROP POLICY IF EXISTS "Community members can view active policies" ON community_data_policies;
CREATE POLICY "Community members can view active policies" ON community_data_policies
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id() AND status = 'active'
            OR is_community_admin(community_id)
        )
    );

DROP POLICY IF EXISTS "Community admins can manage policies" ON community_data_policies;
CREATE POLICY "Community admins can manage policies" ON community_data_policies
    FOR ALL USING (
        is_authenticated() AND is_community_admin(community_id)
    ) WITH CHECK (
        is_authenticated() AND is_community_admin(community_id)
    );

-- Community Research Projects RLS Policies
DROP POLICY IF EXISTS "Community members can view community projects" ON community_research_projects;
CREATE POLICY "Community members can view community projects" ON community_research_projects
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR auth.uid() = ANY(collaborators)
            OR is_community_admin(community_id)
        )
    );

DROP POLICY IF EXISTS "Project leads and admins can manage projects" ON community_research_projects;
CREATE POLICY "Project leads and admins can manage projects" ON community_research_projects
    FOR ALL USING (
        is_authenticated() AND (
            lead_researcher = auth.uid()
            OR is_community_admin(community_id)
        )
    ) WITH CHECK (
        is_authenticated() AND (
            lead_researcher = auth.uid()
            OR is_community_admin(community_id)
        )
    );

-- =====================================================
-- ADD AUDIT TRIGGERS
-- =====================================================

-- Add audit trigger to community memberships
DROP TRIGGER IF EXISTS community_memberships_audit_trigger ON community_memberships;
CREATE TRIGGER community_memberships_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON community_memberships
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger to community data policies
DROP TRIGGER IF EXISTS community_data_policies_audit_trigger ON community_data_policies;
CREATE TRIGGER community_data_policies_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON community_data_policies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger to community research projects
DROP TRIGGER IF EXISTS community_research_projects_audit_trigger ON community_research_projects;
CREATE TRIGGER community_research_projects_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON community_research_projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();