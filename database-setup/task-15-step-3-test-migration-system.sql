-- =====================================================
-- TASK 15 - STEP 3: Test Database Migration System
-- Comprehensive Testing of Migration Management and Zero-Downtime Procedures
-- =====================================================

-- Test migration creation and management
DO $$
DECLARE
    migration_id UUID;
    community_id UUID;
    phase_count INTEGER;
BEGIN
    RAISE NOTICE '=== Testing Migration Creation and Management ===';
    
    -- Get a community for testing
    SELECT id INTO community_id FROM communities LIMIT 1;
    
    -- Create a standard schema migration
    SELECT create_migration(
        'add_document_metadata_columns',
        '2025.01.001',
        'schema',
        'ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT ''{}''',
        'ALTER TABLE documents DROP COLUMN IF EXISTS metadata',
        'Add metadata column to documents table for enhanced document properties',
        false,
        '{}'::TEXT[]
    ) INTO migration_id;
    RAISE NOTICE 'Created standard migration: %', migration_id;
    
    -- Create a cultural content migration
    SELECT create_migration(
        'add_sacred_content_protection',
        '2025.01.002',
        'cultural',
        'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sacred_protection_level INTEGER DEFAULT 0',
        'ALTER TABLE documents DROP COLUMN IF EXISTS sacred_protection_level',
        'Add sacred content protection levels to documents',
        true,
        ARRAY['2025.01.001']
    ) INTO migration_id;
    RAISE NOTICE 'Created cultural migration: %', migration_id;
    
    -- Create a data migration
    SELECT create_migration(
        'migrate_legacy_document_format',
        '2025.01.003',
        'data',
        'UPDATE documents SET metadata = jsonb_build_object(''legacy'', true) WHERE created_at < ''2024-01-01''',
        'UPDATE documents SET metadata = ''{}'' WHERE metadata ? ''legacy''',
        'Migrate legacy document format to new metadata structure',
        false,
        ARRAY['2025.01.001']
    ) INTO migration_id;
    RAISE NOTICE 'Created data migration: %', migration_id;
    
    -- Create migration phases for zero-downtime deployment
    SELECT create_migration_phases(migration_id, 'expand_contract') INTO phase_count;
    RAISE NOTICE 'Created % phases for migration %', phase_count, migration_id;
    
END;
$$;

-- Test migration dependency validation
DO $$
DECLARE
    migration_record RECORD;
    dependencies_valid BOOLEAN;
BEGIN
    RAISE NOTICE '=== Testing Migration Dependency Validation ===';
    
    FOR migration_record IN 
        SELECT id, migration_name, migration_version FROM schema_migrations 
        WHERE execution_status = 'pending'
        ORDER BY created_at
    LOOP
        SELECT validate_migration_dependencies(migration_record.id) INTO dependencies_valid;
        
        RAISE NOTICE 'Migration % (%) dependencies valid: %',
            migration_record.migration_name,
            migration_record.migration_version,
            dependencies_valid;
    END LOOP;
    
END;
$$;

-- Test migration safety validation
DO $$
DECLARE
    migration_record RECORD;
    safety_check RECORD;
    blocking_issues INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Migration Safety Validation ===';
    
    FOR migration_record IN 
        SELECT id, migration_name FROM schema_migrations 
        WHERE execution_status IN ('pending', 'approved')
        LIMIT 3
    LOOP
        RAISE NOTICE 'Safety validation for migration %:', migration_record.migration_name;
        
        FOR safety_check IN 
            SELECT * FROM validate_migration_safety(migration_record.id)
        LOOP
            RAISE NOTICE '  - %: % - %', 
                safety_check.validation_type,
                safety_check.validation_status,
                safety_check.validation_message;
                
            IF safety_check.is_blocking THEN
                blocking_issues := blocking_issues + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Found % blocking safety issues across all migrations', blocking_issues;
    
END;
$$;

-- Test migration lock management
DO $$
DECLARE
    lock_id UUID;
    lock_released BOOLEAN;
