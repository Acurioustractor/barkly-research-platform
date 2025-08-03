-- =====================================================
-- TASK 9 - STEP 2: Collection Management Functions
-- Functions for Research Project and Collection Management
-- =====================================================

-- Function to create a new research project
CREATE OR REPLACE FUNCTION create_research_project(
    p_project_name TEXT,
    p_project_description TEXT,
    p_project_type TEXT DEFAULT 'general',
    p_community_id UUID,
    p_lead_researcher_id UUID,
    p_cultural_significance TEXT DEFAULT 'standard',
    p_requires_elder_oversight BOOLEAN DEFAULT false,
    p_traditional_knowledge_involved BOOLEAN DEFAULT false,
    p_research_methodology TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    project_id UUID;
    project_slug TEXT;
BEGIN
    -- Generate project slug
    project_slug := lower(replace(regexp_replace(p_project_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    
    -- Ensure unique slug within community
    WHILE EXISTS (SELECT 1 FROM research_projects WHERE community_id = p_community_id AND project_slug = project_slug) LOOP
        project_slug := project_slug || '-' || extract(epoch from now())::text;
    END LOOP;
    
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
        research_methodology,
        start_date,
        status
    ) VALUES (
        p_project_name,
        project_slug,
        p_project_description,
        p_project_type,
        p_community_id,
        p_lead_researcher_id,
        p_cultural_significance,
        p_requires_elder_oversight,
        p_traditional_knowledge_involved,
        p_research_methodology,
        COALESCE(p_start_date, CURRENT_DATE),
        'planning'
    ) RETURNING id INTO project_id;
    
    -- Add lead researcher as collaborator
    INSERT INTO research_collaborations (
        research_project_id,
        collaborator_id,
        role,
        can_add_documents,
        can_edit_collections,
        can_manage_collaborators,
        can_publish_results,
        status,
        joined_at,
        collaboration_agreement_signed
    ) VALUES (
        project_id,
        p_lead_researcher_id,
        'lead_researcher',
        true,
        true,
        true,
        true,
        'active',
        NOW(),
        true
    );
    
    RETURN project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a research collection
CREATE OR REPLACE FUNCTION create_research_collection(
    p_collection_name TEXT,
    p_collection_description TEXT,
    p_collection_type TEXT DEFAULT 'general',
    p_research_project_id UUID,
    p_created_by UUID,
    p_cultural_significance TEXT DEFAULT 'standard',
    p_research_phase TEXT DEFAULT 'data_collection',
    p_access_level TEXT DEFAULT 'project_team'
)
RETURNS UUID AS $$
DECLARE
    collection_id UUID;
    collection_slug TEXT;
    project_community_id UUID;
    requires_elder_approval BOOLEAN := false;
BEGIN
    -- Get project community
    SELECT community_id INTO project_community_id 
    FROM research_projects 
    WHERE id = p_research_project_id;
    
    IF project_community_id IS NULL THEN
        RAISE EXCEPTION 'Research project not found: %', p_research_project_id;
    END IF;
    
    -- Generate collection slug
    collection_slug := lower(replace(regexp_replace(p_collection_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    
    -- Ensure unique slug within project
    WHILE EXISTS (SELECT 1 FROM research_collections WHERE research_project_id = p_research_project_id AND collection_slug = collection_slug) LOOP
        collection_slug := collection_slug || '-' || extract(epoch from now())::text;
    END LOOP;
    
    -- Determine if elder approval is required
    IF p_cultural_significance IN ('sacred', 'ceremonial') THEN
        requires_elder_approval := true;
    END IF;
    
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
        research_phase,
        access_level
    ) VALUES (
        p_collection_name,
        collection_slug,
        p_collection_description,
        p_collection_type,
        p_research_project_id,
        project_community_id,
        p_created_by,
        p_cultural_significance,
        requires_elder_approval,
        p_research_phase,
        p_access_level
    ) RETURNING id INTO collection_id;
    
    RETURN collection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add document to research collection
CREATE OR REPLACE FUNCTION add_document_to_research_collection(
    p_collection_id UUID,
    p_document_id UUID,
    p_added_by UUID,
    p_methodology_role TEXT DEFAULT 'primary_source',
    p_document_significance TEXT DEFAULT 'supporting',
    p_research_relevance TEXT DEFAULT NULL,
    p_analysis_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    item_id UUID;
    doc_community_id UUID;
    collection_community_id UUID;
    requires_cultural_review BOOLEAN := false;
    doc_cultural_level TEXT;
BEGIN
    -- Verify document and collection belong to same community
    SELECT community_id INTO doc_community_id FROM documents WHERE id = p_document_id;
    SELECT community_id INTO collection_community_id FROM research_collections WHERE id = p_collection_id;
    
    IF doc_community_id IS NULL THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
    END IF;
    
    IF collection_community_id IS NULL THEN
        RAISE EXCEPTION 'Research collection not found: %', p_collection_id;
    END IF;
    
    IF doc_community_id != collection_community_id THEN
        RAISE EXCEPTION 'Document and collection must belong to the same community';
    END IF;
    
    -- Check if cultural review is required
    SELECT cultural_sensitivity_level INTO doc_cultural_level FROM documents WHERE id = p_document_id;
    IF doc_cultural_level IN ('sacred', 'ceremonial') THEN
        requires_cultural_review := true;
    END IF;
    
    INSERT INTO collection_documents (
        collection_id,
        document_id,
        added_by,
        methodology_role,
        document_significance,
        research_relevance,
        analysis_notes,
        requires_cultural_review
    ) VALUES (
        p_collection_id,
        p_document_id,
        p_added_by,
        p_methodology_role,
        p_document_significance,
        p_research_relevance,
        p_analysis_notes,
        requires_cultural_review
    ) RETURNING id INTO item_id;
    
    RETURN item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add collaborator to research project
CREATE OR REPLACE FUNCTION add_research_collaborator(
    p_research_project_id UUID,
    p_collaborator_id UUID,
    p_role TEXT,
    p_cultural_role TEXT DEFAULT NULL,
    p_elder_status BOOLEAN DEFAULT false,
    p_can_add_documents BOOLEAN DEFAULT false,
    p_can_edit_collections BOOLEAN DEFAULT false,
    p_can_manage_collaborators BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    collaboration_id UUID;
    can_approve_cultural BOOLEAN := false;
BEGIN
    -- Set cultural approval permissions for elders
    IF p_elder_status = true OR p_role = 'elder_advisor' THEN
        can_approve_cultural := true;
    END IF;
    
    INSERT INTO research_collaborations (
        research_project_id,
        collaborator_id,
        role,
        cultural_role,
        elder_status,
        can_add_documents,
        can_edit_collections,
        can_manage_collaborators,
        can_approve_cultural_content,
        status,
        invited_at
    ) VALUES (
        p_research_project_id,
        p_collaborator_id,
        p_role,
        p_cultural_role,
        p_elder_status,
        p_can_add_documents,
        p_can_edit_collections,
        p_can_manage_collaborators,
        can_approve_cultural,
        'invited',
        NOW()
    ) RETURNING id INTO collaboration_id;
    
    RETURN collaboration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create research milestone
CREATE OR REPLACE FUNCTION create_research_milestone(
    p_research_project_id UUID,
    p_milestone_name TEXT,
    p_milestone_description TEXT,
    p_milestone_type TEXT DEFAULT 'deliverable',
    p_target_date DATE,
    p_assigned_to UUID DEFAULT NULL,
    p_requires_elder_approval BOOLEAN DEFAULT false,
    p_depends_on_milestones UUID[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    milestone_id UUID;
BEGIN
    INSERT INTO research_milestones (
        research_project_id,
        milestone_name,
        milestone_description,
        milestone_type,
        target_date,
        assigned_to,
        requires_elder_approval,
        depends_on_milestones
    ) VALUES (
        p_research_project_id,
        p_milestone_name,
        p_milestone_description,
        p_milestone_type,
        p_target_date,
        p_assigned_to,
        p_requires_elder_approval,
        p_depends_on_milestones
    ) RETURNING id INTO milestone_id;
    
    RETURN milestone_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get research project overview
CREATE OR REPLACE FUNCTION get_research_project_overview(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
    project_data JSONB;
    collections_data JSONB;
    collaborators_data JSONB;
    milestones_data JSONB;
BEGIN
    -- Get project basic information
    SELECT jsonb_build_object(
        'id', rp.id,
        'project_name', rp.project_name,
        'project_description', rp.project_description,
        'project_type', rp.project_type,
        'status', rp.status,
        'cultural_significance', rp.cultural_significance,
        'requires_elder_oversight', rp.requires_elder_oversight,
        'traditional_knowledge_involved', rp.traditional_knowledge_involved,
        'start_date', rp.start_date,
        'target_completion_date', rp.target_completion_date,
        'created_at', rp.created_at
    ) INTO project_data
    FROM research_projects rp
    WHERE rp.id = p_project_id;
    
    -- Get collections summary
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', rc.id,
            'collection_name', rc.collection_name,
            'collection_type', rc.collection_type,
            'research_phase', rc.research_phase,
            'cultural_significance', rc.cultural_significance,
            'document_count', (
                SELECT count(*) FROM collection_documents cd WHERE cd.collection_id = rc.id
            ),
            'created_at', rc.created_at
        )
    ) INTO collections_data
    FROM research_collections rc
    WHERE rc.research_project_id = p_project_id;
    
    -- Get collaborators summary
    SELECT jsonb_agg(
        jsonb_build_object(
            'collaborator_id', rcol.collaborator_id,
            'role', rcol.role,
            'cultural_role', rcol.cultural_role,
            'elder_status', rcol.elder_status,
            'status', rcol.status,
            'joined_at', rcol.joined_at
        )
    ) INTO collaborators_data
    FROM research_collaborations rcol
    WHERE rcol.research_project_id = p_project_id;
    
    -- Get milestones summary
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', rm.id,
            'milestone_name', rm.milestone_name,
            'milestone_type', rm.milestone_type,
            'target_date', rm.target_date,
            'status', rm.status,
            'completion_percentage', rm.completion_percentage,
            'is_completed', rm.is_completed
        )
    ) INTO milestones_data
    FROM research_milestones rm
    WHERE rm.research_project_id = p_project_id
    ORDER BY rm.target_date;
    
    -- Combine all data
    RETURN project_data || jsonb_build_object(
        'collections', COALESCE(collections_data, '[]'::jsonb),
        'collaborators', COALESCE(collaborators_data, '[]'::jsonb),
        'milestones', COALESCE(milestones_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get collection with documents
CREATE OR REPLACE FUNCTION get_research_collection_details(p_collection_id UUID)
RETURNS JSONB AS $$
DECLARE
    collection_data JSONB;
    documents_data JSONB;
BEGIN
    -- Get collection information
    SELECT jsonb_build_object(
        'id', rc.id,
        'collection_name', rc.collection_name,
        'collection_description', rc.collection_description,
        'collection_type', rc.collection_type,
        'research_phase', rc.research_phase,
        'cultural_significance', rc.cultural_significance,
        'access_level', rc.access_level,
        'requires_elder_approval', rc.requires_elder_approval,
        'elder_approved', rc.elder_approved,
        'peer_reviewed', rc.peer_reviewed,
        'quality_score', rc.quality_score,
        'created_at', rc.created_at
    ) INTO collection_data
    FROM research_collections rc
    WHERE rc.id = p_collection_id;
    
    -- Get documents in collection
    SELECT jsonb_agg(
        jsonb_build_object(
            'document_id', d.id,
            'title', d.title,
            'filename', d.filename,
            'cultural_sensitivity_level', d.cultural_sensitivity_level,
            'methodology_role', cd.methodology_role,
            'document_significance', cd.document_significance,
            'research_relevance', cd.research_relevance,
            'analysis_notes', cd.analysis_notes,
            'coding_tags', cd.coding_tags,
            'sort_order', cd.sort_order,
            'added_at', cd.added_at,
            'peer_validated', cd.peer_validated
        ) ORDER BY cd.sort_order, cd.added_at
    ) INTO documents_data
    FROM collection_documents cd
    JOIN documents d ON d.id = cd.document_id
    WHERE cd.collection_id = p_collection_id;
    
    -- Combine data
    RETURN collection_data || jsonb_build_object(
        'documents', COALESCE(documents_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update milestone progress
CREATE OR REPLACE FUNCTION update_milestone_progress(
    p_milestone_id UUID,
    p_completion_percentage INTEGER,
    p_status_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    new_status TEXT;
BEGIN
    -- Determine status based on completion percentage
    CASE 
        WHEN p_completion_percentage = 0 THEN new_status := 'not_started';
        WHEN p_completion_percentage > 0 AND p_completion_percentage < 100 THEN new_status := 'in_progress';
        WHEN p_completion_percentage = 100 THEN new_status := 'completed';
        ELSE new_status := 'in_progress';
    END CASE;
    
    UPDATE research_milestones 
    SET completion_percentage = p_completion_percentage,
        status = new_status,
        status_notes = COALESCE(p_status_notes, status_notes),
        is_completed = (p_completion_percentage = 100),
        actual_completion_date = CASE WHEN p_completion_percentage = 100 THEN CURRENT_DATE ELSE actual_completion_date END,
        updated_at = NOW()
    WHERE id = p_milestone_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

SELECT 'Research collection management functions created successfully' as status;