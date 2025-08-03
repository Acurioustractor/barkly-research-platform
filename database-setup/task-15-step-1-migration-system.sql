-- =====================================================
-- TASK 15 - STEP 1: Database Migration System
-- Schema Versioning, Migration Management, and Cultural Data Protection
-- =====================================================

-- Create schema migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Migration Information
    migration_name TEXT NOT NULL UNIQUE,
    migration_version TEXT NOT NULL UNIQUE,
    migration_type TEXT NOT NULL
        CHECK (migration_type IN ('schema', 'data', 'cultural', 'security', 'performance', 'rollback')),
    
    -- Migration Content
    migration_sql TEXT NOT NULL,
    rollback_sql TEXT,
    migration_description TEXT,
    
    -- Cultural Context
    affects_sacred_content BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_elder_approval BOOLEAN DEFAULT false,
    elder_approved_by UUID,
    elder_approved_at TIMESTAMPTZ,
    
    -- Dependencies
    depends_on_migrations TEXT[] DEFAULT '{}',
    blocks_migrations TEXT[] DEFAULT '{}',
    
    -- Execution Information
    execution_status TEXT DEFAULT 'pending'
        CHECK (execution_status IN ('pending', 'approved', 'running', 'completed', 'failed', 'rolled_back')),
    execution_start TIMESTAMPTZ,
    execution_end TIMESTAMPTZ,
    execution_duration_seconds INTEGER,
    
    -- Validation
    pre_migration_checksum TEXT,
    post_migration_checksum TEXT,
    validation_passed BOOLEAN,
    validation_notes TEXT,
    
    -- Error Handling
    error_message TEXT,
    rollback_reason TEXT,
    rollback_executed_at TIMESTAMPTZ,
    
    -- System Fields
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create migration execution log table
CREATE TABLE IF NOT EXISTS migration_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Execution Context
    migration_id UUID NOT NULL REFERENCES schema_migrations(id) ON DELETE CASCADE,
    execution_attempt INTEGER DEFAULT 1,
    
    -- Execution Details
    execution_start TIMESTAMPTZ DEFAULT NOW(),
    execution_end TIMESTAMPTZ,
    execution_duration_seconds INTEGER,
    
    -- Execution Environment
    database_version TEXT,
    application_version TEXT,
    executed_by UUID,
    execution_environment TEXT DEFAULT 'production'
        CHECK (execution_environment IN ('development', 'staging', 'production', 'testing')),
    
    -- Cultural Context
    cultural_validation_performed BOOLEAN DEFAULT false,
    elder_supervision_present BOOLEAN DEFAULT false,
    cultural_protocols_followed BOOLEAN DEFAULT false,
    
    -- Execution Results
    execution_status TEXT DEFAULT 'running'
        CHECK (execution_status IN ('running', 'completed', 'failed', 'cancelled')),
    rows_affected BIGINT DEFAULT 0,
    tables_modified TEXT[] DEFAULT '{}',
    
    -- Performance Metrics
    cpu_time_ms DECIMAL(10,3) DEFAULT 0,
    memory_usage_mb DECIMAL(10,2) DEFAULT 0,
    io_operations BIGINT DEFAULT 0,
    
    -- Validation Results
    pre_execution_validation JSONB DEFAULT '{}',
    post_execution_validation JSONB DEFAULT '{}',
    data_integrity_verified BOOLEAN DEFAULT false,
    
    -- Error Information
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create migration rollback tracking table
CREATE TABLE IF NOT EXISTS migration_rollbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rollback Context
    migration_id UUID NOT NULL REFERENCES schema_migrations(id) ON DELETE CASCADE,
    rollback_reason TEXT NOT NULL,
    rollback_type TEXT NOT NULL
        CHECK (rollback_type IN ('automatic', 'manual', 'emergency', 'cultural_violation')),
    
    -- Rollback Execution
    rollback_start TIMESTAMPTZ DEFAULT NOW(),
    rollback_end TIMESTAMPTZ,
    rollback_duration_seconds INTEGER,
    
    -- Cultural Context
    involves_sacred_content BOOLEAN DEFAULT false,
    elder_authorization_required BOOLEAN DEFAULT false,
    elder_authorized_by UUID,
    elder_authorized_at TIMESTAMPTZ,
    
    -- Rollback Status
    rollback_status TEXT DEFAULT 'pending'
        CHECK (rollback_status IN ('pending', 'approved', 'running', 'completed', 'failed')),
    rollback_success BOOLEAN DEFAULT false,
    
    -- Data Recovery
    data_recovery_required BOOLEAN DEFAULT false,
    data_recovery_completed BOOLEAN DEFAULT false,
    backup_restored_from TEXT,
    
    -- Validation
    rollback_validation JSONB DEFAULT '{}',
    system_integrity_verified BOOLEAN DEFAULT false,
    cultural_integrity_maintained BOOLEAN DEFAULT false,
    
    -- Error Handling
    rollback_error_message TEXT,
    
    -- System Fields
    initiated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create migration environment configuration table
