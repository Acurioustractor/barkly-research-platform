-- =====================================================
-- TASK 12 - STEP 2: Connection Pooling and Load Balancing
-- Database Connection Management for Horizontal Scaling
-- =====================================================

-- Create connection pool configuration table
CREATE TABLE IF NOT EXISTS connection_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pool Information
    pool_name TEXT NOT NULL UNIQUE,
    pool_type TEXT NOT NULL
        CHECK (pool_type IN ('read_write', 'read_only', 'analytics', 'cultural_content', 'admin')),
    
    -- Database Connection
    database_host TEXT NOT NULL,
    database_port INTEGER DEFAULT 5432,
    database_name TEXT NOT NULL,
    database_user TEXT NOT NULL,
    
    -- Pool Configuration
    min_connections INTEGER DEFAULT 5,
    max_connections INTEGER DEFAULT 100,
    connection_timeout_seconds INTEGER DEFAULT 30,
    idle_timeout_seconds INTEGER DEFAULT 600,
    max_lifetime_seconds INTEGER DEFAULT 3600,
    
    -- Load Balancing
    weight INTEGER DEFAULT 100, -- Higher weight = more traffic
    priority INTEGER DEFAULT 1, -- Lower number = higher priority
    
    -- Health Monitoring
    health_check_interval_seconds INTEGER DEFAULT 30,
    health_check_timeout_seconds INTEGER DEFAULT 5,
    health_check_query TEXT DEFAULT 'SELECT 1',
    
    -- Current Status
    current_connections INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    idle_connections INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_connection_time_ms DECIMAL(8,2) DEFAULT 0,
    avg_query_time_ms DECIMAL(8,2) DEFAULT 0,
    total_queries BIGINT DEFAULT 0,
    failed_connections BIGINT DEFAULT 0,
    
    -- Cultural Context
    supports_sacred_content BOOLEAN DEFAULT false,
    elder_access_only BOOLEAN DEFAULT false,
    cultural_protocols JSONB DEFAULT '{}',
    
    -- Status
    pool_status TEXT DEFAULT 'active'
        CHECK (pool_status IN ('active', 'draining', 'maintenance', 'offline')),
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    health_status TEXT DEFAULT 'healthy'
        CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create load balancer configuration table
CREATE TABLE IF NOT EXISTS load_balancer_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Load Balancer Information
    balancer_name TEXT NOT NULL UNIQUE,
    balancer_type TEXT NOT NULL
        CHECK (balancer_type IN ('round_robin', 'weighted_round_robin', 'least_connections', 'cultural_aware', 'geographic')),
    
    -- Routing Rules
    routing_rules JSONB DEFAULT '{}',
    cultural_routing_enabled BOOLEAN DEFAULT true,
    geographic_routing_enabled BOOLEAN DEFAULT false,
    
    -- Pool Assignments
    read_write_pools UUID[] DEFAULT '{}',
    read_only_pools UUID[] DEFAULT '{}',
    analytics_pools UUID[] DEFAULT '{}',
    cultural_content_pools UUID[] DEFAULT '{}',
    
    -- Failover Configuration
    failover_enabled BOOLEAN DEFAULT true,
    failover_threshold_seconds INTEGER DEFAULT 30,
    auto_recovery_enabled BOOLEAN DEFAULT true,
    recovery_check_interval_seconds INTEGER DEFAULT 60,
    
    -- Performance Settings
    connection_retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 5,
    circuit_breaker_enabled BOOLEAN DEFAULT true,
    circuit_breaker_threshold INTEGER DEFAULT 10,
    
    -- Cultural Context
    sacred_content_isolation BOOLEAN DEFAULT true,
    elder_priority_routing BOOLEAN DEFAULT true,
    cultural_compliance_checks BOOLEAN DEFAULT true,
    
    -- Status
    balancer_status TEXT DEFAULT 'active'
        CHECK (balancer_status IN ('active', 'maintenance', 'offline')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create connection metrics table for monitoring
CREATE TABLE IF NOT EXISTS connection_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Context
    pool_id UUID NOT NULL REFERENCES connection_pools(id) ON DELETE CASCADE,
    metric_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Connection Statistics
    total_connections INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    idle_connections INTEGER DEFAULT 0,
    waiting_connections INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_connection_time_ms DECIMAL(8,2) DEFAULT 0,
    max_connection_time_ms DECIMAL(8,2) DEFAULT 0,
    avg_query_time_ms DECIMAL(8,2) DEFAULT 0,
    max_query_time_ms DECIMAL(8,2) DEFAULT 0,
    
    -- Throughput Metrics
    queries_per_second DECIMAL(8,2) DEFAULT 0,
    connections_per_second DECIMAL(8,2) DEFAULT 0,
    
    -- Error Metrics
    connection_errors INTEGER DEFAULT 0,
    query_errors INTEGER DEFAULT 0,
    timeout_errors INTEGER DEFAULT 0,
    
    -- Cultural Context Metrics
    sacred_content_queries INTEGER DEFAULT 0,
    elder_access_queries INTEGER DEFAULT 0,
    cultural_protocol_violations INTEGER DEFAULT 0,
    
    -- Resource Usage
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0,
    memory_usage_mb DECIMAL(10,2) DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONNECTION POOL MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create a connection pool
CREATE OR REPLACE FUNCTION create_connection_pool(
    p_pool_name TEXT,
    p_pool_type TEXT,
    p_database_host TEXT,
    p_database_name TEXT,
    p_database_user TEXT,
    p_min_connections INTEGER DEFAULT 5,
    p_max_connections INTEGER DEFAULT 100,
    p_supports_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    pool_id UUID;
BEGIN
    INSERT INTO connection_pools (
        pool_name,
        pool_type,
        database_host,
        database_name,
        database_user,
        min_connections,
        max_connections,
        supports_sacred_content,
        elder_access_only
    ) VALUES (
        p_pool_name,
        p_pool_type,
        p_database_host,
        p_database_name,
        p_database_user,
        p_min_connections,
        p_max_connections,
        p_supports_sacred_content,
        p_supports_sacred_content AND p_pool_type = 'cultural_content'
    ) RETURNING id INTO pool_id;
    
    RETURN pool_id;
END;
$$ LANGUAGE plpgsql;

-- Function to configure load balancer
CREATE OR REPLACE FUNCTION configure_load_balancer(
    p_balancer_name TEXT,
    p_balancer_type TEXT DEFAULT 'cultural_aware',
    p_cultural_routing_enabled BOOLEAN DEFAULT true,
    p_sacred_content_isolation BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    balancer_id UUID;
    routing_rules JSONB;
BEGIN
    -- Build routing rules based on configuration
    routing_rules := jsonb_build_object(
        'cultural_routing', p_cultural_routing_enabled,
        'sacred_isolation', p_sacred_content_isolation,
        'elder_priority', true,
        'community_affinity', true
    );
    
    INSERT INTO load_balancer_config (
        balancer_name,
        balancer_type,
        routing_rules,
        cultural_routing_enabled,
        sacred_content_isolation,
        elder_priority_routing,
        cultural_compliance_checks
    ) VALUES (
        p_balancer_name,
        p_balancer_type,
        routing_rules,
        p_cultural_routing_enabled,
        p_sacred_content_isolation,
        true,
        true
    ) RETURNING id INTO balancer_id;
    
    RETURN balancer_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'Connection pooling and load balancing setup completed' as status;