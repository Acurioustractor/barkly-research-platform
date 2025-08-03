-- =====================================================
-- Diagnose Table Columns - Check what actually exists
-- =====================================================

-- Check user_profiles table structure
SELECT 'USER_PROFILES TABLE COLUMNS:' as table_check;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_activity_log table structure
SELECT 'USER_ACTIVITY_LOG TABLE COLUMNS:' as table_check;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_activity_log' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_sessions table structure
SELECT 'USER_SESSIONS TABLE COLUMNS:' as table_check;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_sessions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_permissions table structure
SELECT 'USER_PERMISSIONS TABLE COLUMNS:' as table_check;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_permissions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_verification_requests table structure
SELECT 'USER_VERIFICATION_REQUESTS TABLE COLUMNS:' as table_check;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_verification_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check which tables actually exist
SELECT 'EXISTING USER MANAGEMENT TABLES:' as table_check;
SELECT tablename, schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%user%'
ORDER BY tablename;

-- Test creating a simple index on user_profiles to see if it works
SELECT 'TESTING SIMPLE INDEX ON USER_PROFILES:' as test_name;
CREATE INDEX IF NOT EXISTS test_user_profiles_user_id ON user_profiles(user_id);
SELECT 'Index creation test completed' as result;

-- Clean up test index
DROP INDEX IF EXISTS test_user_profiles_user_id;