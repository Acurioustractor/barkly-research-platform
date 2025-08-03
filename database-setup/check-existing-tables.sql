-- Check what tables currently exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if specific required tables exist
SELECT 
    'communities' as table_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'communities') as exists
UNION ALL
SELECT 
    'community_research_projects',
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_research_projects')
UNION ALL
SELECT 
    'documents',
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents');