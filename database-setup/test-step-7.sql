-- Test audit logging system
-- Insert a new document to trigger audit logging
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
    title,
    cultural_sensitivity_level
) 
SELECT 
    'audit-test-document.pdf',
    'audit-test-document.pdf',
    '/storage/audit-test-document.pdf',
    1800,
    'application/pdf',
    'audittest123456789',
    community_id,
    gen_random_uuid(),
    'Audit Test Document',
    'sacred'
FROM test_community;

-- Update the document to trigger update audit
UPDATE documents 
SET title = 'Updated Audit Test Document',
    description = 'This document has been updated for audit testing'
WHERE filename = 'audit-test-document.pdf';

-- Test data access logging
SELECT log_data_access(
    'documents',
    'SELECT',
    (SELECT id FROM documents WHERE filename = 'audit-test-document.pdf'),
    (SELECT id FROM communities WHERE slug = 'test-community'),
    jsonb_build_object(
        'access_reason', 'audit_testing',
        'user_role', 'admin',
        'cultural_clearance', true
    )
);

SELECT 'Audit logging tests completed' as status;

-- Check audit log entries
SELECT 
    table_name,
    operation,
    cultural_sensitivity_level,
    cultural_protocols_involved,
    elder_oversight_required,
    array_length(changed_fields, 1) as fields_changed,
    created_at
FROM audit_log 
WHERE table_name = 'documents'
ORDER BY created_at DESC 
LIMIT 5;

-- Check data access log entries
SELECT 
    table_name,
    operation,
    cultural_sensitivity_level,
    metadata->>'access_reason' as access_reason,
    created_at
FROM data_access_log 
WHERE table_name = 'documents'
ORDER BY created_at DESC 
LIMIT 3;