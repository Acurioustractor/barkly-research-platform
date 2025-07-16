#!/usr/bin/env node

// Script to trigger AI analysis for existing chunks
const fetch = require('node-fetch');

async function triggerAnalysis() {
  const documentId = 'cmd574doo0024lud14xixnwhf';
  
  try {
    console.log('🚀 Attempting to trigger AI analysis...');
    
    // Upload a small dummy file to trigger the processing queue
    // This should pick up any pending documents for analysis
    const formData = new FormData();
    const dummyPdf = new Blob(['%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'], 
                             { type: 'application/pdf' });
    formData.append('files', dummyPdf, 'trigger.pdf');
    formData.append('extractSystems', 'true');

    console.log('📤 Sending trigger request...');
    
    const response = await fetch('http://localhost:3001/api/documents/upload-sse', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Processing triggered successfully');
    console.log('⏳ This should process any pending documents in the queue');
    console.log('📊 Check your document status in a few minutes');

    // Monitor the original document
    setTimeout(async () => {
      console.log('🔍 Checking document status...');
      const statusResponse = await fetch('http://localhost:3001/api/documents');
      if (statusResponse.ok) {
        const docs = await statusResponse.json();
        const doc = docs.documents.find(d => d.id === documentId);
        if (doc) {
          console.log(`📄 ${doc.originalName}`);
          console.log(`📊 Status: ${doc.status}`);
          console.log(`🎯 Themes: ${doc._count.themes}`);
          console.log(`💬 Quotes: ${doc._count.insights}`);
        }
      }
    }, 10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

triggerAnalysis();