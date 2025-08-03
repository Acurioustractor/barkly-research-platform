-- =====================================================
-- Debug User Management - Step by Step
-- Run this to identify exactly where the error occurs
-- =====================================================

-- Test 1: Check if auth.users table exists
SELECT 'TEST 1: Check auth.users table' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN '✅ EXISTS' ELSE '❌ MISSING' END as auth_users_table;

-- Test 2: Check auth.users table structure
SELECT 'TEST 2: Check auth.users columns' as test_name;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Test 3: Try creating a simple table with auth.users reference
SELECT 'TEST 3: Create simple test table' as test_name;
CREATE TABLE IF NOT EXISTS test_user_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_field TEXT
);

-- Test 4: Check if communities table exists (needed for foreign key)
SELECT 'TEST 4: Check communities table' as test_name;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'communities') THEN '✅ EXISTS' ELSE '❌ MISSING' END as communities_table;

-- Test 5: Try creating user_profiles table step by step
SELECT 'TEST 5: Create basic user_profiles table' as test_name;
CREATE TABLE IF NOT EXISTS user_profiles_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test 6: Try enabling RLS on the test table
SELECT 'TEST 6: Enable RLS on test table' as test_name;
ALTER TABLE user_profiles_test ENABLE ROW LEVEL SECURITY;

-- Test 7: Try creating a simple RLS policy
SELECT 'TEST 7: Create simple RLS policy' as test_name;
DROP POLICY IF EXISTS "Test policy" ON user_profiles_test;
CREATE POLICY "Test policy" ON user_profiles_test
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Clean up test tables
DROP TABLE IF EXISTS test_user_ref;
DROP TABLE IF EXISTS user_profiles_test;

SELECT 'Debug test completed - check results above for errors' as final_message;