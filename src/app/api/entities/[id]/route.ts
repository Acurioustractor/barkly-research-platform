import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const includeRelated = searchParams.get('includeRelated') === 'true';
    const includeSimilar = searchParams.get('includeSimilar') === 'true';
    const includeDocuments = searchParams.get('includeDocuments') === 'true';

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get the main entity
    const entity = await prisma.documentEntity.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            filename: true,
            uploadedAt: true,
            pageCount: true,
            wordCount: true,
            summary: true
          }
        }
      }
    });

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Get related entities (entities in the same document)
    let relatedEntities: any[] = [];
    if (includeRelated) {
      relatedEntities = await prisma.documentEntity.findMany({
        where: {
          documentId: entity.documentId,
          id: { not: entity.id }
        },
        orderBy: { confidence: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          confidence: true,
          context: true
        }
      });
    }

    // Get similar entities (same name, different documents)
    let similarEntities: any[] = [];
    if (includeSimilar) {
      similarEntities = await prisma.documentEntity.findMany({
        where: {
          name: entity.name,
          id: { not: entity.id }
        },
        orderBy: { confidence: 'desc' },
        take: 10,
        include: {
          document: {
            select: {
              id: true,
              originalName: true,
              filename: true,
              uploadedAt: true
            }
          }
        }
      });
    }

    // Get all documents containing this entity name
    let documentOccurrences: any[] = [];
    if (includeDocuments) {
      documentOccurrences = await prisma.documentEntity.findMany({
        where: {
          name: entity.name
        },
        include: {
          document: {
            select: {
              id: true,
              originalName: true,
              filename: true,
              uploadedAt: true,
              pageCount: true,
              wordCount: true
            }
          }
        },
        orderBy: { confidence: 'desc' }
      });
    }

    // Get entity statistics
    const entityStats = await getEntityStatistics(entity.name, entity.type);

    // Get co-occurring entities
    const coOccurringEntities = await getCoOccurringEntities(entity.documentId, entity.id, 5);

    logger.info('Entity details retrieved', {
      entityId: id,
      entityName: entity.name,
      entityType: entity.type,
      includeRelated,
      includeSimilar,
      includeDocuments
    });

    return NextResponse.json({
      entity,
      relatedEntities,
      similarEntities,
      documentOccurrences,
      coOccurringEntities,
      statistics: entityStats,
      metadata: {
        includeRelated,
        includeSimilar,
        includeDocuments,
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Entity details error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch entity details' },
      { status: 500 }
    );
  }
}

/**
 * Get comprehensive statistics for an entity
 */
async function getEntityStatistics(entityName: string, entityType: string) {
  if (!prisma) return null;

  try {
    // Total occurrences
    const totalOccurrences = await prisma.documentEntity.count({
      where: { name: entityName }
    });

    // Unique documents
    const uniqueDocuments = await prisma.documentEntity.findMany({
      where: { name: entityName },
      select: { documentId: true },
      distinct: ['documentId']
    });

    // Confidence statistics
    const confidenceStats = await prisma.documentEntity.aggregate({
      where: { name: entityName },
      _avg: { confidence: true },
      _max: { confidence: true },
      _min: { confidence: true }
    });

    // Type distribution for this entity name
    const typeDistribution = await prisma.documentEntity.groupBy({
      by: ['type'],
      where: { name: entityName },
      _count: { type: true }
    });

    // Recent occurrences (last 30 days)
    const recentOccurrences = await prisma.documentEntity.count({
      where: {
        name: entityName,
        document: {
          uploadedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }
    });

    // Similar entities of the same type
    const similarTypeEntities = await prisma.documentEntity.findMany({
      where: {
        type: entityType,
        name: { not: entityName }
      },
      select: { name: true },
      distinct: ['name'],
      take: 10,
      orderBy: { confidence: 'desc' }
    });

    return {
      totalOccurrences,
      uniqueDocuments: uniqueDocuments.length,
      confidence: {
        avg: confidenceStats._avg.confidence,
        max: confidenceStats._max.confidence,
        min: confidenceStats._min.confidence
      },
      typeDistribution: typeDistribution.map(t => ({
        type: t.type,
        count: t._count.type
      })),
      recentOccurrences,
      similarTypeEntities: similarTypeEntities.map(e => e.name)
    };
  } catch (error) {
    console.error('Error getting entity statistics:', error);
    return null;
  }
}

/**
 * Get entities that co-occur with this entity in the same document
 */
async function getCoOccurringEntities(documentId: string, entityId: string, limit: number) {
  if (!prisma) return [];

  try {
    const coOccurring = await prisma.documentEntity.findMany({
      where: {
        documentId,
        id: { not: entityId }
      },
      select: {
        id: true,
        name: true,
        type: true,
        confidence: true,
        context: true
      },
      orderBy: { confidence: 'desc' },
      take: limit
    });

    return coOccurring;
  } catch (error) {
    console.error('Error getting co-occurring entities:', error);
    return [];
  }
} 