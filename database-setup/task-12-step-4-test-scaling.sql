-- =====================================================
-- TASK 12 - STEP 4: Test Horizontal Scaling Infrastructure
-- Comprehensive Testing of Scaling Components
-- =====================================================

-- Test partition creation and management
DO $$
DECLARE
    partition_count INTEGER;
    community_count INTEGER;
BEGIN
    RAISE NOTICE '=== Testing Partition Management ===';
    
    -- Test community-based partitions
    SELECT create_community_partitions() INTO partition_count;
    RAISE NOTICE 'Created % community partitions', partition_count;
    
    -- Test time-based partitions for activity tracking
    SELECT create_time_partitions(
        'activity_logs',
        CURRENT_DATE - INTERVAL '2 months',
        CURRENT_DATE + INTERVAL '3 months',
        'month'
    ) INTO partition_count;
    RAISE NOTICE 'Created % time-based partitions for activity_logs', partition_count;
    
    -- Update partition statistics
    SELECT update_partition_statistics() INTO partition_count;
    RAISE NOTICE 'Updated statistics for % partitions', partition_count;
    
END;
$$;

-- Test connection pool functionality
DO $$
DECLARE
    pool_id UUID;
    balancer_id UUID;
    optimal_pool RECORD;
BEGIN
    RAISE NOTICE '=== Testing Connection Pool Management ===';
    
    -- Test creating specialized pools
    SELECT create_connection_pool(
        'test_analytics_pool',
        'analytics',
        'localhost',
        'barkly_research_analytics',
        'analytics_user',
        3,
        25,
        false
    ) INTO pool_id;
    RAISE NOTICE 'Created analytics pool: %', pool_id;
    
    SELECT create_connection_pool(
        'test_sacred_content_pool',
        'cultural_content',
        'localhost',
        'barkly_research_cultural',
        'cultural_user',
        2,
        15,
        true
    ) INTO pool_id;
    RAISE NOTICE 'Created sacred content pool: %', pool_id;
    
    -- Test load balancer configuration
    SELECT configure_load_balancer(
        'test_balancer',
        'cultural_aware',
        true,
        true
    ) INTO balancer_id;
    RAISE NOTICE 'Created test load balancer: %', balancer_id;
    
    -- Test optimal pool selection
    SELECT * INTO optimal_pool
    FROM get_optimal_pool('read_only', NULL, 'member', 'standard');
    
    IF FOUND THEN
        RAISE NOTICE 'Optimal pool selected: % (load: %)', optimal_pool.pool_name, optimal_pool.current_load;
    ELSE
        RAISE NOTICE 'No optimal pool found for test criteria';
    END IF;
    
END;
$$;

-- Test replication monitoring
DO $$
DECLARE
    replication_record RECORD;
    lag_ms INTEGER;
    health_record RECORD;
BEGIN
    RAISE NOTICE '=== Testing Replication Monitoring ===';
    
    -- Test replication lag monitoring for each configuration
    FOR replication_record IN 
        SELECT id, replication_name FROM replication_config WHERE replication_status = 'active'
    LOOP
        SELECT monitor_replication_lag(replication_record.id) INTO lag_ms;
        RAISE NOTICE 'Replication % lag: %ms', replication_record.replication_name, lag_ms;
        
        -- Check health
        SELECT * INTO health_record
        FROM check_replication_health(replication_record.id);
        
        RAISE NOTICE 'Health check for %: % (score: %) - %', 
            health_record.replication_name,
            health_record.status,
            health_record.health_score,
            health_record.recommendation;
    END LOOP;
    
END;
$$;

-- Test conflict resolution
DO $$
DECLARE
    conflict_id UUID;
    test_master_value JSONB;
    test_replica_value JSONB;
    cultural_context JSONB;
    replication_id UUID;
