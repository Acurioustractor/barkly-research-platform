-- =====================================================
-- TASK 7 - STEP 5: Test AI Analysis System
-- Comprehensive Testing of AI Analysis Results Storage
-- =====================================================

-- Register a test AI model
SELECT register_ai_model(
    'gpt-4-cultural-analysis',
    'v1.0',
    'language_model',
    'openai',
    'GPT-4 fine-tuned for Indigenous cultural analysis',
    '{"temperature": 0.3, "max_tokens": 2000}',
    true,  -- supports_cultural_context
    true   -- indigenous_knowledge_trained
) as model_id;

-- Create an analysis session
WITH test_model AS (
    SELECT id FROM ai_models WHERE model_name = 'gpt-4-cultural-analysis'
),
test_community AS (
    SELECT id FROM communities WHERE slug = 'test-community'
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
)
SELECT create_analysis_session(
    'Cultural Theme Analysis - Test Document',
    'theme_extraction',
    (SELECT id FROM test_community),
    gen_random_uuid(), -- initiated_by
    (SELECT id FROM test_model),
    ARRAY[(SELECT id FROM test_document)],
    true, -- cultural_sensitivity_mode
    '{"focus": "traditional_knowledge", "cultural_protocols": true}'
) as session_id;

-- Add some AI-generated themes
WITH test_session AS (
    SELECT id FROM analysis_sessions WHERE session_name = 'Cultural Theme Analysis - Test Document'
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
)
SELECT add_ai_theme(
    (SELECT id FROM test_document),
    (SELECT id FROM test_session),
    'Traditional Ecological Knowledge Systems',
    'Indigenous communities have developed sophisticated ecological knowledge systems over millennia, integrating spiritual, cultural, and practical understanding of natural environments.',
    0.92,  -- confidence_score
    0.88,  -- relevance_score
    ARRAY(SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM test_document) LIMIT 2),
    ARRAY['traditional', 'ecological', 'knowledge', 'indigenous', 'spiritual'],
    'gpt-4-cultural-analysis'
) as theme_id_1;

-- Add a sacred theme that requires elder review
WITH test_session AS (
    SELECT id FROM analysis_sessions WHERE session_name = 'Cultural Theme Analysis - Test Document'
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
)
SELECT add_ai_theme(
    (SELECT id FROM test_document),
    (SELECT id FROM test_session),
    'Sacred Knowledge Transmission',
    'The document discusses sacred ceremonial practices and spiritual knowledge that is traditionally passed down through specific cultural protocols.',
    0.85,  -- confidence_score
    0.91,  -- relevance_score
    ARRAY(SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM test_document) LIMIT 1),
    ARRAY['sacred', 'ceremony', 'spiritual', 'transmission', 'protocols'],
    'gpt-4-cultural-analysis'
) as theme_id_2;

-- Add some AI-generated quotes
WITH test_session AS (
    SELECT id FROM analysis_sessions WHERE session_name = 'Cultural Theme Analysis - Test Document'
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
),
test_chunk AS (
    SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM test_document) LIMIT 1
)
SELECT add_ai_quote(
    (SELECT id FROM test_document),
    (SELECT id FROM test_chunk),
    (SELECT id FROM test_session),
    'Traditional Indigenous knowledge systems have been developed over thousands of years through careful observation and interaction with the natural world.',
    0.89,  -- significance_score
    0.92,  -- relevance_score
    'key_insight',
    1,     -- start_position
    150,   -- end_position
    'gpt-4-cultural-analysis'
) as quote_id_1;

-- Add a sacred quote requiring elder approval
WITH test_session AS (
    SELECT id FROM analysis_sessions WHERE session_name = 'Cultural Theme Analysis - Test Document'
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
),
test_chunk AS (
    SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM test_document) ORDER BY chunk_index DESC LIMIT 1
)
SELECT add_ai_quote(
    (SELECT id FROM test_document),
    (SELECT id FROM test_chunk),
    (SELECT id FROM test_session),
    'Sacred knowledge requires special handling and may not be appropriate for general academic publication.',
    0.94,  -- significance_score
    0.87,  -- relevance_score
    'wisdom',
    500,   -- start_position
    600,   -- end_position
    'gpt-4-cultural-analysis'
) as quote_id_2;

SELECT 'AI analysis test data created successfully' as status;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check registered AI models
SELECT 
    model_name,
    model_version,
    model_type,
    provider,
    supports_cultural_context,
    indigenous_knowledge_trained
FROM ai_models 
WHERE model_name = 'gpt-4-cultural-analysis';

-- Check analysis session
SELECT 
    session_name,
    analysis_type,
    status,
    cultural_sensitivity_mode,
    elder_review_required,
    array_length(document_ids, 1) as documents_analyzed
FROM analysis_sessions 
WHERE session_name = 'Cultural Theme Analysis - Test Document';

-- Check extracted themes
SELECT 
    theme_name,
    cultural_significance,
    confidence_score,
    relevance_score,
    requires_elder_review,
    elder_reviewed,
    processing_status,
    array_length(supporting_chunks, 1) as supporting_chunks_count,
    array_length(key_phrases, 1) as key_phrases_count
FROM document_themes 
WHERE ai_model_name = 'gpt-4-cultural-analysis'
ORDER BY confidence_score DESC;

-- Check extracted quotes
SELECT 
    left(quote_text, 80) || '...' as quote_preview,
    quote_type,
    cultural_significance,
    significance_score,
    relevance_score,
    requires_elder_approval,
    elder_approved,
    processing_status,
    array_length(cultural_indicators, 1) as cultural_indicators_count
FROM document_quotes 
WHERE ai_model_name = 'gpt-4-cultural-analysis'
ORDER BY significance_score DESC;

-- Check analysis results
SELECT 
    ar.result_type,
    ar.confidence_score,
    ar.requires_cultural_review,
    ar.cultural_review_status,
    ar.human_validated,
    as_session.session_name
FROM analysis_results ar
JOIN analysis_sessions as_session ON as_session.id = ar.session_id
WHERE as_session.session_name = 'Cultural Theme Analysis - Test Document'
ORDER BY ar.confidence_score DESC;

-- Check global themes
SELECT 
    theme_name,
    document_count,
    avg_confidence,
    avg_relevance,
    cultural_significance,
    first_detected,
    last_detected
FROM global_themes 
WHERE community_id = (SELECT id FROM communities WHERE slug = 'test-community')
ORDER BY avg_confidence DESC;

-- Check themes requiring elder review
SELECT 
    theme_name,
    cultural_significance,
    confidence_score,
    document_count,
    created_at
FROM get_themes_for_elder_review((SELECT id FROM communities WHERE slug = 'test-community'));

-- Performance summary
SELECT 
    'AI ANALYSIS SYSTEM SUMMARY' as summary,
    (SELECT count(*) FROM ai_models) as registered_models,
    (SELECT count(*) FROM analysis_sessions) as total_sessions,
    (SELECT count(*) FROM document_themes) as total_themes,
    (SELECT count(*) FROM document_quotes) as total_quotes,
    (SELECT count(*) FROM analysis_results) as total_results,
    (SELECT count(*) FROM document_themes WHERE requires_elder_review = true) as themes_needing_review,
    (SELECT count(*) FROM document_quotes WHERE requires_elder_approval = true) as quotes_needing_approval;

SELECT 'AI analysis system testing completed successfully!' as status;