import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    console.log('[ADMIN] Starting database cleanup...');

    // Clear all data in the correct order (respecting foreign key constraints)
    const deletionResults = await prisma.$transaction(async (tx) => {
      // Delete all child records first (they reference documents)
      const chunksDeleted = await tx.documentChunk.deleteMany({});
      console.log(`[ADMIN] Deleted ${chunksDeleted.count} document chunks`);

      const themesDeleted = await tx.documentTheme.deleteMany({});
      console.log(`[ADMIN] Deleted ${themesDeleted.count} document themes`);

      const quotesDeleted = await tx.documentQuote.deleteMany({});
      console.log(`[ADMIN] Deleted ${quotesDeleted.count} document quotes`);

      const insightsDeleted = await tx.documentInsight.deleteMany({});
      console.log(`[ADMIN] Deleted ${insightsDeleted.count} document insights`);

      const keywordsDeleted = await tx.documentKeyword.deleteMany({});
      console.log(`[ADMIN] Deleted ${keywordsDeleted.count} document keywords`);

      // Delete system relationships
      const systemRelationshipsDeleted = await tx.systemRelationship.deleteMany({});
      console.log(`[ADMIN] Deleted ${systemRelationshipsDeleted.count} system relationships`);

      // Delete system entities  
      const systemEntitiesDeleted = await tx.systemEntity.deleteMany({});
      console.log(`[ADMIN] Deleted ${systemEntitiesDeleted.count} system entities`);

      // Delete document entity relationships
      const docEntityRelationshipsDeleted = await tx.documentEntityRelationship.deleteMany({});
      console.log(`[ADMIN] Deleted ${docEntityRelationshipsDeleted.count} document entity relationships`);

      // Delete document entities
      const docEntitiesDeleted = await tx.documentEntity.deleteMany({});
      console.log(`[ADMIN] Deleted ${docEntitiesDeleted.count} document entities`);

      // Delete documents last
      const documentsDeleted = await tx.document.deleteMany({});
      console.log(`[ADMIN] Deleted ${documentsDeleted.count} documents`);

      return {
        chunks: chunksDeleted.count,
        themes: themesDeleted.count,
        quotes: quotesDeleted.count,
        insights: insightsDeleted.count,
        keywords: keywordsDeleted.count,
        systemRelationships: systemRelationshipsDeleted.count,
        systemEntities: systemEntitiesDeleted.count,
        docEntityRelationships: docEntityRelationshipsDeleted.count,
        docEntities: docEntitiesDeleted.count,
        documents: documentsDeleted.count
      };
    });

    console.log('[ADMIN] Database cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'All test data cleared successfully',
      deleted: deletionResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ADMIN] Database cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current data counts
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const counts = await Promise.all([
      prisma.document.count(),
      prisma.documentChunk.count(),
      prisma.documentTheme.count(),
      prisma.documentQuote.count(),
      prisma.documentInsight.count(),
      prisma.documentKeyword.count(),
      prisma.systemEntity.count(),
      prisma.systemRelationship.count(),
      prisma.documentEntity.count(),
      prisma.documentEntityRelationship.count()
    ]);

    return NextResponse.json({
      current_data: {
        documents: counts[0],
        chunks: counts[1],
        themes: counts[2],
        quotes: counts[3],
        insights: counts[4],
        keywords: counts[5],
        systemEntities: counts[6],
        systemRelationships: counts[7],
        docEntities: counts[8],
        docEntityRelationships: counts[9]
      },
      total_records: counts.reduce((sum, count) => sum + count, 0)
    });

  } catch (error) {
    console.error('[ADMIN] Data count error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get data counts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}