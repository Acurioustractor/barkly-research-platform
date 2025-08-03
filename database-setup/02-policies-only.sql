-- Step 2: Create RLS Policies Only
-- Run this AFTER step 1 completes successfully

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

-- Communities policies
CREATE POLICY "Users can view communities" ON communities
  FOR SELECT USING (true);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents policies
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

-- Document chunks policies
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

-- Document themes policies
CREATE POLICY "Users can view document themes" ON document_themes
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents WHERE 
        cultural_sensitivity = 'public' OR 
        uploaded_by = auth.uid()
    )
  );

-- Document quotes policies
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

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Verify setup
SELECT 'STEP 2 COMPLETE: RLS policies created successfully! Database setup is complete.' as status;