-- Enhanced Story Submission System Database Schema
-- This schema supports multimedia stories with community moderation

-- Enhanced Community Stories Table
-- Extends the existing story system with multimedia and enhanced moderation
CREATE TABLE enhanced_community_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100),
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    media_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (media_type IN ('text', 'audio', 'video', 'multimedia')),
    cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    themes TEXT[] DEFAULT '{}',
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID,
    
    -- Multimedia content
    media_urls JSONB DEFAULT '{"audio": [], "video": [], "images": [], "documents": []}',
    duration INTEGER, -- in seconds for audio/video
    language VARCHAR(50),
    dialect VARCHAR(50),
    location VARCHAR(255),
    recorded_at TIMESTAMP WITH TIME ZONE,
    
    -- Community context
    community_priorities TEXT[] DEFAULT '{}',
    cultural_themes TEXT[] DEFAULT '{}',
    traditional_knowledge BOOLEAN DEFAULT false,
    requires_elder_review BOOLEAN DEFAULT false,
    
    -- Accessibility
    has_transcript BOOLEAN DEFAULT false,
    has_subtitles BOOLEAN DEFAULT false,
    has_sign_language BOOLEAN DEFAULT false,
    accessibility_notes TEXT,
    
    -- Moderation
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    moderation_notes TEXT,
    moderated_by VARCHAR(255),
    moderated_at TIMESTAMP WITH TIME ZONE,
    requires_cultural_review BOOLEAN DEFAULT false,
    requires_elder_review BOOLEAN DEFAULT false,
    requires_technical_review BOOLEAN DEFAULT false,
    
    -- Engagement
    is_inspiring BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    allow_sharing BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Publishing
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Categories Table
-- Defines categories for story organization
CREATE TABLE story_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    cultural_safety VARCHAR(20) DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(community_id, name)
);

-- Community Themes Table
-- Defines themes and priorities for story categorization
CREATE TABLE community_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_priority BOOLEAN DEFAULT false,
    related_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(community_id, name)
);

-- Story Moderation Queue Table
-- Tracks stories awaiting moderation
CREATE TABLE story_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    priority VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to VARCHAR(255),
    cultural_review_required BOOLEAN DEFAULT false,
    elder_review_required BOOLEAN DEFAULT false,
    technical_review_required BOOLEAN DEFAULT false,
    estimated_review_time INTEGER DEFAULT 15, -- minutes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Moderation Log Table
-- Tracks all moderation decisions and actions
CREATE TABLE story_moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    moderator_id VARCHAR(255) NOT NULL,
    moderator_type VARCHAR(50) NOT NULL CHECK (moderator_type IN ('admin', 'elder', 'cultural_authority', 'technical_moderator')),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_revision', 'escalated')),
    notes TEXT,
    review_time INTEGER, -- minutes spent reviewing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Moderation Notifications Table
-- Tracks notifications sent to moderators
CREATE TABLE moderation_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    moderator_type VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Engagement Table
-- Tracks user engagement with stories
CREATE TABLE story_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    user_id UUID,
    engagement_type VARCHAR(20) NOT NULL CHECK (engagement_type IN ('view', 'like', 'share', 'comment', 'bookmark')),
    engagement_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id, engagement_type)
);

-- Story Comments Table
-- User comments on stories
CREATE TABLE story_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    user_id UUID,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Transcripts Table
-- Transcripts for audio and video stories
CREATE TABLE story_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'en',
    confidence_score DECIMAL(3,2), -- AI transcription confidence
    is_human_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    timestamps JSONB, -- Word-level timestamps for synchronization
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Analytics Table
-- Analytics and metrics for stories
CREATE TABLE story_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    engagement_time INTEGER DEFAULT 0, -- seconds
    completion_rate DECIMAL(5,2), -- percentage
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, date)
);

