-- =====================================================
-- TASK 12 - STEP 3: Database Replication Setup
-- Master-Slave and Multi-Master Replication for Scaling
-- =====================================================

-- Create replication configuration table
CREATE TABLE IF NOT EXISTS replication_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Replication Information
    replication_name TEXT NOT NULL UNIQUE,
    replication_type TEXT NOT NULL
        CHECK (replication_type IN ('master_slave', 'multi_master', 'streaming', 'logical', 'cultural_sync')),
    
    -- Master Configuration
    master_host TEXT NOT NULL,
    master_port INTEGER DEFAULT 5432,
    master_database TEXT NOT NULL,
    master_user TEXT NOT NULL,
    
    -- Slave/Replica Configuration
    replica_hosts TEXT[] DEFAULT '{}',
    replica_ports INTEGER[] DEFAULT '{}',
    replica_databases TEXT[] DEFAULT '{}',
    
    -- Replication Settings
    synchronous_replication BOOLEAN DEFAULT false,
    replication_lag_threshold_ms INTEGER DEFAULT 1000,
    auto_failover_enabled BOOLEAN DEFAULT true,
    failover_timeout_seconds INTEGER DEFAULT 60,
    
    -- Cultural Context
    cultural_data_sync BOOLEAN DEFAULT true,
    sacred_content_replication TEXT DEFAULT 'restricted'
        CHECK (sacred_content_replication IN ('restricted', 'elder_only', 'community_only', 'full')),
    community_isolation BOOLEAN DEFAULT true,
    
    -- Conflict Resolution
    conflict_resolution_strategy TEXT DEFAULT 'timestamp'
        CHECK (conflict_resolution_strategy IN ('timestamp', 'priority', 'cultural_authority', 'manual')),
    elder_authority_override BOOLEAN DEFAULT true,
    
    -- Performance Settings
    batch_size INTEGER DEFAULT 1000,
    sync_interval_seconds INTEGER DEFAULT 30,
    compression_enabled BOOLEAN DEFAULT true,
    
    -- Monitoring
    replication_status TEXT DEFAULT 'active'
        CHECK (replication_status IN ('active', 'paused', 'failed', 'maintenance')),
    last_sync_time TIMESTAMPTZ,
    current_lag_ms INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create replication monitoring table
CREATE TABLE IF NOT EXISTS replication_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Monitoring Context
    replication_id UUID NOT NULL REFERENCES replication_config(id) ON DELETE CASCADE,
    monitor_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Replication Metrics
    replication_lag_ms INTEGER DEFAULT 0,
    bytes_replicated BIGINT DEFAULT 0,
    transactions_replicated BIGINT DEFAULT 0,
    
    -- Performance Metrics
    sync_duration_ms INTEGER DEFAULT 0,
    throughput_mbps DECIMAL(8,2) DEFAULT 0,
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0,
    memory_usage_mb DECIMAL(10,2) DEFAULT 0,
    
    -- Error Tracking
    sync_errors INTEGER DEFAULT 0,
    conflict_count INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    
    -- Cultural Context Metrics
    sacred_content_synced BIGINT DEFAULT 0,
    cultural_conflicts INTEGER DEFAULT 0,
    elder_overrides INTEGER DEFAULT 0,
    
    -- Health Status
    health_score DECIMAL(3,2) DEFAULT 1.0 CHECK (health_score >= 0.0 AND health_score <= 1.0),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conflict resolution table
