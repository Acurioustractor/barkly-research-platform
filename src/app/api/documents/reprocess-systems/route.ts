import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { extractSystemsFromDocument, storeSystemsData } from '@/lib/systems-extraction-service';

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    console.log('🔄 Starting systems extraction for existing documents...');

    // Get all completed documents without systems data
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
        fullText: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    console.log(`📄 Found ${documents.length} documents to reprocess`);

    if (documents.length === 0) {
      return NextResponse.json({
        message: 'No completed documents found to reprocess',
        processed: 0,
        total: 0
      });
    }

    let processed = 0;
    let failed = 0;
    const results = [];

    // Process each document
    for (const doc of documents) {
      console.log(`\n🔄 Processing: ${doc.originalName}`);
      
      try {
        // Get existing chunks for this document
        const chunks = await prisma.documentChunk.findMany({
          where: { documentId: doc.id },
          select: { id: true, text: true },
          orderBy: { chunkIndex: 'asc' }
        });

        if (chunks.length === 0) {
          console.log(`⚠️  No chunks found for ${doc.originalName}, skipping...`);
          results.push({
            document: doc.originalName,
            status: 'skipped',
            reason: 'No chunks found'
          });
          continue;
        }

        console.log(`📋 Processing ${chunks.length} chunks for systems extraction...`);
        
        // Extract systems data
        const { entities, relationships } = await extractSystemsFromDocument(
          doc.id,
          chunks
        );
        
        if (entities.size === 0 && relationships.length === 0) {
          console.log(`⚠️  No systems data extracted from ${doc.originalName}`);
          results.push({
            document: doc.originalName,
            status: 'no_data',
            entities: 0,
            relationships: 0
          });
          continue;
        }
        
        // Store the extracted systems data
        await storeSystemsData(doc.id, entities, relationships);
        
        // Update document with systems metadata
        const systemsMetadata = {
          entitiesCount: entities.size,
          relationshipsCount: relationships.length,
          extractedAt: new Date().toISOString(),
          confidence: 0.8,
          services: [],
          outcomes: [],
          barriers: [],
          relationships: []
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
        
        results.push({
          document: doc.originalName,
          status: 'success',
          entities: entities.size,
          relationships: relationships.length
        });
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed to process ${doc.originalName}:`, error);
        results.push({
          document: doc.originalName,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Get final counts
    const systemsCount = await prisma.systemEntity.count();
    const relationshipsCount = await prisma.systemRelationship.count();
    
    console.log(`\n🎉 Reprocessing complete!`);
    console.log(`📊 Successfully processed: ${processed}/${documents.length} documents`);
    console.log(`📈 Systems Database Summary:`);
    console.log(`   Total Entities: ${systemsCount}`);
    console.log(`   Total Relationships: ${relationshipsCount}`);

    return NextResponse.json({
      message: 'Reprocessing complete',
      summary: {
        total: documents.length,
        processed,
        failed,
        totalEntities: systemsCount,
        totalRelationships: relationshipsCount
      },
      results
    });

  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
    return NextResponse.json(
      { error: 'Failed to reprocess documents', details: error },
      { status: 500 }
    );
  }
}