-- =====================================================
-- TASK 9 - STEP 3: Test Research Collections System
-- Comprehensive Testing of Research Project Management
-- =====================================================

-- Test creating a research project
SELECT 'Testing research project creation...' as test_phase;

SELECT create_research_project(
    'Traditional Ecological Knowledge Documentation',
    'A comprehensive study documenting traditional ecological knowledge practices within the community, focusing on sustainable resource management and environmental stewardship.',
    'traditional_knowledge',
    (SELECT id FROM communities WHERE slug = 'test-community'),
    gen_random_uuid(),
    'sacred',
    true, -- requires_elder_oversight
    true, -- traditional_knowledge_involved
    'Participatory action research with community elders and knowledge holders',
    CURRENT_DATE
) as project_id;

-- Test creating research collections
SELECT 'Testing research collection creation...' as test_phase;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT create_research_collection(
    'Elder Interviews',
    'Collection of recorded interviews with community elders sharing traditional ecological knowledge',
    'interviews',
    (SELECT id FROM test_project),
    gen_random_uuid(),
    'sacred',
    'data_collection',
    'project_team'
) as collection_id_1;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT create_research_collection(
    'Field Observations',
    'Documentation of traditional practices observed in the field',
    'field_notes',
    (SELECT id FROM test_project),
    gen_random_uuid(),
    'sensitive',
    'data_collection',
    'community'
) as collection_id_2;

-- Test adding documents to collections
SELECT 'Testing document addition to collections...' as test_phase;

WITH test_collection AS (
    SELECT id FROM research_collections WHERE collection_name = 'Elder Interviews'
),
test_document AS (
    SELECT id FROM documents WHERE filename = 'test-document.pdf'
)
SELECT add_document_to_research_collection(
    (SELECT id FROM test_collection),
    (SELECT id FROM test_document),
    gen_random_uuid(),
    'primary_source',
    'critical',
    'Contains foundational knowledge from Elder Mary about traditional plant medicine',
    'Key themes: medicinal plants, preparation methods, cultural protocols'
) as collection_item_id;

-- Test adding collaborators
SELECT 'Testing collaborator addition...' as test_phase;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT add_research_collaborator(
    (SELECT id FROM test_project),
    gen_random_uuid(),
    'elder_advisor',
    'Traditional Knowledge Keeper',
    true, -- elder_status
    true, -- can_add_documents
    false, -- can_edit_collections
    false  -- can_manage_collaborators
) as collaborator_id_1;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT add_research_collaborator(
    (SELECT id FROM test_project),
    gen_random_uuid(),
    'community_liaison',
    'Cultural Consultant',
    false, -- elder_status
    true,  -- can_add_documents
    true,  -- can_edit_collections
    false  -- can_manage_collaborators
) as collaborator_id_2;

-- Test creating milestones
SELECT 'Testing milestone creation...' as test_phase;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT create_research_milestone(
    (SELECT id FROM test_project),
    'Complete Elder Interviews',
    'Conduct and transcribe all planned interviews with community elders',
    'data_collection',
    CURRENT_DATE + INTERVAL '30 days',
    gen_random_uuid(),
    true, -- requires_elder_approval
    '{}'::UUID[]
) as milestone_id_1;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT create_research_milestone(
    (SELECT id FROM test_project),
    'Cultural Review and Validation',
    'Review all collected materials with elders for cultural appropriateness and accuracy',
    'review',
    CURRENT_DATE + INTERVAL '60 days',
    gen_random_uuid(),
    true, -- requires_elder_approval
    ARRAY[(SELECT id FROM research_milestones WHERE milestone_name = 'Complete Elder Interviews')]
) as milestone_id_2;

-- Test milestone progress update
SELECT 'Testing milestone progress update...' as test_phase;

SELECT update_milestone_progress(
    (SELECT id FROM research_milestones WHERE milestone_name = 'Complete Elder Interviews'),
    25,
    'Completed 3 out of 12 planned interviews. Excellent participation and rich data collected.'
) as progress_updated;

-- Test project overview
SELECT 'Testing project overview retrieval...' as test_phase;

