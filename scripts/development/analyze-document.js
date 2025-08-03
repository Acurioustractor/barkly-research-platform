#!/usr/bin/env node

/**
 * Document Analysis Script
 * Uploads document with AI analysis enabled and tracks progress
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const API_BASE = 'http://localhost:3001';
const DOCUMENT_PATH = './docs/Report on the Second TC Youth Roundtable April 16 2025.pdf';

// Check if document exists
if (!fs.existsSync(DOCUMENT_PATH)) {
  console.error('❌ Document not found:', DOCUMENT_PATH);
  process.exit(1);
}

console.log('🚀 Starting document analysis...');
console.log('📄 Document:', DOCUMENT_PATH);

// Use the bulk-upload endpoint with AI enabled
const uploadWithAI = () => {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-X', 'POST',
      `${API_BASE}/api/documents/bulk-upload`,
      '-F', `files=@${DOCUMENT_PATH}`,
      '-F', 'useAI=true',
      '-F', 'generateSummary=true', 
      '-F', 'generateEmbeddings=false',
      '-F', 'source=youth_research',
      '-F', 'category=roundtable_report',
      '-F', 'profile=claude-standard'
    ];

    console.log('📤 Uploading document with AI analysis enabled...');
    
    const curl = spawn('curl', curlArgs);
    let output = '';
    let error = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.stderr.on('data', (data) => {
      error += data.toString();
    });

    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          console.log('Raw output:', output);
          reject(new Error('Failed to parse response: ' + e.message));
        }
      } else {
        reject(new Error(`Upload failed with code ${code}: ${error}`));
      }
    });
  });
};

// Check analysis results
const checkAnalysis = async () => {
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', ['-s', `${API_BASE}/api/documents/insights`]);
    let output = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse insights: ' + e.message));
        }
      } else {
        reject(new Error(`Analysis check failed with code ${code}`));
      }
    });
  });
};

// Main execution
(async () => {
  try {
    // Upload document
    const uploadResult = await uploadWithAI();
    console.log('✅ Upload completed');
    console.log('📊 Results:', JSON.stringify(uploadResult.summary, null, 2));
    
    if (uploadResult.summary.successful > 0) {
      console.log('\n⏳ Waiting for AI analysis to complete...');
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check analysis results
      const analysis = await checkAnalysis();
      console.log('\n🎯 Analysis Results:');
      console.log('📈 Statistics:', JSON.stringify(analysis.statistics, null, 2));
      console.log('🎨 Themes found:', analysis.themes.length);
      console.log('💬 Quotes found:', analysis.quotes.length);
      console.log('💡 Insights found:', analysis.insights.length);
      console.log('🔑 Keywords found:', analysis.keywords.length);
      
      if (analysis.themes.length > 0) {
        console.log('\n🎨 Sample Themes:');
        analysis.themes.slice(0, 3).forEach((theme, i) => {
          console.log(`  ${i + 1}. ${theme.theme} (confidence: ${theme.confidence})`);
        });
      }
      
      if (analysis.quotes.length > 0) {
        console.log('\n💬 Sample Quotes:');
        analysis.quotes.slice(0, 2).forEach((quote, i) => {
          console.log(`  ${i + 1}. "${quote.text.substring(0, 100)}..." (${quote.speaker || 'Unknown speaker'})`);
        });
      }
      
      console.log('\n🎉 Analysis complete! Visit http://localhost:3001/insights to explore the results.');
      
    } else {
      console.log('⚠️ Upload failed. Check the logs for details.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();