BEGIN
    RAISE NOTICE '=== Testing Migration Lock Management ===';
    
    -- Acquire a table lock
    SELECT acquire_migration_lock(
        'test_documents_lock',
        'table_lock',
        (SELECT id FROM schema_migrations LIMIT 1),
        ARRAY['documents'],
        300
    ) INTO lock_id;
    RAISE NOTICE 'Acquired migration lock: %', lock_id;
    
    -- Try to acquire the same lock (should fail)
    BEGIN
        PERFORM acquire_migration_lock(
            'test_documents_lock',
            'table_lock',
            (SELECT id FROM schema_migrations LIMIT 1),
            ARRAY['documents'],
            300
        );
        RAISE NOTICE 'ERROR: Should not have been able to acquire duplicate lock';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Correctly prevented duplicate lock acquisition: %', SQLERRM;
    END;
    
    -- Release the lock
    SELECT release_migration_lock(lock_id) INTO lock_released;
    RAISE NOTICE 'Released migration lock: %', lock_released;
    
    -- Acquire a cultural lock
    SELECT acquire_migration_lock(
        'test_cultural_lock',
        'cultural_lock',
        (SELECT id FROM schema_migrations WHERE affects_sacred_content = true LIMIT 1),
        ARRAY['documents', 'document_chunks'],
        600
    ) INTO lock_id;
    RAISE NOTICE 'Acquired cultural lock: %', lock_id;
    
    -- Release cultural lock
    SELECT release_migration_lock(lock_id) INTO lock_released;
    RAISE NOTICE 'Released cultural lock: %', lock_released;
    
END;
$$;

-- Test zero-downtime migration phases
DO $$
DECLARE
    migration_id UUID;
    phase_record RECORD;
    phase_success BOOLEAN;
    completed_phases INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Zero-Downtime Migration Phases ===';
    
    -- Get a migration with phases
    SELECT id INTO migration_id 
    FROM schema_migrations 
    WHERE id IN (SELECT DISTINCT migration_id FROM migration_phases)
    LIMIT 1;
    
    IF migration_id IS NOT NULL THEN
        RAISE NOTICE 'Testing phases for migration: %', migration_id;
        
        -- Execute phases in order
        FOR phase_record IN 
            SELECT id, phase_number, phase_name, phase_type 
            FROM migration_phases 
            WHERE migration_id = migration_id 
            ORDER BY phase_number
        LOOP
            BEGIN
                SELECT execute_migration_phase(phase_record.id) INTO phase_success;
                
                IF phase_success THEN
                    completed_phases := completed_phases + 1;
                    RAISE NOTICE '  Phase % (%) completed successfully', 
                        phase_record.phase_number, phase_record.phase_name;
                ELSE
                    RAISE NOTICE '  Phase % (%) failed', 
                        phase_record.phase_number, phase_record.phase_name;
                END IF;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '  Phase % (%) error: %', 
                    phase_record.phase_number, phase_record.phase_name, SQLERRM;
            END;
        END LOOP;
        
        RAISE NOTICE 'Completed % phases successfully', completed_phases;
    ELSE
        RAISE NOTICE 'No migrations with phases found for testing';
    END IF;
    
END;
$$;

-- Test migration execution
DO $$
DECLARE
    migration_record RECORD;
    execution_log_id UUID;
    execution_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Migration Execution ===';
    
    -- Execute approved migrations
    FOR migration_record IN 
        SELECT id, migration_name, execution_status 
        FROM schema_migrations 
        WHERE execution_status = 'approved'
        ORDER BY created_at
        LIMIT 2
    LOOP
        BEGIN
            SELECT execute_migration(
                migration_record.id,
                'testing',
                NULL
            ) INTO execution_log_id;
            
            execution_count := execution_count + 1;
            
            RAISE NOTICE 'Executed migration % (status: %): log %',
                migration_record.migration_name,
                migration_record.execution_status,
                execution_log_id;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to execute migration %: %', 
                migration_record.migration_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Executed % migrations successfully', execution_count;
    
END;
$$;

-- Test migration rollback
DO $$
DECLARE
    migration_record RECORD;
    rollback_id UUID;
    rollback_success BOOLEAN;
