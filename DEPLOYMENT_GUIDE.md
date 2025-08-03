# Community Intelligence Platform - Comprehensive Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Community Intelligence Platform to production. The platform is designed to serve Indigenous and rural communities with high availability, security, and cultural safety requirements.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Security Setup](#security-setup)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Cultural Safety Compliance](#cultural-safety-compliance)
11. [Testing and Validation](#testing-and-validation)
12. [Maintenance and Updates](#maintenance-and-updates)
13. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Production Requirements:**
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 20.04 LTS or later

**Recommended Production Setup:**
- **Load Balancer**: 2 instances (2 cores, 4GB RAM each)
- **Application Servers**: 3 instances (4 cores, 8GB RAM each)
- **Database**: 1 primary + 2 replicas (8 cores, 32GB RAM each)
- **Redis Cache**: 1 instance (2 cores, 8GB RAM)
- **File Storage**: S3-compatible storage with CDN

### Required Accounts and Services

1. **Cloud Provider Account** (AWS, Google Cloud, or Azure)
2. **Domain Name** and DNS management
3. **SSL Certificate** (Let's Encrypt or commercial)
4. **Email Service** (SendGrid, AWS SES, or similar)
5. **AI Service Account** (OpenAI, Anthropic, or similar)
6. **Monitoring Service** (optional but recommended)

### Required Software

- Docker and Docker Compose
- Node.js 18+ and npm
- Git
- SSL certificates
- Reverse proxy (Nginx recommended)

## Infrastructure Setup

### Option 1: Docker Compose Deployment (Recommended for smaller deployments)

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/community-intelligence-platform.git
cd community-intelligence-platform
```

#### 2. Create Docker Compose Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    networks:
      - app-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-setup:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### 3. Create Production Dockerfile

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## Database Configuration

### Supabase Setup (Recommended)

#### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys
3. Configure authentication providers as needed

#### 2. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Set up Row Level Security
supabase db reset
```

#### 3. Configure Database Schema

Run all SQL files in the `database-setup/` directory in the following order:

```bash
# Core schema
psql $DATABASE_URL -f database-setup/cultural-safety.sql
psql $DATABASE_URL -f database-setup/enhanced-story-system.sql
psql $DATABASE_URL -f database-setup/community-health-indicators.sql
psql $DATABASE_URL -f database-setup/success-patterns.sql
psql $DATABASE_URL -f database-setup/intelligence-validation.sql
psql $DATABASE_URL -f database-setup/quality-monitoring.sql
```

## Application Deployment

### Environment Configuration

#### 1. Create Production Environment File

```bash
# .env.production
NODE_ENV=production

# Database
DATABASE_URL=postgresql://ci_user:secure_password@localhost:5432/community_intelligence
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email Service
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@your-domain.com

# File Storage
S3_BUCKET_NAME=your-s3-bucket
S3_REGION=us-west-2
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Cultural Safety
CULTURAL_REVIEW_REQUIRED=true
ELDER_CONSULTATION_ENABLED=true

# Performance
ENABLE_CACHING=true
CACHE_TTL=3600
MAX_FILE_SIZE=10485760

# Security
CSRF_SECRET=your-csrf-secret
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret

# Feature Flags
ENABLE_AI_ANALYSIS=true
ENABLE_MULTIMEDIA_PROCESSING=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_MOBILE_PWA=true
```

#### 2. Build and Deploy Application

```bash
# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Start the application
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/community-intelligence
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # File Upload Size
    client_max_body_size 10M;

    # Proxy to Next.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Logs
    access_log /var/log/nginx/community-intelligence.access.log;
    error_log /var/log/nginx/community-intelligence.error.log;
}
```

## Security Setup

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow database access (only from application servers)
sudo ufw allow from 10.0.0.0/8 to any port 5432

# Check status
sudo ufw status verbose
```

### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Cultural Safety Compliance

### 1. Cultural Protocol Implementation

```typescript
// lib/cultural-protocols.ts
export interface ElderConsultationRequest {
  contentId: string;
  contentType: 'story' | 'document' | 'intelligence';
  communityId: string;
  culturalContext: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  requestedBy: string;
  deadline?: Date;
}

export class CulturalProtocolService {
  static async requestElderConsultation(request: ElderConsultationRequest) {
    // Log the consultation request
    await this.logCulturalActivity({
      type: 'elder_consultation_requested',
      contentId: request.contentId,
      communityId: request.communityId,
      metadata: request
    });

    // Notify designated elders
    await this.notifyElders(request);

    // Set content status to pending review
    await this.updateContentStatus(request.contentId, 'pending_cultural_review');

    return {
      consultationId: generateId(),
      status: 'pending',
      estimatedReviewTime: this.calculateReviewTime(request.urgencyLevel)
    };
  }

  private static calculateReviewTime(urgency: string): string {
    switch (urgency) {
      case 'high': return '24-48 hours';
      case 'medium': return '3-5 days';
      case 'low': return '1-2 weeks';
      default: return '3-5 days';
    }
  }
}
```

## Monitoring and Logging

### 1. Health Check Endpoints

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    ai_services: await checkAIServices(),
    cultural_protocols: await checkCulturalProtocols()
  };

  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  return Response.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  }, {
    status: allHealthy ? 200 : 503
  });
}

async function checkCulturalProtocols() {
  try {
    const elderConsultationSystem = await checkElderConsultationSystem();
    const culturalValidation = await checkCulturalValidation();
    
    return {
      status: elderConsultationSystem && culturalValidation ? 'healthy' : 'unhealthy',
      elder_consultation: elderConsultationSystem,
      cultural_validation: culturalValidation
    };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Backup and Recovery

### 1. Database Backup

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/community-intelligence"
DB_NAME="community_intelligence"
DB_USER="ci_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/deploy/community-intelligence-platform

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Log backup completion
echo "$(date): Backup completed successfully" >> /var/log/backup.log
```

## Testing and Validation

### 1. Pre-Deployment Testing

```bash
#!/bin/bash
# run-deployment-tests.sh

echo "Starting pre-deployment test suite..."

# Environment validation
echo "1. Validating environment variables..."
node scripts/validate-env.js

# Database connectivity
echo "2. Testing database connectivity..."
npm run test:db-connection

# API endpoints
echo "3. Testing API endpoints..."
npm run test:api

# Cultural safety features
echo "4. Testing cultural safety features..."
npm run test:cultural-safety

# Integration tests
echo "5. Running integration tests..."
npm run test:integration

echo "Pre-deployment tests completed!"
```

### 2. Production Validation

```javascript
// scripts/smoke-tests.js
const axios = require('axios');

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://your-domain.com';

async function runSmokeTests() {
  const tests = [
    {
      name: 'Homepage loads',
      test: () => axios.get(PRODUCTION_URL)
    },
    {
      name: 'API health check',
      test: () => axios.get(`${PRODUCTION_URL}/api/health`)
    },
    {
      name: 'Cultural safety endpoints',
      test: () => axios.get(`${PRODUCTION_URL}/api/cultural/protocols`)
    }
  ];

  console.log('Running production smoke tests...\n');

  for (const test of tests) {
    try {
      const start = Date.now();
      await test.test();
      const duration = Date.now() - start;
      console.log(`✅ ${test.name} (${duration}ms)`);
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 All smoke tests passed!');
}

runSmokeTests();
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### 2. Cultural Safety System Issues

```sql
-- Check elder consultation system
SELECT 
  COUNT(*) as total_consultations,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved
FROM elder_consultations 
WHERE created_at >= NOW() - INTERVAL '7 days';
```

## Conclusion

This comprehensive deployment guide provides all the necessary steps and configurations to deploy the Community Intelligence Platform in a production environment. The platform is designed with cultural safety, security, and scalability as core principles.

### Key Success Factors

1. **Cultural Safety First**: All deployments must include proper elder consultation systems and cultural protocol enforcement
2. **Security by Design**: Implement all security measures from day one, not as an afterthought
3. **Monitoring and Alerting**: Comprehensive monitoring ensures early detection of issues
4. **Backup and Recovery**: Regular backups and tested recovery procedures are essential
5. **Community Ownership**: Ensure communities maintain control over their data

### Post-Deployment Checklist

- [ ] All health checks passing
- [ ] Cultural safety systems operational
- [ ] Monitoring and alerting configured
- [ ] Backup systems tested
- [ ] Security scans completed
- [ ] Elder consultation system verified
- [ ] Community data sovereignty confirmed
- [ ] Documentation updated
- [ ] Team training completed

### Support and Maintenance

For ongoing support and maintenance:

1. **Regular Updates**: Follow the update procedures monthly
2. **Security Patches**: Apply security updates immediately
3. **Performance Monitoring**: Review performance metrics weekly
4. **Cultural Compliance**: Audit cultural safety measures monthly
5. **Backup Verification**: Test backup restoration quarterly
6. **Disaster Recovery**: Practice emergency procedures annually

This deployment guide ensures the Community Intelligence Platform serves Indigenous and rural communities with the highest standards of cultural safety, security, and reliability.