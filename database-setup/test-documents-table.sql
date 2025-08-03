-- Test the documents table and sha256_hash column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents' 
AND column_name = 'sha256_hash';

-- Test inserting a document
INSERT INTO documents (
    filename,
    original_filename,
    file_path,
    file_size,
    mime_type,
    sha256_hash,
    community_id,
    uploaded_by
) VALUES (
    'test-document.pdf',
    'test-document.pdf',
    '/storage/test-document.pdf',
    1024,
    'application/pdf',
    'abc123def456789',
    gen_random_uuid(),
    gen_random_uuid()
);

SELECT 'Test document inserted successfully' as status;

-- Verify the document was inserted
SELECT id, filename, sha256_hash, created_at
FROM documents
WHERE filename = 'test-document.pdf';