-- User Notifications Table
-- Notifications for story authors and users
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_enhanced_stories_community ON enhanced_community_stories(community_id);
CREATE INDEX idx_enhanced_stories_published ON enhanced_community_stories(published, published_at DESC);
CREATE INDEX idx_enhanced_stories_moderation ON enhanced_community_stories(moderation_status);
CREATE INDEX idx_enhanced_stories_category ON enhanced_community_stories(category);
CREATE INDEX idx_enhanced_stories_media_type ON enhanced_community_stories(media_type);
CREATE INDEX idx_enhanced_stories_cultural_safety ON enhanced_community_stories(cultural_safety);
CREATE INDEX idx_enhanced_stories_traditional ON enhanced_community_stories(traditional_knowledge);
CREATE INDEX idx_enhanced_stories_themes ON enhanced_community_stories USING GIN(themes);
CREATE INDEX idx_enhanced_stories_priorities ON enhanced_community_stories USING GIN(community_priorities);
CREATE INDEX idx_enhanced_stories_cultural_themes ON enhanced_community_stories USING GIN(cultural_themes);

CREATE INDEX idx_story_categories_community ON story_categories(community_id);
CREATE INDEX idx_story_categories_active ON story_categories(is_active, sort_order);

CREATE INDEX idx_community_themes_community ON community_themes(community_id);
CREATE INDEX idx_community_themes_active ON community_themes(is_active);
CREATE INDEX idx_community_themes_priority ON community_themes(is_priority);

CREATE INDEX idx_moderation_queue_priority ON story_moderation_queue(priority, created_at);
CREATE INDEX idx_moderation_queue_assigned ON story_moderation_queue(assigned_to);
CREATE INDEX idx_moderation_queue_cultural ON story_moderation_queue(cultural_review_required);
CREATE INDEX idx_moderation_queue_elder ON story_moderation_queue(elder_review_required);
CREATE INDEX idx_moderation_queue_technical ON story_moderation_queue(technical_review_required);

CREATE INDEX idx_moderation_log_story ON story_moderation_log(story_id);
CREATE INDEX idx_moderation_log_moderator ON story_moderation_log(moderator_id);
CREATE INDEX idx_moderation_log_decision ON story_moderation_log(decision);

CREATE INDEX idx_story_engagement_story ON story_engagement(story_id);
CREATE INDEX idx_story_engagement_user ON story_engagement(user_id);
CREATE INDEX idx_story_engagement_type ON story_engagement(engagement_type);

CREATE INDEX idx_story_comments_story ON story_comments(story_id);
CREATE INDEX idx_story_comments_approved ON story_comments(is_approved);
CREATE INDEX idx_story_comments_parent ON story_comments(parent_comment_id);

CREATE INDEX idx_story_transcripts_story ON story_transcripts(story_id);
CREATE INDEX idx_story_transcripts_language ON story_transcripts(language);

CREATE INDEX idx_story_analytics_story ON story_analytics(story_id);
CREATE INDEX idx_story_analytics_date ON story_analytics(date);

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_type ON user_notifications(type);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_enhanced_stories_updated_at BEFORE UPDATE ON enhanced_community_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_categories_updated_at BEFORE UPDATE ON story_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_themes_updated_at BEFORE UPDATE ON community_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON story_moderation_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_comments_updated_at BEFORE UPDATE ON story_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_transcripts_updated_at BEFORE UPDATE ON story_transcripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update story engagement counts
CREATE OR REPLACE FUNCTION update_story_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        CASE NEW.engagement_type
            WHEN 'like' THEN
                UPDATE enhanced_community_stories 
                SET likes_count = likes_count + 1, updated_at = NOW()
                WHERE id = NEW.story_id;
            WHEN 'view' THEN
                UPDATE enhanced_community_stories 
                SET views_count = views_count + 1, updated_at = NOW()
                WHERE id = NEW.story_id;
            WHEN 'share' THEN
                UPDATE enhanced_community_stories 
                SET shares_count = shares_count + 1, updated_at = NOW()
                WHERE id = NEW.story_id;
        END CASE;
    ELSIF TG_OP = 'DELETE' THEN
        CASE OLD.engagement_type
            WHEN 'like' THEN
                UPDATE enhanced_community_stories 
                SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW()
                WHERE id = OLD.story_id;
            WHEN 'view' THEN
                UPDATE enhanced_community_stories 
                SET views_count = GREATEST(views_count - 1, 0), updated_at = NOW()
                WHERE id = OLD.story_id;
            WHEN 'share' THEN
                UPDATE enhanced_community_stories 
                SET shares_count = GREATEST(shares_count - 1, 0), updated_at = NOW()
                WHERE id = OLD.story_id;
        END CASE;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER story_engagement_counts_trigger
    AFTER INSERT OR DELETE ON story_engagement
    FOR EACH ROW EXECUTE FUNCTION update_story_engagement_counts();

