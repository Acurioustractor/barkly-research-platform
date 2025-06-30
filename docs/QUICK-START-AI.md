# AI Features Quick Start Guide

Get started with AI-powered document processing in 5 minutes.

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database (local or cloud)
3. OpenAI API key

## Step 1: Environment Setup

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/barkly"

# OpenAI
OPENAI_API_KEY="sk-..."
AI_DEFAULT_MODEL="gpt-4-turbo"
AI_DEFAULT_PROFILE="standard-analysis"

# Optional: Redis for background jobs
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Database Setup

```bash
# Push schema to database
npm run db:push

# (Optional) Enable pgvector for semantic search
psql -d barkly -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Step 4: Test AI Setup

```bash
# Run the test script
npx tsx scripts/test-ai-setup.ts
```

Expected output:
```
✅ OpenAI API key found
✅ AI configuration is valid
✅ Document analysis working
✅ Embeddings working (dimension: 1536)
✅ Cost estimation working ($0.351 for 25k words)
```

## Step 5: Start the Application

```bash
# Terminal 1: Start the app
npm run dev

# Terminal 2 (Optional): Start background worker
npm run worker
```

## Step 6: Upload Your First Document

### Option A: Web Interface

1. Open http://localhost:3000/admin
2. Click on "Bulk Upload" tab
3. Drag and drop PDF files
4. Select options:
   - ✅ Use AI Analysis
   - ✅ Generate Summary
   - ✅ Generate Embeddings
5. Click "Upload"

### Option B: API

```bash
curl -X POST http://localhost:3000/api/documents/bulk-upload \
  -F "files=@document.pdf" \
  -F "useAI=true" \
  -F "generateSummary=true" \
  -F "generateEmbeddings=true"
```

## Step 7: Use AI Features

### Semantic Search

```bash
curl -X POST http://localhost:3000/api/documents/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "youth leadership programs",
    "limit": 10
  }'
```

### Find Similar Documents

```bash
curl http://localhost:3000/api/documents/{documentId}/similar
```

### Check AI Configuration

```bash
curl http://localhost:3000/api/ai/config?includeModels=true
```

## Processing Profiles

### Quick Analysis (Fast & Cheap)
- Model: GPT-3.5 Turbo
- Cost: ~$0.05 per 50-page document
- Use for: Initial screening, high volume

### Standard Analysis (Balanced)
- Model: GPT-4 Turbo
- Cost: ~$0.35 per 50-page document
- Use for: Most documents

### Deep Analysis (Comprehensive)
- Model: GPT-4
- Cost: ~$0.70 per 50-page document
- Use for: Critical documents

## Monitoring Costs

View estimated costs before processing:

```bash
curl -X POST http://localhost:3000/api/ai/config \
  -H "Content-Type: application/json" \
  -d '{
    "action": "estimateCost",
    "data": {
      "documentWords": 10000,
      "profile": "standard-analysis"
    }
  }'
```

## Troubleshooting

### "AI service not configured"
- Check that OPENAI_API_KEY is set in .env.local
- Restart the development server

### High costs
- Use "quick-analysis" profile for initial processing
- Disable embeddings if not needed for search
- Process documents in batches during off-peak hours

### Slow processing
- Enable background jobs with Redis
- Use async upload endpoint for large files
- Consider upgrading to a faster model

## Next Steps

1. **Optimize Costs**: Review [AI Configuration Guide](./ai-configuration.md)
2. **Scale Up**: Set up [Background Jobs](./background-jobs.md)
3. **Enable Search**: Configure [Vector Search](./vector-search-setup.md)
4. **Production**: Deploy with proper API key management

## Support

- Check logs: Look for errors in console output
- Test endpoint: GET /api/test/ai
- Configuration: GET /api/ai/config
- Documentation: /docs folder

## Example Results

After processing a document with AI, you'll get:

```json
{
  "documentId": "doc_123",
  "status": "COMPLETED",
  "chunks": 25,
  "themes": 8,
  "quotes": 15,
  "insights": 12,
  "keywords": 30,
  "summary": "This document explores youth leadership..."
}
```

Ready to process your documents with AI! 🚀