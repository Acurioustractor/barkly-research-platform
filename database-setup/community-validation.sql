-- Community Validation System Database Schema
-- Supports community expert review of AI-generated insights and content

-- Community Validators table
CREATE TABLE IF NOT EXISTS community_validators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('community_expert', 'elder', 'service_provider', 'academic', 'community_member')),
    expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
    community_affiliation TEXT NOT NULL,
    cultural_role TEXT,
    years_of_experience INTEGER DEFAULT 0,
    validation_history JSONB DEFAULT '{
        "totalValidations": 0,
        "averageScore": 0,
        "averageTimeSpent": 0,
        "specializations": {},
        "consensusRate": 0,
        "qualityRating": 0
    }'::jsonb,
    availability JSONB DEFAULT '{
        "hoursPerWeek": 0,
        "preferredTimeSlots": [],
        "unavailableDates": [],
        "responseTimeHours": 24,
        "maxConcurrentValidations": 3
    }'::jsonb,
    cultural_knowledge_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
    contact_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
    endorsements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Validation Workflows table
CREATE TABLE IF NOT EXISTS validation_workflows (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('ai_insight', 'analysis_result', 'recommendation', 'pattern', 'prediction')),
    required_validators INTEGER NOT NULL DEFAULT 3,
    required_expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
    elder_review_required BOOLEAN DEFAULT false,
    cultural_review_required BOOLEAN DEFAULT false,
    consensus_threshold DECIMAL(3,2) DEFAULT 0.70 CHECK (consensus_threshold >= 0 AND consensus_threshold <= 1),
    timeout_days INTEGER DEFAULT 7,
    escalation_rules JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Validation Requests table
CREATE TABLE IF NOT EXISTS validation_requests (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('ai_insight', 'analysis_result', 'recommendation', 'pattern', 'prediction')),
    content JSONB NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    community_id TEXT NOT NULL,
    community_name TEXT NOT NULL,
    required_validators INTEGER NOT NULL DEFAULT 3,
    current_validators INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'validated', 'rejected', 'needs_revision')),
    deadline TIMESTAMP WITH TIME ZONE,
    cultural_sensitivity TEXT NOT NULL DEFAULT 'medium' CHECK (cultural_sensitivity IN ('none', 'low', 'medium', 'high', 'critical')),
    traditional_knowledge_involved BOOLEAN DEFAULT false,
    elder_review_required BOOLEAN DEFAULT false,
    validations JSONB DEFAULT '[]'::jsonb,
    consensus_reached BOOLEAN DEFAULT false,
    final_score DECIMAL(3,2) DEFAULT 0 CHECK (final_score >= 0 AND final_score <= 5),
    confidence DECIMAL(3,2) DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    source_attribution JSONB DEFAULT '[]'::jsonb,
    feedback JSONB DEFAULT '[]'::jsonb,
    revisions JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Validator Assignments table
