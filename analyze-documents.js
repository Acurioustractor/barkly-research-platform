#!/usr/bin/env node

/**
 * Document Analysis Script - Analyze what documents we have and their processing status
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DOCUMENT ANALYSIS REPORT');
console.log('='.repeat(50));

// 1. Check available test documents
console.log('\n📄 AVAILABLE TEST DOCUMENTS:');
const testDocsDir = './test-documents';
if (fs.existsSync(testDocsDir)) {
  const files = fs.readdirSync(testDocsDir);
  files.forEach(file => {
    const filepath = path.join(testDocsDir, file);
    const stats = fs.statSync(filepath);
    console.log(`  📄 ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
} else {
  console.log('  ❌ Test documents directory not found');
}

// 2. Check processing utilities
console.log('\n🛠️  PROCESSING UTILITIES:');
const utilsDir = './src/utils';
if (fs.existsSync(utilsDir)) {
  const files = fs.readdirSync(utilsDir);
  const processors = files.filter(f => f.includes('process') && f.endsWith('.ts'));
  processors.forEach(file => {
    console.log(`  🔧 ${file}`);
  });
} else {
  console.log('  ❌ Utils directory not found');
}

// 3. Check API endpoints
console.log('\n🌐 API ENDPOINTS:');
const checkAPI = async (endpoint, description) => {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`);
    const status = response.status;
    console.log(`  ${status === 200 ? '✅' : '❌'} ${endpoint} (${status}) - ${description}`);
    
    if (status === 200 && endpoint.includes('documents') && !endpoint.includes('upload')) {
      try {
        const data = await response.json();
        if (data.documents) {
          console.log(`    📊 Found ${data.documents.length} documents`);
        } else if (data.statistics) {
          console.log(`    📊 Statistics: ${JSON.stringify(data.statistics)}`);
        }
      } catch (e) {
        console.log(`    ⚠️  Could not parse response`);
      }
    }
  } catch (error) {
    console.log(`  ❌ ${endpoint} - Connection failed`);
  }
};

// 4. Check database schema files
console.log('\n🗄️  DATABASE SCHEMA:');
const dbSetupDir = './database-setup';
if (fs.existsSync(dbSetupDir)) {
  const files = fs.readdirSync(dbSetupDir);
  const docSchemas = files.filter(f => f.includes('document') && f.endsWith('.sql'));
  docSchemas.forEach(file => {
    console.log(`  📋 ${file}`);
  });
} else {
  console.log('  ❌ Database setup directory not found');
}

// 5. Analyze document content
console.log('\n📖 SAMPLE DOCUMENT CONTENT:');
const sampleDoc = './test-documents/sample-youth-research.md';
if (fs.existsSync(sampleDoc)) {
  const content = fs.readFileSync(sampleDoc, 'utf8');
  
  // Extract potential services/insights
  const lines = content.split('\n');
  const insights = [];
  const quotes = [];
  
  lines.forEach(line => {
    // Look for quotes
    if (line.includes('"') && (line.includes('said') || line.includes('explains') || line.includes('states'))) {
      quotes.push(line.trim());
    }
    // Look for service-related content
    if (line.toLowerCase().includes('program') || 
        line.toLowerCase().includes('service') || 
        line.toLowerCase().includes('centre') ||
        line.toLowerCase().includes('support')) {
      insights.push(line.trim());
    }
  });
  
  console.log(`  📄 Sample document: ${sampleDoc}`);
  console.log(`  📏 Length: ${content.length} characters`);
  console.log(`  📝 Lines: ${lines.length}`);
  console.log(`  💬 Potential quotes found: ${quotes.length}`);
  console.log(`  🎯 Service-related insights: ${insights.length}`);
  
  if (quotes.length > 0) {
    console.log('\n  🗣️  SAMPLE QUOTES:');
    quotes.slice(0, 2).forEach((quote, i) => {
      console.log(`    ${i + 1}. ${quote.substring(0, 100)}...`);
    });
  }
  
  if (insights.length > 0) {
    console.log('\n  💡 SAMPLE INSIGHTS:');
    insights.slice(0, 3).forEach((insight, i) => {
      console.log(`    ${i + 1}. ${insight.substring(0, 80)}...`);
    });
  }
} else {
  console.log('  ❌ Sample document not found');
}

// Main execution
(async () => {
  console.log('\n🔗 CHECKING API CONNECTIVITY:');
  await checkAPI('/api/documents', 'Documents list');
  await checkAPI('/api/documents/insights', 'Document insights');
  await checkAPI('/api/services', 'Services (current)');
  await checkAPI('/api/services/test', 'Services (test)');
  
  console.log('\n📋 NEXT STEPS RECOMMENDATIONS:');
  console.log('1. ✅ Test document content looks rich for processing');
  console.log('2. 🔧 Need to check database connectivity and schema');
  console.log('3. 📤 Process sample-youth-research.pdf to generate real insights');
  console.log('4. 🗺️  Connect processed insights to services map');
  console.log('5. 🎯 Validate document → service transformation quality');
  
  console.log('\n🎯 IMMEDIATE ACTION:');
  console.log('Run: node simple-document-process.js');
  console.log('This will process the sample document and show real insights');
})();