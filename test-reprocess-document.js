#!/usr/bin/env node

/**
 * Test script to reprocess an existing document with AI analysis
 */

const path = require('path');

// Set up environment
process.env.NODE_ENV = 'development';
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function reprocessDocument() {
  console.log('🔄 Testing Document Reprocessing with AI Analysis\n');

  const documentId = 'cmd574doo0024lud14xixnwhf'; // The existing document
  
  try {
    // Test the reprocessing endpoint
    const response = await fetch('http://localhost:3002/api/documents/reprocess-systems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: documentId,
        processingType: 'world-class', // Use the most comprehensive analysis
        useAI: true,
        generateSummary: true,
        generateEmbeddings: true,
        extractEntities: true,
        generateInsights: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Reprocessing request successful');
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.jobId) {
      console.log(`\n🎯 Job ID: ${result.jobId}`);
      console.log('📺 You can monitor progress at:');
      console.log(`   - Job status: http://localhost:3002/api/jobs?action=job&jobId=${result.jobId}`);
      console.log(`   - Real-time stream: http://localhost:3002/api/jobs/stream?jobId=${result.jobId}`);
      console.log(`   - Document page: http://localhost:3002/documents/${documentId}`);

      // Monitor the job progress
      console.log('\n⏳ Monitoring job progress...');
      await monitorJob(result.jobId);
    }

  } catch (error) {
    console.error('❌ Reprocessing failed:', error.message);
  }
}

async function monitorJob(jobId) {
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 5 minutes (30 * 10 seconds)

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:3002/api/jobs?action=job&jobId=${jobId}`);
      const result = await response.json();

      if (result.job) {
        const { status, progress, error } = result.job;
        process.stdout.write(`\r🔄 Status: ${status.toUpperCase()} | Progress: ${progress}%`);

        if (status === 'completed') {
          console.log('\n✅ Job completed successfully!');
          console.log('🎉 Check the Research Insights page for new themes and quotes');
          break;
        } else if (status === 'failed') {
          console.log(`\n❌ Job failed: ${error}`);
          break;
        }
      } else {
        console.log('\n❓ Job not found');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    } catch (error) {
      console.log(`\n❌ Error monitoring job: ${error.message}`);
      break;
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n⏰ Monitoring timeout reached');
  }
}

reprocessDocument().catch(console.error);