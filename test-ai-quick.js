#!/usr/bin/env node

/**
 * Quick AI Analysis Test
 * Tests the new content analysis format
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAIAnalysis() {
  console.log('🧪 Testing AI Analysis API');
  console.log('='.repeat(50));
  
  try {
    const analysisRequest = {
      content: 'Young people in the Barkly region value education that connects to culture. They emphasize the importance of learning from elders and traditional knowledge. Mental health support and safe spaces are critical community needs.',
      analysisType: 'quick',
      options: {
        extractThemes: true,
        extractQuotes: true,
        extractInsights: true,
      },
    };
    
    console.log('📊 Testing AI analysis with new format...');
    const response = await fetch('http://localhost:3000/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisRequest),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ AI Analysis: Successful');
      console.log(`🎯 Themes extracted: ${result.themes?.length || 0}`);
      console.log(`💬 Quotes extracted: ${result.quotes?.length || 0}`);
      console.log(`💡 Insights generated: ${result.insights?.length || 0}`);
      
      if (result.themes && result.themes.length > 0) {
        console.log('\n🎯 Sample Theme:');
        const theme = result.themes[0];
        console.log(`   Title: ${theme.title}`);
        console.log(`   Category: ${theme.category}`);
        console.log(`   Confidence: ${theme.confidence}`);
      }
      
      if (result.quotes && result.quotes.length > 0) {
        console.log('\n💬 Sample Quote:');
        const quote = result.quotes[0];
        console.log(`   Text: "${quote.text}"`);
        console.log(`   Confidence: ${quote.confidence}`);
      }
      
      console.log('\n✅ AI Analysis API is working correctly!');
      
    } else {
      console.log('❌ AI Analysis: Failed');
      const error = await response.text();
      console.log(`Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAIAnalysis();