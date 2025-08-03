-- Cultural Context Database Schema
-- This schema supports cultural contextualization of intelligence insights

-- Cultural Contexts Table
-- Stores cultural context information for each community
CREATE TABLE cultural_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    language_group VARCHAR(255) NOT NULL,
    traditional_name VARCHAR(255),
    cultural_protocols TEXT[] DEFAULT '{}',
    sacred_sites TEXT[] DEFAULT '{}',
    cultural_practices TEXT[] DEFAULT '{}',
    storytelling_protocols TEXT[] DEFAULT '{}',
    knowledge_keepers TEXT[] DEFAULT '{}',
    seasonal_considerations TEXT[] DEFAULT '{}',
    gender_protocols TEXT[] DEFAULT '{}',
    age_group_protocols TEXT[] DEFAULT '{}',
    visualization_preferences JSONB DEFAULT '{
        "colorScheme": "earth-tones",
        "symbolism": [],
        "avoidedSymbols": [],
        "preferredLayouts": []
    }',
    language_preferences JSONB DEFAULT '{
        "primaryLanguage": "English",
        "secondaryLanguages": [],
        "culturalTerms": {},
        "avoidedTerms": []
    }',
    access_restrictions JSONB DEFAULT '{
        "menOnly": [],
        "womenOnly": [],
        "eldersOnly": [],
        "initiatedOnly": [],
        "communityOnly": []
    }',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(community_id)
);

-- Cultural Lenses Table
-- Defines different cultural perspectives and filters for intelligence
CREATE TABLE cultural_lenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    filter_criteria JSONB DEFAULT '{
        "contentTypes": [],
        "themes": [],
        "sensitivity": "public",
        "requiredApprovals": []
    }',
    transformation_rules JSONB DEFAULT '{
        "terminology": {},
        "contextualFraming": [],
        "culturalNarrative": "",
        "respectfulPresentation": []
    }',
    visualization_rules JSONB DEFAULT '{
        "colorMappings": {},
        "symbolReplacements": {},
        "layoutPreferences": [],
        "culturalElements": []
    }',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(255),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cultural Knowledge Classifications
-- Classifies different types of traditional knowledge and their protection levels
CREATE TABLE cultural_knowledge_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    knowledge_type VARCHAR(100) NOT NULL,
    classification_level VARCHAR(50) NOT NULL CHECK (classification_level IN ('public', 'community', 'restricted', 'sacred')),
    description TEXT,
    access_requirements TEXT[],
    sharing_protocols TEXT[],
    protection_measures TEXT[],
    knowledge_keepers TEXT[],
    seasonal_restrictions TEXT[],
    gender_restrictions TEXT[],
    age_restrictions TEXT[],
    initiation_requirements TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cultural Terminology Dictionary
-- Maps standard terms to culturally appropriate alternatives
CREATE TABLE cultural_terminology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    standard_term VARCHAR(255) NOT NULL,
    cultural_term VARCHAR(255) NOT NULL,
    context VARCHAR(255),
    usage_notes TEXT,
    sensitivity_level VARCHAR(50) DEFAULT 'public' CHECK (sensitivity_level IN ('public', 'community', 'restricted', 'sacred')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cultural Symbols and Visual Elements
-- Defines culturally appropriate symbols and visual elements
CREATE TABLE cultural_visual_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL CHECK (element_type IN ('symbol', 'color', 'pattern', 'layout', 'icon')),
    element_name VARCHAR(255) NOT NULL,
    element_data JSONB, -- Stores visual element data (colors, SVG paths, etc.)
    cultural_significance TEXT,
    usage_context TEXT[],
    restrictions TEXT[],
    seasonal_usage TEXT[],
    ceremonial_only BOOLEAN DEFAULT false,
    gender_specific BOOLEAN DEFAULT false,
    age_appropriate_from INTEGER,
    requires_permission BOOLEAN DEFAULT false,
    permission_authority VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cultural Content Reviews
-- Tracks cultural review and approval of intelligence insights
CREATE TABLE cultural_content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_role VARCHAR(100) NOT NULL,
    reviewer_authority VARCHAR(255),
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('cultural_sensitivity', 'traditional_knowledge', 'access_control', 'terminology', 'visual_elements')),
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'conditional')),
    review_notes TEXT,
    required_changes TEXT[],
    cultural_concerns TEXT[],
    recommendations TEXT[],
    approval_conditions TEXT[],
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cultural Context Applications
-- Tracks when cultural context is applied to insights
CREATE TABLE cultural_context_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id VARCHAR(255) NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    cultural_context_id UUID NOT NULL REFERENCES cultural_contexts(id),
    applied_lenses UUID[] DEFAULT '{}',
    contextualization_data JSONB,
    access_control_applied JSONB,
    traditional_knowledge_flags JSONB,
    applied_by VARCHAR(255),
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Cultural Sensitivity Alerts
-- Tracks alerts for potentially culturally sensitive content
CREATE TABLE cultural_sensitivity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('terminology', 'sacred_content', 'restricted_knowledge', 'visual_elements', 'access_violation')),
    alert_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
    alert_description TEXT NOT NULL,
    detected_elements TEXT[],
    recommended_actions TEXT[],
    requires_review BOOLEAN DEFAULT true,
    assigned_reviewer VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cultural_contexts_community ON cultural_contexts(community_id);
