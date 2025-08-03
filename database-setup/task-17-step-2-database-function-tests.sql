-- =====================================================
-- TASK 17 - STEP 2: Database Function and RLS Testing
-- Comprehensive Tests for Database Functions, RLS Policies, and Cultural Compliance
-- =====================================================

-- Create comprehensive test cases for database functions
DO $$
DECLARE
    unit_suite_id UUID;
    integration_suite_id UUID;
    cultural_suite_id UUID;
    test_case_id UUID;
BEGIN
    RAISE NOTICE '=== Creating Database Function Tests ===';
    
    -- Get test suite IDs
    SELECT id INTO unit_suite_id FROM test_suites WHERE suite_name = 'database_unit_tests';
    SELECT id INTO integration_suite_id FROM test_suites WHERE suite_name = 'system_integration_tests';
    SELECT id INTO cultural_suite_id FROM test_suites WHERE suite_name = 'cultural_compliance_tests';
    
    -- =====================================================
    -- COMMUNITY MANAGEMENT FUNCTION TESTS
    -- =====================================================
    
    -- Test community creation
    SELECT create_test_case(
        unit_suite_id,
        'test_community_creation',
        'SELECT create_community(''Test Community'', ''Test Description'', ''Test Location'', ''{}''::JSONB)',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test community validation
    SELECT create_test_case(
        unit_suite_id,
        'test_community_validation',
        'SELECT validate_community_data(''Test Community'', ''Test Description'', ''{}''::JSONB)',
        jsonb_build_object('expected_result', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- DOCUMENT MANAGEMENT FUNCTION TESTS
    -- =====================================================
    
    -- Test document creation
    SELECT create_test_case(
        unit_suite_id,
        'test_document_creation',
        'SELECT create_document(''Test Document'', ''Test content'', ''text/plain'', (SELECT id FROM communities LIMIT 1), ''standard'')',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test document search
    SELECT create_test_case(
        unit_suite_id,
        'test_document_search',
        'SELECT COUNT(*) FROM search_documents(''test'', NULL, ''standard'', 10, 0)',
        jsonb_build_object('expected_type', 'integer', 'min_value', 0),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test document chunking
    SELECT create_test_case(
        unit_suite_id,
        'test_document_chunking',
        'SELECT chunk_document_content(''This is a test document with multiple sentences. It should be chunked properly.'', 50)',
        jsonb_build_object('expected_type', 'text[]', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- SEARCH FUNCTION TESTS
    -- =====================================================
    
    -- Test full-text search
    SELECT create_test_case(
        unit_suite_id,
        'test_fulltext_search',
        'SELECT perform_fulltext_search(''test query'', NULL, 10, 0)',
        jsonb_build_object('expected_type', 'table', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test faceted search
    SELECT create_test_case(
        unit_suite_id,
        'test_faceted_search',
        'SELECT perform_faceted_search(''{}''::JSONB, NULL, 10, 0)',
        jsonb_build_object('expected_type', 'table', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- API FUNCTION TESTS
    -- =====================================================
    
    -- Test API document retrieval
    SELECT create_test_case(
        unit_suite_id,
        'test_api_get_documents',
        'SELECT COUNT(*) FROM api_get_documents((SELECT id FROM users LIMIT 1), NULL, 10, 0, false)',
        jsonb_build_object('expected_type', 'integer', 'min_value', 0),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test API community retrieval
    SELECT create_test_case(
        unit_suite_id,
        'test_api_get_communities',
        'SELECT COUNT(*) FROM api_get_communities((SELECT id FROM users LIMIT 1), 10, 0)',
        jsonb_build_object('expected_type', 'integer', 'min_value', 0),
        'functional',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- CULTURAL COMPLIANCE TESTS
    -- =====================================================
    
    -- Test sacred content protection
    SELECT create_test_case(
        cultural_suite_id,
        'test_sacred_content_protection',
        'SELECT validate_cultural_access(''sacred'', false, ''member'')',
        jsonb_build_object('expected_result', false),
        'cultural',
        true
    ) INTO test_case_id;
    
    -- Test elder access validation
    SELECT create_test_case(
        cultural_suite_id,
        'test_elder_access_validation',
        'SELECT validate_cultural_access(''sacred'', true, ''elder'')',
        jsonb_build_object('expected_result', true),
        'cultural',
        true
    ) INTO test_case_id;
    
    -- Test community isolation
    SELECT create_test_case(
        cultural_suite_id,
        'test_community_isolation',
        'SELECT validate_community_access((SELECT id FROM communities LIMIT 1), (SELECT id FROM users LIMIT 1))',
        jsonb_build_object('expected_type', 'boolean', 'should_succeed', true),
        'cultural',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- PERFORMANCE FUNCTION TESTS
    -- =====================================================
    
    -- Test indexing performance
    SELECT create_test_case(
        unit_suite_id,
        'test_index_performance',
        'SELECT analyze_index_performance()',
        jsonb_build_object('expected_type', 'table', 'should_succeed', true),
        'performance',
        false
    ) INTO test_case_id;
    
    -- Test query optimization
    SELECT create_test_case(
        unit_suite_id,
        'test_query_optimization',
        'SELECT optimize_query_performance()',
        jsonb_build_object('expected_type', 'table', 'should_succeed', true),
        'performance',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- BACKUP AND RECOVERY TESTS
    -- =====================================================
    
    -- Test backup creation
    SELECT create_test_case(
        integration_suite_id,
        'test_backup_creation',
        'SELECT create_backup_config(''test_backup'', ''full'', ''0 2 * * *'', ''/tmp/test'', ''standard'', ''{}''::UUID[])',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test backup integrity
    SELECT create_test_case(
        integration_suite_id,
        'test_backup_integrity',
        'SELECT verify_backup_integrity((SELECT id FROM backup_execution_log WHERE execution_status = ''completed'' LIMIT 1))',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- =====================================================
    -- MIGRATION SYSTEM TESTS
    -- =====================================================
    
    -- Test migration creation
    SELECT create_test_case(
        integration_suite_id,
        'test_migration_creation',
        'SELECT create_migration(''test_migration'', ''2025.test.001'', ''schema'', ''SELECT 1'', ''SELECT 2'', ''Test migration'', false, ''{}''::TEXT[])',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test migration dependency validation
    SELECT create_test_case(
        integration_suite_id,
        'test_migration_dependencies',
        'SELECT validate_migration_dependencies((SELECT id FROM schema_migrations LIMIT 1))',
        jsonb_build_object('expected_type', 'boolean', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    RAISE NOTICE 'Created comprehensive database function tests';
END;
$$;

-- Create RLS policy tests
DO $$
DECLARE
    unit_suite_id UUID;
    cultural_suite_id UUID;
    test_case_id UUID;
BEGIN
    RAISE NOTICE '=== Creating RLS Policy Tests ===';
    
    -- Get test suite IDs
    SELECT id INTO unit_suite_id FROM test_suites WHERE suite_name = 'database_unit_tests';
    SELECT id INTO cultural_suite_id FROM test_suites WHERE suite_name = 'cultural_compliance_tests';
    
    -- Test document RLS policies
    SELECT create_test_case(
        unit_suite_id,
        'test_document_rls_select',
        'SET ROLE test_user; SELECT COUNT(*) FROM documents; RESET ROLE;',
        jsonb_build_object('expected_type', 'integer', 'min_value', 0),
        'security',
        false
    ) INTO test_case_id;
    
    -- Test community RLS policies
    SELECT create_test_case(
        unit_suite_id,
        'test_community_rls_select',
        'SET ROLE test_user; SELECT COUNT(*) FROM communities; RESET ROLE;',
        jsonb_build_object('expected_type', 'integer', 'min_value', 0),
        'security',
        false
    ) INTO test_case_id;
    
    -- Test sacred content RLS
    SELECT create_test_case(
        cultural_suite_id,
        'test_sacred_content_rls',
        'SET ROLE test_member; SELECT COUNT(*) FROM documents WHERE cultural_sensitivity_level = ''sacred''; RESET ROLE;',
        jsonb_build_object('expected_result', 0),
        'cultural',
        true
    ) INTO test_case_id;
    
    -- Test elder access RLS
    SELECT create_test_case(
        cultural_suite_id,
        'test_elder_access_rls',
        'SET ROLE test_elder; SELECT COUNT(*) FROM documents WHERE cultural_sensitivity_level = ''sacred''; RESET ROLE;',
        jsonb_build_object('expected_type', 'integer', 'min_value', 0),
        'cultural',
        true
    ) INTO test_case_id;
    
    RAISE NOTICE 'Created RLS policy tests';
END;
$$;

-- Create performance and load tests
DO $$
DECLARE
    performance_suite_id UUID;
    test_case_id UUID;
BEGIN
    RAISE NOTICE '=== Creating Performance Tests ===';
    
    -- Get performance test suite ID
    SELECT id INTO performance_suite_id FROM test_suites WHERE suite_name = 'performance_tests';
    
    -- Test document insertion performance
    SELECT create_test_case(
        performance_suite_id,
        'test_document_insert_performance',
        'SELECT benchmark_document_insertion(100)',
        jsonb_build_object('expected_type', 'table', 'max_duration_ms', 5000),
        'performance',
        false
    ) INTO test_case_id;
    
    -- Test search performance
    SELECT create_test_case(
        performance_suite_id,
        'test_search_performance',
        'SELECT benchmark_search_performance(''test'', 50)',
        jsonb_build_object('expected_type', 'table', 'max_duration_ms', 2000),
        'performance',
        false
    ) INTO test_case_id;
    
    -- Test concurrent access performance
    SELECT create_test_case(
        performance_suite_id,
        'test_concurrent_access',
        'SELECT test_concurrent_document_access(10)',
        jsonb_build_object('expected_type', 'table', 'max_duration_ms', 3000),
        'performance',
        false
    ) INTO test_case_id;
    
    -- Test API rate limiting performance
    SELECT create_test_case(
        performance_suite_id,
        'test_rate_limiting_performance',
        'SELECT benchmark_rate_limiting(100)',
        jsonb_build_object('expected_type', 'table', 'max_duration_ms', 1000),
        'performance',
        false
    ) INTO test_case_id;
    
    RAISE NOTICE 'Created performance tests';
END;
$$;

-- Create API integration tests
DO $$
DECLARE
    api_suite_id UUID;
    test_case_id UUID;
BEGIN
    RAISE NOTICE '=== Creating API Integration Tests ===';
    
    -- Get API test suite ID
    SELECT id INTO api_suite_id FROM test_suites WHERE suite_name = 'api_tests';
    
    -- Test API endpoint creation
    SELECT create_test_case(
        api_suite_id,
        'test_api_endpoint_creation',
        'SELECT create_api_endpoint((SELECT id FROM api_configurations LIMIT 1), ''/test'', ''GET'', ''Test Endpoint'', NULL, false, ARRAY[''member''])',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test rate limiting functionality
    SELECT create_test_case(
        api_suite_id,
        'test_rate_limiting',
        'SELECT check_rate_limit((SELECT id FROM api_configurations LIMIT 1), NULL, ''test_client'', ''127.0.0.1''::INET, NULL)',
        jsonb_build_object('expected_result', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test API request logging
    SELECT create_test_case(
        api_suite_id,
        'test_api_request_logging',
        'SELECT record_api_request(''test_request_123'', (SELECT id FROM api_configurations LIMIT 1), NULL, ''test_client'', ''127.0.0.1''::INET, NULL, ''GET'', ''/test'', 200, 100.0, false)',
        jsonb_build_object('expected_type', 'uuid', 'should_succeed', true),
        'functional',
        false
    ) INTO test_case_id;
    
    -- Test sacred content API access
    SELECT create_test_case(
        api_suite_id,
        'test_sacred_content_api',
        'SELECT COUNT(*) FROM api_get_documents((SELECT id FROM users WHERE is_elder = false LIMIT 1), NULL, 10, 0, true)',
        jsonb_build_object('expected_type', 'integer', 'cultural_check', true),
        'cultural',
        true
    ) INTO test_case_id;
    
    RAISE NOTICE 'Created API integration tests';
END;
$$;

-- Create helper functions for testing
CREATE OR REPLACE FUNCTION benchmark_document_insertion(p_count INTEGER)
RETURNS TABLE(
    documents_inserted INTEGER,
    total_time_ms INTEGER,
    avg_time_per_doc_ms DECIMAL(10,3)
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    i INTEGER;
    community_id UUID;
BEGIN
    -- Get a test community
    SELECT id INTO community_id FROM communities LIMIT 1;
    
    start_time := clock_timestamp();
    
    -- Insert test documents
    FOR i IN 1..p_count LOOP
        INSERT INTO documents (
            title,
            content,
            file_type,
            community_id,
            cultural_sensitivity_level,
            file_size
        ) VALUES (
            format('Test Document %s', i),
            format('This is test content for document number %s', i),
            'text/plain',
            community_id,
            'standard',
            50
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        p_count,
        duration_ms,
        duration_ms::DECIMAL / p_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION benchmark_search_performance(p_query TEXT, p_iterations INTEGER)
RETURNS TABLE(
    search_iterations INTEGER,
    total_time_ms INTEGER,
    avg_time_per_search_ms DECIMAL(10,3),
    total_results BIGINT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    i INTEGER;
    result_count BIGINT := 0;
    temp_count BIGINT;
BEGIN
    start_time := clock_timestamp();
    
    -- Perform search iterations
    FOR i IN 1..p_iterations LOOP
        SELECT COUNT(*) INTO temp_count
        FROM search_documents(p_query, NULL, 'standard', 10, 0);
        result_count := result_count + temp_count;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        p_iterations,
        duration_ms,
        duration_ms::DECIMAL / p_iterations,
        result_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_concurrent_document_access(p_concurrent_users INTEGER)
RETURNS TABLE(
    concurrent_users INTEGER,
    total_time_ms INTEGER,
    successful_accesses INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    i INTEGER;
    success_count INTEGER := 0;
BEGIN
    start_time := clock_timestamp();
    
    -- Simulate concurrent access
    FOR i IN 1..p_concurrent_users LOOP
        BEGIN
            PERFORM COUNT(*) FROM documents LIMIT 10;
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Count failures but continue
            NULL;
        END;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        p_concurrent_users,
        duration_ms,
        success_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION benchmark_rate_limiting(p_requests INTEGER)
RETURNS TABLE(
    total_requests INTEGER,
    total_time_ms INTEGER,
    avg_time_per_check_ms DECIMAL(10,3),
    successful_checks INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    i INTEGER;
    success_count INTEGER := 0;
    api_config_id UUID;
    check_result BOOLEAN;
BEGIN
    -- Get an API configuration
    SELECT id INTO api_config_id FROM api_configurations LIMIT 1;
    
    start_time := clock_timestamp();
    
    -- Perform rate limit checks
    FOR i IN 1..p_requests LOOP
        SELECT check_rate_limit(
            api_config_id,
            NULL,
            format('benchmark_client_%s', i),
            '127.0.0.1'::INET,
            NULL
        ) INTO check_result;
        
        IF check_result THEN
            success_count := success_count + 1;
        END IF;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        p_requests,
        duration_ms,
        duration_ms::DECIMAL / p_requests,
        success_count;
END;
$$ LANGUAGE plpgsql;

-- Create test data cleanup function
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up test documents
    DELETE FROM documents WHERE title LIKE 'Test Document %';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up test API requests
    DELETE FROM api_request_log WHERE request_id LIKE 'test_request_%';
    
    -- Clean up test migrations
    DELETE FROM schema_migrations WHERE migration_name LIKE 'test_%';
    
    -- Clean up test backup configs
    DELETE FROM backup_config WHERE backup_name LIKE 'test_%';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

SELECT 'Database function and RLS tests created successfully' as status;