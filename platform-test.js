#!/usr/bin/env node

/**
 * Comprehensive Platform Testing Script
 * Tests all critical functionality step by step
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Barkley Research Platform - Comprehensive Testing\n');

async function testEnvironment() {
  console.log('📋 Step 1: Environment Check');
  
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY', 
    'ANTHROPIC_API_KEY',
    'MOONSHOT_API_KEY'
  ];
  
  let envScore = 0;
  
  for (const varName of requiredVars) {
    if (process.env[varName] && process.env[varName] !== 'YOUR_MOONSHOT_API_KEY_HERE') {
      console.log(`✅ ${varName}: Configured`);
      envScore++;
    } else {
      console.log(`❌ ${varName}: Missing or placeholder`);
    }
  }
  
  console.log(`Environment Score: ${envScore}/${requiredVars.length}`);
  
  // Check AI defaults
  console.log(`\n🎯 AI Configuration:`);
  console.log(`   Default Model: ${process.env.AI_DEFAULT_MODEL || 'Not set'}`);
  console.log(`   Default Profile: ${process.env.AI_DEFAULT_PROFILE || 'Not set'}`);
  
  return envScore >= 3; // Need at least DB + one AI provider + Moonshot
}

async function testAPI(endpoint, description) {
  try {
    const response = await fetch(`http://localhost:3001${endpoint}`);
    const status = response.status;
    
    if (status === 200) {
      console.log(`✅ ${description}: Working (${status})`);
      return true;
    } else {
      console.log(`⚠️  ${description}: Status ${status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return false;
  }
}

async function testMoonshotAPI() {
  console.log('\n🌙 Step 2: Moonshot API Test');
  
  if (!process.env.MOONSHOT_API_KEY || process.env.MOONSHOT_API_KEY === 'YOUR_MOONSHOT_API_KEY_HERE') {
    console.log('❌ Moonshot API key not configured');
    return false;
  }
  
  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'user', content: 'Hello, test message for API connectivity' }
        ],
        max_tokens: 50
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Moonshot API: Connected successfully');
      console.log(`   Model: ${data.model || 'moonshot-v1-8k'}`);
      console.log(`   Usage: ${data.usage?.total_tokens || 'N/A'} tokens`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Moonshot API: ${response.status} - ${errorText.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Moonshot API: ${error.message}`);
    return false;
  }
}

async function testPlatformAPIs() {
  console.log('\n🔌 Step 3: Platform API Health Check');
  
  const endpoints = [
    ['/api/test', 'Basic API'],
    ['/api/check-db', 'Database Connection'],
    ['/api/ai/config', 'AI Configuration'],
    ['/api/documents/count', 'Document Count'],
    ['/api/documents/metrics', 'Document Metrics']
  ];
  
  let successCount = 0;
  
  for (const [endpoint, description] of endpoints) {
    const success = await testAPI(endpoint, description);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log(`Platform API Score: ${successCount}/${endpoints.length}`);
  return successCount >= 3; // Need at least basic connectivity
}

async function testFileStructure() {
  console.log('\n📁 Step 4: Critical File Structure Check');
  
  const criticalFiles = [
    'src/lib/ai-config.ts',
    'src/lib/moonshot-client.ts', 
    'src/lib/ai-service.ts',
    'src/app/api/documents/bulk-upload/route.ts',
    'src/utils/world-class-document-processor.ts'
  ];
  
  let fileScore = 0;
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}: Found`);
      fileScore++;
    } else {
      console.log(`❌ ${file}: Missing`);
    }
  }
  
  console.log(`File Structure Score: ${fileScore}/${criticalFiles.length}`);
  return fileScore === criticalFiles.length;
}

async function createTestDocument() {
  console.log('\n📄 Step 5: Create Test Document');
  
  const testContent = `
# Test Document for Barkley Research Platform

## Youth Development in Remote Communities

This is a test document to verify the document processing pipeline works correctly.

### Key Themes
- Education Access: Remote communities face significant challenges accessing quality education
- Cultural Identity: Maintaining traditional knowledge while embracing modern opportunities
- Technology Integration: Bridging the digital divide through innovative solutions
- Community Leadership: Young people taking leadership roles in community development

### Important Quotes
"Education is the foundation of our future, but it must respect our cultural heritage." - Community Elder

"Technology can connect us to the world while keeping us rooted in our land." - Youth Leader

### Actionable Insights
1. Develop culturally appropriate educational programs
2. Invest in reliable internet infrastructure 
3. Create mentorship programs connecting youth with elders
4. Establish community-led technology training initiatives

This document contains sufficient content to test theme extraction, quote identification, and insight generation capabilities of the AI processing system.
`;
  
  const testDir = 'test-documents';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  const testFile = path.join(testDir, 'test-document.txt');
  fs.writeFileSync(testFile, testContent);
  
  console.log(`✅ Test document created: ${testFile}`);
  console.log(`   Content length: ${testContent.length} characters`);
  console.log(`   Expected themes: ~4-6`);
  console.log(`   Expected quotes: ~2-3`);
  console.log(`   Expected insights: ~4-5`);
  
  return testFile;
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive platform test...\n');
    
    // Step 1: Environment
    const envOK = await testEnvironment();
    
    // Step 2: Moonshot API (skip if key not configured)
    let moonshotOK = true;
    if (process.env.MOONSHOT_API_KEY && process.env.MOONSHOT_API_KEY !== 'YOUR_MOONSHOT_API_KEY_HERE') {
      moonshotOK = await testMoonshotAPI();
    } else {
      console.log('\n🌙 Step 2: Moonshot API Test');
      console.log('⚠️  Moonshot API key not configured - skipping test');
    }
    
    // Step 3: Platform APIs
    const apisOK = await testPlatformAPIs();
    
    // Step 4: File structure  
    const filesOK = await testFileStructure();
    
    // Step 5: Create test document
    const testFile = await createTestDocument();
    
    // Final assessment
    console.log('\n📊 OVERALL ASSESSMENT');
    console.log('='.repeat(50));
    console.log(`Environment: ${envOK ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Moonshot API: ${moonshotOK ? '✅ PASS' : '⚠️  SKIP/FAIL'}`);
    console.log(`Platform APIs: ${apisOK ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`File Structure: ${filesOK ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test Document: ✅ CREATED`);
    
    const overallScore = [envOK, moonshotOK, apisOK, filesOK].filter(Boolean).length;
    
    if (overallScore >= 3) {
      console.log('\n🎉 PLATFORM READY FOR TESTING!');
      console.log('\n📋 Next Steps:');
      console.log('1. Visit http://localhost:3001/admin');
      console.log('2. Go to "AI Config" tab to verify Moonshot integration');
      console.log('3. Upload the test document via "Bulk Upload" tab');
      console.log('4. Monitor processing and verify results');
      console.log('\n💡 For best results, use "moonshot-standard" profile');
    } else {
      console.log('\n⚠️  PLATFORM NEEDS ATTENTION');
      console.log('\nIssues to resolve:');
      if (!envOK) console.log('- Check environment variables');
      if (!moonshotOK) console.log('- Verify Moonshot API key');
      if (!apisOK) console.log('- Check server is running on port 3001');
      if (!filesOK) console.log('- Verify file structure is complete');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testEnvironment, testMoonshotAPI, testPlatformAPIs, testFileStructure };