-- =====================================================
-- TASK 11 - STEP 3: Test Performance Optimization System
-- Comprehensive Testing of Performance Features
-- =====================================================

-- Test index analysis functions
SELECT 'Testing index analysis functions...' as test_phase;

-- Analyze current index usage
SELECT * FROM analyze_index_usage() 
ORDER BY index_scans DESC 
LIMIT 10;

-- Suggest missing indexes
SELECT * FROM suggest_missing_indexes() 
LIMIT 5;

-- Test cultural index creation
SELECT 'Testing cultural index creation...' as test_phase;

SELECT create_cultural_indexes() as cultural_indexes_created;

-- Test performance index creation
SELECT 'Testing performance index creation...' as test_phase;

SELECT create_performance_indexes() as performance_indexes_created;

-- Update index statistics
SELECT 'Updating index statistics...' as test_phase;

SELECT update_index_statistics() as indexes_updated;

-- Test materialized view refresh
SELECT 'Testing materialized view refresh...' as test_phase;

SELECT * FROM refresh_all_analytics_views();

-- Get materialized view statistics
SELECT 'Getting materialized view statistics...' as test_phase;

SELECT * FROM get_materialized_view_stats();

-- Test community analytics view
SELECT 'Testing community analytics view...' as test_phase;

SELECT 
    community_name,
    total_documents,
    sacred_documents,
    total_projects,
    active_projects,
    total_collaborations,
    elder_collaborators,
    total_themes,
    sacred_themes,
    cultural_content_count,
    pending_elder_reviews,
    last_refreshed
FROM mv_community_analytics
ORDER BY total_documents DESC;

-- Test document analytics view
SELECT 'Testing document analytics view...' as test_phase;

SELECT 
    title,
    cultural_sensitivity_level,
    document_type,
    total_chunks,
    processed_chunks,
    total_themes,
    total_quotes,
    total_comments,
    cultural_comments,
    collection_memberships,
    requires_elder_approval,
    has_traditional_knowledge
FROM mv_document_analytics
ORDER BY total_chunks DESC, total_themes DESC
LIMIT 5;

-- Test research project analytics view
SELECT 'Testing research project analytics view...' as test_phase;

SELECT 
    project_name,
    project_type,
    status,
    cultural_significance,
    traditional_knowledge_involved,
    total_collections,
    total_documents,
    total_collaborators,
    elder_collaborators,
    total_milestones,
    completed_milestones,
    completion_percentage,
    days_until_target
FROM mv_research_project_analytics
ORDER BY completion_percentage DESC;

-- Test cultural content analytics view
SELECT 'Testing cultural content analytics view...' as test_phase;

SELECT 
    community_name,
    sacred_documents,
    ceremonial_documents,
    traditional_knowledge_documents,
    documents_requiring_elder_approval,
    pending_theme_reviews,
    pending_quote_reviews,
    cultural_annotations,
    elder_collaborators,
    cultural_compliance_percentage
FROM mv_cultural_content_analytics
ORDER BY cultural_compliance_percentage DESC;

-- Performance benchmarking queries
SELECT 'Running performance benchmarks...' as test_phase;

-- Benchmark 1: Document search performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT d.id, d.title, d.cultural_sensitivity_level
FROM documents d
WHERE d.community_id = (SELECT id FROM communities WHERE slug = 'test-community')
AND d.cultural_sensitivity_level IN ('community', 'restricted')
ORDER BY d.created_at DESC
LIMIT 10;

-- Benchmark 2: Complex analytics query
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    c.name,
    COUNT(d.id) as doc_count,
    COUNT(dt.id) as theme_count,
    AVG(dt.confidence_score) as avg_confidence
FROM communities c
LEFT JOIN documents d ON d.community_id = c.id
LEFT JOIN document_themes dt ON dt.community_id = c.id
WHERE c.slug = 'test-community'
GROUP BY c.id, c.name;

-- Benchmark 3: Cultural content filtering
EXPLAIN (ANALYZE, BUFFERS)
SELECT d.title, dc.content, dt.theme_name
FROM documents d
JOIN document_chunks dc ON dc.document_id = d.id
LEFT JOIN document_themes dt ON dt.document_id = d.id
WHERE d.cultural_sensitivity_level = 'sacred'
AND d.requires_elder_approval = true
LIMIT 5;

-- Database size and statistics
SELECT 'Database size and statistics...' as test_phase;

SELECT 
    'Database Size Analysis' as analysis_type,
    pg_size_pretty(pg_database_size(current_database())) as total_size,
    (SELECT COUNT(*) FROM pg_stat_user_tables) as total_tables,
    (SELECT COUNT(*) FROM pg_stat_user_indexes) as total_indexes;

-- Table size analysis
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 10;

-- Query performance summary
SELECT 'Query Performance Summary' as summary_type;

-- Check for slow queries (if pg_stat_statements is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements extension is available for query analysis';
    ELSE
        RAISE NOTICE 'pg_stat_statements extension not available - install for detailed query performance analysis';
    END IF;
END $$;

-- Cultural content performance analysis
SELECT 'Cultural Content Performance Analysis' as analysis_type;

SELECT 
    'Sacred Content Queries' as query_type,
    COUNT(*) as total_records,
    pg_size_pretty(SUM(pg_column_size(d.*))) as estimated_size
FROM documents d
WHERE d.cultural_sensitivity_level = 'sacred'

UNION ALL

SELECT 
    'Elder Review Queue' as query_type,
    COUNT(*) as total_records,
    pg_size_pretty(SUM(pg_column_size(dt.*))) as estimated_size
FROM document_themes dt
WHERE dt.requires_elder_review = true AND dt.elder_reviewed = false

UNION ALL

SELECT 
    'Cultural Annotations' as query_type,
    COUNT(*) as total_records,
    pg_size_pretty(SUM(pg_column_size(ca.*))) as estimated_size
FROM collaborative_annotations ca
WHERE ca.cultural_annotation = true;

-- Final performance optimization summary
SELECT 'PERFORMANCE OPTIMIZATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM database_indexes WHERE is_active = true) as active_indexes,
    (SELECT COUNT(*) FROM database_indexes WHERE cultural_index = true) as cultural_indexes,
    (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public') as materialized_views,
    (SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public') as total_tables,
    (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size,
    (SELECT COUNT(*) FROM documents WHERE cultural_sensitivity_level IN ('sacred', 'ceremonial')) as cultural_documents,
    (SELECT COUNT(*) FROM document_themes WHERE requires_elder_review = true) as items_needing_elder_review;

SELECT 'Performance optimization system testing completed successfully!' as status;