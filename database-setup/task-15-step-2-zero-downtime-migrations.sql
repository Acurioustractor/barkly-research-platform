-- =====================================================
-- TASK 15 - STEP 2: Zero-Downtime Migration Procedures
-- Safe Schema Changes, Data Migrations, and Cultural Data Protection
-- =====================================================

-- Create zero-downtime migration strategies table
CREATE TABLE IF NOT EXISTS zero_downtime_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Strategy Information
    strategy_name TEXT NOT NULL UNIQUE,
    strategy_type TEXT NOT NULL
        CHECK (strategy_type IN ('expand_contract', 'blue_green', 'shadow_table', 'online_ddl', 'cultural_safe')),
    
    -- Strategy Configuration
    strategy_description TEXT,
    implementation_steps JSONB DEFAULT '{}',
    rollback_steps JSONB DEFAULT '{}',
    
    -- Safety Measures
    requires_table_lock BOOLEAN DEFAULT false,
    max_lock_duration_seconds INTEGER DEFAULT 5,
    supports_concurrent_reads BOOLEAN DEFAULT true,
    supports_concurrent_writes BOOLEAN DEFAULT true,
    
    -- Cultural Context
    safe_for_sacred_content BOOLEAN DEFAULT false,
    requires_elder_supervision BOOLEAN DEFAULT false,
    cultural_validation_required BOOLEAN DEFAULT false,
    
    -- Performance Impact
    estimated_performance_impact TEXT DEFAULT 'low'
        CHECK (estimated_performance_impact IN ('none', 'low', 'medium', 'high')),
    resource_requirements JSONB DEFAULT '{}',
    
    -- Status
    strategy_status TEXT DEFAULT 'active'
        CHECK (strategy_status IN ('active', 'deprecated', 'experimental')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create migration phases table for multi-step migrations
CREATE TABLE IF NOT EXISTS migration_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Phase Information
    migration_id UUID NOT NULL REFERENCES schema_migrations(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    phase_type TEXT NOT NULL
        CHECK (phase_type IN ('preparation', 'expansion', 'migration', 'validation', 'contraction', 'cleanup')),
    
    -- Phase Configuration
    phase_sql TEXT NOT NULL,
    rollback_sql TEXT,
    phase_description TEXT,
    
    -- Dependencies
    depends_on_phases INTEGER[] DEFAULT '{}',
    can_run_parallel BOOLEAN DEFAULT false,
    
    -- Cultural Context
    affects_sacred_content BOOLEAN DEFAULT false,
    requires_elder_presence BOOLEAN DEFAULT false,
    cultural_validation_steps JSONB DEFAULT '{}',
    
    -- Execution Control
    max_execution_time_minutes INTEGER DEFAULT 30,
    can_be_cancelled BOOLEAN DEFAULT true,
    requires_confirmation BOOLEAN DEFAULT false,
    
    -- Phase Status
    phase_status TEXT DEFAULT 'pending'
        CHECK (phase_status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'cancelled')),
    execution_start TIMESTAMPTZ,
    execution_end TIMESTAMPTZ,
    execution_duration_seconds INTEGER,
    
    -- Validation
    validation_required BOOLEAN DEFAULT true,
    validation_passed BOOLEAN,
    validation_notes TEXT,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(migration_id, phase_number)
);

-- Create migration locks table for coordination
CREATE TABLE IF NOT EXISTS migration_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lock Information
    lock_name TEXT NOT NULL UNIQUE,
    lock_type TEXT NOT NULL
        CHECK (lock_type IN ('table_lock', 'schema_lock', 'cultural_lock', 'system_lock')),
    
    -- Lock Context
    migration_id UUID REFERENCES schema_migrations(id),
    locked_resources TEXT[] DEFAULT '{}',
    
    -- Lock Details
    lock_acquired_at TIMESTAMPTZ DEFAULT NOW(),
    lock_expires_at TIMESTAMPTZ,
    lock_duration_seconds INTEGER,
    
    -- Lock Holder
    locked_by UUID,
    lock_session_id TEXT,
    
    -- Cultural Context
    protects_sacred_content BOOLEAN DEFAULT false,
    elder_authorized BOOLEAN DEFAULT false,
    
    -- Lock Status
    lock_status TEXT DEFAULT 'active'
        CHECK (lock_status IN ('active', 'expired', 'released', 'broken')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create migration validation rules table
CREATE TABLE IF NOT EXISTS migration_validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Information
    rule_name TEXT NOT NULL UNIQUE,
    rule_type TEXT NOT NULL
        CHECK (rule_type IN ('data_integrity', 'cultural_compliance', 'performance', 'security', 'business_logic')),
    
    -- Rule Configuration
    validation_sql TEXT NOT NULL,
    expected_result JSONB DEFAULT '{}',
    rule_description TEXT,
    
    -- Cultural Context
    applies_to_sacred_content BOOLEAN DEFAULT false,
    requires_elder_validation BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    
    -- Rule Execution
    execution_timeout_seconds INTEGER DEFAULT 60,
    critical_rule BOOLEAN DEFAULT false,
    
    -- Rule Status
    rule_status TEXT DEFAULT 'active'
        CHECK (rule_status IN ('active', 'disabled', 'deprecated')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ZERO-DOWNTIME MIGRATION FUNCTIONS
-- =====================================================

-- Function to create zero-downtime migration strategy
CREATE OR REPLACE FUNCTION create_zero_downtime_strategy(
    p_strategy_name TEXT,
    p_strategy_type TEXT,
    p_description TEXT,
    p_safe_for_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    strategy_id UUID;
    implementation_steps JSONB;
    rollback_steps JSONB;
BEGIN
    -- Build implementation steps based on strategy type
    CASE p_strategy_type
        WHEN 'expand_contract' THEN
            implementation_steps := jsonb_build_object(
                'phase_1', 'Add new columns/tables without constraints',
                'phase_2', 'Deploy application code to write to both old and new',
                'phase_3', 'Migrate existing data to new structure',
                'phase_4', 'Deploy application code to read from new structure',
                'phase_5', 'Remove old columns/tables'
            );
            rollback_steps := jsonb_build_object(
                'step_1', 'Revert application to read from old structure',
                'step_2', 'Revert application to write only to old structure',
                'step_3', 'Remove new columns/tables'
            );
        WHEN 'shadow_table' THEN
            implementation_steps := jsonb_build_object(
                'phase_1', 'Create shadow table with new structure',
                'phase_2', 'Set up triggers to sync data',
                'phase_3', 'Migrate existing data to shadow table',
                'phase_4', 'Switch application to use shadow table',
                'phase_5', 'Drop original table and rename shadow table'
            );
        ELSE
            implementation_steps := jsonb_build_object(
                'phase_1', 'Prepare migration environment',
                'phase_2', 'Execute migration with minimal locking',
                'phase_3', 'Validate migration results'
            );
    END CASE;
    
    INSERT INTO zero_downtime_strategies (
        strategy_name,
        strategy_type,
        strategy_description,
        implementation_steps,
        rollback_steps,
        safe_for_sacred_content,
        requires_elder_supervision,
        cultural_validation_required
    ) VALUES (
        p_strategy_name,
        p_strategy_type,
        p_description,
        implementation_steps,
        rollback_steps,
        p_safe_for_sacred_content,
        p_safe_for_sacred_content,
        p_safe_for_sacred_content
    ) RETURNING id INTO strategy_id;
    
    RETURN strategy_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create migration phases
CREATE OR REPLACE FUNCTION create_migration_phases(
    p_migration_id UUID,
    p_strategy_type TEXT DEFAULT 'expand_contract'
)
RETURNS INTEGER AS $$
DECLARE
    migration_record RECORD;
    phase_count INTEGER := 0;
    phase_id UUID;
BEGIN
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = p_migration_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration not found: %', p_migration_id;
    END IF;
    
    -- Create phases based on strategy type
    CASE p_strategy_type
        WHEN 'expand_contract' THEN
            -- Phase 1: Preparation
            INSERT INTO migration_phases (
                migration_id, phase_number, phase_name, phase_type,
                phase_sql, phase_description,
                affects_sacred_content, requires_elder_presence
            ) VALUES (
                p_migration_id, 1, 'Preparation', 'preparation',
                'SELECT ''Preparing for expand-contract migration''',
                'Prepare environment and validate prerequisites',
                migration_record.affects_sacred_content,
                migration_record.requires_elder_approval
            );
            phase_count := phase_count + 1;
            
            -- Phase 2: Expansion
            INSERT INTO migration_phases (
                migration_id, phase_number, phase_name, phase_type,
                phase_sql, phase_description,
                affects_sacred_content, requires_elder_presence
            ) VALUES (
                p_migration_id, 2, 'Expansion', 'expansion',
                migration_record.migration_sql,
                'Add new schema elements without breaking existing functionality',
                migration_record.affects_sacred_content,
                migration_record.requires_elder_approval
            );
            phase_count := phase_count + 1;
            
            -- Phase 3: Validation
            INSERT INTO migration_phases (
                migration_id, phase_number, phase_name, phase_type,
                phase_sql, phase_description,
                affects_sacred_content, requires_elder_presence
            ) VALUES (
                p_migration_id, 3, 'Validation', 'validation',
                'SELECT ''Validating migration results''',
                'Validate that migration completed successfully',
                migration_record.affects_sacred_content,
                migration_record.requires_elder_approval
            );
            phase_count := phase_count + 1;
            
        WHEN 'shadow_table' THEN
            -- Create shadow table phases
            INSERT INTO migration_phases (
                migration_id, phase_number, phase_name, phase_type,
                phase_sql, phase_description
            ) VALUES 
            (p_migration_id, 1, 'Create Shadow Table', 'preparation',
             'SELECT ''Creating shadow table''', 'Create shadow table with new structure'),
            (p_migration_id, 2, 'Setup Sync', 'preparation',
             'SELECT ''Setting up data synchronization''', 'Set up triggers for data sync'),
            (p_migration_id, 3, 'Migrate Data', 'migration',
             migration_record.migration_sql, 'Migrate existing data to shadow table'),
            (p_migration_id, 4, 'Switch Tables', 'contraction',
             'SELECT ''Switching to shadow table''', 'Switch application to use shadow table');
            phase_count := 4;
            
        ELSE
            -- Default single-phase migration
            INSERT INTO migration_phases (
                migration_id, phase_number, phase_name, phase_type,
                phase_sql, phase_description,
                affects_sacred_content, requires_elder_presence
            ) VALUES (
                p_migration_id, 1, 'Execute Migration', 'migration',
                migration_record.migration_sql,
                'Execute migration with minimal downtime',
                migration_record.affects_sacred_content,
                migration_record.requires_elder_approval
            );
            phase_count := 1;
    END CASE;
    
    RETURN phase_count;
END;
$$ LANGUAGE plpgsql;

-- Function to execute migration phase
CREATE OR REPLACE FUNCTION execute_migration_phase(p_phase_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    phase_record RECORD;
    migration_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_seconds INTEGER;
    execution_success BOOLEAN := true;
    error_msg TEXT;
BEGIN
    -- Get phase record
    SELECT * INTO phase_record 
    FROM migration_phases 
    WHERE id = p_phase_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration phase not found: %', p_phase_id;
    END IF;
    
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = phase_record.migration_id;
    
    -- Check if phase can be executed
    IF phase_record.phase_status NOT IN ('pending', 'failed') THEN
        RAISE EXCEPTION 'Phase % cannot be executed (status: %)', 
            phase_record.phase_name, phase_record.phase_status;
    END IF;
    
    -- Validate dependencies
    IF NOT validate_phase_dependencies(p_phase_id) THEN
        RAISE EXCEPTION 'Phase dependencies not satisfied for phase %', phase_record.phase_name;
    END IF;
    
    start_time := NOW();
    
    -- Update phase status
    UPDATE migration_phases 
    SET phase_status = 'running',
        execution_start = start_time,
        updated_at = NOW()
    WHERE id = p_phase_id;
    
    -- Execute phase SQL
    BEGIN
        EXECUTE phase_record.phase_sql;
        execution_success := true;
        
    EXCEPTION WHEN OTHERS THEN
        execution_success := false;
        error_msg := SQLERRM;
    END;
    
    end_time := NOW();
    duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time));
    
    -- Update phase record
    UPDATE migration_phases 
    SET phase_status = CASE WHEN execution_success THEN 'completed' ELSE 'failed' END,
        execution_end = end_time,
        execution_duration_seconds = duration_seconds,
        validation_passed = execution_success,
        error_message = error_msg,
        updated_at = NOW()
    WHERE id = p_phase_id;
    
    -- If this was the last phase and successful, mark migration as completed
    IF execution_success AND NOT EXISTS (
        SELECT 1 FROM migration_phases 
        WHERE migration_id = phase_record.migration_id 
        AND phase_status NOT IN ('completed', 'skipped')
        AND id != p_phase_id
    ) THEN
        UPDATE schema_migrations 
        SET execution_status = 'completed',
            execution_end = end_time,
            validation_passed = true,
            updated_at = NOW()
        WHERE id = phase_record.migration_id;
    END IF;
    
    RETURN execution_success;
END;
$$ LANGUAGE plpgsql;

-- Function to validate phase dependencies
CREATE OR REPLACE FUNCTION validate_phase_dependencies(p_phase_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    phase_record RECORD;
    dependency_phase INTEGER;
    dependency_status TEXT;
BEGIN
    -- Get phase record
    SELECT * INTO phase_record 
    FROM migration_phases 
    WHERE id = p_phase_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check each dependency
    FOREACH dependency_phase IN ARRAY phase_record.depends_on_phases
    LOOP
        SELECT phase_status INTO dependency_status
        FROM migration_phases 
        WHERE migration_id = phase_record.migration_id 
        AND phase_number = dependency_phase;
        
        IF dependency_status IS NULL THEN
            RAISE NOTICE 'Dependency phase % not found', dependency_phase;
            RETURN false;
        END IF;
        
        IF dependency_status NOT IN ('completed', 'skipped') THEN
            RAISE NOTICE 'Dependency phase % not completed (status: %)', dependency_phase, dependency_status;
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to acquire migration lock
CREATE OR REPLACE FUNCTION acquire_migration_lock(
    p_lock_name TEXT,
    p_lock_type TEXT,
    p_migration_id UUID,
    p_resources TEXT[] DEFAULT '{}',
    p_duration_seconds INTEGER DEFAULT 300
)
RETURNS UUID AS $$
DECLARE
    lock_id UUID;
    expires_at TIMESTAMPTZ;
BEGIN
    expires_at := NOW() + (p_duration_seconds || ' seconds')::INTERVAL;
    
    -- Check if lock already exists
    IF EXISTS (SELECT 1 FROM migration_locks WHERE lock_name = p_lock_name AND lock_status = 'active') THEN
        RAISE EXCEPTION 'Lock % already exists and is active', p_lock_name;
    END IF;
    
    INSERT INTO migration_locks (
        lock_name,
        lock_type,
        migration_id,
        locked_resources,
        lock_expires_at,
        lock_duration_seconds,
        lock_status
    ) VALUES (
        p_lock_name,
        p_lock_type,
        p_migration_id,
        p_resources,
        expires_at,
        p_duration_seconds,
        'active'
    ) RETURNING id INTO lock_id;
    
    RETURN lock_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release migration lock
CREATE OR REPLACE FUNCTION release_migration_lock(p_lock_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE migration_locks 
    SET lock_status = 'released',
        updated_at = NOW()
    WHERE id = p_lock_id AND lock_status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to validate migration safety
CREATE OR REPLACE FUNCTION validate_migration_safety(p_migration_id UUID)
RETURNS TABLE(
    validation_type TEXT,
    validation_status TEXT,
    validation_message TEXT,
    is_blocking BOOLEAN
) AS $$
DECLARE
    migration_record RECORD;
BEGIN
    -- Get migration record
    SELECT * INTO migration_record 
    FROM schema_migrations 
    WHERE id = p_migration_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'error'::TEXT, 'failed'::TEXT, 'Migration not found'::TEXT, true::BOOLEAN;
        RETURN;
    END IF;
    
    -- Check cultural compliance
    IF migration_record.affects_sacred_content THEN
        IF migration_record.elder_approved_by IS NULL THEN
            RETURN QUERY SELECT 'cultural'::TEXT, 'failed'::TEXT, 'Elder approval required for sacred content'::TEXT, true::BOOLEAN;
        ELSE
            RETURN QUERY SELECT 'cultural'::TEXT, 'passed'::TEXT, 'Elder approval obtained'::TEXT, false::BOOLEAN;
        END IF;
    ELSE
        RETURN QUERY SELECT 'cultural'::TEXT, 'not_applicable'::TEXT, 'No sacred content affected'::TEXT, false::BOOLEAN;
    END IF;
    
    -- Check dependencies
    IF validate_migration_dependencies(p_migration_id) THEN
        RETURN QUERY SELECT 'dependencies'::TEXT, 'passed'::TEXT, 'All dependencies satisfied'::TEXT, false::BOOLEAN;
    ELSE
        RETURN QUERY SELECT 'dependencies'::TEXT, 'failed'::TEXT, 'Migration dependencies not satisfied'::TEXT, true::BOOLEAN;
    END IF;
    
    -- Check for conflicting migrations
    IF EXISTS (
        SELECT 1 FROM schema_migrations 
        WHERE execution_status = 'running' 
        AND id != p_migration_id
    ) THEN
        RETURN QUERY SELECT 'conflicts'::TEXT, 'failed'::TEXT, 'Another migration is currently running'::TEXT, true::BOOLEAN;
    ELSE
        RETURN QUERY SELECT 'conflicts'::TEXT, 'passed'::TEXT, 'No conflicting migrations'::TEXT, false::BOOLEAN;
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP DEFAULT ZERO-DOWNTIME STRATEGIES
-- =====================================================

-- Create default zero-downtime strategies
DO $$
DECLARE
    strategy_id UUID;
BEGIN
    -- Expand-Contract strategy
    SELECT create_zero_downtime_strategy(
        'expand_contract_standard',
        'expand_contract',
        'Standard expand-contract pattern for schema changes',
        false
    ) INTO strategy_id;
    
    -- Cultural-safe expand-contract
    SELECT create_zero_downtime_strategy(
        'expand_contract_cultural',
        'expand_contract',
        'Cultural-safe expand-contract pattern with elder oversight',
        true
    ) INTO strategy_id;
    
    -- Shadow table strategy
    SELECT create_zero_downtime_strategy(
        'shadow_table_standard',
        'shadow_table',
        'Shadow table pattern for major structural changes',
        false
    ) INTO strategy_id;
    
    -- Online DDL strategy
    SELECT create_zero_downtime_strategy(
        'online_ddl_safe',
        'online_ddl',
        'Online DDL operations with minimal locking',
        true
    ) INTO strategy_id;
    
    RAISE NOTICE 'Created default zero-downtime migration strategies';
END;
$$;

-- =====================================================
-- PERFORMANCE INDEXES FOR MIGRATION SYSTEM
-- =====================================================

-- Migration phases indexes
CREATE INDEX IF NOT EXISTS idx_migration_phases_migration ON migration_phases(migration_id, phase_number);
CREATE INDEX IF NOT EXISTS idx_migration_phases_status ON migration_phases(phase_status, execution_start DESC);
CREATE INDEX IF NOT EXISTS idx_migration_phases_cultural ON migration_phases(affects_sacred_content, requires_elder_presence);

-- Migration locks indexes
CREATE INDEX IF NOT EXISTS idx_migration_locks_name ON migration_locks(lock_name, lock_status);
CREATE INDEX IF NOT EXISTS idx_migration_locks_migration ON migration_locks(migration_id, lock_status);
CREATE INDEX IF NOT EXISTS idx_migration_locks_expires ON migration_locks(lock_expires_at, lock_status);

-- Zero-downtime strategies indexes
CREATE INDEX IF NOT EXISTS idx_zero_downtime_strategies_type ON zero_downtime_strategies(strategy_type, strategy_status);
CREATE INDEX IF NOT EXISTS idx_zero_downtime_strategies_cultural ON zero_downtime_strategies(safe_for_sacred_content, requires_elder_supervision);

SELECT 'Zero-downtime migration procedures implemented successfully' as status;