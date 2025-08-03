-- =====================================================
-- TASK 6 - STEP 4: Chunk-Level Access Controls & Entity Extraction
-- =====================================================

-- Enable RLS on chunk tables
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_topics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CHUNK RLS POLICIES
-- =====================================================

-- Policy: Community members can view community chunks
DROP POLICY IF EXISTS "Community members can view community chunks" ON document_chunks;
CREATE POLICY "Community members can view community chunks" ON document_chunks
    FOR SELECT USING (
        is_authenticated() AND (
            community_id = get_user_community_id()
            OR is_community_admin(community_id)
            OR EXISTS (
                SELECT 1 FROM documents d 
                WHERE d.id = document_chunks.document_id 
                AND d.is_public = true 
                AND d.access_level = 'public'
                AND cultural_sensitivity_level IN ('public', 'community')
            )
        )
    );

-- Policy: Sacred content requires special access
DROP POLICY IF EXISTS "Sacred chunks require elder approval" ON document_chunks;
CREATE POLICY "Sacred chunks require elder approval" ON document_chunks
    FOR SELECT USING (
        is_authenticated() AND (
            cultural_sensitivity_level NOT IN ('sacred', 'ceremonial')
            OR (
                cultural_sensitivity_level IN ('sacred', 'ceremonial')
                AND is_community_admin(community_id)
            )
        )
    );

-- Policy: Community members can create chunks
DROP POLICY IF EXISTS "Community members can create chunks" ON document_chunks;
CREATE POLICY "Community members can create chunks" ON document_chunks
    FOR INSERT WITH CHECK (
        is_authenticated() AND 
        community_id = get_user_community_id()
    );

-- =====================================================
-- CHUNK RELATIONSHIPS RLS POLICIES
-- =====================================================

-- Policy: Users can view chunk relationships they have access to
DROP POLICY IF EXISTS "Users can view accessible chunk relationships" ON chunk_relationships;
CREATE POLICY "Users can view accessible chunk relationships" ON chunk_relationships
    FOR SELECT USING (
        is_authenticated() AND (
            EXISTS (
                SELECT 1 FROM document_chunks dc 
                WHERE dc.id = chunk_relationships.source_chunk_id 
                AND (
                    dc.community_id = get_user_community_id()
                    OR is_community_admin(dc.community_id)
                )
            )
            OR EXISTS (
                SELECT 1 FROM document_chunks dc 
                WHERE dc.id = chunk_relationships.target_chunk_id 
                AND (
                    dc.community_id = get_user_community_id()
                    OR is_community_admin(dc.community_id)
                )
            )
        )
    );

-- =====================================================
-- CHUNK TOPICS RLS POLICIES
-- =====================================================

-- Policy: Users can view chunk topics for accessible chunks
DROP POLICY IF EXISTS "Users can view accessible chunk topics" ON chunk_topics;
CREATE POLICY "Users can view accessible chunk topics" ON chunk_topics
    FOR SELECT USING (
        is_authenticated() AND EXISTS (
            SELECT 1 FROM document_chunks dc 
            WHERE dc.id = chunk_topics.chunk_id 
            AND (
                dc.community_id = get_user_community_id()
                OR is_community_admin(dc.community_id)
            )
        )
    );

-- =====================================================
-- ENTITY EXTRACTION FUNCTIONS
-- =====================================================

-- Function to extract named entities (simplified version)
CREATE OR REPLACE FUNCTION extract_entities(content TEXT)
RETURNS JSONB AS $$
DECLARE
    entities JSONB := '{}';
    people TEXT[] := ARRAY[]::TEXT[];
    places TEXT[] := ARRAY[]::TEXT[];
    organizations TEXT[] := ARRAY[]::TEXT[];
    cultural_terms TEXT[] := ARRAY[]::TEXT[];
    
    -- Simple patterns for entity detection
    person_pattern TEXT := '\b[A-Z][a-z]+ [A-Z][a-z]+\b'; -- First Last
    place_pattern TEXT := '\b[A-Z][a-z]+ (River|Creek|Mountain|Valley|Lake|Island|Territory|Nation|Community)\b';
    org_pattern TEXT := '\b[A-Z][a-z]+ (University|Institute|Council|Association|Foundation|Corporation|Ltd|Inc)\b';
    cultural_pattern TEXT := '\b(ceremony|ritual|dreamtime|songline|totem|clan|tribe|nation|country|law|protocol)\b';
    
    matches TEXT[];
    match TEXT;
