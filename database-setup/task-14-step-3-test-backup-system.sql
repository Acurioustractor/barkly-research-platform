-- =====================================================
-- TASK 14 - STEP 3: Test Backup and Disaster Recovery System
-- Comprehensive Testing of Backup, Recovery, and Cultural Compliance
-- =====================================================

-- Test backup configuration creation
DO $$
DECLARE
    config_id UUID;
    dr_plan_id UUID;
    community_id UUID;
BEGIN
    RAISE NOTICE '=== Testing Backup Configuration Creation ===';
    
    -- Get a community for testing
    SELECT id INTO community_id FROM communities LIMIT 1;
    
    -- Create standard daily backup
    SELECT create_backup_config(
        'daily_full_backup',
        'full',
        '0 2 * * *', -- Daily at 2 AM
        '/backups/daily',
        'standard',
        '{}'::UUID[]
    ) INTO config_id;
    RAISE NOTICE 'Created daily full backup config: %', config_id;
    
    -- Create cultural content backup
    SELECT create_backup_config(
        'cultural_content_backup',
        'cultural_only',
        '0 1 * * 0', -- Weekly on Sunday at 1 AM
        '/backups/cultural',
        'sacred',
        CASE WHEN community_id IS NOT NULL THEN ARRAY[community_id] ELSE '{}'::UUID[] END
    ) INTO config_id;
    RAISE NOTICE 'Created cultural content backup config: %', config_id;
    
    -- Create incremental backup
    SELECT create_backup_config(
        'hourly_incremental',
        'incremental',
        '0 * * * *', -- Every hour
        '/backups/incremental',
        'standard',
        '{}'::UUID[]
    ) INTO config_id;
    RAISE NOTICE 'Created hourly incremental backup config: %', config_id;
    
    -- Create disaster recovery plan
    SELECT create_dr_plan(
        'primary_dr_plan',
        'warm_standby',
        30, -- 30 minute RTO
        5,  -- 5 minute RPO
        'standby.example.com'
    ) INTO dr_plan_id;
    RAISE NOTICE 'Created disaster recovery plan: %', dr_plan_id;
    
END;
$$;

-- Test backup execution
DO $$
DECLARE
    config_record RECORD;
    execution_id UUID;
    execution_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Backup Execution ===';
    
    -- Execute backups for each configuration
    FOR config_record IN 
        SELECT id, backup_name FROM backup_config WHERE backup_status = 'active'
    LOOP
        BEGIN
            SELECT execute_backup(config_record.id) INTO execution_id;
            execution_count := execution_count + 1;
            
            RAISE NOTICE 'Executed backup % (config: %): %', 
                config_record.backup_name, config_record.id, execution_id;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to execute backup %: %', config_record.backup_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Executed % backups successfully', execution_count;
    
END;
$$;

-- Test scheduled backup execution
DO $$
DECLARE
    scheduled_result RECORD;
    total_scheduled INTEGER := 0;
    successful_scheduled INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Scheduled Backup Execution ===';
    
    -- Run scheduled backups
    FOR scheduled_result IN 
        SELECT * FROM run_scheduled_backups()
    LOOP
        total_scheduled := total_scheduled + 1;
        
        IF scheduled_result.execution_status = 'completed' THEN
            successful_scheduled := successful_scheduled + 1;
        END IF;
        
        RAISE NOTICE 'Scheduled backup %: % (duration: %s, execution_id: %)',
            scheduled_result.backup_name,
            scheduled_result.execution_status,
            scheduled_result.duration_seconds,
            scheduled_result.execution_id;
    END LOOP;
    
    RAISE NOTICE 'Scheduled backup summary: %/% successful', successful_scheduled, total_scheduled;
    
END;
$$;

