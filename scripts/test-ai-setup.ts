#!/usr/bin/env node

/**
 * Test script for AI setup
 * Run: npx tsx scripts/test-ai-setup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

async function runTests() {
  console.log('🧪 Testing AI Setup...\n');
  
  const results: TestResult[] = [];

  // Test 1: Check environment variables
  console.log('1️⃣  Checking environment variables...');
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasAnyAI = hasOpenAI || hasAnthropic;
  
  results.push({
    name: 'Environment Variables',
    passed: hasAnyAI,
    message: hasAnyAI 
      ? `✅ AI API keys found (OpenAI: ${hasOpenAI ? 'Yes' : 'No'}, Anthropic: ${hasAnthropic ? 'Yes' : 'No'})` 
      : '❌ No AI API keys found (need OpenAI or Anthropic)',
    details: {
      OPENAI_API_KEY: hasOpenAI,
      ANTHROPIC_API_KEY: hasAnthropic,
      REDIS_HOST: process.env.REDIS_HOST || 'not set',
      AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL || 'not set'
    }
  });

  // Test 2: Check AI configuration
  console.log('\n2️⃣  Testing AI configuration...');
  try {
    const configResponse = await fetch(`${API_BASE_URL}/api/test/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'config' })
    });
    
    const configData = await configResponse.json();
    results.push({
      name: 'AI Configuration',
      passed: configData.success && configData.validation?.valid,
      message: configData.success 
        ? '✅ AI configuration is valid' 
        : `❌ AI configuration invalid: ${configData.validation?.errors?.join(', ')}`,
      details: configData
    });
  } catch (error) {
    results.push({
      name: 'AI Configuration',
      passed: false,
      message: `❌ Failed to test configuration: ${error}`,
      details: { error: String(error) }
    });
  }

  // Test 3: Test document analysis
  console.log('\n3️⃣  Testing document analysis...');
  try {
    const analysisResponse = await fetch(`${API_BASE_URL}/api/test/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        test: 'analysis',
        data: { text: 'This document discusses youth empowerment through education and community engagement.' }
      })
    });
    
    const analysisData = await analysisResponse.json();
    results.push({
      name: 'Document Analysis',
      passed: analysisData.success,
      message: analysisData.success 
        ? '✅ Document analysis working' 
        : `❌ Document analysis failed: ${analysisData.error}`,
      details: analysisData.result
    });
  } catch (error) {
    results.push({
      name: 'Document Analysis',
      passed: false,
      message: `❌ Failed to test analysis: ${error}`,
      details: { error: String(error) }
    });
  }

  // Test 4: Test embedding generation
  console.log('\n4️⃣  Testing embedding generation...');
  try {
    const embeddingResponse = await fetch(`${API_BASE_URL}/api/test/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        test: 'embedding',
        data: { text: 'Community development and social impact' }
      })
    });
    
    const embeddingData = await embeddingResponse.json();
    results.push({
      name: 'Embedding Generation',
      passed: embeddingData.success,
      message: embeddingData.success 
        ? `✅ Embeddings working (dimension: ${embeddingData.embeddingLength})` 
        : `❌ Embedding generation failed: ${embeddingData.error}`,
      details: embeddingData
    });
  } catch (error) {
    results.push({
      name: 'Embedding Generation',
      passed: false,
      message: `❌ Failed to test embeddings: ${error}`,
      details: { error: String(error) }
    });
  }

  // Test 5: Test cost estimation
  console.log('\n5️⃣  Testing cost estimation...');
  try {
    const costResponse = await fetch(`${API_BASE_URL}/api/test/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        test: 'cost',
        data: { words: 25000, profile: 'standard-analysis' }
      })
    });
    
    const costData = await costResponse.json();
    results.push({
      name: 'Cost Estimation',
      passed: costData.success,
      message: costData.success 
        ? `✅ Cost estimation working ($${costData.estimate?.total} for 25k words)` 
        : `❌ Cost estimation failed`,
      details: costData.estimate
    });
  } catch (error) {
    results.push({
      name: 'Cost Estimation',
      passed: false,
      message: `❌ Failed to test cost estimation: ${error}`,
      details: { error: String(error) }
    });
  }

  // Test 6: Check Redis connection (disabled for serverless deployment)
  console.log('\n6️⃣  Checking Redis connection...');
  console.log('⚠️  Redis connection disabled for serverless deployment');
  // if (process.env.REDIS_HOST || process.env.REDIS_URL) {
  //   try {
  //     const Redis = (await import('ioredis')).default;
  //     const redis = new Redis({
  //       host: process.env.REDIS_HOST,
  //       port: parseInt(process.env.REDIS_PORT || '6379'),
  //       password: process.env.REDIS_PASSWORD
  //     });
  //     
  //     await redis.ping();
  //     results.push({
  //       name: 'Redis Connection',
  //       passed: true,
  //       message: '✅ Redis connection successful',
  //       details: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }
  //     });
  //     
  //     await redis.disconnect();
  //   } catch (error) {
  //     results.push({
  //       name: 'Redis Connection',
  //       passed: false,
  //       message: `⚠️  Redis connection failed (optional): ${error}`,
  //       details: { error: String(error) }
  //     });
  //   }
  // } else {
  results.push({
    name: 'Redis Connection',
    passed: true,
    message: 'ℹ️  Redis disabled for serverless deployment',
    details: { configured: false }
  });
  // }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    console.log(`   ${result.message}`);
    if (!result.passed && result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`\n🏁 Tests completed: ${passed}/${total} passed\n`);

  // Recommendations
  if (passed < total) {
    console.log('💡 Recommendations:\n');
    
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.log('1. Add an AI API key to .env.local:');
      console.log('   OPENAI_API_KEY=sk-...');
      console.log('   # OR');
      console.log('   ANTHROPIC_API_KEY=sk-ant-...\n');
    }
    
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      console.log('2. (Optional) Set up Redis for background processing:');
      console.log('   brew install redis');
      console.log('   brew services start redis\n');
    }
    
    console.log('3. Run the development server:');
    console.log('   npm run dev\n');
  } else {
    console.log('🎉 All tests passed! Your AI setup is ready.\n');
    console.log('Next steps:');
    console.log('1. Upload a document with AI analysis enabled');
    console.log('2. Try semantic search on your documents');
    console.log('3. Monitor costs at /api/ai/config\n');
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});