-- =====================================================
-- STEP 2: Document Collection Items (Junction Table)
-- =====================================================

-- Create junction table for document-collection relationships
CREATE TABLE IF NOT EXISTS document_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES document_collections(id) ON DELETE CASCADE,
    
    -- Relationship Metadata
    added_by UUID NOT NULL, -- No auth.users FK for now
    added_at TIMESTAMPTZ DEFAULT NOW(),
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Cultural Context
    cultural_justification TEXT,
    elder_approved BOOLEAN DEFAULT false,
    elder_approved_by UUID, -- No auth.users FK for now
    elder_approved_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(document_id, collection_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON document_collection_items(collection_id, sort_order, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_items_document ON document_collection_items(document_id, added_at DESC);

SELECT 'Document collection items table created successfully' as status;