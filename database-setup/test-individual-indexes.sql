-- =====================================================
-- Test Individual Indexes - One table at a time
-- =====================================================

-- Test 1: user_profiles table index
SELECT 'Testing user_profiles index...' as test;
CREATE INDEX IF NOT EXISTS idx_test_user_profiles ON user_profiles(user_id);
SELECT 'user_profiles index: SUCCESS' as result;

-- Test 2: user_activity_log table index  
SELECT 'Testing user_activity_log index...' as test;
CREATE INDEX IF NOT EXISTS idx_test_activity_log ON user_activity_log(user_id);
SELECT 'user_activity_log index: SUCCESS' as result;

-- Test 3: user_sessions table index
SELECT 'Testing user_sessions index...' as test;
CREATE INDEX IF NOT EXISTS idx_test_sessions ON user_sessions(user_id);
SELECT 'user_sessions index: SUCCESS' as result;

-- Test 4: user_permissions table index
SELECT 'Testing user_permissions index...' as test;
CREATE INDEX IF NOT EXISTS idx_test_permissions ON user_permissions(user_id);
SELECT 'user_permissions index: SUCCESS' as result;

-- Test 5: user_verification_requests table index
SELECT 'Testing user_verification_requests index...' as test;
CREATE INDEX IF NOT EXISTS idx_test_verification ON user_verification_requests(user_id);
SELECT 'user_verification_requests index: SUCCESS' as result;

-- Clean up test indexes
DROP INDEX IF EXISTS idx_test_user_profiles;
DROP INDEX IF EXISTS idx_test_activity_log;
DROP INDEX IF EXISTS idx_test_sessions;
DROP INDEX IF EXISTS idx_test_permissions;
DROP INDEX IF EXISTS idx_test_verification;

SELECT 'All individual index tests completed!' as final_result;