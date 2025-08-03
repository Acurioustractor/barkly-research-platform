-- =====================================================
-- Manual Community Management System Test
-- Run this in Supabase SQL Editor to verify everything works
-- =====================================================

-- Test 1: Check if community management tables exist
SELECT 'TEST 1: Community Management Tables' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_memberships') THEN '✅ EXISTS' ELSE '❌ MISSING' END as community_memberships,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_data_policies') THEN '✅ EXISTS' ELSE '❌ MISSING' END as community_data_policies,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_research_projects') THEN '✅ EXISTS' ELSE '❌ MISSING' END as community_research_projects;

-- Test 2: Check extended community fields
SELECT 'TEST 2: Extended Community Fields' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'community_type') THEN '✅ EXISTS' ELSE '❌ MISSING' END as community_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'geographic_region') THEN '✅ EXISTS' ELSE '❌ MISSING' END as geographic_region,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'traditional_territory') THEN '✅ EXISTS' ELSE '❌ MISSING' END as traditional_territory,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'verification_status') THEN '✅ EXISTS' ELSE '❌ MISSING' END as verification_status;

-- Test 3: Check RLS is enabled
SELECT 'TEST 3: Row Level Security Status' as test_name;
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('communities', 'community_memberships', 'community_data_policies', 'community_research_projects')
ORDER BY tablename;

-- Test 4: Check RLS policies count
SELECT 'TEST 4: RLS Policies Count' as test_name;
SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) >= 2 THEN '✅ GOOD' ELSE '⚠️ FEW' END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
GROUP BY tablename
ORDER BY tablename;

-- Test 5: Check indexes were created
SELECT 'TEST 5: Performance Indexes' as test_name;
SELECT 
  tablename,
  COUNT(*) as index_count,
  CASE WHEN COUNT(*) >= 2 THEN '✅ OPTIMIZED' ELSE '⚠️ MINIMAL' END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;

-- Test 6: Check audit triggers
SELECT 'TEST 6: Audit Triggers' as test_name;
SELECT 
  tgrelid::regclass::text as table_name,
  tgname as trigger_name,
  '✅ ACTIVE' as status
FROM pg_trigger 
WHERE tgname LIKE '%audit_trigger%'
AND tgrelid::regclass::text IN ('community_memberships', 'community_data_policies', 'community_research_projects')
ORDER BY table_name;

-- Test 7: Basic table access test
SELECT 'TEST 7: Table Access Test' as test_name;
SELECT 
  'communities' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM communities
UNION ALL
SELECT 
  'community_memberships' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM community_memberships
UNION ALL
SELECT 
  'community_data_policies' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM community_data_policies
UNION ALL
SELECT 
  'community_research_projects' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM community_research_projects;

-- Test 8: Check community table structure
SELECT 'TEST 8: Community Table Structure' as test_name;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'communities' 
AND column_name IN ('community_type', 'geographic_region', 'traditional_territory', 'languages_spoken', 'verification_status')
ORDER BY column_name;

-- Test 9: Check membership table structure
SELECT 'TEST 9: Membership Table Structure' as test_name;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_memberships' 
AND column_name IN ('role', 'status', 'access_level', 'cultural_role', 'cultural_permissions')
ORDER BY column_name;

-- Test 10: Final summary
SELECT 'TEST 10: System Summary' as test_name;
SELECT 
  'Community Management System' as component,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')) = 3
    AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'communities' AND column_name IN ('community_type', 'geographic_region', 'traditional_territory', 'verification_status')) = 4
    AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')) >= 6
    THEN '🚀 FULLY OPERATIONAL'
    ELSE '⚠️ NEEDS ATTENTION'
  END as overall_status;

-- Success message
SELECT '🎉 Community Management System Test Complete!' as message;
SELECT 'If all tests show ✅ or 🚀, the system is ready for use!' as instruction;