-- Dynamic Storytelling Database Schema
-- This schema supports interactive story exploration with multiple perspectives and outcome pathways

-- Story Explorations Table
-- Main table for storing interactive story exploration configurations
CREATE TABLE story_explorations (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    central_theme VARCHAR(255),
    
    -- Story Data (stored as JSONB for flexibility)
    story_nodes JSONB NOT NULL DEFAULT '[]',
    connections JSONB NOT NULL DEFAULT '[]',
    pathways JSONB NOT NULL DEFAULT '[]',
    perspectives JSONB NOT NULL DEFAULT '{}',
    timeline JSONB NOT NULL DEFAULT '{}',
    geographic_distribution JSONB NOT NULL DEFAULT '{}',
    cultural_context JSONB NOT NULL DEFAULT '{}',
    interactive_elements JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Connections Table
-- Explicit storage for story connections with verification
CREATE TABLE story_connections (
    id VARCHAR(255) PRIMARY KEY,
    from_story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    to_story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN ('causal', 'temporal', 'thematic', 'geographic', 'stakeholder')),
    strength NUMERIC(3,2) NOT NULL CHECK (strength >= 0 AND strength <= 1),
    description TEXT NOT NULL,
    evidence TEXT[] DEFAULT '{}',
    
    -- Verification and Quality
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    confidence_score NUMERIC(3,2) DEFAULT 0.7,
    
    -- AI Analysis Metadata
    ai_generated BOOLEAN DEFAULT true,
    analysis_version VARCHAR(50),
    analysis_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure no self-connections and no duplicates
    CONSTRAINT no_self_connection CHECK (from_story_id != to_story_id),
    CONSTRAINT unique_connection UNIQUE (from_story_id, to_story_id)
);

-- Outcome Pathways Table
-- Structured pathways showing how stories lead to outcomes
CREATE TABLE outcome_pathways (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    central_theme VARCHAR(255),
    
    -- Pathway Structure
    starting_stories UUID[] DEFAULT '{}',
    pathway_steps JSONB NOT NULL DEFAULT '[]',
    outcomes JSONB NOT NULL DEFAULT '[]',
    stakeholders TEXT[] DEFAULT '{}',
    
    -- Timeline Information
    timespan_start TIMESTAMP WITH TIME ZONE,
    timespan_end TIMESTAMP WITH TIME ZONE,
    duration_description VARCHAR(255),
    
    -- Impact Metrics
    reach_score INTEGER DEFAULT 0,
    depth_score INTEGER DEFAULT 0,
    sustainability_score NUMERIC(3,2) DEFAULT 0,
    
    -- Cultural and Learning Context
    cultural_significance TEXT,
    lessons_learned TEXT[] DEFAULT '{}',
    replication_potential VARCHAR(20) CHECK (replication_potential IN ('low', 'medium', 'high')),
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Narrative Flows Table
-- Guided storytelling experiences with branching narratives
CREATE TABLE narrative_flows (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pathway_id VARCHAR(255) REFERENCES outcome_pathways(id) ON DELETE CASCADE,
    
    -- Flow Structure
    starting_point VARCHAR(255) NOT NULL,
    flow_steps JSONB NOT NULL DEFAULT '[]',
    branching_points JSONB NOT NULL DEFAULT '[]',
    endings JSONB NOT NULL DEFAULT '[]',
    
    -- Flow Metadata
    estimated_duration INTEGER, -- in minutes
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    target_audience TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    
    -- Cultural Considerations
    cultural_safety_level VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety_level IN ('public', 'community', 'restricted', 'sacred')),
    cultural_protocols TEXT[] DEFAULT '{}',
    elder_review_required BOOLEAN DEFAULT false,
    
    -- Status and Quality
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    quality_score NUMERIC(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Exploration Analytics Table
-- Track engagement and usage of story explorations
CREATE TABLE story_exploration_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exploration_id VARCHAR(255) NOT NULL REFERENCES story_explorations(id) ON DELETE CASCADE,
    
    -- Engagement Metrics
    view_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    completion_rate NUMERIC(5,2) DEFAULT 0,
    average_time_spent INTEGER DEFAULT 0, -- in seconds
    
    -- User Journey Analytics
    most_viewed_stories TEXT[] DEFAULT '{}',
    most_followed_pathways TEXT[] DEFAULT '{}',
    common_exit_points TEXT[] DEFAULT '{}',
    popular_filters JSONB DEFAULT '{}',
    
    -- Temporal Analytics
    last_accessed TIMESTAMP WITH TIME ZONE,
    peak_usage_times JSONB DEFAULT '{}',
    usage_patterns JSONB DEFAULT '{}',
    
    -- Feedback and Quality
    user_ratings NUMERIC(3,2)[] DEFAULT '{}',
    feedback_comments TEXT[] DEFAULT '{}',
    reported_issues TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(exploration_id)
);

-- Story Perspective Classifications Table
-- Enhanced classification of stories by perspective and impact
CREATE TABLE story_perspective_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES enhanced_community_stories(id) ON DELETE CASCADE,
    
    -- Perspective Classification
    primary_perspective VARCHAR(50) NOT NULL CHECK (primary_perspective IN ('individual', 'family', 'community', 'organizational', 'systemic')),
    secondary_perspectives VARCHAR(50)[] DEFAULT '{}',
    perspective_confidence NUMERIC(3,2) DEFAULT 0.7,
    
    -- Impact Classification
    impact_level VARCHAR(20) NOT NULL CHECK (impact_level IN ('low', 'medium', 'high')),
    impact_scope VARCHAR(50) CHECK (impact_scope IN ('personal', 'local', 'regional', 'systemic')),
    impact_duration VARCHAR(50) CHECK (impact_duration IN ('temporary', 'short_term', 'long_term', 'permanent')),
    
    -- Thematic Classification
    primary_themes TEXT[] DEFAULT '{}',
    secondary_themes TEXT[] DEFAULT '{}',
    cultural_themes TEXT[] DEFAULT '{}',
    outcome_categories TEXT[] DEFAULT '{}',
    
    -- Engagement Metrics
    engagement_score NUMERIC(3,2) DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- AI Analysis Metadata
    ai_classified BOOLEAN DEFAULT true,
    classification_version VARCHAR(50),
    classification_confidence NUMERIC(3,2) DEFAULT 0.7,
    manual_override BOOLEAN DEFAULT false,
    manual_override_by VARCHAR(255),
    manual_override_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(story_id)
);

