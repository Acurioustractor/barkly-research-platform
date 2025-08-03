-- =====================================================
-- TASK 16 - STEP 1: API and Integration Layer
-- GraphQL/REST API Foundation with Cultural Context and Rate Limiting
-- =====================================================

-- Create API configuration table
CREATE TABLE IF NOT EXISTS api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- API Information
    api_name TEXT NOT NULL UNIQUE,
    api_type TEXT NOT NULL
        CHECK (api_type IN ('graphql', 'rest', 'webhook', 'websocket', 'grpc')),
    api_version TEXT NOT NULL,
    
    -- API Configuration
    base_path TEXT NOT NULL,
    authentication_required BOOLEAN DEFAULT true,
    rate_limiting_enabled BOOLEAN DEFAULT true,
    
    -- Cultural Context
    supports_sacred_content BOOLEAN DEFAULT false,
    requires_elder_authorization BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    
    -- Security Settings
    cors_enabled BOOLEAN DEFAULT true,
    cors_origins TEXT[] DEFAULT '{}',
    ssl_required BOOLEAN DEFAULT true,
    api_key_required BOOLEAN DEFAULT false,
    
    -- Rate Limiting
    requests_per_minute INTEGER DEFAULT 100,
    requests_per_hour INTEGER DEFAULT 1000,
    requests_per_day INTEGER DEFAULT 10000,
    burst_limit INTEGER DEFAULT 20,
    
    -- API Status
    api_status TEXT DEFAULT 'active'
        CHECK (api_status IN ('active', 'deprecated', 'maintenance', 'disabled')),
    
    -- Documentation
    api_description TEXT,
    documentation_url TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API endpoints table
