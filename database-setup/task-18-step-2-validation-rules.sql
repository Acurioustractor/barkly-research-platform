-- =====================================================
-- TASK 18 - STEP 2: Data Validation Rules and Cultural Compliance
-- Comprehensive Data Quality Rules with Cultural Sensitivity
-- =====================================================

-- Create comprehensive data quality rules for all major tables
DO $$
DECLARE
    rule_id UUID;
BEGIN
    RAISE NOTICE '=== Creating Data Quality Rules ===';
    
    -- =====================================================
    -- COMMUNITY DATA QUALITY RULES
    -- =====================================================
    
    -- Community name completeness
    SELECT create_data_quality_rule(
        'community_name_completeness',
        'completeness',
        'communities',
        'SELECT COUNT(*) FROM communities WHERE name IS NULL OR TRIM(name) = ''''',
        'error',
        false
    ) INTO rule_id;
    
    -- Community description completeness
    SELECT create_data_quality_rule(
        'community_description_completeness',
        'completeness',
        'communities',
        'SELECT COUNT(*) FROM communities WHERE description IS NULL OR TRIM(description) = ''''',
        'warning',
        false
    ) INTO rule_id;
    
    -- Community cultural protocols validation
    SELECT create_data_quality_rule(
        'community_cultural_protocols_validity',
        'cultural',
        'communities',
        'SELECT COUNT(*) FROM communities WHERE cultural_protocols IS NULL OR cultural_protocols = ''{}''::JSONB',
        'warning',
        true
    ) INTO rule_id;
    
    -- Community uniqueness
    SELECT create_data_quality_rule(
        'community_name_uniqueness',
        'uniqueness',
        'communities',
        'SELECT COUNT(*) - COUNT(DISTINCT name) FROM communities WHERE name IS NOT NULL',
        'error',
        false
    ) INTO rule_id;
    
    -- =====================================================
    -- DOCUMENT DATA QUALITY RULES
    -- =====================================================
    
    -- Document title completeness
    SELECT create_data_quality_rule(
        'document_title_completeness',
        'completeness',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE title IS NULL OR TRIM(title) = ''''',
        'error',
        false
    ) INTO rule_id;
    
    -- Document content completeness
    SELECT create_data_quality_rule(
        'document_content_completeness',
        'completeness',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE content IS NULL OR TRIM(content) = ''''',
        'error',
        false
    ) INTO rule_id;
    
    -- Document file size consistency
    SELECT create_data_quality_rule(
        'document_file_size_consistency',
        'consistency',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE file_size IS NULL OR file_size <= 0 OR file_size != LENGTH(content)',
        'warning',
        false
    ) INTO rule_id;
    
    -- Document cultural sensitivity validation
    SELECT create_data_quality_rule(
        'document_cultural_sensitivity_validity',
        'cultural',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE cultural_sensitivity_level NOT IN (''standard'', ''sensitive'', ''sacred'', ''ceremonial'')',
        'critical',
        true
    ) INTO rule_id;
    
    -- Sacred document elder approval
    SELECT create_data_quality_rule(
        'sacred_document_elder_approval',
        'cultural',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE cultural_sensitivity_level IN (''sacred'', ''ceremonial'') AND created_by NOT IN (SELECT id FROM users WHERE is_elder = true)',
        'critical',
        true
    ) INTO rule_id;
    
    -- Document community association
    SELECT create_data_quality_rule(
        'document_community_association',
        'integrity',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE community_id IS NULL OR community_id NOT IN (SELECT id FROM communities)',
        'error',
        false
    ) INTO rule_id;
    
    -- =====================================================
    -- USER DATA QUALITY RULES
    -- =====================================================
    
    -- User email completeness and format
    SELECT create_data_quality_rule(
        'user_email_validity',
        'validity',
        'users',
        'SELECT COUNT(*) FROM users WHERE email IS NULL OR email !~ ''^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$''',
        'error',
        false
    ) INTO rule_id;
    
    -- User full name completeness
    SELECT create_data_quality_rule(
        'user_full_name_completeness',
        'completeness',
        'users',
        'SELECT COUNT(*) FROM users WHERE full_name IS NULL OR TRIM(full_name) = ''''',
        'warning',
        false
    ) INTO rule_id;
    
    -- User role validity
    SELECT create_data_quality_rule(
        'user_role_validity',
        'validity',
        'users',
        'SELECT COUNT(*) FROM users WHERE role NOT IN (''member'', ''elder'', ''admin'', ''community_leader'')',
        'error',
        false
    ) INTO rule_id;
    
    -- Elder user validation
    SELECT create_data_quality_rule(
        'elder_user_validation',
        'cultural',
        'users',
        'SELECT COUNT(*) FROM users WHERE is_elder = true AND role NOT IN (''elder'', ''admin'', ''community_leader'')',
        'warning',
        true
    ) INTO rule_id;
    
    -- User community association
    SELECT create_data_quality_rule(
        'user_community_association',
        'integrity',
        'users',
        'SELECT COUNT(*) FROM users WHERE community_id IS NOT NULL AND community_id NOT IN (SELECT id FROM communities)',
        'error',
        false
    ) INTO rule_id;
    
    -- =====================================================
    -- DOCUMENT CHUNKS DATA QUALITY RULES
    -- =====================================================
    
    -- Document chunk content completeness
    SELECT create_data_quality_rule(
        'chunk_content_completeness',
        'completeness',
        'document_chunks',
        'SELECT COUNT(*) FROM document_chunks WHERE chunk_content IS NULL OR TRIM(chunk_content) = ''''',
        'error',
        false
    ) INTO rule_id;
    
    -- Document chunk sequence validity
    SELECT create_data_quality_rule(
        'chunk_sequence_validity',
        'validity',
        'document_chunks',
        'SELECT COUNT(*) FROM document_chunks WHERE chunk_sequence < 0',
        'error',
        false
    ) INTO rule_id;
    
    -- Document chunk parent association
    SELECT create_data_quality_rule(
        'chunk_document_association',
        'integrity',
        'document_chunks',
        'SELECT COUNT(*) FROM document_chunks WHERE document_id NOT IN (SELECT id FROM documents)',
        'error',
        false
    ) INTO rule_id;
    
    -- Sacred content chunk validation
    SELECT create_data_quality_rule(
        'sacred_chunk_validation',
        'cultural',
        'document_chunks',
        'SELECT COUNT(*) FROM document_chunks dc JOIN documents d ON dc.document_id = d.id WHERE d.cultural_sensitivity_level IN (''sacred'', ''ceremonial'') AND dc.cultural_sensitivity_level != d.cultural_sensitivity_level',
        'critical',
        true
    ) INTO rule_id;
    
    -- =====================================================
    -- SEARCH AND ANALYTICS DATA QUALITY RULES
    -- =====================================================
    
    -- Search vector completeness
    SELECT create_data_quality_rule(
        'search_vector_completeness',
        'completeness',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE search_vector IS NULL',
        'warning',
        false
    ) INTO rule_id;
    
    -- Document themes consistency
    SELECT create_data_quality_rule(
        'document_themes_consistency',
        'consistency',
        'document_themes',
        'SELECT COUNT(*) FROM document_themes WHERE confidence_score < 0 OR confidence_score > 1',
        'warning',
        false
    ) INTO rule_id;
    
    -- Document quotes validation
    SELECT create_data_quality_rule(
        'document_quotes_validation',
        'validity',
        'document_quotes',
        'SELECT COUNT(*) FROM document_quotes WHERE start_position < 0 OR end_position < start_position',
        'error',
        false
    ) INTO rule_id;
    
    RAISE NOTICE 'Created comprehensive data quality rules';
