-- Task 19 Step 2: API Documentation and Examples
-- Comprehensive API documentation with examples and cultural protocol guidance

-- ============================================================================
-- API DOCUMENTATION FRAMEWORK
-- ============================================================================

-- Create API documentation storage
CREATE TABLE IF NOT EXISTS documentation.api_endpoints (
    id SERIAL PRIMARY KEY,
    endpoint_path TEXT NOT NULL,
    http_method TEXT NOT NULL,
    description TEXT,
    purpose TEXT,
    parameters JSONB,
    request_example JSONB,
    response_example JSONB,
    cultural_protocols TEXT,
    authentication_required BOOLEAN DEFAULT true,
    rate_limits JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert comprehensive API documentation
INSERT INTO documentation.api_endpoints (
    endpoint_path, http_method, description, purpose, parameters, 
    request_example, response_example, cultural_protocols, authentication_required, rate_limits
) VALUES 

-- User Management APIs
('/api/users', 'GET', 'Retrieve user profiles with cultural privacy controls', 
 'List users while respecting cultural visibility preferences',
 '{"query_params": ["page", "limit", "cultural_filter", "visibility_level"]}',
 '{"page": 1, "limit": 20, "cultural_filter": "public", "visibility_level": "community"}',
 '{"users": [{"id": 1, "name": "[name]", "cultural_affiliation": "visible_to_community", "research_interests": ["topic1"]}], "total": 150, "page": 1}',
 'Respects indigenous privacy protocols and community visibility preferences',
 true,
 '{"requests_per_minute": 60, "burst_limit": 100}'
),

('/api/users/{id}', 'GET', 'Get specific user profile with cultural context',
 'Retrieve detailed user information respecting cultural sharing protocols',
 '{"path_params": ["id"], "query_params": ["include_cultural_context", "requester_relationship"]}',
 '{"include_cultural_context": true, "requester_relationship": "community_member"}',
 '{"id": 1, "profile": {"name": "[name]", "cultural_protocols": {"sharing_level": "community"}}, "research_focus": "traditional_knowledge"}',
 'Information shared based on cultural protocols and relationship to requester',
 true,
 '{"requests_per_minute": 120, "burst_limit": 200}'
),

-- Research Project APIs
('/api/projects', 'POST', 'Create new research project with cultural protocols',
 'Initialize research project with appropriate cultural safeguards and protocols',
 '{"body_params": ["title", "description", "cultural_protocols", "collaboration_settings", "access_level"]}',
 '{"title": "Traditional Knowledge Study", "description": "Research project description", "cultural_protocols": {"requires_elder_approval": true, "community_review": true}, "access_level": "community_restricted"}',
 '{"id": 123, "title": "Traditional Knowledge Study", "status": "pending_cultural_review", "protocols_applied": ["elder_approval", "community_review"]}',
 'All projects must specify cultural protocols and undergo appropriate community review processes',
 true,
 '{"requests_per_minute": 30, "burst_limit": 50}'
),

('/api/projects/{id}/collaborate', 'POST', 'Initiate collaboration with cultural consent',
 'Start collaborative research session with proper cultural permissions and protocols',
 '{"path_params": ["id"], "body_params": ["collaborator_ids", "cultural_permissions", "session_type"]}',
 '{"collaborator_ids": [2, 3], "cultural_permissions": {"knowledge_sharing_approved": true, "elder_present": true}, "session_type": "traditional_knowledge_review"}',
 '{"session_id": "sess_456", "status": "active", "cultural_compliance": "verified", "participants": [{"id": 2, "role": "knowledge_keeper"}]}',
 'Collaboration requires explicit cultural permissions and may need elder or community representative presence',
 true,
 '{"requests_per_minute": 20, "burst_limit": 30}'
),

-- Document Management APIs
('/api/documents', 'POST', 'Upload document with cultural sensitivity tagging',
 'Upload research documents with appropriate cultural metadata and access controls',
 '{"body_params": ["file", "title", "cultural_sensitivity", "access_permissions", "community_tags"]}',
 '{"title": "Research Document", "cultural_sensitivity": "high", "access_permissions": {"community_only": true, "elder_review_required": true}, "community_tags": ["traditional_knowledge", "sacred_sites"]}',
 '{"id": 789, "title": "Research Document", "status": "pending_cultural_review", "access_level": "community_restricted", "review_required": true}',
 'Documents with cultural content require community review and appropriate access restrictions',
 true,
 '{"requests_per_minute": 15, "burst_limit": 25}'
),

('/api/documents/{id}/access', 'GET', 'Check document access with cultural protocols',
 'Verify user access to document based on cultural protocols and permissions',
 '{"path_params": ["id"], "query_params": ["requester_cultural_affiliation", "purpose"]}',
 '{"requester_cultural_affiliation": "community_member", "purpose": "academic_research"}',
 '{"access_granted": true, "conditions": ["elder_notification_sent", "usage_tracking_enabled"], "cultural_protocols": ["attribution_required", "no_commercial_use"]}',
 'Access determined by cultural affiliation, purpose, and community-defined protocols',
 true,
 '{"requests_per_minute": 100, "burst_limit": 150}'
),

-- Search APIs
('/api/search', 'GET', 'Search with cultural filtering and context',
 'Perform searches while respecting cultural visibility and access protocols',
 '{"query_params": ["q", "cultural_filter", "community_scope", "sensitivity_level"]}',
 '{"q": "traditional medicine", "cultural_filter": "community_accessible", "community_scope": "local", "sensitivity_level": "public"}',
 '{"results": [{"id": 1, "title": "Public Research", "cultural_context": "community_approved", "access_level": "public"}], "total": 25, "cultural_filters_applied": ["sensitivity_check", "community_scope"]}',
 'Search results filtered based on cultural protocols and user permissions',
 true,
 '{"requests_per_minute": 200, "burst_limit": 300}'
),

-- Analytics APIs (Privacy-Focused)
('/api/analytics/usage', 'GET', 'Get anonymized usage analytics',
 'Retrieve platform usage statistics with cultural privacy protections',
 '{"query_params": ["date_range", "anonymization_level", "community_scope"]}',
 '{"date_range": "last_30_days", "anonymization_level": "high", "community_scope": "aggregate_only"}',
 '{"usage_stats": {"total_searches": 1500, "document_uploads": 45, "collaboration_sessions": 23}, "privacy_level": "fully_anonymized", "cultural_data_excluded": true}',
 'All analytics are anonymized and exclude culturally sensitive data patterns',
 true,
 '{"requests_per_minute": 30, "burst_limit": 50}'
);

-- Create API documentation export function
CREATE OR REPLACE FUNCTION documentation.export_api_docs()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    api_record RECORD;
BEGIN
    result := result || E'# Barkly Research Platform - API Documentation\n\n';
    result := result || E'## Overview\n\n';
    result := result || E'This API documentation includes cultural protocol guidance and indigenous research methodology support.\n\n';
    result := result || E'## Authentication\n\n';
    result := result || E'All endpoints require authentication unless specified. Cultural protocols may impose additional access restrictions.\n\n';
    
    FOR api_record IN 
        SELECT * FROM documentation.api_endpoints ORDER BY endpoint_path, http_method
    LOOP
        result := result || E'## ' || api_record.http_method || ' ' || api_record.endpoint_path || E'\n\n';
        result := result || E'**Purpose:** ' || COALESCE(api_record.purpose, 'Not documented') || E'\n\n';
        result := result || E'**Description:** ' || COALESCE(api_record.description, 'Not documented') || E'\n\n';
        result := result || E'**Cultural Protocols:** ' || COALESCE(api_record.cultural_protocols, 'Standard protocols apply') || E'\n\n';
        
        result := result || E'### Request Example\n\n';
        result := result || E'```json\n' || COALESCE(api_record.request_example::text, '{}') || E'\n```\n\n';
        
        result := result || E'### Response Example\n\n';
        result := result || E'```json\n' || COALESCE(api_record.response_example::text, '{}') || E'\n```\n\n';
        
        result := result || E'### Rate Limits\n\n';
        result := result || COALESCE(api_record.rate_limits::text, 'Standard rate limits apply') || E'\n\n';
        
        result := result || E'---\n\n';
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create GraphQL schema documentation
CREATE TABLE IF NOT EXISTS documentation.graphql_schema (
    id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL,
    type_kind TEXT NOT NULL, -- Query, Mutation, Type, Input, etc.
    description TEXT,
    fields JSONB,
    cultural_considerations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert GraphQL schema documentation
INSERT INTO documentation.graphql_schema (type_name, type_kind, description, fields, cultural_considerations) VALUES
('Query', 'Query', 'Root query type with cultural protocol enforcement',
 '{"users": {"type": "[User]", "args": {"culturalFilter": "CulturalFilter"}, "description": "Get users with cultural filtering"}, "projects": {"type": "[Project]", "args": {"accessLevel": "AccessLevel"}, "description": "Get projects based on access permissions"}}',
 'All queries respect cultural visibility and access protocols'),

('User', 'Type', 'User profile with cultural context',
 '{"id": {"type": "ID!"}, "name": {"type": "String", "cultural_note": "May be restricted based on privacy protocols"}, "culturalAffiliation": {"type": "String"}, "researchInterests": {"type": "[String]"}}',
 'User data visibility controlled by cultural sharing preferences'),

('Project', 'Type', 'Research project with cultural protocols',
 '{"id": {"type": "ID!"}, "title": {"type": "String!"}, "culturalProtocols": {"type": "CulturalProtocols"}, "accessLevel": {"type": "AccessLevel!"}, "collaborators": {"type": "[User]"}}',
 'Project access and collaboration governed by cultural protocols');

-- Test API documentation
SELECT 'API documentation framework created successfully' as status;
SELECT COUNT(*) as documented_endpoints FROM documentation.api_endpoints;

-- Generate sample API documentation
SELECT LEFT(documentation.export_api_docs(), 1000) || '...' as sample_api_docs;