WITH test_project AS (
    SELECT id FROM research_projects WHERE project_name = 'Traditional Ecological Knowledge Documentation'
)
SELECT get_research_project_overview((SELECT id FROM test_project)) as project_overview;

-- Test collection details
SELECT 'Testing collection details retrieval...' as test_phase;

WITH test_collection AS (
    SELECT id FROM research_collections WHERE collection_name = 'Elder Interviews'
)
SELECT get_research_collection_details((SELECT id FROM test_collection)) as collection_details;

-- Verify research projects
SELECT 'Verifying research projects...' as test_phase;

SELECT 
    project_name,
    project_type,
    status,
    cultural_significance,
    requires_elder_oversight,
    traditional_knowledge_involved,
    start_date,
    created_at
FROM research_projects
ORDER BY created_at DESC;

-- Verify research collections
SELECT 'Verifying research collections...' as test_phase;

SELECT 
    rc.collection_name,
    rc.collection_type,
    rc.research_phase,
    rc.cultural_significance,
    rc.access_level,
    rc.requires_elder_approval,
    rp.project_name,
    (SELECT count(*) FROM collection_documents cd WHERE cd.collection_id = rc.id) as document_count
FROM research_collections rc
JOIN research_projects rp ON rp.id = rc.research_project_id
ORDER BY rc.created_at DESC;

-- Verify collection documents
SELECT 'Verifying collection documents...' as test_phase;

SELECT 
    rc.collection_name,
    d.title,
    cd.methodology_role,
    cd.document_significance,
    cd.research_relevance,
    cd.requires_cultural_review,
    cd.added_at
FROM collection_documents cd
JOIN research_collections rc ON rc.id = cd.collection_id
JOIN documents d ON d.id = cd.document_id
ORDER BY cd.added_at DESC;

-- Verify collaborations
SELECT 'Verifying research collaborations...' as test_phase;

SELECT 
    rp.project_name,
    rcol.role,
    rcol.cultural_role,
    rcol.elder_status,
    rcol.can_add_documents,
    rcol.can_edit_collections,
    rcol.can_approve_cultural_content,
    rcol.status
FROM research_collaborations rcol
JOIN research_projects rp ON rp.id = rcol.research_project_id
ORDER BY rcol.created_at DESC;

-- Verify milestones
SELECT 'Verifying research milestones...' as test_phase;

SELECT 
    rp.project_name,
    rm.milestone_name,
    rm.milestone_type,
    rm.target_date,
    rm.status,
    rm.completion_percentage,
    rm.requires_elder_approval,
    rm.status_notes
FROM research_milestones rm
JOIN research_projects rp ON rp.id = rm.research_project_id
ORDER BY rm.target_date;

-- Test cultural sensitivity and access controls
SELECT 'Testing cultural sensitivity controls...' as test_phase;

SELECT 
    'Sacred Collections' as category,
    count(*) as count
FROM research_collections 
WHERE cultural_significance = 'sacred'

UNION ALL

SELECT 
    'Collections Requiring Elder Approval' as category,
    count(*) as count
FROM research_collections 
WHERE requires_elder_approval = true

UNION ALL

SELECT 
    'Elder Collaborators' as category,
    count(*) as count
FROM research_collaborations 
WHERE elder_status = true

UNION ALL

SELECT 
    'Milestones Requiring Elder Approval' as category,
    count(*) as count
FROM research_milestones 
WHERE requires_elder_approval = true;

-- Final system summary
SELECT 'RESEARCH COLLECTIONS SYSTEM SUMMARY' as summary,
    (SELECT count(*) FROM research_projects) as total_projects,
    (SELECT count(*) FROM research_collections) as total_collections,
    (SELECT count(*) FROM collection_documents) as total_collection_documents,
    (SELECT count(*) FROM research_collaborations) as total_collaborations,
    (SELECT count(*) FROM research_milestones) as total_milestones,
    (SELECT count(*) FROM research_projects WHERE cultural_significance IN ('sacred', 'ceremonial')) as sacred_projects,
    (SELECT count(*) FROM research_collections WHERE requires_elder_approval = true) as collections_needing_approval,
    (SELECT count(*) FROM research_collaborations WHERE elder_status = true) as elder_collaborators;

SELECT 'Research collections system testing completed successfully!' as status;