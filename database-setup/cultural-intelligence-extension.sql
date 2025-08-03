-- Cultural Intelligence Extension
-- This script extends existing cultural tables to support intelligence context
-- and adds cultural protocol compliance tracking for intelligence features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================
-- CULTURAL CONTEXT FOR INTELLIGENCE
-- =============================================

-- Cultural context metadata for intelligence insights
CREATE TABLE IF NOT EXISTS cultural_intelligence_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL,
    community_id UUID NOT NULL,
    
    -- Cultural significance assessment
    cultural_significance_level VARCHAR(20) CHECK (cultural_significance_level IN (
        'low', 'medium', 'high', 'sacred', 'restricted'
    )) DEFAULT 'medium',
    
    -- Traditional knowledge indicators
    contains_traditional_knowledge BOOLEAN DEFAULT false,
    traditional_knowledge_type VARCHAR(100), -- 'medicinal', 'ceremonial', 'ecological', 'historical', etc.
    knowledge_sharing_restrictions TEXT,
    
    -- Cultural protocols required
    elder_consultation_required BOOLEAN DEFAULT true,
    ceremony_consultation_required BOOLEAN DEFAULT false,
    community_consensus_required BOOLEAN DEFAULT false,
    cultural_authority_approval_required BOOLEAN DEFAULT true,
    
    -- Language and communication preferences
    preferred_languages TEXT[] DEFAULT '{}',
    cultural_communication_style VARCHAR(50), -- 'direct', 'storytelling', 'ceremonial', 'consensus'
    visual_representation_guidelines TEXT,
    
    -- Seasonal and ceremonial considerations
    seasonal_restrictions JSONB DEFAULT '{}', -- months/seasons when sharing is restricted
    ceremonial_calendar_considerations TEXT,
    
    -- Geographic and territorial context
    traditional_territory_relevance BOOLEAN DEFAULT false,
    sacred_site_proximity BOOLEAN DEFAULT false,
    territorial_boundaries_consideration TEXT,
    
    -- Community-specific protocols
    community_specific_protocols JSONB DEFAULT '{}',
    cultural_liaison_contact UUID, -- Reference to designated cultural liaison
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (cultural_liaison_contact) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Cultural authority validation for intelligence
CREATE TABLE IF NOT EXISTS cultural_authority_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL,
    community_id UUID NOT NULL,
    
    -- Authority information
    cultural_authority_id UUID NOT NULL, -- Reference to elder/cultural authority
    authority_role VARCHAR(100), -- 'elder', 'knowledge_keeper', 'cultural_advisor', 'ceremony_leader'
    authority_specialization TEXT, -- Area of cultural expertise
    
    -- Validation details
    validation_type VARCHAR(50) CHECK (validation_type IN (
        'cultural_accuracy', 'protocol_compliance', 'sharing_appropriateness', 
        'traditional_knowledge_review', 'community_impact_assessment'
    )),
    
    validation_status VARCHAR(20) CHECK (validation_status IN (
        'pending', 'approved', 'approved_with_conditions', 'requires_modification', 'rejected'
    )) DEFAULT 'pending',
    
    validation_decision TEXT NOT NULL,
    conditions_or_modifications TEXT,
    cultural_guidance TEXT,
    
    -- Consultation process
    consultation_method VARCHAR(50), -- 'in_person', 'virtual', 'written', 'ceremonial'
    consultation_date TIMESTAMP WITH TIME ZONE,
    consultation_duration_minutes INTEGER,
    consultation_location TEXT,
    
    -- Follow-up requirements
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_timeline VARCHAR(100),
    follow_up_instructions TEXT,
    
    -- Validation metadata
    validation_confidence_level DECIMAL(3,2) CHECK (validation_confidence_level >= 0 AND validation_confidence_level <= 1),
    cultural_risk_assessment VARCHAR(20) CHECK (cultural_risk_assessment IN ('low', 'medium', 'high', 'critical')),
    community_benefit_assessment VARCHAR(20) CHECK (community_benefit_assessment IN ('low', 'medium', 'high', 'transformational')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (cultural_authority_id) REFERENCES users(id)
);

-- Cultural protocol compliance tracking
CREATE TABLE IF NOT EXISTS cultural_protocol_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL,
    community_id UUID NOT NULL,
    
    -- Protocol tracking
    protocol_name VARCHAR(200) NOT NULL,
    protocol_category VARCHAR(50) CHECK (protocol_category IN (
        'data_sovereignty', 'traditional_knowledge', 'ceremonial', 'territorial',
        'language', 'representation', 'consultation', 'consent'
    )),
    
    -- Compliance status
    compliance_status VARCHAR(20) CHECK (compliance_status IN (
        'compliant', 'non_compliant', 'partially_compliant', 'under_review', 'not_applicable'
    )) DEFAULT 'under_review',
    
    compliance_score DECIMAL(3,2) CHECK (compliance_score >= 0 AND compliance_score <= 1),
    compliance_details TEXT,
    
    -- Requirements and evidence
    protocol_requirements TEXT NOT NULL,
    evidence_of_compliance TEXT,
    compliance_verification_method VARCHAR(100),
    
    -- Remediation if needed
    remediation_required BOOLEAN DEFAULT false,
    remediation_plan TEXT,
    remediation_timeline VARCHAR(100),
    remediation_responsible_party UUID,
    
    -- Review information
    reviewed_by UUID,
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (remediation_responsible_party) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- =============================================
-- CULTURAL INTELLIGENCE WORKFLOWS
-- =============================================

-- Cultural review workflow tracking
CREATE TABLE IF NOT EXISTS cultural_review_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL,
    community_id UUID NOT NULL,
    
    -- Workflow information
    workflow_type VARCHAR(50) CHECK (workflow_type IN (
        'standard_review', 'expedited_review', 'ceremonial_review', 'consensus_review'
    )) DEFAULT 'standard_review',
    
    workflow_status VARCHAR(20) CHECK (workflow_status IN (
        'initiated', 'in_progress', 'awaiting_authority', 'under_review', 
        'completed', 'escalated', 'suspended'
    )) DEFAULT 'initiated',
    
    -- Workflow steps
    current_step VARCHAR(100),
    completed_steps TEXT[] DEFAULT '{}',
    remaining_steps TEXT[] DEFAULT '{}',
    
    -- Timeline
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    workflow_duration_days INTEGER,
    
    -- Participants
    assigned_cultural_authorities UUID[] DEFAULT '{}',
    community_liaisons UUID[] DEFAULT '{}',
    workflow_coordinator UUID,
    
    -- Priority and urgency
    priority_level VARCHAR(20) CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    cultural_urgency_justification TEXT,
    
    -- Communication log
    communication_log JSONB DEFAULT '[]',
    
    -- Workflow metadata
    workflow_notes TEXT,
    escalation_reason TEXT,
    suspension_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_coordinator) REFERENCES users(id)
);

