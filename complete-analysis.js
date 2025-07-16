#!/usr/bin/env node

// Script to complete AI analysis for a stuck document
const fetch = require('node-fetch');

async function completeAnalysis(documentId) {
  try {
    console.log(`Starting AI analysis for document: ${documentId}`);
    
    // Use the AI analysis endpoint directly
    const response = await fetch(`http://localhost:3001/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: documentId,
        analysisType: 'complete'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Analysis response:', result);

    // Monitor progress
    let attempts = 0;
    const maxAttempts = 20;
    
    const checkProgress = async () => {
      attempts++;
      console.log(`Checking progress... (${attempts}/${maxAttempts})`);
      
      try {
        const statusResponse = await fetch(`http://localhost:3001/api/documents`);
        if (statusResponse.ok) {
          const docs = await statusResponse.json();
          const doc = docs.documents.find(d => d.id === documentId);
          
          if (doc) {
            console.log(`Status: ${doc.status}, Themes: ${doc._count.themes}, Insights: ${doc._count.insights}`);
            
            if (doc.status === 'COMPLETED' || doc._count.themes > 0) {
              console.log('✅ Analysis completed successfully!');
              return;
            }
          }
        }
      } catch (err) {
        console.log('Error checking status:', err.message);
      }
      
      if (attempts < maxAttempts) {
        setTimeout(checkProgress, 10000); // Check every 10 seconds
      } else {
        console.log('❌ Analysis timed out after maximum attempts');
      }
    };

    // Start monitoring
    setTimeout(checkProgress, 5000);

  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

// Run the analysis
const documentId = 'cmd574doo0024lud14xixnwhf';
completeAnalysis(documentId);