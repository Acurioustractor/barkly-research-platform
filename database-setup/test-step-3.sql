-- Test document tags
WITH test_community AS (
    SELECT id as community_id FROM communities WHERE slug = 'test-community'
)
INSERT INTO document_tags (tag_name, tag_slug, tag_type, community_id, created_by)
SELECT 
    'Indigenous Knowledge',
    'indigenous-knowledge',
    'cultural',
    community_id,
    gen_random_uuid()
FROM test_community;

-- Add another tag
WITH test_community AS (
    SELECT id as community_id FROM communities WHERE slug = 'test-community'
)
INSERT INTO document_tags (tag_name, tag_slug, tag_type, community_id, created_by)
SELECT 
    'Research Methods',
    'research-methods',
    'methodology',
    community_id,
    gen_random_uuid()
FROM test_community;

-- Assign tags to our test document
WITH doc_and_tags AS (
    SELECT 
        d.id as document_id,
        t.id as tag_id
    FROM documents d, document_tags t
    WHERE d.filename = 'test-document.pdf'
    AND t.tag_slug IN ('indigenous-knowledge', 'research-methods')
)
INSERT INTO document_tag_assignments (document_id, tag_id, assigned_by, confidence)
SELECT 
    document_id,
    tag_id,
    gen_random_uuid(),
    0.95
FROM doc_and_tags;

SELECT 'Tags created and assigned' as status;

-- Verify the tagging
SELECT 
    d.filename,
    t.tag_name,
    t.tag_type,
    dta.confidence,
    dta.assigned_at
FROM document_tag_assignments dta
JOIN documents d ON d.id = dta.document_id
JOIN document_tags t ON t.id = dta.tag_id;