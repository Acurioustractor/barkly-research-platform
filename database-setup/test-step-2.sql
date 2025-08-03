-- Test adding document to collection
WITH doc_and_collection AS (
    SELECT 
        d.id as document_id,
        c.id as collection_id
    FROM documents d, document_collections c
    WHERE d.filename = 'test-document.pdf'
    AND c.slug = 'research-papers'
    LIMIT 1
)
INSERT INTO document_collection_items (document_id, collection_id, added_by, notes)
SELECT 
    document_id,
    collection_id,
    gen_random_uuid(),
    'Added for testing purposes'
FROM doc_and_collection;

SELECT 'Document added to collection' as status;

-- Verify the relationship
SELECT 
    d.filename,
    c.name as collection_name,
    dci.notes,
    dci.added_at
FROM document_collection_items dci
JOIN documents d ON d.id = dci.document_id
JOIN document_collections c ON c.id = dci.collection_id;