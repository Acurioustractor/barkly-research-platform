#!/usr/bin/env node

/**
 * Basic test for AI system components
 */

const path = require('path');
const fs = require('fs');

// Set up environment
process.env.NODE_ENV = 'development';
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testBasics() {
  console.log('🧪 Basic AI System Test\n');

  // Test 1: Check if files exist
  console.log('📋 Test 1: File Structure Check');
  const filesToCheck = [
    'src/lib/ai-rate-limiter.ts',
    'src/lib/ai-service-enhanced.ts', 
    'src/lib/document-job-processor.ts',
    'src/app/api/jobs/route.ts',
    'src/app/api/jobs/stream/route.ts',
    'src/app/api/ai/status/route.ts',
    'src/components/core/DocumentProcessingStatus.tsx'
  ];

  for (const file of filesToCheck) {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  }

  // Test 2: Environment variables
  console.log('\n📋 Test 2: Environment Configuration');
  const envVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY ? 'Set (hidden)' : 'Not set',
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY ? 'Set (hidden)' : 'Not set',
    'MOONSHOT_API_KEY': process.env.MOONSHOT_API_KEY ? 'Set (hidden)' : 'Not set',
  };

  for (const [key, value] of Object.entries(envVars)) {
    const isSet = key === 'DATABASE_URL' ? !!value : value.includes('Set');
    console.log(`${isSet ? '✅' : '❌'} ${key}: ${isSet ? (key === 'DATABASE_URL' ? 'Set' : value) : 'Not set'}`);
  }

  // Test 3: Database connection (simple)
  console.log('\n📋 Test 3: Database Connection Test');
  try {
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is configured');
      console.log('🔗 Database host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown');
    } else {
      console.log('❌ DATABASE_URL not configured');
    }
  } catch (error) {
    console.log('❌ Error checking database config:', error.message);
  }

  // Test 4: Check if we can reach the API endpoints (when server is running)
  console.log('\n📋 Test 4: API Endpoint Structure');
  const apiFiles = [
    'src/app/api/jobs/route.ts',
    'src/app/api/jobs/stream/route.ts', 
    'src/app/api/ai/status/route.ts'
  ];

  for (const file of apiFiles) {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file.replace('src/app', '')}`);
  }

  // Test 5: Check package dependencies
  console.log('\n📋 Test 5: Package Dependencies');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = ['@anthropic-ai/sdk', 'openai', 'prisma'];
    
    for (const dep of requiredDeps) {
      const hasInDeps = packageJson.dependencies?.[dep];
      const hasInDevDeps = packageJson.devDependencies?.[dep];
      const installed = hasInDeps || hasInDevDeps;
      console.log(`${installed ? '✅' : '❌'} ${dep}: ${installed ? (hasInDeps || hasInDevDeps) : 'Not found'}`);
    }
  } catch (error) {
    console.log('❌ Error checking package.json:', error.message);
  }

  console.log('\n🎉 Basic Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Test upload a PDF document');
  console.log('3. Check the queue status at /api/jobs');
  console.log('4. Monitor AI status at /api/ai/status');
}

testBasics().catch(console.error);