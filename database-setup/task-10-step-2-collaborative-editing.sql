-- =====================================================
-- TASK 10 - STEP 2: Collaborative Editing and Commenting
-- Real-time Collaborative Features
-- =====================================================

-- Create document comments table for collaborative discussion
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Comment Context
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES research_collections(id) ON DELETE SET NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Comment Content
    comment_text TEXT NOT NULL,
    comment_type TEXT DEFAULT 'general'
        CHECK (comment_type IN ('general', 'question', 'suggestion', 'correction', 'cultural_note', 'methodology_note', 'approval_request')),
    
    -- Author Information
    author_id UUID NOT NULL, -- Would reference auth.users
    author_name TEXT NOT NULL, -- Cached for performance
    author_role TEXT, -- Role in the research context
    
    -- Position Information (for inline comments)
    text_selection_start INTEGER,
    text_selection_end INTEGER,
    selected_text TEXT,
    context_before TEXT, -- Text before selection for context
    context_after TEXT,  -- Text after selection for context
    
    -- Thread Information
    parent_comment_id UUID REFERENCES document_comments(id),
    thread_root_id UUID REFERENCES document_comments(id),
    reply_count INTEGER DEFAULT 0,
    
    -- Cultural Context
    cultural_sensitivity TEXT DEFAULT 'standard'
        CHECK (cultural_sensitivity IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
    requires_elder_review BOOLEAN DEFAULT false,
    elder_reviewed BOOLEAN DEFAULT false,
    elder_reviewed_by UUID,
    elder_reviewed_at TIMESTAMPTZ,
    cultural_protocols JSONB DEFAULT '{}',
    
    -- Status and Resolution
    status TEXT DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'dismissed', 'under_review')),
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Visibility and Permissions
    visibility TEXT DEFAULT 'project_team'
        CHECK (visibility IN ('private', 'project_team', 'community', 'public')),
    mentioned_users UUID[] DEFAULT '{}',
    
    -- Engagement
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (text_selection_start IS NULL OR text_selection_end IS NULL OR text_selection_start <= text_selection_end)
);

-- Create document edit sessions for collaborative editing
CREATE TABLE IF NOT EXISTS document_edit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session Context
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Editor Information
    editor_id UUID NOT NULL, -- User editing the document
    editor_name TEXT NOT NULL,
    session_token TEXT NOT NULL,
    
    -- Edit Context
    edit_type TEXT DEFAULT 'content'
        CHECK (edit_type IN ('content', 'metadata', 'tags', 'cultural_notes', 'analysis')),
    section_being_edited TEXT, -- Which section/field is being edited
    
    -- Lock Information
    is_locked BOOLEAN DEFAULT false,
    lock_acquired_at TIMESTAMPTZ,
    lock_expires_at TIMESTAMPTZ,
    
    -- Cultural Context
    editing_cultural_content BOOLEAN DEFAULT false,
    requires_elder_approval BOOLEAN DEFAULT false,
    cultural_sensitivity_level TEXT,
    
    -- Collaboration
    collaborative_session BOOLEAN DEFAULT true,
    allow_concurrent_edits BOOLEAN DEFAULT false,
    conflict_resolution_strategy TEXT DEFAULT 'last_write_wins'
        CHECK (conflict_resolution_strategy IN ('last_write_wins', 'merge', 'manual_resolution')),
    
    -- Status
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'idle', 'completed', 'abandoned', 'conflict')),
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, chunk_id, editor_id) -- One active session per user per document/chunk
);

-- Create document change log for tracking edits
CREATE TABLE IF NOT EXISTS document_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Change Context
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    edit_session_id UUID REFERENCES document_edit_sessions(id) ON DELETE SET NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Change Information
    change_type TEXT NOT NULL
        CHECK (change_type IN ('insert', 'delete', 'update', 'move', 'format', 'metadata_change')),
    field_changed TEXT, -- Which field was changed
    
    -- Change Details
    old_value TEXT,
    new_value TEXT,
    change_position INTEGER, -- Position in text where change occurred
    change_length INTEGER,   -- Length of the change
    
    -- Editor Information
    editor_id UUID NOT NULL,
    editor_name TEXT NOT NULL,
    editor_role TEXT,
    
    -- Cultural Context
    affects_cultural_content BOOLEAN DEFAULT false,
    cultural_sensitivity_change BOOLEAN DEFAULT false,
    requires_cultural_review BOOLEAN DEFAULT false,
    
    -- Change Metadata
    change_reason TEXT,
    change_description TEXT,
    automated_change BOOLEAN DEFAULT false, -- Was this an automated change?
    
    -- Conflict Resolution
    conflict_detected BOOLEAN DEFAULT false,
    conflict_resolved BOOLEAN DEFAULT false,
    conflict_resolution_method TEXT,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collaborative annotations table
CREATE TABLE IF NOT EXISTS collaborative_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Annotation Context
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Annotation Information
    annotation_type TEXT NOT NULL
        CHECK (annotation_type IN ('highlight', 'note', 'question', 'cultural_context', 'methodology_note', 'translation', 'correction')),
    annotation_text TEXT,
    annotation_color TEXT DEFAULT '#ffeb3b', -- Hex color for highlighting
    
    -- Position Information
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,
    selected_text TEXT NOT NULL,
    
    -- Author Information
    author_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT,
    
    -- Cultural Context
    cultural_annotation BOOLEAN DEFAULT false,
    traditional_knowledge_note BOOLEAN DEFAULT false,
    requires_elder_input BOOLEAN DEFAULT false,
    elder_validated BOOLEAN DEFAULT false,
    
    -- Collaboration
    shared_annotation BOOLEAN DEFAULT true,
    visible_to_roles TEXT[] DEFAULT '{}',
    
    -- Engagement
    helpful_votes INTEGER DEFAULT 0,
    
    -- System Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (start_position <= end_position),
    CHECK (length(selected_text) > 0)
);

-- =====================================================
-- COLLABORATIVE EDITING FUNCTIONS
-- =====================================================

-- Function to create a comment
CREATE OR REPLACE FUNCTION create_document_comment(
    p_document_id UUID,
    p_comment_text TEXT,
    p_author_id UUID,
    p_author_name TEXT,
    p_comment_type TEXT DEFAULT 'general',
    p_chunk_id UUID DEFAULT NULL,
    p_parent_comment_id UUID DEFAULT NULL,
    p_text_selection_start INTEGER DEFAULT NULL,
    p_text_selection_end INTEGER DEFAULT NULL,
    p_selected_text TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    comment_id UUID;
    doc_community_id UUID;
    cultural_level TEXT;
    requires_elder_review BOOLEAN := false;
    thread_root_id UUID;
BEGIN
    -- Get document community and cultural context
    SELECT community_id, cultural_sensitivity_level 
    INTO doc_community_id, cultural_level
    FROM documents WHERE id = p_document_id;
    
    -- Determine if elder review is required
    IF cultural_level IN ('sacred', 'ceremonial') OR p_comment_type = 'cultural_note' THEN
        requires_elder_review := true;
    END IF;
    
    -- Determine thread root
    IF p_parent_comment_id IS NOT NULL THEN
        SELECT COALESCE(thread_root_id, id) INTO thread_root_id 
        FROM document_comments WHERE id = p_parent_comment_id;
    END IF;
    
    INSERT INTO document_comments (
        document_id,
        chunk_id,
        community_id,
        comment_text,
        comment_type,
        author_id,
        author_name,
        parent_comment_id,
        thread_root_id,
        text_selection_start,
        text_selection_end,
        selected_text,
        cultural_sensitivity,
        requires_elder_review
    ) VALUES (
        p_document_id,
        p_chunk_id,
        doc_community_id,
        p_comment_text,
        p_comment_type,
        p_author_id,
        p_author_name,
        p_parent_comment_id,
        thread_root_id,
        p_text_selection_start,
        p_text_selection_end,
        p_selected_text,
        cultural_level,
        requires_elder_review
    ) RETURNING id INTO comment_id;
    
    -- Update reply count for parent comment
    IF p_parent_comment_id IS NOT NULL THEN
        UPDATE document_comments 
        SET reply_count = reply_count + 1 
        WHERE id = p_parent_comment_id;
    END IF;
    
    -- Create activity feed entry
    PERFORM create_activity_entry(
        'comment_add',
        p_author_name || ' added a comment: ' || left(p_comment_text, 100),
        p_author_id,
        p_author_name,
        'document',
        p_document_id,
        (SELECT title FROM documents WHERE id = p_document_id),
        doc_community_id,
        cultural_level,
        'project_team'
    );
    
    RETURN comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start an edit session
CREATE OR REPLACE FUNCTION start_edit_session(
    p_document_id UUID,
    p_editor_id UUID,
    p_editor_name TEXT,
    p_session_token TEXT,
    p_chunk_id UUID DEFAULT NULL,
    p_edit_type TEXT DEFAULT 'content'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    doc_community_id UUID;
    cultural_level TEXT;
    requires_approval BOOLEAN := false;
BEGIN
    -- Get document context
    SELECT community_id, cultural_sensitivity_level 
    INTO doc_community_id, cultural_level
    FROM documents WHERE id = p_document_id;
    
    -- Check if elder approval is required
    IF cultural_level IN ('sacred', 'ceremonial') THEN
        requires_approval := true;
    END IF;
    
    INSERT INTO document_edit_sessions (
        document_id,
        chunk_id,
        community_id,
        editor_id,
        editor_name,
        session_token,
        edit_type,
        editing_cultural_content,
        requires_elder_approval,
        cultural_sensitivity_level
    ) VALUES (
        p_document_id,
        p_chunk_id,
        doc_community_id,
        p_editor_id,
        p_editor_name,
        p_session_token,
        p_edit_type,
        cultural_level IS NOT NULL,
        requires_approval,
        cultural_level
    ) ON CONFLICT (document_id, chunk_id, editor_id) 
    DO UPDATE SET
        session_token = EXCLUDED.session_token,
        edit_type = EXCLUDED.edit_type,
        status = 'active',
        last_activity_at = NOW()
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log document changes
CREATE OR REPLACE FUNCTION log_document_change(
    p_document_id UUID,
    p_editor_id UUID,
    p_editor_name TEXT,
    p_change_type TEXT,
    p_field_changed TEXT,
    p_old_value TEXT,
    p_new_value TEXT,
    p_change_description TEXT DEFAULT NULL,
    p_chunk_id UUID DEFAULT NULL,
    p_edit_session_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    change_id UUID;
    doc_community_id UUID;
    cultural_level TEXT;
    affects_cultural BOOLEAN := false;
BEGIN
    -- Get document context
    SELECT community_id, cultural_sensitivity_level 
    INTO doc_community_id, cultural_level
    FROM documents WHERE id = p_document_id;
    
    -- Determine if this affects cultural content
    IF cultural_level IN ('sacred', 'ceremonial') OR 
       p_field_changed IN ('cultural_sensitivity_level', 'cultural_protocols', 'traditional_knowledge_category') THEN
        affects_cultural := true;
    END IF;
    
    INSERT INTO document_change_log (
        document_id,
        chunk_id,
        edit_session_id,
        community_id,
        change_type,
        field_changed,
        old_value,
        new_value,
        editor_id,
        editor_name,
        affects_cultural_content,
        change_description
    ) VALUES (
        p_document_id,
        p_chunk_id,
        p_edit_session_id,
        doc_community_id,
        p_change_type,
        p_field_changed,
        p_old_value,
        p_new_value,
        p_editor_id,
        p_editor_name,
        affects_cultural,
        p_change_description
    ) RETURNING id INTO change_id;
    
    RETURN change_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create collaborative annotation
CREATE OR REPLACE FUNCTION create_annotation(
    p_document_id UUID,
    p_annotation_type TEXT,
    p_annotation_text TEXT,
    p_start_position INTEGER,
    p_end_position INTEGER,
    p_selected_text TEXT,
    p_author_id UUID,
    p_author_name TEXT,
    p_chunk_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    annotation_id UUID;
    doc_community_id UUID;
    is_cultural BOOLEAN := false;
BEGIN
    -- Get document community
    SELECT community_id INTO doc_community_id FROM documents WHERE id = p_document_id;
    
    -- Determine if this is a cultural annotation
    IF p_annotation_type IN ('cultural_context', 'translation') THEN
        is_cultural := true;
    END IF;
    
    INSERT INTO collaborative_annotations (
        document_id,
        chunk_id,
        community_id,
        annotation_type,
        annotation_text,
        start_position,
        end_position,
        selected_text,
        author_id,
        author_name,
        cultural_annotation,
        traditional_knowledge_note
    ) VALUES (
        p_document_id,
        p_chunk_id,
        doc_community_id,
        p_annotation_type,
        p_annotation_text,
        p_start_position,
        p_end_position,
        p_selected_text,
        p_author_id,
        p_author_name,
        is_cultural,
        is_cultural
    ) RETURNING id INTO annotation_id;
    
    RETURN annotation_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Document comments indexes
CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_comments_author ON document_comments(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_comments_thread ON document_comments(thread_root_id, created_at ASC) WHERE thread_root_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_comments_cultural ON document_comments(cultural_sensitivity, requires_elder_review, elder_reviewed);
CREATE INDEX IF NOT EXISTS idx_document_comments_status ON document_comments(status, created_at DESC);

-- Edit sessions indexes
CREATE INDEX IF NOT EXISTS idx_edit_sessions_document ON document_edit_sessions(document_id, status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_editor ON document_edit_sessions(editor_id, status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_cultural ON document_edit_sessions(editing_cultural_content, requires_elder_approval);

-- Change log indexes
CREATE INDEX IF NOT EXISTS idx_change_log_document ON document_change_log(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_editor ON document_change_log(editor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_cultural ON document_change_log(affects_cultural_content, cultural_sensitivity_change, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_session ON document_change_log(edit_session_id, created_at DESC);

-- Annotations indexes
CREATE INDEX IF NOT EXISTS idx_annotations_document ON collaborative_annotations(document_id, annotation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annotations_author ON collaborative_annotations(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annotations_position ON collaborative_annotations(document_id, start_position, end_position);
CREATE INDEX IF NOT EXISTS idx_annotations_cultural ON collaborative_annotations(cultural_annotation, traditional_knowledge_note, elder_validated);

SELECT 'Collaborative editing and commenting system created successfully' as status;