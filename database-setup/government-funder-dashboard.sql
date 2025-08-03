-- Government/Funder Dashboard Database Schema
-- This schema supports government and funder interfaces with investment tracking, program metrics, and strategic planning

-- Government programs table
CREATE TABLE IF NOT EXISTS government_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(500) NOT NULL,
    program_type VARCHAR(100) DEFAULT 'general' CHECK (program_type IN (
        'health', 'education', 'employment', 'housing', 'youth', 'cultural',
        'infrastructure', 'economic_development', 'social_services', 'general'
    )),
    description TEXT,
    objectives TEXT[],
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2) DEFAULT 0,
    allocated_budget DECIMAL(12,2) DEFAULT 0,
    spent_budget DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN (
        'planning', 'approved', 'active', 'on_hold', 'completed', 'cancelled'
    )),
    
    -- Performance metrics
    effectiveness_score INTEGER DEFAULT 0 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
    reach_count INTEGER DEFAULT 0,
    target_reach INTEGER,
    satisfaction_score INTEGER DEFAULT 0 CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
    
    -- Outcomes and challenges
    outcomes TEXT[],
    challenges TEXT[],
    recommendations TEXT[],
    
    -- Relationships
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    managed_by VARCHAR(255),
    funding_source VARCHAR(255),
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', program_name || ' ' || COALESCE(description, '') || ' ' || program_type)
    ) STORED
);