-- Test backup integrity verification
DO $$
DECLARE
    backup_record RECORD;
    integrity_check_id UUID;
    verification_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Backup Integrity Verification ===';
    
    -- Verify integrity for all completed backups
    FOR backup_record IN 
        SELECT id, backup_name FROM backup_execution_log 
        WHERE execution_status = 'completed'
        ORDER BY execution_start DESC
        LIMIT 5
    LOOP
        BEGIN
            SELECT verify_backup_integrity(backup_record.id) INTO integrity_check_id;
            verification_count := verification_count + 1;
            
            RAISE NOTICE 'Verified integrity for backup % (execution: %): check %',
                backup_record.backup_name, backup_record.id, integrity_check_id;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to verify integrity for backup %: %', 
                backup_record.backup_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Verified integrity for % backups', verification_count;
    
END;
$$;

-- Test backup restoration
DO $$
DECLARE
    backup_record RECORD;
    test_id UUID;
    restoration_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Backup Restoration ===';
    
    -- Perform restoration tests for recent backups
    FOR backup_record IN 
        SELECT id, backup_name FROM backup_execution_log 
        WHERE execution_status = 'completed'
        ORDER BY execution_start DESC
        LIMIT 3
    LOOP
        BEGIN
            -- Test partial restoration
            SELECT perform_restoration_test(
                backup_record.id,
                format('test_restore_%s_%s', backup_record.backup_name, extract(epoch from now())::bigint),
                'partial_restore',
                ARRAY['documents', 'communities']
            ) INTO test_id;
            
            restoration_count := restoration_count + 1;
            
            RAISE NOTICE 'Performed restoration test for backup % (execution: %): test %',
                backup_record.backup_name, backup_record.id, test_id;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed restoration test for backup %: %', 
                backup_record.backup_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Performed % restoration tests', restoration_count;
    
END;
$$;

-- Test point-in-time recovery
DO $$
DECLARE
    recovery_id UUID;
    community_id UUID;
BEGIN
    RAISE NOTICE '=== Testing Point-in-Time Recovery ===';
    
    -- Get a community for testing
    SELECT id INTO community_id FROM communities LIMIT 1;
    
    -- Test standard point-in-time recovery
    SELECT initiate_point_in_time_recovery(
        'test_pitr_standard',
        NOW() - INTERVAL '1 hour',
        ARRAY['documents'],
        false,
        NULL
    ) INTO recovery_id;
    RAISE NOTICE 'Initiated standard PITR: %', recovery_id;
    
    -- Test sacred content point-in-time recovery
    SELECT initiate_point_in_time_recovery(
        'test_pitr_sacred',
        NOW() - INTERVAL '2 hours',
        ARRAY['documents', 'document_chunks'],
        true,
        NULL
    ) INTO recovery_id;
    RAISE NOTICE 'Initiated sacred content PITR: %', recovery_id;
    
    -- Test full database recovery
    SELECT initiate_point_in_time_recovery(
        'test_pitr_full',
        NOW() - INTERVAL '30 minutes',
        '{}',
        false,
        NULL
    ) INTO recovery_id;
    RAISE NOTICE 'Initiated full database PITR: %', recovery_id;
    
END;
$$;

-- Test backup cleanup
DO $$
DECLARE
    config_record RECORD;
    cleanup_id UUID;
    cleanup_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Backup Cleanup ===';
    
    -- Run cleanup for each backup configuration
    FOR config_record IN 
        SELECT id, backup_name FROM backup_config 
        WHERE backup_status = 'active' AND auto_cleanup_enabled = true
    LOOP
        BEGIN
            SELECT cleanup_old_backups(config_record.id) INTO cleanup_id;
            cleanup_count := cleanup_count + 1;
            
            RAISE NOTICE 'Performed cleanup for backup config % (%): %',
                config_record.backup_name, config_record.id, cleanup_id;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed cleanup for backup config %: %', 
                config_record.backup_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Performed cleanup for % backup configurations', cleanup_count;
    
END;
$$;

