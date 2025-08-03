-- Impact Reporting Database Schema
-- This schema supports comprehensive impact report generation with cultural protocols

-- Impact Reports Table
-- Stores comprehensive impact reports combining quantitative and qualitative data
CREATE TABLE impact_reports (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    community_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('annual', 'quarterly', 'project', 'thematic', 'funder', 'government')),
    timeframe_start TIMESTAMP WITH TIME ZONE NOT NULL,
    timeframe_end TIMESTAMP WITH TIME ZONE NOT NULL,
    timeframe_description VARCHAR(255),
    
    -- Report Content (stored as JSONB for flexibility)
    executive_summary JSONB NOT NULL DEFAULT '{}',
    metrics JSONB NOT NULL DEFAULT '{}',
    stories JSONB NOT NULL DEFAULT '{}',
    voices JSONB NOT NULL DEFAULT '{}',
    analysis JSONB NOT NULL DEFAULT '{}',
    visualizations JSONB NOT NULL DEFAULT '{}',
    appendices JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata and Status
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    generated_by VARCHAR(255) NOT NULL,
    reviewed_by TEXT[] DEFAULT '{}',
    approved_by TEXT[] DEFAULT '{}',
    cultural_review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (cultural_review_status IN ('pending', 'reviewed', 'approved')),
    publication_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'internal', 'public', 'restricted')),
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    tags TEXT[] DEFAULT '{}',
    cultural_safety_level VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety_level IN ('public', 'community', 'restricted', 'sacred')),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Report Templates Table
-- Predefined templates for different types of reports and audiences
CREATE TABLE report_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('community', 'government', 'funders', 'researchers', 'media')),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('annual', 'quarterly', 'project', 'thematic', 'funder', 'government')),
    
    -- Template Structure
    sections JSONB NOT NULL DEFAULT '[]',
    cultural_protocols TEXT[] DEFAULT '{}',
    approval_required BOOLEAN DEFAULT false,
    default_cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (default_cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    
    -- Template Settings
    include_metrics BOOLEAN DEFAULT true,
    include_stories BOOLEAN DEFAULT true,
    include_voices BOOLEAN DEFAULT true,
    include_analysis BOOLEAN DEFAULT true,
    include_visualizations BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Community Voices Table
-- Dedicated storage for community testimonials and quotes
CREATE TABLE community_voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    speaker_name VARCHAR(255) NOT NULL,
    speaker_role VARCHAR(100),
    speaker_age_group VARCHAR(20) CHECK (speaker_age_group IN ('youth', 'adult', 'elder')),
    quote TEXT NOT NULL,
    context TEXT,
    impact_area VARCHAR(100),
    cultural_safety VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (cultural_safety IN ('public', 'community', 'restricted', 'sacred')),
    
    -- Recording Details
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    recorded_by VARCHAR(255),
    location VARCHAR(255),
    language VARCHAR(50) DEFAULT 'English',
    translation TEXT,
    
    -- Consent and Usage
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_type VARCHAR(50) CHECK (consent_type IN ('verbal', 'written', 'digital')),
    usage_permissions TEXT[] DEFAULT '{}',
    consent_expiry DATE,
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    themes TEXT[] DEFAULT '{}',
    related_stories TEXT[] DEFAULT '{}',
    related_events TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Report Metrics Table
-- Standardized metrics that can be tracked across reports
CREATE TABLE report_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('health', 'education', 'economic', 'cultural', 'social', 'environmental')),
    metric_name VARCHAR(255) NOT NULL,
    metric_description TEXT,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50),
    
    -- Trend Information
    trend VARCHAR(20) CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')),
    trend_percentage NUMERIC,
    baseline_value NUMERIC,
    target_value NUMERIC,
    benchmark_value NUMERIC,
    
    -- Context
    timeframe VARCHAR(100),
    measurement_date DATE NOT NULL,
    data_source VARCHAR(255),
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    cultural_context TEXT,
    
    -- Metadata
    collected_by VARCHAR(255),
    collection_method VARCHAR(100),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Report Reviews Table