-- Program metrics tracking
CREATE TABLE IF NOT EXISTS program_metrics (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES government_programs(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    measurement_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investment approvals tracking
CREATE TABLE IF NOT EXISTS investment_approvals (
    id SERIAL PRIMARY KEY,
    recommendation_id VARCHAR(255) NOT NULL,
    recommendation_type VARCHAR(100) DEFAULT 'general',
    investment_amount DECIMAL(12,2),
    approved_by VARCHAR(255) NOT NULL,
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    implementation_timeline TEXT,
    expected_outcomes TEXT[],
    success_metrics TEXT[],
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN (
        'approved', 'in_progress', 'completed', 'cancelled', 'on_hold'
    )),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community health history for trend analysis
CREATE TABLE IF NOT EXISTS community_health_history (
    id SERIAL PRIMARY KEY,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    status VARCHAR(20) CHECK (status IN ('thriving', 'developing', 'struggling', 'improving')),
    
    -- Individual indicators
    youth_engagement INTEGER CHECK (youth_engagement >= 0 AND youth_engagement <= 100),
    service_access INTEGER CHECK (service_access >= 0 AND service_access <= 100),
    cultural_connection INTEGER CHECK (cultural_connection >= 0 AND cultural_connection <= 100),
    economic_opportunity INTEGER CHECK (economic_opportunity >= 0 AND economic_opportunity <= 100),
    safety_wellbeing INTEGER CHECK (safety_wellbeing >= 0 AND safety_wellbeing <= 100),
    
    -- Trend information
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    trend_velocity DECIMAL(5,2) DEFAULT 0,
    trend_confidence DECIMAL(3,2) CHECK (trend_confidence >= 0 AND trend_confidence <= 1),
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(100) DEFAULT 'system_calculation'
);

-- Trend tracking and monitoring
CREATE TABLE IF NOT EXISTS trend_tracking (
    id SERIAL PRIMARY KEY,
    trend_id VARCHAR(255) NOT NULL UNIQUE,
    trend_name VARCHAR(500) NOT NULL,
    trend_type VARCHAR(100) DEFAULT 'general',
    direction VARCHAR(20) CHECK (direction IN ('improving', 'stable', 'declining')),
    strength DECIMAL(3,2) CHECK (strength >= 0 AND strength <= 1),
    communities TEXT[],
    implications TEXT[],
    recommendations TEXT[],
    
    -- Monitoring status
    status VARCHAR(50) DEFAULT 'monitoring' CHECK (status IN (
        'monitoring', 'investigating', 'action_planned', 'action_taken', 'resolved'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to VARCHAR(255),
    
    -- Tracking information
    first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Strategic planning scenarios
CREATE TABLE IF NOT EXISTS strategic_scenarios (
    id SERIAL PRIMARY KEY,
    scenario_name VARCHAR(500) NOT NULL,
    scenario_type VARCHAR(100) DEFAULT 'planning' CHECK (scenario_type IN (
        'planning', 'risk_assessment', 'opportunity_analysis', 'impact_modeling'
    )),
    description TEXT,
    assumptions TEXT[],
    variables JSONB, -- Scenario variables and their values
    outcomes JSONB, -- Predicted outcomes
    probability DECIMAL(3,2) CHECK (probability >= 0 AND probability <= 1),
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    
    -- Time horizon
    time_horizon_months INTEGER DEFAULT 12,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROI calculations and tracking
CREATE TABLE IF NOT EXISTS investment_roi (
    id SERIAL PRIMARY KEY,
    investment_id INTEGER REFERENCES investment_approvals(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES government_programs(id) ON DELETE SET NULL,
    
    -- Investment details
    initial_investment DECIMAL(12,2) NOT NULL,
    ongoing_costs DECIMAL(12,2) DEFAULT 0,
    total_investment DECIMAL(12,2) GENERATED ALWAYS AS (initial_investment + ongoing_costs) STORED,
    
    -- Returns and benefits
    quantified_benefits DECIMAL(12,2) DEFAULT 0,
    social_benefits_score INTEGER CHECK (social_benefits_score >= 1 AND social_benefits_score <= 10),
    community_satisfaction_impact INTEGER CHECK (community_satisfaction_impact >= 1 AND community_satisfaction_impact <= 10),
    
    -- ROI calculations
    financial_roi DECIMAL(5,2), -- Percentage
    social_roi DECIMAL(5,2), -- Percentage
    overall_roi DECIMAL(5,2), -- Percentage
    
    -- Time tracking
    calculation_date DATE DEFAULT CURRENT_DATE,
    measurement_period_months INTEGER DEFAULT 12,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stakeholder engagement tracking
CREATE TABLE IF NOT EXISTS stakeholder_engagement (
    id SERIAL PRIMARY KEY,
    stakeholder_name VARCHAR(255) NOT NULL,
    stakeholder_type VARCHAR(100) CHECK (stakeholder_type IN (
        'community_leader', 'elder', 'government_official', 'ngo_representative',
        'business_leader', 'academic', 'funder', 'community_member', 'other'
    )),
    organization VARCHAR(255),
    contact_info JSONB,
    
    -- Engagement details
    engagement_level VARCHAR(50) DEFAULT 'interested' CHECK (engagement_level IN (
        'highly_engaged', 'engaged', 'interested', 'neutral', 'resistant'
    )),
    influence_level VARCHAR(50) DEFAULT 'medium' CHECK (influence_level IN (
        'high', 'medium', 'low'
    )),
    
    -- Relationship tracking
    programs_involved INTEGER[] DEFAULT '{}',
    last_contact_date DATE,
    next_contact_due DATE,
    relationship_notes TEXT,
    
    -- Community connection
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy impact tracking
CREATE TABLE IF NOT EXISTS policy_impacts (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(500) NOT NULL,
    policy_type VARCHAR(100) DEFAULT 'general',
    implementation_date DATE,
    
    -- Impact measurements
    communities_affected INTEGER[] DEFAULT '{}',
    population_affected INTEGER DEFAULT 0,
    budget_impact DECIMAL(12,2) DEFAULT 0,
    
    -- Outcomes
    intended_outcomes TEXT[],
    actual_outcomes TEXT[],
    unintended_consequences TEXT[],
    
    -- Effectiveness
    effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 10),
    community_acceptance_score INTEGER CHECK (community_acceptance_score >= 1 AND community_acceptance_score <= 10),
    
    -- Review information
    last_review_date DATE,
    next_review_due DATE,
    review_recommendations TEXT[],
    
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'proposed', 'approved', 'active', 'under_review', 'modified', 'discontinued'
    )),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_government_programs_type ON government_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_government_programs_status ON government_programs(status);
CREATE INDEX IF NOT EXISTS idx_government_programs_community ON government_programs(community_id);
CREATE INDEX IF NOT EXISTS idx_government_programs_active ON government_programs(active);
CREATE INDEX IF NOT EXISTS idx_government_programs_dates ON government_programs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_government_programs_search ON government_programs USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_program_metrics_program ON program_metrics(program_id);
CREATE INDEX IF NOT EXISTS idx_program_metrics_type ON program_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_program_metrics_date ON program_metrics(measurement_date);

CREATE INDEX IF NOT EXISTS idx_investment_approvals_status ON investment_approvals(status);
CREATE INDEX IF NOT EXISTS idx_investment_approvals_date ON investment_approvals(approval_date);
CREATE INDEX IF NOT EXISTS idx_investment_approvals_type ON investment_approvals(recommendation_type);

CREATE INDEX IF NOT EXISTS idx_community_health_history_community ON community_health_history(community_id);
CREATE INDEX IF NOT EXISTS idx_community_health_history_date ON community_health_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_community_health_history_status ON community_health_history(status);

CREATE INDEX IF NOT EXISTS idx_trend_tracking_status ON trend_tracking(status);
CREATE INDEX IF NOT EXISTS idx_trend_tracking_priority ON trend_tracking(priority);
CREATE INDEX IF NOT EXISTS idx_trend_tracking_direction ON trend_tracking(direction);
CREATE INDEX IF NOT EXISTS idx_trend_tracking_updated ON trend_tracking(last_updated);

CREATE INDEX IF NOT EXISTS idx_strategic_scenarios_type ON strategic_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_strategic_scenarios_created ON strategic_scenarios(created_at);

CREATE INDEX IF NOT EXISTS idx_investment_roi_program ON investment_roi(program_id);
CREATE INDEX IF NOT EXISTS idx_investment_roi_date ON investment_roi(calculation_date);

CREATE INDEX IF NOT EXISTS idx_stakeholder_engagement_type ON stakeholder_engagement(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_stakeholder_engagement_level ON stakeholder_engagement(engagement_level);
CREATE INDEX IF NOT EXISTS idx_stakeholder_engagement_community ON stakeholder_engagement(community_id);

CREATE INDEX IF NOT EXISTS idx_policy_impacts_status ON policy_impacts(status);
CREATE INDEX IF NOT EXISTS idx_policy_impacts_date ON policy_impacts(implementation_date);

-- Update triggers
CREATE OR REPLACE FUNCTION update_government_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_government_programs_updated_at
    BEFORE UPDATE ON government_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_government_updated_at();

CREATE TRIGGER trigger_update_investment_approvals_updated_at
    BEFORE UPDATE ON investment_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_government_updated_at();

CREATE TRIGGER trigger_update_trend_tracking_updated_at
    BEFORE UPDATE ON trend_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_government_updated_at();

CREATE TRIGGER trigger_update_strategic_scenarios_updated_at
    BEFORE UPDATE ON strategic_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_government_updated_at();

CREATE TRIGGER trigger_update_stakeholder_engagement_updated_at
    BEFORE UPDATE ON stakeholder_engagement
    FOR EACH ROW
    EXECUTE FUNCTION update_government_updated_at();

CREATE TRIGGER trigger_update_policy_impacts_updated_at
    BEFORE UPDATE ON policy_impacts
    FOR EACH ROW
    EXECUTE FUNCTION update_government_updated_at();

-- Views for common queries

-- Program effectiveness summary
CREATE OR REPLACE VIEW program_effectiveness_summary AS
SELECT 
    gp.id,
    gp.program_name,
    gp.program_type,
    gp.budget,
    gp.effectiveness_score,
    gp.reach_count,
    gp.target_reach,
    gp.satisfaction_score,
    c.name as community_name,
    c.region,
    CASE 
        WHEN gp.target_reach > 0 THEN ROUND((gp.reach_count::DECIMAL / gp.target_reach) * 100, 1)
        ELSE NULL 
    END as reach_percentage,
    CASE 
        WHEN gp.budget > 0 AND gp.reach_count > 0 THEN ROUND(gp.budget / gp.reach_count, 2)
        ELSE NULL 
    END as cost_per_person,
    gp.status,
    gp.start_date,
    gp.end_date
FROM government_programs gp
LEFT JOIN communities c ON gp.community_id = c.id
WHERE gp.active = true;

-- Investment ROI summary
CREATE OR REPLACE VIEW investment_roi_summary AS
SELECT 
    ir.id,
    ia.recommendation_id,
    ia.investment_amount,
    ir.total_investment,
    ir.financial_roi,
    ir.social_roi,
    ir.overall_roi,
    ir.calculation_date,
    ia.status as approval_status,
    gp.program_name,
    gp.program_type,
    c.name as community_name
FROM investment_roi ir
JOIN investment_approvals ia ON ir.investment_id = ia.id
LEFT JOIN government_programs gp ON ir.program_id = gp.id
LEFT JOIN communities c ON gp.community_id = c.id
ORDER BY ir.overall_roi DESC NULLS LAST;

-- Community health trends
CREATE OR REPLACE VIEW community_health_trends AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    c.region,
    chh.health_score,
    chh.status,
    chh.trend_direction,
    chh.trend_velocity,
    chh.recorded_at,
    LAG(chh.health_score) OVER (PARTITION BY c.id ORDER BY chh.recorded_at) as previous_score,
    chh.health_score - LAG(chh.health_score) OVER (PARTITION BY c.id ORDER BY chh.recorded_at) as score_change
FROM communities c
JOIN community_health_history chh ON c.id = chh.community_id
ORDER BY c.name, chh.recorded_at DESC;

-- Active trends summary
CREATE OR REPLACE VIEW active_trends_summary AS
SELECT 
    tt.trend_id,
    tt.trend_name,
    tt.trend_type,
    tt.direction,
    tt.strength,
    tt.status,
    tt.priority,
    tt.assigned_to,
    array_length(tt.communities, 1) as communities_count,
    array_length(tt.implications, 1) as implications_count,
    array_length(tt.recommendations, 1) as recommendations_count,
    tt.first_detected,
    tt.last_updated,
    EXTRACT(days FROM CURRENT_TIMESTAMP - tt.first_detected) as days_since_detected
FROM trend_tracking tt
WHERE tt.status IN ('monitoring', 'investigating', 'action_planned')
ORDER BY tt.priority DESC, tt.strength DESC;

-- Stakeholder engagement overview
CREATE OR REPLACE VIEW stakeholder_engagement_overview AS
SELECT 
    se.stakeholder_type,
    COUNT(*) as total_stakeholders,
    COUNT(*) FILTER (WHERE se.engagement_level = 'highly_engaged') as highly_engaged,
    COUNT(*) FILTER (WHERE se.engagement_level = 'engaged') as engaged,
    COUNT(*) FILTER (WHERE se.engagement_level = 'interested') as interested,
    COUNT(*) FILTER (WHERE se.engagement_level = 'neutral') as neutral,
    COUNT(*) FILTER (WHERE se.engagement_level = 'resistant') as resistant,
    COUNT(*) FILTER (WHERE se.influence_level = 'high') as high_influence,
    COUNT(*) FILTER (WHERE se.last_contact_date >= CURRENT_DATE - INTERVAL '30 days') as contacted_recently
FROM stakeholder_engagement se
GROUP BY se.stakeholder_type
ORDER BY total_stakeholders DESC;

-- Comments for documentation
COMMENT ON TABLE government_programs IS 'Government and funder programs with performance tracking';
COMMENT ON TABLE program_metrics IS 'Detailed metrics tracking for government programs';
COMMENT ON TABLE investment_approvals IS 'Approved investments and their implementation tracking';
COMMENT ON TABLE community_health_history IS 'Historical community health data for trend analysis';
COMMENT ON TABLE trend_tracking IS 'Monitoring and tracking of community and program trends';
COMMENT ON TABLE strategic_scenarios IS 'Strategic planning scenarios and impact modeling';
COMMENT ON TABLE investment_roi IS 'Return on investment calculations and tracking';
COMMENT ON TABLE stakeholder_engagement IS 'Stakeholder relationship and engagement tracking';
COMMENT ON TABLE policy_impacts IS 'Policy implementation and impact tracking';

COMMENT ON VIEW program_effectiveness_summary IS 'Summary of program effectiveness metrics';
COMMENT ON VIEW investment_roi_summary IS 'Summary of investment returns and effectiveness';
COMMENT ON VIEW community_health_trends IS 'Community health trends over time';
COMMENT ON VIEW active_trends_summary IS 'Currently active trends requiring attention';
COMMENT ON VIEW stakeholder_engagement_overview IS 'Overview of stakeholder engagement levels';