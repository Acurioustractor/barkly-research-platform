-- =====================================================
-- TASK 6 - FINAL TEST: Complete Chunking System
-- =====================================================

-- Test entity extraction on our chunks
UPDATE document_chunks 
SET entities = extract_entities(content)
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf');

-- Test entity relationship creation
SELECT create_entity_relationships(id) as relationships_created
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
ORDER BY chunk_index
LIMIT 1;

-- View the extracted entities
SELECT 
    chunk_index,
    entities->'people' as people,
    entities->'places' as places,
    entities->'cultural_terms' as cultural_terms,
    left(content, 80) || '...' as content_preview
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
ORDER BY chunk_index;

-- View chunk relationships
SELECT 
    cr.relationship_type,
    cr.similarity_score,
    cr.confidence,
    cr.created_by_model,
    dc1.chunk_index as source_chunk,
    dc2.chunk_index as target_chunk
FROM chunk_relationships cr
JOIN document_chunks dc1 ON dc1.id = cr.source_chunk_id
JOIN document_chunks dc2 ON dc2.id = cr.target_chunk_id
WHERE dc1.document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf');

-- Test RLS policies by checking chunk access
SELECT 
    'RLS Test: Chunks accessible' as test_name,
    count(*) as chunk_count
FROM document_chunks;

-- Test cultural sensitivity filtering
SELECT 
    cultural_sensitivity_level,
    count(*) as chunk_count,
    bool_or(requires_elder_review) as has_elder_review_required
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
GROUP BY cultural_sensitivity_level;

-- Performance test: Search chunks by content
SELECT 
    chunk_index,
    ts_rank(to_tsvector('english', content), plainto_tsquery('english', 'traditional knowledge')) as rank,
    left(content, 60) || '...' as content_preview
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
AND to_tsvector('english', content) @@ plainto_tsquery('english', 'traditional knowledge')
ORDER BY rank DESC;

-- Summary statistics
SELECT 
    'CHUNKING SYSTEM SUMMARY' as summary,
    (SELECT count(*) FROM document_chunks) as total_chunks,
    (SELECT count(*) FROM chunk_relationships) as total_relationships,
    (SELECT count(*) FROM chunk_topics) as total_topics,
    (SELECT count(*) FROM document_chunks WHERE requires_elder_review = true) as sacred_chunks,
    (SELECT count(*) FROM document_chunks WHERE array_length(traditional_knowledge_indicators, 1) > 0) as cultural_chunks;

SELECT 'Document chunking system implementation completed successfully!' as status;