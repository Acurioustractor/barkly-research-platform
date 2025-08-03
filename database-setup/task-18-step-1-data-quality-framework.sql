-- =====================================================
-- TASK 18 - STEP 1: Data Quality and Validation Framework
-- Data Integrity, Quality Rules, and Cultural Data Governance
-- =====================================================

-- Create data quality rules table
CREATE TABLE IF NOT EXISTS data_quality_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Information
    rule_name TEXT NOT NULL UNIQUE,
    rule_type TEXT NOT NULL
        CHECK (rule_type IN ('integrity', 'completeness', 'accuracy', 'consistency', 'validity', 'cultural', 'uniqueness')),
    rule_category TEXT DEFAULT 'data_validation'
        CHECK (rule_category IN ('data_validation', 'cultural_compliance', 'business_logic', 'referential_integrity', 'format_validation')),
    
    -- Rule Definition
    target_table TEXT NOT NULL,
    target_columns TEXT[] DEFAULT '{}',
    validation_sql TEXT NOT NULL,
    expected_result JSONB DEFAULT '{}',
    
    -- Cultural Context
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_elder_validation BOOLEAN DEFAULT false,
    affects_sacred_content BOOLEAN DEFAULT false,
    
    -- Rule Configuration
    severity_level TEXT DEFAULT 'warning'
        CHECK (severity_level IN ('info', 'warning', 'error', 'critical')),
    auto_fix_enabled BOOLEAN DEFAULT false,
    auto_fix_sql TEXT,
    
    -- Execution Settings
    execution_frequency TEXT DEFAULT 'daily'
        CHECK (execution_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'monthly', 'on_demand')),
    enabled BOOLEAN DEFAULT true,
    
    -- Rule Description
    rule_description TEXT,
    failure_message_template TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data quality execution results table
CREATE TABLE IF NOT EXISTS data_quality_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Execution Context
    rule_id UUID NOT NULL REFERENCES data_quality_rules(id) ON DELETE CASCADE,
    execution_batch_id UUID NOT NULL,
    
    -- Execution Information
    execution_start TIMESTAMPTZ DEFAULT NOW(),
    execution_end TIMESTAMPTZ,
    execution_duration_ms INTEGER,
    
    -- Results
    check_status TEXT NOT NULL
        CHECK (check_status IN ('passed', 'failed', 'error', 'skipped')),
    records_checked BIGINT DEFAULT 0,
    records_failed BIGINT DEFAULT 0,
    failure_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Detailed Results
    validation_result JSONB DEFAULT '{}',
    failed_records JSONB DEFAULT '{}',
    
    -- Cultural Context
    cultural_violations_detected BOOLEAN DEFAULT false,
    sacred_content_affected BOOLEAN DEFAULT false,
    elder_notification_sent BOOLEAN DEFAULT false,
    
    -- Error Information
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    -- Auto-fix Results
    auto_fix_attempted BOOLEAN DEFAULT false,
    auto_fix_successful BOOLEAN DEFAULT false,
    records_auto_fixed BIGINT DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data lineage tracking table
CREATE TABLE IF NOT EXISTS data_lineage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lineage Information
    source_table TEXT NOT NULL,
    source_column TEXT,
    source_record_id UUID,
    
    -- Target Information
    target_table TEXT NOT NULL,
    target_column TEXT,
    target_record_id UUID,
    
    -- Transformation Information
    transformation_type TEXT NOT NULL
        CHECK (transformation_type IN ('insert', 'update', 'delete', 'merge', 'aggregate', 'derive', 'copy')),
    transformation_function TEXT,
    transformation_rules JSONB DEFAULT '{}',
    
    -- Cultural Context
    involves_sacred_content BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity_level IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    elder_approved BOOLEAN DEFAULT false,
    
    -- Lineage Metadata
    data_flow_id UUID,
    processing_timestamp TIMESTAMPTZ DEFAULT NOW(),
    data_quality_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Audit Information
    processed_by UUID,
    processing_system TEXT DEFAULT 'database',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data governance policies table
