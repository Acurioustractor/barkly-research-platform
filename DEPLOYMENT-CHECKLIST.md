# Deployment Checklist

## Pre-deployment Steps

### 1. Environment Variables
Copy `.env.example` to `.env.local` and configure all required variables.
Ensure the following environment variables are set in Vercel:

**Required:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct PostgreSQL connection (for migrations)

**AI Services (at least one required):**
- [ ] `OPENAI_API_KEY` - For OpenAI GPT models and embeddings
- [ ] `ANTHROPIC_API_KEY` - For Claude models

**Optional Services:**
- [ ] `REDIS_URL` - For background job processing (defaults to in-memory)

**Feature Flags (all optional, see .env.example for full list):**
- [ ] `ENABLE_AI_ANALYSIS` - Enable AI analysis (default: true)
- [ ] `ENABLE_EMBEDDINGS` - Enable semantic search (default: true)
- [ ] `ENABLE_PARALLEL_PROCESSING` - Process multiple docs (default: true)

**Configuration:**
- [ ] `NODE_ENV` - Set to 'production'
- [ ] `MAX_FILE_SIZE` - Max upload size in bytes (default: 10MB)
- [ ] `AI_TIMEOUT_MS` - AI service timeout (default: 30000ms)

### 2. Database Setup
- [ ] Ensure PostgreSQL database is provisioned
- [ ] pgvector extension is installed (for embeddings)
- [ ] Run database migrations: `npx prisma db push`

### 3. Build Verification
- [ ] `npm run build` completes successfully
- [ ] No critical TypeScript errors
- [ ] All required dependencies are in package.json

### 4. Feature Configuration
- [ ] AI models are properly configured
- [ ] File upload limits are appropriate
- [ ] API rate limits are configured if needed

## Deployment Steps

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add AI-powered document processing features"
   ```

2. **Push to repository:**
   ```bash
   git push origin main
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## Post-deployment Verification

### 1. Core Features
- [ ] Admin page loads at `/admin`
- [ ] Research page loads at `/research`
- [ ] Database connection status shows "Connected"

### 2. AI Features
- [ ] Document upload works
- [ ] AI processing completes successfully
- [ ] Insights are generated
- [ ] Visualizations display data

### 3. API Endpoints
Test these endpoints:
- [ ] `GET /api/ai/config` - Returns AI configuration
- [ ] `GET /api/documents/insights` - Returns document insights
- [ ] `GET /api/documents/metrics` - Returns processing metrics
- [ ] `GET /api/documents/network` - Returns network data

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Verify DATABASE_URL is correct
   - Check if database allows connections from Vercel IPs
   - Ensure SSL mode is configured correctly

2. **AI Features Not Working**
   - Verify API keys are set correctly
   - Check API key permissions and quotas
   - Review logs for specific error messages

3. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are listed
   - Ensure prisma generate runs in build

4. **Performance Issues**
   - Consider implementing Redis for job queue
   - Monitor API response times
   - Check database query performance

## Rollback Plan

If issues occur:
1. Revert to previous deployment in Vercel dashboard
2. Investigate issues in development
3. Fix and test thoroughly before redeploying