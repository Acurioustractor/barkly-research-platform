-- Barkley Research Platform - Database Cleanup & Reset Script
-- This script provides various levels of database cleanup from selective to complete reset

-- =============================================================================
-- OPTION 1: SELECTIVE CLEANUP - Remove test/failed documents only
-- =============================================================================

-- Remove failed and test documents
DELETE FROM documents WHERE 
  status = 'FAILED' 
  OR originalName LIKE '%test%' 
  OR originalName LIKE '%simple%'
  OR size < 10000; -- Remove very small files (likely test files)

-- Clean up orphaned data (cascading deletes should handle this, but just in case)
DELETE FROM document_chunks WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM document_themes WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM document_quotes WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM document_insights WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM document_keywords WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM system_entities WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM system_relationships WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM document_entities WHERE documentId NOT IN (SELECT id FROM documents);
DELETE FROM document_entity_relationships WHERE documentId NOT IN (SELECT id FROM documents);

-- =============================================================================
-- OPTION 2: KEEP ONLY SPECIFIC DOCUMENTS - Barkley Regional Deal docs
-- =============================================================================

-- Uncomment the following block to keep only Barkley Regional Deal documents
/*
DELETE FROM documents WHERE 
  originalName NOT LIKE '%Barkly%' 
  AND originalName NOT LIKE '%Regional%'
  AND originalName NOT LIKE '%Deal%';
*/

-- =============================================================================
-- OPTION 3: COMPLETE DATABASE RESET - Remove ALL documents and related data
-- =============================================================================

-- WARNING: This will delete ALL documents and analysis data
-- Uncomment the following block to perform a complete reset
/*
-- Delete all document-related data (order matters due to foreign keys)
DELETE FROM document_entity_relationships;
DELETE FROM document_entities;
DELETE FROM system_relationships;
DELETE FROM system_entities;
DELETE FROM document_keywords;
DELETE FROM document_insights;
DELETE FROM document_quotes;
DELETE FROM document_themes;
DELETE FROM document_chunks;
DELETE FROM documents_in_collections;
DELETE FROM document_collections;
DELETE FROM documents;
DELETE FROM system_maps;

-- Reset auto-increment sequences (if any)
-- Note: CUID is used for IDs, so no sequences to reset
*/

-- =============================================================================
-- VERIFICATION QUERIES - Run after cleanup to verify results
-- =============================================================================

-- Check remaining document count and status
SELECT 
  COUNT(*) as total_documents,
  status,
  COUNT(*) as count_by_status
FROM documents 
GROUP BY status;

-- Check data integrity
SELECT 
  'documents' as table_name, COUNT(*) as count FROM documents
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks
UNION ALL
SELECT 'document_themes', COUNT(*) FROM document_themes
UNION ALL
SELECT 'document_quotes', COUNT(*) FROM document_quotes
UNION ALL
SELECT 'document_insights', COUNT(*) FROM document_insights
UNION ALL
SELECT 'document_keywords', COUNT(*) FROM document_keywords
UNION ALL
SELECT 'system_entities', COUNT(*) FROM system_entities
UNION ALL
SELECT 'system_relationships', COUNT(*) FROM system_relationships;

-- Show remaining documents with details
SELECT 
  id,
  originalName,
  status,
  ROUND(size/1024.0, 1) as size_kb,
  uploadedAt,
  processedAt,
  pageCount,
  wordCount
FROM documents 
ORDER BY uploadedAt DESC;

-- =============================================================================
-- POST-CLEANUP OPTIMIZATION
-- =============================================================================

-- Vacuum and analyze tables for better performance
VACUUM ANALYZE documents;
VACUUM ANALYZE document_chunks;
VACUUM ANALYZE document_themes;
VACUUM ANALYZE document_quotes;
VACUUM ANALYZE document_insights;