-- Track review process for reports requiring approval
CREATE TABLE report_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(255) NOT NULL REFERENCES impact_reports(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_role VARCHAR(100),
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('cultural', 'technical', 'editorial', 'approval')),
    
    -- Review Details
    review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('pending', 'in_progress', 'completed', 'rejected')),
    review_comments TEXT,
    recommendations TEXT[] DEFAULT '{}',
    required_changes TEXT[] DEFAULT '{}',
    
    -- Cultural Review Specific
    cultural_appropriateness_rating INTEGER CHECK (cultural_appropriateness_rating >= 1 AND cultural_appropriateness_rating <= 5),
    cultural_safety_concerns TEXT[] DEFAULT '{}',
    elder_consultation_required BOOLEAN DEFAULT false,
    
    -- Review Timeline
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Report Sharing Log Table
-- Track how reports are shared and accessed
CREATE TABLE report_sharing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(255) NOT NULL REFERENCES impact_reports(id) ON DELETE CASCADE,
    shared_with VARCHAR(255) NOT NULL,
    shared_by VARCHAR(255) NOT NULL,
    sharing_method VARCHAR(50) NOT NULL CHECK (sharing_method IN ('email', 'download', 'link', 'presentation', 'print')),
    
    -- Sharing Details
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('view', 'download', 'edit', 'full')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    access_restrictions TEXT[] DEFAULT '{}',
    
    -- Usage Tracking
    accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    
    -- Cultural Considerations
    cultural_permissions_verified BOOLEAN DEFAULT false,
    sharing_purpose TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Report Impact Tracking Table
-- Track the impact and outcomes of published reports
CREATE TABLE report_impact_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(255) NOT NULL REFERENCES impact_reports(id) ON DELETE CASCADE,
    impact_type VARCHAR(50) NOT NULL CHECK (impact_type IN ('policy_change', 'funding_secured', 'program_improvement', 'awareness_raised', 'partnerships_formed')),
    
    -- Impact Details
    impact_description TEXT NOT NULL,
    impact_value NUMERIC,
    impact_unit VARCHAR(50),
    stakeholders_involved TEXT[] DEFAULT '{}',
    
    -- Evidence and Verification
    evidence_sources TEXT[] DEFAULT '{}',
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timeline
    impact_date DATE NOT NULL,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Attribution
    reported_by VARCHAR(255),
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_impact_reports_community ON impact_reports(community_id);
CREATE INDEX idx_impact_reports_type ON impact_reports(report_type);
CREATE INDEX idx_impact_reports_status ON impact_reports(publication_status);
CREATE INDEX idx_impact_reports_cultural_safety ON impact_reports(cultural_safety_level);
CREATE INDEX idx_impact_reports_generated_at ON impact_reports(generated_at);
CREATE INDEX idx_impact_reports_timeframe ON impact_reports(timeframe_start, timeframe_end);

CREATE INDEX idx_report_templates_audience ON report_templates(target_audience);
CREATE INDEX idx_report_templates_type ON report_templates(report_type);
CREATE INDEX idx_report_templates_active ON report_templates(is_active);

CREATE INDEX idx_community_voices_community ON community_voices(community_id);
CREATE INDEX idx_community_voices_speaker ON community_voices(speaker_name);
CREATE INDEX idx_community_voices_role ON community_voices(speaker_role);
CREATE INDEX idx_community_voices_cultural_safety ON community_voices(cultural_safety);
CREATE INDEX idx_community_voices_recorded_at ON community_voices(recorded_at);
CREATE INDEX idx_community_voices_consent ON community_voices(consent_given);
CREATE INDEX idx_community_voices_themes ON community_voices USING GIN(themes);

CREATE INDEX idx_report_metrics_community ON report_metrics(community_id);
CREATE INDEX idx_report_metrics_category ON report_metrics(metric_category);
CREATE INDEX idx_report_metrics_name ON report_metrics(metric_name);
CREATE INDEX idx_report_metrics_date ON report_metrics(measurement_date);
CREATE INDEX idx_report_metrics_trend ON report_metrics(trend);

