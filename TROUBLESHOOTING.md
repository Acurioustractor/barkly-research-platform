# Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Connection Failed

**Symptoms:**
- Red "Database Disconnected" status on admin page
- API errors when trying to upload

**Solutions:**
- Verify DATABASE_URL in Vercel environment variables
- Check if database allows connections from Vercel IPs
- For Supabase: Go to Settings → Database → Connection Pooling
- Ensure SSL is enabled: add `?sslmode=require` to connection string

### 2. AI Provider Not Available

**Symptoms:**
- "No AI Provider" status on admin page
- Document processing fails

**Solutions:**
- Verify API keys are correctly set in Vercel
- Check API key format:
  - OpenAI: starts with `sk-`
  - Anthropic: starts with `sk-ant-`
- Test API keys are valid and have credits

### 3. Document Upload Fails

**Symptoms:**
- Upload shows error immediately
- Processing gets stuck

**Solutions:**
- Check file is PDF format
- Ensure file size is under 50MB
- Verify file contains extractable text (not scanned image)
- Check browser console for detailed errors

### 4. No Insights Generated

**Symptoms:**
- Documents process but no themes/insights appear
- Empty research page

**Solutions:**
- Check Vercel function logs for AI API errors
- Verify AI models are responding
- Ensure document has sufficient content (>100 words)
- Check if pgvector extension is enabled for embeddings

### 5. Visualizations Not Loading

**Symptoms:**
- Blank areas where charts should be
- Loading spinners that never complete

**Solutions:**
- Check browser console for JavaScript errors
- Verify API endpoints are returning data
- Clear browser cache and reload
- Check if data exists in database

## Checking Logs

### Vercel Function Logs
1. Go to Vercel Dashboard
2. Click on "Functions" tab
3. Select the function (e.g., `api/documents/bulk-upload`)
4. View real-time logs

### Database Queries
Test your database connection:
```bash
npx prisma studio
```

### API Health Check
Test endpoints directly:
```bash
curl https://your-app.vercel.app/api/ai/config
curl https://your-app.vercel.app/api/documents/metrics
```

## Getting Help

1. Check error messages in:
   - Browser Developer Console (F12)
   - Vercel Function Logs
   - Network tab for failed requests

2. Common fixes:
   - Redeploy after adding environment variables
   - Clear browser cache
   - Try a different browser

3. For persistent issues:
   - Check GitHub issues
   - Review the deployment logs
   - Verify all environment variables are set