-- Function to automatically publish approved stories
CREATE OR REPLACE FUNCTION auto_publish_approved_stories()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
        NEW.published = true;
        NEW.published_at = NOW();
    ELSIF NEW.moderation_status != 'approved' AND OLD.moderation_status = 'approved' THEN
        NEW.published = false;
        NEW.published_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_publish_trigger
    BEFORE UPDATE ON enhanced_community_stories
    FOR EACH ROW EXECUTE FUNCTION auto_publish_approved_stories();

-- Function to get story moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_statistics(
    p_community_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_submissions BIGINT,
    pending_review BIGINT,
    approved_stories BIGINT,
    rejected_stories BIGINT,
    needs_revision BIGINT,
    cultural_review_required BIGINT,
    elder_review_required BIGINT,
    technical_review_required BIGINT,
    average_review_time NUMERIC,
    multimedia_submissions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH story_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved,
            COUNT(*) FILTER (WHERE moderation_status = 'rejected') as rejected,
            COUNT(*) FILTER (WHERE moderation_status = 'needs_revision') as revision,
            COUNT(*) FILTER (WHERE requires_cultural_review = true) as cultural,
            COUNT(*) FILTER (WHERE requires_elder_review = true) as elder,
            COUNT(*) FILTER (WHERE requires_technical_review = true) as technical,
            COUNT(*) FILTER (WHERE media_type != 'text') as multimedia
        FROM enhanced_community_stories
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (p_community_id IS NULL OR community_id = p_community_id)
    ),
    review_time_stats AS (
        SELECT AVG(review_time) as avg_time
        FROM story_moderation_log sml
        JOIN enhanced_community_stories ecs ON sml.story_id = ecs.id
        WHERE sml.created_at BETWEEN p_start_date AND p_end_date
        AND (p_community_id IS NULL OR ecs.community_id = p_community_id)
        AND review_time IS NOT NULL
    )
    SELECT 
        ss.total,
        ss.pending,
        ss.approved,
        ss.rejected,
        ss.revision,
        ss.cultural,
        ss.elder,
        ss.technical,
        COALESCE(rts.avg_time, 0),
        ss.multimedia
    FROM story_stats ss
    CROSS JOIN review_time_stats rts;
END;
$$ LANGUAGE plpgsql;

