-- =====================================================
-- Simple Table Check - No index creation, just inspection
-- =====================================================

-- Check what user-related tables exist
SELECT 'CHECKING EXISTING TABLES:' as check_type;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%user%'
ORDER BY tablename;

-- Check user_profiles table columns (if it exists)
SELECT 'USER_PROFILES COLUMNS:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_activity_log table columns (if it exists)  
SELECT 'USER_ACTIVITY_LOG COLUMNS:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_activity_log' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_sessions table columns (if it exists)
SELECT 'USER_SESSIONS COLUMNS:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_permissions table columns (if it exists)
SELECT 'USER_PERMISSIONS COLUMNS:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_permissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_verification_requests table columns (if it exists)
SELECT 'USER_VERIFICATION_REQUESTS COLUMNS:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_verification_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'DIAGNOSTIC COMPLETE' as final_message;