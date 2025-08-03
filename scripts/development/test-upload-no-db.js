/**
 * Test upload without database dependency
 */

const fs = require('fs');
const path = require('path');

async function testUploadNoDb() {
  try {
    console.log('🧪 Testing upload without database...');
    
    // Test the GET endpoint first
    const getResponse = await fetch('http://localhost:3000/api/documents/test-upload');
    const getResult = await getResponse.json();
    
    console.log('✅ GET endpoint working:', getResult);
    
    // Create a simple test PDF content (this won't be a real PDF, just for testing)
    const testContent = `%PDF-1.4
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
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello World Test Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;

    // Test file upload with mock PDF
    const formData = new FormData();
    const blob = new Blob([testContent], { type: 'application/pdf' });
    formData.append('files', blob, 'test-document.pdf');
    
    console.log('📤 Uploading test document...');
    
    const uploadResponse = await fetch('http://localhost:3000/api/documents/test-upload', {
      method: 'POST',
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (uploadResponse.ok) {
      console.log('✅ Upload test successful!');
      console.log('📊 Results:', JSON.stringify(uploadResult, null, 2));
    } else {
      console.log('❌ Upload test failed:');
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
testUploadNoDb();