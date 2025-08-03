-- =====================================================
-- TASK 16 - STEP 2: GraphQL and REST API Implementation
-- Database Functions for API Operations with Cultural Context
-- =====================================================

-- Create API schema definitions table
CREATE TABLE IF NOT EXISTS api_schema_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schema Information
    schema_name TEXT NOT NULL UNIQUE,
    schema_type TEXT NOT NULL
        CHECK (schema_type IN ('graphql', 'openapi', 'json_schema', 'protobuf')),
    schema_version TEXT NOT NULL,
    
    -- Schema Content
    schema_definition JSONB NOT NULL,
    schema_description TEXT,
    
    -- Cultural Context
    includes_sacred_types BOOLEAN DEFAULT false,
    cultural_access_controls JSONB DEFAULT '{}',
    elder_review_required BOOLEAN DEFAULT false,
    
    -- Validation
    schema_valid BOOLEAN DEFAULT true,
    validation_errors JSONB DEFAULT '{}',
    last_validated TIMESTAMPTZ,
    
    -- Status
    schema_status TEXT DEFAULT 'active'
        CHECK (schema_status IN ('active', 'deprecated', 'draft', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API resolvers table for GraphQL
CREATE TABLE IF NOT EXISTS api_resolvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Resolver Information
    resolver_name TEXT NOT NULL,
    resolver_type TEXT NOT NULL
        CHECK (resolver_type IN ('query', 'mutation', 'subscription', 'field')),
    parent_type TEXT,
    field_name TEXT,
    
    -- Implementation
    database_function TEXT NOT NULL,
    resolver_logic JSONB DEFAULT '{}',
    
    -- Cultural Context
    accesses_sacred_data BOOLEAN DEFAULT false,
    requires_elder_permission BOOLEAN DEFAULT false,
    community_scoped BOOLEAN DEFAULT true,
    cultural_validation_function TEXT,
    
    -- Performance
    caching_enabled BOOLEAN DEFAULT false,
    cache_ttl_seconds INTEGER DEFAULT 300,
    complexity_score INTEGER DEFAULT 1,
    max_depth INTEGER DEFAULT 10,
    
    -- Security
    authentication_required BOOLEAN DEFAULT true,
    required_roles TEXT[] DEFAULT '{}',
    rate_limit_override INTEGER,
    
    -- Status
    resolver_status TEXT DEFAULT 'active'
        CHECK (resolver_status IN ('active', 'deprecated', 'disabled')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resolver_name, parent_type, field_name)
);

-- =====================================================
-- DOCUMENT API FUNCTIONS
-- =====================================================

-- Function to get documents with cultural filtering
CREATE OR REPLACE FUNCTION api_get_documents(
    p_user_id UUID,
    p_community_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_include_sacred BOOLEAN DEFAULT false
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    content TEXT,
    file_type TEXT,
    file_size BIGINT,
    cultural_sensitivity_level TEXT,
    community_id UUID,
    community_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    can_access BOOLEAN,
    access_reason TEXT
) AS $$
DECLARE
    user_role TEXT;
    user_is_elder BOOLEAN := false;
BEGIN
    -- Get user information
    SELECT role, is_elder INTO user_role, user_is_elder
    FROM users 
    WHERE id = p_user_id;
    
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        CASE 
            WHEN d.cultural_sensitivity_level IN ('sacred', 'ceremonial') AND NOT user_is_elder THEN '[Sacred Content - Access Restricted]'
            ELSE d.content
        END as content,
        d.file_type,
        d.file_size,
        d.cultural_sensitivity_level,
        d.community_id,
        c.name as community_name,
        d.created_at,
        d.updated_at,
        CASE 
            WHEN d.cultural_sensitivity_level IN ('sacred', 'ceremonial') AND NOT user_is_elder THEN false
            WHEN p_community_id IS NOT NULL AND d.community_id != p_community_id THEN false
            ELSE true
        END as can_access,
        CASE 
            WHEN d.cultural_sensitivity_level IN ('sacred', 'ceremonial') AND NOT user_is_elder THEN 'Elder permission required'
            WHEN p_community_id IS NOT NULL AND d.community_id != p_community_id THEN 'Community access restricted'
            ELSE 'Access granted'
        END as access_reason
    FROM documents d
    JOIN communities c ON d.community_id = c.id
    WHERE (p_community_id IS NULL OR d.community_id = p_community_id)
    AND (NOT p_include_sacred OR d.cultural_sensitivity_level NOT IN ('sacred', 'ceremonial') OR user_is_elder)
    ORDER BY d.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create document via API
CREATE OR REPLACE FUNCTION api_create_document(
    p_user_id UUID,
    p_title TEXT,
    p_content TEXT,
    p_file_type TEXT,
    p_community_id UUID,
    p_cultural_sensitivity_level TEXT DEFAULT 'standard'
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    created_at TIMESTAMPTZ,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    new_document_id UUID;
    user_role TEXT;
    user_is_elder BOOLEAN := false;
    can_create_sacred BOOLEAN := false;
BEGIN
    -- Get user information
    SELECT role, is_elder INTO user_role, user_is_elder
    FROM users 
    WHERE id = p_user_id;
    
    -- Check if user can create sacred content
    can_create_sacred := user_is_elder OR user_role IN ('admin', 'community_leader');
    
    -- Validate cultural sensitivity level
    IF p_cultural_sensitivity_level IN ('sacred', 'ceremonial') AND NOT can_create_sacred THEN
        RETURN QUERY SELECT 
            NULL::UUID, 
            p_title, 
            NOW(), 
            false, 
            'Elder permission required to create sacred content'::TEXT;
        RETURN;
    END IF;
    
    -- Create the document
    INSERT INTO documents (
        title,
        content,
        file_type,
        community_id,
        cultural_sensitivity_level,
        created_by,
        file_size
    ) VALUES (
        p_title,
        p_content,
        p_file_type,
        p_community_id,
        p_cultural_sensitivity_level,
        p_user_id,
        length(p_content)
    ) RETURNING documents.id INTO new_document_id;
    
    RETURN QUERY SELECT 
        new_document_id, 
        p_title, 
        NOW(), 
        true, 
        'Document created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update document via API
CREATE OR REPLACE FUNCTION api_update_document(
    p_user_id UUID,
    p_document_id UUID,
    p_title TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_cultural_sensitivity_level TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    updated_at TIMESTAMPTZ,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    doc_record RECORD;
    user_role TEXT;
    user_is_elder BOOLEAN := false;
    can_modify BOOLEAN := false;
BEGIN
    -- Get user information
    SELECT role, is_elder INTO user_role, user_is_elder
    FROM users 
    WHERE id = p_user_id;
    
    -- Get document information
    SELECT * INTO doc_record
    FROM documents 
    WHERE id = p_document_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            p_document_id, 
            ''::TEXT, 
            NOW(), 
            false, 
            'Document not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check permissions
    can_modify := (
        doc_record.created_by = p_user_id OR 
        user_role IN ('admin', 'community_leader') OR
        (doc_record.cultural_sensitivity_level NOT IN ('sacred', 'ceremonial')) OR
        user_is_elder
    );
    
    IF NOT can_modify THEN
        RETURN QUERY SELECT 
            p_document_id, 
            doc_record.title, 
            NOW(), 
            false, 
            'Insufficient permissions to modify this document'::TEXT;
        RETURN;
    END IF;
    
    -- Update the document
    UPDATE documents 
    SET title = COALESCE(p_title, title),
        content = COALESCE(p_content, content),
        cultural_sensitivity_level = COALESCE(p_cultural_sensitivity_level, cultural_sensitivity_level),
        file_size = CASE WHEN p_content IS NOT NULL THEN length(p_content) ELSE file_size END,
        updated_at = NOW()
    WHERE id = p_document_id;
    
    RETURN QUERY SELECT 
        p_document_id, 
        COALESCE(p_title, doc_record.title), 
        NOW(), 
        true, 
        'Document updated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEARCH API FUNCTIONS
-- =====================================================

-- Function to search documents via API
CREATE OR REPLACE FUNCTION api_search_documents(
    p_user_id UUID,
    p_query TEXT,
    p_community_id UUID DEFAULT NULL,
    p_cultural_filter TEXT DEFAULT 'standard',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    content_snippet TEXT,
    cultural_sensitivity_level TEXT,
    community_name TEXT,
    relevance_score REAL,
    created_at TIMESTAMPTZ,
    can_access BOOLEAN
) AS $$
DECLARE
    user_role TEXT;
    user_is_elder BOOLEAN := false;
    search_query tsquery;
BEGIN
    -- Get user information
    SELECT role, is_elder INTO user_role, user_is_elder
    FROM users 
    WHERE id = p_user_id;
    
    -- Create search query
    search_query := plainto_tsquery('english', p_query);
    
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        ts_headline('english', d.content, search_query, 'MaxWords=20, MinWords=5') as content_snippet,
        d.cultural_sensitivity_level,
        c.name as community_name,
        ts_rank(d.search_vector, search_query) as relevance_score,
        d.created_at,
        CASE 
            WHEN d.cultural_sensitivity_level IN ('sacred', 'ceremonial') AND NOT user_is_elder THEN false
            WHEN p_community_id IS NOT NULL AND d.community_id != p_community_id THEN false
            ELSE true
        END as can_access
    FROM documents d
    JOIN communities c ON d.community_id = c.id
    WHERE d.search_vector @@ search_query
    AND (p_community_id IS NULL OR d.community_id = p_community_id)
    AND (
        p_cultural_filter = 'all' OR
        (p_cultural_filter = 'standard' AND d.cultural_sensitivity_level = 'standard') OR
        (p_cultural_filter = 'sensitive' AND d.cultural_sensitivity_level IN ('standard', 'sensitive')) OR
        (p_cultural_filter = 'sacred' AND user_is_elder)
    )
    ORDER BY relevance_score DESC, d.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMUNITY API FUNCTIONS
-- =====================================================

-- Function to get communities via API
CREATE OR REPLACE FUNCTION api_get_communities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    location TEXT,
    cultural_protocols JSONB,
    member_count BIGINT,
    document_count BIGINT,
    can_access BOOLEAN,
    user_role TEXT
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get user information
    SELECT * INTO user_record
    FROM users 
    WHERE id = p_user_id;
    
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.location,
        CASE 
            WHEN user_record.is_elder OR user_record.role IN ('admin', 'community_leader') THEN c.cultural_protocols
            ELSE '{}'::JSONB
        END as cultural_protocols,
        (SELECT COUNT(*) FROM users u WHERE u.community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM documents d WHERE d.community_id = c.id) as document_count,
        true as can_access, -- Basic community info is generally accessible
        COALESCE(user_record.role, 'member') as user_role
    FROM communities c
    WHERE c.is_active = true
    ORDER BY c.name
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER API FUNCTIONS
-- =====================================================

-- Function to get user profile via API
CREATE OR REPLACE FUNCTION api_get_user_profile(
    p_requesting_user_id UUID,
    p_target_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_elder BOOLEAN,
    community_id UUID,
    community_name TEXT,
    cultural_preferences JSONB,
    created_at TIMESTAMPTZ,
    can_view_full_profile BOOLEAN
) AS $$
DECLARE
    requesting_user RECORD;
    target_user RECORD;
    can_view_full BOOLEAN := false;
    effective_target_id UUID;
BEGIN
    -- Default to requesting user's own profile
    effective_target_id := COALESCE(p_target_user_id, p_requesting_user_id);
    
    -- Get requesting user information
    SELECT * INTO requesting_user
    FROM users 
    WHERE id = p_requesting_user_id;
    
    -- Get target user information
    SELECT * INTO target_user
    FROM users 
    WHERE id = effective_target_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Determine if full profile can be viewed
    can_view_full := (
        p_requesting_user_id = effective_target_id OR -- Own profile
        requesting_user.role IN ('admin', 'community_leader') OR -- Admin access
        requesting_user.is_elder OR -- Elder access
        requesting_user.community_id = target_user.community_id -- Same community
    );
    
    RETURN QUERY
    SELECT 
        target_user.id,
        CASE WHEN can_view_full THEN target_user.email ELSE '[Private]' END as email,
        target_user.full_name,
        target_user.role,
        target_user.is_elder,
        target_user.community_id,
        c.name as community_name,
        CASE WHEN can_view_full THEN target_user.cultural_preferences ELSE '{}'::JSONB END as cultural_preferences,
        target_user.created_at,
        can_view_full
    FROM users u
    LEFT JOIN communities c ON u.community_id = c.id
    WHERE u.id = effective_target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ANALYTICS API FUNCTIONS
-- =====================================================

-- Function to get community analytics via API
CREATE OR REPLACE FUNCTION api_get_community_analytics(
    p_user_id UUID,
    p_community_id UUID,
    p_time_period TEXT DEFAULT 'month'
)
RETURNS TABLE(
    metric_name TEXT,
    metric_value BIGINT,
    metric_change DECIMAL(5,2),
    time_period TEXT,
    can_access BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
    can_access_analytics BOOLEAN := false;
    period_start TIMESTAMPTZ;
    prev_period_start TIMESTAMPTZ;
    current_docs BIGINT;
    prev_docs BIGINT;
    current_users BIGINT;
    prev_users BIGINT;
BEGIN
    -- Get user information
    SELECT * INTO user_record
    FROM users 
    WHERE id = p_user_id;
    
    -- Check analytics access
    can_access_analytics := (
        user_record.role IN ('admin', 'community_leader') OR
        user_record.is_elder OR
        user_record.community_id = p_community_id
    );
    
    IF NOT can_access_analytics THEN
        RETURN QUERY SELECT 'access_denied'::TEXT, 0::BIGINT, 0::DECIMAL, p_time_period, false;
        RETURN;
    END IF;
    
    -- Calculate time periods
    CASE p_time_period
        WHEN 'week' THEN
            period_start := date_trunc('week', NOW());
            prev_period_start := period_start - INTERVAL '1 week';
        WHEN 'month' THEN
            period_start := date_trunc('month', NOW());
            prev_period_start := period_start - INTERVAL '1 month';
        WHEN 'year' THEN
            period_start := date_trunc('year', NOW());
            prev_period_start := period_start - INTERVAL '1 year';
        ELSE
            period_start := date_trunc('month', NOW());
            prev_period_start := period_start - INTERVAL '1 month';
    END CASE;
    
    -- Get current period metrics
    SELECT COUNT(*) INTO current_docs
    FROM documents 
    WHERE community_id = p_community_id 
    AND created_at >= period_start;
    
    SELECT COUNT(*) INTO current_users
    FROM users 
    WHERE community_id = p_community_id 
    AND created_at >= period_start;
    
    -- Get previous period metrics
    SELECT COUNT(*) INTO prev_docs
    FROM documents 
    WHERE community_id = p_community_id 
    AND created_at >= prev_period_start 
    AND created_at < period_start;
    
    SELECT COUNT(*) INTO prev_users
    FROM users 
    WHERE community_id = p_community_id 
    AND created_at >= prev_period_start 
    AND created_at < period_start;
    
    -- Return metrics
    RETURN QUERY
    SELECT 'documents_created'::TEXT, current_docs, 
           CASE WHEN prev_docs > 0 THEN ((current_docs - prev_docs)::DECIMAL / prev_docs * 100) ELSE 0 END,
           p_time_period, true
    UNION ALL
    SELECT 'users_joined'::TEXT, current_users,
           CASE WHEN prev_users > 0 THEN ((current_users - prev_users)::DECIMAL / prev_users * 100) ELSE 0 END,
           p_time_period, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP DEFAULT API CONFIGURATIONS
-- =====================================================

-- Create default API configurations
DO $$
DECLARE
    graphql_api_id UUID;
    rest_api_id UUID;
    endpoint_id UUID;
BEGIN
    -- Create GraphQL API configuration
    SELECT create_api_configuration(
        'barkly_graphql_api',
        'graphql',
        'v1.0',
        '/graphql',
        true -- Supports sacred content
    ) INTO graphql_api_id;
    
    -- Create REST API configuration
    SELECT create_api_configuration(
        'barkly_rest_api',
        'rest',
        'v1.0',
        '/api/v1',
        true -- Supports sacred content
    ) INTO rest_api_id;
    
    -- Create document endpoints
    SELECT create_api_endpoint(
        rest_api_id,
        '/documents',
        'GET',
        'List Documents',
        'api_get_documents',
        false,
        ARRAY['member', 'elder', 'admin']
    ) INTO endpoint_id;
    
    SELECT create_api_endpoint(
        rest_api_id,
        '/documents',
        'POST',
        'Create Document',
        'api_create_document',
        false,
        ARRAY['member', 'elder', 'admin']
    ) INTO endpoint_id;
    
    SELECT create_api_endpoint(
        rest_api_id,
        '/documents/{id}',
        'PUT',
        'Update Document',
        'api_update_document',
        false,
        ARRAY['member', 'elder', 'admin']
    ) INTO endpoint_id;
    
    -- Create search endpoint
    SELECT create_api_endpoint(
        rest_api_id,
        '/search/documents',
        'GET',
        'Search Documents',
        'api_search_documents',
        false,
        ARRAY['member', 'elder', 'admin']
    ) INTO endpoint_id;
    
    -- Create community endpoints
    SELECT create_api_endpoint(
        rest_api_id,
        '/communities',
        'GET',
        'List Communities',
        'api_get_communities',
        false,
        ARRAY['member', 'elder', 'admin']
    ) INTO endpoint_id;
    
    -- Create user endpoints
    SELECT create_api_endpoint(
        rest_api_id,
        '/users/profile',
        'GET',
        'Get User Profile',
        'api_get_user_profile',
        false,
        ARRAY['member', 'elder', 'admin']
    ) INTO endpoint_id;
    
    -- Create analytics endpoint
    SELECT create_api_endpoint(
        rest_api_id,
        '/analytics/community/{id}',
        'GET',
        'Community Analytics',
        'api_get_community_analytics',
        false,
        ARRAY['elder', 'admin', 'community_leader']
    ) INTO endpoint_id;
    
    RAISE NOTICE 'Created default API configurations and endpoints';
END;
$$;

-- =====================================================
-- PERFORMANCE INDEXES FOR API FUNCTIONS
-- =====================================================

-- API schema definitions indexes
CREATE INDEX IF NOT EXISTS idx_api_schema_type_status ON api_schema_definitions(schema_type, schema_status);
CREATE INDEX IF NOT EXISTS idx_api_schema_cultural ON api_schema_definitions(includes_sacred_types, elder_review_required);

-- API resolvers indexes
CREATE INDEX IF NOT EXISTS idx_api_resolvers_type ON api_resolvers(resolver_type, resolver_status);
CREATE INDEX IF NOT EXISTS idx_api_resolvers_function ON api_resolvers(database_function, resolver_status);
CREATE INDEX IF NOT EXISTS idx_api_resolvers_cultural ON api_resolvers(accesses_sacred_data, requires_elder_permission);

SELECT 'GraphQL and REST API implementation completed successfully' as status;