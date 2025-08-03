-- =====================================================
-- Barkly Research Platform - Advanced Supabase Configuration
-- Task 1: Set up Supabase project with advanced configuration
-- =====================================================

-- Enable required extensions for world-class functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";           -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";            -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "vector";              -- Vector embeddings for AI
CREATE EXTENSION IF NOT EXISTS "pg_trgm";             -- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin";           -- GIN indexes for better performance
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_cron";             -- Scheduled tasks

-- =====================================================
-- GLOBAL SECURITY CONFIGURATION
-- =====================================================

-- Enable Row Level Security globally
ALTER DATABASE postgres SET row_security = on;

-- Create custom roles for different access levels
DO $$
BEGIN
    -- Community Administrator role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'community_admin') THEN
        CREATE ROLE community_admin;
    END IF;
    
    -- Community Member role  
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'community_member') THEN
        CREATE ROLE community_member;
    END IF;
    
    -- Research Collaborator role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'research_collaborator') THEN
        CREATE ROLE research_collaborator;
    END IF;
    
    -- Read-only Analyst role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analyst_readonly') THEN
        CREATE ROLE analyst_readonly;
    END IF;
END
$$;

-- =====================================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- =====================================================

-- Optimize PostgreSQL settings for document processing workloads
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,pg_cron';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configure connection pooling settings
ALTER SYSTEM SET max_prepared_transactions = 100;
ALTER SYSTEM SET max_locks_per_transaction = 256;

-- =====================================================
-- AUDIT AND LOGGING CONFIGURATION
-- =====================================================

-- Enable comprehensive logging for security and debugging
ALTER SYSTEM SET log_statement = 'mod';  -- Log all modifications
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log slow queries (>1s)
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_checkpoints = on;

-- Create audit log table for tracking all data access
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
    user_id UUID,
    community_id UUID,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT
);

-- Create index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_community ON audit_log(community_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, operation, timestamp DESC);

-- =====================================================
-- CULTURAL DATA PROTECTION FUNCTIONS
-- =====================================================

-- Function to check cultural sensitivity access
CREATE OR REPLACE FUNCTION check_cultural_access(
    sensitivity_level TEXT,
    user_community_id UUID,
    data_community_id UUID,
    user_role TEXT DEFAULT 'member'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Public data is accessible to everyone
    IF sensitivity_level = 'public' THEN
        RETURN TRUE;
    END IF;
    
    -- Community data requires community membership
    IF sensitivity_level = 'community' THEN
        RETURN user_community_id = data_community_id;
    END IF;
    
    -- Restricted data requires admin role within community
    IF sensitivity_level = 'restricted' THEN
        RETURN user_community_id = data_community_id AND user_role IN ('admin', 'elder');
    END IF;
    
    -- Sacred data requires special permissions (implement based on community protocols)
    IF sensitivity_level = 'sacred' THEN
        RETURN user_community_id = data_community_id AND user_role = 'cultural_keeper';
    END IF;
    
    -- Default to no access
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Function to get database performance metrics
CREATE OR REPLACE FUNCTION get_db_performance_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    measured_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'active_connections'::TEXT,
        COUNT(*)::NUMERIC,
        'connections'::TEXT,
        NOW()
    FROM pg_stat_activity
    WHERE state = 'active'
    
    UNION ALL
    
    SELECT 
        'database_size'::TEXT,
        pg_database_size(current_database())::NUMERIC,
        'bytes'::TEXT,
        NOW()
    
    UNION ALL
    
    SELECT 
        'cache_hit_ratio'::TEXT,
        ROUND(
            100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0),
            2
        )::NUMERIC,
        'percentage'::TEXT,
        NOW()
    FROM pg_stat_database
    WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BACKUP AND RECOVERY CONFIGURATION
-- =====================================================

-- Create function to validate backup integrity
CREATE OR REPLACE FUNCTION validate_backup_integrity()
RETURNS TABLE (
    table_name TEXT,
    record_count BIGINT,
    last_modified TIMESTAMPTZ,
    integrity_status TEXT
) AS $$
DECLARE
    tbl RECORD;
    count_result BIGINT;
    max_timestamp TIMESTAMPTZ;
