-- Create community_research_projects table (simplified version)
CREATE TABLE IF NOT EXISTS community_research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    community_id UUID NOT NULL,
    created_by UUID NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'community_research_projects table created' as status;