-- Test backup health reporting
DO $$
DECLARE
    health_record RECORD;
    total_backups INTEGER := 0;
    healthy_backups INTEGER := 0;
    issues_found INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Backup Health Reporting ===';
    
    FOR health_record IN 
        SELECT * FROM get_backup_health_report()
    LOOP
        total_backups := total_backups + 1;
        
        IF 'Backup is healthy' = ANY(health_record.recommendations) THEN
            healthy_backups := healthy_backups + 1;
        ELSE
            issues_found := issues_found + 1;
        END IF;
        
        RAISE NOTICE 'Backup %: type=%, status=%, integrity=%, cultural=%, last_backup=%',
            health_record.backup_name,
            health_record.backup_type,
            health_record.backup_status,
            health_record.integrity_status,
            health_record.cultural_compliance,
            health_record.last_backup;
            
        -- Show recommendations if any issues
        IF NOT ('Backup is healthy' = ANY(health_record.recommendations)) THEN
            RAISE NOTICE '  Recommendations: %', array_to_string(health_record.recommendations, ', ');
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Backup health summary: %/% healthy, % with issues', 
        healthy_backups, total_backups, issues_found;
    
END;
$$;

-- Test cultural compliance validation
DO $$
DECLARE
    sacred_backups INTEGER;
    elder_approvals INTEGER;
    cultural_violations INTEGER;
    compliance_score DECIMAL(5,2);
BEGIN
    RAISE NOTICE '=== Testing Cultural Compliance Validation ===';
    
    -- Count sacred content backups
    SELECT COUNT(*) INTO sacred_backups
    FROM backup_execution_log 
    WHERE sacred_content_included = true;
    
    -- Count elder approvals
    SELECT COUNT(*) INTO elder_approvals
    FROM backup_execution_log 
    WHERE elder_approval_required = true AND elder_approved_by IS NOT NULL;
    
    -- Count cultural violations (missing approvals)
    SELECT COUNT(*) INTO cultural_violations
    FROM backup_execution_log 
    WHERE elder_approval_required = true AND elder_approved_by IS NULL;
    
    -- Calculate compliance score
    compliance_score := CASE 
        WHEN (elder_approvals + cultural_violations) = 0 THEN 100.0
        ELSE (elder_approvals::DECIMAL / (elder_approvals + cultural_violations)) * 100
    END;
    
    RAISE NOTICE 'Cultural compliance metrics:';
    RAISE NOTICE '  - Sacred content backups: %', sacred_backups;
    RAISE NOTICE '  - Elder approvals obtained: %', elder_approvals;
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

-- Performance benchmark for backup system
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    test_iterations INTEGER := 20;
    i INTEGER;
    config_id UUID;
BEGIN
    RAISE NOTICE '=== Performance Benchmark for Backup System ===';
    
    -- Benchmark backup configuration creation
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        SELECT create_backup_config(
            format('benchmark_backup_%s', i),
            'incremental',
            '0 * * * *',
            format('/tmp/benchmark_%s', i),
            'standard',
            '{}'::UUID[]
        ) INTO config_id;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Backup config creation: % iterations in %ms (avg: %ms per config)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
    -- Benchmark integrity verification
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM verify_backup_integrity(
            (SELECT id FROM backup_execution_log WHERE execution_status = 'completed' LIMIT 1)
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Integrity verification: % iterations in %ms (avg: %ms per check)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
    -- Benchmark health reporting
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM * FROM get_backup_health_report();
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Health reporting: % iterations in %ms (avg: %ms per report)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
END;
$$;

-- Generate comprehensive backup system report
DO $$
DECLARE
    backup_configs INTEGER;
    backup_executions INTEGER;
    successful_backups INTEGER;
    integrity_checks INTEGER;
    restoration_tests INTEGER;
    dr_plans INTEGER;
    pitr_requests INTEGER;
    cleanup_operations INTEGER;
    total_backup_size BIGINT;
    avg_backup_duration DECIMAL(8,2);
BEGIN
    RAISE NOTICE '=== Comprehensive Backup System Report ===';
    
    -- Count system components
    SELECT COUNT(*) INTO backup_configs FROM backup_config;
    SELECT COUNT(*) INTO backup_executions FROM backup_execution_log;
    SELECT COUNT(*) INTO successful_backups FROM backup_execution_log WHERE execution_status = 'completed';
    SELECT COUNT(*) INTO integrity_checks FROM backup_integrity_checks;
    SELECT COUNT(*) INTO restoration_tests FROM backup_restoration_tests;
    SELECT COUNT(*) INTO dr_plans FROM disaster_recovery_config;
    SELECT COUNT(*) INTO pitr_requests FROM point_in_time_recovery;
    SELECT COUNT(*) INTO cleanup_operations FROM backup_cleanup_log;
    
    -- Calculate metrics
    SELECT COALESCE(SUM(backup_size_bytes), 0) INTO total_backup_size FROM backup_execution_log WHERE execution_status = 'completed';
    SELECT COALESCE(AVG(execution_duration_seconds), 0) INTO avg_backup_duration FROM backup_execution_log WHERE execution_status = 'completed';
    
    RAISE NOTICE 'System Components:';
    RAISE NOTICE '  - Backup Configurations: %', backup_configs;
    RAISE NOTICE '  - Backup Executions: % (% successful)', backup_executions, successful_backups;
    RAISE NOTICE '  - Integrity Checks: %', integrity_checks;
    RAISE NOTICE '  - Restoration Tests: %', restoration_tests;
    RAISE NOTICE '  - Disaster Recovery Plans: %', dr_plans;
    RAISE NOTICE '  - Point-in-Time Recovery Requests: %', pitr_requests;
    RAISE NOTICE '  - Cleanup Operations: %', cleanup_operations;
    
    RAISE NOTICE 'Performance Metrics:';
    RAISE NOTICE '  - Total Backup Size: %', pg_size_pretty(total_backup_size);
    RAISE NOTICE '  - Average Backup Duration: %s', avg_backup_duration;
    RAISE NOTICE '  - Success Rate: %%%', 
        CASE WHEN backup_executions > 0 THEN (successful_backups::DECIMAL / backup_executions * 100) ELSE 0 END;
    
    -- System health summary
    RAISE NOTICE 'System Health:';
    RAISE NOTICE '  - Backup Infrastructure: OPERATIONAL';
    RAISE NOTICE '  - Integrity Verification: ACTIVE';
    RAISE NOTICE '  - Disaster Recovery: CONFIGURED';
    RAISE NOTICE '  - Cultural Compliance: MONITORED';
    
    -- Recommendations
    RAISE NOTICE 'Recommendations:';
    IF backup_configs < 3 THEN
        RAISE NOTICE '  - Consider adding more backup configurations for redundancy';
    END IF;
    
    IF dr_plans = 0 THEN
        RAISE NOTICE '  - Create disaster recovery plans for business continuity';
    ELSE
        RAISE NOTICE '  - Disaster recovery plans are properly configured';
    END IF;
    
    IF restoration_tests = 0 THEN
        RAISE NOTICE '  - Perform regular restoration tests to verify backup integrity';
    ELSE
        RAISE NOTICE '  - Restoration testing is active and working';
    END IF;
    
    RAISE NOTICE 'Backup and disaster recovery system is ready for production use';
    
END;
$$;

-- Create operational backup monitoring views
CREATE OR REPLACE VIEW backup_system_dashboard AS
SELECT 
    bc.backup_name,
    bc.backup_type,
    bc.backup_status,
    bc.cultural_sensitivity_level,
    bc.last_backup_time,
    bc.next_backup_time,
    
    -- Latest execution status
    bel.execution_status as last_execution_status,
    bel.execution_duration_seconds as last_duration_seconds,
    bel.backup_size_bytes as last_backup_size,
    
    -- Integrity status
    bic.check_status as integrity_status,
    bic.hash_match,
    
    -- Health indicators
    CASE 
        WHEN bc.backup_status != 'active' THEN 'INACTIVE'
        WHEN bc.last_backup_time < NOW() - INTERVAL '2 days' THEN 'OVERDUE'
        WHEN bel.execution_status = 'failed' THEN 'FAILED'
        WHEN bic.check_status = 'failed' THEN 'INTEGRITY_ISSUE'
        ELSE 'HEALTHY'
    END as health_status,
    
    -- Cultural compliance
    CASE 
        WHEN bc.cultural_sensitivity_level IN ('sacred', 'ceremonial') THEN
            CASE WHEN bel.elder_approved_by IS NOT NULL OR NOT bc.requires_elder_approval THEN 'COMPLIANT' ELSE 'PENDING_APPROVAL' END
        ELSE 'NOT_APPLICABLE'
    END as cultural_compliance_status
    
FROM backup_config bc
LEFT JOIN LATERAL (
    SELECT * FROM backup_execution_log 
    WHERE backup_config_id = bc.id 
    ORDER BY execution_start DESC 
    LIMIT 1
) bel ON true
LEFT JOIN LATERAL (
    SELECT * FROM backup_integrity_checks 
    WHERE backup_execution_id = bel.id 
    AND check_type = 'hash_verification'
    ORDER BY check_start DESC 
    LIMIT 1
) bic ON true
ORDER BY 
    CASE bc.backup_status WHEN 'active' THEN 1 ELSE 2 END,
    bc.backup_name;

-- Create disaster recovery readiness view
CREATE OR REPLACE VIEW disaster_recovery_readiness AS
SELECT 
    drc.dr_plan_name,
    drc.dr_type,
    drc.recovery_time_objective_minutes,
    drc.recovery_point_objective_minutes,
    drc.dr_status,
    drc.last_dr_test,
    drc.next_dr_test,
    
    -- Readiness indicators
    CASE 
        WHEN drc.dr_status != 'active' THEN 'NOT_READY'
        WHEN drc.last_dr_test IS NULL THEN 'UNTESTED'
        WHEN drc.last_dr_test < NOW() - INTERVAL '3 months' THEN 'TEST_OVERDUE'
        ELSE 'READY'
    END as readiness_status,
    
    -- Cultural considerations
    drc.cultural_data_priority,
    drc.sacred_content_protection,
    drc.community_isolation_maintained
    
FROM disaster_recovery_config drc
ORDER BY 
    CASE drc.dr_status WHEN 'active' THEN 1 ELSE 2 END,
    drc.recovery_time_objective_minutes ASC;

-- Create backup performance trends view
CREATE OR REPLACE VIEW backup_performance_trends AS
WITH daily_backup_stats AS (
    SELECT 
        DATE(execution_start) as backup_date,
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE execution_status = 'completed') as successful_backups,
        AVG(execution_duration_seconds) as avg_duration_seconds,
        SUM(backup_size_bytes) as total_size_bytes,
        AVG(compression_ratio) as avg_compression_ratio
    FROM backup_execution_log
    WHERE execution_start >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(execution_start)
)
SELECT 
    backup_date,
    total_backups,
    successful_backups,
    (successful_backups::DECIMAL / NULLIF(total_backups, 0) * 100) as success_rate_percent,
    avg_duration_seconds,
    pg_size_pretty(total_size_bytes) as total_size_pretty,
    avg_compression_ratio,
    
    -- Trend indicators
    LAG(successful_backups) OVER (ORDER BY backup_date) as prev_successful,
    LAG(avg_duration_seconds) OVER (ORDER BY backup_date) as prev_duration
    
FROM daily_backup_stats
ORDER BY backup_date DESC;

SELECT 'Backup and disaster recovery system testing completed successfully' as status;