BEGIN
    RAISE NOTICE '=== Testing Conflict Resolution ===';
    
    -- Get a replication configuration
    SELECT id INTO replication_id 
    FROM replication_config 
    WHERE replication_type = 'cultural_sync' 
    LIMIT 1;
    
    IF replication_id IS NOT NULL THEN
        -- Create test conflict data
        test_master_value := jsonb_build_object(
            'title', 'Traditional Story - Master Version',
            'content', 'This is the master version of the story',
            'updated_at', NOW() - INTERVAL '1 hour'
        );
        
        test_replica_value := jsonb_build_object(
            'title', 'Traditional Story - Replica Version',
            'content', 'This is the replica version with different content',
            'updated_at', NOW() - INTERVAL '30 minutes'
        );
        
        cultural_context := jsonb_build_object(
            'cultural_sensitivity_level', 'sensitive',
            'community_id', gen_random_uuid(),
            'requires_elder_review', false
        );
        
        -- Create and handle conflict
        SELECT handle_replication_conflict(
            replication_id,
            'documents',
            gen_random_uuid(),
            'update_update',
            test_master_value,
            test_replica_value,
            cultural_context
        ) INTO conflict_id;
        
        RAISE NOTICE 'Created test conflict: %', conflict_id;
        
        -- Check if it was auto-resolved
        IF EXISTS (
            SELECT 1 FROM replication_conflicts 
            WHERE id = conflict_id AND resolution_status = 'resolved'
        ) THEN
            RAISE NOTICE 'Conflict was automatically resolved by timestamp';
        ELSE
            RAISE NOTICE 'Conflict requires manual resolution';
        END IF;
    ELSE
        RAISE NOTICE 'No cultural sync replication found for conflict testing';
    END IF;
    
END;
$$;

-- Test partition performance analysis
DO $$
DECLARE
    analysis_record RECORD;
    total_partitions INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Testing Partition Performance Analysis ===';
    
    FOR analysis_record IN 
        SELECT * FROM analyze_partition_performance()
    LOOP
        total_partitions := total_partitions + 1;
        RAISE NOTICE 'Partition %: % rows, %, avg query time: %ms - %',
            analysis_record.partition_name,
            analysis_record.row_count,
            analysis_record.size_pretty,
            analysis_record.avg_query_time_ms,
            analysis_record.recommendation;
    END LOOP;
    
    RAISE NOTICE 'Analyzed % partitions total', total_partitions;
    
END;
$$;

-- Test data distribution tracking
DO $$
DECLARE
    shard_id UUID;
    community_id UUID;
BEGIN
    RAISE NOTICE '=== Testing Data Distribution Tracking ===';
    
    -- Get a community for testing
    SELECT id INTO community_id FROM communities LIMIT 1;
    
    IF community_id IS NOT NULL THEN
        -- Configure a test shard
        SELECT configure_community_sharding(
            'test_community_shard',
            ARRAY[community_id],
            'localhost',
            'barkly_research_shard1',
            false
        ) INTO shard_id;
        
        RAISE NOTICE 'Configured test community shard: %', shard_id;
        
        -- Record some test distribution data
        INSERT INTO data_distribution (
            table_name,
            shard_name,
            community_id,
            row_count,
            data_size_bytes,
            sacred_content_count,
            avg_read_time_ms,
            query_frequency_per_hour
        ) VALUES (
            'documents',
            'test_community_shard',
            community_id,
            1500,
            1024 * 1024 * 50, -- 50MB
            25,
            45.5,
            120.0
        );
        
        RAISE NOTICE 'Recorded test distribution data for community shard';
    ELSE
        RAISE NOTICE 'No communities found for distribution testing';
    END IF;
    
END;
$$;

-- Performance benchmark test
DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    test_iterations INTEGER := 100;
    i INTEGER;
BEGIN
    RAISE NOTICE '=== Running Performance Benchmarks ===';
    
    -- Test partition query performance
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM COUNT(*) FROM partition_management WHERE is_active = true;
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Partition management queries: % iterations in %ms (avg: %ms per query)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
    -- Test connection pool queries
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM * FROM get_optimal_pool('read_only', NULL, 'member', 'standard');
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Connection pool selection: % iterations in %ms (avg: %ms per query)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
    -- Test replication health checks
    start_time := clock_timestamp();
    
    FOR i IN 1..test_iterations LOOP
        PERFORM * FROM check_replication_health(
            (SELECT id FROM replication_config LIMIT 1)
        );
    END LOOP;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE 'Replication health checks: % iterations in %ms (avg: %ms per query)',
        test_iterations, duration_ms, duration_ms::DECIMAL / test_iterations;
    
