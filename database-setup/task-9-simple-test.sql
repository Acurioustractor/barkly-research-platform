-- Simple test of research collections infrastructure
-- Test direct table insertions to verify structure

-- Insert a test research project
INSERT INTO research_projects (
    project_name,
    project_slug,
    project_description,
    project_type,
    community_id,
    lead_researcher_id,
    cultural_significance,
    requires_elder_oversight,
    traditional_knowledge_involved,
    status
) VALUES (
    'Test Research Project',
    'test-research-project',
    'A test project for validating the research collections system',
    'traditional_knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    gen_random_uuid(),
    'sacred',
    true,
    true,
    'planning'
);

-- Insert a test research collection
INSERT INTO research_collections (
    collection_name,
    collection_slug,
    collection_description,
    collection_type,
    research_project_id,
    community_id,
    created_by,
    cultural_significance,
    requires_elder_approval,
    research_phase
) VALUES (
    'Test Collection',
    'test-collection',
    'A test collection for validating the system',
    'interviews',
    (SELECT id FROM research_projects WHERE project_slug = 'test-research-project'),
    (SELECT id FROM communities WHERE slug = 'test-community'),
    gen_random_uuid(),
    'sacred',
    true,
    'data_collection'
);

-- Add a document to the collection
INSERT INTO collection_documents (
    collection_id,
    document_id,
    added_by,
    methodology_role,
    document_significance,
    research_relevance
) VALUES (
    (SELECT id FROM research_collections WHERE collection_slug = 'test-collection'),
    (SELECT id FROM documents WHERE filename = 'test-document.pdf'),
    gen_random_uuid(),
    'primary_source',
    'critical',
    'Contains key traditional knowledge for the research'
);

-- Add a collaborator
INSERT INTO research_collaborations (
    research_project_id,
    collaborator_id,
    role,
    cultural_role,
    elder_status,
    can_add_documents,
    can_approve_cultural_content,
    status
) VALUES (
    (SELECT id FROM research_projects WHERE project_slug = 'test-research-project'),
    gen_random_uuid(),
    'elder_advisor',
    'Traditional Knowledge Keeper',
    true,
    true,
    true,
    'active'
);

-- Add a milestone
INSERT INTO research_milestones (
    research_project_id,
    milestone_name,
    milestone_description,
    milestone_type,
    target_date,
    requires_elder_approval
) VALUES (
    (SELECT id FROM research_projects WHERE project_slug = 'test-research-project'),
    'Complete Data Collection',
    'Finish collecting all primary source materials',
    'data_collection',
    CURRENT_DATE + INTERVAL '30 days',
    true
);

-- Verify the data
SELECT 'Research Projects:' as section;
SELECT project_name, project_type, status, cultural_significance, requires_elder_oversight
FROM research_projects;

SELECT 'Research Collections:' as section;
SELECT collection_name, collection_type, cultural_significance, requires_elder_approval
FROM research_collections;

SELECT 'Collection Documents:' as section;
SELECT 
    rc.collection_name,
    d.filename,
    cd.methodology_role,
    cd.document_significance
FROM collection_documents cd
JOIN research_collections rc ON rc.id = cd.collection_id
JOIN documents d ON d.id = cd.document_id;

SELECT 'Research Collaborations:' as section;
SELECT role, cultural_role, elder_status, can_approve_cultural_content, status
FROM research_collaborations;

SELECT 'Research Milestones:' as section;
SELECT milestone_name, milestone_type, target_date, requires_elder_approval, status
FROM research_milestones;

SELECT 'Research collections infrastructure verified successfully!' as status;