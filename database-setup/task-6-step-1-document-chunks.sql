-- =====================================================
-- TASK 6 - STEP 1: Document Chunks with Vector Embeddings
-- High-Performance Document Chunking System
-- =====================================================

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Document Reference
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Chunk Information
    chunk_index INTEGER NOT NULL, -- Position within document
    chunk_type TEXT DEFAULT 'paragraph'
        CHECK (chunk_type IN ('paragraph', 'section', 'page', 'sentence', 'custom')),
    
    -- Content
    content TEXT NOT NULL,
    content_length INTEGER NOT NULL,
    word_count INTEGER,
    
    -- Position Information
    start_position INTEGER, -- Character position in original document
    end_position INTEGER,
    page_number INTEGER,
    section_title TEXT,
    
    -- Vector Embeddings (1536 dimensions for OpenAI embeddings)
    embedding vector(1536),
    embedding_model TEXT DEFAULT 'text-embedding-ada-002',
    embedding_created_at TIMESTAMPTZ,
    
    -- Semantic Information
    language TEXT DEFAULT 'en',
    topics TEXT[] DEFAULT '{}',
    entities JSONB DEFAULT '{}', -- Named entities extracted from chunk
    keywords TEXT[] DEFAULT '{}',
    
    -- Cultural Context
    cultural_sensitivity_level TEXT DEFAULT 'community'
        CHECK (cultural_sensitivity_level IN ('public', 'community', 'restricted', 'sacred', 'ceremonial')),
    cultural_entities JSONB DEFAULT '{}', -- Cultural/Indigenous entities
    traditional_knowledge_indicators TEXT[] DEFAULT '{}',
    requires_elder_review BOOLEAN DEFAULT false,
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Quality Metrics
    readability_score DECIMAL(5,2),
    complexity_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2) DEFAULT 1.0,
    
    -- Relationships
    parent_chunk_id UUID REFERENCES document_chunks(id), -- For hierarchical chunks
    related_chunks UUID[] DEFAULT '{}', -- Related chunk IDs
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, chunk_index),
    CHECK (start_position <= end_position),
    CHECK (content_length > 0),
    CHECK (word_count >= 0)
);

-- Create chunk relationships table for semantic connections
CREATE TABLE IF NOT EXISTS chunk_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    target_chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    
    -- Relationship Type
    relationship_type TEXT NOT NULL
        CHECK (relationship_type IN ('semantic_similar', 'contextual_next', 'topic_related', 'entity_shared', 'cultural_connected', 'citation', 'elaboration')),
    
    -- Relationship Strength
    similarity_score DECIMAL(5,4) DEFAULT 0.0 CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0),
    confidence DECIMAL(5,4) DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Cultural Context
    cultural_significance TEXT,
    requires_cultural_review BOOLEAN DEFAULT false,
    
    -- Processing Info
    created_by_model TEXT, -- AI model that created this relationship
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source_chunk_id, target_chunk_id, relationship_type),
    CHECK (source_chunk_id != target_chunk_id)
);

-- Create chunk topics table for topic modeling
CREATE TABLE IF NOT EXISTS chunk_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    
    -- Topic Information
    topic_name TEXT NOT NULL,
    topic_slug TEXT NOT NULL,
    topic_category TEXT DEFAULT 'general'
        CHECK (topic_category IN ('general', 'cultural', 'research', 'methodology', 'location', 'person', 'event', 'concept')),
    
    -- Topic Strength
    relevance_score DECIMAL(5,4) NOT NULL CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    confidence DECIMAL(5,4) DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Cultural Context
    cultural_topic BOOLEAN DEFAULT false,
    traditional_knowledge BOOLEAN DEFAULT false,
    requires_elder_approval BOOLEAN DEFAULT false,
    
    -- Processing Info
    extracted_by_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(chunk_id, topic_slug)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_chunks_document_index ON document_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_community_status ON document_chunks(community_id, processing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chunks_cultural_level ON document_chunks(cultural_sensitivity_level, community_id);

-- Vector similarity search (HNSW index for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks 
    USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);

-- Alternative IVFFlat index for different query patterns
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat ON document_chunks 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- Content search indexes
CREATE INDEX IF NOT EXISTS idx_chunks_content_search ON document_chunks 
    USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_chunks_topics_gin ON document_chunks USING gin(topics);
CREATE INDEX IF NOT EXISTS idx_chunks_keywords_gin ON document_chunks USING gin(keywords);

-- Position and structure indexes
CREATE INDEX IF NOT EXISTS idx_chunks_position ON document_chunks(document_id, start_position, end_position);
CREATE INDEX IF NOT EXISTS idx_chunks_page ON document_chunks(document_id, page_number) WHERE page_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chunks_type_length ON document_chunks(chunk_type, content_length);

-- Processing and quality indexes
CREATE INDEX IF NOT EXISTS idx_chunks_processing_queue ON document_chunks(processing_status, created_at) 
    WHERE processing_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_chunks_quality ON document_chunks(confidence_score DESC, readability_score DESC) 
    WHERE processing_status = 'completed';

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_chunk_relationships_source ON chunk_relationships(source_chunk_id, relationship_type, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_chunk_relationships_target ON chunk_relationships(target_chunk_id, relationship_type, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_chunk_relationships_similarity ON chunk_relationships(similarity_score DESC, relationship_type);

-- Topic indexes
CREATE INDEX IF NOT EXISTS idx_chunk_topics_chunk ON chunk_topics(chunk_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_chunk_topics_topic ON chunk_topics(topic_slug, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_chunk_topics_cultural ON chunk_topics(cultural_topic, traditional_knowledge, relevance_score DESC);

SELECT 'Document chunks tables and indexes created successfully' as status;