const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  const form = new FormData();
  
  // Use the sample document we already have
  const pdfPath = './test-documents/sample-youth-research.md';
  
  // Create a fake PDF buffer (just for testing)
  const content = 'Test document about youth leadership and community development.';
  const buffer = Buffer.from(content);
  
  // Create a blob-like object
  const file = new File([buffer], 'test.pdf', { type: 'application/pdf' });
  
  form.append('files', buffer, {
    filename: 'test.pdf',
    contentType: 'application/pdf'
  });
  form.append('source', 'test');
  form.append('category', 'general');
  form.append('tags', 'test');
  form.append('useAI', 'true');
  form.append('generateSummary', 'true');
  form.append('generateEmbeddings', 'true');

  try {
    const response = await fetch('http://localhost:3000/api/documents/bulk-upload', {
      method: 'POST',
      body: form
    });
    
    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    try {
      const json = JSON.parse(result);
      console.log('Parsed:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Not JSON:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testUpload();