END;
$$;

-- Create cultural compliance validation rules
DO $$
DECLARE
    rule_id UUID;
BEGIN
    RAISE NOTICE '=== Creating Cultural Compliance Rules ===';
    
    -- Sacred content access control
    SELECT create_data_quality_rule(
        'sacred_content_access_control',
        'cultural',
        'documents',
        'SELECT COUNT(*) FROM documents d LEFT JOIN users u ON d.created_by = u.id WHERE d.cultural_sensitivity_level = ''sacred'' AND (u.is_elder = false OR u.is_elder IS NULL)',
        'critical',
        true
    ) INTO rule_id;
    
    -- Elder approval for ceremonial content
    SELECT create_data_quality_rule(
        'ceremonial_content_elder_approval',
        'cultural',
        'documents',
        'SELECT COUNT(*) FROM documents WHERE cultural_sensitivity_level = ''ceremonial'' AND elder_approved_by IS NULL',
        'critical',
        true
    ) INTO rule_id;
    
    -- Community data sovereignty
    SELECT create_data_quality_rule(
        'community_data_sovereignty',
        'cultural',
        'documents',
        'SELECT COUNT(*) FROM documents d JOIN communities c ON d.community_id = c.id WHERE c.data_sovereignty_enabled = true AND d.external_sharing_allowed = true',
        'critical',
        true
    ) INTO rule_id;
    
    -- Cultural protocol compliance
    SELECT create_data_quality_rule(
        'cultural_protocol_compliance',
        'cultural',
        'communities',
        'SELECT COUNT(*) FROM communities WHERE cultural_protocols IS NULL OR NOT (cultural_protocols ? ''sacred_content_handling'')',
        'warning',
        true
    ) INTO rule_id;
    
    RAISE NOTICE 'Created cultural compliance validation rules';
END;
$$;

-- Create data governance policies
DO $$
DECLARE
    policy_id UUID;
BEGIN
    RAISE NOTICE '=== Creating Data Governance Policies ===';
    
    -- Sacred content retention policy
    SELECT create_data_governance_policy(
        'sacred_content_retention',
        'retention',
        ARRAY['documents', 'document_chunks'],
        jsonb_build_object(
            'retention_period', 'indefinite',
            'deletion_allowed', false,
            'elder_approval_required', true,
            'cultural_review_required', true
        ),
        true
    ) INTO policy_id;
    
    -- Community data access policy
    SELECT create_data_governance_policy(
        'community_data_access',
        'access_control',
        ARRAY['documents', 'users', 'communities'],
        jsonb_build_object(
            'cross_community_access', false,
            'elder_override', true,
            'admin_access', true,
            'audit_required', true
        ),
        true
    ) INTO policy_id;
    
    -- Data classification policy
    SELECT create_data_governance_policy(
        'data_classification',
        'data_classification',
        ARRAY['documents', 'document_chunks'],
        jsonb_build_object(
            'auto_classification', true,
            'manual_review_required', true,
            'elder_validation_for_sacred', true,
            'default_classification', 'standard'
        ),
        true
    ) INTO policy_id;
    
    -- Privacy protection policy
    SELECT create_data_governance_policy(
        'privacy_protection',
        'privacy',
        ARRAY['users', 'api_request_log'],
        jsonb_build_object(
            'pii_encryption', true,
            'data_minimization', true,
            'consent_required', true,
            'retention_limit_days', 2555
        ),
        false
    ) INTO policy_id;
    
    -- Cultural compliance policy
    SELECT create_data_governance_policy(
        'cultural_compliance',
        'cultural_protection',
        ARRAY['documents', 'document_chunks', 'communities'],
        jsonb_build_object(
            'elder_oversight', true,
            'community_consent', true,
            'sacred_content_protection', true,
            'cultural_protocol_enforcement', true
        ),
        true
    ) INTO policy_id;
    
    RAISE NOTICE 'Created data governance policies';
END;
$$;

-- Create data lineage tracking for key operations
DO $$
DECLARE
    lineage_id UUID;
BEGIN
    RAISE NOTICE '=== Setting up Data Lineage Tracking ===';
    
    -- Document creation lineage
    SELECT track_data_lineage(
        'api_requests',
        'documents',
        'insert',
        NULL,
        NULL,
        false
    ) INTO lineage_id;
    
    -- Document chunking lineage
    SELECT track_data_lineage(
        'documents',
        'document_chunks',
        'derive',
        NULL,
        NULL,
        false
    ) INTO lineage_id;
    
    -- Search vector generation lineage
    SELECT track_data_lineage(
        'documents',
        'documents',
        'update',
        NULL,
        NULL,
        false
    ) INTO lineage_id;
    
    -- AI analysis lineage
    SELECT track_data_lineage(
        'documents',
        'document_themes',
        'derive',
        NULL,
        NULL,
        false
    ) INTO lineage_id;
    
    RAISE NOTICE 'Set up data lineage tracking';
END;
$$;

