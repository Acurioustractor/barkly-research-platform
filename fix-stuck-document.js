#!/usr/bin/env node

// Script to fix stuck document by manually updating status and triggering analysis
const { PrismaClient } = require('@prisma/client');

async function fixStuckDocument() {
  const prisma = new PrismaClient();
  const documentId = 'cmd574doo0024lud14xixnwhf';

  try {
    console.log('🔍 Checking document status...');
    
    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        chunks: true,
        themes: true,
        quotes: true,
        insights: true
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    console.log(`📄 Document: ${document.originalName}`);
    console.log(`📊 Current status: ${document.status}`);
    console.log(`🧩 Chunks: ${document.chunks.length}`);
    console.log(`🎯 Themes: ${document.themes.length}`);
    console.log(`💬 Quotes: ${document.quotes.length}`);
    console.log(`💡 Insights: ${document.insights.length}`);

    if (document.chunks.length > 0 && document.themes.length === 0) {
      console.log('🔧 Document appears to be stuck after chunking. Attempting to complete analysis...');
      
      // Update status to trigger reprocessing
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSING',
          processedAt: null,
          errorMessage: null
        }
      });

      console.log('✅ Reset document status to PROCESSING');
      console.log('💭 The document should now be picked up for AI analysis');
      console.log('⏳ Check the document status in a few minutes...');
      
      // Alternatively, let's try to trigger the analysis by updating the chunks
      const chunkCount = await prisma.documentChunk.count({
        where: { documentId }
      });
      
      if (chunkCount > 0) {
        console.log(`📝 Found ${chunkCount} chunks - document is ready for AI analysis`);
        console.log('🚀 You can now upload a new document or refresh the page to trigger the processing queue');
      }
      
    } else if (document.themes.length > 0) {
      console.log('✅ Document appears to be fully processed');
      
      // Update status to completed if we have themes
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });
      
      console.log('✅ Updated document status to COMPLETED');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixStuckDocument();