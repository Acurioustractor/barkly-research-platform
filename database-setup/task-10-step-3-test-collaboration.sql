-- =====================================================
-- TASK 10 - STEP 3: Test Real-time Collaboration System
-- Comprehensive Testing of Collaborative Features
-- =====================================================

-- Test user session creation
SELECT 'Testing user session creation...' as test_phase;

INSERT INTO user_sessions (
    user_id,
    community_id,
    session_token,
    device_type,
    current_page,
    current_document_id,
    status,
    elder_status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'test-session-token-123',
    'web',
    '/documents/test-document',
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    'active',
    false
);

-- Test heartbeat update
SELECT 'Testing heartbeat update...' as test_phase;

SELECT update_user_heartbeat(
    'test-session-token-123',
    '/documents/test-document/edit',
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    NULL,
    NULL
) as heartbeat_updated;

-- Test activity feed creation
SELECT 'Testing activity feed creation...' as test_phase;

SELECT create_activity_entry(
    'document_edit',
    'User started editing the traditional knowledge document',
    gen_random_uuid(),
    'Test User',
    'document',
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    'Test Document',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    'sacred',
    'project_team',
    '{"edit_type": "content", "section": "introduction"}'::jsonb
) as activity_id;

-- Test document comment creation
SELECT 'Testing document comment creation...' as test_phase;

