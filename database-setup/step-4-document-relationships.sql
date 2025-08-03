-- =====================================================
-- STEP 4: Document Relationships
-- =====================================================

-- Create table for document relationships and references
CREATE TABLE IF NOT EXISTS document_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Relationship Type
    relationship_type TEXT NOT NULL
        CHECK (relationship_type IN ('references', 'cited_by', 'translation_of', 'version_of', 'related_to', 'part_of', 'contains', 'responds_to', 'cultural_connection')),
    
    -- Relationship Metadata
    relationship_description TEXT,
    cultural_significance TEXT,
    strength DECIMAL(3,2) DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0),
    
    -- Context
    created_by UUID NOT NULL, -- No auth.users FK for now
    verified_by UUID, -- No auth.users FK for now
    verification_date TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source_document_id, target_document_id, relationship_type),
    CHECK (source_document_id != target_document_id) -- Prevent self-references
);

-- Create document versions table for version tracking
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Version Information
    version_number INTEGER NOT NULL,
    version_type TEXT DEFAULT 'revision'
        CHECK (version_type IN ('revision', 'translation', 'format_conversion', 'cultural_adaptation')),
    
    -- File Information
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    sha256_hash TEXT NOT NULL,
    
    -- Version Metadata
    version_notes TEXT,
    changes_summary TEXT,
    cultural_adaptations TEXT,
    
    -- Version Context
    created_by UUID NOT NULL, -- No auth.users FK for now
    approved_by UUID, -- No auth.users FK for now
    approval_required BOOLEAN DEFAULT false,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, version_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationships_source ON document_relationships(source_document_id, relationship_type, strength DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON document_relationships(target_document_id, relationship_type, strength DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc_version ON document_versions(document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at DESC);

SELECT 'Document relationships and versions created successfully' as status;