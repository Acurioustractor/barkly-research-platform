-- =====================================================
-- TASK 9 - STEP 1: Research Collections Infrastructure
-- Collaborative Research Collections and Project Management
-- =====================================================

-- Create research projects table for organizing research initiatives
CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Project Information
    project_name TEXT NOT NULL,
    project_slug TEXT NOT NULL,
    project_description TEXT,
    project_type TEXT DEFAULT 'general'
        CHECK (project_type IN ('general', 'cultural_preservation', 'language_documentation', 'oral_history', 'environmental_study', 'community_mapping', 'genealogy', 'traditional_knowledge')),
    
    -- Community Context
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    lead_researcher_id UUID NOT NULL, -- Would reference auth.users in real system
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    cultural_protocols JSONB DEFAULT '{}',
    requires_elder_oversight BOOLEAN DEFAULT false,
    elder_oversight_contact UUID, -- Elder responsible for oversight
    traditional_knowledge_involved BOOLEAN DEFAULT false,
    
    -- Project Status
    status TEXT DEFAULT 'planning'
        CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived', 'cancelled')),
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Research Methodology
    research_methodology TEXT,
    data_collection_methods TEXT[] DEFAULT '{}',
    analysis_methods TEXT[] DEFAULT '{}',
    ethical_considerations TEXT,
    community_consent_obtained BOOLEAN DEFAULT false,
    ethics_approval_reference TEXT,
    
    -- Collaboration
    is_collaborative BOOLEAN DEFAULT true,
    collaboration_type TEXT DEFAULT 'community_led'
        CHECK (collaboration_type IN ('community_led', 'researcher_led', 'co_designed', 'participatory')),
    external_partners TEXT[] DEFAULT '{}',
    
    -- Access and Sharing
    visibility TEXT DEFAULT 'community'
        CHECK (visibility IN ('private', 'community', 'public', 'restricted')),
    sharing_permissions JSONB DEFAULT '{}',
    data_sharing_agreement TEXT,
    
    -- Funding and Resources
    funding_source TEXT,
    budget_allocated DECIMAL(12,2),
    resources_required TEXT[] DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id, project_slug)
);

-- Create research collections table (enhanced version of document_collections)
CREATE TABLE IF NOT EXISTS research_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Collection Information
    collection_name TEXT NOT NULL,
    collection_slug TEXT NOT NULL,
    collection_description TEXT,
    collection_type TEXT DEFAULT 'general'
        CHECK (collection_type IN ('general', 'primary_sources', 'interviews', 'artifacts', 'multimedia', 'analysis', 'publications', 'field_notes')),
    
    -- Project Context
    research_project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL, -- Would reference auth.users
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    cultural_protocols JSONB DEFAULT '{}',
    requires_elder_approval BOOLEAN DEFAULT false,
    elder_approved BOOLEAN DEFAULT false,
    elder_approved_by UUID,
    elder_approved_at TIMESTAMPTZ,
    traditional_knowledge_category TEXT,
    
    -- Collection Metadata
    research_phase TEXT DEFAULT 'data_collection'
        CHECK (research_phase IN ('planning', 'data_collection', 'analysis', 'interpretation', 'writing', 'review', 'publication')),
    methodology_notes TEXT,
    data_collection_date_range DATERANGE,
    geographic_scope TEXT,
    participant_demographics JSONB DEFAULT '{}',
    
    -- Access Control
    access_level TEXT DEFAULT 'project_team'
        CHECK (access_level IN ('private', 'project_team', 'community', 'public')),
    sharing_restrictions TEXT,
    embargo_until DATE,
    
    -- Collaboration
    collaborative_collection BOOLEAN DEFAULT true,
    contributors UUID[] DEFAULT '{}', -- Array of contributor user IDs
    contribution_guidelines TEXT,
    
    -- Quality and Validation
    peer_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID[] DEFAULT '{}',
    quality_score DECIMAL(3,2) DEFAULT 0.0,
    validation_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(research_project_id, collection_slug)
);

-- Create collection documents junction table with research context
CREATE TABLE IF NOT EXISTS collection_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    collection_id UUID NOT NULL REFERENCES research_collections(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Research Context
    added_by UUID NOT NULL, -- User who added document to collection
    added_at TIMESTAMPTZ DEFAULT NOW(),
    research_relevance TEXT,
    methodology_role TEXT DEFAULT 'primary_source'
        CHECK (methodology_role IN ('primary_source', 'secondary_source', 'analysis', 'reference', 'background', 'methodology', 'findings')),
    
    -- Document Role in Research
    document_significance TEXT DEFAULT 'supporting'
        CHECK (document_significance IN ('critical', 'important', 'supporting', 'reference')),
    analysis_notes TEXT,
    coding_tags TEXT[] DEFAULT '{}', -- Research coding tags
    
    -- Cultural Context
    cultural_sensitivity_notes TEXT,
    requires_cultural_review BOOLEAN DEFAULT false,
    cultural_review_status TEXT DEFAULT 'pending'
        CHECK (cultural_review_status IN ('pending', 'approved', 'needs_modification', 'restricted')),
    
    -- Ordering and Organization
    sort_order INTEGER DEFAULT 0,
    section_grouping TEXT, -- For organizing documents within collection
    
    -- Validation
    peer_validated BOOLEAN DEFAULT false,
    validation_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Constraints
    UNIQUE(collection_id, document_id)
);

