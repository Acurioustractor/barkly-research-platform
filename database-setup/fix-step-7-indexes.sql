-- =====================================================
-- Fix Step 7: Create indexes one by one to identify the issue
-- =====================================================

-- Test each index individually
SELECT '🔧 Creating user_profiles indexes...' as step;

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
SELECT '✅ idx_user_profiles_user_id created' as result;

CREATE INDEX IF NOT EXISTS idx_user_profiles_community ON user_profiles(primary_community_id, verification_status);
SELECT '✅ idx_user_profiles_community created' as result;

CREATE INDEX IF NOT EXISTS idx_user_profiles_verification ON user_profiles(verification_status, created_at DESC);
SELECT '✅ idx_user_profiles_verification created' as result;

SELECT '🔧 Creating user_activity_log indexes...' as step;

-- User activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON user_activity_log(user_id, created_at DESC);
SELECT '✅ idx_activity_user_time created' as result;

CREATE INDEX IF NOT EXISTS idx_activity_type_time ON user_activity_log(activity_type, created_at DESC);
SELECT '✅ idx_activity_type_time created' as result;

SELECT '🔧 Creating user_sessions indexes...' as step;

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, is_active, last_accessed_at DESC);
SELECT '✅ idx_sessions_user_active created' as result;

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token) WHERE is_active = true;
SELECT '✅ idx_sessions_token created' as result;

SELECT '🔧 Creating user_permissions indexes...' as step;

-- User permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_user ON user_permissions(user_id, is_active);
SELECT '✅ idx_permissions_user created' as result;

CREATE INDEX IF NOT EXISTS idx_permissions_type_scope ON user_permissions(permission_type, permission_scope, is_active);
SELECT '✅ idx_permissions_type_scope created' as result;

SELECT '🔧 Creating user_verification_requests indexes...' as step;

-- User verification requests indexes
CREATE INDEX IF NOT EXISTS idx_verification_user ON user_verification_requests(user_id, status);
SELECT '✅ idx_verification_user created' as result;

CREATE INDEX IF NOT EXISTS idx_verification_type ON user_verification_requests(verification_type, status);
SELECT '✅ idx_verification_type created' as result;

SELECT '🎉 All indexes created successfully!' as final_result;