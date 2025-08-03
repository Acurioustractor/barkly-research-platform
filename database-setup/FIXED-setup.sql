-- FIXED Database Setup - This will work even if tables already exist
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS collection_documents CASCADE;
DROP TABLE IF EXISTS document_collections CASCADE;
DROP TABLE IF EXISTS collaboration_sessions CASCADE;
DROP TABLE IF EXISTS search_analytics CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS document_quotes CASCADE;
DROP TABLE IF EXISTS document_themes CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- Create communities table
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cultural_protocols JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_profiles table
CREATE TABLE user_profiles (
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

-- Create documents table WITH cultural_sensitivity column
CREATE TABLE documents (
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
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_themes table for AI analysis
CREATE TABLE document_themes (
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
CREATE TABLE document_quotes (
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
CREATE TABLE document_collections (
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
CREATE TABLE collection_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES document_collections(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id),
    cultural_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, document_id)
);

-- Create collaboration_sessions table
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    session_type TEXT,
    participants UUID[],
    cultural_protocols_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create search_analytics table
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    search_query TEXT,
    search_type TEXT,
    results_count INTEGER,
    cultural_filters_applied JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE audit_logs (
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

-- Create indexes
CREATE INDEX idx_documents_community_id ON documents(community_id);
CREATE INDEX idx_documents_cultural_sensitivity ON documents(cultural_sensitivity);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_themes_document_id ON document_themes(document_id);
CREATE INDEX idx_user_profiles_community_id ON user_profiles(community_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_community_id ON audit_logs(community_id);

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

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view communities" ON communities FOR SELECT USING (true);

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view documents" ON documents FOR SELECT USING (
    cultural_sensitivity = 'public' OR 
    uploaded_by = auth.uid() OR
    (cultural_sensitivity = 'community' AND community_id IN (
      SELECT community_id FROM user_profiles WHERE user_id = auth.uid()
    ))
);
CREATE POLICY "Users can insert documents" ON documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can view document chunks" ON document_chunks FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE cultural_sensitivity = 'public' OR uploaded_by = auth.uid())
);

CREATE POLICY "Users can view document themes" ON document_themes FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE cultural_sensitivity = 'public' OR uploaded_by = auth.uid())
);

CREATE POLICY "Users can view document quotes" ON document_quotes FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE cultural_sensitivity = 'public' OR uploaded_by = auth.uid())
);

CREATE POLICY "Users can view collections" ON document_collections FOR SELECT USING (
    access_level = 'public' OR created_by = auth.uid()
);
CREATE POLICY "Users can create collections" ON document_collections FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view collection documents" ON collection_documents FOR SELECT USING (
    collection_id IN (SELECT id FROM document_collections WHERE access_level = 'public' OR created_by = auth.uid())
);

CREATE POLICY "Users can view their collaboration sessions" ON collaboration_sessions FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can view own search analytics" ON search_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert search analytics" ON search_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Insert test data
INSERT INTO communities (name, description, cultural_protocols) VALUES 
('Test Community', 'A test community for platform validation', '{"data_sovereignty": true, "elder_approval_required": false}');

-- Success message
SELECT 'DATABASE SETUP COMPLETE! All tables created with cultural_sensitivity column. Run npm run test:simple now.' as status;