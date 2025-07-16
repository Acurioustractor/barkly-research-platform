/**
 * Simple test script to verify Moonshot API integration
 * Run with: node test-moonshot.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Set up environment variables for testing
if (!process.env.MOONSHOT_API_KEY) {
  console.log('⚠️  MOONSHOT_API_KEY not set. Please set your Moonshot API key:');
  console.log('   export MOONSHOT_API_KEY=sk-...');
  console.log('   Or add it to your .env.local file');
  process.exit(1);
}

// Import the Moonshot client
const { MoonshotClient } = require('./src/lib/moonshot-client.ts');

async function testMoonshotIntegration() {
  console.log('🌙 Testing Moonshot API integration...\n');

  try {
    // Initialize client
    const client = new MoonshotClient({
      apiKey: process.env.MOONSHOT_API_KEY,
      timeout: 30000, // 30 seconds
      maxRetries: 1
    });

    console.log('✅ Moonshot client initialized');

    // Test simple completion
    const testPrompt = `Analyze this sample text and extract key themes:

"Youth in the Barkly region face unique challenges and opportunities. Education access varies greatly between remote communities and town centers. Traditional knowledge systems offer valuable insights for modern challenges. Technology could bridge gaps but infrastructure remains a barrier."

Respond in JSON format with themes, quotes, and insights.`;

    console.log('📤 Sending test request to Moonshot API...');

    const response = await client.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: 'You are a document analyst. Respond with valid JSON only.' },
        { role: 'user', content: testPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    console.log('📥 Response received from Moonshot API');
    console.log('🔍 Usage:', response.usage);
    console.log('💬 Content preview:', response.choices[0]?.message?.content?.substring(0, 200) + '...');

    // Test JSON parsing
    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        console.log('✅ JSON parsing successful');
        console.log('📊 Parsed structure keys:', Object.keys(parsed));
      } catch (parseError) {
        console.log('⚠️  JSON parsing failed, but API call succeeded');
        console.log('Raw content:', content);
      }
    }

    console.log('\n🎉 Moonshot integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set MOONSHOT_API_KEY in your .env.local file');
    console.log('2. Choose a Moonshot processing profile in the admin panel');
    console.log('3. Upload documents for processing');

  } catch (error) {
    console.error('❌ Moonshot integration test failed:');
    console.error(error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Check your API key is valid');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Request timed out - API may be slow');
    } else if (error.message.includes('rate limit')) {
      console.log('\n💡 Rate limited - wait a moment and try again');
    }
  }
}

// Run the test
testMoonshotIntegration();