CREATE TABLE IF NOT EXISTS validator_assignments (
    id SERIAL PRIMARY KEY,
    validation_request_id TEXT NOT NULL REFERENCES validation_requests(id) ON DELETE CASCADE,
    validator_id TEXT NOT NULL REFERENCES community_validators(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed', 'expired')),
    decline_reason TEXT,
    
    UNIQUE(validation_request_id, validator_id)
);

-- Validation Submissions table
CREATE TABLE IF NOT EXISTS validation_submissions (
    id TEXT PRIMARY KEY,
    validation_request_id TEXT NOT NULL REFERENCES validation_requests(id) ON DELETE CASCADE,
    validator_id TEXT NOT NULL REFERENCES community_validators(id) ON DELETE CASCADE,
    validator_name TEXT NOT NULL,
    validator_role TEXT NOT NULL,
    validator_expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_affiliation TEXT,
    validation_score DECIMAL(3,2) NOT NULL CHECK (validation_score >= 1 AND validation_score <= 5),
    accuracy DECIMAL(3,2) NOT NULL CHECK (accuracy >= 1 AND accuracy <= 5),
    relevance DECIMAL(3,2) NOT NULL CHECK (relevance >= 1 AND relevance <= 5),
    cultural_appropriateness DECIMAL(3,2) NOT NULL CHECK (cultural_appropriateness >= 1 AND cultural_appropriateness <= 5),
    completeness DECIMAL(3,2) NOT NULL CHECK (completeness >= 1 AND completeness <= 5),
    actionability DECIMAL(3,2) NOT NULL CHECK (actionability >= 1 AND actionability <= 5),
    overall_assessment TEXT NOT NULL CHECK (overall_assessment IN ('strongly_disagree', 'disagree', 'neutral', 'agree', 'strongly_agree')),
    comments TEXT NOT NULL,
    specific_concerns TEXT[] DEFAULT ARRAY[]::TEXT[],
    suggested_improvements TEXT[] DEFAULT ARRAY[]::TEXT[],
    cultural_considerations TEXT[] DEFAULT ARRAY[]::TEXT[],
    additional_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
    confidence_level DECIMAL(3,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    time_spent_minutes INTEGER DEFAULT 0,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(validation_request_id, validator_id)
);

-- Model Improvement Feedback table
CREATE TABLE IF NOT EXISTS model_improvement_feedback (
    id TEXT PRIMARY KEY,
    validation_request_id TEXT REFERENCES validation_requests(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('model_improvement', 'process_improvement', 'cultural_guidance', 'methodology_suggestion')),
    category TEXT NOT NULL,
    feedback TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    submitted_by TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    implementation_status TEXT NOT NULL DEFAULT 'pending' CHECK (implementation_status IN ('pending', 'in_progress', 'implemented', 'rejected')),
    implementation_notes TEXT,
    implemented_at TIMESTAMP WITH TIME ZONE,
    impact_assessment TEXT
);

-- Validation Metrics table
CREATE TABLE IF NOT EXISTS validation_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    community_id TEXT,
    total_requests INTEGER DEFAULT 0,
    completed_validations INTEGER DEFAULT 0,
    average_completion_time_hours DECIMAL(10,2) DEFAULT 0,
    consensus_rate DECIMAL(5,2) DEFAULT 0,
    average_confidence DECIMAL(3,2) DEFAULT 0,
    validator_participation JSONB DEFAULT '{}'::jsonb,
    content_type_breakdown JSONB DEFAULT '{}'::jsonb,
    cultural_compliance_score DECIMAL(5,2) DEFAULT 0,
    model_improvement_suggestions INTEGER DEFAULT 0,
    implemented_improvements INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(metric_date, community_id)
);

-- Content Revisions table
CREATE TABLE IF NOT EXISTS content_revisions (
    id TEXT PRIMARY KEY,
    validation_request_id TEXT NOT NULL REFERENCES validation_requests(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    revised_by TEXT NOT NULL,
    revision_reason TEXT NOT NULL,
    changes JSONB DEFAULT '[]'::jsonb,
    revised_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(validation_request_id, revision_number)
);

-- Validator Notifications table
CREATE TABLE IF NOT EXISTS validator_notifications (
    id SERIAL PRIMARY KEY,
    validator_id TEXT NOT NULL REFERENCES community_validators(id) ON DELETE CASCADE,
    validation_request_id TEXT NOT NULL REFERENCES validation_requests(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('assignment', 'reminder', 'deadline_warning', 'completion')),
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms', 'in_app', 'phone')),
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed'))
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_community_validators_role ON community_validators(role);
CREATE INDEX IF NOT EXISTS idx_community_validators_community_affiliation ON community_validators(community_affiliation);
CREATE INDEX IF NOT EXISTS idx_community_validators_is_active ON community_validators(is_active);
CREATE INDEX IF NOT EXISTS idx_community_validators_expertise ON community_validators USING GIN(expertise);

CREATE INDEX IF NOT EXISTS idx_validation_workflows_content_type ON validation_workflows(content_type);
CREATE INDEX IF NOT EXISTS idx_validation_workflows_is_active ON validation_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_validation_requests_status ON validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_validation_requests_community_id ON validation_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_content_type ON validation_requests(content_type);
CREATE INDEX IF NOT EXISTS idx_validation_requests_priority ON validation_requests(priority);
CREATE INDEX IF NOT EXISTS idx_validation_requests_submitted_at ON validation_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_validation_requests_deadline ON validation_requests(deadline);

CREATE INDEX IF NOT EXISTS idx_validator_assignments_validation_request_id ON validator_assignments(validation_request_id);
CREATE INDEX IF NOT EXISTS idx_validator_assignments_validator_id ON validator_assignments(validator_id);
CREATE INDEX IF NOT EXISTS idx_validator_assignments_status ON validator_assignments(status);
CREATE INDEX IF NOT EXISTS idx_validator_assignments_assigned_at ON validator_assignments(assigned_at);

CREATE INDEX IF NOT EXISTS idx_validation_submissions_validation_request_id ON validation_submissions(validation_request_id);
CREATE INDEX IF NOT EXISTS idx_validation_submissions_validator_id ON validation_submissions(validator_id);
CREATE INDEX IF NOT EXISTS idx_validation_submissions_validated_at ON validation_submissions(validated_at);

CREATE INDEX IF NOT EXISTS idx_model_improvement_feedback_validation_request_id ON model_improvement_feedback(validation_request_id);
CREATE INDEX IF NOT EXISTS idx_model_improvement_feedback_feedback_type ON model_improvement_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_model_improvement_feedback_implementation_status ON model_improvement_feedback(implementation_status);
CREATE INDEX IF NOT EXISTS idx_model_improvement_feedback_submitted_at ON model_improvement_feedback(submitted_at);

CREATE INDEX IF NOT EXISTS idx_validation_metrics_metric_date ON validation_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_validation_metrics_community_id ON validation_metrics(community_id);

CREATE INDEX IF NOT EXISTS idx_content_revisions_validation_request_id ON content_revisions(validation_request_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_revised_at ON content_revisions(revised_at);

CREATE INDEX IF NOT EXISTS idx_validator_notifications_validator_id ON validator_notifications(validator_id);
CREATE INDEX IF NOT EXISTS idx_validator_notifications_validation_request_id ON validator_notifications(validation_request_id);
CREATE INDEX IF NOT EXISTS idx_validator_notifications_sent_at ON validator_notifications(sent_at);

-- Insert sample data for testing

-- Insert sample validation workflows
INSERT INTO validation_workflows (
    id, content_type, required_validators, required_expertise, elder_review_required, 
    cultural_review_required, consensus_threshold, timeout_days
) VALUES
    ('workflow-ai-insight', 'ai_insight', 3, ARRAY['community_knowledge', 'data_analysis'], true, true, 0.70, 7),
    ('workflow-analysis-result', 'analysis_result', 2, ARRAY['research_methodology', 'statistics'], false, true, 0.75, 5),
    ('workflow-recommendation', 'recommendation', 3, ARRAY['program_management', 'community_development'], true, true, 0.80, 10),
    ('workflow-pattern', 'pattern', 2, ARRAY['pattern_recognition', 'community_trends'], false, false, 0.70, 7),
    ('workflow-prediction', 'prediction', 4, ARRAY['forecasting', 'community_planning'], true, true, 0.85, 14)
ON CONFLICT (id) DO NOTHING;

-- Insert sample community validators
INSERT INTO community_validators (
    id, name, role, expertise, community_affiliation, cultural_role, years_of_experience,
    cultural_knowledge_areas, languages, is_active
) VALUES
    ('validator-elder-001', 'Elder Mary Whitehorse', 'elder', 
     ARRAY['traditional_knowledge', 'cultural_practices', 'community_history'], 
     'community-1', 'Knowledge Keeper', 45,
     ARRAY['traditional_healing', 'ceremonies', 'oral_history'], 
     ARRAY['en', 'indigenous'], true),
    ('validator-expert-001', 'Dr. Sarah Johnson', 'community_expert',
     ARRAY['public_health', 'community_development', 'research_methodology'],
     'community-1', null, 15,
     ARRAY['health_systems', 'program_evaluation'],
     ARRAY['en'], true),
    ('validator-provider-001', 'James Thompson', 'service_provider',
     ARRAY['education', 'youth_programs', 'community_engagement'],
     'community-1', null, 12,
     ARRAY['educational_systems', 'youth_development'],
     ARRAY['en', 'indigenous'], true),
    ('validator-academic-001', 'Prof. Lisa Bearcloud', 'academic',
     ARRAY['indigenous_studies', 'anthropology', 'data_analysis'],
     'all', 'Cultural Researcher', 20,
     ARRAY['cultural_preservation', 'research_ethics', 'community_protocols'],
     ARRAY['en', 'indigenous'], true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample validation requests
INSERT INTO validation_requests (
    id, content_id, content_type, content, submitted_by, priority, community_id, community_name,
    required_validators, cultural_sensitivity, traditional_knowledge_involved, elder_review_required
) VALUES
    ('validation-001', 'ai-insight-001', 'ai_insight',
     '{
        "title": "Community Health Trends Analysis",
        "description": "AI analysis of community health patterns over the past year",
        "aiGeneratedInsight": "The analysis shows a 15% increase in mental health concerns among youth, particularly during winter months. This correlates with reduced community activities and limited access to traditional healing practices.",
        "supportingData": ["health_clinic_records", "community_surveys", "service_usage_data"],
        "methodology": "Machine learning analysis of health service utilization patterns",
        "assumptions": ["Data completeness", "Consistent reporting methods"],
        "limitations": ["Limited sample size for certain age groups", "Seasonal data variations"],
        "culturalContext": "Traditional healing practices are important for mental wellness in this community",
        "potentialImpact": "Could inform development of culturally appropriate mental health programs",
        "recommendedActions": ["Integrate traditional healing", "Increase winter programming", "Youth-specific support"]
     }'::jsonb,
     'ai-system', 'high', 'community-1', 'Bearcloud First Nation',
     3, 'high', true, true),
    ('validation-002', 'analysis-result-001', 'analysis_result',
     '{
        "title": "Education Program Effectiveness",
        "description": "Analysis of traditional language program outcomes",
        "aiGeneratedInsight": "The traditional language immersion program shows 85% retention rate and significant improvement in cultural identity scores among participants.",
        "supportingData": ["student_assessments", "parent_feedback", "teacher_evaluations"],
        "methodology": "Statistical analysis of program metrics and qualitative feedback",
        "assumptions": ["Consistent assessment methods", "Representative sample"],
        "limitations": ["Short-term data only", "Limited control group"],
        "potentialImpact": "Supports expansion of language programs to other communities",
        "recommendedActions": ["Expand program capacity", "Develop teacher training", "Create resource materials"]
     }'::jsonb,
     'education-analyst', 'medium', 'community-1', 'Bearcloud First Nation',
     2, 'medium', false, false)
ON CONFLICT (id) DO NOTHING;--
 Create functions for validation management

-- Function to automatically assign validators based on expertise
CREATE OR REPLACE FUNCTION assign_validators_to_request(
    p_request_id TEXT
) RETURNS INTEGER AS $$
DECLARE
    request_record RECORD;
    workflow_record RECORD;
    validator_record RECORD;
    assigned_count INTEGER := 0;
    required_expertise TEXT[];
BEGIN
    -- Get validation request details
    SELECT * INTO request_record FROM validation_requests WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Validation request not found: %', p_request_id;
    END IF;
    
    -- Get workflow configuration
    SELECT * INTO workflow_record FROM validation_workflows 
    WHERE content_type = request_record.content_type AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active workflow found for content type: %', request_record.content_type;
    END IF;
    
    required_expertise := workflow_record.required_expertise;
    
    -- Find suitable validators
    FOR validator_record IN
        SELECT * FROM community_validators cv
        WHERE cv.is_active = true
        AND (cv.community_affiliation = request_record.community_id OR cv.community_affiliation = 'all')
        AND (
            -- Check if validator has required expertise
            EXISTS (
                SELECT 1 FROM unnest(cv.expertise) AS exp
                WHERE exp = ANY(required_expertise)
            )
            OR 
            -- Always include elders if elder review is required
            (workflow_record.elder_review_required AND cv.role = 'elder')
        )
        ORDER BY 
            -- Prioritize elders if elder review required
            CASE WHEN workflow_record.elder_review_required AND cv.role = 'elder' THEN 1 ELSE 2 END,
            -- Then by quality rating
            (cv.validation_history->>'qualityRating')::DECIMAL DESC
        LIMIT workflow_record.required_validators
    LOOP
        -- Assign validator
        INSERT INTO validator_assignments (validation_request_id, validator_id, assigned_at, status)
        VALUES (p_request_id, validator_record.id, CURRENT_TIMESTAMP, 'assigned')
        ON CONFLICT (validation_request_id, validator_id) DO NOTHING;
        
        IF FOUND THEN
            assigned_count := assigned_count + 1;
        END IF;
    END LOOP;
    
    -- Update request status if validators assigned
    IF assigned_count > 0 THEN
        UPDATE validation_requests 
        SET status = 'in_review', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_request_id;
    END IF;
    
    RETURN assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate validation consensus
CREATE OR REPLACE FUNCTION calculate_validation_consensus(
    p_request_id TEXT
) RETURNS TABLE (
    consensus_reached BOOLEAN,
    final_score DECIMAL,
    confidence DECIMAL
) AS $$
DECLARE
    request_record RECORD;
    workflow_record RECORD;
    validation_scores DECIMAL[];
    avg_score DECIMAL;
    score_variance DECIMAL;
    std_deviation DECIMAL;
    consensus_threshold DECIMAL;
    weighted_score DECIMAL := 0;
    total_weight DECIMAL := 0;
    avg_confidence DECIMAL;
    validator_weight DECIMAL;
BEGIN
    -- Get validation request and workflow
    SELECT * INTO request_record FROM validation_requests WHERE id = p_request_id;
    SELECT * INTO workflow_record FROM validation_workflows 
    WHERE content_type = request_record.content_type AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 0::DECIMAL;
        RETURN;
    END IF;
    
    consensus_threshold := workflow_record.consensus_threshold;
    
    -- Get validation scores
    SELECT array_agg(validation_score) INTO validation_scores
    FROM validation_submissions
    WHERE validation_request_id = p_request_id;
    
    IF validation_scores IS NULL OR array_length(validation_scores, 1) = 0 THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Calculate average score
    SELECT AVG(score) INTO avg_score FROM unnest(validation_scores) AS score;
    
    -- Calculate variance and standard deviation
    SELECT AVG(POWER(score - avg_score, 2)) INTO score_variance 
    FROM unnest(validation_scores) AS score;
    std_deviation := SQRT(score_variance);
    
    -- Calculate weighted score based on validator roles and confidence
    FOR validator_record IN
        SELECT vs.*, cv.role, cv.validation_history
        FROM validation_submissions vs
        JOIN community_validators cv ON vs.validator_id = cv.id
        WHERE vs.validation_request_id = p_request_id
    LOOP
        -- Assign weights based on validator role
        validator_weight := CASE 
            WHEN validator_record.role = 'elder' THEN 1.5
            WHEN validator_record.role = 'community_expert' THEN 1.3
            WHEN validator_record.role = 'academic' THEN 1.2
            ELSE 1.0
        END;
        
        -- Adjust weight by confidence level
        validator_weight := validator_weight * validator_record.confidence_level;
        
        weighted_score := weighted_score + (validator_record.validation_score * validator_weight);
        total_weight := total_weight + validator_weight;
    END LOOP;
    
    -- Calculate final weighted score
    IF total_weight > 0 THEN
        weighted_score := weighted_score / total_weight;
    ELSE
        weighted_score := avg_score;
    END IF;
    
    -- Calculate average confidence
    SELECT AVG(confidence_level) INTO avg_confidence
    FROM validation_submissions
    WHERE validation_request_id = p_request_id;
    
    -- Determine if consensus is reached (low standard deviation indicates consensus)
    RETURN QUERY SELECT 
        (std_deviation <= (1 - consensus_threshold)) AS consensus_reached,
        weighted_score AS final_score,
        LEAST(avg_confidence + CASE WHEN std_deviation <= (1 - consensus_threshold) THEN 0.1 ELSE 0 END, 1.0) AS confidence;
END;
$$ LANGUAGE plpgsql;

-- Function to update validation metrics
CREATE OR REPLACE FUNCTION update_validation_metrics(
    p_date DATE DEFAULT CURRENT_DATE,
    p_community_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    total_requests_count INTEGER;
    completed_validations_count INTEGER;
    avg_completion_time DECIMAL;
    consensus_rate_calc DECIMAL;
    avg_confidence_calc DECIMAL;
    validator_participation_data JSONB;
    content_type_breakdown_data JSONB;
    cultural_compliance_calc DECIMAL;
    improvement_suggestions_count INTEGER;
    implemented_improvements_count INTEGER;
BEGIN
    -- Calculate total requests
    SELECT COUNT(*) INTO total_requests_count
    FROM validation_requests vr
    WHERE DATE(vr.submitted_at) = p_date
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Calculate completed validations
    SELECT COUNT(*) INTO completed_validations_count
    FROM validation_requests vr
    WHERE DATE(vr.submitted_at) = p_date
    AND vr.status = 'validated'
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Calculate average completion time
    SELECT AVG(EXTRACT(EPOCH FROM (completed_at - submitted_at)) / 3600) INTO avg_completion_time
    FROM validation_requests vr
    WHERE DATE(vr.submitted_at) = p_date
    AND vr.completed_at IS NOT NULL
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Calculate consensus rate
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN consensus_reached THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL)
            ELSE 0 
        END INTO consensus_rate_calc
    FROM validation_requests vr
    WHERE DATE(vr.submitted_at) = p_date
    AND vr.status = 'validated'
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Calculate average confidence
    SELECT AVG(confidence) INTO avg_confidence_calc
    FROM validation_requests vr
    WHERE DATE(vr.submitted_at) = p_date
    AND vr.status = 'validated'
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Calculate validator participation
    SELECT jsonb_object_agg(validator_id, participation_count) INTO validator_participation_data
    FROM (
        SELECT vs.validator_id, COUNT(*) as participation_count
        FROM validation_submissions vs
        JOIN validation_requests vr ON vs.validation_request_id = vr.id
        WHERE DATE(vr.submitted_at) = p_date
        AND (p_community_id IS NULL OR vr.community_id = p_community_id)
        GROUP BY vs.validator_id
    ) participation;
    
    -- Calculate content type breakdown
    SELECT jsonb_object_agg(content_type, type_count) INTO content_type_breakdown_data
    FROM (
        SELECT content_type, COUNT(*) as type_count
        FROM validation_requests vr
        WHERE DATE(vr.submitted_at) = p_date
        AND (p_community_id IS NULL OR vr.community_id = p_community_id)
        GROUP BY content_type
    ) breakdown;
    
    -- Calculate cultural compliance score
    SELECT AVG(cultural_appropriateness) * 20 INTO cultural_compliance_calc
    FROM validation_submissions vs
    JOIN validation_requests vr ON vs.validation_request_id = vr.id
    WHERE DATE(vr.submitted_at) = p_date
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Count model improvement suggestions
    SELECT COUNT(*) INTO improvement_suggestions_count
    FROM model_improvement_feedback mif
    JOIN validation_requests vr ON mif.validation_request_id = vr.id
    WHERE DATE(vr.submitted_at) = p_date
    AND mif.feedback_type = 'model_improvement'
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Count implemented improvements
    SELECT COUNT(*) INTO implemented_improvements_count
    FROM model_improvement_feedback mif
    JOIN validation_requests vr ON mif.validation_request_id = vr.id
    WHERE DATE(vr.submitted_at) = p_date
    AND mif.implementation_status = 'implemented'
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
    
    -- Insert or update metrics
    INSERT INTO validation_metrics (
        metric_date, community_id, total_requests, completed_validations,
        average_completion_time_hours, consensus_rate, average_confidence,
        validator_participation, content_type_breakdown, cultural_compliance_score,
        model_improvement_suggestions, implemented_improvements
    ) VALUES (
        p_date, p_community_id, total_requests_count, completed_validations_count,
        COALESCE(avg_completion_time, 0), COALESCE(consensus_rate_calc, 0), COALESCE(avg_confidence_calc, 0),
        COALESCE(validator_participation_data, '{}'::jsonb), COALESCE(content_type_breakdown_data, '{}'::jsonb),
        COALESCE(cultural_compliance_calc, 0), improvement_suggestions_count, implemented_improvements_count
    )
    ON CONFLICT (metric_date, community_id) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        completed_validations = EXCLUDED.completed_validations,
        average_completion_time_hours = EXCLUDED.average_completion_time_hours,
        consensus_rate = EXCLUDED.consensus_rate,
        average_confidence = EXCLUDED.average_confidence,
        validator_participation = EXCLUDED.validator_participation,
        content_type_breakdown = EXCLUDED.content_type_breakdown,
        cultural_compliance_score = EXCLUDED.cultural_compliance_score,
        model_improvement_suggestions = EXCLUDED.model_improvement_suggestions,
        implemented_improvements = EXCLUDED.implemented_improvements,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to get validation dashboard data
CREATE OR REPLACE FUNCTION get_validation_dashboard(
    p_community_id TEXT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_requests INTEGER,
    pending_validations INTEGER,
    completed_validations INTEGER,
    consensus_rate DECIMAL,
    average_confidence DECIMAL,
    active_validators INTEGER,
    overdue_requests INTEGER,
    cultural_compliance_score DECIMAL
) AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    start_date := CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(vr.*)::INTEGER as total_requests,
        COUNT(CASE WHEN vr.status IN ('pending', 'in_review') THEN 1 END)::INTEGER as pending_validations,
        COUNT(CASE WHEN vr.status = 'validated' THEN 1 END)::INTEGER as completed_validations,
        CASE 
            WHEN COUNT(CASE WHEN vr.status = 'validated' THEN 1 END) > 0 THEN
                (COUNT(CASE WHEN vr.consensus_reached THEN 1 END)::DECIMAL / 
                 COUNT(CASE WHEN vr.status = 'validated' THEN 1 END)::DECIMAL)
            ELSE 0 
        END as consensus_rate,
        AVG(CASE WHEN vr.status = 'validated' THEN vr.confidence END)::DECIMAL as average_confidence,
        (
            SELECT COUNT(DISTINCT cv.id)::INTEGER
            FROM community_validators cv
            WHERE cv.is_active = true
            AND (p_community_id IS NULL OR cv.community_affiliation = p_community_id OR cv.community_affiliation = 'all')
        ) as active_validators,
        COUNT(CASE WHEN vr.deadline < CURRENT_TIMESTAMP AND vr.status IN ('pending', 'in_review') THEN 1 END)::INTEGER as overdue_requests,
        (
            SELECT AVG(vs.cultural_appropriateness) * 20
            FROM validation_submissions vs
            JOIN validation_requests vr2 ON vs.validation_request_id = vr2.id
            WHERE vr2.submitted_at >= start_date
            AND (p_community_id IS NULL OR vr2.community_id = p_community_id)
        )::DECIMAL as cultural_compliance_score
    FROM validation_requests vr
    WHERE vr.submitted_at >= start_date
    AND (p_community_id IS NULL OR vr.community_id = p_community_id);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic processing

-- Trigger to assign validators when validation request is created
CREATE OR REPLACE FUNCTION trigger_assign_validators()
RETURNS TRIGGER AS $$
BEGIN
    -- Assign validators automatically for new requests
    PERFORM assign_validators_to_request(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_assign_validators ON validation_requests;
CREATE TRIGGER auto_assign_validators
    AFTER INSERT ON validation_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_assign_validators();

-- Trigger to update validation status when submission is added
CREATE OR REPLACE FUNCTION trigger_check_validation_completion()
RETURNS TRIGGER AS $$
DECLARE
    consensus_result RECORD;
BEGIN
    -- Calculate consensus for the validation request
    SELECT * INTO consensus_result 
    FROM calculate_validation_consensus(NEW.validation_request_id);
    
    -- Update the validation request with results
    UPDATE validation_requests 
    SET 
        consensus_reached = consensus_result.consensus_reached,
        final_score = consensus_result.final_score,
        confidence = consensus_result.confidence,
        status = CASE 
            WHEN consensus_result.consensus_reached THEN 'validated'
            ELSE 'needs_revision'
        END,
        completed_at = CASE 
            WHEN consensus_result.consensus_reached OR 
                 (SELECT COUNT(*) FROM validation_submissions WHERE validation_request_id = NEW.validation_request_id) >= 
                 (SELECT required_validators FROM validation_requests WHERE id = NEW.validation_request_id)
            THEN CURRENT_TIMESTAMP
            ELSE NULL
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.validation_request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_check_completion ON validation_submissions;
CREATE TRIGGER auto_check_completion
    AFTER INSERT ON validation_submissions
    FOR EACH ROW EXECUTE FUNCTION trigger_check_validation_completion();

-- Create view for validation dashboard
CREATE OR REPLACE VIEW validation_dashboard_summary AS
SELECT 
    vr.id,
    vr.content_type,
    vr.priority,
    vr.status,
    vr.community_name,
    vr.cultural_sensitivity,
    vr.traditional_knowledge_involved,
    vr.elder_review_required,
    vr.required_validators,
    vr.current_validators,
    vr.consensus_reached,
    vr.final_score,
    vr.confidence,
    vr.submitted_at,
    vr.deadline,
    vr.completed_at,
    CASE 
        WHEN vr.deadline < CURRENT_TIMESTAMP AND vr.status IN ('pending', 'in_review') THEN 'overdue'
        WHEN vr.deadline - CURRENT_TIMESTAMP <= INTERVAL '24 hours' AND vr.status IN ('pending', 'in_review') THEN 'due_soon'
        ELSE 'on_track'
    END as urgency_status,
    (
        SELECT COUNT(*)
        FROM validator_assignments va
        WHERE va.validation_request_id = vr.id
        AND va.status = 'assigned'
    ) as pending_assignments,
    (
        SELECT AVG(vs.validation_score)
        FROM validation_submissions vs
        WHERE vs.validation_request_id = vr.id
    ) as average_validation_score
FROM validation_requests vr
ORDER BY 
    CASE vr.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    vr.submitted_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON community_validators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validation_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validation_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validator_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validation_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON model_improvement_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validation_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON validator_notifications TO authenticated;

GRANT SELECT ON validation_dashboard_summary TO authenticated;
GRANT EXECUTE ON FUNCTION assign_validators_to_request TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_validation_consensus TO authenticated;
GRANT EXECUTE ON FUNCTION update_validation_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_validation_dashboard TO authenticated;

-- Enable Row Level Security
ALTER TABLE community_validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_improvement_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - should be customized based on actual auth requirements)
CREATE POLICY "Validators can view their own profile" ON community_validators
    FOR SELECT USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Users can view active workflows" ON validation_workflows
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view validation requests for their community" ON validation_requests
    FOR SELECT USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Users can create validation requests" ON validation_requests
    FOR INSERT WITH CHECK (true); -- Adjust based on actual auth logic

CREATE POLICY "Validators can view their assignments" ON validator_assignments
    FOR SELECT USING (true); -- Adjust based on actual auth logic

CREATE POLICY "Validators can submit validations" ON validation_submissions
    FOR INSERT WITH CHECK (true); -- Adjust based on actual auth logic