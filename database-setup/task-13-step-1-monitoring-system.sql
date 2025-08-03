-- =====================================================
-- TASK 13 - STEP 1: Comprehensive Database Monitoring System
-- Performance Monitoring, Alerting, and Health Checks
-- =====================================================

-- Create database monitoring configuration table
CREATE TABLE IF NOT EXISTS monitoring_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Monitor Information
    monitor_name TEXT NOT NULL UNIQUE,
    monitor_type TEXT NOT NULL
        CHECK (monitor_type IN ('performance', 'security', 'cultural', 'capacity', 'health', 'custom')),
    
    -- Monitor Configuration
    target_table TEXT,
    target_function TEXT,
    metric_query TEXT NOT NULL,
    
    -- Thresholds and Alerting
    warning_threshold DECIMAL(12,4),
    critical_threshold DECIMAL(12,4),
    threshold_comparison TEXT DEFAULT 'greater_than'
        CHECK (threshold_comparison IN ('greater_than', 'less_than', 'equals', 'not_equals', 'between')),
    
    -- Monitoring Schedule
    check_interval_seconds INTEGER DEFAULT 300, -- 5 minutes
    enabled BOOLEAN DEFAULT true,
    
    -- Cultural Context
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_elder_notification BOOLEAN DEFAULT false,
    
    -- Alert Configuration
    alert_enabled BOOLEAN DEFAULT true,
    alert_channels TEXT[] DEFAULT ARRAY['email', 'database'],
    alert_recipients TEXT[] DEFAULT '{}',
    
    -- Status
    last_check TIMESTAMPTZ,
    last_alert TIMESTAMPTZ,
    current_status TEXT DEFAULT 'unknown'
        CHECK (current_status IN ('healthy', 'warning', 'critical', 'unknown', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring metrics table for historical data
CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Context
    monitor_id UUID NOT NULL REFERENCES monitoring_config(id) ON DELETE CASCADE,
    metric_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metric Values
    metric_value DECIMAL(12,4) NOT NULL,
    metric_unit TEXT DEFAULT 'count',
    
    -- Status Information
    status TEXT NOT NULL
        CHECK (status IN ('healthy', 'warning', 'critical')),
    threshold_breached BOOLEAN DEFAULT false,
    
    -- Additional Context
    additional_data JSONB DEFAULT '{}',
    
    -- Cultural Context
    cultural_impact_detected BOOLEAN DEFAULT false,
    sacred_content_affected BOOLEAN DEFAULT false,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Alert Context
    monitor_id UUID NOT NULL REFERENCES monitoring_config(id) ON DELETE CASCADE,
    metric_id UUID REFERENCES monitoring_metrics(id),
    
    -- Alert Information
    alert_level TEXT NOT NULL
        CHECK (alert_level IN ('warning', 'critical', 'resolved')),
    alert_title TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    
    -- Alert Details
    metric_value DECIMAL(12,4),
    threshold_value DECIMAL(12,4),
    
    -- Cultural Context
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    elder_notification_sent BOOLEAN DEFAULT false,
    
    -- Alert Status
    alert_status TEXT DEFAULT 'active'
        CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system health dashboard table
CREATE TABLE IF NOT EXISTS system_health_dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dashboard Information
    dashboard_name TEXT NOT NULL UNIQUE,
    dashboard_type TEXT NOT NULL
        CHECK (dashboard_type IN ('overview', 'performance', 'security', 'cultural', 'capacity')),
    
    -- Dashboard Configuration
    widget_config JSONB DEFAULT '{}',
    refresh_interval_seconds INTEGER DEFAULT 60,
    
    -- Access Control
    public_access BOOLEAN DEFAULT false,
    allowed_roles TEXT[] DEFAULT ARRAY['admin', 'monitor'],
    
    -- Cultural Context
    includes_sacred_metrics BOOLEAN DEFAULT false,
    elder_access_required BOOLEAN DEFAULT false,
    
    -- Status
    dashboard_status TEXT DEFAULT 'active'
        CHECK (dashboard_status IN ('active', 'maintenance', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MONITORING FUNCTIONS
-- =====================================================

-- Function to create a performance monitor
CREATE OR REPLACE FUNCTION create_performance_monitor(
    p_monitor_name TEXT,
    p_target_table TEXT,
    p_metric_query TEXT,
    p_warning_threshold DECIMAL(12,4),
    p_critical_threshold DECIMAL(12,4),
    p_check_interval_seconds INTEGER DEFAULT 300
)
RETURNS UUID AS $$
DECLARE
    monitor_id UUID;
BEGIN
    INSERT INTO monitoring_config (
        monitor_name,
        monitor_type,
        target_table,
        metric_query,
        warning_threshold,
        critical_threshold,
        check_interval_seconds,
        alert_enabled
    ) VALUES (
        p_monitor_name,
        'performance',
        p_target_table,
        p_metric_query,
        p_warning_threshold,
        p_critical_threshold,
        p_check_interval_seconds,
        true
    ) RETURNING id INTO monitor_id;
    
    RETURN monitor_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute monitoring checks
CREATE OR REPLACE FUNCTION execute_monitoring_check(p_monitor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    monitor_record RECORD;
    metric_value DECIMAL(12,4);
    current_status TEXT := 'healthy';
    threshold_breached BOOLEAN := false;
    alert_needed BOOLEAN := false;
    metric_id UUID;
BEGIN
    -- Get monitor configuration
    SELECT * INTO monitor_record 
    FROM monitoring_config 
    WHERE id = p_monitor_id AND enabled = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Execute the metric query
    BEGIN
        EXECUTE monitor_record.metric_query INTO metric_value;
    EXCEPTION WHEN OTHERS THEN
        -- Log error and return false
        INSERT INTO monitoring_metrics (
            monitor_id,
            metric_value,
            status,
            additional_data
        ) VALUES (
            p_monitor_id,
            -1,
            'critical',
            jsonb_build_object('error', SQLERRM)
        );
        RETURN false;
    END;
    
    -- Determine status based on thresholds
    IF monitor_record.critical_threshold IS NOT NULL THEN
        CASE monitor_record.threshold_comparison
            WHEN 'greater_than' THEN
                IF metric_value >= monitor_record.critical_threshold THEN
                    current_status := 'critical';
                    threshold_breached := true;
                    alert_needed := true;
                ELSIF metric_value >= monitor_record.warning_threshold THEN
                    current_status := 'warning';
                    threshold_breached := true;
                    alert_needed := true;
                END IF;
            WHEN 'less_than' THEN
                IF metric_value <= monitor_record.critical_threshold THEN
                    current_status := 'critical';
                    threshold_breached := true;
                    alert_needed := true;
                ELSIF metric_value <= monitor_record.warning_threshold THEN
                    current_status := 'warning';
                    threshold_breached := true;
                    alert_needed := true;
                END IF;
        END CASE;
    END IF;
    
    -- Record metric
    INSERT INTO monitoring_metrics (
        monitor_id,
        metric_value,
        status,
        threshold_breached,
        cultural_impact_detected,
        sacred_content_affected
    ) VALUES (
        p_monitor_id,
        metric_value,
        current_status,
        threshold_breached,
        monitor_record.cultural_sensitivity_level IN ('sacred', 'ceremonial'),
        monitor_record.cultural_sensitivity_level = 'sacred'
    ) RETURNING id INTO metric_id;
    
    -- Create alert if needed
    IF alert_needed AND monitor_record.alert_enabled THEN
        PERFORM create_monitoring_alert(
            p_monitor_id,
            metric_id,
            current_status,
            format('%s threshold breached', monitor_record.monitor_name),
            format('Monitor %s reported %s value: %s (threshold: %s)',
                   monitor_record.monitor_name,
                   current_status,
                   metric_value,
                   CASE WHEN current_status = 'critical' 
                        THEN monitor_record.critical_threshold 
                        ELSE monitor_record.warning_threshold END),
            metric_value,
            CASE WHEN current_status = 'critical' 
                 THEN monitor_record.critical_threshold 
                 ELSE monitor_record.warning_threshold END
        );
    END IF;
    
    -- Update monitor status
    UPDATE monitoring_config 
    SET current_status = current_status,
        last_check = NOW(),
        updated_at = NOW()
    WHERE id = p_monitor_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create monitoring alerts
CREATE OR REPLACE FUNCTION create_monitoring_alert(
    p_monitor_id UUID,
    p_metric_id UUID,
    p_alert_level TEXT,
    p_alert_title TEXT,
    p_alert_message TEXT,
    p_metric_value DECIMAL(12,4),
    p_threshold_value DECIMAL(12,4)
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
    monitor_record RECORD;
BEGIN
    -- Get monitor configuration for cultural context
    SELECT * INTO monitor_record 
    FROM monitoring_config 
    WHERE id = p_monitor_id;
    
    INSERT INTO monitoring_alerts (
        monitor_id,
        metric_id,
        alert_level,
        alert_title,
        alert_message,
        metric_value,
        threshold_value,
        cultural_sensitivity_level,
        elder_notification_sent
    ) VALUES (
        p_monitor_id,
        p_metric_id,
        p_alert_level,
        p_alert_title,
        p_alert_message,
        p_metric_value,
        p_threshold_value,
        monitor_record.cultural_sensitivity_level,
        false  -- Will be updated by notification system
    ) RETURNING id INTO alert_id;
    
    -- Update last alert time
    UPDATE monitoring_config 
    SET last_alert = NOW(),
        updated_at = NOW()
    WHERE id = p_monitor_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to run all enabled monitors
CREATE OR REPLACE FUNCTION run_all_monitors()
RETURNS TABLE(
    monitor_name TEXT,
    status TEXT,
    metric_value DECIMAL(12,4),
    execution_time_ms INTEGER
) AS $$
DECLARE
    monitor_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_ms INTEGER;
    success BOOLEAN;
BEGIN
    FOR monitor_record IN 
        SELECT id, monitor_name, current_status 
        FROM monitoring_config 
        WHERE enabled = true 
        AND (last_check IS NULL OR last_check < NOW() - (check_interval_seconds || ' seconds')::INTERVAL)
    LOOP
        start_time := clock_timestamp();
        
        SELECT execute_monitoring_check(monitor_record.id) INTO success;
        
        end_time := clock_timestamp();
        execution_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        -- Get latest metric value
        DECLARE
            latest_metric DECIMAL(12,4);
        BEGIN
            SELECT mm.metric_value INTO latest_metric
            FROM monitoring_metrics mm
            WHERE mm.monitor_id = monitor_record.id
            ORDER BY mm.metric_timestamp DESC
            LIMIT 1;
            
            RETURN QUERY SELECT 
                monitor_record.monitor_name,
                CASE WHEN success THEN 'executed' ELSE 'failed' END,
                COALESCE(latest_metric, -1),
                execution_ms;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get system health overview
CREATE OR REPLACE FUNCTION get_system_health_overview()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    healthy_count INTEGER,
    warning_count INTEGER,
    critical_count INTEGER,
    last_check TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH monitor_status AS (
        SELECT 
            monitor_type as component,
            current_status as status,
            last_check,
            COUNT(*) as count
        FROM monitoring_config
        WHERE enabled = true
        GROUP BY monitor_type, current_status, last_check
    ),
    aggregated_status AS (
        SELECT 
            component,
            MAX(last_check) as last_check,
            COUNT(*) FILTER (WHERE status = 'healthy') as healthy_count,
            COUNT(*) FILTER (WHERE status = 'warning') as warning_count,
            COUNT(*) FILTER (WHERE status = 'critical') as critical_count,
            CASE 
                WHEN COUNT(*) FILTER (WHERE status = 'critical') > 0 THEN 'critical'
                WHEN COUNT(*) FILTER (WHERE status = 'warning') > 0 THEN 'warning'
                ELSE 'healthy'
            END as overall_status
        FROM monitor_status
        GROUP BY component
    )
    SELECT 
        as1.component,
        as1.overall_status,
        as1.healthy_count,
        as1.warning_count,
        as1.critical_count,
        as1.last_check
    FROM aggregated_status as1
    ORDER BY 
        CASE as1.overall_status 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            ELSE 3 
        END,
        as1.component;
END;
$$ LANGUAGE plpgsql;

SELECT 'Database monitoring system foundation created successfully' as status;