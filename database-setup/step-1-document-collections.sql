-- =====================================================
-- STEP 1: Document Collections Table
-- =====================================================

-- Create document collections for organizing documents
CREATE TABLE IF NOT EXISTS document_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Collection Information
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    collection_type TEXT DEFAULT 'general'
        CHECK (collection_type IN ('general', 'research', 'cultural', 'historical', 'ceremonial', 'educational')),
    
    -- Community and Access
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL, -- No auth.users FK for now
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    cultural_protocols JSONB DEFAULT '{}',
    requires_elder_oversight BOOLEAN DEFAULT false,
    
    -- Collection Metadata
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Research Context
    research_project_id UUID REFERENCES community_research_projects(id),
    research_methodology TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id, slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_community_type ON document_collections(community_id, collection_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_cultural ON document_collections(cultural_significance, community_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON document_collections(is_public, is_featured, created_at DESC) WHERE is_public = true;

SELECT 'Document collections table created successfully' as status;