CREATE INDEX idx_report_reviews_report ON report_reviews(report_id);
CREATE INDEX idx_report_reviews_reviewer ON report_reviews(reviewer_name);
CREATE INDEX idx_report_reviews_type ON report_reviews(review_type);
CREATE INDEX idx_report_reviews_status ON report_reviews(review_status);
CREATE INDEX idx_report_reviews_due_date ON report_reviews(due_date);

CREATE INDEX idx_report_sharing_log_report ON report_sharing_log(report_id);
CREATE INDEX idx_report_sharing_log_shared_with ON report_sharing_log(shared_with);
CREATE INDEX idx_report_sharing_log_method ON report_sharing_log(sharing_method);
CREATE INDEX idx_report_sharing_log_created_at ON report_sharing_log(created_at);

CREATE INDEX idx_report_impact_tracking_report ON report_impact_tracking(report_id);
CREATE INDEX idx_report_impact_tracking_type ON report_impact_tracking(impact_type);
CREATE INDEX idx_report_impact_tracking_date ON report_impact_tracking(impact_date);
CREATE INDEX idx_report_impact_tracking_verification ON report_impact_tracking(verification_status);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_impact_reports_updated_at BEFORE UPDATE ON impact_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_voices_updated_at BEFORE UPDATE ON community_voices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_metrics_updated_at BEFORE UPDATE ON report_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_reviews_updated_at BEFORE UPDATE ON report_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_impact_tracking_updated_at BEFORE UPDATE ON report_impact_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update report status based on reviews
CREATE OR REPLACE FUNCTION update_report_status_from_reviews()
RETURNS TRIGGER AS $
BEGIN
    -- Update cultural review status based on cultural reviews
    IF NEW.review_type = 'cultural' AND NEW.review_status = 'completed' THEN
        UPDATE impact_reports 
        SET cultural_review_status = 'reviewed',
            updated_at = NOW()
        WHERE id = NEW.report_id;
    END IF;
    
    -- Update publication status if all required reviews are complete
    IF NEW.review_type = 'approval' AND NEW.review_status = 'completed' THEN
        UPDATE impact_reports 
        SET publication_status = 'internal',
            updated_at = NOW()
        WHERE id = NEW.report_id
        AND publication_status = 'draft';
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER report_review_status_trigger
    AFTER UPDATE ON report_reviews
    FOR EACH ROW EXECUTE FUNCTION update_report_status_from_reviews();

-- Function to track report access
CREATE OR REPLACE FUNCTION track_report_access(
    p_report_id VARCHAR(255),
    p_accessed_by VARCHAR(255),
    p_access_method VARCHAR(50)
)
RETURNS VOID AS $
BEGIN
    -- Update existing sharing log entry if exists
    UPDATE report_sharing_log 
    SET access_count = access_count + 1,
        last_accessed = NOW()
    WHERE report_id = p_report_id 
    AND shared_with = p_accessed_by;
    
    -- If no existing entry, this might be direct access - could log separately
    IF NOT FOUND THEN
        INSERT INTO report_sharing_log (
            report_id, shared_with, shared_by, sharing_method, 
            access_level, accessed_at, access_count
        ) VALUES (
            p_report_id, p_accessed_by, 'system', p_access_method,
            'view', NOW(), 1
        );
    END IF;
END;
$ LANGUAGE plpgsql;