-- Interactive Story Sessions Table
-- Track individual user sessions through story explorations
CREATE TABLE interactive_story_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exploration_id VARCHAR(255) NOT NULL REFERENCES story_explorations(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    
    -- Session Information
    user_id VARCHAR(255), -- Optional user identification
    user_type VARCHAR(50) CHECK (user_type IN ('anonymous', 'community_member', 'researcher', 'stakeholder')),
    device_type VARCHAR(50),
    browser_info VARCHAR(255),
    
    -- Journey Tracking
    stories_viewed TEXT[] DEFAULT '{}',
    pathways_explored TEXT[] DEFAULT '{}',
    filters_used JSONB DEFAULT '{}',
    interactions_performed JSONB DEFAULT '[]',
    
    -- Session Metrics
    session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    stories_completed INTEGER DEFAULT 0,
    pathways_completed INTEGER DEFAULT 0,
    
    -- User Feedback
    session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
    feedback_text TEXT,
    would_recommend BOOLEAN,
    
    -- Technical Metadata
    ip_address INET,
    referrer_url TEXT,
    exit_point VARCHAR(255),
    completion_status VARCHAR(50) CHECK (completion_status IN ('started', 'in_progress', 'completed', 'abandoned')),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Story Visualization Configurations Table
-- Store custom visualization settings for different story explorations
CREATE TABLE story_visualization_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exploration_id VARCHAR(255) NOT NULL REFERENCES story_explorations(id) ON DELETE CASCADE,
    visualization_type VARCHAR(50) NOT NULL CHECK (visualization_type IN ('network', 'timeline', 'map', 'flow', 'tree', 'matrix')),
    
    -- Configuration Settings
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config_data JSONB NOT NULL DEFAULT '{}',
    
    -- Visual Settings
    color_scheme VARCHAR(50) DEFAULT 'default',
    layout_algorithm VARCHAR(50),
    node_sizing_method VARCHAR(50),
    edge_styling JSONB DEFAULT '{}',
    
    -- Interactive Features
    interactive_features TEXT[] DEFAULT '{}',
    filter_options JSONB DEFAULT '{}',
    zoom_settings JSONB DEFAULT '{}',
    
    -- Cultural Considerations
    cultural_safety_filters BOOLEAN DEFAULT true,
    perspective_highlighting BOOLEAN DEFAULT true,
    cultural_context_overlay BOOLEAN DEFAULT false,
    
    -- Status and Usage
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_story_explorations_theme ON story_explorations(central_theme);
CREATE INDEX idx_story_explorations_created_at ON story_explorations(created_at);

CREATE INDEX idx_story_connections_from_story ON story_connections(from_story_id);
CREATE INDEX idx_story_connections_to_story ON story_connections(to_story_id);
CREATE INDEX idx_story_connections_type ON story_connections(connection_type);
CREATE INDEX idx_story_connections_strength ON story_connections(strength);
CREATE INDEX idx_story_connections_verified ON story_connections(verified);

CREATE INDEX idx_outcome_pathways_theme ON outcome_pathways(central_theme);
CREATE INDEX idx_outcome_pathways_timespan ON outcome_pathways(timespan_start, timespan_end);
CREATE INDEX idx_outcome_pathways_replication ON outcome_pathways(replication_potential);
CREATE INDEX idx_outcome_pathways_verified ON outcome_pathways(verified);

CREATE INDEX idx_narrative_flows_pathway ON narrative_flows(pathway_id);
CREATE INDEX idx_narrative_flows_status ON narrative_flows(status);
CREATE INDEX idx_narrative_flows_cultural_safety ON narrative_flows(cultural_safety_level);
CREATE INDEX idx_narrative_flows_audience ON narrative_flows USING GIN(target_audience);

CREATE INDEX idx_story_exploration_analytics_exploration ON story_exploration_analytics(exploration_id);
CREATE INDEX idx_story_exploration_analytics_last_accessed ON story_exploration_analytics(last_accessed);

CREATE INDEX idx_story_perspective_classifications_story ON story_perspective_classifications(story_id);
CREATE INDEX idx_story_perspective_classifications_perspective ON story_perspective_classifications(primary_perspective);
CREATE INDEX idx_story_perspective_classifications_impact ON story_perspective_classifications(impact_level);
CREATE INDEX idx_story_perspective_classifications_themes ON story_perspective_classifications USING GIN(primary_themes);

CREATE INDEX idx_interactive_story_sessions_exploration ON interactive_story_sessions(exploration_id);
CREATE INDEX idx_interactive_story_sessions_session_start ON interactive_story_sessions(session_start);
CREATE INDEX idx_interactive_story_sessions_completion ON interactive_story_sessions(completion_status);
CREATE INDEX idx_interactive_story_sessions_user_type ON interactive_story_sessions(user_type);

CREATE INDEX idx_story_visualization_configs_exploration ON story_visualization_configs(exploration_id);
CREATE INDEX idx_story_visualization_configs_type ON story_visualization_configs(visualization_type);
CREATE INDEX idx_story_visualization_configs_active ON story_visualization_configs(is_active);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_story_explorations_updated_at BEFORE UPDATE ON story_explorations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_connections_updated_at BEFORE UPDATE ON story_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_outcome_pathways_updated_at BEFORE UPDATE ON outcome_pathways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_narrative_flows_updated_at BEFORE UPDATE ON narrative_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_exploration_analytics_updated_at BEFORE UPDATE ON story_exploration_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_perspective_classifications_updated_at BEFORE UPDATE ON story_perspective_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interactive_story_sessions_updated_at BEFORE UPDATE ON interactive_story_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_visualization_configs_updated_at BEFORE UPDATE ON story_visualization_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically classify story perspectives when stories are added
CREATE OR REPLACE FUNCTION auto_classify_story_perspective()
RETURNS TRIGGER AS $
BEGIN
    -- Insert initial classification for new stories
    INSERT INTO story_perspective_classifications (
        story_id,
        primary_perspective,
        impact_level,
        primary_themes,
        engagement_score
    ) VALUES (
        NEW.id,
        'individual', -- Default, will be updated by AI analysis
        'medium',     -- Default, will be updated by AI analysis
        COALESCE(NEW.themes, '{}'),
        0
    );
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER auto_classify_story_perspective_trigger
    AFTER INSERT ON enhanced_community_stories
    FOR EACH ROW EXECUTE FUNCTION auto_classify_story_perspective();

-- Function to update story engagement metrics
CREATE OR REPLACE FUNCTION update_story_engagement_metrics()
RETURNS TRIGGER AS $
BEGIN
    -- Update engagement score in classifications when story metrics change
    UPDATE story_perspective_classifications
    SET engagement_score = LEAST(
        (COALESCE(NEW.view_count, 0) * 0.1 + 
         COALESCE(NEW.share_count, 0) * 2 + 
         COALESCE(NEW.comment_count, 0) * 3 + 
         COALESCE(NEW.like_count, 0) * 1) / 10,
        10
    ),
    updated_at = NOW()
    WHERE story_id = NEW.id;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_engagement_metrics_trigger
    AFTER UPDATE ON enhanced_community_stories
    FOR EACH ROW EXECUTE FUNCTION update_story_engagement_metrics();

-- Function to get story exploration statistics
CREATE OR REPLACE FUNCTION get_story_exploration_stats(
    p_exploration_id VARCHAR(255)
)
RETURNS TABLE (
    total_views BIGINT,
    unique_viewers BIGINT,
    avg_completion_rate NUMERIC,
    most_popular_story TEXT,
    most_followed_pathway TEXT,
    avg_session_duration NUMERIC
) AS $
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT 
            COUNT(*) as sessions,
            COUNT(DISTINCT COALESCE(user_id, session_token)) as unique_users,
            AVG(total_time_spent) as avg_duration,
            AVG(CASE WHEN completion_status = 'completed' THEN 1.0 ELSE 0.0 END) as completion_rate
        FROM interactive_story_sessions
        WHERE exploration_id = p_exploration_id
    ),
    story_popularity AS (
        SELECT 
            unnest(stories_viewed) as story_id,
            COUNT(*) as view_count
        FROM interactive_story_sessions
        WHERE exploration_id = p_exploration_id
        GROUP BY unnest(stories_viewed)
        ORDER BY view_count DESC
        LIMIT 1
    ),
    pathway_popularity AS (
        SELECT 
            unnest(pathways_explored) as pathway_id,
            COUNT(*) as follow_count
        FROM interactive_story_sessions
        WHERE exploration_id = p_exploration_id
        GROUP BY unnest(pathways_explored)
        ORDER BY follow_count DESC
        LIMIT 1
    )
    SELECT 
        ss.sessions,
        ss.unique_users,
        ROUND(ss.completion_rate * 100, 2),
        sp.story_id,
        pp.pathway_id,
        ROUND(ss.avg_duration / 60.0, 2) -- Convert to minutes
    FROM session_stats ss
    LEFT JOIN story_popularity sp ON true
    LEFT JOIN pathway_popularity pp ON true;
