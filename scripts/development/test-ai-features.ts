import { config } from 'dotenv';
config({ path: '.env.local' });

async function testAIFeatures() {
  console.log('Testing AI Features...\n');

  // Test AI Config
  console.log('1. Testing AI Configuration API:');
  try {
    const configResponse = await fetch('http://localhost:3000/api/ai/config');
    const configData = await configResponse.json();
    console.log('✓ AI Config loaded:', {
      currentModel: configData.currentModel,
      currentProfile: configData.currentProfile,
      providers: Object.keys(configData.providers || {})
    });
  } catch (error) {
    console.error('✗ AI Config failed:', error);
  }

  // Test Document Insights
  console.log('\n2. Testing Document Insights API:');
  try {
    const insightsResponse = await fetch('http://localhost:3000/api/documents/insights');
    const insightsData = await insightsResponse.json();
    console.log('✓ Insights loaded:', {
      themes: insightsData.themes?.length || 0,
      insights: insightsData.insights?.length || 0,
      quotes: insightsData.quotes?.length || 0,
      keywords: insightsData.keywords?.length || 0
    });
  } catch (error) {
    console.error('✗ Insights failed:', error);
  }

  // Test Metrics
  console.log('\n3. Testing Metrics API:');
  try {
    const metricsResponse = await fetch('http://localhost:3000/api/documents/metrics?days=7');
    const metricsData = await metricsResponse.json();
    console.log('✓ Metrics loaded:', {
      totalDocuments: metricsData.summary?.totalDocuments || 0,
      totalChunks: metricsData.summary?.totalChunks || 0,
      totalThemes: metricsData.summary?.totalThemes || 0,
      successRate: metricsData.summary?.successRate || 0
    });
  } catch (error) {
    console.error('✗ Metrics failed:', error);
  }

  // Test Network
  console.log('\n4. Testing Document Network API:');
  try {
    const networkResponse = await fetch('http://localhost:3000/api/documents/network');
    const networkData = await networkResponse.json();
    console.log('✓ Network loaded:', {
      nodes: networkData.nodes?.length || 0,
      links: networkData.links?.length || 0
    });
  } catch (error) {
    console.error('✗ Network failed:', error);
  }

  console.log('\n✅ AI Features test complete!');
}

// Run tests
testAIFeatures().catch(console.error);