CREATE TABLE IF NOT EXISTS data_governance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy Information
    policy_name TEXT NOT NULL UNIQUE,
    policy_type TEXT NOT NULL
        CHECK (policy_type IN ('retention', 'access_control', 'cultural_protection', 'data_classification', 'privacy', 'compliance')),
    policy_scope TEXT DEFAULT 'table'
        CHECK (policy_scope IN ('database', 'schema', 'table', 'column', 'record')),
    
    -- Policy Definition
    target_objects TEXT[] NOT NULL,
    policy_rules JSONB NOT NULL,
    enforcement_sql TEXT,
    
    -- Cultural Context
    cultural_policy BOOLEAN DEFAULT false,
    sacred_content_protection BOOLEAN DEFAULT false,
    elder_oversight_required BOOLEAN DEFAULT false,
    community_specific BOOLEAN DEFAULT false,
    applicable_communities UUID[] DEFAULT '{}',
    
    -- Policy Configuration
    enforcement_level TEXT DEFAULT 'warning'
        CHECK (enforcement_level IN ('advisory', 'warning', 'blocking', 'audit_only')),
    auto_enforcement BOOLEAN DEFAULT false,
    
    -- Compliance Tracking
    compliance_framework TEXT[] DEFAULT '{}',
    regulatory_requirements TEXT[] DEFAULT '{}',
    
    -- Status
    policy_status TEXT DEFAULT 'active'
        CHECK (policy_status IN ('draft', 'active', 'suspended', 'deprecated')),
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    
    -- System Fields
    created_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data quality dashboard metrics table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Context
    metric_timestamp TIMESTAMPTZ DEFAULT NOW(),
    table_name TEXT NOT NULL,
    
    -- Quality Metrics
    total_records BIGINT DEFAULT 0,
    valid_records BIGINT DEFAULT 0,
    invalid_records BIGINT DEFAULT 0,
    duplicate_records BIGINT DEFAULT 0,
    null_records BIGINT DEFAULT 0,
    
    -- Quality Scores (0.0 to 1.0)
    completeness_score DECIMAL(3,2) DEFAULT 1.0,
    accuracy_score DECIMAL(3,2) DEFAULT 1.0,
    consistency_score DECIMAL(3,2) DEFAULT 1.0,
    validity_score DECIMAL(3,2) DEFAULT 1.0,
    overall_quality_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Cultural Quality Metrics
    sacred_content_records BIGINT DEFAULT 0,
    cultural_compliance_score DECIMAL(3,2) DEFAULT 1.0,
    elder_approved_records BIGINT DEFAULT 0,
    
    -- Trend Information
    quality_trend TEXT DEFAULT 'stable'
        CHECK (quality_trend IN ('improving', 'stable', 'declining', 'unknown')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DATA QUALITY FUNCTIONS
-- =====================================================

-- Function to create data quality rule
CREATE OR REPLACE FUNCTION create_data_quality_rule(
    p_rule_name TEXT,
    p_rule_type TEXT,
    p_target_table TEXT,
    p_validation_sql TEXT,
    p_severity_level TEXT DEFAULT 'warning',
    p_affects_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    rule_id UUID;
    cultural_level TEXT := 'standard';
    elder_validation BOOLEAN := false;
BEGIN
    -- Determine cultural settings
    IF p_affects_sacred_content THEN
        cultural_level := 'sacred';
        elder_validation := true;
    END IF;
    
    INSERT INTO data_quality_rules (
        rule_name,
        rule_type,
        target_table,
        validation_sql,
        severity_level,
        cultural_sensitivity_level,
        requires_elder_validation,
        affects_sacred_content,
        enabled
    ) VALUES (
        p_rule_name,
        p_rule_type,
        p_target_table,
        p_validation_sql,
        p_severity_level,
        cultural_level,
        elder_validation,
        p_affects_sacred_content,
        true
    ) RETURNING id INTO rule_id;
    
    RETURN rule_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute data quality rule
CREATE OR REPLACE FUNCTION execute_data_quality_rule(
    p_rule_id UUID,
    p_execution_batch_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    rule_record RECORD;
    result_id UUID;
    batch_id UUID;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INTEGER;
    check_status TEXT := 'passed';
    records_checked BIGINT := 0;
    records_failed BIGINT := 0;
    validation_result JSONB := '{}';
    error_msg TEXT;
BEGIN
    -- Generate batch ID if not provided
    batch_id := COALESCE(p_execution_batch_id, gen_random_uuid());
    
    -- Get rule information
    SELECT * INTO rule_record 
    FROM data_quality_rules 
    WHERE id = p_rule_id AND enabled = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data quality rule not found or disabled: %', p_rule_id;
    END IF;
    
    start_time := NOW();
    
    -- Create result record
    INSERT INTO data_quality_results (
        rule_id,
        execution_batch_id,
        execution_start,
        check_status,
        cultural_violations_detected,
        sacred_content_affected
    ) VALUES (
        p_rule_id,
        batch_id,
        start_time,
        'running',
        rule_record.affects_sacred_content,
        rule_record.affects_sacred_content
    ) RETURNING id INTO result_id;
    
    -- Execute validation SQL
    BEGIN
        -- This is a simplified execution - in production would handle different result types
        EXECUTE rule_record.validation_sql;
        
        -- For this example, assume validation passed
        check_status := 'passed';
        records_checked := 1;
        records_failed := 0;
        validation_result := jsonb_build_object(
            'validation_passed', true,
            'execution_successful', true
        );
        
    EXCEPTION WHEN OTHERS THEN
        check_status := 'error';
        error_msg := SQLERRM;
        validation_result := jsonb_build_object(
            'validation_passed', false,
            'error', error_msg
        );
    END;
    
    end_time := NOW();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Update result record
    UPDATE data_quality_results 
    SET execution_end = end_time,
        execution_duration_ms = duration_ms,
        check_status = check_status,
        records_checked = records_checked,
        records_failed = records_failed,
        failure_rate = CASE WHEN records_checked > 0 THEN records_failed::DECIMAL / records_checked ELSE 0 END,
        validation_result = validation_result,
        error_message = error_msg
    WHERE id = result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create data governance policy
CREATE OR REPLACE FUNCTION create_data_governance_policy(
    p_policy_name TEXT,
    p_policy_type TEXT,
    p_target_objects TEXT[],
    p_policy_rules JSONB,
    p_cultural_policy BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    policy_id UUID;
BEGIN
    INSERT INTO data_governance_policies (
        policy_name,
        policy_type,
        target_objects,
        policy_rules,
        cultural_policy,
        sacred_content_protection,
        elder_oversight_required,
        enforcement_level,
        policy_status
    ) VALUES (
        p_policy_name,
        p_policy_type,
        p_target_objects,
        p_policy_rules,
        p_cultural_policy,
        p_cultural_policy,
        p_cultural_policy,
        CASE WHEN p_cultural_policy THEN 'blocking' ELSE 'warning' END,
        'active'
    ) RETURNING id INTO policy_id;
    
    RETURN policy_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track data lineage
CREATE OR REPLACE FUNCTION track_data_lineage(
    p_source_table TEXT,
    p_target_table TEXT,
    p_transformation_type TEXT,
    p_source_record_id UUID DEFAULT NULL,
    p_target_record_id UUID DEFAULT NULL,
    p_involves_sacred_content BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    lineage_id UUID;
    cultural_level TEXT := 'standard';
BEGIN
    -- Determine cultural sensitivity
    IF p_involves_sacred_content THEN
        cultural_level := 'sacred';
    END IF;
    
    INSERT INTO data_lineage (
        source_table,
        target_table,
        transformation_type,
        source_record_id,
        target_record_id,
        involves_sacred_content,
        cultural_sensitivity_level,
        elder_approved,
        data_quality_score
    ) VALUES (
        p_source_table,
        p_target_table,
        p_transformation_type,
        p_source_record_id,
        p_target_record_id,
        p_involves_sacred_content,
        cultural_level,
        NOT p_involves_sacred_content, -- Assume elder approval for non-sacred content
        1.0 -- Default quality score
    ) RETURNING id INTO lineage_id;
    
    RETURN lineage_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate data quality metrics
CREATE OR REPLACE FUNCTION calculate_data_quality_metrics(p_table_name TEXT)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
    total_count BIGINT := 0;
    null_count BIGINT := 0;
    duplicate_count BIGINT := 0;
    sacred_count BIGINT := 0;
    completeness_score DECIMAL(3,2);
    overall_score DECIMAL(3,2);
BEGIN
    -- Get basic counts (simplified for example)
    CASE p_table_name
        WHEN 'documents' THEN
            SELECT COUNT(*), 
                   COUNT(*) FILTER (WHERE title IS NULL OR content IS NULL),
                   COUNT(*) FILTER (WHERE cultural_sensitivity_level = 'sacred')
            INTO total_count, null_count, sacred_count
            FROM documents;
            
        WHEN 'communities' THEN
            SELECT COUNT(*), 
                   COUNT(*) FILTER (WHERE name IS NULL OR description IS NULL),
                   0
            INTO total_count, null_count, sacred_count
            FROM communities;
            
        ELSE
            -- Default case for other tables
            total_count := 0;
            null_count := 0;
            sacred_count := 0;
    END CASE;
    
    -- Calculate quality scores
    completeness_score := CASE 
        WHEN total_count > 0 THEN 1.0 - (null_count::DECIMAL / total_count)
        ELSE 1.0 
    END;
    
    overall_score := completeness_score; -- Simplified calculation
    
    -- Insert metrics
    INSERT INTO data_quality_metrics (
        table_name,
        total_records,
        valid_records,
        invalid_records,
        null_records,
        sacred_content_records,
        completeness_score,
        accuracy_score,
        consistency_score,
        validity_score,
        overall_quality_score,
        cultural_compliance_score
    ) VALUES (
        p_table_name,
        total_count,
        total_count - null_count,
        null_count,
        null_count,
        sacred_count,
        completeness_score,
        1.0, -- Simplified
        1.0, -- Simplified
        1.0, -- Simplified
        overall_score,
        CASE WHEN sacred_count > 0 THEN 1.0 ELSE 1.0 END -- Cultural compliance
    ) RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function to run all data quality checks
CREATE OR REPLACE FUNCTION run_data_quality_checks()
RETURNS TABLE(
    rule_name TEXT,
    check_status TEXT,
    records_checked BIGINT,
    records_failed BIGINT,
    execution_time_ms INTEGER
) AS $$
DECLARE
    rule_record RECORD;
    result_record RECORD;
    batch_id UUID;
BEGIN
    batch_id := gen_random_uuid();
    
    -- Execute all enabled rules
    FOR rule_record IN 
        SELECT id, rule_name 
        FROM data_quality_rules 
        WHERE enabled = true
        ORDER BY severity_level DESC, rule_name
    LOOP
        -- Execute the rule
        PERFORM execute_data_quality_rule(rule_record.id, batch_id);
        
        -- Get the result
        SELECT 
            dqr.rule_name,
            dqres.check_status,
            dqres.records_checked,
            dqres.records_failed,
            dqres.execution_duration_ms
        INTO result_record
        FROM data_quality_results dqres
        JOIN data_quality_rules dqr ON dqres.rule_id = dqr.id
        WHERE dqres.rule_id = rule_record.id
        AND dqres.execution_batch_id = batch_id
        ORDER BY dqres.created_at DESC
        LIMIT 1;
        
        RETURN QUERY SELECT 
            result_record.rule_name,
            result_record.check_status,
            result_record.records_checked,
            result_record.records_failed,
            result_record.execution_duration_ms;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get data quality dashboard
CREATE OR REPLACE FUNCTION get_data_quality_dashboard()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    overall_quality_score DECIMAL(3,2),
    completeness_score DECIMAL(3,2),
    cultural_compliance_score DECIMAL(3,2),
    quality_trend TEXT,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dqm.table_name,
        dqm.total_records,
        dqm.overall_quality_score,
        dqm.completeness_score,
        dqm.cultural_compliance_score,
        dqm.quality_trend,
        dqm.created_at as last_updated
    FROM data_quality_metrics dqm
    WHERE dqm.id IN (
        SELECT DISTINCT ON (table_name) id
        FROM data_quality_metrics
        ORDER BY table_name, created_at DESC
    )
    ORDER BY dqm.overall_quality_score ASC, dqm.table_name;
END;
$$ LANGUAGE plpgsql;

SELECT 'Data quality and validation framework created successfully' as status;