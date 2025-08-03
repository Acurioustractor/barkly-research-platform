-- Test document relationships
-- First, create a second document to relate to
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
    'related-document.pdf',
    'related-document.pdf',
    '/storage/related-document.pdf',
    2048,
    'application/pdf',
    'def456ghi789abc',
    community_id,
    gen_random_uuid(),
    'Related Research Document'
FROM test_community;

-- Create a relationship between the documents
WITH doc_pair AS (
    SELECT 
        d1.id as source_id,
        d2.id as target_id
    FROM documents d1, documents d2
    WHERE d1.filename = 'test-document.pdf'
    AND d2.filename = 'related-document.pdf'
)
INSERT INTO document_relationships (
    source_document_id, 
    target_document_id, 
    relationship_type, 
    relationship_description,
    strength,
    created_by
)
SELECT 
    source_id,
    target_id,
    'references',
    'This document references the related research',
    0.85,
    gen_random_uuid()
FROM doc_pair;

-- Create a document version
WITH test_doc AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
)
INSERT INTO document_versions (
    document_id,
    version_number,
    version_type,
    filename,
    file_path,
    file_size,
    sha256_hash,
    version_notes,
    created_by
)
SELECT 
    id,
    2,
    'revision',
    'test-document-v2.pdf',
    '/storage/test-document-v2.pdf',
    1100,
    'version2hash123',
    'Updated with additional cultural context',
    gen_random_uuid()
FROM test_doc;

SELECT 'Document relationships and versions created' as status;

-- Verify relationships
SELECT 
    d1.filename as source_doc,
    dr.relationship_type,
    d2.filename as target_doc,
    dr.strength,
    dr.relationship_description
FROM document_relationships dr
JOIN documents d1 ON d1.id = dr.source_document_id
JOIN documents d2 ON d2.id = dr.target_document_id;

-- Verify versions
SELECT 
    d.filename as original_doc,
    dv.version_number,
    dv.version_type,
    dv.filename as version_filename,
    dv.version_notes
FROM document_versions dv
JOIN documents d ON d.id = dv.document_id;