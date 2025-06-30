# Background Job Processing

This guide explains how to set up and use background job processing for handling large documents.

## Overview

The background job system allows processing of large documents (up to 50MB) without hitting API timeout limits. Documents are queued in Redis and processed by separate worker processes.

## Prerequisites

1. Redis server (local or cloud-hosted)
2. Node.js worker process

## Setup

### 1. Install Redis

#### Local Development
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

#### Production (Recommended Services)
- [Redis Cloud](https://redis.com/cloud/overview/)
- [Upstash](https://upstash.com/)
- [Railway Redis](https://railway.app/)
- [Vercel KV](https://vercel.com/storage/kv) (Redis-compatible)

### 2. Configure Environment Variables

```env
# Basic Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password-if-needed

# Or use Redis URL (for cloud services)
REDIS_URL=redis://username:password@host:port

# Worker Configuration
JOB_CONCURRENCY=2  # Process 2 documents simultaneously
```

### 3. Start the Worker Process

```bash
# Development (with auto-reload)
npm run worker:dev

# Production
npm run worker
```

## Usage

### Async Document Upload

Upload large documents for background processing:

```bash
curl -X POST http://localhost:3000/api/documents/async-upload \
  -F "files=@large-document.pdf" \
  -F "useAI=true" \
  -F "generateSummary=true" \
  -F "generateEmbeddings=true"
```

Response:
```json
{
  "success": true,
  "message": "1 documents queued for processing",
  "jobs": [{
    "jobId": "1",
    "filename": "large-document.pdf",
    "size": 25000000
  }],
  "queueStatus": {
    "waiting": 1,
    "active": 0,
    "completed": 0,
    "failed": 0
  }
}
```

### Check Job Status

```bash
# Check specific job
curl http://localhost:3000/api/documents/async-upload?jobId=1

# Check queue status
curl http://localhost:3000/api/documents/async-upload
```

Job Status Response:
```json
{
  "id": "1",
  "state": "completed",
  "progress": 100,
  "result": {
    "documentId": "doc_123",
    "status": "COMPLETED",
    "chunks": 50,
    "themes": 8,
    "quotes": 25,
    "insights": 15
  },
  "createdAt": 1234567890,
  "processedAt": 1234567900,
  "finishedAt": 1234567920
}
```

## Deployment

### Vercel Deployment

Since Vercel functions have timeout limits, deploy the worker separately:

1. **API on Vercel**: Deploy the Next.js app normally
2. **Worker on Railway/Render**: Deploy the worker process

Example `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run worker",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Docker Deployment

Create a `Dockerfile.worker`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

CMD ["npm", "run", "worker"]
```

### Process Management

For production, use a process manager:

```bash
# PM2
pm2 start npm --name "doc-worker" -- run worker
pm2 save
pm2 startup

# systemd service
sudo nano /etc/systemd/system/doc-worker.service
```

## Monitoring

### Queue Statistics

The queue provides real-time statistics:
- **Waiting**: Documents queued for processing
- **Active**: Currently processing
- **Completed**: Successfully processed
- **Failed**: Failed after all retries

### Bull Dashboard (Optional)

Install Bull Dashboard for visual monitoring:

```bash
npm install @bull-board/express @bull-board/api
```

Add to your app:
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(documentQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

## Scaling

### Horizontal Scaling

Run multiple workers:
```bash
# Terminal 1
JOB_CONCURRENCY=3 npm run worker

# Terminal 2
JOB_CONCURRENCY=3 npm run worker
```

### Job Priorities

- AI-enabled jobs: Priority 1 (highest)
- Regular processing: Priority 2
- Reprocessing: Priority 3

### Rate Limiting

The system automatically handles:
- OpenAI API rate limits
- Database connection pooling
- Memory management

## Troubleshooting

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis info
redis-cli info
```

### Worker Not Processing
1. Check Redis connection in logs
2. Verify environment variables
3. Check for unhandled errors in worker logs

### Memory Issues
- Reduce `JOB_CONCURRENCY`
- Process smaller batches
- Increase worker memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run worker`

### Failed Jobs
Failed jobs are retried 3 times with exponential backoff. Check failed jobs:
```javascript
const failed = await documentQueue.getFailed();
// Retry specific job
await job.retry();
```