-- =====================================================
-- STEP 5: Document Management Functions
-- =====================================================

-- Function to upload a new document
CREATE OR REPLACE FUNCTION upload_document(
    p_filename TEXT,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT,
    p_sha256_hash TEXT,
    p_community_id UUID,
    p_uploaded_by UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_document_type TEXT DEFAULT 'general',
    p_cultural_sensitivity_level TEXT DEFAULT 'community',
    p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    document_id UUID;
    existing_doc_id UUID;
    tag_name TEXT;
    tag_id UUID;
    file_ext TEXT;
BEGIN
    -- Check for duplicate within community
    SELECT id INTO existing_doc_id 
    FROM documents 
    WHERE sha256_hash = p_sha256_hash AND community_id = p_community_id;
    
    IF existing_doc_id IS NOT NULL THEN
        RAISE EXCEPTION 'Document with this hash already exists in community: %', existing_doc_id;
    END IF;
    
    -- Extract file extension
    file_ext := lower(substring(p_filename from '\.([^.]*)$'));
    
    -- Insert the document
    INSERT INTO documents (
        filename,
        original_filename,
        file_path,
        file_size,
        mime_type,
        file_extension,
        sha256_hash,
        title,
        description,
        document_type,
        cultural_sensitivity_level,
        community_id,
        uploaded_by,
        processing_status
    ) VALUES (
        p_filename,
        p_filename,
        p_file_path,
        p_file_size,
        p_mime_type,
        file_ext,
        p_sha256_hash,
        COALESCE(p_title, p_filename),
        p_description,
        p_document_type,
        p_cultural_sensitivity_level,
        p_community_id,
        p_uploaded_by,
        'pending'
    ) RETURNING id INTO document_id;
    
    -- Add tags if provided
    IF array_length(p_tags, 1) > 0 THEN
        FOREACH tag_name IN ARRAY p_tags
        LOOP
            -- Get or create tag
            INSERT INTO document_tags (tag_name, tag_slug, community_id, created_by)
            VALUES (tag_name, lower(replace(tag_name, ' ', '-')), p_community_id, p_uploaded_by)
            ON CONFLICT (community_id, tag_slug) DO UPDATE SET 
                usage_count = document_tags.usage_count + 1,
                last_used_at = NOW()
            RETURNING id INTO tag_id;
            
            -- Assign tag to document
            INSERT INTO document_tag_assignments (document_id, tag_id, assigned_by)
            VALUES (document_id, tag_id, p_uploaded_by);
        END LOOP;
    END IF;
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a document collection
CREATE OR REPLACE FUNCTION create_document_collection(
    p_name TEXT,
    p_community_id UUID,
    p_created_by UUID,
    p_description TEXT DEFAULT NULL,
    p_collection_type TEXT DEFAULT 'general',
    p_cultural_significance TEXT DEFAULT 'standard',
    p_is_public BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    collection_id UUID;
    collection_slug TEXT;
BEGIN
    -- Generate slug
    collection_slug := lower(replace(regexp_replace(p_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    
    -- Insert the collection
    INSERT INTO document_collections (
        name,
        slug,
        description,
        collection_type,
        community_id,
        created_by,
        cultural_significance,
        is_public
    ) VALUES (
        p_name,
        collection_slug,
        p_description,
        p_collection_type,
        p_community_id,
        p_created_by,
        p_cultural_significance,
        p_is_public
    ) RETURNING id INTO collection_id;
    
    RETURN collection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add document to collection
CREATE OR REPLACE FUNCTION add_document_to_collection(
    p_document_id UUID,
    p_collection_id UUID,
    p_added_by UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    item_id UUID;
    doc_community_id UUID;
    collection_community_id UUID;
BEGIN
    -- Verify document and collection belong to same community
    SELECT community_id INTO doc_community_id FROM documents WHERE id = p_document_id;
    SELECT community_id INTO collection_community_id FROM document_collections WHERE id = p_collection_id;
    
    IF doc_community_id IS NULL THEN
        RAISE EXCEPTION 'Document not found';
    END IF;
    
    IF collection_community_id IS NULL THEN
        RAISE EXCEPTION 'Collection not found';
    END IF;
    
    IF doc_community_id != collection_community_id THEN
        RAISE EXCEPTION 'Document and collection must belong to the same community';
    END IF;
    
    -- Add document to collection
    INSERT INTO document_collection_items (
        document_id,
        collection_id,
        added_by,
        notes
    ) VALUES (
        p_document_id,
        p_collection_id,
        p_added_by,
        p_notes
    ) RETURNING id INTO item_id;
    
    RETURN item_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'Document management functions created successfully' as status;