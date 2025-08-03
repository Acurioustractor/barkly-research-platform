# Barkley Research Platform - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. **Prerequisites**
- Vercel account (free tier available)
- PostgreSQL database (Supabase/Neon recommended)
- AI API keys (OpenAI and/or Anthropic)

### 2. **One-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fbarkly-research-platform)

### 3. **Manual Deployment Steps**

#### **Step 1: Clone and Setup**
```bash
git clone https://github.com/your-username/barkly-research-platform.git
cd barkly-research-platform
npm install
```

#### **Step 2: Environment Variables**
Set these environment variables in your Vercel dashboard:

**Required:**
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

**Optional (recommended):**
```bash
REDIS_URL="redis://host:port"
ENABLE_AI_ANALYSIS="true"
ENABLE_EMBEDDINGS="true"
ENABLE_PARALLEL_PROCESSING="true"
MAX_FILE_SIZE="10485760"
AI_TIMEOUT_MS="30000"
NODE_ENV="production"
```

#### **Step 3: Database Setup**
```bash
# Push database schema
npx prisma db push

# Generate client
npx prisma generate
```

#### **Step 4: Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🔧 Configuration Details

### **Database Configuration**
- **PostgreSQL** with pgvector extension required
- **Supabase** (recommended): Free tier with pgvector support
- **Neon**: Good alternative with serverless PostgreSQL

### **AI Services**
- **OpenAI**: Required for embeddings and analysis
- **Anthropic**: Alternative/backup AI provider
- **Moonshot**: Optional third provider

### **File Storage**
- Uses local filesystem (Vercel's /tmp directory)
- For production, consider upgrading to cloud storage

## 🎯 Key Features Available

### **AI Analysis Pipeline**
- ✅ Multi-provider AI integration (OpenAI, Anthropic, Moonshot)
- ✅ Rate limiting with exponential backoff
- ✅ Automatic failover and health monitoring
- ✅ Background job processing with priority queuing
- ✅ Real-time progress streaming

### **Document Processing**
- ✅ Intelligent chunking with 8 different strategies
- ✅ Quality validation with automatic reprocessing
- ✅ Performance optimization with caching
- ✅ Comprehensive metadata tracking

### **User Interface**
- ✅ Complete upload interface with AI options
- ✅ Real-time job queue monitoring
- ✅ Performance insights and system health
- ✅ Document analysis results viewer

## 🔐 Security Considerations

### **API Keys**
- Store all API keys in Vercel environment variables
- Never commit keys to version control
- Use separate keys for development and production

### **Database Security**
- Use connection pooling for PostgreSQL
- Enable SSL connections
- Implement proper user permissions

### **File Upload Security**
- File type validation (PDF only)
- Size limits (10MB default)
- Virus scanning recommended for production

## 📊 Performance Optimization

### **Caching Strategy**
- Document chunking results cached
- AI analysis results cached
- Performance metrics cached

### **Database Optimization**
- Indexes on frequently queried columns
- Connection pooling enabled
- Query optimization for large datasets

### **Resource Management**
- Background job processing
- Memory usage monitoring
- CPU usage alerts

## 🚨 Monitoring & Alerts

### **Built-in Monitoring**
- Real-time performance metrics
- System health monitoring
- Queue length tracking
- Error rate monitoring

### **Alert Thresholds**
- High processing time (>30s)
- Low success rate (<95%)
- High queue length (>50)
- High memory usage (>80%)

## 🔄 Deployment Checklist

### **Pre-deployment**
- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] AI API keys tested
- [ ] Build succeeds locally

### **Post-deployment**
- [ ] Database connection verified
- [ ] AI services responding
- [ ] Upload functionality working
- [ ] Job queue processing
- [ ] Performance monitoring active

## 🐛 Troubleshooting

### **Common Issues**

**Database Connection:**
```bash
# Test database connection
npx prisma db push
```

**AI API Issues:**
```bash
# Test AI service status
curl https://your-app.vercel.app/api/ai/status
```

**Build Errors:**
```bash
# Check build logs
vercel logs your-deployment-url
```

**Memory Issues:**
- Increase Vercel function memory in dashboard
- Check for memory leaks in job processing

## 📈 Scaling Considerations

### **Current Limits**
- Vercel function timeout: 300s
- Memory: 1GB (can be increased)
- File uploads: 10MB (configurable)

### **Scaling Options**
- Increase function memory/timeout
- Implement Redis for job queue
- Use cloud storage for files
- Add CDN for static assets

## 🎉 Success Metrics

After deployment, you should see:
- AI analysis working with multiple providers
- Real-time job queue processing
- Document upload and analysis pipeline
- Performance monitoring dashboard
- Quality validation system

## 🚀 Final Deployment Steps

### **Step 1: Run Production Build Test**
```bash
# Ensure production build succeeds
npm run build

# If successful, you should see:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
```

### **Step 2: Deploy to Vercel**
```bash
# Deploy to production
vercel --prod

# Or connect GitHub repo in Vercel dashboard for automatic deployments
```

### **Step 3: Verify Deployment**
```bash
# Run verification script
./verify-deployment.sh https://your-app.vercel.app

# Check all endpoints and features
# Should show ✅ for all key features
```

### **Step 4: Production Checklist**
- [ ] Production build succeeds without errors
- [ ] All environment variables configured in Vercel
- [ ] Database connection verified
- [ ] AI API keys tested and working
- [ ] Document upload and processing working
- [ ] Real-time job streaming active
- [ ] Performance monitoring enabled
- [ ] Error handling and logging active

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Validate AI API keys
5. Review performance metrics

---

**Ready to deploy!** 🚀 Your comprehensive AI-powered research platform is production-ready with all advanced features enabled.