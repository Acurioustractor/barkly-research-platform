#!/bin/bash

# Deploy to Test Environment Script
# This script helps deploy the enhanced document processing system to a test environment

set -e

echo "🚀 Barkly Research Platform - Deploy to Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists vercel; then
    echo -e "${RED}❌ Vercel CLI not installed${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check environment variables
echo "🔐 Checking environment variables..."
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ .env.local found${NC}"
    
    # Check for required variables
    required_vars=("DATABASE_URL" "OPENAI_API_KEY OR ANTHROPIC_API_KEY")
    for var in "${required_vars[@]}"; do
        if grep -q "$var" .env.local; then
            echo -e "${GREEN}✅ $var configured${NC}"
        else
            echo -e "${YELLOW}⚠️  $var might be missing${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
    echo "Make sure to configure environment variables in Vercel dashboard"
fi
echo ""

# Build test
echo "🏗️  Testing build..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Git status check
echo "📝 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status --short
    echo ""
    read -p "Do you want to create a test branch and commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create test branch
        branch_name="test-deployment-$(date +%Y%m%d-%H%M%S)"
        git checkout -b $branch_name
        
        # Add all new files
        git add .
        
        # Commit changes
        git commit -m "Test deployment: Enhanced document processing system

- Improved PDF extraction with fallback methods
- Adaptive chunking strategies
- Comprehensive error handling
- Parallel processing with rate limiting
- Enhanced embeddings service with pgvector support"
        
        echo -e "${GREEN}✅ Changes committed to branch: $branch_name${NC}"
    else
        echo "Continuing without committing changes..."
    fi
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi
echo ""

# Database setup reminder
echo "💾 Database Setup Checklist:"
echo "  1. Ensure PostgreSQL database is provisioned"
echo "  2. pgvector extension must be installed:"
echo "     CREATE EXTENSION IF NOT EXISTS vector;"
echo "  3. Run migrations after deployment:"
echo "     npm run db:push"
echo ""

# Vercel deployment options
echo "🚀 Deployment Options:"
echo "  1. Deploy to preview (recommended for testing)"
echo "  2. Deploy to production"
echo "  3. Cancel deployment"
echo ""
read -p "Select option (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "Deploying to preview environment..."
        vercel
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Preview deployment successful!${NC}"
            echo ""
            echo "📋 Post-deployment steps:"
            echo "  1. Run database migrations:"
            echo "     vercel env pull && npx prisma db push"
            echo "  2. Set up pgvector:"
            echo "     psql \$DATABASE_URL < scripts/setup-pgvector.sql"
            echo "  3. Test the deployment:"
            echo "     - Upload a test PDF"
            echo "     - Check /api/ai/config endpoint"
            echo "     - Verify document processing"
        fi
        ;;
    2)
        echo "Deploying to production..."
        echo -e "${YELLOW}⚠️  Warning: This will deploy to production!${NC}"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            vercel --prod
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✅ Production deployment successful!${NC}"
                echo ""
                echo "🔍 Run verification script:"
                echo "   ./verify-deployment.sh"
            fi
        else
            echo "Production deployment cancelled"
        fi
        ;;
    3)
        echo "Deployment cancelled"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT-CHECKLIST.md for full deployment guide"
echo "  - TROUBLESHOOTING.md for common issues"
echo "  - test-document-processing.ts for testing"

# Create deployment summary
cat > deployment-summary.txt << EOF
Deployment Summary - $(date)
==============================

Enhanced Features Deployed:
- Improved PDF extraction (pdf-extractor-improved.ts)
- Adaptive chunking (adaptive-chunker.ts)
- Error handling & recovery (error-handler.ts)
- Graceful degradation (graceful-degradation.ts)
- Parallel processing (parallel-processor.ts)
- Enhanced embeddings (embeddings-service-enhanced.ts)

New API Endpoints:
- /api/upload-enhanced - Enhanced upload with error handling
- /api/upload-parallel - Parallel document processing

Database Changes:
- pgvector support for embeddings
- Run: scripts/setup-pgvector.sql

Testing:
- Run: npx tsx test-document-processing.ts
- Test PDFs in: test-documents/

Environment Variables Required:
- DATABASE_URL
- OPENAI_API_KEY or ANTHROPIC_API_KEY
- Optional: REDIS_URL for background jobs
EOF

echo ""
echo "📄 Deployment summary saved to: deployment-summary.txt"