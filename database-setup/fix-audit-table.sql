-- Fix audit log table creation
DROP TABLE IF EXISTS audit_log CASCADE;

-- Create audit log table for tracking all document operations
CREATE TABLE audit_log (
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_table_operation ON audit_log(table_name, operation, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_community ON audit_log(community_id, created_at DESC);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id, created_at DESC);

SELECT 'Audit log table fixed successfully' as status;