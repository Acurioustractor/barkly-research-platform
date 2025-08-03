-- Task 19 Step 4: Developer Onboarding Materials
-- Comprehensive developer onboarding with cultural protocol training

-- ============================================================================
-- DEVELOPER ONBOARDING FRAMEWORK
-- ============================================================================

-- Create developer onboarding tracking
CREATE TABLE IF NOT EXISTS documentation.developer_onboarding (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES users(id),
    onboarding_stage TEXT NOT NULL,
    stage_description TEXT,
    completion_status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'requires_review'
    cultural_training_completed BOOLEAN DEFAULT false,
    cultural_assessment_score INTEGER,
    mentor_assigned TEXT,
    completion_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create onboarding curriculum
CREATE TABLE IF NOT EXISTS documentation.onboarding_curriculum (
    id SERIAL PRIMARY KEY,
    stage_order INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    stage_type TEXT NOT NULL, -- 'technical', 'cultural', 'practical', 'assessment'
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT[],
    prerequisites TEXT[],
    materials JSONB,
    exercises JSONB,
    cultural_importance TEXT,
    estimated_duration TEXT,
    assessment_required BOOLEAN DEFAULT false,
    mentor_guidance_required BOOLEAN DEFAULT false
);

-- Insert comprehensive onboarding curriculum
INSERT INTO documentation.onboarding_curriculum (
    stage_order, stage_name, stage_type, title, description, learning_objectives, 
    prerequisites, materials, exercises, cultural_importance, estimated_duration, 
    assessment_required, mentor_guidance_required
) VALUES 

-- Stage 1: Cultural Foundation
(1, 'cultural_foundation', 'cultural', 'Indigenous Research Methodologies and Data Sovereignty',
 'Foundational understanding of indigenous research principles, data sovereignty, and cultural protocols in technology.',
 ARRAY[
   'Understand indigenous data sovereignty principles',
   'Recognize cultural protocols in research contexts',
   'Identify sensitive cultural information',
   'Apply respectful research methodologies',
   'Understand community consent and collaboration'
 ],
 ARRAY['Basic understanding of research ethics'],
 '{
   "required_reading": [
     "Indigenous Data Sovereignty Principles",
     "Cultural Protocols in Digital Spaces",
     "Community-Based Participatory Research Methods"
   ],
   "videos": [
     "Introduction to Indigenous Research Ethics",
     "Data Sovereignty in Practice"
   ],
   "interactive_modules": [
     "Cultural Sensitivity Assessment",
     "Protocol Recognition Training"
   ]
 }',
 '{
   "reflection_questions": [
     "How do indigenous data sovereignty principles differ from standard data governance?",
     "What are the key considerations when working with traditional knowledge?",
     "How should technology respect cultural protocols?"
   ],
   "case_studies": [
     "Analyzing cultural protocol violations and their impact",
     "Successful community-technology partnerships"
   ],
   "practical_exercises": [
     "Identify cultural considerations in sample research scenarios",
     "Design culturally appropriate data collection methods"
   ]
 }',
 'CRITICAL: This foundation is essential for all work on the platform. Cultural understanding must precede technical implementation.',
 '2-3 days intensive study',
 true, true
),

-- Stage 2: Platform Architecture and Cultural Integration
(2, 'platform_architecture', 'technical', 'Barkly Platform Architecture with Cultural Considerations',
 'Technical overview of the platform architecture with emphasis on cultural protocol implementation.',
 ARRAY[
   'Understand platform database schema and cultural metadata',
   'Learn API design with cultural protocol integration',
   'Comprehend access control systems and cultural permissions',
   'Master cultural data handling procedures',
   'Understand audit and compliance systems'
 ],
 ARRAY['Cultural foundation completion', 'Basic database knowledge', 'API development experience'],
 '{
   "technical_documentation": [
     "Database Schema with Cultural Annotations",
     "API Documentation with Cultural Protocol Examples",
     "Access Control System Architecture"
   ],
   "code_examples": [
     "Cultural metadata handling",
     "Permission checking implementations",
     "Audit logging for cultural compliance"
   ],
   "architecture_diagrams": [
     "System overview with cultural data flows",
     "Permission and access control architecture"
   ]
 }',
 '{
   "hands_on_exercises": [
     "Set up local development environment",
     "Implement cultural metadata in sample queries",
     "Create API endpoint with cultural protocol checks",
     "Test access control scenarios"
   ],
   "code_review_exercises": [
     "Review existing code for cultural compliance",
     "Identify potential cultural protocol violations in code"
   ]
 }',
 'Technical implementation must always consider cultural implications. Code review includes cultural protocol compliance.',
 '3-4 days',
 true, true
),

