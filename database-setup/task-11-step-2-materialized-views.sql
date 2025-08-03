-- =====================================================
-- TASK 11 - STEP 2: Materialized Views for Analytics
-- High-Performance Analytics and Reporting Views
-- =====================================================

-- Create materialized view for community analytics dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_community_analytics AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    c.slug as community_slug,
    
    -- Document Statistics
    COUNT(DISTINCT d.id) as total_documents,
    COUNT(DISTINCT d.id) FILTER (WHERE d.cultural_sensitivity_level = 'sacred') as sacred_documents,
    COUNT(DISTINCT d.id) FILTER (WHERE d.cultural_sensitivity_level = 'ceremonial') as ceremonial_documents,
    COUNT(DISTINCT d.id) FILTER (WHERE d.requires_elder_approval = true) as documents_needing_approval,
    COUNT(DISTINCT d.id) FILTER (WHERE d.processing_status = 'completed') as processed_documents,
    
    -- Research Statistics
    COUNT(DISTINCT rp.id) as total_projects,
    COUNT(DISTINCT rp.id) FILTER (WHERE rp.status = 'active') as active_projects,
    COUNT(DISTINCT rp.id) FILTER (WHERE rp.traditional_knowledge_involved = true) as traditional_knowledge_projects,
    COUNT(DISTINCT rc.id) as total_collections,
    
    -- Collaboration Statistics
    COUNT(DISTINCT rcol.id) as total_collaborations,
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.elder_status = true) as elder_collaborators,
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.status = 'active') as active_collaborators,
    
    -- Content Analysis Statistics
    COUNT(DISTINCT dt.id) as total_themes,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.cultural_significance = 'sacred') as sacred_themes,
    COUNT(DISTINCT dq.id) as total_quotes,
    COUNT(DISTINCT dq.id) FILTER (WHERE dq.contains_sacred_content = true) as sacred_quotes,
    
    -- Activity Statistics
    COUNT(DISTINCT af.id) as total_activities,
    COUNT(DISTINCT dc.id) as total_chunks,
    COUNT(DISTINCT dcom.id) as total_comments,
    
    -- Cultural Compliance Statistics
    COUNT(DISTINCT d.id) FILTER (WHERE d.cultural_sensitivity_level IN ('sacred', 'ceremonial')) as cultural_content_count,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.requires_elder_review = true AND dt.elder_reviewed = false) as pending_elder_reviews,
    
    -- Engagement Statistics
    COALESCE(AVG(dcom.reply_count), 0) as avg_comment_replies,
    COALESCE(MAX(d.created_at), '1970-01-01'::timestamptz) as last_document_upload,
    COALESCE(MAX(af.created_at), '1970-01-01'::timestamptz) as last_activity,
    
    -- System Metadata
    NOW() as last_refreshed
FROM communities c
LEFT JOIN documents d ON d.community_id = c.id
LEFT JOIN research_projects rp ON rp.community_id = c.id
LEFT JOIN research_collections rc ON rc.community_id = c.id
LEFT JOIN research_collaborations rcol ON rcol.research_project_id = rp.id
LEFT JOIN document_themes dt ON dt.community_id = c.id
LEFT JOIN document_quotes dq ON dq.community_id = c.id
LEFT JOIN activity_feed af ON af.community_id = c.id
LEFT JOIN document_chunks dc ON dc.community_id = c.id
LEFT JOIN document_comments dcom ON dcom.community_id = c.id
GROUP BY c.id, c.name, c.slug;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_community_analytics_id ON mv_community_analytics(community_id);

-- Create materialized view for document analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_document_analytics AS
SELECT 
    d.id as document_id,
    d.title,
    d.filename,
    d.community_id,
    d.cultural_sensitivity_level,
    d.document_type,
    d.processing_status,
    d.created_at,
    
    -- Content Statistics
    d.file_size,
    COALESCE(d.word_count, 0) as word_count,
    COALESCE(d.page_count, 0) as page_count,
    
    -- Chunking Statistics
    COUNT(DISTINCT dc.id) as total_chunks,
    COUNT(DISTINCT dc.id) FILTER (WHERE dc.processing_status = 'completed') as processed_chunks,
    COUNT(DISTINCT dc.id) FILTER (WHERE dc.cultural_sensitivity_level = 'sacred') as sacred_chunks,
    
    -- Analysis Statistics
    COUNT(DISTINCT dt.id) as total_themes,
    COUNT(DISTINCT dq.id) as total_quotes,
    COALESCE(AVG(dt.confidence_score), 0) as avg_theme_confidence,
    COALESCE(AVG(dq.significance_score), 0) as avg_quote_significance,
    
    -- Engagement Statistics
    COUNT(DISTINCT dcom.id) as total_comments,
    COUNT(DISTINCT dcom.id) FILTER (WHERE dcom.comment_type = 'cultural_note') as cultural_comments,
    COUNT(DISTINCT ca.id) as total_annotations,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.cultural_annotation = true) as cultural_annotations,
    
    -- Collection Membership
    COUNT(DISTINCT cd.collection_id) as collection_memberships,
    
    -- Cultural Context
    d.requires_elder_approval,
    d.traditional_knowledge_category IS NOT NULL as has_traditional_knowledge,
    
    -- Access Statistics (would be populated by actual usage data)
    0 as view_count, -- Placeholder for future implementation
    0 as download_count, -- Placeholder for future implementation
    
    -- System Metadata
    NOW() as last_refreshed
