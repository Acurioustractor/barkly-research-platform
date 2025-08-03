-- =====================================================
-- STEP 7: Audit Logging System
-- =====================================================

-- Create audit log table for tracking all document operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Operation Details
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    
    -- User Context
    user_id UUID,
    community_id UUID,
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Cultural Context
    cultural_sensitivity_level TEXT,
    cultural_protocols_involved BOOLEAN DEFAULT false,
    elder_oversight_required BOOLEAN DEFAULT false,
    
    -- System Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT audit_log_operation_check CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON audit_log(table_name, operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_community ON audit_log(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(table_name, record_id, created_at DESC);

-- Create data access log for tracking document access
CREATE TABLE IF NOT EXISTS data_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Access Details
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'DOWNLOAD', 'UPLOAD', 'SHARE', 'EXPORT')),
    record_id UUID,
    
    -- User Context
    user_id UUID,
    community_id UUID,
    
    -- Access Context
    access_method TEXT, -- 'web', 'api', 'mobile', etc.
    access_reason TEXT,
    cultural_justification TEXT,
    
    -- Cultural Compliance
    cultural_sensitivity_level TEXT,
    elder_approval_obtained BOOLEAN DEFAULT false,
    cultural_protocols_followed JSONB DEFAULT '{}',
    
    -- Technical Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Additional Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for data access log
CREATE INDEX IF NOT EXISTS idx_data_access_table_operation ON data_access_log(table_name, operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_user ON data_access_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_community ON data_access_log(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_cultural ON data_access_log(cultural_sensitivity_level, created_at DESC);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB;
    new_values JSONB;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    community_id_val UUID;
    cultural_level TEXT;
BEGIN
    -- Determine community_id and cultural sensitivity
    IF TG_OP = 'DELETE' THEN
        old_values := to_jsonb(OLD);
        community_id_val := COALESCE(OLD.community_id, NULL);
        cultural_level := COALESCE(OLD.cultural_sensitivity_level, 'standard');
    ELSE
        new_values := to_jsonb(NEW);
        community_id_val := COALESCE(NEW.community_id, NULL);
        cultural_level := COALESCE(NEW.cultural_sensitivity_level, 'standard');
        
        IF TG_OP = 'UPDATE' THEN
            old_values := to_jsonb(OLD);
            
            -- Find changed fields
            FOR field_name IN SELECT jsonb_object_keys(new_values)
            LOOP
                IF old_values->field_name IS DISTINCT FROM new_values->field_name THEN
                    changed_fields := array_append(changed_fields, field_name);
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_log (
        table_name,
        operation,
        record_id,
        community_id,
        old_values,
        new_values,
        changed_fields,
        cultural_sensitivity_level,
        cultural_protocols_involved,
        elder_oversight_required
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        community_id_val,
        old_values,
        new_values,
        changed_fields,
        cultural_level,
        cultural_level IN ('sacred', 'ceremonial'),
        cultural_level IN ('sacred', 'ceremonial')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log data access
CREATE OR REPLACE FUNCTION log_data_access(
    p_table_name TEXT,
    p_operation TEXT,
    p_record_id UUID,
    p_community_id UUID,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO data_access_log (
        table_name,
        operation,
        record_id,
        community_id,
        metadata
    ) VALUES (
        p_table_name,
        p_operation,
        p_record_id,
        p_community_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to all document management tables
DROP TRIGGER IF EXISTS documents_audit_trigger ON documents;
CREATE TRIGGER documents_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_collections_audit_trigger ON document_collections;
CREATE TRIGGER document_collections_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_collections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_collection_items_audit_trigger ON document_collection_items;
CREATE TRIGGER document_collection_items_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_collection_items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_tags_audit_trigger ON document_tags;
CREATE TRIGGER document_tags_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_tags
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_tag_assignments_audit_trigger ON document_tag_assignments;
CREATE TRIGGER document_tag_assignments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_tag_assignments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_relationships_audit_trigger ON document_relationships;
CREATE TRIGGER document_relationships_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_relationships
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_versions_audit_trigger ON document_versions;
CREATE TRIGGER document_versions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS document_collections_updated_at ON document_collections;
CREATE TRIGGER document_collections_updated_at
    BEFORE UPDATE ON document_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Audit logging system created successfully' as status;