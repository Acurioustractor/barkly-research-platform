-- =====================================================
-- TASK 17 - STEP 1: Comprehensive Testing Framework
-- Unit Tests, Integration Tests, and Cultural Compliance Testing
-- =====================================================

-- Create test suite configuration table
CREATE TABLE IF NOT EXISTS test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Test Suite Information
    suite_name TEXT NOT NULL UNIQUE,
    suite_type TEXT NOT NULL
        CHECK (suite_type IN ('unit', 'integration', 'performance', 'security', 'cultural', 'api', 'end_to_end')),
    suite_description TEXT,
    
    -- Test Configuration
    test_environment TEXT DEFAULT 'testing'
        CHECK (test_environment IN ('development', 'testing', 'staging', 'production')),
    parallel_execution BOOLEAN DEFAULT false,
    timeout_seconds INTEGER DEFAULT 300,
    
    -- Cultural Context
    tests_sacred_content BOOLEAN DEFAULT false,
    requires_elder_supervision BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    
    -- Execution Settings
    auto_run_enabled BOOLEAN DEFAULT false,
    run_frequency TEXT DEFAULT 'manual'
        CHECK (run_frequency IN ('manual', 'daily', 'weekly', 'on_commit', 'on_deploy')),
    
    -- Status
    suite_status TEXT DEFAULT 'active'
        CHECK (suite_status IN ('active', 'disabled', 'maintenance')),
    last_run TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create individual test cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Test Case Information
    test_suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_description TEXT,
    test_category TEXT DEFAULT 'functional'
        CHECK (test_category IN ('functional', 'performance', 'security', 'cultural', 'regression', 'smoke')),
    
    -- Test Implementation
    test_sql TEXT NOT NULL,
    setup_sql TEXT,
    teardown_sql TEXT,
    expected_result JSONB DEFAULT '{}',
    
    -- Cultural Context
    involves_sacred_data BOOLEAN DEFAULT false,
    requires_elder_approval BOOLEAN DEFAULT false,
    community_specific BOOLEAN DEFAULT false,
    cultural_validation_rules JSONB DEFAULT '{}',
    
    -- Test Configuration
    timeout_seconds INTEGER DEFAULT 60,
    retry_count INTEGER DEFAULT 0,
    depends_on_tests TEXT[] DEFAULT '{}',
    
    -- Assertions
    assertion_type TEXT DEFAULT 'result_match'
        CHECK (assertion_type IN ('result_match', 'row_count', 'performance', 'error_expected', 'custom')),
    assertion_config JSONB DEFAULT '{}',
    
    -- Status
    test_status TEXT DEFAULT 'active'
        CHECK (test_status IN ('active', 'disabled', 'skip')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(test_suite_id, test_name)
);

-- Create test execution results table
CREATE TABLE IF NOT EXISTS test_execution_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Execution Context
    test_suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    execution_batch_id UUID NOT NULL,
    
    -- Execution Information
    execution_start TIMESTAMPTZ DEFAULT NOW(),
    execution_end TIMESTAMPTZ,
    execution_duration_ms INTEGER,
    
    -- Test Results
    test_status TEXT NOT NULL
        CHECK (test_status IN ('passed', 'failed', 'error', 'skipped', 'timeout')),
    actual_result JSONB DEFAULT '{}',
    expected_result JSONB DEFAULT '{}',
    
    -- Performance Metrics
    rows_affected BIGINT DEFAULT 0,
    memory_usage_mb DECIMAL(10,2) DEFAULT 0,
    cpu_time_ms DECIMAL(10,3) DEFAULT 0,
    
    -- Cultural Compliance
    cultural_protocols_followed BOOLEAN DEFAULT true,
    sacred_content_handled_properly BOOLEAN DEFAULT true,
    elder_supervision_present BOOLEAN DEFAULT false,
    
    -- Error Information
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    stack_trace TEXT,
    
    -- Environment Information
    database_version TEXT,
    test_environment TEXT,
    executed_by UUID,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test data management table
