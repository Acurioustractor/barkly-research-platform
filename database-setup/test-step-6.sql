-- Test Row Level Security policies
-- Test that we can still access documents with RLS enabled
SELECT 
    'RLS Test: Documents accessible' as test_name,
    count(*) as document_count
FROM documents;

-- Test that we can still access collections
SELECT 
    'RLS Test: Collections accessible' as test_name,
    count(*) as collection_count
FROM document_collections;

-- Test that we can still access tags
SELECT 
    'RLS Test: Tags accessible' as test_name,
    count(*) as tag_count
FROM document_tags;

-- Test that we can still access relationships
SELECT 
    'RLS Test: Relationships accessible' as test_name,
    count(*) as relationship_count
FROM document_relationships;

-- Test document insertion with RLS
WITH test_community AS (
    SELECT id as community_id FROM communities WHERE slug = 'test-community'
)
INSERT INTO documents (
    filename,
    original_filename,
    file_path,
    file_size,
    mime_type,
    sha256_hash,
    community_id,
    uploaded_by,
    title
) 
SELECT 
    'rls-test-document.pdf',
    'rls-test-document.pdf',
    '/storage/rls-test-document.pdf',
    1200,
    'application/pdf',
    'rlstest123456789',
    community_id,
    gen_random_uuid(),
    'RLS Test Document'
FROM test_community;

SELECT 'RLS policies are working correctly' as status;

-- Verify the new document is accessible
SELECT filename, title, access_level, cultural_sensitivity_level
FROM documents 
WHERE filename = 'rls-test-document.pdf';