-- Function to get report metrics summary
CREATE OR REPLACE FUNCTION get_report_metrics_summary(
    p_community_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 year',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    category VARCHAR(50),
    metric_count BIGINT,
    avg_value NUMERIC,
    trend_improving BIGINT,
    trend_declining BIGINT,
    high_confidence_metrics BIGINT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        rm.metric_category,
        COUNT(*) as metric_count,
        ROUND(AVG(rm.metric_value), 2) as avg_value,
        COUNT(*) FILTER (WHERE rm.trend = 'improving') as trend_improving,
        COUNT(*) FILTER (WHERE rm.trend = 'declining') as trend_declining,
        COUNT(*) FILTER (WHERE rm.confidence_score >= 0.8) as high_confidence_metrics
    FROM report_metrics rm
    WHERE rm.community_id = p_community_id
    AND rm.measurement_date BETWEEN p_start_date AND p_end_date
    GROUP BY rm.metric_category
    ORDER BY metric_count DESC;
END;
$ LANGUAGE plpgsql;

-- Function to get community voices by theme
CREATE OR REPLACE FUNCTION get_community_voices_by_theme(
    p_community_id UUID,
    p_theme VARCHAR(100),
    p_cultural_safety_level VARCHAR(20) DEFAULT 'public'
)
RETURNS TABLE (
    speaker_name VARCHAR(255),
    speaker_role VARCHAR(100),
    quote TEXT,
    context TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        cv.speaker_name,
        cv.speaker_role,
        cv.quote,
        cv.context,
        cv.recorded_at
    FROM community_voices cv
    WHERE cv.community_id = p_community_id
    AND p_theme = ANY(cv.themes)
    AND cv.cultural_safety IN (
        CASE p_cultural_safety_level
            WHEN 'sacred' THEN ARRAY['public', 'community', 'restricted', 'sacred']
            WHEN 'restricted' THEN ARRAY['public', 'community', 'restricted']
            WHEN 'community' THEN ARRAY['public', 'community']
            ELSE ARRAY['public']
        END
    )
    AND cv.consent_given = true
    AND (cv.consent_expiry IS NULL OR cv.consent_expiry > CURRENT_DATE)
    ORDER BY cv.recorded_at DESC;
END;
$ LANGUAGE plpgsql;

-- Function to calculate report engagement metrics
CREATE OR REPLACE FUNCTION calculate_report_engagement(p_report_id VARCHAR(255))
RETURNS TABLE (
    total_shares BIGINT,
    total_accesses BIGINT,
    unique_viewers BIGINT,
    avg_access_per_viewer NUMERIC,
    most_common_sharing_method VARCHAR(50)
) AS $
BEGIN
    RETURN QUERY
    WITH sharing_stats AS (
        SELECT 
            COUNT(*) as shares,
            SUM(access_count) as accesses,
            COUNT(DISTINCT shared_with) as viewers,
            sharing_method,
            ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as method_rank
        FROM report_sharing_log
        WHERE report_id = p_report_id
        GROUP BY sharing_method
    )
    SELECT 
        SUM(shares) as total_shares,
        SUM(accesses) as total_accesses,
        SUM(viewers) as unique_viewers,
        CASE 
            WHEN SUM(viewers) > 0 THEN ROUND(SUM(accesses)::NUMERIC / SUM(viewers), 2)
            ELSE 0
        END as avg_access_per_viewer,
        (SELECT sharing_method FROM sharing_stats WHERE method_rank = 1) as most_common_sharing_method
    FROM sharing_stats;
END;
$ LANGUAGE plpgsql;

-- Create a view for report dashboard
CREATE VIEW report_dashboard AS
SELECT 
    ir.id,
    ir.title,
    ir.community_name,
    ir.report_type,
    ir.timeframe_start,
    ir.timeframe_end,
    ir.cultural_review_status,
    ir.publication_status,
    ir.cultural_safety_level,
    ir.generated_at,
    COUNT(rr.id) as total_reviews,
    COUNT(rr.id) FILTER (WHERE rr.review_status = 'completed') as completed_reviews,
    COUNT(rsl.id) as total_shares,
    SUM(rsl.access_count) as total_accesses,
    COUNT(rit.id) as tracked_impacts
FROM impact_reports ir
LEFT JOIN report_reviews rr ON ir.id = rr.report_id
LEFT JOIN report_sharing_log rsl ON ir.id = rsl.report_id
LEFT JOIN report_impact_tracking rit ON ir.id = rit.report_id
GROUP BY 
    ir.id, ir.title, ir.community_name, ir.report_type,
    ir.timeframe_start, ir.timeframe_end, ir.cultural_review_status,
    ir.publication_status, ir.cultural_safety_level, ir.generated_at;

-- Insert default report templates
INSERT INTO report_templates (id, name, description, target_audience, report_type, sections, cultural_protocols, approval_required) VALUES
(
    'community-annual-template',
    'Community Annual Report',
    'Comprehensive annual report for community stakeholders',
    'community',
    'annual',
    '[
        {"id": "executive_summary", "title": "Executive Summary", "required": true, "culturalConsiderations": ["Community voice prominent"], "contentTypes": ["analysis"]},
        {"id": "community_voices", "title": "Community Voices", "required": true, "culturalConsiderations": ["Consent verified", "Cultural safety maintained"], "contentTypes": ["voices"]},
        {"id": "achievements", "title": "Key Achievements", "required": true, "culturalConsiderations": ["Cultural achievements highlighted"], "contentTypes": ["metrics", "stories"]},
        {"id": "challenges", "title": "Challenges and Learnings", "required": true, "culturalConsiderations": ["Balanced perspective"], "contentTypes": ["analysis", "stories"]},
        {"id": "cultural_impact", "title": "Cultural Impact", "required": true, "culturalConsiderations": ["Elder review required"], "contentTypes": ["stories", "voices", "analysis"]},
        {"id": "future_directions", "title": "Future Directions", "required": true, "culturalConsiderations": ["Community priorities reflected"], "contentTypes": ["analysis"]}
    ]',
    ARRAY['Community review required', 'Elder approval for cultural content', 'Community ownership maintained'],
    true
),
(
    'government-quarterly-template',
    'Government Quarterly Report',
    'Quarterly progress report for government stakeholders',
    'government',
    'quarterly',
    '[
        {"id": "executive_summary", "title": "Executive Summary", "required": true, "culturalConsiderations": [], "contentTypes": ["analysis"]},
        {"id": "key_metrics", "title": "Key Performance Indicators", "required": true, "culturalConsiderations": [], "contentTypes": ["metrics", "visuals"]},
        {"id": "program_outcomes", "title": "Program Outcomes", "required": true, "culturalConsiderations": ["Community impact highlighted"], "contentTypes": ["metrics", "stories"]},
        {"id": "challenges_risks", "title": "Challenges and Risk Management", "required": true, "culturalConsiderations": [], "contentTypes": ["analysis"]},
        {"id": "recommendations", "title": "Recommendations", "required": true, "culturalConsiderations": ["Community priorities included"], "contentTypes": ["analysis"]}
    ]',
    ARRAY['Data accuracy verified', 'Community consent for story sharing'],
    false
),
(
    'funder-impact-template',
    'Funder Impact Report',
    'Impact report for funding organizations',
    'funders',
    'project',
    '[
        {"id": "impact_overview", "title": "Impact Overview", "required": true, "culturalConsiderations": [], "contentTypes": ["metrics", "visuals"]},
        {"id": "success_stories", "title": "Success Stories", "required": true, "culturalConsiderations": ["Community consent obtained"], "contentTypes": ["stories", "voices"]},
        {"id": "outcomes_achieved", "title": "Outcomes Achieved", "required": true, "culturalConsiderations": [], "contentTypes": ["metrics", "analysis"]},
        {"id": "sustainability", "title": "Sustainability and Future", "required": true, "culturalConsiderations": ["Community ownership emphasized"], "contentTypes": ["analysis"]},
        {"id": "financial_accountability", "title": "Financial Accountability", "required": true, "culturalConsiderations": [], "contentTypes": ["metrics"]}
    ]',
    ARRAY['Financial transparency maintained', 'Community impact accurately represented'],
    false
);

COMMENT ON TABLE impact_reports IS 'Comprehensive impact reports combining quantitative and qualitative data';
COMMENT ON TABLE report_templates IS 'Predefined templates for different types of reports and audiences';
COMMENT ON TABLE community_voices IS 'Community testimonials and quotes with proper consent management';
COMMENT ON TABLE report_metrics IS 'Standardized metrics tracked across reports';
COMMENT ON TABLE report_reviews IS 'Review process tracking for reports requiring approval';
COMMENT ON TABLE report_sharing_log IS 'Log of how reports are shared and accessed';
COMMENT ON TABLE report_impact_tracking IS 'Track the real-world impact of published reports';
COMMENT ON VIEW report_dashboard IS 'Dashboard view for report management and analytics';