BEGIN
    -- Extract people (simple pattern matching)
    matches := regexp_split_to_array(content, person_pattern, 'g');
    FOR i IN 1..array_length(matches, 1) LOOP
        match := trim(matches[i]);
        IF length(match) > 0 AND match ~ person_pattern THEN
            people := array_append(people, match);
        END IF;
    END LOOP;
    
    -- Extract places
    SELECT array_agg(DISTINCT match) INTO places
    FROM regexp_split_to_table(content, place_pattern, 'gi') AS match
    WHERE match ~ place_pattern;
    
    -- Extract organizations
    SELECT array_agg(DISTINCT match) INTO organizations
    FROM regexp_split_to_table(content, org_pattern, 'gi') AS match
    WHERE match ~ org_pattern;
    
    -- Extract cultural terms
    SELECT array_agg(DISTINCT lower(match)) INTO cultural_terms
    FROM regexp_split_to_table(content, cultural_pattern, 'gi') AS match
    WHERE match ~ cultural_pattern;
    
    -- Build entities object
    entities := jsonb_build_object(
        'people', COALESCE(people, ARRAY[]::TEXT[]),
        'places', COALESCE(places, ARRAY[]::TEXT[]),
        'organizations', COALESCE(organizations, ARRAY[]::TEXT[]),
        'cultural_terms', COALESCE(cultural_terms, ARRAY[]::TEXT[]),
        'extracted_at', NOW()
    );
    
    RETURN entities;
END;
$$ LANGUAGE plpgsql;

-- Function to update chunk entities
CREATE OR REPLACE FUNCTION update_chunk_entities(p_chunk_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    chunk_content TEXT;
    extracted_entities JSONB;
BEGIN
    -- Get chunk content
    SELECT content INTO chunk_content 
    FROM document_chunks 
    WHERE id = p_chunk_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Extract entities
    extracted_entities := extract_entities(chunk_content);
    
    -- Update chunk with entities
    UPDATE document_chunks 
    SET entities = extracted_entities,
        updated_at = NOW()
    WHERE id = p_chunk_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to create chunk relationships based on entity overlap
CREATE OR REPLACE FUNCTION create_entity_relationships(p_chunk_id UUID)
RETURNS INTEGER AS $$
DECLARE
    source_chunk RECORD;
    target_chunk RECORD;
    relationship_count INTEGER := 0;
    shared_entities INTEGER;
    similarity_score DECIMAL(5,4);
BEGIN
    -- Get source chunk
    SELECT * INTO source_chunk FROM document_chunks WHERE id = p_chunk_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Find chunks with shared entities
    FOR target_chunk IN 
        SELECT * FROM document_chunks 
        WHERE id != p_chunk_id 
        AND community_id = source_chunk.community_id
        AND processing_status = 'completed'
        AND entities IS NOT NULL
    LOOP
        -- Count shared entities
        shared_entities := 0;
        
        -- Check for shared people
        IF (source_chunk.entities->'people') ? (target_chunk.entities->'people') THEN
            shared_entities := shared_entities + 1;
        END IF;
        
        -- Check for shared places
        IF (source_chunk.entities->'places') ? (target_chunk.entities->'places') THEN
            shared_entities := shared_entities + 1;
        END IF;
        
        -- Check for shared cultural terms
        IF (source_chunk.entities->'cultural_terms') ? (target_chunk.entities->'cultural_terms') THEN
            shared_entities := shared_entities + 2; -- Weight cultural terms higher
        END IF;
        
        -- Create relationship if significant overlap
        IF shared_entities >= 1 THEN
            similarity_score := least(shared_entities::DECIMAL / 5.0, 1.0);
            
            INSERT INTO chunk_relationships (
                source_chunk_id,
                target_chunk_id,
                relationship_type,
                similarity_score,
                confidence,
                created_by_model
            ) VALUES (
                p_chunk_id,
                target_chunk.id,
                'entity_shared',
                similarity_score,
                0.8,
                'entity_extraction_v1'
            ) ON CONFLICT (source_chunk_id, target_chunk_id, relationship_type) DO NOTHING;
            
            relationship_count := relationship_count + 1;
        END IF;
    END LOOP;
    
    RETURN relationship_count;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to chunk tables
DROP TRIGGER IF EXISTS document_chunks_audit_trigger ON document_chunks;
CREATE TRIGGER document_chunks_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_chunks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS chunk_relationships_audit_trigger ON chunk_relationships;
CREATE TRIGGER chunk_relationships_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON chunk_relationships
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS chunk_topics_audit_trigger ON chunk_topics;
CREATE TRIGGER chunk_topics_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON chunk_topics
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add update trigger for chunks
DROP TRIGGER IF EXISTS document_chunks_updated_at ON document_chunks;
CREATE TRIGGER document_chunks_updated_at
    BEFORE UPDATE ON document_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Chunk security and entity extraction implemented successfully' as status;