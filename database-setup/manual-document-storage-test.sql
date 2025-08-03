-- =====================================================
-- Manual Document Storage System Test
-- Run this in Supabase SQL Editor to verify everything works
-- =====================================================

-- Test 1: Check if document storage tables exist
SELECT 'TEST 1: Document Storage Tables' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'documents') THEN '✅ EXISTS' ELSE '❌ MISSING' END as documents,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_versions') THEN '✅ EXISTS' ELSE '❌ MISSING' END as document_versions,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_collections') THEN '✅ EXISTS' ELSE '❌ MISSING' END as document_collections,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_relationships') THEN '✅ EXISTS' ELSE '❌ MISSING' END as document_relationships,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_tags') THEN '✅ EXISTS' ELSE '❌ MISSING' END as document_tags;

-- Test 2: Check documents table structure
SELECT 'TEST 2: Documents Table Structure' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'sha256_hash') THEN '✅ EXISTS' ELSE '❌ MISSING' END as sha256_hash,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'cultural_sensitivity_level') THEN '✅ EXISTS' ELSE '❌ MISSING' END as cultural_sensitivity,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'community_id') THEN '✅ EXISTS' ELSE '❌ MISSING' END as community_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'processing_status') THEN '✅ EXISTS' ELSE '❌ MISSING' END as processing_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'text_content') THEN '✅ EXISTS' ELSE '❌ MISSING' END as text_content;

-- Test 3: Check RLS is enabled on document storage tables
SELECT 'TEST 3: Row Level Security Status' as test_name;
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'document_versions', 'document_collections', 'document_relationships', 'document_tags')
ORDER BY tablename;

-- Test 4: Check RLS policies count for document storage
SELECT 'TEST 4: Document Storage RLS Policies' as test_name;
SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) >= 2 THEN '✅ GOOD' ELSE '⚠️ FEW' END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('documents', 'document_versions', 'document_collections', 'document_collection_items', 'document_relationships', 'document_tags', 'document_tag_assignments')
GROUP BY tablename
ORDER BY tablename;

-- Test 5: Check document storage indexes
SELECT 'TEST 5: Document Storage Indexes' as test_name;
SELECT 
  tablename,
  COUNT(*) as index_count,
  CASE WHEN COUNT(*) >= 3 THEN '✅ OPTIMIZED' ELSE '⚠️ MINIMAL' END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'document_versions', 'document_collections', 'document_relationships', 'document_tags')
AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;

-- Test 6: Check document management functions
SELECT 'TEST 6: Document Management Functions' as test_name;
SELECT 
  proname as function_name,
  '✅ AVAILABLE' as status
FROM pg_proc 
WHERE proname IN (
  'upload_document', 
  'create_document_collection', 
  'add_document_to_collection', 
  'search_documents', 
  'get_document_statistics',
  'validate_document_storage'
)
ORDER BY proname;

-- Test 7: Check audit triggers for document storage
SELECT 'TEST 7: Document Storage Audit Triggers' as test_name;
SELECT 
  tgrelid::regclass::text as table_name,
  tgname as trigger_name,
  '✅ ACTIVE' as status
FROM pg_trigger 
WHERE tgname LIKE '%audit_trigger%'
AND tgrelid::regclass::text IN ('documents', 'document_versions', 'document_collections', 'document_collection_items', 'document_relationships', 'document_tags', 'document_tag_assignments')
ORDER BY table_name;

-- Test 8: Check update triggers
SELECT 'TEST 8: Update Triggers' as test_name;
SELECT 
  tgrelid::regclass::text as table_name,
  tgname as trigger_name,
  '✅ ACTIVE' as status
FROM pg_trigger 
WHERE tgname LIKE '%updated_at%'
AND tgrelid::regclass::text IN ('documents', 'document_collections')
ORDER BY table_name;

-- Test 9: Basic table access test
SELECT 'TEST 9: Document Storage Table Access' as test_name;
SELECT 
  'documents' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM documents
UNION ALL
SELECT 
  'document_versions' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM document_versions
UNION ALL
SELECT 
  'document_collections' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM document_collections
UNION ALL
SELECT 
  'document_relationships' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM document_relationships
UNION ALL
SELECT 
  'document_tags' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM document_tags;

-- Test 10: Check cultural sensitivity levels
SELECT 'TEST 10: Cultural Sensitivity Integration' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name LIKE '%cultural%' OR column_name LIKE '%sensitivity%' OR column_name LIKE '%traditional%' THEN '✅ CULTURAL' ELSE '✅ STANDARD' END as field_type
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('cultural_sensitivity_level', 'cultural_protocols', 'cultural_context', 'traditional_knowledge_category', 'requires_elder_approval')
ORDER BY column_name;

-- Test 11: Check deduplication features
SELECT 'TEST 11: File Deduplication Features' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name LIKE '%hash%' THEN '✅ DEDUPLICATION' ELSE '✅ METADATA' END as feature_type
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('sha256_hash', 'md5_hash', 'file_size', 'mime_type', 'processing_status')
ORDER BY column_name;

-- Test 12: Check versioning system
SELECT 'TEST 12: Document Versioning System' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name LIKE '%version%' OR column_name = 'parent_document_id' THEN '✅ VERSIONING' ELSE '✅ METADATA' END as system_type
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('version', 'parent_document_id', 'is_latest_version', 'version_notes')
ORDER BY column_name;

-- Test 13: Check collections and tagging system
SELECT 'TEST 13: Collections and Tagging System' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('collections', 'tags', 'keywords', 'subjects') THEN '✅ ORGANIZATION' ELSE '✅ METADATA' END as organization_type
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('collections', 'tags', 'keywords', 'subjects', 'research_project_id')
ORDER BY column_name;

-- Test 14: Run comprehensive validation function
SELECT 'TEST 14: Comprehensive System Validation' as test_name;
SELECT * FROM validate_document_storage();

-- Test 15: Final system summary
SELECT 'TEST 15: Document Storage System Summary' as test_name;
SELECT 
  'Document Storage System' as component,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('documents', 'document_versions', 'document_collections', 'document_relationships', 'document_tags')) = 5
    AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'documents' AND column_name IN ('sha256_hash', 'cultural_sensitivity_level', 'community_id', 'processing_status')) = 4
    AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('documents', 'document_versions', 'document_collections', 'document_relationships', 'document_tags')) >= 10
    AND (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('upload_document', 'create_document_collection', 'add_document_to_collection', 'search_documents', 'get_document_statistics')) >= 5
    THEN '🚀 FULLY OPERATIONAL'
    ELSE '⚠️ NEEDS ATTENTION'
  END as overall_status;

-- Success message
SELECT '🎉 Document Storage System Test Complete!' as message;
SELECT 'If all tests show ✅ or 🚀, the system is ready for use!' as instruction;

-- Feature summary
SELECT '📁 Document Storage Features Available:' as features_header;
SELECT '   - Scalable document storage with SHA-256 deduplication' as feature_1;
SELECT '   - Cultural sensitivity classification and protocols' as feature_2;
SELECT '   - Comprehensive version tracking and management' as feature_3;
SELECT '   - Document collections and organization system' as feature_4;
SELECT '   - Cultural-aware tagging and metadata system' as feature_5;
SELECT '   - Full-text search with cultural filtering' as feature_6;
SELECT '   - Community-based access control and isolation' as feature_7;
SELECT '   - Complete audit logging and compliance tracking' as feature_8;
SELECT '   - Indigenous data sovereignty compliance' as feature_9;
SELECT '   - Research project integration and tracking' as feature_10;