CREATE TABLE IF NOT EXISTS migration_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Environment Information
    environment_name TEXT NOT NULL UNIQUE,
    environment_type TEXT NOT NULL
        CHECK (environment_type IN ('development', 'staging', 'production', 'testing', 'cultural_review')),
    
    -- Database Configuration
    database_host TEXT NOT NULL,
    database_port INTEGER DEFAULT 5432,
    database_name TEXT NOT NULL,
    database_user TEXT NOT NULL,
    
    -- Migration Settings
    auto_migration_enabled BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT true,
    cultural_review_required BOOLEAN DEFAULT false,
    elder_approval_required BOOLEAN DEFAULT false,
    
    -- Safety Settings
    backup_before_migration BOOLEAN DEFAULT true,
    validation_required BOOLEAN DEFAULT true,
    rollback_enabled BOOLEAN DEFAULT true,
    max_execution_time_minutes INTEGER DEFAULT 60,
    
    -- Cultural Context
    handles_sacred_content BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    
    -- Status
    environment_status TEXT DEFAULT 'active'
        CHECK (environment_status IN ('active', 'maintenance', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MIGRATION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create a new migration
CREATE OR REPLACE FUNCTION create_migration(
    p_migration_name TEXT,
    p_migration_version TEXT,
    p_migration_type TEXT,
    p_migration_sql TEXT,
    p_rollback_sql TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_affects_sacred_content BOOLEAN DEFAULT false,
    p_depends_on TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    migration_id UUID;
    cultural_level TEXT := 'standard';
    requires_elder BOOLEAN := false;
BEGIN
    -- Determine cultural sensitivity and elder approval requirements
    IF p_affects_sacred_content THEN
        cultural_level := 'sacred';
        requires_elder := true;
    ELSIF p_migration_sql ILIKE '%sacred%' OR p_migration_sql ILIKE '%ceremonial%' THEN
        cultural_level := 'sensitive';
        requires_elder := false;
    END IF;
    
    -- Create migration record
    INSERT INTO schema_migrations (
        migration_name,
        migration_version,
        migration_type,
        migration_sql,
        rollback_sql,
        migration_description,
        affects_sacred_content,
        cultural_sensitivity_level,
        requires_elder_approval,
        depends_on_migrations,
        execution_status
    ) VALUES (
        p_migration_name,
        p_migration_version,
        p_migration_type,
        p_migration_sql,
        p_rollback_sql,
        p_description,
        p_affects_sacred_content,
        cultural_level,
        requires_elder,
        p_depends_on,
        CASE WHEN requires_elder THEN 'pending' ELSE 'approved' END
    ) RETURNING id INTO migration_id;
    
    RETURN migration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute a migration
CREATE OR REPLACE FUNCTION execute_migration(
    p_migration_id UUID,
    p_environment TEXT DEFAULT 'production',
    p_executed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    migration_record RECORD;
    execution_log_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_seconds INTEGER;
    execution_success BOOLEAN := true;
    rows_affected BIGINT := 0;
    error_msg TEXT;
BEGIN
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = p_migration_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration not found: %', p_migration_id;
    END IF;
    
    -- Check if migration is approved for execution
    IF migration_record.execution_status NOT IN ('approved', 'failed') THEN
        RAISE EXCEPTION 'Migration % is not approved for execution (status: %)', 
            migration_record.migration_name, migration_record.execution_status;
    END IF;
    
    -- Check elder approval if required
    IF migration_record.requires_elder_approval AND migration_record.elder_approved_by IS NULL THEN
        RAISE EXCEPTION 'Migration % requires elder approval but none provided', migration_record.migration_name;
    END IF;
    
    start_time := NOW();
    
    -- Create execution log entry
    INSERT INTO migration_execution_log (
        migration_id,
        execution_start,
        executed_by,
        execution_environment,
        cultural_validation_performed,
        elder_supervision_present,
        execution_status
    ) VALUES (
        p_migration_id,
        start_time,
        p_executed_by,
        p_environment,
        migration_record.affects_sacred_content,
        migration_record.requires_elder_approval,
        'running'
    ) RETURNING id INTO execution_log_id;
    
    -- Update migration status
    UPDATE schema_migrations 
    SET execution_status = 'running',
        execution_start = start_time,
        updated_at = NOW()
    WHERE id = p_migration_id;
    
    -- Execute the migration SQL
    BEGIN
        EXECUTE migration_record.migration_sql;
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        
        execution_success := true;
        
    EXCEPTION WHEN OTHERS THEN
        execution_success := false;
        error_msg := SQLERRM;
        
        -- Log the error
        RAISE NOTICE 'Migration execution failed: %', error_msg;
    END;
    
    end_time := NOW();
    duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
    
    -- Update execution log
    UPDATE migration_execution_log 
    SET execution_end = end_time,
        execution_duration_seconds = duration_seconds,
        execution_status = CASE WHEN execution_success THEN 'completed' ELSE 'failed' END,
        rows_affected = rows_affected,
        data_integrity_verified = execution_success,
        cultural_protocols_followed = migration_record.affects_sacred_content,
        error_message = error_msg,
        updated_at = NOW()
    WHERE id = execution_log_id;
    
    -- Update migration record
    UPDATE schema_migrations 
    SET execution_status = CASE WHEN execution_success THEN 'completed' ELSE 'failed' END,
        execution_end = end_time,
        execution_duration_seconds = duration_seconds,
        validation_passed = execution_success,
        error_message = error_msg,
        updated_at = NOW()
    WHERE id = p_migration_id;
    
    -- If execution failed and rollback is available, consider automatic rollback
    IF NOT execution_success AND migration_record.rollback_sql IS NOT NULL THEN
        PERFORM initiate_migration_rollback(
            p_migration_id,
            'Migration execution failed: ' || error_msg,
            'automatic'
        );
    END IF;
    
    RETURN execution_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to initiate migration rollback
CREATE OR REPLACE FUNCTION initiate_migration_rollback(
    p_migration_id UUID,
    p_rollback_reason TEXT,
    p_rollback_type TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
    migration_record RECORD;
    rollback_id UUID;
    requires_elder BOOLEAN := false;
BEGIN
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = p_migration_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration not found: %', p_migration_id;
    END IF;
    
    -- Check if rollback SQL is available
    IF migration_record.rollback_sql IS NULL THEN
        RAISE EXCEPTION 'No rollback SQL available for migration: %', migration_record.migration_name;
    END IF;
    
    -- Determine if elder authorization is required
    requires_elder := migration_record.affects_sacred_content OR p_rollback_type = 'cultural_violation';
    
    -- Create rollback record
    INSERT INTO migration_rollbacks (
        migration_id,
        rollback_reason,
        rollback_type,
        involves_sacred_content,
        elder_authorization_required,
        rollback_status
    ) VALUES (
        p_migration_id,
        p_rollback_reason,
        p_rollback_type,
        migration_record.affects_sacred_content,
        requires_elder,
        CASE WHEN requires_elder THEN 'pending' ELSE 'approved' END
    ) RETURNING id INTO rollback_id;
    
    RETURN rollback_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute migration rollback
CREATE OR REPLACE FUNCTION execute_migration_rollback(p_rollback_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rollback_record RECORD;
    migration_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_seconds INTEGER;
    rollback_success BOOLEAN := true;
    error_msg TEXT;
BEGIN
    -- Get rollback record
    SELECT * INTO rollback_record 
    FROM migration_rollbacks 
    WHERE id = p_rollback_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rollback record not found: %', p_rollback_id;
    END IF;
    
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = rollback_record.migration_id;
    
    -- Check authorization
    IF rollback_record.elder_authorization_required AND rollback_record.elder_authorized_by IS NULL THEN
        RAISE EXCEPTION 'Rollback requires elder authorization but none provided';
    END IF;
    
    start_time := NOW();
    
    -- Update rollback status
    UPDATE migration_rollbacks 
    SET rollback_status = 'running',
        rollback_start = start_time,
        updated_at = NOW()
    WHERE id = p_rollback_id;
    
    -- Execute rollback SQL
    BEGIN
        EXECUTE migration_record.rollback_sql;
        rollback_success := true;
        
    EXCEPTION WHEN OTHERS THEN
        rollback_success := false;
        error_msg := SQLERRM;
    END;
    
    end_time := NOW();
    duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
    
    -- Update rollback record
    UPDATE migration_rollbacks 
    SET rollback_end = end_time,
        rollback_duration_seconds = duration_seconds,
        rollback_status = CASE WHEN rollback_success THEN 'completed' ELSE 'failed' END,
        rollback_success = rollback_success,
        system_integrity_verified = rollback_success,
        cultural_integrity_maintained = rollback_success,
        rollback_error_message = error_msg,
        updated_at = NOW()
    WHERE id = p_rollback_id;
    
    -- Update migration status if rollback successful
    IF rollback_success THEN
        UPDATE schema_migrations 
        SET execution_status = 'rolled_back',
            rollback_executed_at = end_time,
            rollback_reason = rollback_record.rollback_reason,
            updated_at = NOW()
        WHERE id = rollback_record.migration_id;
    END IF;
    
    RETURN rollback_success;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending migrations
CREATE OR REPLACE FUNCTION get_pending_migrations()
RETURNS TABLE(
    migration_id UUID,
    migration_name TEXT,
    migration_version TEXT,
    migration_type TEXT,
    cultural_sensitivity_level TEXT,
    requires_elder_approval BOOLEAN,
    elder_approved BOOLEAN,
    execution_status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.migration_name,
        sm.migration_version,
        sm.migration_type,
        sm.cultural_sensitivity_level,
        sm.requires_elder_approval,
        sm.elder_approved_by IS NOT NULL,
        sm.execution_status,
        sm.created_at
    FROM schema_migrations sm
    WHERE sm.execution_status IN ('pending', 'approved')
    ORDER BY 
        CASE sm.cultural_sensitivity_level 
            WHEN 'ceremonial' THEN 1 
            WHEN 'sacred' THEN 2 
            WHEN 'sensitive' THEN 3 
            ELSE 4 
        END,
        sm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to validate migration dependencies
CREATE OR REPLACE FUNCTION validate_migration_dependencies(p_migration_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    migration_record RECORD;
    dependency TEXT;
    dependency_status TEXT;
BEGIN
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = p_migration_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check each dependency
    FOREACH dependency IN ARRAY migration_record.depends_on_migrations
    LOOP
        SELECT execution_status INTO dependency_status
        FROM schema_migrations 
        WHERE migration_version = dependency;
        
        IF dependency_status IS NULL THEN
            RAISE NOTICE 'Dependency % not found', dependency;
            RETURN false;
        END IF;
        
        IF dependency_status != 'completed' THEN
            RAISE NOTICE 'Dependency % not completed (status: %)', dependency, dependency_status;
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

SELECT 'Database migration system foundation created successfully' as status;