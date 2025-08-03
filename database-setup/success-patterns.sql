-- Success Patterns Database Schema
-- This schema stores identified success patterns and their analysis

-- Success patterns table
CREATE TABLE IF NOT EXISTS success_patterns (
    id SERIAL PRIMARY KEY,
    pattern_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'youth_development', 
        'cultural_strengthening', 
        'service_delivery', 
        'economic_development', 
        'community_engagement', 
        'education', 
        'health_wellbeing'
    )),
    replicability DECIMAL(3,2) CHECK (replicability >= 0 AND replicability <= 1),
    sustainability DECIMAL(3,2) CHECK (sustainability >= 0 AND sustainability <= 1),
    scalability VARCHAR(20) CHECK (scalability IN ('local', 'regional', 'territory_wide', 'national')),
    cultural_safety VARCHAR(10) CHECK (cultural_safety IN ('high', 'medium', 'low')),
    timeline TEXT,
    
    -- Metadata
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', pattern_text || ' ' || category)
    ) STORED
);

-- Communities associated with success patterns (many-to-many)
CREATE TABLE IF NOT EXISTS pattern_communities (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    community_name VARCHAR(255) NOT NULL,
    effectiveness_score DECIMAL(3,2) CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success pattern requirements
CREATE TABLE IF NOT EXISTS pattern_requirements (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    requirement_type VARCHAR(50) DEFAULT 'general',
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success pattern evidence
CREATE TABLE IF NOT EXISTS pattern_evidence (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    evidence_text TEXT NOT NULL,
    evidence_type VARCHAR(50) DEFAULT 'qualitative',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source_document_chunk TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success pattern outcomes
CREATE TABLE IF NOT EXISTS pattern_outcomes (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    outcome_text TEXT NOT NULL,
    outcome_type VARCHAR(50) DEFAULT 'community_benefit',
    measurable BOOLEAN DEFAULT FALSE,
    timeframe VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success factors that contributed to the pattern's success
CREATE TABLE IF NOT EXISTS pattern_success_factors (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    factor_text TEXT NOT NULL,
    factor_category VARCHAR(50) DEFAULT 'implementation',
    importance_score INTEGER DEFAULT 1 CHECK (importance_score >= 1 AND importance_score <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenges that were overcome
CREATE TABLE IF NOT EXISTS pattern_challenges (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    challenge_text TEXT NOT NULL,
    challenge_type VARCHAR(50) DEFAULT 'implementation',
    resolution_approach TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources required for implementation
CREATE TABLE IF NOT EXISTS pattern_resources (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    resource_text TEXT NOT NULL,
    resource_type VARCHAR(50) DEFAULT 'general' CHECK (resource_type IN (
        'funding', 'staff', 'infrastructure', 'technology', 'training', 'partnerships', 'general'
    )),
    estimated_cost TEXT,
    availability VARCHAR(20) DEFAULT 'unknown' CHECK (availability IN ('available', 'limited', 'unavailable', 'unknown')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stakeholders involved in the success pattern
CREATE TABLE IF NOT EXISTS pattern_stakeholders (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    stakeholder_name VARCHAR(255) NOT NULL,
    stakeholder_type VARCHAR(50) DEFAULT 'community' CHECK (stakeholder_type IN (
        'community', 'government', 'ngo', 'business', 'education', 'health', 'other'
    )),
    role_description TEXT,
    engagement_level VARCHAR(20) DEFAULT 'medium' CHECK (engagement_level IN ('high', 'medium', 'low')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pattern templates for replication
CREATE TABLE IF NOT EXISTS pattern_templates (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    implementation_steps JSONB, -- Array of step objects
    timeline_estimate TEXT,
    adaptation_guidance JSONB, -- Array of guidance strings
    measurable_outcomes JSONB, -- Array of outcome strings
    risks JSONB, -- Array of risk objects
    mitigations JSONB, -- Array of mitigation strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cross-community pattern analysis results
CREATE TABLE IF NOT EXISTS cross_community_analysis (
    id SERIAL PRIMARY KEY,
    analysis_name VARCHAR(255) NOT NULL,
    analysis_date DATE DEFAULT CURRENT_DATE,
    communities_analyzed JSONB, -- Array of community objects
    shared_patterns JSONB, -- Array of shared pattern objects
    unique_approaches JSONB, -- Array of unique approach objects
    emerging_trends JSONB, -- Array of trend objects
    replication_opportunities JSONB, -- Array of opportunity objects
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pattern replication attempts and outcomes
CREATE TABLE IF NOT EXISTS pattern_replications (
    id SERIAL PRIMARY KEY,
    source_pattern_id INTEGER REFERENCES success_patterns(id) ON DELETE CASCADE,
    target_community_name VARCHAR(255) NOT NULL,
    replication_status VARCHAR(20) DEFAULT 'planned' CHECK (replication_status IN (
        'planned', 'in_progress', 'completed', 'failed', 'adapted'
    )),
    start_date DATE,
    completion_date DATE,
    adaptations_made JSONB, -- Array of adaptation descriptions
    outcomes_achieved JSONB, -- Array of outcome descriptions
    lessons_learned TEXT,
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_success_patterns_category ON success_patterns(category);
CREATE INDEX IF NOT EXISTS idx_success_patterns_document ON success_patterns(document_id);
CREATE INDEX IF NOT EXISTS idx_success_patterns_community ON success_patterns(community_id);
CREATE INDEX IF NOT EXISTS idx_success_patterns_search ON success_patterns USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_success_patterns_replicability ON success_patterns(replicability DESC);
CREATE INDEX IF NOT EXISTS idx_success_patterns_sustainability ON success_patterns(sustainability DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_communities_pattern ON pattern_communities(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_requirements_pattern ON pattern_requirements(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_evidence_pattern ON pattern_evidence(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_pattern ON pattern_outcomes(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_success_factors_pattern ON pattern_success_factors(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_challenges_pattern ON pattern_challenges(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_resources_pattern ON pattern_resources(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_stakeholders_pattern ON pattern_stakeholders(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_templates_pattern ON pattern_templates(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_replications_source ON pattern_replications(source_pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_replications_status ON pattern_replications(replication_status);

-- Update trigger for success_patterns
CREATE OR REPLACE FUNCTION update_success_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_success_patterns_updated_at
    BEFORE UPDATE ON success_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_success_patterns_updated_at();

-- Update trigger for pattern_templates
CREATE TRIGGER trigger_update_pattern_templates_updated_at
    BEFORE UPDATE ON pattern_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_success_patterns_updated_at();

-- Update trigger for pattern_replications
CREATE TRIGGER trigger_update_pattern_replications_updated_at
    BEFORE UPDATE ON pattern_replications
    FOR EACH ROW
    EXECUTE FUNCTION update_success_patterns_updated_at();

-- Views for common queries

-- View for pattern summary with counts
CREATE OR REPLACE VIEW pattern_summary AS
SELECT 
    sp.id,
    sp.pattern_text,
    sp.category,
    sp.replicability,
    sp.sustainability,
    sp.scalability,
    sp.cultural_safety,
    COUNT(DISTINCT pc.community_name) as community_count,
    COUNT(DISTINCT pr.id) as requirement_count,
    COUNT(DISTINCT po.id) as outcome_count,
    COUNT(DISTINCT psf.id) as success_factor_count,
    sp.created_at
FROM success_patterns sp
LEFT JOIN pattern_communities pc ON sp.id = pc.pattern_id
LEFT JOIN pattern_requirements pr ON sp.id = pr.pattern_id
LEFT JOIN pattern_outcomes po ON sp.id = po.pattern_id
LEFT JOIN pattern_success_factors psf ON sp.id = psf.pattern_id
GROUP BY sp.id, sp.pattern_text, sp.category, sp.replicability, sp.sustainability, 
         sp.scalability, sp.cultural_safety, sp.created_at;

-- View for replicable patterns (high replicability and sustainability)
CREATE OR REPLACE VIEW replicable_patterns AS
SELECT 
    ps.*,
    ARRAY_AGG(DISTINCT pc.community_name) as communities,
    ARRAY_AGG(DISTINCT pr.requirement_text) as requirements,
    ARRAY_AGG(DISTINCT po.outcome_text) as outcomes
FROM pattern_summary ps
LEFT JOIN pattern_communities pc ON ps.id = pc.pattern_id
LEFT JOIN pattern_requirements pr ON ps.id = pr.pattern_id
LEFT JOIN pattern_outcomes po ON ps.id = po.pattern_id
WHERE ps.replicability >= 0.7 AND ps.sustainability >= 0.6
GROUP BY ps.id, ps.pattern_text, ps.category, ps.replicability, ps.sustainability,
         ps.scalability, ps.cultural_safety, ps.community_count, ps.requirement_count,
         ps.outcome_count, ps.success_factor_count, ps.created_at;

-- View for pattern effectiveness by community
CREATE OR REPLACE VIEW pattern_community_effectiveness AS
SELECT 
    sp.id as pattern_id,
    sp.pattern_text,
    sp.category,
    pc.community_name,
    pc.effectiveness_score,
    COUNT(po.id) as outcome_count,
    AVG(CASE WHEN po.measurable THEN 1 ELSE 0 END) as measurable_outcome_ratio
FROM success_patterns sp
JOIN pattern_communities pc ON sp.id = pc.pattern_id
LEFT JOIN pattern_outcomes po ON sp.id = po.pattern_id
GROUP BY sp.id, sp.pattern_text, sp.category, pc.community_name, pc.effectiveness_score;

-- Comments for documentation
COMMENT ON TABLE success_patterns IS 'Core table storing identified success patterns from document analysis';
COMMENT ON TABLE pattern_communities IS 'Many-to-many relationship between patterns and communities where they were successful';
COMMENT ON TABLE pattern_requirements IS 'Requirements needed to implement each success pattern';
COMMENT ON TABLE pattern_evidence IS 'Evidence supporting each success pattern from source documents';
COMMENT ON TABLE pattern_outcomes IS 'Positive outcomes achieved by each success pattern';
COMMENT ON TABLE pattern_success_factors IS 'Key factors that contributed to pattern success';
COMMENT ON TABLE pattern_challenges IS 'Challenges overcome during pattern implementation';
COMMENT ON TABLE pattern_resources IS 'Resources required to implement each pattern';
COMMENT ON TABLE pattern_stakeholders IS 'Stakeholders involved in successful pattern implementation';
COMMENT ON TABLE pattern_templates IS 'Reusable implementation templates created from success patterns';
COMMENT ON TABLE cross_community_analysis IS 'Results of cross-community pattern analysis';
COMMENT ON TABLE pattern_replications IS 'Tracking of pattern replication attempts and outcomes';

COMMENT ON VIEW pattern_summary IS 'Summary view of patterns with aggregated counts';
COMMENT ON VIEW replicable_patterns IS 'Patterns with high replicability and sustainability scores';
COMMENT ON VIEW pattern_community_effectiveness IS 'Pattern effectiveness metrics by community';