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
      // Delete chunks first (they reference documents)
      const chunksDeleted = await tx.chunk.deleteMany({});
      console.log(`[ADMIN] Deleted ${chunksDeleted.count} chunks`);

      // Delete themes (they reference documents)
      const themesDeleted = await tx.theme.deleteMany({});
      console.log(`[ADMIN] Deleted ${themesDeleted.count} themes`);

      // Delete insights (they reference documents) 
      const insightsDeleted = await tx.insight.deleteMany({});
      console.log(`[ADMIN] Deleted ${insightsDeleted.count} insights`);

      // Delete entity relationships
      const relationshipsDeleted = await tx.entityRelationship.deleteMany({});
      console.log(`[ADMIN] Deleted ${relationshipsDeleted.count} entity relationships`);

      // Delete entities
      const entitiesDeleted = await tx.entity.deleteMany({});
      console.log(`[ADMIN] Deleted ${entitiesDeleted.count} entities`);

      // Delete documents last
      const documentsDeleted = await tx.document.deleteMany({});
      console.log(`[ADMIN] Deleted ${documentsDeleted.count} documents`);

      return {
        chunks: chunksDeleted.count,
        themes: themesDeleted.count,
        insights: insightsDeleted.count,
        relationships: relationshipsDeleted.count,
        entities: entitiesDeleted.count,
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
      prisma.chunk.count(),
      prisma.theme.count(),
      prisma.insight.count(),
      prisma.entity.count(),
      prisma.entityRelationship.count()
    ]);

    return NextResponse.json({
      current_data: {
        documents: counts[0],
        chunks: counts[1],
        themes: counts[2],
        insights: counts[3],
        entities: counts[4],
        relationships: counts[5]
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