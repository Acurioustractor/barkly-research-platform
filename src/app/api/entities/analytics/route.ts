import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const documentId = searchParams.get('documentId');
    const entityType = searchParams.get('type');
    const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, all
    const includeRelationships = searchParams.get('includeRelationships') === 'true';

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Build base where clause
    const baseWhere: any = {};
    if (documentId) {
      baseWhere.documentId = documentId;
    }
    if (entityType) {
      baseWhere.type = entityType;
    }

    // Add time range filter
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      baseWhere.createdAt = { gte: cutoffDate };
    }

    // 1. Entity Type Distribution
    const typeDistribution = await prisma!.documentEntity.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true },
      _avg: { confidence: true },
      orderBy: { _count: { type: 'desc' } }
    });

    // 2. Top Entities by Confidence
    const topEntities = await prisma!.documentEntity.findMany({
      where: baseWhere,
      orderBy: { confidence: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        type: true,
        confidence: true,
        context: true,
        document: {
          select: {
            id: true,
            originalName: true
          }
        }
      }
    });

    // 3. Entity Frequency Analysis
    const entityFrequency = await prisma!.documentEntity.groupBy({
      by: ['name', 'type'],
      where: baseWhere,
      _count: { name: true },
      _avg: { confidence: true },
      orderBy: { _count: { name: 'desc' } },
      take: 15
    });

    // 4. Confidence Distribution
    const confidenceRanges = [
      { min: 0.9, max: 1.0, label: 'Very High (0.9-1.0)' },
      { min: 0.7, max: 0.9, label: 'High (0.7-0.9)' },
      { min: 0.5, max: 0.7, label: 'Medium (0.5-0.7)' },
      { min: 0.3, max: 0.5, label: 'Low (0.3-0.5)' },
      { min: 0.0, max: 0.3, label: 'Very Low (0.0-0.3)' }
    ];

    const confidenceDistribution = await Promise.all(
      confidenceRanges.map(async (range) => {
        const count = await prisma!.documentEntity.count({
          where: {
            ...baseWhere,
            confidence: { gte: range.min, lt: range.max }
          }
        });
        return { ...range, count };
      })
    );

    // 5. Document-Entity Relationships
    const documentEntityStats = await prisma!.documentEntity.groupBy({
      by: ['documentId'],
      where: baseWhere,
      _count: { documentId: true },
      _avg: { confidence: true },
      orderBy: { _count: { documentId: 'desc' } },
      take: 10
    });

    // Get document details for the top documents
    const topDocuments = await Promise.all(
      documentEntityStats.map(async (stat) => {
        const document = await prisma!.document.findUnique({
          where: { id: stat.documentId },
          select: {
            id: true,
            originalName: true,
            filename: true,
            uploadedAt: true,
            pageCount: true,
            wordCount: true
          }
        });
        return {
          document,
          entityCount: stat._count.documentId,
          avgConfidence: stat._avg.confidence
        };
      })
    );

    // 6. Entity Co-occurrence Analysis (entities that appear in the same documents)
    const coOccurrenceQuery = `
      SELECT 
        e1.name as entity1,
        e1.type as type1,
        e2.name as entity2,
        e2.type as type2,
        COUNT(DISTINCT e1.documentId) as co_occurrences,
        AVG(e1.confidence + e2.confidence) / 2 as avg_confidence
      FROM document_entities e1
      JOIN document_entities e2 ON e1.documentId = e2.documentId
      WHERE e1.id < e2.id
      ${documentId ? `AND e1.documentId = '${documentId}'` : ''}
      ${entityType ? `AND (e1.type = '${entityType}' OR e2.type = '${entityType}')` : ''}
      GROUP BY e1.name, e1.type, e2.name, e2.type
      HAVING co_occurrences > 1
      ORDER BY co_occurrences DESC, avg_confidence DESC
      LIMIT 20
    `;

    const coOccurrences = await prisma!.$queryRawUnsafe(coOccurrenceQuery);

    // 7. Trending Entities (entities appearing more frequently in recent documents)
    const trendingEntities = await prisma!.documentEntity.findMany({
      where: {
        ...baseWhere,
        document: {
          uploadedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }
      },
      select: {
        name: true,
        type: true,
        confidence: true,
        document: {
          select: {
            uploadedAt: true
          }
        }
      },
      orderBy: {
        document: {
          uploadedAt: 'desc'
        }
      },
      take: 10
    });

    // 8. Entity Context Analysis
    const contextKeywords = await prisma!.documentEntity.findMany({
      where: baseWhere,
      select: {
        context: true,
        name: true,
        type: true
      }
    });

    // Extract common context patterns
    const contextPatterns = extractContextPatterns(contextKeywords);

    logger.info('Entity analytics completed', {
      documentId,
      entityType,
      timeRange,
      totalEntities: topEntities.length
    });

    return NextResponse.json({
      summary: {
        totalEntities: await prisma!.documentEntity.count({ where: baseWhere }),
        uniqueEntityNames: entityFrequency.length,
        avgConfidence: typeDistribution.reduce((sum, t) => sum + (t._avg.confidence || 0), 0) / typeDistribution.length,
        entityTypes: typeDistribution.length
      },
      typeDistribution: typeDistribution.map((t: any) => ({
        type: t.type,
        count: t._count.type,
        avgConfidence: t._avg.confidence
      })),
      topEntities,
      entityFrequency: entityFrequency.map((e: any) => ({
        name: e.name,
        type: e.type,
        occurrences: e._count.name,
        avgConfidence: e._avg.confidence
      })),
      confidenceDistribution,
      topDocuments,
      coOccurrences,
      trendingEntities,
      contextPatterns,
      metadata: {
        timeRange,
        includeRelationships,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Entity analytics error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to generate entity analytics' },
      { status: 500 }
    );
  }
}

/**
 * Extract common patterns from entity contexts
 */
function extractContextPatterns(contextData: any[]): any[] {
  const patterns: { [key: string]: number } = {};

  contextData.forEach(item => {
    if (item.context) {
      // Simple pattern extraction - look for common phrases
      const words = item.context.toLowerCase().split(/\s+/);

      // Extract 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 2).join(' ');
        if (phrase.length > 5) {
          patterns[phrase] = (patterns[phrase] || 0) + 1;
        }

        if (i < words.length - 2) {
          const longerPhrase = words.slice(i, i + 3).join(' ');
          if (longerPhrase.length > 10) {
            patterns[longerPhrase] = (patterns[longerPhrase] || 0) + 1;
          }
        }
      }
    }
  });

  // Return top patterns
  return Object.entries(patterns)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pattern, count]) => ({ pattern, count }));
} 