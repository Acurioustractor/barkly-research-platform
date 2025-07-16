#!/usr/bin/env node

// Script to reprocess a stuck document
const fetch = require('node-fetch');

async function reprocessDocument(documentId) {
  try {
    console.log(`Starting reprocessing for document: ${documentId}`);
    
    // Trigger reprocessing via the systems reprocessing endpoint
    const response = await fetch(`http://localhost:3001/api/documents/reprocess-systems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: documentId,
        forceReprocess: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Reprocessing response:', result);

    // Check document status after reprocessing
    setTimeout(async () => {
      const statusResponse = await fetch(`http://localhost:3001/api/documents/${documentId}`);
      if (statusResponse.ok) {
        const doc = await statusResponse.json();
        console.log('Updated document status:', {
          id: doc.document.id,
          status: doc.document.status,
          themes: doc.document.themes.length,
          quotes: doc.document.quotes.length,
          insights: doc.document.insights.length
        });
      }
    }, 5000);

  } catch (error) {
    console.error('Reprocessing failed:', error.message);
  }
}

// Run the reprocessing
const documentId = 'cmd574doo0024lud14xixnwhf';
reprocessDocument(documentId);