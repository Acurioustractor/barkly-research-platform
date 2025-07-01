# CI/CD Guide

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline ensures code quality, runs tests, and automatically deploys to Vercel.

## Workflows

### 1. CI (Continuous Integration)
**File:** `.github/workflows/ci.yml`  
**Triggers:** Push to main/develop, Pull requests

**Jobs:**
- **Lint:** Runs ESLint to check code style
- **Test:** Runs Jest tests with coverage reporting
- **TypeCheck:** Validates TypeScript types
- **Build:** Builds the application in both dev and prod modes
- **Security:** Runs npm audit and Trivy vulnerability scanner

### 2. Deploy
**File:** `.github/workflows/deploy.yml`  
**Triggers:** Push to main, Manual dispatch

**Jobs:**
- **Deploy Preview:** Creates preview deployments for branches
- **Deploy Production:** Deploys main branch to production
- **Post-deploy Checks:** Runs smoke tests on production

### 3. Database Management
**File:** `.github/workflows/database.yml`  
**Triggers:** Manual dispatch only

**Actions:**
- Migrate: Run Prisma migrations
- Seed: Seed the database
- Backup: Create database backup
- Restore: Instructions for restore

### 4. Dependencies
**File:** `.github/workflows/dependencies.yml`  
**Triggers:** Weekly schedule, Manual dispatch

Automatically updates dependencies and creates PRs.

## Required Secrets

Configure these in GitHub repository settings:

### Vercel Deployment
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Database
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection

### Optional
- `CODECOV_TOKEN`: For coverage reporting

## Getting Vercel Tokens

1. Install Vercel CLI: `npm i -g vercel`
2. Link project: `vercel link`
3. Get tokens:
   ```bash
   # Get Vercel token from https://vercel.com/account/tokens
   
   # Get org and project IDs
   cat .vercel/project.json
   ```

## Branch Protection

Recommended settings for `main` branch:
- Require pull request reviews
- Require status checks (lint, test, typecheck, build)
- Require branches to be up to date
- Include administrators

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Test CI workflow
act push

# Test specific job
act -j lint
```

## Monitoring

- Check workflow runs: Actions tab in GitHub
- View deployment status: Vercel dashboard
- Coverage reports: Codecov dashboard
- Security alerts: GitHub Security tab