-- Stage 3: Development Practices and Cultural Code Review
(3, 'development_practices', 'practical', 'Culturally-Aware Development Practices',
 'Development workflows, code review processes, and testing practices that incorporate cultural considerations.',
 ARRAY[
   'Apply culturally-aware coding practices',
   'Conduct code reviews with cultural protocol checks',
   'Implement comprehensive testing including cultural scenarios',
   'Use version control with cultural change documentation',
   'Follow deployment procedures with cultural impact assessment'
 ],
 ARRAY['Platform architecture understanding', 'Git/version control proficiency'],
 '{
   "development_guidelines": [
     "Culturally-Aware Coding Standards",
     "Code Review Checklist with Cultural Considerations",
     "Testing Strategies for Cultural Compliance"
   ],
   "tools_and_templates": [
     "Cultural impact assessment template",
     "Code review cultural checklist",
     "Testing scenarios for cultural protocols"
   ],
   "workflow_documentation": [
     "Git workflow with cultural change tracking",
     "Deployment process with community notification"
   ]
 }',
 '{
   "practical_assignments": [
     "Complete a feature implementation with full cultural consideration",
     "Conduct peer code review focusing on cultural aspects",
     "Write comprehensive tests including cultural edge cases",
     "Document cultural implications of a technical change"
   ],
   "collaborative_exercises": [
     "Pair programming with cultural protocol discussion",
     "Team code review session with cultural focus"
   ]
 }',
 'All development work must integrate cultural considerations from design through deployment.',
 '4-5 days',
 true, true
),

-- Stage 4: Community Interaction and Ongoing Learning
(4, 'community_interaction', 'cultural', 'Community Engagement and Continuous Cultural Learning',
 'Building relationships with community representatives and establishing ongoing cultural learning practices.',
 ARRAY[
   'Establish respectful communication with community representatives',
   'Understand community feedback processes',
   'Participate in cultural learning opportunities',
   'Contribute to cultural protocol documentation',
   'Mentor new developers in cultural awareness'
 ],
 ARRAY['Completion of all previous stages', 'Demonstrated cultural competency'],
 '{
   "community_resources": [
     "Community representative contact protocols",
     "Cultural learning resource library",
     "Community feedback and consultation processes"
   ],
   "ongoing_learning": [
     "Monthly cultural learning sessions",
     "Community-led workshops and presentations",
     "Cultural protocol update notifications"
   ]
 }',
 '{
   "community_engagement": [
     "Attend community presentation on cultural protocols",
     "Participate in community feedback session",
     "Contribute to cultural protocol documentation"
   ],
   "mentorship_preparation": [
     "Shadow experienced developer in community interaction",
     "Prepare to mentor new developers in cultural awareness"
   ]
 }',
 'Ongoing relationship with community is essential. Cultural learning is continuous, not a one-time training.',
 'Ongoing',
 false, true
);

-- Create assessment framework
CREATE TABLE IF NOT EXISTS documentation.cultural_assessments (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES users(id),
    assessment_type TEXT NOT NULL, -- 'initial', 'stage_completion', 'ongoing', 'annual'
    stage_name TEXT,
    questions JSONB,
    responses JSONB,
    score INTEGER,
    max_score INTEGER,
    pass_threshold INTEGER,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewer_id INTEGER,
    reviewer_notes TEXT,
    status TEXT DEFAULT 'pending' -- 'pending', 'passed', 'needs_improvement', 'failed'
);

-- Insert sample assessment questions
INSERT INTO documentation.cultural_assessments (
    developer_id, assessment_type, stage_name, questions, max_score, pass_threshold
) VALUES 
(NULL, 'template', 'cultural_foundation', 
 '{
   "questions": [
     {
       "id": 1,
       "type": "multiple_choice",
       "question": "What is the primary principle of indigenous data sovereignty?",
       "options": [
         "Data should be stored in indigenous communities",
         "Indigenous peoples have the right to control data about their communities",
         "All data should be open and accessible",
         "Data governance follows standard IT practices"
       ],
       "correct_answer": 1,
       "explanation": "Indigenous data sovereignty means indigenous peoples have the right to control the collection, ownership, and application of data about their communities."
     },
     {
       "id": 2,
       "type": "scenario",
       "question": "A researcher requests access to traditional knowledge data for academic publication. What steps should you take?",
       "evaluation_criteria": [
         "Identifies need for community consultation",
         "Recognizes cultural protocol requirements",
         "Understands consent and attribution needs",
         "Considers community benefit and reciprocity"
       ]
     },
     {
       "id": 3,
       "type": "code_review",
       "question": "Review this code snippet and identify cultural protocol considerations",
       "code_sample": "SELECT * FROM documents WHERE cultural_sensitivity = \'high\' AND user_id = $1",
       "evaluation_criteria": [
         "Identifies missing cultural permission checks",
         "Recognizes need for community affiliation verification",
         "Suggests audit logging requirements",
         "Considers cultural metadata completeness"
       ]
     }
   ]
 }',
 100, 80
);

