-- =====================================================
-- TASK 10 - STEP 1: Real-time Activity Feeds and User Presence
-- Real-time Collaboration Infrastructure
-- =====================================================

-- Create user sessions table for tracking active users
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id UUID NOT NULL, -- Would reference auth.users in real system
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Session Details
    session_token TEXT NOT NULL UNIQUE,
    device_type TEXT DEFAULT 'web'
        CHECK (device_type IN ('web', 'mobile', 'tablet', 'desktop')),
    browser_info TEXT,
    ip_address INET,
    
    -- Activity Tracking
    current_page TEXT, -- Current page/view user is on
    current_document_id UUID REFERENCES documents(id),
    current_collection_id UUID REFERENCES research_collections(id),
    current_project_id UUID REFERENCES research_projects(id),
    
    -- Presence Status
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'idle', 'away', 'offline')),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Cultural Context
    cultural_permissions JSONB DEFAULT '{}', -- Cached permissions for quick access
    elder_status BOOLEAN DEFAULT false,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create activity feed table for real-time updates
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Activity Information
    activity_type TEXT NOT NULL
        CHECK (activity_type IN ('document_upload', 'document_edit', 'collection_create', 'collection_update', 'project_create', 'project_update', 'collaboration_join', 'collaboration_leave', 'milestone_complete', 'comment_add', 'cultural_review', 'elder_approval')),
    activity_description TEXT NOT NULL,
    
    -- Actor Information
    actor_user_id UUID NOT NULL, -- User who performed the action
    actor_name TEXT, -- Cached name for performance
    actor_role TEXT, -- Role in the context (researcher, elder, etc.)
    
    -- Target Information
    target_type TEXT NOT NULL
        CHECK (target_type IN ('document', 'collection', 'project', 'milestone', 'comment', 'user')),
    target_id UUID NOT NULL,
    target_name TEXT, -- Cached name for performance
    
    -- Context
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    project_id UUID REFERENCES research_projects(id),
    collection_id UUID REFERENCES research_collections(id),
    document_id UUID REFERENCES documents(id),
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_elder_notification BOOLEAN DEFAULT false,
    cultural_protocols_involved JSONB DEFAULT '{}',
    
    -- Visibility and Permissions
    visibility TEXT DEFAULT 'community'
        CHECK (visibility IN ('private', 'project_team', 'community', 'public')),
    visible_to_roles TEXT[] DEFAULT '{}', -- Specific roles that can see this activity
    
    -- Metadata
    activity_metadata JSONB DEFAULT '{}', -- Additional context data
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT activity_feed_target_check CHECK (target_id IS NOT NULL)
);

