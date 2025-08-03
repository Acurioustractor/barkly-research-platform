-- =====================================================
-- Enable Vector Support in Supabase
-- =====================================================

-- Supabase has pgvector pre-installed, just need to enable it
CREATE EXTENSION IF NOT EXISTS vector;

-- Test vector extension
SELECT 'Vector extension enabled successfully' as status;

-- Test creating a simple vector
SELECT '[1,2,3]'::vector as test_vector;

-- Check available vector operators
SELECT 'Available vector operators: <->, <#>, <=> for cosine, inner product, and L2 distance' as info;