-- =====================================================
-- Manual Advanced User Management System Test
-- Run this in Supabase SQL Editor to verify everything works
-- =====================================================

-- Test 1: Check if user management tables exist
SELECT 'TEST 1: User Management Tables' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN '✅ EXISTS' ELSE '❌ MISSING' END as user_profiles,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_activity_log') THEN '✅ EXISTS' ELSE '❌ MISSING' END as user_activity_log,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') THEN '✅ EXISTS' ELSE '❌ MISSING' END as user_sessions,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_permissions') THEN '✅ EXISTS' ELSE '❌ MISSING' END as user_permissions,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_verification_requests') THEN '✅ EXISTS' ELSE '❌ MISSING' END as verification_requests;

-- Test 2: Check user profiles table structure
SELECT 'TEST 2: User Profiles Structure' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'display_name') THEN '✅ EXISTS' ELSE '❌ MISSING' END as display_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'cultural_background') THEN '✅ EXISTS' ELSE '❌ MISSING' END as cultural_background,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'traditional_name') THEN '✅ EXISTS' ELSE '❌ MISSING' END as traditional_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'verification_status') THEN '✅ EXISTS' ELSE '❌ MISSING' END as verification_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'primary_community_id') THEN '✅ EXISTS' ELSE '❌ MISSING' END as primary_community_id;

-- Test 3: Check RLS is enabled on user management tables
SELECT 'TEST 3: Row Level Security Status' as test_name;
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')
ORDER BY tablename;

-- Test 4: Check RLS policies count for user management
SELECT 'TEST 4: User Management RLS Policies' as test_name;
SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) >= 2 THEN '✅ GOOD' ELSE '⚠️ FEW' END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')
GROUP BY tablename
ORDER BY tablename;

-- Test 5: Check user management indexes
SELECT 'TEST 5: User Management Indexes' as test_name;
SELECT 
  tablename,
  COUNT(*) as index_count,
  CASE WHEN COUNT(*) >= 2 THEN '✅ OPTIMIZED' ELSE '⚠️ MINIMAL' END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')
AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;

-- Test 6: Check user management functions
SELECT 'TEST 6: User Management Functions' as test_name;
SELECT 
  proname as function_name,
  '✅ AVAILABLE' as status
FROM pg_proc 
WHERE proname IN (
  'upsert_user_profile', 
  'log_user_activity', 
  'grant_user_permission', 
  'check_user_permission', 
  'create_verification_request', 
  'get_user_profile_with_community',
  'calculate_profile_completion',
  'validate_user_management'
)
ORDER BY proname;

-- Test 7: Check audit triggers for user management
SELECT 'TEST 7: User Management Audit Triggers' as test_name;
SELECT 
  tgrelid::regclass::text as table_name,
  tgname as trigger_name,
  '✅ ACTIVE' as status
FROM pg_trigger 
WHERE tgname LIKE '%audit_trigger%'
AND tgrelid::regclass::text IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')
ORDER BY table_name;

-- Test 8: Check update triggers
SELECT 'TEST 8: Update Triggers' as test_name;
SELECT 
  tgrelid::regclass::text as table_name,
  tgname as trigger_name,
  '✅ ACTIVE' as status
FROM pg_trigger 
WHERE tgname LIKE '%updated_at%' OR tgname LIKE '%completion%'
AND tgrelid::regclass::text IN ('user_profiles', 'user_permissions', 'user_verification_requests')
ORDER BY table_name;

-- Test 9: Basic table access test
SELECT 'TEST 9: User Management Table Access' as test_name;
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM user_profiles
UNION ALL
SELECT 
  'user_activity_log' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM user_activity_log
UNION ALL
SELECT 
  'user_sessions' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM user_sessions
UNION ALL
SELECT 
  'user_permissions' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM user_permissions
UNION ALL
SELECT 
  'user_verification_requests' as table_name,
  COUNT(*) as record_count,
  '✅ ACCESSIBLE' as status
FROM user_verification_requests;

-- Test 10: Check user profiles cultural fields
SELECT 'TEST 10: Cultural Integration Fields' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('cultural_background', 'traditional_name', 'cultural_protocols', 'language_preferences', 'cultural_sensitivity_level') THEN '✅ CULTURAL' ELSE '✅ STANDARD' END as field_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('cultural_background', 'traditional_name', 'cultural_protocols', 'language_preferences', 'cultural_sensitivity_level', 'verification_status', 'trust_score')
ORDER BY column_name;

-- Test 11: Check permission system fields
SELECT 'TEST 11: Permission System Fields' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name LIKE '%cultural%' OR column_name LIKE '%sacred%' OR column_name LIKE '%ceremonial%' THEN '✅ CULTURAL' ELSE '✅ STANDARD' END as permission_type
FROM information_schema.columns 
WHERE table_name = 'user_permissions' 
AND column_name IN ('can_read', 'can_write', 'can_delete', 'can_admin', 'can_access_sacred', 'can_access_ceremonial', 'can_modify_cultural_data', 'requires_elder_approval')
ORDER BY column_name;

-- Test 12: Check verification system fields
SELECT 'TEST 12: Verification System Fields' as test_name;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name LIKE '%cultural%' OR column_name LIKE '%elder%' OR column_name LIKE '%community%' THEN '✅ CULTURAL' ELSE '✅ STANDARD' END as verification_aspect
FROM information_schema.columns 
WHERE table_name = 'user_verification_requests' 
AND column_name IN ('verification_type', 'verification_level', 'community_endorsements', 'cultural_references', 'requires_elder_approval', 'elder_approvals', 'cultural_protocols_followed')
ORDER BY column_name;

-- Test 13: Run comprehensive validation function
SELECT 'TEST 13: Comprehensive System Validation' as test_name;
SELECT * FROM validate_user_management();

-- Test 14: Final system summary
SELECT 'TEST 14: Advanced User Management Summary' as test_name;
SELECT 
  'Advanced User Management System' as component,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')) = 5
    AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name IN ('cultural_background', 'traditional_name', 'verification_status', 'primary_community_id')) = 4
    AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'user_activity_log', 'user_sessions', 'user_permissions', 'user_verification_requests')) >= 12
    AND (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('upsert_user_profile', 'log_user_activity', 'grant_user_permission', 'check_user_permission', 'create_verification_request', 'get_user_profile_with_community')) >= 6
    THEN '🚀 FULLY OPERATIONAL'
    ELSE '⚠️ NEEDS ATTENTION'
  END as overall_status;

-- Success message
SELECT '🎉 Advanced User Management System Test Complete!' as message;
SELECT 'If all tests show ✅ or 🚀, the system is ready for use!' as instruction;

-- Feature summary
SELECT '🏛️ Advanced User Management Features Available:' as features_header;
SELECT '   - Comprehensive user profiles with cultural integration' as feature_1;
SELECT '   - Activity tracking and session management' as feature_2;
SELECT '   - Granular permission system with cultural protocols' as feature_3;
SELECT '   - User verification workflow with elder approval' as feature_4;
SELECT '   - Community-based access control' as feature_5;
SELECT '   - Indigenous data sovereignty compliance' as feature_6;
SELECT '   - Automatic profile completion tracking' as feature_7;
SELECT '   - Full audit logging and compliance' as feature_8;