-- Create real-time notifications table
CREATE TABLE IF NOT EXISTS realtime_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Notification Information
    notification_type TEXT NOT NULL
        CHECK (notification_type IN ('mention', 'assignment', 'approval_request', 'cultural_review', 'milestone_due', 'collaboration_invite', 'document_shared', 'comment_reply', 'system_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Recipient Information
    recipient_user_id UUID NOT NULL, -- User who should receive notification
    recipient_community_id UUID NOT NULL REFERENCES communities(id),
    
    -- Sender Information
    sender_user_id UUID, -- User who triggered the notification (can be null for system notifications)
    sender_name TEXT,
    
    -- Context
    related_activity_id UUID REFERENCES activity_feed(id),
    target_type TEXT
        CHECK (target_type IN ('document', 'collection', 'project', 'milestone', 'comment', 'user')),
    target_id UUID,
    target_url TEXT, -- Deep link to the relevant content
    
    -- Cultural Context
    cultural_significance TEXT DEFAULT 'standard'
        CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_cultural_approval BOOLEAN DEFAULT false,
    elder_notification BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT DEFAULT 'unread'
        CHECK (status IN ('unread', 'read', 'dismissed', 'archived')),
    priority TEXT DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery
    delivery_method TEXT[] DEFAULT ARRAY['in_app']
        CHECK (delivery_method <@ ARRAY['in_app', 'email', 'sms', 'push']),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Create user presence table for real-time collaboration
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id UUID NOT NULL, -- Would reference auth.users
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    
    -- Presence Location
    presence_type TEXT NOT NULL
        CHECK (presence_type IN ('document', 'collection', 'project', 'search', 'dashboard')),
    document_id UUID REFERENCES documents(id),
    collection_id UUID REFERENCES research_collections(id),
    project_id UUID REFERENCES research_projects(id),
    page_url TEXT,
    
    -- Presence Details
    status TEXT DEFAULT 'viewing'
        CHECK (status IN ('viewing', 'editing', 'commenting', 'reviewing', 'idle')),
    cursor_position INTEGER, -- For document editing
    selection_start INTEGER,
    selection_end INTEGER,
    
    -- Cultural Context
    viewing_cultural_content BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT,
    requires_elder_oversight BOOLEAN DEFAULT false,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, session_id, presence_type, COALESCE(document_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

-- =====================================================
-- REAL-TIME FUNCTIONS
-- =====================================================

-- Function to update user session heartbeat
CREATE OR REPLACE FUNCTION update_user_heartbeat(
    p_session_token TEXT,
    p_current_page TEXT DEFAULT NULL,
    p_current_document_id UUID DEFAULT NULL,
    p_current_collection_id UUID DEFAULT NULL,
    p_current_project_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_sessions 
    SET last_heartbeat_at = NOW(),
        last_activity_at = NOW(),
        status = 'active',
        current_page = COALESCE(p_current_page, current_page),
        current_document_id = p_current_document_id,
        current_collection_id = p_current_collection_id,
        current_project_id = p_current_project_id,
        updated_at = NOW()
    WHERE session_token = p_session_token
    AND expires_at > NOW();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to create activity feed entry
CREATE OR REPLACE FUNCTION create_activity_entry(
    p_activity_type TEXT,
    p_activity_description TEXT,
    p_actor_user_id UUID,
    p_actor_name TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_target_name TEXT,
    p_community_id UUID,
    p_cultural_significance TEXT DEFAULT 'standard',
    p_visibility TEXT DEFAULT 'community',
    p_activity_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    requires_elder_notification BOOLEAN := false;
BEGIN
    -- Determine if elder notification is required
    IF p_cultural_significance IN ('sacred', 'ceremonial') THEN
        requires_elder_notification := true;
    END IF;
    
    INSERT INTO activity_feed (
        activity_type,
        activity_description,
        actor_user_id,
        actor_name,
        target_type,
        target_id,
        target_name,
        community_id,
        cultural_significance,
        requires_elder_notification,
        visibility,
        activity_metadata
    ) VALUES (
        p_activity_type,
        p_activity_description,
        p_actor_user_id,
        p_actor_name,
        p_target_type,
        p_target_id,
        p_target_name,
        p_community_id,
        p_cultural_significance,
        requires_elder_notification,
        p_visibility,
        p_activity_metadata
    ) RETURNING id INTO activity_id;
    
    -- Create notifications for relevant users
    PERFORM create_activity_notifications(activity_id);
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications from activity
CREATE OR REPLACE FUNCTION create_activity_notifications(p_activity_id UUID)
RETURNS INTEGER AS $$
DECLARE
    activity_record RECORD;
    notification_count INTEGER := 0;
    collaborator_record RECORD;
BEGIN
    -- Get activity details
    SELECT * INTO activity_record FROM activity_feed WHERE id = p_activity_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Create notifications based on activity type and context
    CASE activity_record.activity_type
        WHEN 'cultural_review', 'elder_approval' THEN
            -- Notify elders and cultural consultants
            FOR collaborator_record IN 
                SELECT DISTINCT collaborator_id, role
                FROM research_collaborations rc
                WHERE rc.research_project_id = activity_record.project_id
                AND rc.elder_status = true
                AND rc.status = 'active'
            LOOP
                INSERT INTO realtime_notifications (
                    notification_type,
                    title,
                    message,
                    recipient_user_id,
                    recipient_community_id,
                    sender_user_id,
                    sender_name,
                    related_activity_id,
                    target_type,
                    target_id,
                    cultural_significance,
                    elder_notification,
                    priority
                ) VALUES (
                    'cultural_review',
                    'Cultural Review Required',
                    activity_record.activity_description,
                    collaborator_record.collaborator_id,
                    activity_record.community_id,
                    activity_record.actor_user_id,
                    activity_record.actor_name,
                    p_activity_id,
                    activity_record.target_type,
                    activity_record.target_id,
                    activity_record.cultural_significance,
                    true,
                    'high'
                );
                notification_count := notification_count + 1;
            END LOOP;
            
        WHEN 'milestone_complete' THEN
            -- Notify project team
            FOR collaborator_record IN 
                SELECT DISTINCT collaborator_id
                FROM research_collaborations rc
                WHERE rc.research_project_id = activity_record.project_id
                AND rc.status = 'active'
                AND rc.collaborator_id != activity_record.actor_user_id
            LOOP
                INSERT INTO realtime_notifications (
                    notification_type,
                    title,
                    message,
                    recipient_user_id,
                    recipient_community_id,
                    sender_user_id,
                    sender_name,
                    related_activity_id,
                    target_type,
                    target_id
                ) VALUES (
                    'milestone_due',
                    'Milestone Completed',
                    activity_record.activity_description,
                    collaborator_record.collaborator_id,
                    activity_record.community_id,
                    activity_record.actor_user_id,
                    activity_record.actor_name,
                    p_activity_id,
                    activity_record.target_type,
                    activity_record.target_id
                );
                notification_count := notification_count + 1;
            END LOOP;
    END CASE;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
    p_user_id UUID,
    p_session_id UUID,
    p_presence_type TEXT,
    p_document_id UUID DEFAULT NULL,
    p_collection_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'viewing',
    p_cursor_position INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    presence_id UUID;
    community_id_val UUID;
    cultural_level TEXT;
    requires_oversight BOOLEAN := false;
BEGIN
    -- Get community context
    SELECT community_id INTO community_id_val FROM user_sessions WHERE id = p_session_id;
    
    -- Determine cultural context
    IF p_document_id IS NOT NULL THEN
        SELECT cultural_sensitivity_level INTO cultural_level 
        FROM documents WHERE id = p_document_id;
        
        IF cultural_level IN ('sacred', 'ceremonial') THEN
            requires_oversight := true;
        END IF;
    END IF;
    
    INSERT INTO user_presence (
        user_id,
        community_id,
        session_id,
        presence_type,
        document_id,
        collection_id,
        project_id,
        status,
        cursor_position,
        viewing_cultural_content,
        cultural_sensitivity_level,
        requires_elder_oversight
    ) VALUES (
        p_user_id,
        community_id_val,
        p_session_id,
        p_presence_type,
        p_document_id,
        p_collection_id,
        p_project_id,
        p_status,
        p_cursor_position,
        cultural_level IS NOT NULL,
        cultural_level,
        requires_oversight
    ) ON CONFLICT (user_id, session_id, presence_type, COALESCE(document_id, '00000000-0000-0000-0000-000000000000'::UUID))
    DO UPDATE SET
        status = EXCLUDED.status,
        cursor_position = EXCLUDED.cursor_position,
        last_updated_at = NOW()
    RETURNING id INTO presence_id;
    
    RETURN presence_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_community ON user_sessions(community_id, status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_heartbeat ON user_sessions(last_heartbeat_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE expires_at < NOW();

-- Activity feed indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_community ON activity_feed(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON activity_feed(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_cultural ON activity_feed(cultural_significance, requires_elder_notification, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON activity_feed(visibility, community_id, created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON realtime_notifications(recipient_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_community ON realtime_notifications(recipient_community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_cultural ON realtime_notifications(elder_notification, cultural_significance, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON realtime_notifications(expires_at) WHERE expires_at < NOW();

-- User presence indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id, presence_type, last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_document ON user_presence(document_id, status, last_updated_at DESC) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_presence_cultural ON user_presence(viewing_cultural_content, requires_elder_oversight, last_updated_at DESC);

SELECT 'Real-time activity feeds and user presence system created successfully' as status;