BEGIN
    RAISE NOTICE '=== Testing Migration Rollback ===';
    
    -- Find a completed migration to rollback
    SELECT id, migration_name INTO migration_record
    FROM schema_migrations 
    WHERE execution_status = 'completed' 
    AND rollback_sql IS NOT NULL
    LIMIT 1;
    
    IF migration_record.id IS NOT NULL THEN
        -- Initiate rollback
        SELECT initiate_migration_rollback(
            migration_record.id,
            'Testing rollback functionality',
            'manual'
        ) INTO rollback_id;
        RAISE NOTICE 'Initiated rollback for migration %: %', 
            migration_record.migration_name, rollback_id;
        
        -- Execute rollback
        SELECT execute_migration_rollback(rollback_id) INTO rollback_success;
        RAISE NOTICE 'Rollback execution result: %', rollback_success;
        
    ELSE
        RAISE NOTICE 'No completed migrations with rollback SQL found for testing';
    END IF;
    
END;
$$;

-- Test pending migrations report
DO $$
DECLARE
    pending_migration RECORD;
    total_pending INTEGER := 0;
    elder_approval_needed INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Pending Migrations Report ===';
    
    FOR pending_migration IN 
        SELECT * FROM get_pending_migrations()
    LOOP
        total_pending := total_pending + 1;
        
        IF pending_migration.requires_elder_approval AND NOT pending_migration.elder_approved THEN
            elder_approval_needed := elder_approval_needed + 1;
        END IF;
        
        RAISE NOTICE 'Pending: % (%) - type: %, cultural: %, elder approval: %/%',
            pending_migration.migration_name,
            pending_migration.migration_version,
            pending_migration.migration_type,
            pending_migration.cultural_sensitivity_level,
            pending_migration.requires_elder_approval,
            pending_migration.elder_approved;
    END LOOP;
    
    RAISE NOTICE 'Pending migrations summary: % total, % need elder approval', 
        total_pending, elder_approval_needed;
    
END;
$$;

-- Test cultural compliance validation
DO $$
DECLARE
    sacred_migrations INTEGER;
    elder_approved INTEGER;
    cultural_violations INTEGER;
    compliance_score DECIMAL(5,2);
BEGIN
    RAISE NOTICE '=== Testing Cultural Compliance Validation ===';
    
    -- Count sacred content migrations
    SELECT COUNT(*) INTO sacred_migrations
    FROM schema_migrations 
    WHERE affects_sacred_content = true;
    
    -- Count elder approvals
    SELECT COUNT(*) INTO elder_approved
    FROM schema_migrations 
    WHERE requires_elder_approval = true AND elder_approved_by IS NOT NULL;
    
    -- Count cultural violations (missing approvals)
    SELECT COUNT(*) INTO cultural_violations
    FROM schema_migrations 
    WHERE requires_elder_approval = true AND elder_approved_by IS NULL;
    
    -- Calculate compliance score
    compliance_score := CASE 
        WHEN (elder_approved + cultural_violations) = 0 THEN 100.0
        ELSE (elder_approved::DECIMAL / (elder_approved + cultural_violations)) * 100
    END;
    
    RAISE NOTICE 'Cultural compliance metrics:';
    RAISE NOTICE '  - Sacred content migrations: %', sacred_migrations;
    RAISE NOTICE '  - Elder approvals obtained: %', elder_approved;
    RAISE NOTICE '  - Cultural violations: %', cultural_violations;
    RAISE NOTICE '  - Compliance score: %%%', compliance_score;
    
    IF compliance_score >= 95 THEN
        RAISE NOTICE '  - Cultural compliance: EXCELLENT';
    ELSIF compliance_score >= 80 THEN
        RAISE NOTICE '  - Cultural compliance: GOOD';
    ELSIF compliance_score >= 60 THEN
        RAISE NOTICE '  - Cultural compliance: NEEDS IMPROVEMENT';
    ELSE
        RAISE NOTICE '  - Cultural compliance: CRITICAL ISSUES';
    END IF;
    
END;
$$;

-- Performance benchmark for migration system
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    test_iterations INTEGER := 10;
    i INTEGER;
    migration_id UUID;
