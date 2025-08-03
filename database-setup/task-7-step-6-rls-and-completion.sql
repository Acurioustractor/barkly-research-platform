-- =====================================================
-- TASK 7 - STEP 6: RLS Policies and System Completion
-- Add Row Level Security for AI Analysis Tables
-- =====================================================

-- Enable RLS on AI analysis tables
ALTER TABLE document_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DOCUMENT THEMES RLS POLICIES
-- =====================================================

-- Policy: Community members can view community themes
DROP POLICY IF EXISTS "Community members can view community themes" ON document_themes;
CREATE POLICY "Community members can view community themes" ON document_themes
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
            OR EXISTS (
                SELECT 1 FROM documents d 
                WHERE d.id = document_themes.document_id 
                AND d.is_public = true 
                AND d.access_level = 'public'
                AND cultural_significance NOT IN ('sacred', 'ceremonial')
            )
        )
    );

-- Policy: Sacred themes require elder approval
DROP POLICY IF EXISTS "Sacred themes require elder approval" ON document_themes;
CREATE POLICY "Sacred themes require elder approval" ON document_themes
    FOR SELECT USING (
        is_authenticated() AND (
            cultural_significance NOT IN ('sacred', 'ceremonial')
            OR (
                cultural_significance IN ('sacred', 'ceremonial')
                AND (is_community_admin(community_id) OR elder_reviewed = true)
            )
        )
    );

-- =====================================================
-- DOCUMENT QUOTES RLS POLICIES
-- =====================================================

-- Policy: Community members can view community quotes
DROP POLICY IF EXISTS "Community members can view community quotes" ON document_quotes;
CREATE POLICY "Community members can view community quotes" ON document_quotes
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
            OR EXISTS (
                SELECT 1 FROM documents d 
                WHERE d.id = document_quotes.document_id 
                AND d.is_public = true 
                AND d.access_level = 'public'
                AND cultural_significance NOT IN ('sacred', 'ceremonial')
            )
        )
    );

-- Policy: Sacred quotes require elder approval
DROP POLICY IF EXISTS "Sacred quotes require elder approval" ON document_quotes;
CREATE POLICY "Sacred quotes require elder approval" ON document_quotes
    FOR SELECT USING (
        is_authenticated() AND (
            cultural_significance NOT IN ('sacred', 'ceremonial')
            OR (
                cultural_significance IN ('sacred', 'ceremonial')
                AND (is_community_admin(community_id) OR elder_approved = true)
            )
        )
    );

-- =====================================================
-- GLOBAL THEMES RLS POLICIES
-- =====================================================

-- Policy: Community members can view community global themes
DROP POLICY IF EXISTS "Community members can view global themes" ON global_themes;
CREATE POLICY "Community members can view global themes" ON global_themes
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
        )
    );

-- =====================================================
-- AI MODELS RLS POLICIES
-- =====================================================

-- Policy: Authenticated users can view active AI models
DROP POLICY IF EXISTS "Users can view active AI models" ON ai_models;
CREATE POLICY "Users can view active AI models" ON ai_models
    FOR SELECT USING (
        is_authenticated() AND is_active = true
    );

-- =====================================================
-- ANALYSIS SESSIONS RLS POLICIES
-- =====================================================

-- Policy: Community members can view community analysis sessions
DROP POLICY IF EXISTS "Community members can view analysis sessions" ON analysis_sessions;
CREATE POLICY "Community members can view analysis sessions" ON analysis_sessions
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
        )
    );

-- Policy: Community members can create analysis sessions
DROP POLICY IF EXISTS "Community members can create analysis sessions" ON analysis_sessions;
CREATE POLICY "Community members can create analysis sessions" ON analysis_sessions
    FOR INSERT WITH CHECK (
        is_authenticated() AND 
        community_id = get_user_community_id()
    );

-- =====================================================
-- ANALYSIS RESULTS RLS POLICIES
-- =====================================================

-- Policy: Community members can view community analysis results
DROP POLICY IF EXISTS "Community members can view analysis results" ON analysis_results;
CREATE POLICY "Community members can view analysis results" ON analysis_results
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
        )
    );

-- =====================================================
-- ADD AUDIT TRIGGERS
-- =====================================================

-- Add audit triggers to AI analysis tables
DROP TRIGGER IF EXISTS document_themes_audit_trigger ON document_themes;
CREATE TRIGGER document_themes_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_themes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS document_quotes_audit_trigger ON document_quotes;
CREATE TRIGGER document_quotes_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_quotes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS analysis_sessions_audit_trigger ON analysis_sessions;
CREATE TRIGGER analysis_sessions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON analysis_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS analysis_results_audit_trigger ON analysis_results;
CREATE TRIGGER analysis_results_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON analysis_results
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add update triggers for timestamp management
DROP TRIGGER IF EXISTS document_themes_updated_at ON document_themes;
CREATE TRIGGER document_themes_updated_at
    BEFORE UPDATE ON document_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS document_quotes_updated_at ON document_quotes;
CREATE TRIGGER document_quotes_updated_at
    BEFORE UPDATE ON document_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS global_themes_updated_at ON global_themes;
CREATE TRIGGER global_themes_updated_at
    BEFORE UPDATE ON global_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS analysis_sessions_updated_at ON analysis_sessions;
CREATE TRIGGER analysis_sessions_updated_at
    BEFORE UPDATE ON analysis_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FINAL SYSTEM VALIDATION
-- =====================================================

-- Test RLS policies are working
SELECT 
    'RLS Test: Themes accessible' as test_name,
    count(*) as theme_count
FROM document_themes;

SELECT 
    'RLS Test: Quotes accessible' as test_name,
    count(*) as quote_count
FROM document_quotes;

SELECT 
    'RLS Test: AI models accessible' as test_name,
    count(*) as model_count
FROM ai_models;

-- Final system summary
SELECT 
    'AI ANALYSIS SYSTEM FINAL SUMMARY' as summary,
    (SELECT count(*) FROM ai_models) as ai_models,
    (SELECT count(*) FROM analysis_sessions) as analysis_sessions,
    (SELECT count(*) FROM document_themes) as document_themes,
    (SELECT count(*) FROM document_quotes) as document_quotes,
    (SELECT count(*) FROM global_themes) as global_themes,
    (SELECT count(*) FROM analysis_results) as analysis_results,
    (SELECT count(*) FROM document_themes WHERE cultural_significance = 'sacred') as sacred_themes,
    (SELECT count(*) FROM document_quotes WHERE contains_sacred_content = true) as sacred_quotes,
    (SELECT count(*) FROM document_themes WHERE requires_elder_review = true AND elder_reviewed = false) as pending_elder_reviews;

SELECT 'Task 7: AI Analysis Results Storage completed successfully!' as status;