-- Function to get community story themes usage
CREATE OR REPLACE FUNCTION get_theme_usage_statistics(p_community_id UUID)
RETURNS TABLE (
    theme_name TEXT,
    usage_count BIGINT,
    is_priority BOOLEAN,
    recent_usage BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH theme_usage AS (
        SELECT 
            unnest(cultural_themes) as theme,
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_count
        FROM enhanced_community_stories
        WHERE community_id = p_community_id
        AND published = true
        GROUP BY unnest(cultural_themes)
    )
    SELECT 
        tu.theme,
        tu.total_count,
        COALESCE(ct.is_priority, false),
        tu.recent_count
    FROM theme_usage tu
    LEFT JOIN community_themes ct ON ct.name = tu.theme AND ct.community_id = p_community_id
    ORDER BY tu.total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert default story categories
INSERT INTO story_categories (name, description, icon, community_id, sort_order, cultural_safety, requires_approval)
SELECT 
    category.name,
    category.description,
    category.icon,
    c.id,
    category.sort_order,
    category.cultural_safety,
    category.requires_approval
FROM communities c
CROSS JOIN (
    VALUES 
    ('Personal Stories', 'Individual experiences and journeys', 'user', 1, 'public', false),
    ('Community Events', 'Stories from community gatherings and events', 'calendar', 2, 'public', false),
    ('Traditional Knowledge', 'Cultural practices and traditional wisdom', 'book', 3, 'community', true),
    ('Success Stories', 'Achievements and positive outcomes', 'star', 4, 'public', false),
    ('Challenges', 'Difficulties faced and lessons learned', 'alert-triangle', 5, 'community', false),
    ('Youth Voices', 'Stories from young community members', 'users', 6, 'public', false),
    ('Elder Wisdom', 'Stories and advice from community elders', 'crown', 7, 'community', true),
    ('Cultural Practices', 'Traditional ceremonies and customs', 'globe', 8, 'restricted', true),
    ('Land and Country', 'Connection to land and traditional country', 'map', 9, 'community', false),
    ('Family Stories', 'Family histories and relationships', 'heart', 10, 'community', false)
) AS category(name, description, icon, sort_order, cultural_safety, requires_approval)
WHERE c.name LIKE '%Tennant Creek%' OR c.name LIKE '%Barkly%'
LIMIT 1;

-- Insert default community themes
INSERT INTO community_themes (name, description, color, community_id, is_priority, related_topics)
SELECT 
    theme.name,
    theme.description,
    theme.color,
    c.id,
    theme.is_priority,
    theme.related_topics
FROM communities c
CROSS JOIN (
    VALUES 
    ('Health and Wellbeing', 'Physical, mental, and spiritual health', '#10B981', true, ARRAY['healthcare', 'mental health', 'traditional medicine']),
    ('Education', 'Learning and knowledge sharing', '#3B82F6', true, ARRAY['schools', 'training', 'literacy']),
    ('Employment', 'Work opportunities and economic development', '#F59E0B', true, ARRAY['jobs', 'business', 'skills']),
    ('Housing', 'Accommodation and living conditions', '#8B5CF6', true, ARRAY['homes', 'infrastructure', 'maintenance']),
    ('Culture and Language', 'Traditional culture and language preservation', '#EF4444', true, ARRAY['ceremony', 'language', 'traditions']),
    ('Youth Development', 'Programs and support for young people', '#06B6D4', false, ARRAY['youth programs', 'mentoring', 'activities']),
    ('Elder Care', 'Support and care for community elders', '#84CC16', false, ARRAY['aged care', 'respect', 'wisdom']),
    ('Community Safety', 'Safety and security in the community', '#F97316', false, ARRAY['crime prevention', 'safety', 'security']),
    ('Environment', 'Environmental protection and sustainability', '#22C55E', false, ARRAY['land care', 'conservation', 'sustainability']),
    ('Transport', 'Transportation and mobility', '#6366F1', false, ARRAY['vehicles', 'roads', 'access'])
) AS theme(name, description, color, is_priority, related_topics)
WHERE c.name LIKE '%Tennant Creek%' OR c.name LIKE '%Barkly%'
LIMIT 1;

-- Create a view for published stories with engagement metrics
CREATE VIEW published_stories_with_metrics AS
SELECT 
    s.*,
    COALESCE(sa.views, 0) as total_views,
    COALESCE(sa.unique_views, 0) as total_unique_views,
    COALESCE(sa.engagement_time, 0) as total_engagement_time,
    COALESCE(sa.completion_rate, 0) as avg_completion_rate,
    COALESCE(cc.comment_count, 0) as comment_count
FROM enhanced_community_stories s
LEFT JOIN (
    SELECT 
        story_id,
        SUM(views) as views,
        SUM(unique_views) as unique_views,
        SUM(engagement_time) as engagement_time,
        AVG(completion_rate) as completion_rate
    FROM story_analytics
    GROUP BY story_id
) sa ON s.id = sa.story_id
LEFT JOIN (
    SELECT 
        story_id,
        COUNT(*) as comment_count
    FROM story_comments
    WHERE is_approved = true
    GROUP BY story_id
) cc ON s.id = cc.story_id
WHERE s.published = true;

COMMENT ON TABLE enhanced_community_stories IS 'Enhanced story submission system with multimedia support';
COMMENT ON TABLE story_categories IS 'Categories for organizing community stories';
COMMENT ON TABLE community_themes IS 'Themes and priorities for story categorization';
COMMENT ON TABLE story_moderation_queue IS 'Queue for stories awaiting moderation';
COMMENT ON TABLE story_moderation_log IS 'Log of all moderation decisions and actions';
COMMENT ON TABLE story_engagement IS 'User engagement tracking for stories';
COMMENT ON TABLE story_comments IS 'User comments on published stories';
COMMENT ON TABLE story_transcripts IS 'Transcripts for audio and video stories';
COMMENT ON TABLE story_analytics IS 'Analytics and metrics for story performance';