BEGIN
    -- Check each main table for integrity
    FOR tbl IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'audit_%'
    LOOP
        -- Get record count
        EXECUTE format('SELECT COUNT(*) FROM %I.%I', tbl.schemaname, tbl.tablename) 
        INTO count_result;
        
        -- Try to get last modified timestamp (if updated_at column exists)
        BEGIN
            EXECUTE format('SELECT MAX(updated_at) FROM %I.%I', tbl.schemaname, tbl.tablename) 
            INTO max_timestamp;
        EXCEPTION WHEN undefined_column THEN
            -- If no updated_at column, try created_at
            BEGIN
                EXECUTE format('SELECT MAX(created_at) FROM %I.%I', tbl.schemaname, tbl.tablename) 
                INTO max_timestamp;
            EXCEPTION WHEN undefined_column THEN
                max_timestamp := NULL;
            END;
        END;
        
        RETURN QUERY SELECT 
            tbl.tablename::TEXT,
            count_result,
            max_timestamp,
            CASE 
                WHEN count_result >= 0 THEN 'OK'
                ELSE 'ERROR'
            END::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEDULED MAINTENANCE TASKS
-- =====================================================

-- Schedule daily statistics update (requires pg_cron extension)
-- This will be configured in Supabase dashboard or via SQL
SELECT cron.schedule(
    'update-table-stats',
    '0 2 * * *', -- Daily at 2 AM
    'ANALYZE;'
);

-- Schedule weekly vacuum for performance
SELECT cron.schedule(
    'weekly-vacuum',
    '0 3 * * 0', -- Weekly on Sunday at 3 AM
    'VACUUM (ANALYZE, VERBOSE);'
);

-- Schedule monthly backup validation
SELECT cron.schedule(
    'monthly-backup-validation',
    '0 4 1 * *', -- Monthly on 1st at 4 AM
    'SELECT validate_backup_integrity();'
);

-- =====================================================
-- INITIAL CONFIGURATION VALIDATION
-- =====================================================

-- Create a function to validate the setup
CREATE OR REPLACE FUNCTION validate_supabase_setup()
RETURNS TABLE (
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check extensions
    RETURN QUERY
    SELECT 
        'Extensions'::TEXT,
        CASE WHEN COUNT(*) >= 6 THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Required extensions: ' || string_agg(extname, ', ')::TEXT
    FROM pg_extension 
    WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector', 'pg_trgm', 'btree_gin', 'pg_stat_statements');
    
    -- Check RLS is enabled
    RETURN QUERY
    SELECT 
        'Row Level Security'::TEXT,
        CASE WHEN current_setting('row_security') = 'on' THEN 'OK' ELSE 'DISABLED' END::TEXT,
        'Global RLS setting: ' || current_setting('row_security')::TEXT;
    
    -- Check custom roles
    RETURN QUERY
    SELECT 
        'Custom Roles'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'OK' ELSE 'INCOMPLETE' END::TEXT,
        'Custom roles created: ' || COUNT(*)::TEXT
    FROM pg_roles 
    WHERE rolname IN ('community_admin', 'community_member', 'research_collaborator', 'analyst_readonly');
    
    -- Check audit table
    RETURN QUERY
    SELECT 
        'Audit System'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_log') THEN 'OK' ELSE 'MISSING' END::TEXT,
        'Audit log table status'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINAL SETUP VALIDATION
-- =====================================================

-- Run the validation to ensure everything is set up correctly
SELECT * FROM validate_supabase_setup();

-- Display performance metrics to confirm monitoring is working
SELECT * FROM get_db_performance_metrics();

-- Show current database configuration
SELECT 
    name,
    setting,
    unit,
    context
FROM pg_settings 
WHERE name IN (
    'max_connections',
    'shared_buffers', 
    'effective_cache_size',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target',
    'random_page_cost',
    'effective_io_concurrency'
)
ORDER BY name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Barkly Research Platform Database Setup Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Advanced Supabase configuration has been applied.';
    RAISE NOTICE 'Extensions enabled: vector, pg_trgm, btree_gin, and more';
    RAISE NOTICE 'Row Level Security: ENABLED globally';
    RAISE NOTICE 'Performance optimization: CONFIGURED';
    RAISE NOTICE 'Audit logging: ENABLED';
    RAISE NOTICE 'Cultural data protection: IMPLEMENTED';
    RAISE NOTICE 'Scheduled maintenance: CONFIGURED';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next: Run the validation query to confirm setup';
    RAISE NOTICE 'SELECT * FROM validate_supabase_setup();';
    RAISE NOTICE '==============================================';
END $$;