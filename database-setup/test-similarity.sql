-- Test the fixed similarity function
WITH first_chunk AS (
    SELECT id FROM document_chunks 
    WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
    ORDER BY chunk_index 
    LIMIT 1
)
SELECT 
    similarity_score,
    content_preview
FROM find_similar_chunks((SELECT id FROM first_chunk), 5);

SELECT 'Similarity function tested successfully' as status;