END;
$ LANGUAGE plpgsql;

-- Function to find related stories based on connections
CREATE OR REPLACE FUNCTION find_related_stories(
    p_story_id UUID,
    p_max_results INTEGER DEFAULT 5,
    p_min_strength NUMERIC DEFAULT 0.5
)
RETURNS TABLE (
    related_story_id UUID,
    connection_type VARCHAR(50),
    strength NUMERIC,
    description TEXT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN sc.from_story_id = p_story_id THEN sc.to_story_id
            ELSE sc.from_story_id
        END as related_story_id,
        sc.connection_type,
        sc.strength,
        sc.description
    FROM story_connections sc
    WHERE (sc.from_story_id = p_story_id OR sc.to_story_id = p_story_id)
    AND sc.strength >= p_min_strength
    AND sc.verified = true
    ORDER BY sc.strength DESC
    LIMIT p_max_results;
END;
$ LANGUAGE plpgsql;

-- Function to get pathway progression analytics
CREATE OR REPLACE FUNCTION get_pathway_progression_analytics(
    p_pathway_id VARCHAR(255)
)
RETURNS TABLE (
    step_order INTEGER,
    step_title TEXT,
    completion_rate NUMERIC,
    avg_time_spent NUMERIC,
    drop_off_rate NUMERIC
) AS $
BEGIN
    RETURN QUERY
    WITH pathway_data AS (
        SELECT 
            jsonb_array_elements(pathway_steps) as step_data
        FROM outcome_pathways
        WHERE id = p_pathway_id
    ),
    step_info AS (
        SELECT 
            (step_data->>'order')::INTEGER as step_order,
            step_data->>'title' as step_title,
            jsonb_array_elements_text(step_data->'relatedStories') as story_id
        FROM pathway_data
    ),
    session_progression AS (
        SELECT 
            session_token,
            stories_viewed,
            completion_status,
            total_time_spent
        FROM interactive_story_sessions iss
        JOIN outcome_pathways op ON op.id = p_pathway_id
        WHERE p_pathway_id = ANY(iss.pathways_explored)
    )
    SELECT 
        si.step_order,
        si.step_title,
        ROUND(
            COUNT(CASE WHEN si.story_id = ANY(sp.stories_viewed) THEN 1 END)::NUMERIC / 
            COUNT(*)::NUMERIC * 100, 2
        ) as completion_rate,
        ROUND(AVG(sp.total_time_spent) / 60.0, 2) as avg_time_spent,
        ROUND(
            (COUNT(*) - COUNT(CASE WHEN si.story_id = ANY(sp.stories_viewed) THEN 1 END))::NUMERIC / 
            COUNT(*)::NUMERIC * 100, 2
        ) as drop_off_rate
    FROM step_info si
    CROSS JOIN session_progression sp
    GROUP BY si.step_order, si.step_title
    ORDER BY si.step_order;
END;
$ LANGUAGE plpgsql;

-- Create a view for story exploration dashboard
CREATE VIEW story_exploration_dashboard AS
SELECT 
    se.id,
    se.title,
    se.central_theme,
    jsonb_array_length(se.story_nodes) as story_count,
    jsonb_array_length(se.connections) as connection_count,
    jsonb_array_length(se.pathways) as pathway_count,
    sea.view_count,
    sea.unique_viewers,
    sea.completion_rate,
    sea.average_time_spent,
    se.created_at,
    se.updated_at
FROM story_explorations se
LEFT JOIN story_exploration_analytics sea ON se.id = sea.exploration_id;

COMMENT ON TABLE story_explorations IS 'Interactive story exploration configurations with multiple perspectives';
COMMENT ON TABLE story_connections IS 'AI-analyzed connections between community stories';
COMMENT ON TABLE outcome_pathways IS 'Structured pathways showing how stories lead to outcomes';
COMMENT ON TABLE narrative_flows IS 'Guided storytelling experiences with branching narratives';
COMMENT ON TABLE story_exploration_analytics IS 'Engagement and usage analytics for story explorations';
COMMENT ON TABLE story_perspective_classifications IS 'Enhanced classification of stories by perspective and impact';
COMMENT ON TABLE interactive_story_sessions IS 'Individual user sessions through story explorations';
COMMENT ON TABLE story_visualization_configs IS 'Custom visualization settings for story explorations';
COMMENT ON VIEW story_exploration_dashboard IS 'Dashboard view for story exploration management and analytics';