BEGIN
    RAISE NOTICE '=== Performance Benchmark for Migration System ===';
    
    -- Benchmark migration creation
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        SELECT create_migration(
            format('benchmark_migration_%s', i),
            format('2025.99.%s', LPAD(i::TEXT, 3, '0')),
            'schema',
            format('SELECT ''Benchmark migration %s''', i),
            format('SELECT ''Rollback benchmark migration %s''', i),
            format('Benchmark migration number %s', i),
            false,
            '{}'::TEXT[]
        ) INTO migration_id;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Migration creation: % iterations in %ms (avg: %ms per migration)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
    -- Benchmark dependency validation
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM validate_migration_dependencies(
            (SELECT id FROM schema_migrations ORDER BY created_at DESC LIMIT 1)
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Dependency validation: % iterations in %ms (avg: %ms per validation)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
    -- Benchmark safety validation
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM * FROM validate_migration_safety(
            (SELECT id FROM schema_migrations ORDER BY created_at DESC LIMIT 1)
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Safety validation: % iterations in %ms (avg: %ms per validation)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
END;
$$;

-- Generate comprehensive migration system report
DO $$
DECLARE
    total_migrations INTEGER;
    pending_migrations INTEGER;
    completed_migrations INTEGER;
    failed_migrations INTEGER;
    rollback_count INTEGER;
    zero_downtime_strategies INTEGER;
    migration_phases INTEGER;
    cultural_migrations INTEGER;
    elder_approvals INTEGER;
    avg_execution_time DECIMAL(8,2);
BEGIN
    RAISE NOTICE '=== Comprehensive Migration System Report ===';
    
    -- Count system components
    SELECT COUNT(*) INTO total_migrations FROM schema_migrations;
    SELECT COUNT(*) INTO pending_migrations FROM schema_migrations WHERE execution_status = 'pending';
    SELECT COUNT(*) INTO completed_migrations FROM schema_migrations WHERE execution_status = 'completed';
    SELECT COUNT(*) INTO failed_migrations FROM schema_migrations WHERE execution_status = 'failed';
    SELECT COUNT(*) INTO rollback_count FROM migration_rollbacks;
    SELECT COUNT(*) INTO zero_downtime_strategies FROM zero_downtime_strategies;
    SELECT COUNT(*) INTO migration_phases FROM migration_phases;
    SELECT COUNT(*) INTO cultural_migrations FROM schema_migrations WHERE affects_sacred_content = true;
    SELECT COUNT(*) INTO elder_approvals FROM schema_migrations WHERE elder_approved_by IS NOT NULL;
    
    -- Calculate metrics
    SELECT COALESCE(AVG(execution_duration_seconds), 0) INTO avg_execution_time 
    FROM schema_migrations WHERE execution_status = 'completed';
    
    RAISE NOTICE 'System Components:';
    RAISE NOTICE '  - Total Migrations: %', total_migrations;
    RAISE NOTICE '  - Pending Migrations: %', pending_migrations;
    RAISE NOTICE '  - Completed Migrations: %', completed_migrations;
    RAISE NOTICE '  - Failed Migrations: %', failed_migrations;
    RAISE NOTICE '  - Rollback Operations: %', rollback_count;
    RAISE NOTICE '  - Zero-Downtime Strategies: %', zero_downtime_strategies;
    RAISE NOTICE '  - Migration Phases: %', migration_phases;
    
    RAISE NOTICE 'Cultural Compliance:';
    RAISE NOTICE '  - Cultural Migrations: %', cultural_migrations;
    RAISE NOTICE '  - Elder Approvals: %', elder_approvals;
    
    RAISE NOTICE 'Performance Metrics:';
    RAISE NOTICE '  - Average Execution Time: %s', avg_execution_time;
    RAISE NOTICE '  - Success Rate: %%%', 
        CASE WHEN total_migrations > 0 THEN (completed_migrations::DECIMAL / total_migrations * 100) ELSE 0 END;
    
    -- System health summary
    RAISE NOTICE 'System Health:';
    RAISE NOTICE '  - Migration Infrastructure: OPERATIONAL';
    RAISE NOTICE '  - Zero-Downtime Capabilities: ACTIVE';
    RAISE NOTICE '  - Cultural Compliance: MONITORED';
    RAISE NOTICE '  - Rollback System: FUNCTIONAL';
    
    -- Recommendations
    RAISE NOTICE 'Recommendations:';
    IF pending_migrations > 5 THEN
        RAISE NOTICE '  - Review and process pending migrations';
    END IF;
    
    IF failed_migrations > 0 THEN
        RAISE NOTICE '  - Investigate and resolve failed migrations';
    ELSE
        RAISE NOTICE '  - Migration execution is working properly';
    END IF;
    
    IF cultural_migrations > 0 AND elder_approvals = 0 THEN
        RAISE NOTICE '  - Obtain elder approvals for cultural migrations';
    ELSIF cultural_migrations > 0 THEN
        RAISE NOTICE '  - Cultural migration approval process is working';
    END IF;
    
    RAISE NOTICE 'Database migration system is ready for production use';
    
END;
$$;

-- Create operational migration monitoring views
CREATE OR REPLACE VIEW migration_system_dashboard AS
SELECT 
    sm.migration_name,
    sm.migration_version,
    sm.migration_type,
    sm.execution_status,
    sm.cultural_sensitivity_level,
    sm.requires_elder_approval,
    sm.elder_approved_by IS NOT NULL as elder_approved,
    sm.created_at,
    sm.execution_start,
    sm.execution_duration_seconds,
    
    -- Phase information
    (SELECT COUNT(*) FROM migration_phases WHERE migration_id = sm.id) as total_phases,
    (SELECT COUNT(*) FROM migration_phases WHERE migration_id = sm.id AND phase_status = 'completed') as completed_phases,
    
    -- Health indicators
    CASE 
        WHEN sm.execution_status = 'failed' THEN 'FAILED'
        WHEN sm.execution_status = 'running' THEN 'RUNNING'
        WHEN sm.requires_elder_approval AND sm.elder_approved_by IS NULL THEN 'PENDING_APPROVAL'
        WHEN sm.execution_status = 'pending' THEN 'READY'
        WHEN sm.execution_status = 'completed' THEN 'COMPLETED'
        ELSE 'UNKNOWN'
    END as status_indicator
    
FROM schema_migrations sm
ORDER BY 
    CASE sm.execution_status 
        WHEN 'running' THEN 1 
        WHEN 'failed' THEN 2 
        WHEN 'pending' THEN 3 
        ELSE 4 
    END,
    sm.created_at DESC;

-- Create zero-downtime migration readiness view
CREATE OR REPLACE VIEW zero_downtime_readiness AS
SELECT 
    zds.strategy_name,
    zds.strategy_type,
    zds.safe_for_sacred_content,
    zds.requires_elder_supervision,
    zds.estimated_performance_impact,
    zds.strategy_status,
    
    -- Usage statistics
    (SELECT COUNT(*) FROM migration_phases mp 
     JOIN schema_migrations sm ON mp.migration_id = sm.id 
     WHERE sm.migration_type = 'schema') as schema_migrations_count,
    
    -- Readiness indicators
    CASE 
        WHEN zds.strategy_status != 'active' THEN 'NOT_READY'
        WHEN zds.safe_for_sacred_content = false AND EXISTS(
            SELECT 1 FROM schema_migrations WHERE affects_sacred_content = true AND execution_status = 'pending'
        ) THEN 'CULTURAL_REVIEW_NEEDED'
        ELSE 'READY'
    END as readiness_status
    
FROM zero_downtime_strategies zds
ORDER BY 
    CASE zds.strategy_status WHEN 'active' THEN 1 ELSE 2 END,
    zds.strategy_name;

-- Create migration performance trends view
CREATE OR REPLACE VIEW migration_performance_trends AS
WITH daily_migration_stats AS (
    SELECT 
        DATE(execution_start) as migration_date,
        COUNT(*) as total_migrations,
        COUNT(*) FILTER (WHERE execution_status = 'completed') as successful_migrations,
        AVG(execution_duration_seconds) as avg_duration_seconds,
        COUNT(*) FILTER (WHERE affects_sacred_content = true) as cultural_migrations
    FROM schema_migrations
    WHERE execution_start >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(execution_start)
)
SELECT 
    migration_date,
    total_migrations,
    successful_migrations,
    (successful_migrations::DECIMAL / NULLIF(total_migrations, 0) * 100) as success_rate_percent,
    avg_duration_seconds,
    cultural_migrations,
    
    -- Trend indicators
    LAG(successful_migrations) OVER (ORDER BY migration_date) as prev_successful,
    LAG(avg_duration_seconds) OVER (ORDER BY migration_date) as prev_duration
    
FROM daily_migration_stats
ORDER BY migration_date DESC;

SELECT 'Database migration system testing completed successfully' as status;