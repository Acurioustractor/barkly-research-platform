-- Create a test community first
INSERT INTO communities (name, slug, created_by)
VALUES ('Test Community', 'test-community', gen_random_uuid())
RETURNING id as community_id;

-- Get the community ID for testing
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
    uploaded_by
) 
SELECT 
    'test-document.pdf',
    'test-document.pdf',
    '/storage/test-document.pdf',
    1024,
    'application/pdf',
    'abc123def456789',
    community_id,
    gen_random_uuid()
FROM test_community;

SELECT 'Test document with community inserted successfully' as status;

-- Verify the document was inserted with sha256_hash
SELECT id, filename, sha256_hash, community_id, created_at
FROM documents
WHERE filename = 'test-document.pdf';