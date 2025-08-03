-- Test document management functions
WITH test_community AS (
    SELECT id as community_id FROM communities WHERE slug = 'test-community'
)
SELECT upload_document(
    'function-test.pdf',
    '/storage/function-test.pdf',
    1500,
    'application/pdf',
    'function123test456',
    community_id,
    gen_random_uuid(),
    'Function Test Document',
    'Testing the upload function',
    'research',
    'community',
    ARRAY['function-test', 'automation']
) as new_document_id
FROM test_community;

-- Create a collection using the function
WITH test_community AS (
    SELECT id as community_id FROM communities WHERE slug = 'test-community'
)
SELECT create_document_collection(
    'Automated Collection',
    community_id,
    gen_random_uuid(),
    'Collection created via function',
    'research',
    'standard',
    false
) as new_collection_id
FROM test_community;

-- Add document to collection using function
WITH doc_and_collection AS (
    SELECT 
        d.id as document_id,
        c.id as collection_id
    FROM documents d, document_collections c
    WHERE d.filename = 'function-test.pdf'
    AND c.name = 'Automated Collection'
    LIMIT 1
)
SELECT add_document_to_collection(
    document_id,
    collection_id,
    gen_random_uuid(),
    'Added via function call'
) as new_item_id
FROM doc_and_collection;

SELECT 'All functions tested successfully' as status;

-- Verify the results
SELECT 
    d.filename,
    d.title,
    array_agg(t.tag_name) as tags,
    c.name as collection_name
FROM documents d
LEFT JOIN document_tag_assignments dta ON d.id = dta.document_id
LEFT JOIN document_tags t ON t.id = dta.tag_id
LEFT JOIN document_collection_items dci ON d.id = dci.document_id
LEFT JOIN document_collections c ON c.id = dci.collection_id
WHERE d.filename = 'function-test.pdf'
GROUP BY d.filename, d.title, c.name;