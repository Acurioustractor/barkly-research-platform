#!/usr/bin/env node

const fetch = require('node-fetch');

async function checkChunks() {
  const documentId = 'cmd574doo0024lud14xixnwhf';
  
  try {
    console.log('🔍 Checking document chunks...');
    
    const response = await fetch(`http://localhost:3001/api/documents/${documentId}?includeChunks=true&chunkLimit=5`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const doc = result.document;
    
    console.log(`📄 Document: ${doc.filename}`);
    console.log(`📊 Status: ${doc.status}`);
    console.log(`🧩 Total chunks: ${doc.chunkCount}`);
    console.log(`🎯 Themes: ${doc.themes.length}`);
    console.log(`💬 Quotes: ${doc.quotes.length}`);
    console.log(`💡 Insights: ${doc.insights.length}`);
    
    if (doc.chunks && doc.chunks.length > 0) {
      console.log('\n📝 Sample chunks:');
      doc.chunks.forEach((chunk, i) => {
        console.log(`\nChunk ${chunk.index + 1}:`);
        console.log(`Text: ${chunk.text.substring(0, 200)}...`);
        console.log(`Words: ${chunk.wordCount}`);
      });
      
      console.log(`\n✅ Document has ${doc.chunkCount} chunks and appears to be properly processed for text extraction.`);
      console.log('📊 The AI analysis phase (themes/quotes/insights) appears to have been skipped or failed.');
      console.log('🎯 You can view the document content by navigating to the document page in the web interface.');
    } else {
      console.log('❌ No chunks found - document processing may have failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkChunks();