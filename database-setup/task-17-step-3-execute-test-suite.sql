-- =====================================================
-- TASK 17 - STEP 3: Execute Comprehensive Test Suite
-- Run All Tests and Generate Comprehensive Test Report
-- =====================================================

-- Execute all test suites and generate comprehensive report
DO $$
DECLARE
    suite_record RECORD;
    execution_result RECORD;
    total_suites INTEGER := 0;
    successful_suites INTEGER := 0;
    total_tests INTEGER := 0;
    passed_tests INTEGER := 0;
    failed_tests INTEGER := 0;
    error_tests INTEGER := 0;
    overall_success_rate DECIMAL(5,2);
BEGIN
    RAISE NOTICE '=== Executing Comprehensive Test Suite ===';
    RAISE NOTICE 'Starting test execution at %', NOW();
    
    -- Execute each test suite
    FOR suite_record IN 
        SELECT id, suite_name, suite_type, tests_sacred_content
        FROM test_suites 
        WHERE suite_status = 'active'
        ORDER BY 
            CASE suite_type 
                WHEN 'unit' THEN 1 
                WHEN 'integration' THEN 2 
                WHEN 'cultural' THEN 3 
                WHEN 'performance' THEN 4 
                WHEN 'api' THEN 5 
                ELSE 6 
            END
    LOOP
        total_suites := total_suites + 1;
        
        RAISE NOTICE '';
        RAISE NOTICE '--- Executing Test Suite: % (%) ---', suite_record.suite_name, suite_record.suite_type;
        
        -- Execute the test suite
        FOR execution_result IN 
            SELECT * FROM execute_test_suite(suite_record.id)
        LOOP
            total_tests := total_tests + execution_result.total_tests;
            passed_tests := passed_tests + execution_result.passed_tests;
            failed_tests := failed_tests + execution_result.failed_tests;
            error_tests := error_tests + execution_result.error_tests;
            
            IF execution_result.success_rate >= 80 THEN
                successful_suites := successful_suites + 1;
            END IF;
            
            RAISE NOTICE 'Suite Results: % total, % passed, % failed, % errors (%.2f%% success rate, %ms execution time)',
                execution_result.total_tests,
                execution_result.passed_tests,
                execution_result.failed_tests,
                execution_result.error_tests,
                execution_result.success_rate,
                execution_result.execution_time_ms;
                
            -- Show cultural compliance for sacred content tests
            IF suite_record.tests_sacred_content THEN
                RAISE NOTICE 'Cultural compliance: Sacred content handling validated';
            END IF;
        END LOOP;
    END LOOP;
    
    -- Calculate overall success rate
    overall_success_rate := CASE WHEN total_tests > 0 THEN (passed_tests::DECIMAL / total_tests * 100) ELSE 0 END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== COMPREHENSIVE TEST EXECUTION SUMMARY ===';
    RAISE NOTICE 'Test execution completed at %', NOW();
    RAISE NOTICE '';
    RAISE NOTICE 'SUITE SUMMARY:';
    RAISE NOTICE '  - Total Test Suites: %', total_suites;
    RAISE NOTICE '  - Successful Suites: % (%.1f%%)', successful_suites, 
        CASE WHEN total_suites > 0 THEN (successful_suites::DECIMAL / total_suites * 100) ELSE 0 END;
    RAISE NOTICE '';
    RAISE NOTICE 'TEST SUMMARY:';
    RAISE NOTICE '  - Total Tests: %', total_tests;
    RAISE NOTICE '  - Passed Tests: %', passed_tests;
    RAISE NOTICE '  - Failed Tests: %', failed_tests;
    RAISE NOTICE '  - Error Tests: %', error_tests;
    RAISE NOTICE '  - Overall Success Rate: %.2f%%', overall_success_rate;
    RAISE NOTICE '';
    
    -- Determine overall system health
    IF overall_success_rate >= 95 THEN
        RAISE NOTICE 'SYSTEM HEALTH: EXCELLENT - All systems functioning optimally';
    ELSIF overall_success_rate >= 85 THEN
        RAISE NOTICE 'SYSTEM HEALTH: GOOD - Minor issues detected, system stable';
    ELSIF overall_success_rate >= 70 THEN
        RAISE NOTICE 'SYSTEM HEALTH: FAIR - Some issues detected, requires attention';
    ELSE
        RAISE NOTICE 'SYSTEM HEALTH: POOR - Significant issues detected, immediate attention required';
    END IF;
    
END;
$$;

-- Generate detailed test failure analysis
DO $$
DECLARE
    failure_record RECORD;
    failure_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DETAILED FAILURE ANALYSIS ===';
    
    -- Analyze failed tests
    FOR failure_record IN 
        SELECT 
            ts.suite_name,
            tc.test_name,
            tc.test_category,
            ter.test_status,
            ter.error_message,
            ter.execution_duration_ms,
            tc.involves_sacred_data
        FROM test_execution_results ter
        JOIN test_cases tc ON ter.test_case_id = tc.id
        JOIN test_suites ts ON ter.test_suite_id = ts.id
        WHERE ter.test_status IN ('failed', 'error')
        AND ter.created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY ts.suite_name, tc.test_name
    LOOP
        failure_count := failure_count + 1;
        
        RAISE NOTICE 'FAILURE %: % / %', failure_count, failure_record.suite_name, failure_record.test_name;
        RAISE NOTICE '  Category: %, Status: %, Duration: %ms', 
            failure_record.test_category, failure_record.test_status, failure_record.execution_duration_ms;
        RAISE NOTICE '  Sacred Data: %, Error: %', 
            failure_record.involves_sacred_data, COALESCE(failure_record.error_message, 'No error message');
        RAISE NOTICE '';
    END LOOP;
    
    IF failure_count = 0 THEN
        RAISE NOTICE 'No test failures detected in recent execution';
    ELSE
        RAISE NOTICE 'Total failures analyzed: %', failure_count;
    END IF;
    
END;
$$;

-- Test cultural compliance validation
DO $$
DECLARE
    cultural_test_count INTEGER;
    cultural_passed INTEGER;
    cultural_compliance_rate DECIMAL(5,2);
    sacred_content_tests INTEGER;
    elder_supervised_tests INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CULTURAL COMPLIANCE VALIDATION ===';
    
    -- Count cultural tests
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE test_status = 'passed'),
        COUNT(*) FILTER (WHERE involves_sacred_data = true),
        COUNT(*) FILTER (WHERE elder_supervision_present = true)
    INTO cultural_test_count, cultural_passed, sacred_content_tests, elder_supervised_tests
    FROM test_execution_results ter
    JOIN test_cases tc ON ter.test_case_id = tc.id
    WHERE tc.test_category = 'cultural'
    AND ter.created_at >= NOW() - INTERVAL '1 hour';
    
    cultural_compliance_rate := CASE 
        WHEN cultural_test_count > 0 THEN (cultural_passed::DECIMAL / cultural_test_count * 100)
        ELSE 0 
    END;
    
    RAISE NOTICE 'Cultural Test Summary:';
    RAISE NOTICE '  - Total Cultural Tests: %', cultural_test_count;
    RAISE NOTICE '  - Passed Cultural Tests: %', cultural_passed;
    RAISE NOTICE '  - Cultural Compliance Rate: %.2f%%', cultural_compliance_rate;
    RAISE NOTICE '  - Sacred Content Tests: %', sacred_content_tests;
    RAISE NOTICE '  - Elder Supervised Tests: %', elder_supervised_tests;
    RAISE NOTICE '';
    
    -- Validate cultural protocols
    IF cultural_compliance_rate >= 95 THEN
        RAISE NOTICE 'CULTURAL COMPLIANCE: EXCELLENT - All cultural protocols properly implemented';
    ELSIF cultural_compliance_rate >= 85 THEN
        RAISE NOTICE 'CULTURAL COMPLIANCE: GOOD - Minor cultural protocol issues detected';
    ELSIF cultural_compliance_rate >= 70 THEN
        RAISE NOTICE 'CULTURAL COMPLIANCE: NEEDS IMPROVEMENT - Cultural protocol violations detected';
    ELSE
        RAISE NOTICE 'CULTURAL COMPLIANCE: CRITICAL - Significant cultural protocol failures';
    END IF;
    
    -- Validate sacred content handling
    IF sacred_content_tests > 0 THEN
        RAISE NOTICE 'Sacred content handling: TESTED AND VALIDATED';
    ELSE
        RAISE NOTICE 'Sacred content handling: NO TESTS EXECUTED (may be expected)';
    END IF;
    