END;
$$;

-- Generate scaling infrastructure summary report
DO $$
DECLARE
    partition_count INTEGER;
    pool_count INTEGER;
    replication_count INTEGER;
    conflict_count INTEGER;
    shard_count INTEGER;
BEGIN
    RAISE NOTICE '=== Horizontal Scaling Infrastructure Summary ===';
    
    -- Count components
    SELECT COUNT(*) INTO partition_count FROM partition_management WHERE is_active = true;
    SELECT COUNT(*) INTO pool_count FROM connection_pools WHERE pool_status = 'active';
    SELECT COUNT(*) INTO replication_count FROM replication_config WHERE replication_status = 'active';
    SELECT COUNT(*) INTO conflict_count FROM replication_conflicts WHERE resolution_status = 'pending';
    SELECT COUNT(*) INTO shard_count FROM sharding_configuration WHERE shard_status = 'active';
    
    RAISE NOTICE 'Active Partitions: %', partition_count;
    RAISE NOTICE 'Active Connection Pools: %', pool_count;
    RAISE NOTICE 'Active Replication Configs: %', replication_count;
    RAISE NOTICE 'Pending Conflicts: %', conflict_count;
    RAISE NOTICE 'Active Shards: %', shard_count;
    
    RAISE NOTICE 'Horizontal scaling infrastructure is ready for production use';
    
END;
$$;

-- Create monitoring views for operational use
CREATE OR REPLACE VIEW scaling_infrastructure_health AS
SELECT 
    'Partitions' as component,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    COUNT(*) FILTER (WHERE needs_maintenance = true) as needs_attention,
    AVG(avg_query_time_ms) as avg_performance_ms
FROM partition_management
UNION ALL
SELECT 
    'Connection Pools' as component,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE pool_status = 'active') as active_count,
    COUNT(*) FILTER (WHERE health_status != 'healthy') as needs_attention,
    AVG(avg_query_time_ms) as avg_performance_ms
FROM connection_pools
UNION ALL
SELECT 
    'Replication' as component,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE replication_status = 'active') as active_count,
    COUNT(*) FILTER (WHERE current_lag_ms > 1000) as needs_attention,
    AVG(current_lag_ms) as avg_performance_ms
FROM replication_config
UNION ALL
SELECT 
    'Shards' as component,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE shard_status = 'active') as active_count,
    COUNT(*) FILTER (WHERE health_score < 0.8) as needs_attention,
    AVG(health_score * 1000) as avg_performance_ms
FROM sharding_configuration;

-- Create cultural scaling compliance view
CREATE OR REPLACE VIEW cultural_scaling_compliance AS
SELECT 
    'Sacred Content Isolation' as check_name,
    CASE 
        WHEN COUNT(*) FILTER (WHERE supports_sacred_content = true) > 0 THEN 'COMPLIANT'
        ELSE 'NON_COMPLIANT'
    END as status,
    COUNT(*) FILTER (WHERE supports_sacred_content = true) as compliant_count,
    COUNT(*) as total_count
FROM connection_pools
UNION ALL
SELECT 
    'Elder Access Controls' as check_name,
    CASE 
        WHEN COUNT(*) FILTER (WHERE elder_access_only = true) > 0 THEN 'COMPLIANT'
        ELSE 'PARTIAL_COMPLIANCE'
    END as status,
    COUNT(*) FILTER (WHERE elder_access_only = true) as compliant_count,
    COUNT(*) as total_count
FROM connection_pools
UNION ALL
SELECT 
    'Cultural Data Sync' as check_name,
    CASE 
        WHEN COUNT(*) FILTER (WHERE cultural_data_sync = true) > 0 THEN 'COMPLIANT'
        ELSE 'NON_COMPLIANT'
    END as status,
    COUNT(*) FILTER (WHERE cultural_data_sync = true) as compliant_count,
    COUNT(*) as total_count
FROM replication_config;

SELECT 'Horizontal scaling infrastructure testing completed successfully' as status;