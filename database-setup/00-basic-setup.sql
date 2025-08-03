-- Basic Database Setup for Barkly Research Platform
-- Run this in your Supabase SQL Editor to set up core tables

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

-- Enable Row Level Security on all tables
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

-- Basic RLS policies (more comprehensive policies would be added later)

-- Communities: Users can read communities they're associated with
CREATE POLICY "Users can view communities" ON communities
  FOR SELECT USING (true); -- For now, allow reading all communities

-- User profiles: Users can manage their own profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents: Basic access control based on cultural sensitivity
-- First, let's create simple policies and then we can enhance them later
CREATE POLICY "Users can view documents" ON documents
  FOR SELECT USING (
    cultural_sensitivity = 'public' OR 
    (cultural_sensitivity = 'community' AND community_id IN (
      SELECT community_id FROM user_profiles WHERE user_id = auth.uid()
    )) OR
    uploaded_by = auth.uid()
  );

CREATE POLICY "Users can insert documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = uploaded_by);

-- Document chunks inherit document permissions
CREATE POLICY "Users can view document chunks" ON document_chunks
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE 
        cultural_sensitivity = 'public' OR 
        (cultural_sensitivity = 'community' AND community_id IN (
          SELECT community_id FROM user_profiles WHERE user_id = auth.uid()
        )) OR
        uploaded_by = auth.uid()
    )
  );

-- Document themes follow document access
CREATE POLICY "Users can view document themes" ON document_themes
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE 
        cultural_sensitivity = 'public' OR 
        uploaded_by = auth.uid()
    )
  );

-- Document quotes follow document access  
CREATE POLICY "Users can view document quotes" ON document_quotes
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE 
        cultural_sensitivity = 'public' OR 
        uploaded_by = auth.uid()
    )
  );

-- Collections policies
CREATE POLICY "Users can view collections" ON document_collections
  FOR SELECT USING (
    access_level = 'public' OR 
    created_by = auth.uid() OR
    (access_level = 'community' AND community_id IN (
      SELECT community_id FROM user_profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create collections" ON document_collections
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Collection documents policies
CREATE POLICY "Users can view collection documents" ON collection_documents
  FOR SELECT USING (
    collection_id IN (
      SELECT id FROM document_collections WHERE 
        access_level = 'public' OR 
        created_by = auth.uid()
    )
  );

-- Collaboration sessions policies
CREATE POLICY "Users can view their collaboration sessions" ON collaboration_sessions
  FOR SELECT USING (auth.uid() = ANY(participants));

-- Search analytics policies
CREATE POLICY "Users can view own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert search analytics" ON search_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insert some test data
INSERT INTO communities (name, description, cultural_protocols) VALUES 
('Test Community', 'A test community for platform validation', '{"data_sovereignty": true, "elder_approval_required": false}')
ON CONFLICT DO NOTHING;

-- Verify the setup by checking table creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('communities', 'user_profiles', 'documents', 'document_chunks', 'document_themes');
    
    IF table_count >= 5 THEN
        RAISE NOTICE 'SUCCESS: Core tables created successfully (% tables found)', table_count;
    ELSE
        RAISE NOTICE 'WARNING: Only % core tables found, expected at least 5', table_count;
    END IF;
END $$;

-- Test vector extension
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE NOTICE 'SUCCESS: Vector extension is installed and ready';
    ELSE
        RAISE NOTICE 'WARNING: Vector extension not found - vector search may not work';
    END IF;
END $$;

-- Success message
SELECT 'Basic database setup completed successfully! You can now run tests.' as setup_status;