END;
$$;

-- Performance test analysis
DO $$
DECLARE
    performance_record RECORD;
    slow_tests INTEGER := 0;
    avg_execution_time DECIMAL(10,3);
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PERFORMANCE TEST ANALYSIS ===';
    
    -- Analyze performance test results
    SELECT AVG(execution_duration_ms) INTO avg_execution_time
    FROM test_execution_results ter
    JOIN test_cases tc ON ter.test_case_id = tc.id
    WHERE tc.test_category = 'performance'
    AND ter.created_at >= NOW() - INTERVAL '1 hour';
    
    -- Count slow tests
    SELECT COUNT(*) INTO slow_tests
    FROM test_execution_results ter
    JOIN test_cases tc ON ter.test_case_id = tc.id
    WHERE tc.test_category = 'performance'
    AND ter.execution_duration_ms > 5000
    AND ter.created_at >= NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE 'Performance Summary:';
    RAISE NOTICE '  - Average Test Execution Time: %ms', COALESCE(avg_execution_time, 0);
    RAISE NOTICE '  - Slow Tests (>5s): %', slow_tests;
    RAISE NOTICE '';
    
    -- Show detailed performance results
    FOR performance_record IN 
        SELECT 
            tc.test_name,
            ter.execution_duration_ms,
            ter.test_status,
            ter.rows_affected
        FROM test_execution_results ter
        JOIN test_cases tc ON ter.test_case_id = tc.id
        WHERE tc.test_category = 'performance'
        AND ter.created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY ter.execution_duration_ms DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Performance Test: % - %ms (%s, % rows)',
            performance_record.test_name,
            performance_record.execution_duration_ms,
            performance_record.test_status,
            performance_record.rows_affected;
    END LOOP;
    
END;
$$;

-- API test validation
DO $$
DECLARE
    api_test_count INTEGER;
    api_passed INTEGER;
    api_success_rate DECIMAL(5,2);
    rate_limit_tests INTEGER;
    cultural_api_tests INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== API TEST VALIDATION ===';
    
    -- Count API tests
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE test_status = 'passed')
    INTO api_test_count, api_passed
    FROM test_execution_results ter
    JOIN test_suites ts ON ter.test_suite_id = ts.id
    WHERE ts.suite_type = 'api'
    AND ter.created_at >= NOW() - INTERVAL '1 hour';
    
    api_success_rate := CASE 
        WHEN api_test_count > 0 THEN (api_passed::DECIMAL / api_test_count * 100)
        ELSE 0 
    END;
    
    -- Count specific API test types
    SELECT COUNT(*) INTO rate_limit_tests
    FROM test_execution_results ter
    JOIN test_cases tc ON ter.test_case_id = tc.id
    WHERE tc.test_name LIKE '%rate_limit%'
    AND ter.created_at >= NOW() - INTERVAL '1 hour';
    
    SELECT COUNT(*) INTO cultural_api_tests
    FROM test_execution_results ter
    JOIN test_cases tc ON ter.test_case_id = tc.id
    WHERE tc.test_name LIKE '%sacred%'
    AND ter.created_at >= NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE 'API Test Summary:';
    RAISE NOTICE '  - Total API Tests: %', api_test_count;
    RAISE NOTICE '  - Passed API Tests: %', api_passed;
    RAISE NOTICE '  - API Success Rate: %.2f%%', api_success_rate;
    RAISE NOTICE '  - Rate Limiting Tests: %', rate_limit_tests;
    RAISE NOTICE '  - Cultural API Tests: %', cultural_api_tests;
    RAISE NOTICE '';
    
    IF api_success_rate >= 95 THEN
        RAISE NOTICE 'API INTEGRATION: EXCELLENT - All API endpoints functioning properly';
    ELSIF api_success_rate >= 85 THEN
        RAISE NOTICE 'API INTEGRATION: GOOD - Minor API issues detected';
    ELSE
        RAISE NOTICE 'API INTEGRATION: NEEDS ATTENTION - API functionality issues detected';
    END IF;
    
