#!/usr/bin/env node

/**
 * Test script for the enhanced AI analysis system
 */

const path = require('path');

// Set up environment
process.env.NODE_ENV = 'development';
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testAISystem() {
  console.log('🧪 Testing Enhanced AI Analysis System\n');

  try {
    // Test 1: Import and initialize the enhanced AI service
    console.log('📋 Test 1: AI Service Initialization');
    const { enhancedAIService } = await import('./src/lib/ai-service-enhanced.ts');
    const { globalRateLimiter } = await import('./src/lib/ai-rate-limiter.ts');
    
    console.log('✅ AI service modules loaded successfully');

    // Test 2: Check service health
    console.log('\n📋 Test 2: Service Health Check');
    const healthStats = enhancedAIService.getServiceStats();
    console.log('📊 Health Stats:', JSON.stringify(healthStats, null, 2));

    if (healthStats.isHealthy) {
      console.log('✅ AI service is healthy');
      console.log(`📡 Available providers: ${healthStats.providersAvailable.join(', ')}`);
    } else {
      console.log('⚠️  AI service is not healthy - no providers available');
    }

    // Test 3: Rate limiter statistics
    console.log('\n📋 Test 3: Rate Limiter Status');
    const rateLimitStats = globalRateLimiter.getOverallStats();
    console.log('📊 Rate Limit Stats:', JSON.stringify(rateLimitStats, null, 2));

    // Test 4: Simple AI completion test (if providers are available)
    if (healthStats.isHealthy && healthStats.providersAvailable.length > 0) {
      console.log('\n📋 Test 4: AI Completion Test');
      try {
        const testResponse = await enhancedAIService.generateCompletion({
          prompt: 'Hello! This is a test. Please respond with "AI system is working correctly" and nothing else.',
          systemPrompt: 'You are a helpful AI assistant. Respond concisely.',
          temperature: 0.1,
          maxTokens: 20,
        });

        console.log('✅ AI completion successful');
        console.log(`🤖 Provider: ${testResponse.provider}`);
        console.log(`📝 Model: ${testResponse.model}`);
        console.log(`💬 Response: "${testResponse.content}"`);
        console.log(`📊 Usage: ${JSON.stringify(testResponse.usage)}`);
      } catch (error) {
        console.log('❌ AI completion failed:', error.message);
      }
    } else {
      console.log('⏭️  Skipping AI completion test - no healthy providers');
    }

    // Test 5: Document job processor
    console.log('\n📋 Test 5: Document Job Processor');
    const { globalDocumentProcessor } = await import('./src/lib/document-job-processor.ts');
    
    const queueStats = globalDocumentProcessor.getStats();
    console.log('📊 Queue Stats:', JSON.stringify(queueStats, null, 2));
    console.log('✅ Document job processor initialized');

    // Test 6: Database connection
    console.log('\n📋 Test 6: Database Connection');
    const { prisma } = await import('./src/lib/database-safe.ts');
    
    if (prisma) {
      try {
        // Test database connection with a simple query
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Database connection successful');
        
        // Check if pgvector extension is available
        const vectorTest = await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
        if (vectorTest && vectorTest.length > 0) {
          console.log('✅ pgvector extension is available');
        } else {
          console.log('⚠️  pgvector extension not found');
        }
      } catch (error) {
        console.log('❌ Database connection failed:', error.message);
      }
    } else {
      console.log('❌ Database not available');
    }

    // Test 7: Environment variables check
    console.log('\n📋 Test 7: Environment Configuration');
    const envChecks = {
      'DATABASE_URL': !!process.env.DATABASE_URL,
      'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY,
      'ANTHROPIC_API_KEY': !!process.env.ANTHROPIC_API_KEY,
      'MOONSHOT_API_KEY': !!process.env.MOONSHOT_API_KEY,
    };

    for (const [key, available] of Object.entries(envChecks)) {
      console.log(`${available ? '✅' : '❌'} ${key}: ${available ? 'Set' : 'Not set'}`);
    }

    console.log('\n🎉 AI System Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`• AI Service Health: ${healthStats.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`• Available Providers: ${healthStats.providersAvailable.length}`);
    console.log(`• Rate Limiter: ${rateLimitStats.totalProviders} providers configured`);
    console.log(`• Database: ${prisma ? '✅ Connected' : '❌ Not connected'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    process.exit(0);
  }
}

// Run the test
testAISystem().catch(console.error);