CREATE TABLE IF NOT EXISTS test_data_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dataset Information
    dataset_name TEXT NOT NULL UNIQUE,
    dataset_type TEXT NOT NULL
        CHECK (dataset_type IN ('fixture', 'mock', 'sample', 'cultural', 'performance')),
    dataset_description TEXT,
    
    -- Data Configuration
    data_definition JSONB NOT NULL,
    setup_sql TEXT,
    cleanup_sql TEXT,
    
    -- Cultural Context
    contains_sacred_content BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_elder_approval BOOLEAN DEFAULT false,
    
    -- Usage Tracking
    used_by_test_suites TEXT[] DEFAULT '{}',
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    dataset_status TEXT DEFAULT 'active'
        CHECK (dataset_status IN ('active', 'deprecated', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TESTING FRAMEWORK FUNCTIONS
-- =====================================================

-- Function to create test suite
CREATE OR REPLACE FUNCTION create_test_suite(
    p_suite_name TEXT,
    p_suite_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_tests_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    suite_id UUID;
    cultural_level TEXT := 'standard';
    elder_supervision BOOLEAN := false;
BEGIN
    -- Determine cultural settings
    IF p_tests_sacred_content THEN
        cultural_level := 'sacred';
        elder_supervision := true;
    END IF;
    
    INSERT INTO test_suites (
        suite_name,
        suite_type,
        suite_description,
        tests_sacred_content,
        requires_elder_supervision,
        cultural_sensitivity_level,
        suite_status
    ) VALUES (
        p_suite_name,
        p_suite_type,
        p_description,
        p_tests_sacred_content,
        elder_supervision,
        cultural_level,
        'active'
    ) RETURNING id INTO suite_id;
    
    RETURN suite_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test case
CREATE OR REPLACE FUNCTION create_test_case(
    p_test_suite_id UUID,
    p_test_name TEXT,
    p_test_sql TEXT,
    p_expected_result JSONB DEFAULT '{}',
    p_test_category TEXT DEFAULT 'functional',
    p_involves_sacred_data BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    test_case_id UUID;
    suite_record RECORD;
BEGIN
    -- Get test suite information
    SELECT * INTO suite_record 
    FROM test_suites 
    WHERE id = p_test_suite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test suite not found: %', p_test_suite_id;
    END IF;
    
    INSERT INTO test_cases (
        test_suite_id,
        test_name,
        test_sql,
        expected_result,
        test_category,
        involves_sacred_data,
        requires_elder_approval,
        cultural_validation_rules
    ) VALUES (
        p_test_suite_id,
        p_test_name,
        p_test_sql,
        p_expected_result,
        p_test_category,
        p_involves_sacred_data,
        p_involves_sacred_data AND suite_record.tests_sacred_content,
        CASE WHEN p_involves_sacred_data THEN 
            jsonb_build_object('elder_approval_required', true, 'cultural_sensitivity', 'sacred')
        ELSE '{}' END
    ) RETURNING id INTO test_case_id;
    
    RETURN test_case_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute single test case
CREATE OR REPLACE FUNCTION execute_test_case(
    p_test_case_id UUID,
    p_execution_batch_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    test_case_record RECORD;
    suite_record RECORD;
    execution_id UUID;
    batch_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    test_result TEXT := 'passed';
    actual_result JSONB := '{}';
    error_msg TEXT;
    rows_affected BIGINT := 0;
BEGIN
    -- Generate batch ID if not provided
    batch_id := COALESCE(p_execution_batch_id, gen_random_uuid());
    
    -- Get test case and suite information
    SELECT tc.*, ts.suite_name, ts.requires_elder_supervision
    INTO test_case_record
    FROM test_cases tc
    JOIN test_suites ts ON tc.test_suite_id = ts.id
    WHERE tc.id = p_test_case_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test case not found: %', p_test_case_id;
    END IF;
    
    start_time := NOW();
    
    -- Create execution result record
    INSERT INTO test_execution_results (
        test_suite_id,
        test_case_id,
        execution_batch_id,
        execution_start,
        test_status,
        expected_result,
        elder_supervision_present
    ) VALUES (
        test_case_record.test_suite_id,
        p_test_case_id,
        batch_id,
        start_time,
        'running',
        test_case_record.expected_result,
        test_case_record.requires_elder_approval
    ) RETURNING id INTO execution_id;
    
    -- Execute setup SQL if provided
    IF test_case_record.setup_sql IS NOT NULL THEN
        BEGIN
            EXECUTE test_case_record.setup_sql;
        EXCEPTION WHEN OTHERS THEN
            test_result := 'error';
            error_msg := 'Setup failed: ' || SQLERRM;
        END;
    END IF;
    
    -- Execute test SQL if setup succeeded
    IF test_result = 'passed' THEN
        BEGIN
            EXECUTE test_case_record.test_sql;
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            
            -- For simple tests, consider success if no exception
            actual_result := jsonb_build_object(
                'rows_affected', rows_affected,
                'execution_successful', true
            );
            
        EXCEPTION WHEN OTHERS THEN
            test_result := 'failed';
            error_msg := SQLERRM;
            actual_result := jsonb_build_object(
                'error', error_msg,
                'execution_successful', false
            );
        END;
    END IF;
    
    -- Execute teardown SQL
    IF test_case_record.teardown_sql IS NOT NULL THEN
        BEGIN
            EXECUTE test_case_record.teardown_sql;
        EXCEPTION WHEN OTHERS THEN
            -- Log teardown errors but don't fail the test
            RAISE NOTICE 'Teardown warning for test %: %', test_case_record.test_name, SQLERRM;
        END;
    END IF;
    
    end_time := NOW();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Update execution result
    UPDATE test_execution_results 
    SET execution_end = end_time,
        execution_duration_ms = duration_ms,
        test_status = test_result,
        actual_result = actual_result,
        rows_affected = rows_affected,
        error_message = error_msg,
        cultural_protocols_followed = NOT test_case_record.involves_sacred_data OR test_case_record.requires_elder_approval,
        sacred_content_handled_properly = NOT test_case_record.involves_sacred_data OR test_result = 'passed'
    WHERE id = execution_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute test suite
CREATE OR REPLACE FUNCTION execute_test_suite(p_test_suite_id UUID)
RETURNS TABLE(
    execution_batch_id UUID,
    total_tests INTEGER,
    passed_tests INTEGER,
    failed_tests INTEGER,
    error_tests INTEGER,
    execution_time_ms INTEGER,
    success_rate DECIMAL(5,2)
) AS $$
DECLARE
    batch_id UUID;
    test_case_record RECORD;
    suite_start_time TIMESTAMPTZ;
    suite_end_time TIMESTAMPTZ;
    total_duration_ms INTEGER;
    test_counts RECORD;
BEGIN
    batch_id := gen_random_uuid();
    suite_start_time := NOW();
    
    -- Execute all test cases in the suite
    FOR test_case_record IN 
        SELECT id, test_name 
        FROM test_cases 
        WHERE test_suite_id = p_test_suite_id 
        AND test_status = 'active'
        ORDER BY test_name
    LOOP
        PERFORM execute_test_case(test_case_record.id, batch_id);
    END LOOP;
    
    suite_end_time := NOW();
    total_duration_ms := EXTRACT(EPOCH FROM (suite_end_time - suite_start_time)) * 1000;
    
    -- Get test result counts
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE test_status = 'passed') as passed,
        COUNT(*) FILTER (WHERE test_status = 'failed') as failed,
        COUNT(*) FILTER (WHERE test_status = 'error') as errors
    INTO test_counts
    FROM test_execution_results 
    WHERE execution_batch_id = batch_id;
    
    RETURN QUERY SELECT 
        batch_id,
        test_counts.total,
        test_counts.passed,
        test_counts.failed,
        test_counts.errors,
        total_duration_ms,
        CASE WHEN test_counts.total > 0 
             THEN (test_counts.passed::DECIMAL / test_counts.total * 100)
             ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Function to create test data set
CREATE OR REPLACE FUNCTION create_test_dataset(
    p_dataset_name TEXT,
    p_dataset_type TEXT,
    p_data_definition JSONB,
    p_setup_sql TEXT DEFAULT NULL,
    p_contains_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    dataset_id UUID;
    cultural_level TEXT := 'standard';
BEGIN
    -- Determine cultural sensitivity
    IF p_contains_sacred_content THEN
        cultural_level := 'sacred';
    END IF;
    
    INSERT INTO test_data_sets (
        dataset_name,
        dataset_type,
        data_definition,
        setup_sql,
        contains_sacred_content,
        cultural_sensitivity_level,
        requires_elder_approval
    ) VALUES (
        p_dataset_name,
        p_dataset_type,
        p_data_definition,
        p_setup_sql,
        p_contains_sacred_content,
        cultural_level,
        p_contains_sacred_content
    ) RETURNING id INTO dataset_id;
    
    RETURN dataset_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get test suite results summary
CREATE OR REPLACE FUNCTION get_test_suite_summary(
    p_test_suite_id UUID,
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
    suite_name TEXT,
    total_executions BIGINT,
    avg_success_rate DECIMAL(5,2),
    last_execution TIMESTAMPTZ,
    cultural_compliance_rate DECIMAL(5,2),
    performance_trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_executions AS (
        SELECT 
            ter.execution_batch_id,
            ter.test_status,
            ter.cultural_protocols_followed,
            ter.execution_duration_ms,
            ter.created_at
        FROM test_execution_results ter
        WHERE ter.test_suite_id = p_test_suite_id
        AND ter.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    ),
    batch_summaries AS (
        SELECT 
            execution_batch_id,
            COUNT(*) as total_tests,
            COUNT(*) FILTER (WHERE test_status = 'passed') as passed_tests,
            AVG(execution_duration_ms) as avg_duration,
            MAX(created_at) as batch_time,
            COUNT(*) FILTER (WHERE cultural_protocols_followed = true) as cultural_compliant
        FROM recent_executions
        GROUP BY execution_batch_id
    )
    SELECT 
        ts.suite_name,
        COUNT(bs.execution_batch_id) as total_executions,
        AVG(bs.passed_tests::DECIMAL / bs.total_tests * 100) as avg_success_rate,
        MAX(bs.batch_time) as last_execution,
        AVG(bs.cultural_compliant::DECIMAL / bs.total_tests * 100) as cultural_compliance_rate,
        CASE 
            WHEN AVG(bs.avg_duration) > LAG(AVG(bs.avg_duration)) OVER (ORDER BY MAX(bs.batch_time)) THEN 'slower'
            WHEN AVG(bs.avg_duration) < LAG(AVG(bs.avg_duration)) OVER (ORDER BY MAX(bs.batch_time)) THEN 'faster'
            ELSE 'stable'
        END as performance_trend
    FROM test_suites ts
    LEFT JOIN batch_summaries bs ON true
    WHERE ts.id = p_test_suite_id
    GROUP BY ts.suite_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP DEFAULT TEST SUITES
-- =====================================================

-- Create default test suites
DO $$
DECLARE
    unit_suite_id UUID;
    integration_suite_id UUID;
    cultural_suite_id UUID;
    performance_suite_id UUID;
    api_suite_id UUID;
BEGIN
    -- Create unit test suite
    SELECT create_test_suite(
        'database_unit_tests',
        'unit',
        'Unit tests for database functions and procedures',
        false
    ) INTO unit_suite_id;
    
    -- Create integration test suite
    SELECT create_test_suite(
        'system_integration_tests',
        'integration',
        'Integration tests for cross-system functionality',
        false
    ) INTO integration_suite_id;
    
    -- Create cultural compliance test suite
    SELECT create_test_suite(
        'cultural_compliance_tests',
        'cultural',
        'Tests for cultural protocols and sacred content handling',
        true
    ) INTO cultural_suite_id;
    
    -- Create performance test suite
    SELECT create_test_suite(
        'performance_tests',
        'performance',
        'Performance and load testing for database operations',
        false
    ) INTO performance_suite_id;
    
    -- Create API test suite
    SELECT create_test_suite(
        'api_tests',
        'api',
        'API endpoint and integration testing',
        true
    ) INTO api_suite_id;
    
    RAISE NOTICE 'Created default test suites: unit=%, integration=%, cultural=%, performance=%, api=%',
        unit_suite_id, integration_suite_id, cultural_suite_id, performance_suite_id, api_suite_id;
END;
$$;

-- =====================================================
-- PERFORMANCE INDEXES FOR TESTING FRAMEWORK
-- =====================================================

-- Test suites indexes
CREATE INDEX IF NOT EXISTS idx_test_suites_type_status ON test_suites(suite_type, suite_status);
CREATE INDEX IF NOT EXISTS idx_test_suites_cultural ON test_suites(tests_sacred_content, requires_elder_supervision);

-- Test cases indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_suite ON test_cases(test_suite_id, test_status);
CREATE INDEX IF NOT EXISTS idx_test_cases_category ON test_cases(test_category, involves_sacred_data);

-- Test execution results indexes
CREATE INDEX IF NOT EXISTS idx_test_execution_batch ON test_execution_results(execution_batch_id, test_status);
CREATE INDEX IF NOT EXISTS idx_test_execution_suite_time ON test_execution_results(test_suite_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_execution_cultural ON test_execution_results(cultural_protocols_followed, sacred_content_handled_properly);

-- Test data sets indexes
CREATE INDEX IF NOT EXISTS idx_test_datasets_type ON test_data_sets(dataset_type, dataset_status);
CREATE INDEX IF NOT EXISTS idx_test_datasets_cultural ON test_data_sets(contains_sacred_content, cultural_sensitivity_level);

SELECT 'Comprehensive testing framework created successfully' as status;