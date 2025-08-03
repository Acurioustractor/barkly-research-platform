-- =====================================================
-- TASK 6 - STEP 3: Test Intelligent Chunking System
-- =====================================================

-- First, add some text content to our test document
UPDATE documents 
SET text_content = 'Traditional Indigenous knowledge systems have been developed over thousands of years through careful observation and interaction with the natural world. These knowledge systems encompass understanding of local ecosystems, medicinal plants, sustainable resource management, and cultural practices that maintain harmony between communities and their environment.

Elder Mary Johnson explains that traditional ecological knowledge is not just about facts and information, but represents a holistic worldview that integrates spiritual, cultural, and practical dimensions of life. This sacred knowledge is passed down through generations via oral traditions, ceremonies, and hands-on learning experiences.

The integration of traditional knowledge with modern research methods offers valuable insights for contemporary environmental challenges. However, this integration must be approached with respect for Indigenous data sovereignty and cultural protocols. Sacred knowledge requires special handling and may not be appropriate for general academic publication.

Community-based research partnerships have shown promising results when Indigenous communities maintain control over their knowledge and research processes. These collaborative approaches ensure that research benefits the community while respecting cultural boundaries and traditional governance systems.

Modern technology can support traditional knowledge preservation and sharing, but only when implemented according to community-determined protocols. Digital platforms must incorporate cultural sensitivity features and access controls that honor Indigenous intellectual property rights.'
WHERE filename = 'test-document.pdf';

-- Test the chunking function
SELECT chunk_document(
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    200, -- 200 words per chunk
    25,  -- 25 word overlap
    'paragraph'
) as chunks_created;

-- Verify the chunks were created
SELECT 
    chunk_index,
    chunk_type,
    word_count,
    cultural_sensitivity_level,
    requires_elder_review,
    array_length(keywords, 1) as keyword_count,
    left(content, 100) || '...' as content_preview
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
ORDER BY chunk_index;

-- Test cultural indicator detection
SELECT 
    chunk_index,
    traditional_knowledge_indicators,
    cultural_sensitivity_level,
    requires_elder_review,
    cultural_entities
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
AND array_length(traditional_knowledge_indicators, 1) > 0
ORDER BY chunk_index;

-- Test keyword extraction
SELECT 
    chunk_index,
    keywords,
    readability_score
FROM document_chunks 
WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf')
ORDER BY readability_score DESC;

-- Test similarity finding
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

SELECT 'Chunking system tested successfully' as status;