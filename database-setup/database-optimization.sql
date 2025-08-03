-- Barkly Research Platform Database Optimization
-- Run these commands in your Supabase SQL editor

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- 2. Create optimized indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_status_created 
ON documents(status, "uploadedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_category_source 
ON documents(category, source) WHERE status = 'COMPLETED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_fulltext_search 
ON documents USING gin(to_tsvector('english', "fullText")) 
WHERE "fullText" IS NOT NULL;

-- 3. Optimize document chunks for semantic search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_document_index 
ON document_chunks("documentId", "chunkIndex");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_embedding 
ON document_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100) WHERE embedding IS NOT NULL;

-- 4. Optimize themes and quotes for analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_themes_confidence 
ON document_themes("documentId", confidence DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_category_confidence 
ON document_quotes(category, confidence DESC) WHERE category IS NOT NULL;

-- 5. Create materialized view for dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS document_metrics AS
SELECT 
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_documents,
  COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing_documents,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed_documents,
  AVG("wordCount") FILTER (WHERE "wordCount" > 0) as avg_word_count,
  COUNT(DISTINCT category) as unique_categories,
  COUNT(DISTINCT source) as unique_sources,
  SUM((SELECT COUNT(*) FROM document_chunks WHERE "documentId" = documents.id)) as total_chunks,
  SUM((SELECT COUNT(*) FROM document_themes WHERE "documentId" = documents.id)) as total_themes,
  SUM((SELECT COUNT(*) FROM document_quotes WHERE "documentId" = documents.id)) as total_quotes
FROM documents;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_metrics_refresh 
ON document_metrics ((1));

-- 6. Function to refresh metrics (call this periodically)
CREATE OR REPLACE FUNCTION refresh_document_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY document_metrics;
END;
$$ LANGUAGE plpgsql;

-- 7. Optimize for Indigenous research queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_themes_indigenous_research 
ON document_themes(theme) 
WHERE theme ILIKE ANY(ARRAY['%youth%', '%cultural%', '%indigenous%', '%community%', '%barkly%']);

-- 8. Create function for semantic search
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  chunk_id text,
  document_id text,
  similarity float,
  text text,
  document_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc."documentId",
    1 - (dc.embedding <=> query_embedding) as similarity,
    dc.text,
    d."originalName"
  FROM document_chunks dc
  JOIN documents d ON dc."documentId" = d.id
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 9. Row Level Security (RLS) for multi-tenancy if needed
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY documents_policy ON documents FOR ALL USING (true);

-- 10. Cleanup function for old failed documents
CREATE OR REPLACE FUNCTION cleanup_failed_documents(days_old int DEFAULT 7)
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM documents 
  WHERE status = 'FAILED' 
    AND "uploadedAt" < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Performance monitoring view
CREATE OR REPLACE VIEW processing_performance AS
SELECT 
  DATE_TRUNC('hour', "uploadedAt") as hour,
  COUNT(*) as documents_uploaded,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  AVG(EXTRACT(EPOCH FROM ("processedAt" - "uploadedAt"))) FILTER (WHERE "processedAt" IS NOT NULL) as avg_processing_seconds
FROM documents
WHERE "uploadedAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', "uploadedAt")
ORDER BY hour DESC;

-- 12. Grant necessary permissions (adjust as needed)
-- GRANT SELECT ON document_metrics TO authenticated;
-- GRANT EXECUTE ON FUNCTION search_similar_chunks TO authenticated;
-- GRANT SELECT ON processing_performance TO authenticated;

-- Usage examples:
-- 1. Refresh metrics: SELECT refresh_document_metrics();
-- 2. Cleanup old failed docs: SELECT cleanup_failed_documents(7);
-- 3. View performance: SELECT * FROM processing_performance;
-- 4. Search similar content: SELECT * FROM search_similar_chunks('[your_embedding_vector]'::vector);

COMMIT;