-- Create mentorship tracking
CREATE TABLE IF NOT EXISTS documentation.mentorship_assignments (
    id SERIAL PRIMARY KEY,
    mentee_id INTEGER REFERENCES users(id),
    mentor_id INTEGER REFERENCES users(id),
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    focus_areas TEXT[],
    cultural_competency_level TEXT,
    meeting_schedule TEXT,
    progress_notes TEXT,
    status TEXT DEFAULT 'active' -- 'active', 'completed', 'paused'
);

-- Create onboarding progress tracking function
CREATE OR REPLACE FUNCTION documentation.get_developer_onboarding_progress(p_developer_id INTEGER)
RETURNS TABLE(
    stage_name TEXT,
    completion_status TEXT,
    cultural_training_completed BOOLEAN,
    assessment_score INTEGER,
    next_steps TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        do.onboarding_stage,
        do.completion_status,
        do.cultural_training_completed,
        do.cultural_assessment_score,
        CASE 
            WHEN do.completion_status = 'completed' THEN 'Move to next stage'
            WHEN do.completion_status = 'requires_review' THEN 'Schedule mentor review'
            WHEN do.completion_status = 'in_progress' THEN 'Continue current stage'
            ELSE 'Begin stage activities'
        END as next_steps
    FROM documentation.developer_onboarding do
    WHERE do.developer_id = p_developer_id
    ORDER BY 
        CASE do.onboarding_stage
            WHEN 'cultural_foundation' THEN 1
            WHEN 'platform_architecture' THEN 2
            WHEN 'development_practices' THEN 3
            WHEN 'community_interaction' THEN 4
            ELSE 5
        END;
END;
$$ LANGUAGE plpgsql;

-- Create onboarding documentation export
CREATE OR REPLACE FUNCTION documentation.export_onboarding_guide()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    curriculum_record RECORD;
BEGIN
    result := result || E'# Barkly Research Platform - Developer Onboarding Guide\n\n';
    result := result || E'## Welcome to Culturally-Aware Development\n\n';
    result := result || E'This onboarding program integrates cultural awareness with technical skills development.\n\n';
    result := result || E'## Onboarding Philosophy\n\n';
    result := result || E'- Cultural understanding precedes technical implementation\n';
    result := result || E'- Community relationships are as important as code quality\n';
    result := result || E'- Ongoing cultural learning is part of professional development\n';
    result := result || E'- Every technical decision has cultural implications\n\n';
    
    FOR curriculum_record IN 
        SELECT * FROM documentation.onboarding_curriculum ORDER BY stage_order
    LOOP
        result := result || E'## Stage ' || curriculum_record.stage_order || ': ' || curriculum_record.title || E'\n\n';
        result := result || E'**Type:** ' || curriculum_record.stage_type || E'\n';
        result := result || E'**Duration:** ' || curriculum_record.estimated_duration || E'\n';
        result := result || E'**Assessment Required:** ' || CASE WHEN curriculum_record.assessment_required THEN 'Yes' ELSE 'No' END || E'\n';
        result := result || E'**Mentor Guidance:** ' || CASE WHEN curriculum_record.mentor_guidance_required THEN 'Required' ELSE 'Optional' END || E'\n\n';
        
        result := result || E'**Description:** ' || curriculum_record.description || E'\n\n';
        result := result || E'**Cultural Importance:** ' || curriculum_record.cultural_importance || E'\n\n';
        
        result := result || E'**Learning Objectives:**\n';
        IF curriculum_record.learning_objectives IS NOT NULL THEN
            FOR i IN 1..array_length(curriculum_record.learning_objectives, 1) LOOP
                result := result || E'- ' || curriculum_record.learning_objectives[i] || E'\n';
            END LOOP;
        END IF;
        result := result || E'\n---\n\n';
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test developer onboarding system
SELECT 'Developer onboarding framework created successfully' as status;
SELECT COUNT(*) as curriculum_stages FROM documentation.onboarding_curriculum;

-- Generate sample onboarding guide
SELECT LEFT(documentation.export_onboarding_guide(), 1500) || '...' as sample_onboarding_guide;