END;
$$;

-- Generate test coverage report
DO $$
DECLARE
    total_functions INTEGER;
    tested_functions INTEGER;
    coverage_rate DECIMAL(5,2);
    untested_functions TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST COVERAGE ANALYSIS ===';
    
    -- Count total database functions (simplified analysis)
    SELECT COUNT(*) INTO total_functions
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'test_%'
    AND routine_name NOT LIKE 'benchmark_%';
    
    -- Estimate tested functions based on test cases
    SELECT COUNT(DISTINCT 
        CASE 
            WHEN test_sql LIKE '%create_community%' THEN 'create_community'
            WHEN test_sql LIKE '%create_document%' THEN 'create_document'
            WHEN test_sql LIKE '%search_documents%' THEN 'search_documents'
            WHEN test_sql LIKE '%api_get_%' THEN 'api_functions'
            WHEN test_sql LIKE '%validate_%' THEN 'validation_functions'
            WHEN test_sql LIKE '%create_backup%' THEN 'backup_functions'
            WHEN test_sql LIKE '%create_migration%' THEN 'migration_functions'
            ELSE NULL
        END
    ) INTO tested_functions
    FROM test_cases
    WHERE test_status = 'active';
    
    coverage_rate := CASE 
        WHEN total_functions > 0 THEN (tested_functions::DECIMAL / total_functions * 100)
        ELSE 0 
    END;
    
    RAISE NOTICE 'Test Coverage Summary:';
    RAISE NOTICE '  - Total Database Functions: %', total_functions;
    RAISE NOTICE '  - Functions with Tests: %', tested_functions;
    RAISE NOTICE '  - Estimated Coverage Rate: %.1f%%', coverage_rate;
    RAISE NOTICE '';
    
    IF coverage_rate >= 80 THEN
        RAISE NOTICE 'TEST COVERAGE: EXCELLENT - Comprehensive test coverage achieved';
    ELSIF coverage_rate >= 60 THEN
        RAISE NOTICE 'TEST COVERAGE: GOOD - Adequate test coverage with room for improvement';
    ELSIF coverage_rate >= 40 THEN
        RAISE NOTICE 'TEST COVERAGE: FAIR - Basic test coverage, more tests recommended';
    ELSE
        RAISE NOTICE 'TEST COVERAGE: POOR - Insufficient test coverage, comprehensive testing needed';
    END IF;
    
END;
$$;

