-- =====================================================
-- TASK 8 - STEP 4: Test Advanced Search System
-- Comprehensive Testing of Search Capabilities
-- =====================================================

-- Test basic document search
SELECT 'Testing basic document search...' as test_phase;

SELECT * FROM search_documents(
    'traditional knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'indigenous_english',
    'community_safe',
    NULL,
    10,
    0
);

-- Test chunk search
SELECT 'Testing chunk search...' as test_phase;

SELECT * FROM search_chunks(
    'indigenous knowledge systems',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'indigenous_english',
    'community_safe',
    5,
    0
);

-- Test theme search
SELECT 'Testing theme search...' as test_phase;

SELECT * FROM search_themes(
    'traditional ecological',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'indigenous_english',
    'community_safe',
    5
);

-- Test faceted search
SELECT 'Testing faceted search...' as test_phase;

SELECT get_search_facets(
    'traditional knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'indigenous_english',
    'community_safe',
    NULL,
    '{}'::jsonb
);

-- Test advanced search with filters
SELECT 'Testing advanced search with filters...' as test_phase;

SELECT advanced_search_documents(
    'traditional knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'indigenous_english',
    '{"cultural_sensitivity": ["community", "restricted"], "document_type": ["research"]}'::jsonb,
    'relevance',
    'desc',
    10,
    0,
    true
);

-- Test search logging
SELECT 'Testing search analytics logging...' as test_phase;

-- Log a search query
WITH test_search AS (
    SELECT log_search_query(
        'traditional indigenous knowledge systems',
        'documents',
        'indigenous_english',
        (SELECT id FROM communities WHERE slug = 'test-community'),
        gen_random_uuid(),
        '{"cultural_sensitivity": ["community"]}'::jsonb,
        2,
        150
    ) as query_id
)
SELECT query_id FROM test_search;

-- Log a search click
WITH latest_query AS (
    SELECT id FROM search_queries ORDER BY created_at DESC LIMIT 1
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
)
SELECT log_search_click(
    (SELECT id FROM latest_query),
    'document',
    (SELECT id FROM test_document),
    1,
    gen_random_uuid(),
    2500
) as click_id;

-- Test search configurations
SELECT 'Testing search configurations...' as test_phase;

SELECT 
    config_name,
    config_description,
    cultural_context,
    supports_indigenous_terms,
    is_active
FROM search_configurations
ORDER BY cultural_context, config_name;

-- Test search facets configuration
SELECT 'Testing search facets configuration...' as test_phase;

SELECT 
    facet_name,
    facet_display_name,
    facet_type,
    cultural_facet,
    display_order
FROM search_facets
WHERE is_active = true
ORDER BY display_order;

-- Generate test search metrics
SELECT 'Generating search metrics...' as test_phase;

SELECT generate_search_metrics(
    CURRENT_DATE,
    (SELECT id FROM communities WHERE slug = 'test-community')
);

-- View search analytics
SELECT 'Viewing search analytics...' as test_phase;

SELECT 
    total_searches,
    unique_users,
    unique_queries,
    avg_query_duration_ms,
    zero_results_rate,
    avg_click_through_rate,
    sacred_content_accessed,
    elder_approvals_required,
    document_searches,
    chunk_searches,
    theme_searches
FROM search_performance_metrics
WHERE metric_date = CURRENT_DATE
AND community_id = (SELECT id FROM communities WHERE slug = 'test-community');

-- Test cultural sensitivity in search
SELECT 'Testing cultural sensitivity filtering...' as test_phase;

-- Search with different cultural sensitivity filters
SELECT 
    'public_only' as filter_type,
    count(*) as result_count
FROM search_documents(
    'knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'standard_english',
    'public_only',
    NULL,
    100,
    0
) results

UNION ALL

SELECT 
    'community_safe' as filter_type,
    count(*) as result_count
FROM search_documents(
    'knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'standard_english',
    'community_safe',
    NULL,
    100,
    0
) results

UNION ALL

SELECT 
    'all_accessible' as filter_type,
    count(*) as result_count
FROM search_documents(
    'knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'standard_english',
    'all_accessible',
    NULL,
    100,
    0
) results;

-- Test search performance with different configurations
SELECT 'Testing search performance across configurations...' as test_phase;

WITH search_performance AS (
    SELECT 
        'standard_english' as config,
        count(*) as results,
        avg(rank) as avg_rank
    FROM search_documents(
        'traditional knowledge',
        (SELECT id FROM communities WHERE slug = 'test-community'),
        'standard_english',
        'community_safe',
        NULL,
        20,
        0
    )
    
    UNION ALL
    
    SELECT 
        'indigenous_english' as config,
        count(*) as results,
        avg(rank) as avg_rank
    FROM search_documents(
        'traditional knowledge',
        (SELECT id FROM communities WHERE slug = 'test-community'),
        'indigenous_english',
        'community_safe',
        NULL,
        20,
        0
    )
)
SELECT * FROM search_performance;

-- View recent search queries
SELECT 'Recent search queries...' as test_phase;

SELECT 
    query_text,
    search_type,
    search_config,
    results_count,
    has_results,
    query_duration_ms,
    click_through_rate,
    accessed_sacred_content,
    created_at
FROM search_queries
ORDER BY created_at DESC
LIMIT 5;

-- View search result clicks
SELECT 'Recent search clicks...' as test_phase;

SELECT 
    src.result_type,
    src.result_rank,
    src.cultural_sensitivity_level,
    src.required_cultural_approval,
    src.time_to_click_ms,
    sq.query_text
FROM search_result_clicks src
JOIN search_queries sq ON sq.id = src.search_query_id
ORDER BY src.click_timestamp DESC
LIMIT 5;

-- Final system summary
SELECT 'ADVANCED SEARCH SYSTEM SUMMARY' as summary,
    (SELECT count(*) FROM search_configurations WHERE is_active = true) as active_search_configs,
    (SELECT count(*) FROM search_facets WHERE is_active = true) as active_facets,
    (SELECT count(*) FROM search_queries) as total_search_queries,
    (SELECT count(*) FROM search_result_clicks) as total_clicks,
    (SELECT count(*) FROM search_performance_metrics) as metrics_records,
    (SELECT count(*) FROM search_queries WHERE accessed_sacred_content = true) as sacred_content_searches,
    (SELECT count(*) FROM search_queries WHERE elder_approval_required = true) as elder_approval_searches;

SELECT 'Advanced search system testing completed successfully!' as status;