-- Cultural impact assessments for intelligence
CREATE TABLE IF NOT EXISTS cultural_impact_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL,
    community_id UUID NOT NULL,
    
    -- Assessment details
    assessment_type VARCHAR(50) CHECK (assessment_type IN (
        'cultural_sensitivity', 'traditional_knowledge_impact', 'community_relations',
        'ceremonial_impact', 'territorial_considerations', 'intergenerational_impact'
    )),
    
    -- Impact evaluation
    potential_positive_impacts TEXT,
    potential_negative_impacts TEXT,
    mitigation_strategies TEXT,
    enhancement_opportunities TEXT,
    
    -- Cultural dimensions
    language_preservation_impact VARCHAR(20) CHECK (language_preservation_impact IN ('negative', 'neutral', 'positive', 'highly_positive')),
    traditional_practices_impact VARCHAR(20) CHECK (traditional_practices_impact IN ('negative', 'neutral', 'positive', 'highly_positive')),
    community_cohesion_impact VARCHAR(20) CHECK (community_cohesion_impact IN ('negative', 'neutral', 'positive', 'highly_positive')),
    youth_engagement_impact VARCHAR(20) CHECK (youth_engagement_impact IN ('negative', 'neutral', 'positive', 'highly_positive')),
    elder_respect_impact VARCHAR(20) CHECK (elder_respect_impact IN ('negative', 'neutral', 'positive', 'highly_positive')),
    
    -- Overall assessment
    overall_cultural_impact_score DECIMAL(3,2) CHECK (overall_cultural_impact_score >= -1 AND overall_cultural_impact_score <= 1),
    cultural_risk_level VARCHAR(20) CHECK (cultural_risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Recommendations
    cultural_recommendations TEXT,
    protocol_adjustments_needed TEXT,
    community_consultation_recommendations TEXT,
    
    -- Assessment metadata
    assessed_by UUID,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessment_methodology TEXT,
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Review and approval
    reviewed_by_cultural_authority UUID,
    cultural_authority_approval BOOLEAN DEFAULT false,
    cultural_authority_comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (insight_id) REFERENCES intelligence_insights(id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (assessed_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by_cultural_authority) REFERENCES users(id)
);

-- =============================================
-- CULTURAL INTELLIGENCE AGGREGATIONS
-- =============================================

-- Cultural compliance metrics aggregation
CREATE TABLE IF NOT EXISTS cultural_compliance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL,
    aggregation_date DATE NOT NULL,
    
    -- Compliance statistics
    total_insights_reviewed INTEGER DEFAULT 0,
    culturally_compliant_insights INTEGER DEFAULT 0,
    non_compliant_insights INTEGER DEFAULT 0,
    partially_compliant_insights INTEGER DEFAULT 0,
    
    -- Compliance rates
    overall_compliance_rate DECIMAL(5,2),
    data_sovereignty_compliance_rate DECIMAL(5,2),
    traditional_knowledge_compliance_rate DECIMAL(5,2),
    ceremonial_compliance_rate DECIMAL(5,2),
    consultation_compliance_rate DECIMAL(5,2),
    
    -- Authority validation metrics
    total_authority_validations INTEGER DEFAULT 0,
    approved_validations INTEGER DEFAULT 0,
    rejected_validations INTEGER DEFAULT 0,
    pending_validations INTEGER DEFAULT 0,
    
    -- Review workflow metrics
    average_review_duration_days DECIMAL(5,2),
    expedited_reviews_count INTEGER DEFAULT 0,
    escalated_reviews_count INTEGER DEFAULT 0,
    suspended_reviews_count INTEGER DEFAULT 0,
    
    -- Cultural impact metrics
    positive_cultural_impact_count INTEGER DEFAULT 0,
    negative_cultural_impact_count INTEGER DEFAULT 0,
    neutral_cultural_impact_count INTEGER DEFAULT 0,
    
    -- Quality indicators
    cultural_authority_satisfaction_score DECIMAL(3,2),
    community_feedback_score DECIMAL(3,2),
    protocol_adherence_score DECIMAL(3,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    UNIQUE(community_id, aggregation_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Cultural intelligence context indexes
CREATE INDEX IF NOT EXISTS idx_cultural_intelligence_context_insight_id ON cultural_intelligence_context(insight_id);
CREATE INDEX IF NOT EXISTS idx_cultural_intelligence_context_community_id ON cultural_intelligence_context(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_intelligence_context_significance ON cultural_intelligence_context(cultural_significance_level);
CREATE INDEX IF NOT EXISTS idx_cultural_intelligence_context_traditional_knowledge ON cultural_intelligence_context(contains_traditional_knowledge);

-- Cultural authority validation indexes
CREATE INDEX IF NOT EXISTS idx_cultural_authority_validations_insight_id ON cultural_authority_validations(insight_id);
CREATE INDEX IF NOT EXISTS idx_cultural_authority_validations_community_id ON cultural_authority_validations(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_authority_validations_authority_id ON cultural_authority_validations(cultural_authority_id);
CREATE INDEX IF NOT EXISTS idx_cultural_authority_validations_status ON cultural_authority_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_cultural_authority_validations_type ON cultural_authority_validations(validation_type);

-- Cultural protocol compliance indexes
CREATE INDEX IF NOT EXISTS idx_cultural_protocol_compliance_insight_id ON cultural_protocol_compliance(insight_id);
CREATE INDEX IF NOT EXISTS idx_cultural_protocol_compliance_community_id ON cultural_protocol_compliance(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_protocol_compliance_status ON cultural_protocol_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_cultural_protocol_compliance_category ON cultural_protocol_compliance(protocol_category);

-- Cultural review workflow indexes
CREATE INDEX IF NOT EXISTS idx_cultural_review_workflows_insight_id ON cultural_review_workflows(insight_id);
CREATE INDEX IF NOT EXISTS idx_cultural_review_workflows_community_id ON cultural_review_workflows(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_review_workflows_status ON cultural_review_workflows(workflow_status);
CREATE INDEX IF NOT EXISTS idx_cultural_review_workflows_type ON cultural_review_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_cultural_review_workflows_coordinator ON cultural_review_workflows(workflow_coordinator);

-- Cultural impact assessment indexes
CREATE INDEX IF NOT EXISTS idx_cultural_impact_assessments_insight_id ON cultural_impact_assessments(insight_id);
CREATE INDEX IF NOT EXISTS idx_cultural_impact_assessments_community_id ON cultural_impact_assessments(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_impact_assessments_type ON cultural_impact_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_cultural_impact_assessments_risk_level ON cultural_impact_assessments(cultural_risk_level);

-- Cultural compliance metrics indexes
CREATE INDEX IF NOT EXISTS idx_cultural_compliance_metrics_community_id ON cultural_compliance_metrics(community_id);
CREATE INDEX IF NOT EXISTS idx_cultural_compliance_metrics_date ON cultural_compliance_metrics(aggregation_date DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cultural_context_community_significance 
    ON cultural_intelligence_context(community_id, cultural_significance_level);
CREATE INDEX IF NOT EXISTS idx_cultural_validations_community_status 
    ON cultural_authority_validations(community_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_cultural_compliance_community_status 
    ON cultural_protocol_compliance(community_id, compliance_status);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_cultural_context_languages_gin 
    ON cultural_intelligence_context USING gin(preferred_languages);
CREATE INDEX IF NOT EXISTS idx_cultural_context_protocols_gin 
    ON cultural_intelligence_context USING gin(community_specific_protocols);
CREATE INDEX IF NOT EXISTS idx_cultural_workflows_authorities_gin 
    ON cultural_review_workflows USING gin(assigned_cultural_authorities);
CREATE INDEX IF NOT EXISTS idx_cultural_workflows_communication_gin 
    ON cultural_review_workflows USING gin(communication_log);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp triggers
CREATE TRIGGER update_cultural_intelligence_context_updated_at 
    BEFORE UPDATE ON cultural_intelligence_context 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_authority_validations_updated_at 
    BEFORE UPDATE ON cultural_authority_validations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_protocol_compliance_updated_at 
    BEFORE UPDATE ON cultural_protocol_compliance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_review_workflows_updated_at 
    BEFORE UPDATE ON cultural_review_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_impact_assessments_updated_at 
    BEFORE UPDATE ON cultural_impact_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_compliance_metrics_updated_at 
    BEFORE UPDATE ON cultural_compliance_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cultural compliance aggregation trigger
CREATE OR REPLACE FUNCTION update_cultural_compliance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily cultural compliance metrics
    INSERT INTO cultural_compliance_metrics (
        community_id,
        aggregation_date,
        total_insights_reviewed,
        culturally_compliant_insights,
        non_compliant_insights,
        partially_compliant_insights,
        overall_compliance_rate,
        data_sovereignty_compliance_rate,
        traditional_knowledge_compliance_rate,
        ceremonial_compliance_rate,
        consultation_compliance_rate
    )
    SELECT 
        NEW.community_id,
        CURRENT_DATE,
        COUNT(*),
        COUNT(*) FILTER (WHERE compliance_status = 'compliant'),
        COUNT(*) FILTER (WHERE compliance_status = 'non_compliant'),
        COUNT(*) FILTER (WHERE compliance_status = 'partially_compliant'),
        (COUNT(*) FILTER (WHERE compliance_status = 'compliant') * 100.0 / COUNT(*)),
        (COUNT(*) FILTER (WHERE protocol_category = 'data_sovereignty' AND compliance_status = 'compliant') * 100.0 / 
         NULLIF(COUNT(*) FILTER (WHERE protocol_category = 'data_sovereignty'), 0)),
        (COUNT(*) FILTER (WHERE protocol_category = 'traditional_knowledge' AND compliance_status = 'compliant') * 100.0 / 
         NULLIF(COUNT(*) FILTER (WHERE protocol_category = 'traditional_knowledge'), 0)),
        (COUNT(*) FILTER (WHERE protocol_category = 'ceremonial' AND compliance_status = 'compliant') * 100.0 / 
         NULLIF(COUNT(*) FILTER (WHERE protocol_category = 'ceremonial'), 0)),
        (COUNT(*) FILTER (WHERE protocol_category = 'consultation' AND compliance_status = 'compliant') * 100.0 / 
         NULLIF(COUNT(*) FILTER (WHERE protocol_category = 'consultation'), 0))
    FROM cultural_protocol_compliance 
    WHERE community_id = NEW.community_id 
      AND DATE(created_at) = CURRENT_DATE
    ON CONFLICT (community_id, aggregation_date) 
    DO UPDATE SET
        total_insights_reviewed = EXCLUDED.total_insights_reviewed,
        culturally_compliant_insights = EXCLUDED.culturally_compliant_insights,
        non_compliant_insights = EXCLUDED.non_compliant_insights,
        partially_compliant_insights = EXCLUDED.partially_compliant_insights,
        overall_compliance_rate = EXCLUDED.overall_compliance_rate,
        data_sovereignty_compliance_rate = EXCLUDED.data_sovereignty_compliance_rate,
        traditional_knowledge_compliance_rate = EXCLUDED.traditional_knowledge_compliance_rate,
        ceremonial_compliance_rate = EXCLUDED.ceremonial_compliance_rate,
        consultation_compliance_rate = EXCLUDED.consultation_compliance_rate,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cultural_compliance_metrics_trigger
    AFTER INSERT OR UPDATE ON cultural_protocol_compliance
    FOR EACH ROW EXECUTE FUNCTION update_cultural_compliance_metrics();

-- =============================================
-- VIEWS FOR CULTURAL INTELLIGENCE
-- =============================================

-- Cultural intelligence summary view
CREATE OR REPLACE VIEW cultural_intelligence_summary AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    COUNT(ii.*) as total_insights,
    COUNT(cic.*) as insights_with_cultural_context,
    COUNT(cav.*) as cultural_authority_validations,
    COUNT(*) FILTER (WHERE cav.validation_status = 'approved') as approved_validations,
    COUNT(*) FILTER (WHERE cav.validation_status = 'rejected') as rejected_validations,
    COUNT(*) FILTER (WHERE cav.validation_status = 'pending') as pending_validations,
    COUNT(cpc.*) as protocol_compliance_checks,
    COUNT(*) FILTER (WHERE cpc.compliance_status = 'compliant') as compliant_protocols,
    COUNT(*) FILTER (WHERE cpc.compliance_status = 'non_compliant') as non_compliant_protocols,
    AVG(cia.overall_cultural_impact_score) as avg_cultural_impact_score,
    COUNT(*) FILTER (WHERE cia.cultural_risk_level = 'high' OR cia.cultural_risk_level = 'critical') as high_risk_assessments
FROM communities c
LEFT JOIN intelligence_insights ii ON c.id = ii.community_id AND ii.status = 'active'
LEFT JOIN cultural_intelligence_context cic ON ii.id = cic.insight_id
LEFT JOIN cultural_authority_validations cav ON ii.id = cav.insight_id
LEFT JOIN cultural_protocol_compliance cpc ON ii.id = cpc.insight_id
LEFT JOIN cultural_impact_assessments cia ON ii.id = cia.insight_id
GROUP BY c.id, c.name;

-- Cultural review workload view
CREATE OR REPLACE VIEW cultural_review_workload AS
SELECT 
    u.id as cultural_authority_id,
    u.name as authority_name,
    COUNT(cav.*) as total_validations,
    COUNT(*) FILTER (WHERE cav.validation_status = 'pending') as pending_validations,
    COUNT(*) FILTER (WHERE crw.workflow_status = 'awaiting_authority') as awaiting_workflows,
    AVG(EXTRACT(EPOCH FROM (cav.validated_at - cav.created_at))/86400) as avg_validation_days,
    COUNT(*) FILTER (WHERE cav.validation_status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE cav.validation_status = 'rejected') as rejected_count,
    (COUNT(*) FILTER (WHERE cav.validation_status = 'approved') * 100.0 / 
     NULLIF(COUNT(*) FILTER (WHERE cav.validation_status IN ('approved', 'rejected')), 0)) as approval_rate
FROM users u
LEFT JOIN cultural_authority_validations cav ON u.id = cav.cultural_authority_id
LEFT JOIN cultural_review_workflows crw ON u.id = ANY(crw.assigned_cultural_authorities)
WHERE u.role IN ('elder', 'cultural_authority', 'knowledge_keeper')
GROUP BY u.id, u.name;

-- Cultural compliance dashboard view
CREATE OR REPLACE VIEW cultural_compliance_dashboard AS
SELECT 
    c.id as community_id,
    c.name as community_name,
    ccm.aggregation_date,
    ccm.overall_compliance_rate,
    ccm.data_sovereignty_compliance_rate,
    ccm.traditional_knowledge_compliance_rate,
    ccm.ceremonial_compliance_rate,
    ccm.consultation_compliance_rate,
    ccm.total_authority_validations,
    ccm.approved_validations,
    ccm.pending_validations,
    ccm.average_review_duration_days,
    ccm.cultural_authority_satisfaction_score,
    CASE 
        WHEN ccm.overall_compliance_rate >= 95 THEN 'excellent'
        WHEN ccm.overall_compliance_rate >= 85 THEN 'good'
        WHEN ccm.overall_compliance_rate >= 70 THEN 'needs_improvement'
        ELSE 'critical'
    END as compliance_status
FROM communities c
LEFT JOIN cultural_compliance_metrics ccm ON c.id = ccm.community_id
WHERE ccm.aggregation_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY c.name, ccm.aggregation_date DESC;

-- =============================================
-- FUNCTIONS FOR CULTURAL INTELLIGENCE
-- =============================================

-- Function to create cultural intelligence context
CREATE OR REPLACE FUNCTION create_cultural_intelligence_context(
    p_insight_id UUID,
    p_community_id UUID,
    p_cultural_significance_level VARCHAR(20) DEFAULT 'medium',
    p_contains_traditional_knowledge BOOLEAN DEFAULT false,
    p_traditional_knowledge_type VARCHAR(100) DEFAULT NULL,
    p_elder_consultation_required BOOLEAN DEFAULT true,
    p_preferred_languages TEXT[] DEFAULT '{}',
    p_community_specific_protocols JSONB DEFAULT '{}',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    context_id UUID;
BEGIN
    INSERT INTO cultural_intelligence_context (
        insight_id, community_id, cultural_significance_level,
        contains_traditional_knowledge, traditional_knowledge_type,
        elder_consultation_required, preferred_languages,
        community_specific_protocols, created_by
    ) VALUES (
        p_insight_id, p_community_id, p_cultural_significance_level,
        p_contains_traditional_knowledge, p_traditional_knowledge_type,
        p_elder_consultation_required, p_preferred_languages,
        p_community_specific_protocols, p_created_by
    ) RETURNING id INTO context_id;
    
    RETURN context_id;
END;
$$ LANGUAGE plpgsql;

-- Function to initiate cultural review workflow
CREATE OR REPLACE FUNCTION initiate_cultural_review_workflow(
    p_insight_id UUID,
    p_community_id UUID,
    p_workflow_type VARCHAR(50) DEFAULT 'standard_review',
    p_assigned_authorities UUID[] DEFAULT '{}',
    p_priority_level VARCHAR(20) DEFAULT 'medium',
    p_workflow_coordinator UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    workflow_id UUID;
    estimated_completion DATE;
BEGIN
    -- Calculate estimated completion based on workflow type
    estimated_completion := CASE p_workflow_type
        WHEN 'expedited_review' THEN CURRENT_DATE + INTERVAL '3 days'
        WHEN 'ceremonial_review' THEN CURRENT_DATE + INTERVAL '14 days'
        WHEN 'consensus_review' THEN CURRENT_DATE + INTERVAL '21 days'
        ELSE CURRENT_DATE + INTERVAL '7 days' -- standard_review
    END;
    
    INSERT INTO cultural_review_workflows (
        insight_id, community_id, workflow_type, assigned_cultural_authorities,
        priority_level, workflow_coordinator, estimated_completion_date,
        remaining_steps
    ) VALUES (
        p_insight_id, p_community_id, p_workflow_type, p_assigned_authorities,
        p_priority_level, p_workflow_coordinator, estimated_completion,
        CASE p_workflow_type
            WHEN 'expedited_review' THEN ARRAY['initial_review', 'authority_validation', 'final_approval']
            WHEN 'ceremonial_review' THEN ARRAY['cultural_assessment', 'ceremonial_consultation', 'elder_review', 'community_notification', 'final_approval']
            WHEN 'consensus_review' THEN ARRAY['community_consultation', 'stakeholder_review', 'consensus_building', 'final_validation']
            ELSE ARRAY['initial_review', 'cultural_assessment', 'authority_validation', 'final_approval']
        END
    ) RETURNING id INTO workflow_id;
    
    RETURN workflow_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA AND CONFIGURATION
-- =============================================

-- Insert default cultural protocol categories
INSERT INTO cultural_protocol_compliance (
    insight_id, community_id, protocol_name, protocol_category, 
    protocol_requirements, compliance_status
) 
SELECT 
    ii.id, ii.community_id, 
    'Data Sovereignty Compliance', 'data_sovereignty',
    'Ensure community maintains control over their data and insights',
    'under_review'
FROM intelligence_insights ii
WHERE NOT EXISTS (
    SELECT 1 FROM cultural_protocol_compliance cpc 
    WHERE cpc.insight_id = ii.id AND cpc.protocol_category = 'data_sovereignty'
)
ON CONFLICT DO NOTHING;

-- Create default cultural compliance metrics for communities
INSERT INTO cultural_compliance_metrics (
    community_id, aggregation_date, total_insights_reviewed,
    overall_compliance_rate, cultural_authority_satisfaction_score
)
SELECT 
    c.id, CURRENT_DATE, 0, 100.0, 1.0
FROM communities c
WHERE NOT EXISTS (
    SELECT 1 FROM cultural_compliance_metrics ccm 
    WHERE ccm.community_id = c.id AND ccm.aggregation_date = CURRENT_DATE
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE cultural_intelligence_context IS 'Cultural context and protocols for intelligence insights';
COMMENT ON TABLE cultural_authority_validations IS 'Validations by cultural authorities for intelligence insights';
COMMENT ON TABLE cultural_protocol_compliance IS 'Tracking compliance with cultural protocols for intelligence';
COMMENT ON TABLE cultural_review_workflows IS 'Workflow management for cultural review processes';
COMMENT ON TABLE cultural_impact_assessments IS 'Assessments of cultural impact for intelligence insights';
COMMENT ON TABLE cultural_compliance_metrics IS 'Aggregated metrics for cultural compliance monitoring';