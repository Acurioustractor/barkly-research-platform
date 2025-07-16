#!/usr/bin/env node

/**
 * Basic Upload Test - No security middleware
 */

const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:3000';

// Create a simple test file
function createTestPDF() {
  return Buffer.from('Simple PDF test content');
}

async function testBasicUpload() {
  console.log('🧪 Testing Basic Upload (No Security)');
  console.log('====================================');
  
  try {
    // First test the AI endpoint to make sure server is working
    console.log('📊 Testing AI endpoint first...');
    const aiResponse = await fetch(`${API_BASE}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test content',
        analysisType: 'quick',
        options: { extractThemes: true }
      })
    });
    
    console.log(`AI Status: ${aiResponse.status}`);
    if (aiResponse.ok) {
      console.log('✅ AI endpoint working');
    } else {
      const error = await aiResponse.text();
      console.log('❌ AI endpoint error:', error.substring(0, 100));
    }
    
    // Now test upload
    console.log('\n📤 Testing upload endpoint...');
    const formData = new FormData();
    const testFile = createTestPDF();
    
    formData.append('file', testFile, {
      filename: 'test.pdf',
      contentType: 'application/pdf',
    });
    formData.append('category', 'test');
    
    const response = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      body: formData,
    });
    
    console.log(`Upload Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload successful');
      console.log(`Document ID: ${data.document?.id}`);
    } else {
      const error = await response.text();
      console.log('❌ Upload failed');
      console.log('Error details:', error.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicUpload();