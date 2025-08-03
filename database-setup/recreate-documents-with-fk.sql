-- Drop existing documents table and recreate with foreign keys
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table with foreign key constraints
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File Information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_extension TEXT,
    
    -- Deduplication
    sha256_hash TEXT NOT NULL,
    md5_hash TEXT,
    
    -- Document Metadata
    title TEXT,
    description TEXT,
    document_type TEXT DEFAULT 'general'
        CHECK (document_type IN ('general', 'research', 'cultural', 'administrative', 'legal', 'historical', 'ceremonial', 'sacred')),
    language TEXT DEFAULT 'en',
    languages_detected TEXT[] DEFAULT '{}',
    
    -- Cultural Sensitivity and Protocols
    cultural_sensitivity_level TEXT DEFAULT 'community'
        CHECK (cultural_sensitivity_level IN ('public', 'community', 'restricted', 'sacred', 'ceremonial')),
    cultural_protocols JSONB DEFAULT '{}',
    traditional_knowledge_category TEXT,
    requires_elder_approval BOOLEAN DEFAULT false,
    cultural_context TEXT,
    
    -- Community and Access Control
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    access_level TEXT DEFAULT 'community'
        CHECK (access_level IN ('public', 'community', 'restricted', 'private')),
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'quarantined')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Content Analysis
    content_extracted BOOLEAN DEFAULT false,
    text_content TEXT,
    content_length INTEGER,
    word_count INTEGER,
    page_count INTEGER,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),
    is_latest_version BOOLEAN DEFAULT true,
    version_notes TEXT,
    
    -- Collections and Tagging
    collections UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    subjects TEXT[] DEFAULT '{}',
    
    -- Research Context
    research_project_id UUID REFERENCES community_research_projects(id),
    research_phase TEXT,
    methodology_notes TEXT,
    
    -- Permissions and Sharing
    is_public BOOLEAN DEFAULT false,
    sharing_permissions JSONB DEFAULT '{}',
    download_allowed BOOLEAN DEFAULT true,
    print_allowed BOOLEAN DEFAULT true,
    
    -- Audit and Compliance
    retention_policy TEXT,
    retention_until DATE,
    compliance_flags JSONB DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(sha256_hash, community_id)
);

SELECT 'Documents table recreated with foreign keys' as status;