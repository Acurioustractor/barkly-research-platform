#!/usr/bin/env node

/**
 * Simple Upload Test
 */

const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:3000';

// Create a simple PDF test file
function createTestPDF() {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 120
>>
stream
BT
/F1 12 Tf
100 700 Td
(Young people in the Barkly region value education that connects to culture.) Tj
0 -20 Td
(They emphasize the importance of learning from elders and traditional knowledge.) Tj
0 -20 Td
(Mental health support and safe spaces are critical community needs.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;
  
  return Buffer.from(pdfContent);
}

async function testUpload() {
  console.log('🧪 Testing Document Upload');
  console.log('='.repeat(40));
  
  try {
    const formData = new FormData();
    const testPDF = createTestPDF();
    
    formData.append('file', testPDF, {
      filename: 'test-youth-research.pdf',
      contentType: 'application/pdf',
    });
    formData.append('category', 'research');
    formData.append('source', 'integration-test');
    formData.append('tags', 'youth,education,culture');
    
    console.log('📤 Uploading test document...');
    
    const response = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.text();
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📄 Response: ${result}`);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Upload successful!');
      console.log(`📄 Document ID: ${data.document.id}`);
      console.log(`📁 Filename: ${data.document.filename}`);
      console.log(`📊 Size: ${data.document.size} bytes`);
      console.log(`📄 Pages: ${data.document.pageCount}`);
      console.log(`📝 Words: ${data.document.wordCount}`);
    } else {
      console.log('❌ Upload failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();