SELECT create_document_comment(
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    'This section contains important traditional knowledge that should be reviewed by elders before publication.',
    gen_random_uuid(),
    'Cultural Consultant',
    'cultural_note',
    (SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf') LIMIT 1),
    NULL,
    100,
    250,
    'traditional knowledge that should be reviewed'
) as comment_id;

-- Test reply to comment
WITH parent_comment AS (
    SELECT id FROM document_comments ORDER BY created_at DESC LIMIT 1
)
SELECT create_document_comment(
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    'I agree, this definitely needs elder review. I can coordinate with Elder Mary for the cultural validation.',
    gen_random_uuid(),
    'Research Lead',
    'general',
    NULL,
    (SELECT id FROM parent_comment),
    NULL,
    NULL,
    NULL
) as reply_comment_id;

-- Test edit session creation
SELECT 'Testing edit session creation...' as test_phase;

SELECT start_edit_session(
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    gen_random_uuid(),
    'Collaborative Editor',
    'edit-session-token-456',
    (SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf') LIMIT 1),
    'content'
) as edit_session_id;

-- Test document change logging
SELECT 'Testing document change logging...' as test_phase;

SELECT log_document_change(
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    gen_random_uuid(),
    'Content Editor',
    'update',
    'text_content',
    'Original text about traditional practices',
    'Updated text about traditional practices with additional cultural context',
    'Added cultural context as requested by elder review',
    (SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf') LIMIT 1),
    (SELECT id FROM document_edit_sessions ORDER BY created_at DESC LIMIT 1)
) as change_log_id;

-- Test collaborative annotation creation
SELECT 'Testing collaborative annotation creation...' as test_phase;

SELECT create_annotation(
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    'cultural_context',
    'This term has specific cultural significance in our community and should be explained in the glossary.',
    300,
    350,
    'traditional ecological knowledge',
    gen_random_uuid(),
    'Elder Advisor',
    (SELECT id FROM document_chunks WHERE document_id = (SELECT id FROM documents WHERE filename = 'test-document.pdf') LIMIT 1)
) as annotation_id;

-- Test user presence update
SELECT 'Testing user presence update...' as test_phase;

SELECT update_user_presence(
    gen_random_uuid(),
    (SELECT id FROM user_sessions WHERE session_token = 'test-session-token-123'),
    'document',
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    NULL,
    NULL,
    'editing',
    425
) as presence_id;

SELECT 'Real-time collaboration system testing completed' as test_status;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify user sessions
SELECT 'User Sessions:' as section;
SELECT 
    device_type,
    current_page,
    status,
    elder_status,
    last_activity_at,
    last_heartbeat_at
FROM user_sessions
ORDER BY created_at DESC
LIMIT 3;

-- Verify activity feed
SELECT 'Activity Feed:' as section;
SELECT 
    activity_type,
    left(activity_description, 60) || '...' as description_preview,
    actor_name,
    target_type,
    cultural_significance,
    requires_elder_notification,
    visibility,
    created_at
FROM activity_feed
ORDER BY created_at DESC
LIMIT 5;

-- Verify document comments
SELECT 'Document Comments:' as section;
SELECT 
    comment_type,
    left(comment_text, 50) || '...' as comment_preview,
    author_name,
    cultural_sensitivity,
    requires_elder_review,
    elder_reviewed,
    status,
    reply_count,
    created_at
FROM document_comments
ORDER BY created_at DESC;

-- Verify edit sessions
SELECT 'Edit Sessions:' as section;
SELECT 
    editor_name,
    edit_type,
    editing_cultural_content,
    requires_elder_approval,
    status,
    last_activity_at
FROM document_edit_sessions
ORDER BY created_at DESC;

-- Verify change log
SELECT 'Document Changes:' as section;
SELECT 
    change_type,
    field_changed,
    editor_name,
    affects_cultural_content,
    left(change_description, 40) || '...' as description_preview,
    created_at
FROM document_change_log
ORDER BY created_at DESC;

-- Verify collaborative annotations
SELECT 'Collaborative Annotations:' as section;
SELECT 
    annotation_type,
    left(annotation_text, 40) || '...' as annotation_preview,
    author_name,
    cultural_annotation,
    traditional_knowledge_note,
    elder_validated,
    start_position,
    end_position,
    created_at
FROM collaborative_annotations
ORDER BY created_at DESC;

-- Verify notifications
SELECT 'Real-time Notifications:' as section;
SELECT 
    notification_type,
    title,
    left(message, 50) || '...' as message_preview,
    sender_name,
    cultural_significance,
    elder_notification,
    status,
    priority,
    created_at
FROM realtime_notifications
ORDER BY created_at DESC
LIMIT 5;

-- Test cultural sensitivity controls
SELECT 'Cultural Sensitivity Controls:' as section;

SELECT 
    'Sacred Content Activities' as category,
    count(*) as count
FROM activity_feed 
WHERE cultural_significance = 'sacred'

UNION ALL

SELECT 
    'Elder Notifications Required' as category,
    count(*) as count
FROM activity_feed 
WHERE requires_elder_notification = true

UNION ALL

SELECT 
    'Comments Requiring Elder Review' as category,
    count(*) as count
FROM document_comments 
WHERE requires_elder_review = true

UNION ALL

SELECT 
    'Cultural Annotations' as category,
    count(*) as count
FROM collaborative_annotations 
WHERE cultural_annotation = true

UNION ALL

SELECT 
    'Edit Sessions with Cultural Content' as category,
    count(*) as count
FROM document_edit_sessions 
WHERE editing_cultural_content = true;

-- Performance and engagement metrics
SELECT 'Collaboration Metrics:' as section;

SELECT 
    'REAL-TIME COLLABORATION SUMMARY' as summary,
    (SELECT count(*) FROM user_sessions) as active_sessions,
    (SELECT count(*) FROM activity_feed) as total_activities,
    (SELECT count(*) FROM document_comments) as total_comments,
    (SELECT count(*) FROM document_edit_sessions) as edit_sessions,
    (SELECT count(*) FROM document_change_log) as document_changes,
    (SELECT count(*) FROM collaborative_annotations) as annotations,
    (SELECT count(*) FROM realtime_notifications) as notifications,
    (SELECT count(*) FROM activity_feed WHERE cultural_significance IN ('sacred', 'ceremonial')) as sacred_activities,
    (SELECT count(*) FROM document_comments WHERE requires_elder_review = true) as comments_needing_review;

SELECT 'Real-time collaboration system testing completed successfully!' as status;