-- =====================================================
-- TASK 7 - STEP 4: AI Analysis Functions and Management
-- Functions for Managing AI Analysis Results
-- =====================================================

-- Function to register a new AI model
CREATE OR REPLACE FUNCTION register_ai_model(
    p_model_name TEXT,
    p_model_version TEXT,
    p_model_type TEXT,
    p_provider TEXT,
    p_description TEXT DEFAULT NULL,
    p_parameters JSONB DEFAULT '{}',
    p_supports_cultural_context BOOLEAN DEFAULT false,
    p_indigenous_knowledge_trained BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    model_id UUID;
BEGIN
    INSERT INTO ai_models (
        model_name,
        model_version,
        model_type,
        provider,
        model_description,
        model_parameters,
        supports_cultural_context,
        indigenous_knowledge_trained,
        is_active
    ) VALUES (
        p_model_name,
        p_model_version,
        p_model_type,
        p_provider,
        p_description,
        p_parameters,
        p_supports_cultural_context,
        p_indigenous_knowledge_trained,
        true
    ) RETURNING id INTO model_id;
    
    RETURN model_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create an analysis session
CREATE OR REPLACE FUNCTION create_analysis_session(
    p_session_name TEXT,
    p_analysis_type TEXT,
    p_community_id UUID,
    p_initiated_by UUID,
    p_ai_model_id UUID,
    p_document_ids UUID[] DEFAULT '{}',
    p_cultural_sensitivity_mode BOOLEAN DEFAULT true,
    p_model_parameters JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    elder_review_needed BOOLEAN := false;
BEGIN
    -- Check if elder review is needed based on document sensitivity
    IF array_length(p_document_ids, 1) > 0 THEN
        SELECT bool_or(cultural_sensitivity_level IN ('sacred', 'ceremonial'))
        INTO elder_review_needed
        FROM documents 
        WHERE id = ANY(p_document_ids);
    END IF;
    
    INSERT INTO analysis_sessions (
        session_name,
        analysis_type,
        community_id,
        initiated_by,
        ai_model_id,
        document_ids,
        cultural_sensitivity_mode,
        elder_review_required,
        model_parameters,
        status
    ) VALUES (
        p_session_name,
        p_analysis_type,
        p_community_id,
        p_initiated_by,
        p_ai_model_id,
        p_document_ids,
        p_cultural_sensitivity_mode,
        elder_review_needed,
        p_model_parameters,
        'pending'
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add a theme from AI analysis
CREATE OR REPLACE FUNCTION add_ai_theme(
    p_document_id UUID,
    p_session_id UUID,
    p_theme_name TEXT,
    p_theme_description TEXT,
    p_confidence_score DECIMAL(5,4),
    p_relevance_score DECIMAL(5,4),
    p_supporting_chunks UUID[] DEFAULT '{}',
    p_key_phrases TEXT[] DEFAULT '{}',
    p_ai_model_name TEXT DEFAULT 'unknown'
)
RETURNS UUID AS $$
DECLARE
    theme_id UUID;
    doc_community_id UUID;
    cultural_significance TEXT := 'standard';
    requires_elder_review BOOLEAN := false;
    theme_slug TEXT;
BEGIN
    -- Get document community
    SELECT community_id INTO doc_community_id FROM documents WHERE id = p_document_id;
    
    -- Generate theme slug
    theme_slug := lower(replace(regexp_replace(p_theme_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    
    -- Detect cultural significance from theme content
    IF p_theme_name ~* '(sacred|ceremony|ritual|spiritual|elder|traditional|ancestral)' OR
       p_theme_description ~* '(sacred|ceremony|ritual|spiritual|elder|traditional|ancestral)' THEN
        cultural_significance := 'sacred';
        requires_elder_review := true;
    ELSIF p_theme_name ~* '(cultural|indigenous|aboriginal|native|tribal)' OR
          p_theme_description ~* '(cultural|indigenous|aboriginal|native|tribal)' THEN
        cultural_significance := 'sensitive';
    END IF;
    
    INSERT INTO document_themes (
        document_id,
        community_id,
        theme_name,
        theme_slug,
        theme_description,
        confidence_score,
        relevance_score,
        supporting_chunks,
        key_phrases,
        cultural_significance,
        requires_elder_review,
        ai_model_name,
        processing_status
    ) VALUES (
        p_document_id,
        doc_community_id,
        p_theme_name,
        theme_slug,
        p_theme_description,
        p_confidence_score,
        p_relevance_score,
        p_supporting_chunks,
        p_key_phrases,
        cultural_significance,
        requires_elder_review,
        p_ai_model_name,
        CASE WHEN requires_elder_review THEN 'needs_review' ELSE 'completed' END
    ) RETURNING id INTO theme_id;
    
    -- Record the analysis result
    INSERT INTO analysis_results (
        session_id,
        community_id,
        result_type,
        result_id,
        source_document_id,
        confidence_score,
        requires_cultural_review
    ) VALUES (
        p_session_id,
        doc_community_id,
        'theme',
        theme_id,
        p_document_id,
        p_confidence_score,
        requires_elder_review
    );
    
    -- Update global themes
    PERFORM update_global_theme(doc_community_id, theme_slug, p_theme_name, cultural_significance);
    
    RETURN theme_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add a quote from AI analysis
CREATE OR REPLACE FUNCTION add_ai_quote(
    p_document_id UUID,
    p_chunk_id UUID,
    p_session_id UUID,
    p_quote_text TEXT,
    p_significance_score DECIMAL(5,4),
    p_relevance_score DECIMAL(5,4),
    p_quote_type TEXT DEFAULT 'general',
    p_start_position INTEGER DEFAULT NULL,
    p_end_position INTEGER DEFAULT NULL,
    p_ai_model_name TEXT DEFAULT 'unknown'
)
RETURNS UUID AS $$
DECLARE
    quote_id UUID;
    doc_community_id UUID;
    cultural_significance TEXT := 'standard';
    requires_elder_approval BOOLEAN := false;
    contains_sacred BOOLEAN := false;
    cultural_indicators TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get document community
    SELECT community_id INTO doc_community_id FROM documents WHERE id = p_document_id;
    
    -- Detect cultural content in quote
    IF p_quote_text ~* '(sacred|ceremony|ritual|spiritual|holy|blessed)' THEN
        cultural_significance := 'sacred';
        requires_elder_approval := true;
        contains_sacred := true;
        cultural_indicators := array_append(cultural_indicators, 'sacred_content');
    ELSIF p_quote_text ~* '(elder|traditional|ancestral|indigenous|aboriginal|native)' THEN
        cultural_significance := 'sensitive';
        cultural_indicators := array_append(cultural_indicators, 'traditional_knowledge');
    END IF;
    
    -- Check for traditional knowledge indicators
    IF p_quote_text ~* '(knowledge|wisdom|teaching|story|practice|custom|belief)' THEN
        cultural_indicators := array_append(cultural_indicators, 'traditional_knowledge');
    END IF;
    
    INSERT INTO document_quotes (
        document_id,
        chunk_id,
        community_id,
        quote_text,
        quote_length,
        start_position,
        end_position,
        significance_score,
        relevance_score,
        quote_type,
        cultural_significance,
        cultural_indicators,
        contains_sacred_content,
        requires_elder_approval,
        ai_model_name,
        processing_status
    ) VALUES (
        p_document_id,
        p_chunk_id,
        doc_community_id,
        p_quote_text,
        length(p_quote_text),
        p_start_position,
        p_end_position,
        p_significance_score,
        p_relevance_score,
        p_quote_type,
        cultural_significance,
        cultural_indicators,
        contains_sacred,
        requires_elder_approval,
        p_ai_model_name,
        CASE WHEN requires_elder_approval THEN 'needs_review' ELSE 'completed' END
    ) RETURNING id INTO quote_id;
    
    -- Record the analysis result
    INSERT INTO analysis_results (
        session_id,
        community_id,
        result_type,
        result_id,
        source_document_id,
        source_chunk_id,
        confidence_score,
        requires_cultural_review
    ) VALUES (
        p_session_id,
        doc_community_id,
        'quote',
        quote_id,
        p_document_id,
        p_chunk_id,
        p_significance_score,
        requires_elder_approval
    );
    
    RETURN quote_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update global themes
CREATE OR REPLACE FUNCTION update_global_theme(
    p_community_id UUID,
    p_theme_slug TEXT,
    p_theme_name TEXT,
    p_cultural_significance TEXT DEFAULT 'standard'
)
RETURNS VOID AS $$
DECLARE
    theme_stats RECORD;
BEGIN
    -- Calculate aggregated statistics for this theme
    SELECT 
        count(*) as doc_count,
        avg(confidence_score) as avg_conf,
        avg(relevance_score) as avg_rel,
        sum(confidence_score) as total_conf,
        sum(relevance_score) as total_rel,
        min(created_at) as first_detected,
        max(created_at) as last_detected
    INTO theme_stats
    FROM document_themes 
    WHERE community_id = p_community_id 
    AND theme_slug = p_theme_slug;
    
    -- Insert or update global theme
    INSERT INTO global_themes (
        theme_name,
        theme_slug,
        community_id,
        document_count,
        total_confidence,
        avg_confidence,
        total_relevance,
        avg_relevance,
        cultural_significance,
        first_detected,
        last_detected
    ) VALUES (
        p_theme_name,
        p_theme_slug,
        p_community_id,
        theme_stats.doc_count,
        theme_stats.total_conf,
        theme_stats.avg_conf,
        theme_stats.total_rel,
        theme_stats.avg_rel,
        p_cultural_significance,
        theme_stats.first_detected,
        theme_stats.last_detected
    ) ON CONFLICT (community_id, theme_slug) DO UPDATE SET
        document_count = theme_stats.doc_count,
        total_confidence = theme_stats.total_conf,
        avg_confidence = theme_stats.avg_conf,
        total_relevance = theme_stats.total_rel,
        avg_relevance = theme_stats.avg_rel,
        last_detected = theme_stats.last_detected,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get themes requiring elder review
CREATE OR REPLACE FUNCTION get_themes_for_elder_review(p_community_id UUID)
RETURNS TABLE(
    theme_id UUID,
    theme_name TEXT,
    cultural_significance TEXT,
    confidence_score DECIMAL(5,4),
    document_count BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dt.id,
        dt.theme_name,
        dt.cultural_significance,
        dt.confidence_score,
        count(*) OVER (PARTITION BY dt.theme_slug) as document_count,
        dt.created_at
    FROM document_themes dt
    WHERE dt.community_id = p_community_id
    AND dt.requires_elder_review = true
    AND dt.elder_reviewed = false
    AND dt.processing_status = 'needs_review'
    ORDER BY dt.cultural_significance DESC, dt.confidence_score DESC, dt.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to approve theme after elder review
CREATE OR REPLACE FUNCTION approve_theme_elder_review(
    p_theme_id UUID,
    p_elder_user_id UUID,
    p_elder_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE document_themes 
    SET elder_reviewed = true,
        elder_reviewed_by = p_elder_user_id,
        elder_reviewed_at = NOW(),
        elder_notes = p_elder_notes,
        processing_status = 'approved'
    WHERE id = p_theme_id
    AND requires_elder_review = true
    AND elder_reviewed = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

SELECT 'AI analysis functions created successfully' as status;