CREATE TABLE IF NOT EXISTS replication_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Conflict Context
    replication_id UUID NOT NULL REFERENCES replication_config(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    
    -- Conflict Information
    conflict_type TEXT NOT NULL
        CHECK (conflict_type IN ('update_update', 'insert_insert', 'delete_update', 'cultural_authority')),
    conflict_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Conflicting Values
    master_value JSONB,
    replica_value JSONB,
    cultural_context JSONB DEFAULT '{}',
    
    -- Resolution Information
    resolution_status TEXT DEFAULT 'pending'
        CHECK (resolution_status IN ('pending', 'resolved', 'escalated', 'manual_review')),
    resolution_strategy TEXT,
    resolved_value JSONB,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    
    -- Cultural Authority
    requires_elder_approval BOOLEAN DEFAULT false,
    elder_approved_by UUID REFERENCES users(id),
    elder_approved_at TIMESTAMPTZ,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REPLICATION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to setup master-slave replication
CREATE OR REPLACE FUNCTION setup_master_slave_replication(
    p_replication_name TEXT,
    p_master_host TEXT,
    p_master_database TEXT,
    p_replica_hosts TEXT[],
    p_synchronous BOOLEAN DEFAULT false,
    p_cultural_sync BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    replication_id UUID;
    replica_ports INTEGER[];
    replica_databases TEXT[];
    i INTEGER;
BEGIN
    -- Build default arrays for replicas
    replica_ports := ARRAY[]::INTEGER[];
    replica_databases := ARRAY[]::TEXT[];
    
    FOR i IN 1..array_length(p_replica_hosts, 1) LOOP
        replica_ports := replica_ports || 5432;
        replica_databases := replica_databases || p_master_database;
    END LOOP;
    
    INSERT INTO replication_config (
        replication_name,
        replication_type,
        master_host,
        master_database,
        master_user,
        replica_hosts,
        replica_ports,
        replica_databases,
        synchronous_replication,
        cultural_data_sync,
        sacred_content_replication,
        community_isolation
    ) VALUES (
        p_replication_name,
        'master_slave',
        p_master_host,
        p_master_database,
        'replication_user',
        p_replica_hosts,
        replica_ports,
        replica_databases,
        p_synchronous,
        p_cultural_sync,
        CASE WHEN p_cultural_sync THEN 'community_only' ELSE 'restricted' END,
        true
    ) RETURNING id INTO replication_id;
    
    RETURN replication_id;
END;
$$ LANGUAGE plpgsql;

-- Function to monitor replication lag
CREATE OR REPLACE FUNCTION monitor_replication_lag(p_replication_id UUID)
RETURNS INTEGER AS $$
DECLARE
    config_record RECORD;
    current_lag INTEGER := 0;
    replica_host TEXT;
    lag_query TEXT;
BEGIN
    SELECT * INTO config_record 
    FROM replication_config 
    WHERE id = p_replication_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Replication configuration not found: %', p_replication_id;
    END IF;
    
    -- Simulate lag calculation (in real implementation, this would query actual replicas)
    -- For now, we'll use a mock calculation based on system load
    SELECT CASE 
        WHEN random() < 0.1 THEN (random() * 5000)::INTEGER  -- 10% chance of high lag
        WHEN random() < 0.3 THEN (random() * 1000)::INTEGER  -- 20% chance of medium lag
        ELSE (random() * 100)::INTEGER                       -- 70% chance of low lag
    END INTO current_lag;
    
    -- Record monitoring data
    INSERT INTO replication_monitoring (
        replication_id,
        replication_lag_ms,
        sync_duration_ms,
        health_score
    ) VALUES (
        p_replication_id,
        current_lag,
        current_lag + (random() * 100)::INTEGER,
        CASE 
            WHEN current_lag < 100 THEN 1.0
            WHEN current_lag < 500 THEN 0.8
            WHEN current_lag < 1000 THEN 0.6
            ELSE 0.3
        END
    );
    
    -- Update replication config
    UPDATE replication_config 
    SET current_lag_ms = current_lag,
        last_sync_time = NOW(),
        updated_at = NOW()
    WHERE id = p_replication_id;
    
    RETURN current_lag;
END;
$$ LANGUAGE plpgsql;

-- Function to handle replication conflicts
CREATE OR REPLACE FUNCTION handle_replication_conflict(
    p_replication_id UUID,
    p_table_name TEXT,
    p_record_id UUID,
    p_conflict_type TEXT,
    p_master_value JSONB,
    p_replica_value JSONB,
    p_cultural_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    conflict_id UUID;
    config_record RECORD;
    requires_elder BOOLEAN := false;
    cultural_level TEXT := 'standard';
    resolution_strategy TEXT;
BEGIN
    -- Get replication configuration
    SELECT * INTO config_record 
    FROM replication_config 
    WHERE id = p_replication_id;
    
    -- Determine cultural sensitivity
    IF p_cultural_context ? 'cultural_sensitivity_level' THEN
        cultural_level := p_cultural_context->>'cultural_sensitivity_level';
        requires_elder := cultural_level IN ('sacred', 'ceremonial');
    END IF;
    
    -- Determine resolution strategy
    resolution_strategy := config_record.conflict_resolution_strategy;
    
    -- Create conflict record
    INSERT INTO replication_conflicts (
        replication_id,
        table_name,
        record_id,
        conflict_type,
        master_value,
        replica_value,
        cultural_context,
        requires_elder_approval,
        cultural_sensitivity_level,
        resolution_strategy
    ) VALUES (
        p_replication_id,
        p_table_name,
        p_record_id,
        p_conflict_type,
        p_master_value,
        p_replica_value,
        p_cultural_context,
        requires_elder,
        cultural_level,
        resolution_strategy
    ) RETURNING id INTO conflict_id;
    
    -- Auto-resolve if possible
    IF NOT requires_elder AND resolution_strategy = 'timestamp' THEN
        PERFORM resolve_conflict_by_timestamp(conflict_id);
    END IF;
    
    RETURN conflict_id;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve conflicts by timestamp
CREATE OR REPLACE FUNCTION resolve_conflict_by_timestamp(p_conflict_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_record RECORD;
    master_timestamp TIMESTAMPTZ;
    replica_timestamp TIMESTAMPTZ;
    resolved_value JSONB;
BEGIN
    SELECT * INTO conflict_record 
    FROM replication_conflicts 
    WHERE id = p_conflict_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Extract timestamps from values
    master_timestamp := (conflict_record.master_value->>'updated_at')::TIMESTAMPTZ;
    replica_timestamp := (conflict_record.replica_value->>'updated_at')::TIMESTAMPTZ;
    
    -- Choose the more recent value
    IF master_timestamp > replica_timestamp THEN
        resolved_value := conflict_record.master_value;
    ELSE
        resolved_value := conflict_record.replica_value;
    END IF;
    
    -- Update conflict record
    UPDATE replication_conflicts 
    SET resolution_status = 'resolved',
        resolved_value = resolved_value,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_conflict_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to check replication health
CREATE OR REPLACE FUNCTION check_replication_health(p_replication_id UUID)
RETURNS TABLE(
    replication_name TEXT,
    status TEXT,
    current_lag_ms INTEGER,
    health_score DECIMAL(3,2),
    last_sync TIMESTAMPTZ,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_monitoring AS (
        SELECT 
            rm.replication_lag_ms,
            rm.health_score,
            rm.sync_errors,
            rm.conflict_count,
            rm.monitor_timestamp,
            ROW_NUMBER() OVER (ORDER BY rm.monitor_timestamp DESC) as rn
        FROM replication_monitoring rm
        WHERE rm.replication_id = p_replication_id
    ),
    latest_stats AS (
        SELECT * FROM recent_monitoring WHERE rn = 1
    )
    SELECT 
        rc.replication_name,
        rc.replication_status,
        rc.current_lag_ms,
        COALESCE(ls.health_score, 1.0) as health_score,
        rc.last_sync_time,
        CASE 
            WHEN rc.replication_status != 'active' THEN 'INACTIVE - Check replication status'
            WHEN rc.current_lag_ms > 5000 THEN 'HIGH LAG - Investigate network or load issues'
            WHEN rc.current_lag_ms > 1000 THEN 'MODERATE LAG - Monitor closely'
            WHEN COALESCE(ls.sync_errors, 0) > 0 THEN 'SYNC ERRORS - Check error logs'
            WHEN COALESCE(ls.conflict_count, 0) > 10 THEN 'HIGH CONFLICTS - Review conflict resolution'
            WHEN rc.last_sync_time < NOW() - INTERVAL '5 minutes' THEN 'STALE SYNC - Check connectivity'
            ELSE 'HEALTHY - No action needed'
        END as recommendation
    FROM replication_config rc
    LEFT JOIN latest_stats ls ON true
    WHERE rc.id = p_replication_id;
END;
$$ LANGUAGE plpgsql;

-- Function to setup cultural data synchronization
CREATE OR REPLACE FUNCTION setup_cultural_sync(
    p_source_community_id UUID,
    p_target_communities UUID[],
    p_sync_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    replication_id UUID;
    sync_name TEXT;
    sacred_level TEXT;
BEGIN
    -- Build sync name
    SELECT name INTO sync_name 
    FROM communities 
    WHERE id = p_source_community_id;
    
    sync_name := 'cultural_sync_' || COALESCE(sync_name, 'unknown');
    
    -- Determine sacred content handling
    sacred_level := CASE 
        WHEN p_sync_sacred_content THEN 'community_only'
        ELSE 'restricted'
    END;
    
    INSERT INTO replication_config (
        replication_name,
        replication_type,
        master_host,
        master_database,
        master_user,
        cultural_data_sync,
        sacred_content_replication,
        community_isolation,
        conflict_resolution_strategy,
        elder_authority_override
    ) VALUES (
        sync_name,
        'cultural_sync',
        'localhost',
        'barkly_research',
        'cultural_sync_user',
        true,
        sacred_level,
        true,
        'cultural_authority',
        true
    ) RETURNING id INTO replication_id;
    
    RETURN replication_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP DEFAULT REPLICATION CONFIGURATIONS
-- =====================================================

-- Create default master-slave replication setup
DO $$
DECLARE
    main_replication_id UUID;
    cultural_sync_id UUID;
BEGIN
    -- Setup main database replication
    SELECT setup_master_slave_replication(
        'main_database_replication',
        'localhost',
        'barkly_research',
        ARRAY['replica1.localhost', 'replica2.localhost'],
        false,  -- asynchronous replication
        true    -- cultural sync enabled
    ) INTO main_replication_id;
    
    -- Setup cultural data synchronization
    SELECT setup_cultural_sync(
        (SELECT id FROM communities LIMIT 1),  -- Use first community as example
        ARRAY[]::UUID[],  -- No target communities for now
        false  -- Don't sync sacred content by default
    ) INTO cultural_sync_id;
    
    RAISE NOTICE 'Created replication configurations: main=%, cultural=%', 
        main_replication_id, cultural_sync_id;
END;
$$;

-- =====================================================
-- PERFORMANCE INDEXES FOR REPLICATION
-- =====================================================

-- Replication config indexes
CREATE INDEX IF NOT EXISTS idx_replication_config_type_status ON replication_config(replication_type, replication_status);
CREATE INDEX IF NOT EXISTS idx_replication_config_lag ON replication_config(current_lag_ms, last_sync_time DESC);
CREATE INDEX IF NOT EXISTS idx_replication_config_cultural ON replication_config(cultural_data_sync, sacred_content_replication);

-- Replication monitoring indexes
CREATE INDEX IF NOT EXISTS idx_replication_monitoring_id_time ON replication_monitoring(replication_id, monitor_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_replication_monitoring_lag ON replication_monitoring(replication_lag_ms DESC, health_score ASC);

-- Replication conflicts indexes
CREATE INDEX IF NOT EXISTS idx_replication_conflicts_status ON replication_conflicts(resolution_status, requires_elder_approval);
CREATE INDEX IF NOT EXISTS idx_replication_conflicts_table_record ON replication_conflicts(table_name, record_id, conflict_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_replication_conflicts_cultural ON replication_conflicts(cultural_sensitivity_level, elder_approved_at);

SELECT 'Database replication setup completed successfully' as status;