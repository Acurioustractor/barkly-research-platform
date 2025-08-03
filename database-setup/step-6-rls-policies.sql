-- =====================================================
-- STEP 6: Row Level Security Policies
-- =====================================================

-- First, we need some helper functions for RLS
-- Note: These are simplified versions since we don't have full auth system

-- Simple function to check if user is authenticated (placeholder)
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$
BEGIN
    -- Placeholder - in real system this would check auth.uid()
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's community (placeholder)
CREATE OR REPLACE FUNCTION get_user_community_id() RETURNS UUID AS $$
BEGIN
    -- Placeholder - in real system this would get from user profile
    -- For now, return the test community ID
    RETURN (SELECT id FROM communities WHERE slug = 'test-community' LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is community admin (placeholder)
CREATE OR REPLACE FUNCTION is_community_admin(community_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    -- Placeholder - in real system this would check user roles
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all document tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DOCUMENTS RLS POLICIES
-- =====================================================

-- Policy: Community members can view community documents
DROP POLICY IF EXISTS "Community members can view community documents" ON documents;
CREATE POLICY "Community members can view community documents" ON documents
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
            OR (is_public = true AND access_level = 'public')
        )
    );

-- Policy: Users can upload documents to their community
DROP POLICY IF EXISTS "Users can upload documents to their community" ON documents;
CREATE POLICY "Users can upload documents to their community" ON documents
    FOR INSERT WITH CHECK (
        is_authenticated() AND 
        community_id = get_user_community_id()
    );

-- Policy: Document owners and admins can update documents
DROP POLICY IF EXISTS "Document owners and admins can update documents" ON documents;
CREATE POLICY "Document owners and admins can update documents" ON documents
    FOR UPDATE USING (
        is_authenticated() AND (
            is_community_admin(community_id)
        )
    ) WITH CHECK (
        is_authenticated() AND (
            is_community_admin(community_id)
        )
    );

-- =====================================================
-- DOCUMENT COLLECTIONS RLS POLICIES
-- =====================================================

-- Policy: Community members can view community collections
DROP POLICY IF EXISTS "Community members can view community collections" ON document_collections;
CREATE POLICY "Community members can view community collections" ON document_collections
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
            OR is_public = true
        )
    );

-- Policy: Community members can create collections
DROP POLICY IF EXISTS "Community members can create collections" ON document_collections;
CREATE POLICY "Community members can create collections" ON document_collections
    FOR INSERT WITH CHECK (
        is_authenticated() AND 
        community_id = get_user_community_id()
    );

-- Policy: Collection creators and admins can update collections
DROP POLICY IF EXISTS "Collection creators and admins can update collections" ON document_collections;
CREATE POLICY "Collection creators and admins can update collections" ON document_collections
    FOR UPDATE USING (
        is_authenticated() AND (
            is_community_admin(community_id)
        )
    );

-- =====================================================
-- DOCUMENT COLLECTION ITEMS RLS POLICIES
-- =====================================================

-- Policy: Users can view collection items they have access to
DROP POLICY IF EXISTS "Users can view collection items they have access to" ON document_collection_items;
CREATE POLICY "Users can view collection items they have access to" ON document_collection_items
    FOR SELECT USING (
        is_authenticated() AND EXISTS (
            SELECT 1 FROM document_collections dc 
            WHERE dc.id = document_collection_items.collection_id 
            AND (
                dc.community_id = get_user_community_id()
                OR is_community_admin(dc.community_id)
                OR dc.is_public = true
            )
        )
    );

-- Policy: Community members can add documents to collections
DROP POLICY IF EXISTS "Community members can add documents to collections" ON document_collection_items;
CREATE POLICY "Community members can add documents to collections" ON document_collection_items
    FOR INSERT WITH CHECK (
        is_authenticated() AND EXISTS (
            SELECT 1 FROM document_collections dc 
            WHERE dc.id = document_collection_items.collection_id 
            AND dc.community_id = get_user_community_id()
        )
    );

-- =====================================================
-- DOCUMENT TAGS RLS POLICIES
-- =====================================================

-- Policy: Community members can view community tags
DROP POLICY IF EXISTS "Community members can view community tags" ON document_tags;
CREATE POLICY "Community members can view community tags" ON document_tags
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
        )
    );

-- Policy: Community members can create tags
DROP POLICY IF EXISTS "Community members can create tags" ON document_tags;
CREATE POLICY "Community members can create tags" ON document_tags
    FOR INSERT WITH CHECK (
        is_authenticated() AND 
        community_id = get_user_community_id()
    );

-- =====================================================
-- DOCUMENT TAG ASSIGNMENTS RLS POLICIES
-- =====================================================

-- Policy: Users can view tag assignments for accessible documents
DROP POLICY IF EXISTS "Users can view tag assignments for accessible documents" ON document_tag_assignments;
CREATE POLICY "Users can view tag assignments for accessible documents" ON document_tag_assignments
    FOR SELECT USING (
        is_authenticated() AND EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_tag_assignments.document_id 
            AND (
                d.community_id = get_user_community_id()
                OR is_community_admin(d.community_id)
                OR (d.is_public = true AND d.access_level = 'public')
            )
        )
    );

-- Policy: Community members can assign tags
DROP POLICY IF EXISTS "Community members can assign tags" ON document_tag_assignments;
CREATE POLICY "Community members can assign tags" ON document_tag_assignments
    FOR INSERT WITH CHECK (
        is_authenticated() AND EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_tag_assignments.document_id 
            AND d.community_id = get_user_community_id()
        )
    );

-- =====================================================
-- DOCUMENT RELATIONSHIPS RLS POLICIES
-- =====================================================

-- Policy: Users can view document relationships
DROP POLICY IF EXISTS "Users can view document relationships" ON document_relationships;
CREATE POLICY "Users can view document relationships" ON document_relationships
    FOR SELECT USING (
        is_authenticated() AND (
            EXISTS (
                SELECT 1 FROM documents d 
                WHERE d.id = document_relationships.source_document_id 
                AND (
                    d.community_id = get_user_community_id()
                    OR is_community_admin(d.community_id)
                    OR (d.is_public = true AND d.access_level = 'public')
                )
            )
            OR EXISTS (
                SELECT 1 FROM documents d 
                WHERE d.id = document_relationships.target_document_id 
                AND (
                    d.community_id = get_user_community_id()
                    OR is_community_admin(d.community_id)
                    OR (d.is_public = true AND d.access_level = 'public')
                )
            )
        )
    );

-- =====================================================
-- DOCUMENT VERSIONS RLS POLICIES
-- =====================================================

-- Policy: Users can view document versions they have access to
DROP POLICY IF EXISTS "Users can view document versions they have access to" ON document_versions;
CREATE POLICY "Users can view document versions they have access to" ON document_versions
    FOR SELECT USING (
        is_authenticated() AND EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_versions.document_id 
            AND (
                d.community_id = get_user_community_id()
                OR is_community_admin(d.community_id)
                OR (d.is_public = true AND d.access_level = 'public')
            )
        )
    );

SELECT 'Row Level Security policies created successfully' as status;