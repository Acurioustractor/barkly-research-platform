-- Step 1: Create Tables Only (No Policies)
-- Run this first in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cultural_protocols JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    community_id UUID REFERENCES communities(id),
    cultural_affiliation TEXT,
    research_interests TEXT[],
    cultural_protocols_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    cultural_sensitivity TEXT CHECK (cultural_sensitivity IN ('public', 'community', 'restricted', 'sacred')) DEFAULT 'public',
    community_id UUID REFERENCES communities(id),
    uploaded_by UUID REFERENCES auth.users(id),
    cultural_metadata JSONB DEFAULT '{}',
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_chunks table for vector search
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_themes table for AI analysis
CREATE TABLE IF NOT EXISTS document_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    theme_name TEXT NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3,2),
    ai_model TEXT,
    cultural_significance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_quotes table
CREATE TABLE IF NOT EXISTS document_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    quote_text TEXT NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    cultural_sensitivity TEXT CHECK (cultural_sensitivity IN ('public', 'community', 'restricted', 'sacred')) DEFAULT 'public',
    requires_attribution BOOLEAN DEFAULT FALSE,
    knowledge_holder TEXT,
    theme_id UUID REFERENCES document_themes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_collections table
CREATE TABLE IF NOT EXISTS document_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID REFERENCES communities(id),
    created_by UUID REFERENCES auth.users(id),
    access_level TEXT CHECK (access_level IN ('public', 'community', 'restricted')) DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_documents junction table
CREATE TABLE IF NOT EXISTS collection_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES document_collections(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id),
    cultural_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, document_id)
);

-- Create collaboration_sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    session_type TEXT,
    participants UUID[],
    cultural_protocols_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create search_analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    search_query TEXT,
    search_type TEXT,
    results_count INTEGER,
    cultural_filters_applied JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    community_id UUID REFERENCES communities(id),
    cultural_context JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_community_id ON documents(community_id);
CREATE INDEX IF NOT EXISTS idx_documents_cultural_sensitivity ON documents(cultural_sensitivity);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_themes_document_id ON document_themes(document_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_community_id ON user_profiles(community_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_community_id ON audit_logs(community_id);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION vector_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.chunk_text,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Insert test data
INSERT INTO communities (name, description, cultural_protocols) VALUES 
('Test Community', 'A test community for platform validation', '{"data_sovereignty": true, "elder_approval_required": false}')
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 'STEP 1 COMPLETE: Tables created successfully! Now run step 2.' as status;