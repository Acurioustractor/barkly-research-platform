-- =====================================================
-- TASK 7 - STEP 2: Document Quotes with Cultural Sensitivity
-- AI-Extracted Quotes and Citations System
-- =====================================================

-- Create document quotes table for AI-extracted significant passages
CREATE TABLE IF NOT EXISTS document_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Document and Chunk Context
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Quote Content
    quote_text TEXT NOT NULL,
    quote_context TEXT, -- Surrounding context for better understanding
    quote_length INTEGER NOT NULL,
    
    -- Position Information
    start_position INTEGER,
    end_position INTEGER,
    page_number INTEGER,
    paragraph_number INTEGER,
    
    -- AI Analysis Results
    significance_score DECIMAL(5,4) NOT NULL CHECK (significance_score >= 0.0 AND significance_score <= 1.0),
    relevance_score DECIMAL(5,4) NOT NULL CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    uniqueness_score DECIMAL(5,4) DEFAULT 0.0 CHECK (uniqueness_score >= 0.0 AND uniqueness_score <= 1.0),
    emotional_intensity DECIMAL(5,4) DEFAULT 0.0 CHECK (emotional_intensity >= 0.0 AND emotional_intensity <= 1.0),
    
    -- Quote Classification
    quote_type TEXT DEFAULT 'general'
        CHECK (quote_type IN ('general', 'key_insight', 'definition', 'example', 'evidence', 'opinion', 'fact', 'story', 'teaching', 'wisdom')),
    quote_category TEXT DEFAULT 'content'
        CHECK (quote_category IN ('content', 'methodology', 'conclusion', 'background', 'discussion', 'recommendation')),
    
    -- Thematic Connections
    related_themes UUID[] DEFAULT '{}', -- Array of theme IDs this quote supports
    primary_theme_id UUID REFERENCES document_themes(id),
    theme_relevance_scores JSONB DEFAULT '{}', -- Theme ID -> relevance score mapping
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    cultural_indicators TEXT[] DEFAULT '{}',
    traditional_knowledge_quote BOOLEAN DEFAULT false,
    contains_sacred_content BOOLEAN DEFAULT false,
    requires_elder_approval BOOLEAN DEFAULT false,
    elder_approved BOOLEAN DEFAULT false,
    elder_approved_by UUID, -- Reference to user who approved
    elder_approved_at TIMESTAMPTZ,
    elder_notes TEXT,
    cultural_protocols JSONB DEFAULT '{}',
    
    -- Speaker/Source Information (if identifiable)
    speaker_name TEXT,
    speaker_role TEXT,
    speaker_community TEXT,
    is_direct_quote BOOLEAN DEFAULT false,
    attribution_confidence DECIMAL(5,4) DEFAULT 0.0,
    
    -- AI Model Information
    ai_model_name TEXT NOT NULL,
    ai_model_version TEXT,
    extraction_method TEXT DEFAULT 'significance_scoring',
    extraction_parameters JSONB DEFAULT '{}',
    
    -- Quality and Validation
    human_validated BOOLEAN DEFAULT false,
    validation_score DECIMAL(5,4),
    validation_notes TEXT,
    flagged_for_review BOOLEAN DEFAULT false,
    review_reason TEXT,
    
    -- Usage and Citation
    citation_count INTEGER DEFAULT 0,
    usage_contexts TEXT[] DEFAULT '{}',
    research_value TEXT DEFAULT 'medium'
        CHECK (research_value IN ('low', 'medium', 'high', 'critical')),
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'needs_review', 'approved', 'rejected')),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (start_position <= end_position),
    CHECK (quote_length > 0),
    CHECK (citation_count >= 0)
);

-- Create quote relationships table for connecting related quotes
CREATE TABLE IF NOT EXISTS quote_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_quote_id UUID NOT NULL REFERENCES document_quotes(id) ON DELETE CASCADE,
    target_quote_id UUID NOT NULL REFERENCES document_quotes(id) ON DELETE CASCADE,
    
    -- Relationship Type
    relationship_type TEXT NOT NULL
        CHECK (relationship_type IN ('supports', 'contradicts', 'elaborates', 'examples', 'follows', 'precedes', 'similar_meaning', 'cultural_connection', 'speaker_connection')),
    
    -- Relationship Strength
    strength DECIMAL(5,4) NOT NULL CHECK (strength >= 0.0 AND strength <= 1.0),
    confidence DECIMAL(5,4) DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Cultural Context
    cultural_significance TEXT,
    cultural_justification TEXT,
    requires_cultural_review BOOLEAN DEFAULT false,
    
    -- AI Detection
    detected_by_model TEXT,
    detection_confidence DECIMAL(5,4) DEFAULT 1.0,
    supporting_evidence JSONB DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source_quote_id, target_quote_id, relationship_type),
    CHECK (source_quote_id != target_quote_id)
);

-- Create quote annotations table for additional metadata
CREATE TABLE IF NOT EXISTS quote_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES document_quotes(id) ON DELETE CASCADE,
    
    -- Annotation Information
    annotation_type TEXT NOT NULL
        CHECK (annotation_type IN ('explanation', 'context', 'translation', 'cultural_note', 'methodology_note', 'warning', 'clarification')),
    annotation_text TEXT NOT NULL,
    annotation_language TEXT DEFAULT 'en',
    
    -- Cultural Context
    cultural_annotation BOOLEAN DEFAULT false,
    requires_elder_input BOOLEAN DEFAULT false,
    traditional_knowledge_note BOOLEAN DEFAULT false,
    
    -- Source Information
    annotated_by UUID, -- User who created annotation
    annotation_source TEXT DEFAULT 'ai_analysis',
    source_confidence DECIMAL(5,4) DEFAULT 1.0,
    
    -- Validation
    validated BOOLEAN DEFAULT false,
    validated_by UUID,
    validated_at TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Document quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_document_significance ON document_quotes(document_id, significance_score DESC, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_chunk_position ON document_quotes(chunk_id, start_position, end_position);
CREATE INDEX IF NOT EXISTS idx_quotes_community_cultural ON document_quotes(community_id, cultural_significance, requires_elder_approval);
CREATE INDEX IF NOT EXISTS idx_quotes_processing_status ON document_quotes(processing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_ai_model ON document_quotes(ai_model_name, ai_model_version, created_at DESC);

-- Quote search indexes
CREATE INDEX IF NOT EXISTS idx_quotes_text_search ON document_quotes 
    USING gin(to_tsvector('english', quote_text));
CREATE INDEX IF NOT EXISTS idx_quotes_cultural_indicators ON document_quotes USING gin(cultural_indicators);
CREATE INDEX IF NOT EXISTS idx_quotes_related_themes ON document_quotes USING gin(related_themes);

-- Quote classification indexes
CREATE INDEX IF NOT EXISTS idx_quotes_type_category ON document_quotes(quote_type, quote_category, significance_score DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_research_value ON document_quotes(research_value, community_id, significance_score DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_speaker ON document_quotes(speaker_name, speaker_community) WHERE speaker_name IS NOT NULL;

-- Quote relationships indexes
CREATE INDEX IF NOT EXISTS idx_quote_relationships_source ON quote_relationships(source_quote_id, relationship_type, strength DESC);
CREATE INDEX IF NOT EXISTS idx_quote_relationships_target ON quote_relationships(target_quote_id, relationship_type, strength DESC);
CREATE INDEX IF NOT EXISTS idx_quote_relationships_strength ON quote_relationships(strength DESC, confidence DESC);

-- Quote annotations indexes
CREATE INDEX IF NOT EXISTS idx_quote_annotations_quote ON quote_annotations(quote_id, annotation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_annotations_cultural ON quote_annotations(cultural_annotation, traditional_knowledge_note, requires_elder_input);
CREATE INDEX IF NOT EXISTS idx_quote_annotations_validation ON quote_annotations(validated, validated_at DESC);

SELECT 'Document quotes tables and indexes created successfully' as status;