CREATE TABLE IF NOT EXISTS api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Endpoint Information
    api_config_id UUID NOT NULL REFERENCES api_configurations(id) ON DELETE CASCADE,
    endpoint_path TEXT NOT NULL,
    http_method TEXT NOT NULL
        CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
    
    -- Endpoint Configuration
    endpoint_name TEXT NOT NULL,
    endpoint_description TEXT,
    function_name TEXT, -- Database function to call
    
    -- Authentication & Authorization
    authentication_required BOOLEAN DEFAULT true,
    required_roles TEXT[] DEFAULT '{}',
    required_permissions TEXT[] DEFAULT '{}',
    
    -- Cultural Context
    accesses_sacred_content BOOLEAN DEFAULT false,
    requires_elder_permission BOOLEAN DEFAULT false,
    community_scoped BOOLEAN DEFAULT false,
    cultural_validation_required BOOLEAN DEFAULT false,
    
    -- Rate Limiting (endpoint-specific overrides)
    custom_rate_limit BOOLEAN DEFAULT false,
    requests_per_minute INTEGER,
    requests_per_hour INTEGER,
    
    -- Request/Response Configuration
    request_schema JSONB DEFAULT '{}',
    response_schema JSONB DEFAULT '{}',
    supports_pagination BOOLEAN DEFAULT false,
    max_page_size INTEGER DEFAULT 100,
    
    -- Caching
    cache_enabled BOOLEAN DEFAULT false,
    cache_ttl_seconds INTEGER DEFAULT 300,
    cache_key_pattern TEXT,
    
    -- Monitoring
    logging_enabled BOOLEAN DEFAULT true,
    metrics_enabled BOOLEAN DEFAULT true,
    
    -- Status
    endpoint_status TEXT DEFAULT 'active'
        CHECK (endpoint_status IN ('active', 'deprecated', 'maintenance', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(api_config_id, endpoint_path, http_method)
);

-- Create API rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rate Limit Context
    api_config_id UUID REFERENCES api_configurations(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
    
    -- Client Identification
    client_id TEXT,
    client_ip INET,
    user_id UUID,
    api_key_hash TEXT,
    
    -- Rate Limit Tracking
    time_window TIMESTAMPTZ NOT NULL,
    window_type TEXT NOT NULL
        CHECK (window_type IN ('minute', 'hour', 'day')),
    request_count INTEGER DEFAULT 0,
    
    -- Cultural Context
    sacred_content_requests INTEGER DEFAULT 0,
    elder_authorized_requests INTEGER DEFAULT 0,
    
    -- Rate Limit Status
    limit_exceeded BOOLEAN DEFAULT false,
    blocked_until TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(api_config_id, endpoint_id, client_id, client_ip, time_window, window_type)
);

-- Create API request log table
CREATE TABLE IF NOT EXISTS api_request_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Context
    api_config_id UUID REFERENCES api_configurations(id),
    endpoint_id UUID REFERENCES api_endpoints(id),
    
    -- Request Information
    request_id TEXT NOT NULL UNIQUE,
    request_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Client Information
    client_id TEXT,
    client_ip INET,
    user_id UUID,
    user_agent TEXT,
    
    -- Request Details
    http_method TEXT NOT NULL,
    endpoint_path TEXT NOT NULL,
    query_parameters JSONB DEFAULT '{}',
    request_headers JSONB DEFAULT '{}',
    request_body JSONB DEFAULT '{}',
    
    -- Response Details
    response_status INTEGER,
    response_headers JSONB DEFAULT '{}',
    response_body JSONB DEFAULT '{}',
    response_size_bytes INTEGER DEFAULT 0,
    
    -- Performance Metrics
    processing_time_ms DECIMAL(10,3) DEFAULT 0,
    database_time_ms DECIMAL(10,3) DEFAULT 0,
    
    -- Cultural Context
    accessed_sacred_content BOOLEAN DEFAULT false,
    elder_authorization_used BOOLEAN DEFAULT false,
    cultural_protocols_followed BOOLEAN DEFAULT false,
    community_id UUID,
    
    -- Error Information
    error_occurred BOOLEAN DEFAULT false,
    error_message TEXT,
    error_code TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook configuration table
CREATE TABLE IF NOT EXISTS webhook_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook Information
    webhook_name TEXT NOT NULL UNIQUE,
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT, -- For signature verification
    
    -- Trigger Configuration
    trigger_events TEXT[] NOT NULL DEFAULT '{}',
    trigger_conditions JSONB DEFAULT '{}',
    
    -- Cultural Context
    includes_sacred_content BOOLEAN DEFAULT false,
    requires_elder_approval BOOLEAN DEFAULT false,
    cultural_filtering_enabled BOOLEAN DEFAULT false,
    
    -- Delivery Configuration
    http_method TEXT DEFAULT 'POST'
        CHECK (http_method IN ('POST', 'PUT', 'PATCH')),
    content_type TEXT DEFAULT 'application/json',
    custom_headers JSONB DEFAULT '{}',
    
    -- Retry Configuration
    retry_enabled BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    exponential_backoff BOOLEAN DEFAULT true,
    
    -- Security
    ssl_verification BOOLEAN DEFAULT true,
    signature_verification BOOLEAN DEFAULT true,
    
    -- Status
    webhook_status TEXT DEFAULT 'active'
        CHECK (webhook_status IN ('active', 'paused', 'disabled', 'failed')),
    last_successful_delivery TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- API MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create API configuration
CREATE OR REPLACE FUNCTION create_api_configuration(
    p_api_name TEXT,
    p_api_type TEXT,
    p_api_version TEXT,
    p_base_path TEXT,
    p_supports_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    api_id UUID;
    cultural_level TEXT := 'standard';
    elder_auth_required BOOLEAN := false;
BEGIN
    -- Determine cultural settings
    IF p_supports_sacred_content THEN
        cultural_level := 'sacred';
        elder_auth_required := true;
    END IF;
    
    INSERT INTO api_configurations (
        api_name,
        api_type,
        api_version,
        base_path,
        supports_sacred_content,
        requires_elder_authorization,
        cultural_sensitivity_level,
        authentication_required,
        rate_limiting_enabled
    ) VALUES (
        p_api_name,
        p_api_type,
        p_api_version,
        p_base_path,
        p_supports_sacred_content,
        elder_auth_required,
        cultural_level,
        true,
        true
    ) RETURNING id INTO api_id;
    
    RETURN api_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create API endpoint
CREATE OR REPLACE FUNCTION create_api_endpoint(
    p_api_config_id UUID,
    p_endpoint_path TEXT,
    p_http_method TEXT,
    p_endpoint_name TEXT,
    p_function_name TEXT DEFAULT NULL,
    p_accesses_sacred_content BOOLEAN DEFAULT false,
    p_required_roles TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    endpoint_id UUID;
    api_config RECORD;
BEGIN
    -- Get API configuration
    SELECT * INTO api_config 
    FROM api_configurations 
    WHERE id = p_api_config_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'API configuration not found: %', p_api_config_id;
    END IF;
    
    INSERT INTO api_endpoints (
        api_config_id,
        endpoint_path,
        http_method,
        endpoint_name,
        function_name,
        accesses_sacred_content,
        requires_elder_permission,
        community_scoped,
        required_roles,
        authentication_required,
        logging_enabled,
        metrics_enabled
    ) VALUES (
        p_api_config_id,
        p_endpoint_path,
        p_http_method,
        p_endpoint_name,
        p_function_name,
        p_accesses_sacred_content,
        p_accesses_sacred_content AND api_config.supports_sacred_content,
        true, -- Community scoped by default
        p_required_roles,
        api_config.authentication_required,
        true,
        true
    ) RETURNING id INTO endpoint_id;
    
    RETURN endpoint_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_api_config_id UUID,
    p_endpoint_id UUID DEFAULT NULL,
    p_client_id TEXT DEFAULT NULL,
    p_client_ip INET DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    api_config RECORD;
    endpoint_config RECORD;
    current_minute TIMESTAMPTZ;
    current_hour TIMESTAMPTZ;
    current_day TIMESTAMPTZ;
    minute_count INTEGER := 0;
    hour_count INTEGER := 0;
    day_count INTEGER := 0;
    rate_limit_exceeded BOOLEAN := false;
BEGIN
    -- Get API configuration
    SELECT * INTO api_config 
    FROM api_configurations 
    WHERE id = p_api_config_id;
    
    IF NOT FOUND OR NOT api_config.rate_limiting_enabled THEN
        RETURN true; -- No rate limiting or API not found
    END IF;
    
    -- Get endpoint configuration if provided
    IF p_endpoint_id IS NOT NULL THEN
        SELECT * INTO endpoint_config 
        FROM api_endpoints 
        WHERE id = p_endpoint_id;
    END IF;
    
    -- Calculate time windows
    current_minute := date_trunc('minute', NOW());
    current_hour := date_trunc('hour', NOW());
    current_day := date_trunc('day', NOW());
    
    -- Check minute rate limit
    SELECT COALESCE(SUM(request_count), 0) INTO minute_count
    FROM api_rate_limits 
    WHERE api_config_id = p_api_config_id
    AND (p_endpoint_id IS NULL OR endpoint_id = p_endpoint_id)
    AND (p_client_id IS NULL OR client_id = p_client_id)
    AND (p_client_ip IS NULL OR client_ip = p_client_ip)
    AND time_window = current_minute
    AND window_type = 'minute';
    
    -- Use endpoint-specific limit if available, otherwise API limit
    IF endpoint_config.custom_rate_limit AND endpoint_config.requests_per_minute IS NOT NULL THEN
        IF minute_count >= endpoint_config.requests_per_minute THEN
            rate_limit_exceeded := true;
        END IF;
    ELSIF minute_count >= api_config.requests_per_minute THEN
        rate_limit_exceeded := true;
    END IF;
    
    -- Check hour rate limit if minute check passed
    IF NOT rate_limit_exceeded THEN
        SELECT COALESCE(SUM(request_count), 0) INTO hour_count
        FROM api_rate_limits 
        WHERE api_config_id = p_api_config_id
        AND (p_endpoint_id IS NULL OR endpoint_id = p_endpoint_id)
        AND (p_client_id IS NULL OR client_id = p_client_id)
        AND (p_client_ip IS NULL OR client_ip = p_client_ip)
        AND time_window = current_hour
        AND window_type = 'hour';
        
        IF endpoint_config.custom_rate_limit AND endpoint_config.requests_per_hour IS NOT NULL THEN
            IF hour_count >= endpoint_config.requests_per_hour THEN
                rate_limit_exceeded := true;
            END IF;
        ELSIF hour_count >= api_config.requests_per_hour THEN
            rate_limit_exceeded := true;
        END IF;
    END IF;
    
    -- Check day rate limit if hour check passed
    IF NOT rate_limit_exceeded THEN
        SELECT COALESCE(SUM(request_count), 0) INTO day_count
        FROM api_rate_limits 
        WHERE api_config_id = p_api_config_id
        AND (p_endpoint_id IS NULL OR endpoint_id = p_endpoint_id)
        AND (p_client_id IS NULL OR client_id = p_client_id)
        AND (p_client_ip IS NULL OR client_ip = p_client_ip)
        AND time_window = current_day
        AND window_type = 'day';
        
        IF day_count >= api_config.requests_per_day THEN
            rate_limit_exceeded := true;
        END IF;
    END IF;
    
    RETURN NOT rate_limit_exceeded;
END;
$$ LANGUAGE plpgsql;

-- Function to record API request
CREATE OR REPLACE FUNCTION record_api_request(
    p_request_id TEXT,
    p_api_config_id UUID,
    p_endpoint_id UUID DEFAULT NULL,
    p_client_id TEXT DEFAULT NULL,
    p_client_ip INET DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_http_method TEXT DEFAULT 'GET',
    p_endpoint_path TEXT DEFAULT '/',
    p_response_status INTEGER DEFAULT 200,
    p_processing_time_ms DECIMAL(10,3) DEFAULT 0,
    p_accessed_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_minute TIMESTAMPTZ;
    current_hour TIMESTAMPTZ;
    current_day TIMESTAMPTZ;
BEGIN
    -- Record the API request
    INSERT INTO api_request_log (
        request_id,
        api_config_id,
        endpoint_id,
        client_id,
        client_ip,
        user_id,
        http_method,
        endpoint_path,
        response_status,
        processing_time_ms,
        accessed_sacred_content,
        elder_authorization_used,
        cultural_protocols_followed
    ) VALUES (
        p_request_id,
        p_api_config_id,
        p_endpoint_id,
        p_client_id,
        p_client_ip,
        p_user_id,
        p_http_method,
        p_endpoint_path,
        p_response_status,
        p_processing_time_ms,
        p_accessed_sacred_content,
        p_accessed_sacred_content, -- Assume elder auth used for sacred content
        p_accessed_sacred_content  -- Assume cultural protocols followed
    ) RETURNING id INTO log_id;
    
    -- Update rate limiting counters
    current_minute := date_trunc('minute', NOW());
    current_hour := date_trunc('hour', NOW());
    current_day := date_trunc('day', NOW());
    
    -- Update minute counter
    INSERT INTO api_rate_limits (
        api_config_id, endpoint_id, client_id, client_ip, 
        time_window, window_type, request_count,
        sacred_content_requests, elder_authorized_requests
    ) VALUES (
        p_api_config_id, p_endpoint_id, p_client_id, p_client_ip,
        current_minute, 'minute', 1,
        CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END
    )
    ON CONFLICT (api_config_id, endpoint_id, client_id, client_ip, time_window, window_type)
    DO UPDATE SET 
        request_count = api_rate_limits.request_count + 1,
        sacred_content_requests = api_rate_limits.sacred_content_requests + 
            CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        elder_authorized_requests = api_rate_limits.elder_authorized_requests + 
            CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    -- Update hour counter
    INSERT INTO api_rate_limits (
        api_config_id, endpoint_id, client_id, client_ip, 
        time_window, window_type, request_count,
        sacred_content_requests, elder_authorized_requests
    ) VALUES (
        p_api_config_id, p_endpoint_id, p_client_id, p_client_ip,
        current_hour, 'hour', 1,
        CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END
    )
    ON CONFLICT (api_config_id, endpoint_id, client_id, client_ip, time_window, window_type)
    DO UPDATE SET 
        request_count = api_rate_limits.request_count + 1,
        sacred_content_requests = api_rate_limits.sacred_content_requests + 
            CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        elder_authorized_requests = api_rate_limits.elder_authorized_requests + 
            CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    -- Update day counter
    INSERT INTO api_rate_limits (
        api_config_id, endpoint_id, client_id, client_ip, 
        time_window, window_type, request_count,
        sacred_content_requests, elder_authorized_requests
    ) VALUES (
        p_api_config_id, p_endpoint_id, p_client_id, p_client_ip,
        current_day, 'day', 1,
        CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END
    )
    ON CONFLICT (api_config_id, endpoint_id, client_id, client_ip, time_window, window_type)
    DO UPDATE SET 
        request_count = api_rate_limits.request_count + 1,
        sacred_content_requests = api_rate_limits.sacred_content_requests + 
            CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        elder_authorized_requests = api_rate_limits.elder_authorized_requests + 
            CASE WHEN p_accessed_sacred_content THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create webhook configuration
CREATE OR REPLACE FUNCTION create_webhook_configuration(
    p_webhook_name TEXT,
    p_webhook_url TEXT,
    p_trigger_events TEXT[],
    p_includes_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    webhook_id UUID;
BEGIN
    INSERT INTO webhook_configurations (
        webhook_name,
        webhook_url,
        trigger_events,
        includes_sacred_content,
        requires_elder_approval,
        cultural_filtering_enabled,
        retry_enabled,
        ssl_verification,
        signature_verification
    ) VALUES (
        p_webhook_name,
        p_webhook_url,
        p_trigger_events,
        p_includes_sacred_content,
        p_includes_sacred_content, -- Require elder approval for sacred content
        p_includes_sacred_content, -- Enable cultural filtering for sacred content
        true,
        true,
        true
    ) RETURNING id INTO webhook_id;
    
    RETURN webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get API usage statistics
CREATE OR REPLACE FUNCTION get_api_usage_statistics(
    p_api_config_id UUID,
    p_time_period TEXT DEFAULT 'day'
)
RETURNS TABLE(
    time_period TIMESTAMPTZ,
    total_requests BIGINT,
    successful_requests BIGINT,
    error_requests BIGINT,
    avg_response_time_ms DECIMAL(10,3),
    sacred_content_requests BIGINT,
    unique_clients BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH time_series AS (
        SELECT 
            CASE p_time_period
                WHEN 'hour' THEN date_trunc('hour', request_timestamp)
                WHEN 'day' THEN date_trunc('day', request_timestamp)
                WHEN 'week' THEN date_trunc('week', request_timestamp)
                ELSE date_trunc('day', request_timestamp)
            END as period,
            COUNT(*) as total_reqs,
            COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 400) as success_reqs,
            COUNT(*) FILTER (WHERE response_status >= 400) as error_reqs,
            AVG(processing_time_ms) as avg_time,
            COUNT(*) FILTER (WHERE accessed_sacred_content = true) as sacred_reqs,
            COUNT(DISTINCT client_id) as unique_clients
        FROM api_request_log
        WHERE api_config_id = p_api_config_id
        AND request_timestamp >= NOW() - CASE p_time_period
            WHEN 'hour' THEN INTERVAL '24 hours'
            WHEN 'day' THEN INTERVAL '30 days'
            WHEN 'week' THEN INTERVAL '12 weeks'
            ELSE INTERVAL '30 days'
        END
        GROUP BY period
    )
    SELECT 
        ts.period,
        ts.total_reqs,
        ts.success_reqs,
        ts.error_reqs,
        ts.avg_time,
        ts.sacred_reqs,
        ts.unique_clients
    FROM time_series ts
    ORDER BY ts.period DESC;
END;
$$ LANGUAGE plpgsql;

SELECT 'API and integration layer foundation created successfully' as status;