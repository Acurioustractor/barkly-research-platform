-- =====================================================
-- TASK 7 - STEP 1: Document Themes with AI Analysis
-- Create AI Analysis Results Storage System
-- =====================================================

-- Create document themes table for AI-generated insights
CREATE TABLE IF NOT EXISTS document_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Document and Community Context
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Theme Information
    theme_name TEXT NOT NULL,
    theme_slug TEXT NOT NULL,
    theme_description TEXT,
    theme_category TEXT DEFAULT 'general'
        CHECK (theme_category IN ('general', 'cultural', 'social', 'environmental', 'economic', 'political', 'spiritual', 'historical', 'methodological')),
    
    -- AI Analysis Results
    confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    relevance_score DECIMAL(5,4) NOT NULL CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    prominence_score DECIMAL(5,4) DEFAULT 0.0 CHECK (prominence_score >= 0.0 AND prominence_score <= 1.0),
    
    -- Supporting Evidence
    supporting_chunks UUID[] DEFAULT '{}', -- Array of chunk IDs that support this theme
    key_phrases TEXT[] DEFAULT '{}',
    evidence_count INTEGER DEFAULT 0,
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    traditional_knowledge_theme BOOLEAN DEFAULT false,
    cultural_protocols JSONB DEFAULT '{}',
    requires_elder_review BOOLEAN DEFAULT false,
    elder_reviewed BOOLEAN DEFAULT false,
    elder_reviewed_by UUID, -- Reference to user who reviewed
    elder_reviewed_at TIMESTAMPTZ,
    elder_notes TEXT,
    
    -- AI Model Information
    ai_model_name TEXT NOT NULL,
    ai_model_version TEXT,
    analysis_method TEXT DEFAULT 'topic_modeling',
    model_parameters JSONB DEFAULT '{}',
    
    -- Quality Metrics
    coherence_score DECIMAL(5,4),
    consistency_score DECIMAL(5,4),
    novelty_score DECIMAL(5,4),
    
    -- Relationships
    parent_theme_id UUID REFERENCES document_themes(id), -- For hierarchical themes
    related_themes UUID[] DEFAULT '{}', -- Related theme IDs
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'needs_review', 'approved', 'rejected')),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, theme_slug),
    CHECK (evidence_count >= 0)
);

-- Create theme relationships table for cross-theme connections
CREATE TABLE IF NOT EXISTS theme_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_theme_id UUID NOT NULL REFERENCES document_themes(id) ON DELETE CASCADE,
    target_theme_id UUID NOT NULL REFERENCES document_themes(id) ON DELETE CASCADE,
    
    -- Relationship Type
    relationship_type TEXT NOT NULL
        CHECK (relationship_type IN ('related_to', 'contains', 'part_of', 'contradicts', 'supports', 'elaborates', 'cultural_connection', 'temporal_sequence')),
    
    -- Relationship Strength
    strength DECIMAL(5,4) NOT NULL CHECK (strength >= 0.0 AND strength <= 1.0),
    confidence DECIMAL(5,4) DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Cultural Context
    cultural_significance TEXT,
    requires_cultural_review BOOLEAN DEFAULT false,
    cultural_justification TEXT,
    
    -- AI Analysis
    detected_by_model TEXT,
    detection_method TEXT,
    supporting_evidence JSONB DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source_theme_id, target_theme_id, relationship_type),
    CHECK (source_theme_id != target_theme_id)
);

-- Create global themes table for cross-document theme tracking
CREATE TABLE IF NOT EXISTS global_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Theme Information
    theme_name TEXT NOT NULL,
    theme_slug TEXT UNIQUE NOT NULL,
    theme_description TEXT,
    theme_category TEXT DEFAULT 'general'
        CHECK (theme_category IN ('general', 'cultural', 'social', 'environmental', 'economic', 'political', 'spiritual', 'historical', 'methodological')),
    
    -- Community Context
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Aggregated Metrics
    document_count INTEGER DEFAULT 0,
    total_confidence DECIMAL(8,4) DEFAULT 0.0,
    avg_confidence DECIMAL(5,4) DEFAULT 0.0,
    total_relevance DECIMAL(8,4) DEFAULT 0.0,
    avg_relevance DECIMAL(5,4) DEFAULT 0.0,
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    traditional_knowledge_theme BOOLEAN DEFAULT false,
    requires_elder_oversight BOOLEAN DEFAULT false,
    
    -- Trend Analysis
    first_detected TIMESTAMPTZ,
    last_detected TIMESTAMPTZ,
    trend_direction TEXT DEFAULT 'stable'
        CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'emerging', 'declining')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(community_id, theme_slug),
    CHECK (document_count >= 0),
    CHECK (avg_confidence >= 0.0 AND avg_confidence <= 1.0),
    CHECK (avg_relevance >= 0.0 AND avg_relevance <= 1.0)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Document themes indexes
CREATE INDEX IF NOT EXISTS idx_themes_document_confidence ON document_themes(document_id, confidence_score DESC, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_themes_community_category ON document_themes(community_id, theme_category, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_themes_cultural_significance ON document_themes(cultural_significance, community_id, requires_elder_review);
CREATE INDEX IF NOT EXISTS idx_themes_processing_status ON document_themes(processing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_themes_ai_model ON document_themes(ai_model_name, ai_model_version, created_at DESC);

-- Theme search indexes
CREATE INDEX IF NOT EXISTS idx_themes_name_search ON document_themes 
    USING gin(to_tsvector('english', theme_name || ' ' || coalesce(theme_description, '')));
CREATE INDEX IF NOT EXISTS idx_themes_key_phrases ON document_themes USING gin(key_phrases);
CREATE INDEX IF NOT EXISTS idx_themes_supporting_chunks ON document_themes USING gin(supporting_chunks);

-- Theme relationships indexes
CREATE INDEX IF NOT EXISTS idx_theme_relationships_source ON theme_relationships(source_theme_id, relationship_type, strength DESC);
CREATE INDEX IF NOT EXISTS idx_theme_relationships_target ON theme_relationships(target_theme_id, relationship_type, strength DESC);
CREATE INDEX IF NOT EXISTS idx_theme_relationships_strength ON theme_relationships(strength DESC, confidence DESC);

-- Global themes indexes
CREATE INDEX IF NOT EXISTS idx_global_themes_community ON global_themes(community_id, avg_confidence DESC, document_count DESC);
CREATE INDEX IF NOT EXISTS idx_global_themes_category ON global_themes(theme_category, community_id, avg_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_global_themes_cultural ON global_themes(cultural_significance, traditional_knowledge_theme, community_id);
CREATE INDEX IF NOT EXISTS idx_global_themes_trend ON global_themes(trend_direction, last_detected DESC);

SELECT 'Document themes tables and indexes created successfully' as status;