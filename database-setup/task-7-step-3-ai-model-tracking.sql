-- =====================================================
-- TASK 7 - STEP 3: AI Model Versioning and Provenance
-- Track AI Models, Versions, and Analysis Provenance
-- =====================================================

-- Create AI models registry for tracking different AI systems
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model Information
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_type TEXT NOT NULL
        CHECK (model_type IN ('language_model', 'embedding_model', 'classification_model', 'topic_model', 'sentiment_model', 'ner_model', 'summarization_model')),
    
    -- Model Details
    provider TEXT NOT NULL, -- 'openai', 'anthropic', 'huggingface', 'custom', etc.
    model_description TEXT,
    model_parameters JSONB DEFAULT '{}',
    training_data_info TEXT,
    model_size TEXT, -- '7B', '13B', '175B', etc.
    
    -- Capabilities
    supported_languages TEXT[] DEFAULT ARRAY['en'],
    max_context_length INTEGER,
    supports_cultural_context BOOLEAN DEFAULT false,
    indigenous_knowledge_trained BOOLEAN DEFAULT false,
    
    -- Performance Metrics
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    cultural_sensitivity_score DECIMAL(5,4),
    
    -- Bias and Ethics
    bias_assessment JSONB DEFAULT '{}',
    cultural_bias_notes TEXT,
    ethical_considerations TEXT,
    indigenous_data_used BOOLEAN DEFAULT false,
    consent_obtained BOOLEAN DEFAULT false,
    
    -- Operational Info
    api_endpoint TEXT,
    cost_per_request DECIMAL(10,6),
    rate_limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(model_name, model_version, provider)
);

-- Create analysis sessions table for tracking AI analysis runs
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session Information
    session_name TEXT,
    session_description TEXT,
    analysis_type TEXT NOT NULL
        CHECK (analysis_type IN ('theme_extraction', 'quote_extraction', 'sentiment_analysis', 'entity_recognition', 'topic_modeling', 'summarization', 'cultural_analysis')),
    
    -- Context
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    initiated_by UUID, -- User who started the analysis
    
    -- Scope
    document_ids UUID[] DEFAULT '{}', -- Documents analyzed in this session
    chunk_ids UUID[] DEFAULT '{}', -- Specific chunks if applicable
    analysis_scope TEXT DEFAULT 'document'
        CHECK (analysis_scope IN ('document', 'chunk', 'collection', 'community')),
    
    -- AI Model Configuration
    ai_model_id UUID NOT NULL REFERENCES ai_models(id),
    model_parameters JSONB DEFAULT '{}',
    prompt_template TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER,
    
    -- Cultural Configuration
    cultural_sensitivity_mode BOOLEAN DEFAULT true,
    elder_review_required BOOLEAN DEFAULT false,
    cultural_protocols JSONB DEFAULT '{}',
    traditional_knowledge_handling TEXT DEFAULT 'standard'
        CHECK (traditional_knowledge_handling IN ('standard', 'sensitive', 'restricted', 'prohibited')),
    
    -- Processing Status
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'needs_review')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_seconds INTEGER,
    
    -- Results Summary
    total_items_processed INTEGER DEFAULT 0,
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    themes_extracted INTEGER DEFAULT 0,
    quotes_extracted INTEGER DEFAULT 0,
    
    -- Quality Metrics
    avg_confidence_score DECIMAL(5,4),
    quality_score DECIMAL(5,4),
    cultural_compliance_score DECIMAL(5,4),
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analysis results table for linking results to sessions
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session Context
    session_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Result Type and Reference
    result_type TEXT NOT NULL
        CHECK (result_type IN ('theme', 'quote', 'entity', 'sentiment', 'summary', 'relationship')),
    result_id UUID NOT NULL, -- ID of the actual result (theme_id, quote_id, etc.)
    
    -- Source Context
    source_document_id UUID REFERENCES documents(id),
    source_chunk_id UUID REFERENCES document_chunks(id),
    
    -- Analysis Metadata
    confidence_score DECIMAL(5,4) NOT NULL,
    processing_time_ms INTEGER,
    model_response_raw JSONB, -- Raw response from AI model
    
    -- Cultural Context
    cultural_flags JSONB DEFAULT '{}',
    requires_cultural_review BOOLEAN DEFAULT false,
    cultural_review_status TEXT DEFAULT 'pending'
        CHECK (cultural_review_status IN ('pending', 'approved', 'rejected', 'needs_modification')),
    
    -- Quality Assurance
    human_validated BOOLEAN DEFAULT false,
    validation_score DECIMAL(5,4),
    validation_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create model performance tracking table
CREATE TABLE IF NOT EXISTS model_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model and Time Context
    ai_model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Performance Metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(8,2),
    avg_confidence_score DECIMAL(5,4),
    
    -- Quality Metrics
    human_validation_rate DECIMAL(5,4), -- % of results validated by humans
    validation_accuracy DECIMAL(5,4), -- % of validated results that were correct
    cultural_compliance_rate DECIMAL(5,4), -- % meeting cultural standards
    
    -- Usage Patterns
    peak_usage_hour INTEGER, -- Hour of day with most usage (0-23)
    most_common_analysis_type TEXT,
    avg_items_per_session DECIMAL(8,2),
    
    -- Cost Tracking
    total_cost DECIMAL(10,4) DEFAULT 0.0,
    cost_per_successful_request DECIMAL(10,6),
    
    -- Cultural Metrics
    sacred_content_flagged INTEGER DEFAULT 0,
    elder_reviews_required INTEGER DEFAULT 0,
    cultural_protocols_triggered INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(ai_model_id, community_id, measurement_date)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- AI models indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_type_provider ON ai_models(model_type, provider, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_capabilities ON ai_models(supports_cultural_context, indigenous_knowledge_trained);
CREATE INDEX IF NOT EXISTS idx_ai_models_performance ON ai_models(accuracy_score DESC, cultural_sensitivity_score DESC) WHERE is_active = true;

-- Analysis sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_community_type ON analysis_sessions(community_id, analysis_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_model_status ON analysis_sessions(ai_model_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_processing ON analysis_sessions(status, started_at DESC) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_sessions_cultural ON analysis_sessions(cultural_sensitivity_mode, elder_review_required, traditional_knowledge_handling);

-- Analysis results indexes
CREATE INDEX IF NOT EXISTS idx_results_session_type ON analysis_results(session_id, result_type, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_results_community_type ON analysis_results(community_id, result_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_cultural_review ON analysis_results(requires_cultural_review, cultural_review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_validation ON analysis_results(human_validated, validation_score DESC);

-- Model performance indexes
CREATE INDEX IF NOT EXISTS idx_performance_model_date ON model_performance_metrics(ai_model_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_community_date ON model_performance_metrics(community_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics ON model_performance_metrics(validation_accuracy DESC, cultural_compliance_rate DESC);

SELECT 'AI model versioning and provenance tracking created successfully' as status;