-- Accessibility Features Database Schema
-- This schema supports comprehensive accessibility features including user preferences,
-- cultural accessibility, audio descriptions, and accessibility auditing

-- User accessibility preferences table
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    high_contrast BOOLEAN DEFAULT FALSE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    large_text BOOLEAN DEFAULT FALSE,
    screen_reader BOOLEAN DEFAULT FALSE,
    keyboard_navigation BOOLEAN DEFAULT FALSE,
    audio_descriptions BOOLEAN DEFAULT FALSE,
    captions_enabled BOOLEAN DEFAULT FALSE,
    color_blindness_type TEXT DEFAULT 'none' CHECK (color_blindness_type IN ('none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia')),
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra-large')),
    language TEXT DEFAULT 'en',
    cultural_accessibility JSONB DEFAULT '{}',
    assistive_technology JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Cultural accessibility guides table
CREATE TABLE IF NOT EXISTS cultural_accessibility_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'en',
    cultural_context TEXT NOT NULL,
    accessibility_guidelines JSONB NOT NULL DEFAULT '{}',
    elder_considerations TEXT[] DEFAULT '{}',
    youth_considerations TEXT[] DEFAULT '{}',
    literacy_support JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_id, language)
);

-- Audio descriptions table
CREATE TABLE IF NOT EXISTS audio_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('story', 'event', 'document', 'interface')),
    language TEXT NOT NULL DEFAULT 'en',
    description TEXT NOT NULL,
    timestamp_seconds INTEGER,
    cultural_context TEXT,
    generated_by TEXT, -- 'ai' or user_id
    reviewed_by UUID REFERENCES auth.users(id),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accessibility audits table
CREATE TABLE IF NOT EXISTS accessibility_audits (
    id TEXT PRIMARY KEY,
    component_id TEXT NOT NULL,
    component_name TEXT NOT NULL,
    audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    wcag_level TEXT NOT NULL CHECK (wcag_level IN ('A', 'AA', 'AAA')),
    issues JSONB NOT NULL DEFAULT '[]',
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    recommendations TEXT[] DEFAULT '{}',
    cultural_considerations TEXT[] DEFAULT '{}',
    auditor_type TEXT DEFAULT 'automated' CHECK (auditor_type IN ('automated', 'manual', 'user')),
    auditor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accessibility feedback table
CREATE TABLE IF NOT EXISTS accessibility_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    component_id TEXT,
    page_url TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('barrier', 'suggestion', 'praise', 'bug')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assistive_technology TEXT,
    browser_info JSONB,
    cultural_context TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accessibility training records table
CREATE TABLE IF NOT EXISTS accessibility_training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    training_module TEXT NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    certificate_url TEXT,
    cultural_competency_included BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_accessibility_preferences_user_id ON user_accessibility_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_cultural_accessibility_guides_community_id ON cultural_accessibility_guides(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_accessibility_guides_language ON cultural_accessibility_guides(language);
CREATE INDEX IF NOT EXISTS idx_audio_descriptions_content_id ON audio_descriptions(content_id);
CREATE INDEX IF NOT EXISTS idx_audio_descriptions_content_type ON audio_descriptions(content_type);
CREATE INDEX IF NOT EXISTS idx_audio_descriptions_language ON audio_descriptions(language);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_component_id ON accessibility_audits(component_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_audit_date ON accessibility_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_score ON accessibility_audits(score);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_user_id ON accessibility_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_status ON accessibility_feedback(status);
CREATE INDEX IF NOT EXISTS idx_accessibility_feedback_severity ON accessibility_feedback(severity);
CREATE INDEX IF NOT EXISTS idx_accessibility_training_records_user_id ON accessibility_training_records(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_accessibility_preferences_updated_at 
    BEFORE UPDATE ON user_accessibility_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_accessibility_guides_updated_at 
    BEFORE UPDATE ON cultural_accessibility_guides 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_descriptions_updated_at 
    BEFORE UPDATE ON audio_descriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_feedback_updated_at 
    BEFORE UPDATE ON accessibility_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user accessibility summary
CREATE OR REPLACE FUNCTION get_user_accessibility_summary(p_user_id UUID)
RETURNS TABLE (
    has_preferences BOOLEAN,
    accessibility_needs INTEGER,
    cultural_context TEXT,
    preferred_language TEXT,
    assistive_tech_count INTEGER,
    training_completed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM user_accessibility_preferences WHERE user_id = p_user_id) as has_preferences,
        (
            CASE WHEN uap.high_contrast THEN 1 ELSE 0 END +
            CASE WHEN uap.reduced_motion THEN 1 ELSE 0 END +
            CASE WHEN uap.large_text THEN 1 ELSE 0 END +
            CASE WHEN uap.screen_reader THEN 1 ELSE 0 END +
            CASE WHEN uap.keyboard_navigation THEN 1 ELSE 0 END +
            CASE WHEN uap.audio_descriptions THEN 1 ELSE 0 END +
            CASE WHEN uap.captions_enabled THEN 1 ELSE 0 END
        ) as accessibility_needs,
        (uap.cultural_accessibility->>'culturalContext')::TEXT as cultural_context,
        uap.language as preferred_language,
        (
            CASE WHEN (uap.assistive_technology->>'voiceControl')::BOOLEAN THEN 1 ELSE 0 END +
            CASE WHEN (uap.assistive_technology->>'switchNavigation')::BOOLEAN THEN 1 ELSE 0 END +
            CASE WHEN (uap.assistive_technology->>'eyeTracking')::BOOLEAN THEN 1 ELSE 0 END
        ) as assistive_tech_count,
        (SELECT COUNT(*)::INTEGER FROM accessibility_training_records WHERE user_id = p_user_id AND completion_date IS NOT NULL) as training_completed
    FROM user_accessibility_preferences uap
    WHERE uap.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get accessibility audit summary
CREATE OR REPLACE FUNCTION get_accessibility_audit_summary(p_component_id TEXT DEFAULT NULL)
RETURNS TABLE (
    total_audits INTEGER,
    average_score DECIMAL,
    latest_audit_date TIMESTAMP WITH TIME ZONE,
    critical_issues INTEGER,
    high_issues INTEGER,
    medium_issues INTEGER,
    low_issues INTEGER,
    wcag_aa_compliance BOOLEAN,
    wcag_aaa_compliance BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_audits,
        AVG(aa.score) as average_score,
        MAX(aa.audit_date) as latest_audit_date,
        SUM(jsonb_array_length(
            jsonb_path_query_array(aa.issues, '$[*] ? (@.severity == "critical")')
        ))::INTEGER as critical_issues,
        SUM(jsonb_array_length(
            jsonb_path_query_array(aa.issues, '$[*] ? (@.severity == "high")')
        ))::INTEGER as high_issues,
        SUM(jsonb_array_length(
            jsonb_path_query_array(aa.issues, '$[*] ? (@.severity == "medium")')
        ))::INTEGER as medium_issues,
        SUM(jsonb_array_length(
            jsonb_path_query_array(aa.issues, '$[*] ? (@.severity == "low")')
        ))::INTEGER as low_issues,
        BOOL_AND(aa.wcag_level IN ('AA', 'AAA')) as wcag_aa_compliance,
        BOOL_AND(aa.wcag_level = 'AAA') as wcag_aaa_compliance
    FROM accessibility_audits aa
    WHERE (p_component_id IS NULL OR aa.component_id = p_component_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get cultural accessibility recommendations
CREATE OR REPLACE FUNCTION get_cultural_accessibility_recommendations(p_community_id UUID, p_language TEXT DEFAULT 'en')
RETURNS TABLE (
    guideline_type TEXT,
    recommendation TEXT,
    priority TEXT,
    cultural_context TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'color_meaning' as guideline_type,
        'Consider cultural color meanings: ' || (cag.accessibility_guidelines->'colorMeanings')::TEXT as recommendation,
        'medium' as priority,
        cag.cultural_context
    FROM cultural_accessibility_guides cag
    WHERE cag.community_id = p_community_id 
    AND cag.language = p_language
    AND cag.accessibility_guidelines ? 'colorMeanings'
    
    UNION ALL
    
    SELECT 
        'elder_consideration' as guideline_type,
        unnest(cag.elder_considerations) as recommendation,
        'high' as priority,
        cag.cultural_context
    FROM cultural_accessibility_guides cag
    WHERE cag.community_id = p_community_id 
    AND cag.language = p_language
    AND array_length(cag.elder_considerations, 1) > 0
    
    UNION ALL
    
    SELECT 
        'youth_consideration' as guideline_type,
        unnest(cag.youth_considerations) as recommendation,
        'medium' as priority,
        cag.cultural_context
    FROM cultural_accessibility_guides cag
    WHERE cag.community_id = p_community_id 
    AND cag.language = p_language
    AND array_length(cag.youth_considerations, 1) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to generate accessibility report
CREATE OR REPLACE FUNCTION generate_accessibility_report(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT,
    metric_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'total_users_with_preferences' as metric_name,
        COUNT(*)::TEXT as metric_value,
        'Users who have set accessibility preferences' as metric_description
    FROM user_accessibility_preferences
    WHERE created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
        'average_audit_score' as metric_name,
        ROUND(AVG(score), 1)::TEXT as metric_value,
        'Average accessibility audit score across all components' as metric_description
    FROM accessibility_audits
    WHERE audit_date BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
        'total_accessibility_feedback' as metric_name,
        COUNT(*)::TEXT as metric_value,
        'Total accessibility feedback submissions' as metric_description
    FROM accessibility_feedback
    WHERE created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
        'critical_issues_reported' as metric_name,
        COUNT(*)::TEXT as metric_value,
        'Critical accessibility issues reported by users' as metric_description
    FROM accessibility_feedback
    WHERE severity = 'critical' 
    AND created_at BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    SELECT 
        'audio_descriptions_created' as metric_name,
        COUNT(*)::TEXT as metric_value,
        'Audio descriptions created for content' as metric_description
    FROM audio_descriptions
    WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Insert sample cultural accessibility guides
INSERT INTO cultural_accessibility_guides (community_id, language, cultural_context, accessibility_guidelines, elder_considerations, youth_considerations, literacy_support)
SELECT 
    c.id,
    'en',
    'Indigenous Community',
    jsonb_build_object(
        'colorMeanings', jsonb_build_object(
            'red', 'Sacred, life force',
            'white', 'Purity, peace',
            'black', 'Strength, determination',
            'yellow', 'Sun, enlightenment'
        ),
        'symbolInterpretations', jsonb_build_object(
            'circle', 'Unity, wholeness',
            'eagle', 'Spiritual messenger',
            'tree', 'Life, growth'
        ),
        'navigationPatterns', jsonb_build_array(
            'Circular navigation patterns preferred',
            'Visual hierarchy respects traditional layouts',
            'Sacred directions (North, South, East, West) considered'
        ),
        'communicationStyles', jsonb_build_array(
            'Storytelling approach to information',
            'Respect for silence and reflection time',
            'Community consensus in decision making'
        ),
        'respectfulInteractions', jsonb_build_array(
            'Acknowledge traditional territory',
            'Use appropriate cultural protocols',
            'Respect for elders and traditional knowledge'
        )
    ),
    ARRAY[
        'Larger text sizes for elder users',
        'High contrast options for vision changes',
        'Audio support for traditional oral communication',
        'Simplified navigation with clear landmarks',
        'Cultural protocol reminders and guidance'
    ],
    ARRAY[
        'Interactive elements for engagement',
        'Modern design balanced with traditional elements',
        'Mobile-first approach for youth accessibility',
        'Social sharing features with cultural respect',
        'Gamification elements that honor culture'
    ],
    jsonb_build_object(
        'audioSupport', true,
        'visualSupport', true,
        'simplifiedLanguage', true,
        'culturalMetaphors', true
    )
FROM communities c
WHERE c.name ILIKE '%indigenous%' OR c.name ILIKE '%first nation%' OR c.name ILIKE '%aboriginal%'
LIMIT 3;

-- Insert sample accessibility preferences for demonstration
INSERT INTO user_accessibility_preferences (
    user_id, 
    high_contrast, 
    large_text, 
    screen_reader, 
    keyboard_navigation,
    cultural_accessibility,
    assistive_technology
)
SELECT 
    u.id,
    (RANDOM() > 0.8)::BOOLEAN, -- 20% chance of high contrast
    (RANDOM() > 0.7)::BOOLEAN, -- 30% chance of large text
    (RANDOM() > 0.9)::BOOLEAN, -- 10% chance of screen reader
    (RANDOM() > 0.8)::BOOLEAN, -- 20% chance of keyboard navigation
    jsonb_build_object(
        'preferredLanguage', CASE WHEN RANDOM() > 0.8 THEN 'es' ELSE 'en' END,
        'culturalContext', CASE 
            WHEN RANDOM() > 0.7 THEN 'indigenous'
            WHEN RANDOM() > 0.5 THEN 'rural'
            ELSE 'general'
        END,
        'elderFriendlyMode', (RANDOM() > 0.85)::BOOLEAN,
        'youthMode', (RANDOM() > 0.8)::BOOLEAN
    ),
    jsonb_build_object(
        'voiceControl', (RANDOM() > 0.95)::BOOLEAN,
        'switchNavigation', (RANDOM() > 0.98)::BOOLEAN,
        'eyeTracking', (RANDOM() > 0.99)::BOOLEAN
    )
FROM auth.users u
WHERE u.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
LIMIT 20;

-- Insert sample accessibility feedback
INSERT INTO accessibility_feedback (
    user_id,
    component_id,
    page_url,
    feedback_type,
    severity,
    title,
    description,
    assistive_technology,
    cultural_context
)
SELECT 
    u.id,
    'story-viewer-' || (RANDOM() * 100)::INTEGER,
    '/stories/' || (RANDOM() * 1000)::INTEGER,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'barrier'
        WHEN RANDOM() > 0.5 THEN 'suggestion'
        WHEN RANDOM() > 0.3 THEN 'bug'
        ELSE 'praise'
    END,
    CASE 
        WHEN RANDOM() > 0.9 THEN 'critical'
        WHEN RANDOM() > 0.7 THEN 'high'
        WHEN RANDOM() > 0.4 THEN 'medium'
        ELSE 'low'
    END,
    CASE 
        WHEN RANDOM() > 0.5 THEN 'Keyboard navigation issue in story viewer'
        ELSE 'Screen reader compatibility problem'
    END,
    CASE 
        WHEN RANDOM() > 0.5 THEN 'Cannot navigate story content using only keyboard. Tab order is confusing and some elements are not focusable.'
        ELSE 'Screen reader does not announce story content properly. Missing ARIA labels and descriptions.'
    END,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'NVDA'
        WHEN RANDOM() > 0.5 THEN 'JAWS'
        WHEN RANDOM() > 0.3 THEN 'VoiceOver'
        ELSE NULL
    END,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'indigenous'
        WHEN RANDOM() > 0.5 THEN 'rural'
        ELSE 'general'
    END
FROM auth.users u
WHERE u.created_at > CURRENT_TIMESTAMP - INTERVAL '60 days'
LIMIT 10;

COMMENT ON TABLE user_accessibility_preferences IS 'Stores individual user accessibility preferences and settings';
COMMENT ON TABLE cultural_accessibility_guides IS 'Community-specific accessibility guidelines considering cultural context';
COMMENT ON TABLE audio_descriptions IS 'Audio descriptions for visual content to support users with visual impairments';
COMMENT ON TABLE accessibility_audits IS 'Results of accessibility audits performed on components and pages';
COMMENT ON TABLE accessibility_feedback IS 'User-reported accessibility issues and feedback';
COMMENT ON TABLE accessibility_training_records IS 'Records of accessibility training completion for staff and volunteers';