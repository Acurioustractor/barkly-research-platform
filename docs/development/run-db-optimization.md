# Database Optimization Instructions

## Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xnifhejavwvbdkcakakn`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

## Step 2: Run the Optimization Script

Copy and paste the contents of `database-optimization.sql` into the SQL editor and click "Run".

The script will:
- ✅ Enable required extensions (vector, pg_trgm, btree_gin)
- ✅ Create performance indexes
- ✅ Set up materialized views for analytics
- ✅ Create semantic search functions
- ✅ Add cleanup and monitoring functions

## Step 3: Verify Installation

Run this query to check if everything was installed correctly:

```sql
-- Check extensions
SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'btree_gin');

-- Check materialized view
SELECT * FROM document_metrics;

-- Check functions
SELECT proname FROM pg_proc WHERE proname IN ('refresh_document_metrics', 'cleanup_failed_documents', 'search_similar_chunks');

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename IN ('documents', 'document_chunks', 'document_themes', 'document_quotes');
```

## Step 4: Test the System

After running the optimization, test the upload system:

1. Go to `/admin` in your application
2. Upload a test PDF document
3. Check that it processes successfully
4. Verify the metrics are updated

## Maintenance Commands

Run these periodically to maintain performance:

```sql
-- Refresh analytics (run daily)
SELECT refresh_document_metrics();

-- Cleanup old failed documents (run weekly)
SELECT cleanup_failed_documents(7);

-- Check processing performance
SELECT * FROM processing_performance;
```

## Troubleshooting

If you encounter errors:

1. **Extension errors**: Make sure you have the necessary permissions
2. **Index errors**: Some indexes may already exist - this is normal
3. **Function errors**: Check that the syntax is correct for your PostgreSQL version

The optimization is designed to be safe and idempotent - you can run it multiple times without issues.