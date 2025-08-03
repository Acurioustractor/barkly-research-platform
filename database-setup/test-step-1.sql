-- Test document collections
WITH test_community AS (
    SELECT id as community_id FROM communities WHERE slug = 'test-community'
)
INSERT INTO document_collections (name, slug, description, community_id, created_by, collection_type)
SELECT 
    'Research Papers',
    'research-papers',
    'Collection of academic research papers',
    community_id,
    gen_random_uuid(),
    'research'
FROM test_community;

SELECT 'Test collection created' as status;

-- Verify the collection
SELECT id, name, slug, collection_type, cultural_significance 
FROM document_collections 
WHERE slug = 'research-papers';