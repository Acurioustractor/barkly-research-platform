-- =====================================================
-- Minimal Document Storage System - No Foreign Keys
-- =====================================================

-- Create main documents table without foreign key constraints
CREATE TABLE IF NOT EXISTS documents (
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
    document_type TEXT DEFAULT 'general',
    language TEXT DEFAULT 'en',
    
    -- Community and Access Control
    community_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    access_level TEXT DEFAULT 'community',
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending',
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(sha256_hash, community_id)
);

-- Test the table creation
SELECT 'Documents table created successfully' as status;

-- Check if sha256_hash column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name = 'sha256_hash';