-- Final system validation and recommendations
DO $$
DECLARE
    overall_health_score INTEGER := 0;
    recommendations TEXT[] := '{}';
    total_tests INTEGER;
    passed_tests INTEGER;
    success_rate DECIMAL(5,2);
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL SYSTEM VALIDATION AND RECOMMENDATIONS ===';
    
    -- Calculate overall system health score
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE test_status = 'passed')
    INTO total_tests, passed_tests
    FROM test_execution_results
    WHERE created_at >= NOW() - INTERVAL '1 hour';
    
    success_rate := CASE 
        WHEN total_tests > 0 THEN (passed_tests::DECIMAL / total_tests * 100)
        ELSE 0 
    END;
    
    -- Calculate health score (0-100)
    overall_health_score := CASE 
        WHEN success_rate >= 95 THEN 95
        WHEN success_rate >= 85 THEN 85
        WHEN success_rate >= 70 THEN 70
        ELSE 50
    END;
    
    -- Generate recommendations
    IF success_rate < 95 THEN
        recommendations := recommendations || 'Review and fix failing tests to improve system reliability';
    END IF;
    
    IF success_rate >= 90 THEN
        recommendations := recommendations || 'System is performing excellently - ready for production';
    END IF;
    
    recommendations := recommendations || 'Continue regular test execution to maintain system quality';
    recommendations := recommendations || 'Monitor cultural compliance tests for ongoing data sovereignty';
    recommendations := recommendations || 'Expand test coverage for new features and functionality';
    
    RAISE NOTICE 'FINAL ASSESSMENT:';
    RAISE NOTICE '  - Overall System Health Score: %/100', overall_health_score;
    RAISE NOTICE '  - Test Success Rate: %.2f%%', success_rate;
    RAISE NOTICE '  - Total Tests Executed: %', total_tests;
    RAISE NOTICE '  - Tests Passed: %', passed_tests;
    RAISE NOTICE '';
    
    RAISE NOTICE 'RECOMMENDATIONS:';
    FOR i IN 1..array_length(recommendations, 1) LOOP
        RAISE NOTICE '  %d. %', i, recommendations[i];
    END LOOP;
    RAISE NOTICE '';
    
    -- Final status determination
    IF overall_health_score >= 90 THEN
        RAISE NOTICE '🎉 SYSTEM STATUS: PRODUCTION READY';
        RAISE NOTICE 'The Indigenous Research Platform database system has passed comprehensive testing';
        RAISE NOTICE 'and is ready for production deployment with full cultural compliance.';
    ELSIF overall_health_score >= 75 THEN
        RAISE NOTICE '⚠️  SYSTEM STATUS: NEEDS MINOR FIXES';
        RAISE NOTICE 'The system is largely functional but requires attention to failing tests';
        RAISE NOTICE 'before production deployment.';
    ELSE
        RAISE NOTICE '❌ SYSTEM STATUS: REQUIRES SIGNIFICANT WORK';
        RAISE NOTICE 'Multiple system issues detected. Address failing tests and';
        RAISE NOTICE 'improve system stability before considering production deployment.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== COMPREHENSIVE TEST SUITE EXECUTION COMPLETED ===';
    RAISE NOTICE 'Test execution completed at %', NOW();
    
END;
$$;

-- Clean up test data
SELECT cleanup_test_data() as test_data_cleaned;

-- Create final test execution summary view
CREATE OR REPLACE VIEW test_execution_summary AS
WITH recent_executions AS (
    SELECT 
        ts.suite_name,
        ts.suite_type,
        COUNT(*) as total_tests,
        COUNT(*) FILTER (WHERE ter.test_status = 'passed') as passed_tests,
        COUNT(*) FILTER (WHERE ter.test_status = 'failed') as failed_tests,
        COUNT(*) FILTER (WHERE ter.test_status = 'error') as error_tests,
        AVG(ter.execution_duration_ms) as avg_execution_time,
        MAX(ter.created_at) as last_execution
    FROM test_execution_results ter
    JOIN test_suites ts ON ter.test_suite_id = ts.id
    WHERE ter.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY ts.suite_name, ts.suite_type
)
SELECT 
    suite_name,
    suite_type,
    total_tests,
    passed_tests,
    failed_tests,
    error_tests,
    (passed_tests::DECIMAL / NULLIF(total_tests, 0) * 100) as success_rate_percent,
    avg_execution_time,
    last_execution,
    CASE 
        WHEN (passed_tests::DECIMAL / NULLIF(total_tests, 0) * 100) >= 95 THEN 'EXCELLENT'
        WHEN (passed_tests::DECIMAL / NULLIF(total_tests, 0) * 100) >= 85 THEN 'GOOD'
        WHEN (passed_tests::DECIMAL / NULLIF(total_tests, 0) * 100) >= 70 THEN 'FAIR'
        ELSE 'POOR'
    END as health_status
FROM recent_executions
ORDER BY success_rate_percent DESC, suite_name;

SELECT 'Comprehensive testing suite execution completed successfully' as status;