-- Create research milestones table for project tracking
CREATE TABLE IF NOT EXISTS research_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Milestone Information
    milestone_name TEXT NOT NULL,
    milestone_description TEXT,
    milestone_type TEXT DEFAULT 'deliverable'
        CHECK (milestone_type IN ('deliverable', 'review', 'approval', 'publication', 'presentation', 'data_collection', 'analysis')),
    
    -- Project Context
    research_project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES research_collections(id), -- Optional: milestone tied to specific collection
    
    -- Timeline
    target_date DATE NOT NULL,
    actual_completion_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Cultural Context
    requires_elder_approval BOOLEAN DEFAULT false,
    elder_approval_obtained BOOLEAN DEFAULT false,
    cultural_protocols_required JSONB DEFAULT '{}',
    
    -- Dependencies
    depends_on_milestones UUID[] DEFAULT '{}', -- Array of milestone IDs this depends on
    blocks_milestones UUID[] DEFAULT '{}', -- Array of milestone IDs this blocks
    
    -- Responsibility
    assigned_to UUID, -- User responsible for milestone
    reviewed_by UUID[] DEFAULT '{}',
    
    -- Status and Notes
    status TEXT DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'under_review', 'completed', 'overdue', 'cancelled')),
    status_notes TEXT,
    deliverables TEXT[] DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research collaboration table for team management
CREATE TABLE IF NOT EXISTS research_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Collaboration Context
    research_project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES research_collections(id), -- Optional: collaboration on specific collection
    
    -- Collaborator Information
    collaborator_id UUID NOT NULL, -- Would reference auth.users
    role TEXT NOT NULL
        CHECK (role IN ('lead_researcher', 'co_researcher', 'community_liaison', 'elder_advisor', 'cultural_consultant', 'data_analyst', 'reviewer', 'contributor')),
    
    -- Permissions
    can_add_documents BOOLEAN DEFAULT false,
    can_edit_collections BOOLEAN DEFAULT false,
    can_manage_collaborators BOOLEAN DEFAULT false,
    can_approve_cultural_content BOOLEAN DEFAULT false,
    can_publish_results BOOLEAN DEFAULT false,
    
    -- Cultural Context
    cultural_role TEXT, -- Traditional role in community research
    cultural_authority_areas TEXT[] DEFAULT '{}', -- Areas of cultural expertise
    elder_status BOOLEAN DEFAULT false,
    
    -- Collaboration Details
    contribution_type TEXT[] DEFAULT '{}', -- Types of contributions expected
    time_commitment TEXT, -- Expected time commitment
    compensation_type TEXT DEFAULT 'volunteer'
        CHECK (compensation_type IN ('volunteer', 'honorarium', 'salary', 'in_kind', 'community_benefit')),
    
    -- Status
    status TEXT DEFAULT 'active'
        CHECK (status IN ('invited', 'active', 'inactive', 'completed', 'withdrawn')),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    
    -- Agreement and Consent
    collaboration_agreement_signed BOOLEAN DEFAULT false,
    data_sharing_consent BOOLEAN DEFAULT false,
    cultural_protocols_acknowledged BOOLEAN DEFAULT false,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(research_project_id, collaborator_id, role)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Research projects indexes
CREATE INDEX IF NOT EXISTS idx_research_projects_community ON research_projects(community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_projects_type ON research_projects(project_type, cultural_significance, status);
CREATE INDEX IF NOT EXISTS idx_research_projects_dates ON research_projects(start_date, target_completion_date, status);
CREATE INDEX IF NOT EXISTS idx_research_projects_cultural ON research_projects(cultural_significance, requires_elder_oversight, traditional_knowledge_involved);

-- Research collections indexes
CREATE INDEX IF NOT EXISTS idx_research_collections_project ON research_collections(research_project_id, research_phase, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_collections_community ON research_collections(community_id, access_level, cultural_significance);
CREATE INDEX IF NOT EXISTS idx_research_collections_type ON research_collections(collection_type, research_phase, peer_reviewed);
CREATE INDEX IF NOT EXISTS idx_research_collections_cultural ON research_collections(cultural_significance, requires_elder_approval, elder_approved);

-- Collection documents indexes
CREATE INDEX IF NOT EXISTS idx_collection_documents_collection ON collection_documents(collection_id, sort_order, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_documents_document ON collection_documents(document_id, methodology_role, document_significance);
CREATE INDEX IF NOT EXISTS idx_collection_documents_research ON collection_documents(methodology_role, document_significance, peer_validated);

-- Research milestones indexes
CREATE INDEX IF NOT EXISTS idx_research_milestones_project ON research_milestones(research_project_id, target_date, status);
CREATE INDEX IF NOT EXISTS idx_research_milestones_dates ON research_milestones(target_date, actual_completion_date, is_completed);
CREATE INDEX IF NOT EXISTS idx_research_milestones_status ON research_milestones(status, completion_percentage, target_date);

-- Research collaborations indexes
CREATE INDEX IF NOT EXISTS idx_research_collaborations_project ON research_collaborations(research_project_id, role, status);
CREATE INDEX IF NOT EXISTS idx_research_collaborations_user ON research_collaborations(collaborator_id, status, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_collaborations_cultural ON research_collaborations(elder_status, cultural_authority_areas) WHERE elder_status = true;

SELECT 'Research collections infrastructure created successfully' as status;