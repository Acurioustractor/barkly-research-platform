/**
 * Script to reprocess existing documents with systems extraction enabled
 */

import { PrismaClient } from '@prisma/client';
import { extractSystemsFromDocument, storeSystemsData } from '../src/lib/systems-extraction-service.js';

const prisma = new PrismaClient();

async function reprocessDocumentsWithSystems() {
  console.log('🔄 Starting systems extraction for existing documents...');
  
  try {
    // Get all completed documents
    const documents = await prisma.document.findMany({
      where: {
        status: 'COMPLETED',
        fullText: {
          not: null
        }
      },
      select: {
        id: true,
        originalName: true,
        fullText: true,
        size: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    console.log(`📄 Found ${documents.length} documents to reprocess`);

    if (documents.length === 0) {
      console.log('ℹ️  No completed documents found to reprocess');
      return;
    }

    const processor = new AIEnhancedDocumentProcessor();

    // Process each document
    let processed = 0;
    for (const doc of documents) {
      console.log(`\n🔄 Processing: ${doc.originalName}`);
      
      try {
        // Create a buffer from the full text (simulating PDF processing)
        const textBuffer = Buffer.from(doc.fullText || '', 'utf-8');
        
        // Extract systems data using the existing chunks and full text
        
        // Get existing chunks for this document
        const chunks = await prisma.documentChunk.findMany({
          where: { documentId: doc.id },
          select: { id: true, text: true },
          orderBy: { chunkIndex: 'asc' }
        });

        if (chunks.length === 0) {
          console.log(`⚠️  No chunks found for ${doc.originalName}, skipping...`);
          continue;
        }

        console.log(`📋 Processing ${chunks.length} chunks for systems extraction...`);
        
        // Extract systems data
        const { entities, relationships } = await extractSystemsFromDocument(
          doc.id,
          chunks
        );
        
        // Store the extracted systems data
        await storeSystemsData(doc.id, entities, relationships);
        
        // Update document with systems metadata
        const systemsMetadata = {
          entitiesCount: entities.size,
          relationshipsCount: relationships.length,
          extractedAt: new Date().toISOString(),
          confidence: 0.8
        };
        
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            systemsMetadata: systemsMetadata
          }
        });

        processed++;
        console.log(`✅ Successfully processed ${doc.originalName}`);
        console.log(`   Entities: ${entities.size}, Relationships: ${relationships.length}`);
        
      } catch (error) {
        console.error(`❌ Failed to process ${doc.originalName}:`, error.message);
      }
    }

    console.log(`\n🎉 Reprocessing complete!`);
    console.log(`📊 Successfully processed: ${processed}/${documents.length} documents`);
    
    // Show summary
    const systemsCount = await prisma.systemEntity.count();
    const relationshipsCount = await prisma.systemRelationship.count();
    
    console.log(`\n📈 Systems Database Summary:`);
    console.log(`   Total Entities: ${systemsCount}`);
    console.log(`   Total Relationships: ${relationshipsCount}`);
    console.log(`\n🌐 View your systems map at: http://localhost:3000/systems`);
    console.log(`   Toggle to "Document Data" to see the extracted systems!`);

  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
reprocessDocumentsWithSystems()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });