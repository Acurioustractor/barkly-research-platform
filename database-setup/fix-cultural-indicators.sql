-- Fix the cultural indicators function
CREATE OR REPLACE FUNCTION detect_cultural_indicators(content TEXT)
RETURNS JSONB AS $$
DECLARE
    cultural_indicators TEXT[] := ARRAY[]::TEXT[];
    cultural_entities JSONB := '{}';
    traditional_terms TEXT[] := ARRAY['traditional', 'indigenous', 'aboriginal', 'native', 'tribal', 'ancestral', 'elder', 'ceremony', 'ritual', 'sacred', 'spiritual', 'cultural', 'heritage', 'customs', 'beliefs', 'practices', 'knowledge', 'wisdom', 'storytelling', 'oral', 'tradition'];
    content_lower TEXT;
    term TEXT;
    sensitivity_level TEXT := 'community';
BEGIN
    content_lower := lower(content);
    
    -- Check for traditional/cultural terms
    FOREACH term IN ARRAY traditional_terms
    LOOP
        IF content_lower LIKE '%' || term || '%' THEN
            cultural_indicators := array_append(cultural_indicators, term);
            
            -- Determine sensitivity level
            IF term IN ('sacred', 'ceremony', 'ritual', 'spiritual') THEN
                sensitivity_level := 'sacred';
            ELSIF term IN ('elder', 'traditional', 'ancestral') THEN
                sensitivity_level := 'restricted';
            END IF;
        END IF;
    END LOOP;
    
    -- Build cultural entities object
    cultural_entities := jsonb_build_object(
        'indicators', cultural_indicators,
        'sensitivity_level', sensitivity_level,
        'requires_elder_review', sensitivity_level IN ('sacred', 'ceremonial'),
        'traditional_knowledge', array_length(cultural_indicators, 1) > 2
    );
    
    RETURN cultural_entities;
END;
$$ LANGUAGE plpgsql;

SELECT 'Cultural indicators function fixed' as status;