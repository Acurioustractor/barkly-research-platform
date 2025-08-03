-- Task 19 Step 1: Database Schema Documentation
-- Comprehensive documentation of the Barkly Research Platform database schema

-- ============================================================================
-- SCHEMA DOCUMENTATION GENERATION
-- ============================================================================

-- Create documentation schema for storing generated docs
CREATE SCHEMA IF NOT EXISTS documentation;

-- Table to store schema documentation
CREATE TABLE IF NOT EXISTS documentation.schema_docs (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    schema_name TEXT NOT NULL DEFAULT 'public',
    description TEXT,
    purpose TEXT,
    relationships JSONB,
    constraints_info JSONB,
    indexes_info JSONB,
    cultural_considerations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to generate comprehensive table documentation
CREATE OR REPLACE FUNCTION documentation.generate_table_docs(
    p_schema_name TEXT DEFAULT 'public'
) RETURNS TABLE(
    table_name TEXT,
    column_info JSONB,
    constraints_info JSONB,
    indexes_info JSONB,
    relationships JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH table_info AS (
        SELECT 
            t.table_name::TEXT,
            json_agg(
                json_build_object(
                    'column_name', c.column_name,
                    'data_type', c.data_type,
                    'is_nullable', c.is_nullable,
                    'column_default', c.column_default,
                    'character_maximum_length', c.character_maximum_length,
                    'ordinal_position', c.ordinal_position
                ) ORDER BY c.ordinal_position
            ) as column_info
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = p_schema_name
        AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name
    ),
    constraint_info AS (
        SELECT 
            tc.table_name::TEXT,
            json_agg(
                json_build_object(
                    'constraint_name', tc.constraint_name,
                    'constraint_type', tc.constraint_type,
                    'column_names', array_agg(kcu.column_name)
                )
            ) as constraints_info
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = p_schema_name
        GROUP BY tc.table_name
    ),
    index_info AS (
        SELECT 
            schemaname||'.'||tablename as table_name,
            json_agg(
                json_build_object(
                    'index_name', indexname,
                    'index_def', indexdef
                )
            ) as indexes_info
        FROM pg_indexes
        WHERE schemaname = p_schema_name
        GROUP BY schemaname||'.'||tablename
    )
    SELECT 
        ti.table_name,
        ti.column_info,
        COALESCE(ci.constraints_info, '[]'::jsonb) as constraints_info,
        COALESCE(ii.indexes_info, '[]'::jsonb) as indexes_info,
        '{}'::jsonb as relationships
    FROM table_info ti
    LEFT JOIN constraint_info ci ON ti.table_name = ci.table_name
    LEFT JOIN index_info ii ON p_schema_name||'.'||ti.table_name = ii.table_name;
END;
$$ LANGUAGE plpgsql;

-- Insert comprehensive documentation for core tables
INSERT INTO documentation.schema_docs (table_name, schema_name, description, purpose, cultural_considerations)
VALUES 
    ('users', 'public', 'Core user management table storing user profiles and authentication data', 
     'Manages user accounts, profiles, and basic authentication information for the research platform',
     'Respects cultural privacy norms and supports diverse naming conventions'),
    
    ('research_projects', 'public', 'Central table for research project management',
     'Stores research project metadata, ownership, collaboration settings, and cultural protocols',
     'Supports indigenous research methodologies and cultural data sovereignty principles'),
    
    ('documents', 'public', 'Document storage and metadata management',
     'Manages research documents, papers, and cultural artifacts with appropriate access controls',
     'Implements cultural sensitivity flags and community-specific access protocols'),
    
    ('collections', 'public', 'Research collection organization system',
     'Organizes research materials into thematic collections with cultural context',
     'Supports traditional knowledge organization systems and cultural categorization'),
    
    ('collaboration_sessions', 'public', 'Real-time collaboration tracking',
     'Manages active collaboration sessions and real-time editing capabilities',
     'Respects cultural protocols around knowledge sharing and collaborative practices'),
    
    ('search_analytics', 'public', 'Search behavior and analytics tracking',
     'Tracks search patterns and usage analytics for platform optimization',
     'Anonymizes data to protect cultural research privacy'),
    
    ('audit_logs', 'public', 'Comprehensive system audit trail',
     'Maintains detailed audit logs for security, compliance, and cultural protocol adherence',
     'Ensures transparency while protecting sensitive cultural information');

-- Generate and store detailed documentation for all tables
DO $$
DECLARE
    doc_record RECORD;
BEGIN
    FOR doc_record IN 
        SELECT * FROM documentation.generate_table_docs('public')
    LOOP
        UPDATE documentation.schema_docs 
        SET 
            relationships = doc_record.relationships,
            constraints_info = doc_record.constraints_info,
            indexes_info = doc_record.indexes_info,
            updated_at = CURRENT_TIMESTAMP
        WHERE table_name = doc_record.table_name;
    END LOOP;
END $$;

-- Create view for easy documentation access
CREATE OR REPLACE VIEW documentation.complete_schema_docs AS
SELECT 
    sd.table_name,
    sd.schema_name,
    sd.description,
    sd.purpose,
    sd.cultural_considerations,
    sd.relationships,
    sd.constraints_info,
    sd.indexes_info,
    td.column_info
FROM documentation.schema_docs sd
LEFT JOIN documentation.generate_table_docs('public') td ON sd.table_name = td.table_name;

-- Function to export documentation as markdown
CREATE OR REPLACE FUNCTION documentation.export_schema_markdown()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    doc_record RECORD;
    col_record RECORD;
BEGIN
    result := result || E'# Barkly Research Platform - Database Schema Documentation\n\n';
    result := result || E'## Overview\n\n';
    result := result || E'This document provides comprehensive documentation for the Barkly Research Platform database schema, ';
    result := result || E'including cultural considerations and indigenous research methodology support.\n\n';
    
    FOR doc_record IN 
        SELECT * FROM documentation.complete_schema_docs ORDER BY table_name
    LOOP
        result := result || E'## Table: ' || doc_record.table_name || E'\n\n';
        result := result || E'**Purpose:** ' || COALESCE(doc_record.purpose, 'Not documented') || E'\n\n';
        result := result || E'**Description:** ' || COALESCE(doc_record.description, 'Not documented') || E'\n\n';
        result := result || E'**Cultural Considerations:** ' || COALESCE(doc_record.cultural_considerations, 'None specified') || E'\n\n';
        
        result := result || E'### Columns\n\n';
        result := result || E'| Column | Type | Nullable | Default | Description |\n';
        result := result || E'|--------|------|----------|---------|-------------|\n';
        
        -- Add column information (simplified for this example)
        result := result || E'| ... | ... | ... | ... | See generated documentation |\n\n';
        
        result := result || E'---\n\n';
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test documentation generation
SELECT 'Schema documentation framework created successfully' as status;
SELECT COUNT(*) as documented_tables FROM documentation.schema_docs;

-- Generate sample markdown export
SELECT LEFT(documentation.export_schema_markdown(), 500) || '...' as sample_markdown;