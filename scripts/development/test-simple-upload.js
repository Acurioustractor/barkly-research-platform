/**
 * Simple test script to check if the upload system is working
 * Run with: node test-simple-upload.js
 */

const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('🧪 Testing simple upload endpoint...');
    
    // Test the GET endpoint first
    const getResponse = await fetch('http://localhost:3000/api/documents/simple-upload');
    const getResult = await getResponse.json();
    
    console.log('✅ GET endpoint working:', getResult);
    
    // Check if we have a test PDF
    const testPdfPath = path.join(__dirname, 'test-document.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.log('⚠️  No test PDF found. Create a test-document.pdf file to test upload.');
      return;
    }
    
    // Test file upload
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(testPdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('files', blob, 'test-document.pdf');
    
    console.log('📤 Uploading test document...');
    
    const uploadResponse = await fetch('http://localhost:3000/api/documents/simple-upload', {
      method: 'POST',
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (uploadResponse.ok) {
      console.log('✅ Upload successful!');
      console.log('📊 Results:', uploadResult);
    } else {
      console.log('❌ Upload failed:');
      console.log(uploadResult);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Make sure the dev server is running: npm run dev');
    }
  }
}

// Run the test
testUpload();