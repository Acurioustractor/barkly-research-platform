-- =====================================================
-- STEP 3: Document Tags System
-- =====================================================

-- Create table for document tags with cultural context
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tag Information
    tag_name TEXT NOT NULL,
    tag_slug TEXT NOT NULL,
    tag_type TEXT DEFAULT 'general'
        CHECK (tag_type IN ('general', 'cultural', 'research', 'subject', 'methodology', 'location', 'person', 'event')),
    
    -- Cultural Context
    cultural_category TEXT,
    traditional_term TEXT, -- Traditional/Indigenous term for the concept
    cultural_protocols JSONB DEFAULT '{}',
    requires_cultural_approval BOOLEAN DEFAULT false,
    
    -- Community Context
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL, -- No auth.users FK for now
    approved_by UUID, -- No auth.users FK for now
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id, tag_slug)
);

-- Create junction table for document-tag relationships
CREATE TABLE IF NOT EXISTS document_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
    
    -- Assignment Context
    assigned_by UUID NOT NULL, -- No auth.users FK for now
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Cultural Approval
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID, -- No auth.users FK for now
    approved_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(document_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_community_type ON document_tags(community_id, tag_type, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_name_search ON document_tags(tag_name, community_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_document ON document_tag_assignments(document_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON document_tag_assignments(tag_id, confidence DESC);

SELECT 'Document tags system created successfully' as status;