-- Create data quality validation triggers
CREATE OR REPLACE FUNCTION validate_document_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate title completeness
    IF NEW.title IS NULL OR TRIM(NEW.title) = '' THEN
        RAISE EXCEPTION 'Document title cannot be empty';
    END IF;
    
    -- Validate content completeness
    IF NEW.content IS NULL OR TRIM(NEW.content) = '' THEN
        RAISE EXCEPTION 'Document content cannot be empty';
    END IF;
    
    -- Validate cultural sensitivity level
    IF NEW.cultural_sensitivity_level NOT IN ('standard', 'sensitive', 'sacred', 'ceremonial') THEN
        RAISE EXCEPTION 'Invalid cultural sensitivity level: %', NEW.cultural_sensitivity_level;
    END IF;
    
    -- Validate sacred content creation
    IF NEW.cultural_sensitivity_level IN ('sacred', 'ceremonial') THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by AND is_elder = true) THEN
            RAISE EXCEPTION 'Only elders can create sacred or ceremonial content';
        END IF;
    END IF;
    
    -- Update file size
    NEW.file_size := LENGTH(NEW.content);
    
    -- Track data lineage
    IF TG_OP = 'INSERT' THEN
        PERFORM track_data_lineage(
            'api_request',
            'documents',
            'insert',
            NULL,
            NEW.id,
            NEW.cultural_sensitivity_level IN ('sacred', 'ceremonial')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document quality validation
DROP TRIGGER IF EXISTS trigger_validate_document_quality ON documents;
CREATE TRIGGER trigger_validate_document_quality
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION validate_document_quality();

-- Create community validation trigger
CREATE OR REPLACE FUNCTION validate_community_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate name completeness
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
        RAISE EXCEPTION 'Community name cannot be empty';
    END IF;
    
    -- Validate name uniqueness
    IF EXISTS (SELECT 1 FROM communities WHERE name = NEW.name AND id != COALESCE(NEW.id, gen_random_uuid())) THEN
        RAISE EXCEPTION 'Community name must be unique: %', NEW.name;
    END IF;
    
    -- Ensure cultural protocols are set
    IF NEW.cultural_protocols IS NULL THEN
        NEW.cultural_protocols := jsonb_build_object(
            'sacred_content_handling', true,
            'elder_oversight_required', true,
            'data_sovereignty_enabled', true
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for community quality validation
DROP TRIGGER IF EXISTS trigger_validate_community_quality ON communities;
CREATE TRIGGER trigger_validate_community_quality
    BEFORE INSERT OR UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION validate_community_quality();

-- Create user validation trigger
CREATE OR REPLACE FUNCTION validate_user_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format
    IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    
    -- Validate role
    IF NEW.role NOT IN ('member', 'elder', 'admin', 'community_leader') THEN
        RAISE EXCEPTION 'Invalid user role: %', NEW.role;
    END IF;
    
    -- Validate elder status consistency
    IF NEW.is_elder = true AND NEW.role NOT IN ('elder', 'admin', 'community_leader') THEN
        RAISE WARNING 'Elder user should have appropriate role: %', NEW.role;
    END IF;
    
    -- Set cultural preferences if not provided
    IF NEW.cultural_preferences IS NULL THEN
        NEW.cultural_preferences := jsonb_build_object(
            'sacred_content_access', NEW.is_elder,
            'cultural_notifications', true,
            'elder_consultation_preferred', true
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user quality validation
DROP TRIGGER IF EXISTS trigger_validate_user_quality ON users;
CREATE TRIGGER trigger_validate_user_quality
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_quality();

-- Create function to generate data quality reports
CREATE OR REPLACE FUNCTION generate_data_quality_report()
RETURNS TABLE(
    category TEXT,
    metric_name TEXT,
    current_value TEXT,
    status TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Overall data quality metrics
    SELECT 
        'Overall Quality'::TEXT as category,
        'Total Records'::TEXT as metric_name,
        (SELECT COUNT(*)::TEXT FROM documents) as current_value,
        'INFO'::TEXT as status,
        'Monitor document growth trends'::TEXT as recommendation
    
    UNION ALL
    
    SELECT 
        'Cultural Compliance'::TEXT,
        'Sacred Content Documents'::TEXT,
        (SELECT COUNT(*)::TEXT FROM documents WHERE cultural_sensitivity_level IN ('sacred', 'ceremonial')) as current_value,
        'INFO'::TEXT,
        'Ensure proper elder oversight for sacred content'::TEXT
    
    UNION ALL
    
    SELECT 
        'Data Completeness'::TEXT,
        'Documents with Empty Titles'::TEXT,
        (SELECT COUNT(*)::TEXT FROM documents WHERE title IS NULL OR TRIM(title) = '') as current_value,
        CASE WHEN (SELECT COUNT(*) FROM documents WHERE title IS NULL OR TRIM(title) = '') > 0 THEN 'WARNING' ELSE 'OK' END,
        'Review and fix documents with missing titles'::TEXT
    
    UNION ALL
    
    SELECT 
        'Data Integrity'::TEXT,
        'Orphaned Document Chunks'::TEXT,
        (SELECT COUNT(*)::TEXT FROM document_chunks WHERE document_id NOT IN (SELECT id FROM documents)) as current_value,
        CASE WHEN (SELECT COUNT(*) FROM document_chunks WHERE document_id NOT IN (SELECT id FROM documents)) > 0 THEN 'ERROR' ELSE 'OK' END,
        'Clean up orphaned document chunks'::TEXT
    
    UNION ALL
    
    SELECT 
        'User Data Quality'::TEXT,
        'Users with Invalid Emails'::TEXT,
        (SELECT COUNT(*)::TEXT FROM users WHERE email IS NULL OR email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') as current_value,
        CASE WHEN (SELECT COUNT(*) FROM users WHERE email IS NULL OR email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') > 0 THEN 'WARNING' ELSE 'OK' END,
        'Update users with invalid email addresses'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for data quality performance
CREATE INDEX IF NOT EXISTS idx_data_quality_rules_table ON data_quality_rules(target_table, enabled, severity_level);
CREATE INDEX IF NOT EXISTS idx_data_quality_results_batch ON data_quality_results(execution_batch_id, check_status);
CREATE INDEX IF NOT EXISTS idx_data_lineage_source ON data_lineage(source_table, source_record_id, processing_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_lineage_target ON data_lineage(target_table, target_record_id, processing_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_governance_policies_type ON data_governance_policies(policy_type, policy_status);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_table ON data_quality_metrics(table_name, created_at DESC);

SELECT 'Data validation rules and cultural compliance implemented successfully' as status;