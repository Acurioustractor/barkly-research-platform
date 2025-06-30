# Vector Search Setup Guide

This guide explains how to set up vector search capabilities for the Barkly Research Platform.

## Prerequisites

1. PostgreSQL database with pgvector extension support
2. OpenAI API key for generating embeddings

## Database Setup

### 1. Enable pgvector Extension

If using Supabase or a managed PostgreSQL service, pgvector may already be available. Enable it with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Update Embedding Column

The current schema stores embeddings as JSON. For better performance, convert to vector type:

```sql
-- Add a proper vector column
ALTER TABLE "document_chunks" 
ADD COLUMN embedding_vector vector(1536);

-- Migrate existing JSON embeddings to vector type (if any exist)
UPDATE "document_chunks" 
SET embedding_vector = embedding::vector(1536)
WHERE embedding IS NOT NULL;

-- Create an index for fast similarity search
CREATE INDEX document_chunks_embedding_idx ON "document_chunks" 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);
```

For the large embedding model (3072 dimensions):
```sql
ALTER TABLE "document_chunks" 
ADD COLUMN embedding_vector vector(3072);
```

### 3. Update Prisma Schema (Optional)

If you want type safety, you can use a custom Prisma type:

```prisma
model DocumentChunk {
  // ... existing fields ...
  embedding  Json?    // Keep for backward compatibility
  embeddingVector Unsupported("vector(1536)")?
}
```

## Environment Variables

Add these to your `.env.local` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # or text-embedding-3-large
```

## Usage

### 1. Generate Embeddings During Document Processing

When uploading documents, set `generateEmbeddings=true`:

```bash
curl -X POST http://localhost:3000/api/documents/bulk-upload \
  -F "files=@document.pdf" \
  -F "generateEmbeddings=true" \
  -F "useAI=true"
```

### 2. Semantic Search API

Use the semantic search endpoint:

```bash
curl -X POST http://localhost:3000/api/documents/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "youth leadership programs in urban communities",
    "limit": 10,
    "threshold": 0.7
  }'
```

### 3. Find Similar Documents

```bash
curl -X GET http://localhost:3000/api/documents/{documentId}/similar
```

## Performance Considerations

1. **Batch Processing**: Process embeddings in batches of 10-20 to avoid rate limits
2. **Indexing**: Use IVFFlat index for datasets > 1M vectors, HNSW for smaller datasets
3. **Model Selection**: 
   - `text-embedding-3-small`: Faster, cheaper, 1536 dimensions
   - `text-embedding-3-large`: More accurate, 3072 dimensions

## Cost Estimation

- text-embedding-3-small: $0.02 per 1M tokens
- text-embedding-3-large: $0.13 per 1M tokens

For a typical 50-page document (~25,000 words):
- Small model: ~$0.001 per document
- Large model: ~$0.007 per document

## Troubleshooting

### pgvector not available
Contact your database provider to enable the pgvector extension.

### Out of memory errors
Reduce batch size or use streaming for large documents.

### Slow similarity search
1. Ensure you have created the appropriate index
2. Consider using approximate search (IVFFlat) for large datasets
3. Reduce the search threshold to return fewer results