CREATE INDEX idx_cultural_lenses_community ON cultural_lenses(community_id);
CREATE INDEX idx_cultural_lenses_active ON cultural_lenses(is_active);
CREATE INDEX idx_cultural_knowledge_community ON cultural_knowledge_classifications(community_id);
CREATE INDEX idx_cultural_knowledge_type ON cultural_knowledge_classifications(knowledge_type);
CREATE INDEX idx_cultural_knowledge_level ON cultural_knowledge_classifications(classification_level);
CREATE INDEX idx_cultural_terminology_community ON cultural_terminology(community_id);
CREATE INDEX idx_cultural_terminology_standard ON cultural_terminology(standard_term);
CREATE INDEX idx_cultural_terminology_cultural ON cultural_terminology(cultural_term);
CREATE INDEX idx_cultural_visual_community ON cultural_visual_elements(community_id);
CREATE INDEX idx_cultural_visual_type ON cultural_visual_elements(element_type);
CREATE INDEX idx_cultural_reviews_content ON cultural_content_reviews(content_id, content_type);
CREATE INDEX idx_cultural_reviews_community ON cultural_content_reviews(community_id);
CREATE INDEX idx_cultural_reviews_status ON cultural_content_reviews(review_status);
CREATE INDEX idx_cultural_applications_insight ON cultural_context_applications(insight_id);
CREATE INDEX idx_cultural_applications_community ON cultural_context_applications(community_id);
CREATE INDEX idx_cultural_alerts_content ON cultural_sensitivity_alerts(content_id, content_type);
CREATE INDEX idx_cultural_alerts_community ON cultural_sensitivity_alerts(community_id);
CREATE INDEX idx_cultural_alerts_status ON cultural_sensitivity_alerts(status);
CREATE INDEX idx_cultural_alerts_level ON cultural_sensitivity_alerts(alert_level);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_cultural_contexts_updated_at BEFORE UPDATE ON cultural_contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_lenses_updated_at BEFORE UPDATE ON cultural_lenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_knowledge_updated_at BEFORE UPDATE ON cultural_knowledge_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_terminology_updated_at BEFORE UPDATE ON cultural_terminology FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_visual_updated_at BEFORE UPDATE ON cultural_visual_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_reviews_updated_at BEFORE UPDATE ON cultural_content_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cultural_alerts_updated_at BEFORE UPDATE ON cultural_sensitivity_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to detect culturally sensitive content
CREATE OR REPLACE FUNCTION detect_cultural_sensitivity(
    p_content TEXT,
    p_community_id UUID
)
RETURNS TABLE (
    alert_type VARCHAR(50),
    alert_level VARCHAR(20),
    detected_elements TEXT[],
    recommendations TEXT[]
) AS $$
DECLARE
    context_record RECORD;
    terminology_record RECORD;
    visual_record RECORD;
    knowledge_record RECORD;
    alerts_found INTEGER := 0;
BEGIN
    -- Get cultural context
    SELECT * INTO context_record FROM cultural_contexts WHERE community_id = p_community_id;
    
    IF context_record IS NULL THEN
        RETURN;
    END IF;
    
    -- Check for avoided terms
    IF context_record.language_preferences->'avoidedTerms' IS NOT NULL THEN
        FOR terminology_record IN 
            SELECT jsonb_array_elements_text(context_record.language_preferences->'avoidedTerms') as avoided_term
        LOOP
            IF LOWER(p_content) LIKE '%' || LOWER(terminology_record.avoided_term) || '%' THEN
                alert_type := 'terminology';
                alert_level := 'high';
                detected_elements := ARRAY[terminology_record.avoided_term];
                recommendations := ARRAY['Review terminology usage', 'Consider cultural alternative'];
                alerts_found := alerts_found + 1;
                RETURN NEXT;
            END IF;
        END LOOP;
    END IF;
    
    -- Check for sacred sites
    IF context_record.sacred_sites IS NOT NULL THEN
        FOR i IN 1..array_length(context_record.sacred_sites, 1) LOOP
            IF LOWER(p_content) LIKE '%' || LOWER(context_record.sacred_sites[i]) || '%' THEN
                alert_type := 'sacred_content';
                alert_level := 'critical';
                detected_elements := ARRAY[context_record.sacred_sites[i]];
                recommendations := ARRAY['Requires elder review', 'May need access restrictions'];
                alerts_found := alerts_found + 1;
                RETURN NEXT;
            END IF;
        END LOOP;
    END IF;
    
    -- Check for restricted cultural practices
    IF context_record.cultural_practices IS NOT NULL THEN
        FOR i IN 1..array_length(context_record.cultural_practices, 1) LOOP
            IF LOWER(p_content) LIKE '%' || LOWER(context_record.cultural_practices[i]) || '%' THEN
                alert_type := 'restricted_knowledge';
                alert_level := 'high';
                detected_elements := ARRAY[context_record.cultural_practices[i]];
                recommendations := ARRAY['Verify sharing permissions', 'Check traditional knowledge protocols'];
                alerts_found := alerts_found + 1;
                RETURN NEXT;
            END IF;
        END LOOP;
    END IF;
    
    -- Check for gender-restricted content
    IF context_record.access_restrictions->'menOnly' IS NOT NULL THEN
        FOR terminology_record IN 
            SELECT jsonb_array_elements_text(context_record.access_restrictions->'menOnly') as restricted_term
        LOOP
            IF LOWER(p_content) LIKE '%' || LOWER(terminology_record.restricted_term) || '%' THEN
                alert_type := 'access_violation';
                alert_level := 'high';
                detected_elements := ARRAY[terminology_record.restricted_term];
                recommendations := ARRAY['Apply gender-based access controls', 'Review with cultural authority'];
                alerts_found := alerts_found + 1;
                RETURN NEXT;
            END IF;
        END LOOP;
    END IF;
    
    IF context_record.access_restrictions->'womenOnly' IS NOT NULL THEN
        FOR terminology_record IN 
            SELECT jsonb_array_elements_text(context_record.access_restrictions->'womenOnly') as restricted_term
        LOOP
            IF LOWER(p_content) LIKE '%' || LOWER(terminology_record.restricted_term) || '%' THEN
                alert_type := 'access_violation';
                alert_level := 'high';
                detected_elements := ARRAY[terminology_record.restricted_term];
                recommendations := ARRAY['Apply gender-based access controls', 'Review with cultural authority'];
                alerts_found := alerts_found + 1;
                RETURN NEXT;
            END IF;
        END LOOP;
    END IF;
    
    -- If no specific alerts found but content mentions cultural elements, flag for review
    IF alerts_found = 0 AND (
        LOWER(p_content) LIKE '%traditional%' OR 
        LOWER(p_content) LIKE '%cultural%' OR 
        LOWER(p_content) LIKE '%ceremony%' OR 
        LOWER(p_content) LIKE '%sacred%'
    ) THEN
        alert_type := 'cultural_sensitivity';
        alert_level := 'medium';
        detected_elements := ARRAY['Cultural content detected'];
        recommendations := ARRAY['Consider cultural review', 'Verify appropriate context'];
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to apply cultural terminology transformations
CREATE OR REPLACE FUNCTION apply_cultural_terminology(
    p_content TEXT,
    p_community_id UUID
)
RETURNS TEXT AS $$
DECLARE
    transformed_content TEXT := p_content;
    term_record RECORD;
BEGIN
    -- Apply cultural terminology replacements
    FOR term_record IN 
        SELECT standard_term, cultural_term 
        FROM cultural_terminology 
        WHERE community_id = p_community_id 
        AND is_active = true
        ORDER BY LENGTH(standard_term) DESC -- Replace longer terms first
    LOOP
        transformed_content := regexp_replace(
            transformed_content, 
            term_record.standard_term, 
            term_record.cultural_term, 
            'gi'
        );
    END LOOP;
    
    RETURN transformed_content;
END;
$$ LANGUAGE plpgsql;

-- Function to get cultural color scheme
CREATE OR REPLACE FUNCTION get_cultural_color_scheme(p_community_id UUID)
RETURNS JSONB AS $$
DECLARE
    context_record RECORD;
    color_scheme JSONB;
BEGIN
    SELECT visualization_preferences INTO context_record 
    FROM cultural_contexts 
    WHERE community_id = p_community_id;
    
    IF context_record IS NULL THEN
        -- Return default earth-tones scheme
        RETURN '{
            "primary": "#8B4513",
            "secondary": "#D2691E", 
            "accent": "#CD853F",
            "background": "#F5E6D3",
            "text": "#3E2723"
        }'::jsonb;
    END IF;
    
    -- Map color scheme names to actual colors
    CASE context_record.visualization_preferences->>'colorScheme'
        WHEN 'ochre-red' THEN
            color_scheme := '{
                "primary": "#CC5500",
                "secondary": "#FF6600",
                "accent": "#FF8C42", 
                "background": "#FFF8DC",
                "text": "#8B0000"
            }'::jsonb;
        WHEN 'desert-sand' THEN
            color_scheme := '{
                "primary": "#C19A6B",
                "secondary": "#DEB887",
                "accent": "#F4A460",
                "background": "#FDF5E6", 
                "text": "#8B4513"
            }'::jsonb;
        WHEN 'river-blue' THEN
            color_scheme := '{
                "primary": "#4682B4",
                "secondary": "#87CEEB",
                "accent": "#B0E0E6",
                "background": "#F0F8FF",
                "text": "#191970"
            }'::jsonb;
        ELSE
            -- Default earth-tones
            color_scheme := '{
                "primary": "#8B4513",
                "secondary": "#D2691E",
                "accent": "#CD853F", 
                "background": "#F5E6D3",
                "text": "#3E2723"
            }'::jsonb;
    END CASE;
    
    RETURN color_scheme;
END;
$$ LANGUAGE plpgsql;

-- Insert sample cultural contexts
INSERT INTO cultural_contexts (community_id, language_group, traditional_name, cultural_protocols, sacred_sites, cultural_practices, storytelling_protocols, knowledge_keepers, visualization_preferences, language_preferences) 
SELECT 
    c.id,
    'Warumungu',
    'Warumungu Country',
    ARRAY['Respect for elders', 'Permission for sacred sites', 'Gender-appropriate sharing'],
    ARRAY['Tennant Creek', 'Devil''s Marbles', 'Sacred water holes'],
    ARRAY['Traditional hunting', 'Ceremony', 'Dreamtime stories', 'Bush medicine'],
    ARRAY['Elder approval required', 'Seasonal restrictions apply', 'Gender-specific stories'],
    ARRAY['Elder Mary', 'Uncle Jim', 'Aunty Sarah'],
    '{
        "colorScheme": "earth-tones",
        "symbolism": ["boomerang", "tracks", "water"],
        "avoidedSymbols": ["sacred symbols"],
        "preferredLayouts": ["circular", "traditional"]
    }'::jsonb,
    '{
        "primaryLanguage": "English",
        "secondaryLanguages": ["Warumungu"],
        "culturalTerms": {
            "country": "Country",
            "community": "mob",
            "elder": "Old People",
            "story": "yarn"
        },
        "avoidedTerms": ["primitive", "tribe"]
    }'::jsonb
FROM communities c 
WHERE c.name LIKE '%Tennant Creek%' OR c.name LIKE '%Barkly%'
LIMIT 1;

-- Insert sample cultural lenses
INSERT INTO cultural_lenses (name, description, community_id, filter_criteria, transformation_rules, visualization_rules)
SELECT 
    'Traditional Knowledge Lens',
    'Applies traditional knowledge protocols and respectful language',
    cc.community_id,
    '{
        "contentTypes": ["insight", "analysis", "story"],
        "themes": ["cultural", "traditional", "ceremony"],
        "sensitivity": "community",
        "requiredApprovals": ["elder_review"]
    }'::jsonb,
    '{
        "terminology": {
            "aboriginal": "First Nations",
            "tribe": "community",
            "primitive": "traditional"
        },
        "contextualFraming": ["From a traditional perspective", "According to cultural knowledge"],
        "culturalNarrative": "This insight reflects traditional knowledge and should be understood within cultural context",
        "respectfulPresentation": ["Acknowledge traditional owners", "Respect cultural protocols"]
    }'::jsonb,
    '{
        "colorMappings": {"primary": "earth-tones"},
        "symbolReplacements": {},
        "layoutPreferences": ["circular", "traditional"],
        "culturalElements": ["traditional-border", "cultural-symbols"]
    }'::jsonb
FROM cultural_contexts cc
LIMIT 1;

COMMENT ON TABLE cultural_contexts IS 'Cultural context information for communities';
COMMENT ON TABLE cultural_lenses IS 'Cultural perspectives and filters for intelligence';
COMMENT ON TABLE cultural_knowledge_classifications IS 'Classifications of traditional knowledge types';
COMMENT ON TABLE cultural_terminology IS 'Mapping of standard terms to culturally appropriate alternatives';
COMMENT ON TABLE cultural_visual_elements IS 'Culturally appropriate visual elements and symbols';
COMMENT ON TABLE cultural_content_reviews IS 'Cultural review and approval tracking';
COMMENT ON TABLE cultural_context_applications IS 'Tracking of cultural context applications';
COMMENT ON TABLE cultural_sensitivity_alerts IS 'Alerts for potentially culturally sensitive content';