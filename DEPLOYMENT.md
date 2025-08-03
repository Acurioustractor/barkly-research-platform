# Barkly Research Platform - Deployment Guide

This guide will help you deploy the Barkly Research Platform to GitHub and then to Vercel.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/barkly-research-platform&env=SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,DATABASE_URL,OPENAI_API_KEY&envDescription=Required%20environment%20variables%20for%20the%20platform&envLink=https://github.com/your-username/barkly-research-platform/blob/main/.env.production.example)

## 📋 Prerequisites

- GitHub account
- Vercel account (can sign up with GitHub)
- Supabase project (for database)
- OpenAI API key (for AI analysis)

## 🔧 Environment Variables Required

Copy these from `.env.production.example` to your Vercel environment:

### Required Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
OPENAI_API_KEY=sk-...
NODE_ENV=production
```

### Optional but Recommended
```bash
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://your-redis:6379
MAX_FILE_SIZE=25165824
AI_TIMEOUT_MS=60000
```

## 📦 Step 1: Prepare for GitHub

1. **Clean up sensitive files** (already done):
   ```bash
   # These are already in .gitignore:
   # - .env files
   # - Generated thumbnails  
   # - Test documents
   # - Build artifacts
   ```

2. **Verify build works**:
   ```bash
   npm run build
   npm run type-check
   ```

## 🔨 Step 2: Create GitHub Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Barkly Research Platform"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Repository name: `barkly-research-platform`
   - Description: "AI-powered platform for transforming community stories into actionable intelligence"
   - Public or Private (your choice)
   - Do NOT initialize with README (we have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/barkly-research-platform.git
   git branch -M main
   git push -u origin main
   ```

## ☁️ Step 3: Deploy to Vercel

### Option A: Automatic Deploy (Recommended)

1. **Connect GitHub to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/in with GitHub
   - Click "New Project"
   - Import your `barkly-research-platform` repository

2. **Configure Build Settings**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from `.env.production.example`

### Option B: Vercel CLI Deploy

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel
   ```

3. **Follow prompts**:
   - Link to existing project? No
   - Project name: `barkly-research-platform`
   - Directory: `./`
   - Want to override settings? No

## 🔧 Step 4: Configure Production Environment

1. **Set Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all required variables from `.env.production.example`

2. **Configure Database**:
   - Ensure Supabase project is set up
   - Run migrations if needed:
     ```bash
     # In your Supabase SQL editor:
     # Run any pending migration files from /database-setup/
     ```

3. **Test Deployment**:
   - Visit your Vercel URL
   - Test document upload
   - Check AI analysis works
   - Verify thumbnails load

## 🛠️ Step 5: Custom Domain (Optional)

1. **Add Custom Domain** in Vercel:
   - Go to Project Settings → Domains
   - Add your domain: `your-domain.com`
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   ALLOWED_ORIGINS=https://your-domain.com
   ```

## 📊 Production Monitoring

### Performance Monitoring
- Vercel Analytics (automatic)
- Function logs in Vercel dashboard
- Database performance in Supabase

### Error Tracking
- Check Vercel function logs
- Monitor Supabase logs
- Set up Sentry (optional):
  ```bash
  SENTRY_DSN=your-sentry-dsn
  ```

## 🔄 Continuous Deployment

Once connected to GitHub:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Deploy previews
- Pull requests → Automatic preview deployments

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build locally first
   npm run build
   npm run type-check
   ```

2. **Environment Variable Issues**:
   - Ensure all required variables are set in Vercel
   - Check variable names match exactly
   - Verify Supabase keys are correct

3. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check Supabase project is not paused
   - Ensure connection pooling is enabled

4. **API Timeouts**:
   - Check Vercel function timeouts (max 60s on Hobby plan)
   - Increase timeouts in `vercel.json` if needed
   - Consider breaking up large operations

### Getting Help

1. **Check Vercel logs**: Project → Functions → View function logs
2. **Check build logs**: Project → Deployments → Click deployment → View logs
3. **Supabase logs**: Supabase Dashboard → Logs
4. **Local development**: `npm run dev` to test locally

## 📝 Post-Deployment Checklist

- [ ] Site loads at Vercel URL
- [ ] Document upload works
- [ ] AI analysis processes documents
- [ ] Thumbnails display correctly
- [ ] Database connections work
- [ ] All API endpoints respond
- [ ] Custom domain configured (if applicable)
- [ ] Environment variables secure
- [ ] Monitoring set up

## 🔐 Security Notes

- All environment variables are kept secure in Vercel
- `.env` files are NOT committed to GitHub
- Supabase handles database security
- CORS is configured for your domain only
- Rate limiting is enabled on API endpoints

---

🎉 **Congratulations!** Your Barkly Research Platform is now deployed and ready to help transform community stories into actionable intelligence.

For support, create an issue in the GitHub repository.