FROM documents d
LEFT JOIN document_chunks dc ON dc.document_id = d.id
LEFT JOIN document_themes dt ON dt.document_id = d.id
LEFT JOIN document_quotes dq ON dq.document_id = d.id
LEFT JOIN document_comments dcom ON dcom.document_id = d.id
LEFT JOIN collaborative_annotations ca ON ca.document_id = d.id
LEFT JOIN collection_documents cd ON cd.document_id = d.id
GROUP BY d.id, d.title, d.filename, d.community_id, d.cultural_sensitivity_level, 
         d.document_type, d.processing_status, d.created_at, d.file_size, 
         d.word_count, d.page_count, d.requires_elder_approval, d.traditional_knowledge_category;

-- Create unique index for document analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_document_analytics_id ON mv_document_analytics(document_id);

-- Create materialized view for research project analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_research_project_analytics AS
SELECT 
    rp.id as project_id,
    rp.project_name,
    rp.project_type,
    rp.community_id,
    rp.status,
    rp.cultural_significance,
    rp.requires_elder_oversight,
    rp.traditional_knowledge_involved,
    rp.start_date,
    rp.target_completion_date,
    rp.created_at,
    
    -- Collection Statistics
    COUNT(DISTINCT rc.id) as total_collections,
    COUNT(DISTINCT rc.id) FILTER (WHERE rc.cultural_significance = 'sacred') as sacred_collections,
    COUNT(DISTINCT rc.id) FILTER (WHERE rc.peer_reviewed = true) as peer_reviewed_collections,
    
    -- Document Statistics
    COUNT(DISTINCT cd.document_id) as total_documents,
    COUNT(DISTINCT cd.document_id) FILTER (WHERE cd.methodology_role = 'primary_source') as primary_sources,
    COUNT(DISTINCT cd.document_id) FILTER (WHERE cd.document_significance = 'critical') as critical_documents,
    
    -- Collaboration Statistics
    COUNT(DISTINCT rcol.id) as total_collaborators,
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.elder_status = true) as elder_collaborators,
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.status = 'active') as active_collaborators,
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.role = 'lead_researcher') as lead_researchers,
    
    -- Milestone Statistics
    COUNT(DISTINCT rm.id) as total_milestones,
    COUNT(DISTINCT rm.id) FILTER (WHERE rm.is_completed = true) as completed_milestones,
    COUNT(DISTINCT rm.id) FILTER (WHERE rm.requires_elder_approval = true) as milestones_needing_approval,
    COUNT(DISTINCT rm.id) FILTER (WHERE rm.target_date < CURRENT_DATE AND rm.is_completed = false) as overdue_milestones,
    
    -- Progress Metrics
    CASE 
        WHEN COUNT(rm.id) > 0 THEN 
            ROUND((COUNT(rm.id) FILTER (WHERE rm.is_completed = true)::DECIMAL / COUNT(rm.id)) * 100, 2)
        ELSE 0 
    END as completion_percentage,
    
    -- Cultural Compliance
    COUNT(DISTINCT rc.id) FILTER (WHERE rc.requires_elder_approval = true AND rc.elder_approved = false) as pending_cultural_reviews,
    
    -- Timeline Analysis
    CASE 
        WHEN rp.target_completion_date IS NOT NULL THEN
            rp.target_completion_date - CURRENT_DATE
        ELSE NULL
    END as days_until_target,
    
    -- System Metadata
    NOW() as last_refreshed
FROM research_projects rp
LEFT JOIN research_collections rc ON rc.research_project_id = rp.id
LEFT JOIN collection_documents cd ON cd.collection_id = rc.id
LEFT JOIN research_collaborations rcol ON rcol.research_project_id = rp.id
LEFT JOIN research_milestones rm ON rm.research_project_id = rp.id
GROUP BY rp.id, rp.project_name, rp.project_type, rp.community_id, rp.status, 
         rp.cultural_significance, rp.requires_elder_oversight, rp.traditional_knowledge_involved,
         rp.start_date, rp.target_completion_date, rp.created_at;

-- Create unique index for research project analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_research_project_analytics_id ON mv_research_project_analytics(project_id);

-- Create materialized view for cultural content analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cultural_content_analytics AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    
    -- Sacred Content Statistics
    COUNT(DISTINCT d.id) FILTER (WHERE d.cultural_sensitivity_level = 'sacred') as sacred_documents,
    COUNT(DISTINCT dc.id) FILTER (WHERE dc.cultural_sensitivity_level = 'sacred') as sacred_chunks,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.cultural_significance = 'sacred') as sacred_themes,
    COUNT(DISTINCT dq.id) FILTER (WHERE dq.cultural_significance = 'sacred') as sacred_quotes,
    
    -- Ceremonial Content Statistics
    COUNT(DISTINCT d.id) FILTER (WHERE d.cultural_sensitivity_level = 'ceremonial') as ceremonial_documents,
    COUNT(DISTINCT dc.id) FILTER (WHERE dc.cultural_sensitivity_level = 'ceremonial') as ceremonial_chunks,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.cultural_significance = 'ceremonial') as ceremonial_themes,
    COUNT(DISTINCT dq.id) FILTER (WHERE dq.cultural_significance = 'ceremonial') as ceremonial_quotes,
    
    -- Traditional Knowledge Statistics
    COUNT(DISTINCT d.id) FILTER (WHERE d.traditional_knowledge_category IS NOT NULL) as traditional_knowledge_documents,
    COUNT(DISTINCT dc.id) FILTER (WHERE array_length(dc.traditional_knowledge_indicators, 1) > 0) as traditional_knowledge_chunks,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.traditional_knowledge_theme = true) as traditional_knowledge_themes,
    COUNT(DISTINCT dq.id) FILTER (WHERE dq.traditional_knowledge_quote = true) as traditional_knowledge_quotes,
    
    -- Elder Review Statistics
    COUNT(DISTINCT d.id) FILTER (WHERE d.requires_elder_approval = true) as documents_requiring_elder_approval,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.requires_elder_review = true) as themes_requiring_elder_review,
    COUNT(DISTINCT dq.id) FILTER (WHERE dq.requires_elder_approval = true) as quotes_requiring_elder_approval,
    
    -- Elder Review Status
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.requires_elder_review = true AND dt.elder_reviewed = false) as pending_theme_reviews,
    COUNT(DISTINCT dq.id) FILTER (WHERE dq.requires_elder_approval = true AND dq.elder_approved = false) as pending_quote_reviews,
    
    -- Cultural Annotations
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.cultural_annotation = true) as cultural_annotations,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.traditional_knowledge_note = true) as traditional_knowledge_annotations,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.elder_validated = true) as elder_validated_annotations,
    
    -- Cultural Comments
    COUNT(DISTINCT dcom.id) FILTER (WHERE dcom.comment_type = 'cultural_note') as cultural_comments,
    COUNT(DISTINCT dcom.id) FILTER (WHERE dcom.requires_elder_review = true) as comments_requiring_elder_review,
    
    -- Elder Collaborators
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.elder_status = true) as elder_collaborators,
    COUNT(DISTINCT rcol.id) FILTER (WHERE rcol.can_approve_cultural_content = true) as cultural_approvers,
    
    -- Cultural Compliance Metrics
    CASE 
        WHEN COUNT(DISTINCT d.id) FILTER (WHERE d.requires_elder_approval = true) > 0 THEN
            ROUND((COUNT(DISTINCT d.id) FILTER (WHERE d.requires_elder_approval = true AND d.cultural_sensitivity_level IN ('sacred', 'ceremonial'))::DECIMAL / 
                   COUNT(DISTINCT d.id) FILTER (WHERE d.requires_elder_approval = true)) * 100, 2)
        ELSE 0
    END as cultural_compliance_percentage,
    
    -- System Metadata
    NOW() as last_refreshed
FROM communities c
LEFT JOIN documents d ON d.community_id = c.id
LEFT JOIN document_chunks dc ON dc.community_id = c.id
LEFT JOIN document_themes dt ON dt.community_id = c.id
LEFT JOIN document_quotes dq ON dq.community_id = c.id
LEFT JOIN collaborative_annotations ca ON ca.community_id = c.id
LEFT JOIN document_comments dcom ON dcom.community_id = c.id
LEFT JOIN research_projects rp ON rp.community_id = c.id
LEFT JOIN research_collaborations rcol ON rcol.research_project_id = rp.id
GROUP BY c.id, c.name;

-- Create unique index for cultural content analytics
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_cultural_content_analytics_id ON mv_cultural_content_analytics(community_id);

-- =====================================================
-- MATERIALIZED VIEW MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_analytics_views()
RETURNS TABLE(
    view_name TEXT,
    refresh_status TEXT,
    refresh_time_ms BIGINT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms BIGINT;
BEGIN
    -- Refresh community analytics
    start_time := clock_timestamp();
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_community_analytics;
        end_time := clock_timestamp();
        duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        RETURN QUERY SELECT 'mv_community_analytics'::TEXT, 'SUCCESS'::TEXT, duration_ms;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'mv_community_analytics'::TEXT, 'FAILED: ' || SQLERRM, 0::BIGINT;
    END;
    
    -- Refresh document analytics
    start_time := clock_timestamp();
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_document_analytics;
        end_time := clock_timestamp();
        duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        RETURN QUERY SELECT 'mv_document_analytics'::TEXT, 'SUCCESS'::TEXT, duration_ms;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'mv_document_analytics'::TEXT, 'FAILED: ' || SQLERRM, 0::BIGINT;
    END;
    
    -- Refresh research project analytics
    start_time := clock_timestamp();
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_research_project_analytics;
        end_time := clock_timestamp();
        duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        RETURN QUERY SELECT 'mv_research_project_analytics'::TEXT, 'SUCCESS'::TEXT, duration_ms;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'mv_research_project_analytics'::TEXT, 'FAILED: ' || SQLERRM, 0::BIGINT;
    END;
    
    -- Refresh cultural content analytics
    start_time := clock_timestamp();
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cultural_content_analytics;
        end_time := clock_timestamp();
        duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        RETURN QUERY SELECT 'mv_cultural_content_analytics'::TEXT, 'SUCCESS'::TEXT, duration_ms;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'mv_cultural_content_analytics'::TEXT, 'FAILED: ' || SQLERRM, 0::BIGINT;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get materialized view statistics
CREATE OR REPLACE FUNCTION get_materialized_view_stats()
RETURNS TABLE(
    view_name TEXT,
    row_count BIGINT,
    size_pretty TEXT,
    last_refreshed TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'mv_community_analytics'::TEXT,
        (SELECT COUNT(*) FROM mv_community_analytics),
        pg_size_pretty(pg_total_relation_size('mv_community_analytics')),
        (SELECT MAX(last_refreshed) FROM mv_community_analytics)
    
    UNION ALL
    
    SELECT 
        'mv_document_analytics'::TEXT,
        (SELECT COUNT(*) FROM mv_document_analytics),
        pg_size_pretty(pg_total_relation_size('mv_document_analytics')),
        (SELECT MAX(last_refreshed) FROM mv_document_analytics)
    
    UNION ALL
    
    SELECT 
        'mv_research_project_analytics'::TEXT,
        (SELECT COUNT(*) FROM mv_research_project_analytics),
        pg_size_pretty(pg_total_relation_size('mv_research_project_analytics')),
        (SELECT MAX(last_refreshed) FROM mv_research_project_analytics)
    
    UNION ALL
    
    SELECT 
        'mv_cultural_content_analytics'::TEXT,
        (SELECT COUNT(*) FROM mv_cultural_content_analytics),
        pg_size_pretty(pg_total_relation_size('mv_cultural_content_analytics')),
        (SELECT MAX(last_refreshed) FROM mv_cultural_content_analytics);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES FOR MATERIALIZED VIEWS
-- =====================================================

-- Additional indexes for materialized views
CREATE INDEX IF NOT EXISTS idx_mv_community_analytics_stats ON mv_community_analytics(total_documents DESC, total_projects DESC, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_mv_document_analytics_engagement ON mv_document_analytics(total_comments DESC, total_annotations DESC, cultural_sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_mv_research_project_analytics_progress ON mv_research_project_analytics(completion_percentage DESC, status, days_until_target);
CREATE INDEX IF NOT EXISTS idx_mv_cultural_content_analytics_compliance ON mv_cultural_content_analytics(cultural_compliance_percentage DESC, pending_theme_reviews DESC);

SELECT 'Materialized views for analytics created successfully' as status;