import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const query = searchParams.get('q');
    const entityType = searchParams.get('type');
    const documentId = searchParams.get('documentId');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.3');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchMode = searchParams.get('mode') || 'fuzzy'; // exact, fuzzy, semantic
    const includeContext = searchParams.get('includeContext') === 'true';

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Build base where clause
    const baseWhere: any = {
      confidence: { gte: minConfidence }
    };

    if (entityType) {
      baseWhere.type = entityType;
    }

    if (documentId) {
      baseWhere.documentId = documentId;
    }

    let entities: any[] = [];

    if (searchMode === 'exact') {
      // Exact match search
      entities = await prisma!.documentEntity.findMany({
        where: {
          ...baseWhere,
          name: { equals: query, mode: 'insensitive' }
        },
        orderBy: { confidence: 'desc' },
        take: limit,
        include: includeContext ? {
          document: {
            select: {
              id: true,
              originalName: true,
              filename: true
            }
          }
        } : undefined
      });

    } else if (searchMode === 'fuzzy') {
      // Fuzzy search with multiple strategies
      const searchQueries = [
        // Exact name match (highest priority)
        {
          where: {
            ...baseWhere,
            name: { equals: query, mode: 'insensitive' }
          },
          priority: 1.0
        },
        // Name starts with query
        {
          where: {
            ...baseWhere,
            name: { startsWith: query, mode: 'insensitive' }
          },
          priority: 0.9
        },
        // Name contains query
        {
          where: {
            ...baseWhere,
            name: { contains: query, mode: 'insensitive' }
          },
          priority: 0.8
        },
        // Context contains query
        {
          where: {
            ...baseWhere,
            context: { contains: query, mode: 'insensitive' }
          },
          priority: 0.6
        }
      ];

      // Execute all searches in parallel
      const searchResults = await Promise.all(
        searchQueries.map(async (searchQuery) => {
          const results = await prisma!.documentEntity.findMany({
            where: searchQuery.where,
            orderBy: { confidence: 'desc' },
            take: limit,
            include: includeContext ? {
              document: {
                select: {
                  id: true,
                  originalName: true,
                  filename: true
                }
              }
            } : undefined
          });

          return results.map((entity: any) => ({
            ...entity,
            searchPriority: searchQuery.priority,
            relevanceScore: calculateRelevanceScore(entity, query, searchQuery.priority)
          }));
        })
      );

      // Combine and deduplicate results
      const allResults = searchResults.flat();
      const uniqueResults = new Map();

      allResults.forEach(entity => {
        const key = entity.id;
        if (!uniqueResults.has(key) || uniqueResults.get(key).relevanceScore < entity.relevanceScore) {
          uniqueResults.set(key, entity);
        }
      });

      entities = Array.from(uniqueResults.values())
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

    } else if (searchMode === 'semantic') {
      // Semantic search (placeholder for future vector search)
      // For now, use enhanced fuzzy search with keyword extraction
      const keywords = extractKeywords(query);

      const semanticWhere = {
        ...baseWhere,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { context: { contains: query, mode: 'insensitive' } },
          ...keywords.map((keyword: any) => ({
            OR: [
              { name: { contains: keyword, mode: 'insensitive' } },
              { context: { contains: keyword, mode: 'insensitive' } }
            ]
          }))
        ]
      };

      const semanticResults = await prisma!.documentEntity.findMany({
        where: semanticWhere,
        orderBy: { confidence: 'desc' },
        take: limit * 2, // Get more results for semantic ranking
        include: includeContext ? {
          document: {
            select: {
              id: true,
              originalName: true,
              filename: true
            }
          }
        } : undefined
      });

      // Calculate semantic relevance scores
      entities = semanticResults
        .map((entity: any) => ({
          ...entity,
          relevanceScore: calculateSemanticRelevance(entity, query, keywords)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    }

    // Get related entities if we have results
    let relatedEntities: any[] = [];
    if (entities.length > 0) {
      const entityNames = entities.map((e: any) => e.name);
      relatedEntities = await findRelatedEntities(entityNames, baseWhere, 5);
    }

    // Get search suggestions
    const suggestions = await generateSearchSuggestions(query, entityType || undefined, 5);

    logger.info('Entity search completed', {
      query,
      searchMode,
      entityType,
      documentId,
      resultsCount: entities.length,
      relatedCount: relatedEntities.length
    });

    return NextResponse.json({
      query,
      searchMode,
      results: entities,
      relatedEntities,
      suggestions,
      metadata: {
        totalResults: entities.length,
        searchMode,
        minConfidence,
        includeContext,
        searchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Entity search error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to search entities' },
      { status: 500 }
    );
  }
}

/**
 * Calculate relevance score for fuzzy search
 */
function calculateRelevanceScore(entity: any, query: string, priority: number): number {
  const queryLower = query.toLowerCase();
  const nameLower = entity.name.toLowerCase();
  const contextLower = (entity.context || '').toLowerCase();

  let score = priority * entity.confidence;

  // Boost score based on match quality
  if (nameLower === queryLower) {
    score += 0.5;
  } else if (nameLower.startsWith(queryLower)) {
    score += 0.3;
  } else if (nameLower.includes(queryLower)) {
    score += 0.2;
  }

  // Boost for context matches
  if (contextLower.includes(queryLower)) {
    score += 0.1;
  }

  // Boost for shorter names (more specific matches)
  if (entity.name.length < 20) {
    score += 0.05;
  }

  return Math.min(score, 2.0); // Cap at 2.0
}

/**
 * Calculate semantic relevance score
 */
function calculateSemanticRelevance(entity: any, query: string, keywords: string[]): number {
  const queryLower = query.toLowerCase();
  const nameLower = entity.name.toLowerCase();
  const contextLower = (entity.context || '').toLowerCase();

  let score = entity.confidence;

  // Direct query matches
  if (nameLower.includes(queryLower)) {
    score += 0.4;
  }
  if (contextLower.includes(queryLower)) {
    score += 0.2;
  }

  // Keyword matches
  keywords.forEach(keyword => {
    if (nameLower.includes(keyword)) {
      score += 0.1;
    }
    if (contextLower.includes(keyword)) {
      score += 0.05;
    }
  });

  return score;
}

/**
 * Extract keywords from query for semantic search
 */
function extractKeywords(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);

  return words
    .filter((word: any) => word.length > 2 && !stopWords.has(word))
    .slice(0, 5); // Limit to top 5 keywords
}

/**
 * Find entities related to the search results
 */
async function findRelatedEntities(entityNames: string[], baseWhere: any, limit: number): Promise<any[]> {
  if (!prisma) return [];

  try {
    // Find entities that appear in the same documents
    const relatedQuery = `
      SELECT DISTINCT e2.id, e2.name, e2.type, e2.confidence, e2.context
      FROM document_entities e1
      JOIN document_entities e2 ON e1.documentId = e2.documentId
      WHERE e1.name IN (${entityNames.map(() => '?').join(',')})
      AND e2.name NOT IN (${entityNames.map(() => '?').join(',')})
      AND e2.confidence >= ?
      ORDER BY e2.confidence DESC
      LIMIT ?
    `;

    const params = [...entityNames, ...entityNames, baseWhere.confidence?.gte || 0.3, limit];
    const related = await prisma.$queryRawUnsafe(relatedQuery, ...params);

    return related as any[];
  } catch (error) {
    console.error('Error finding related entities:', error);
    return [];
  }
}

/**
 * Generate search suggestions based on partial query
 */
async function generateSearchSuggestions(query: string, entityType?: string, limit: number = 5): Promise<string[]> {
  if (!prisma || query.length < 2) return [];

  try {
    const where: any = {
      name: { startsWith: query, mode: 'insensitive' }
    };

    if (entityType) {
      where.type = entityType;
    }

    const suggestions = await prisma!.documentEntity.findMany({
      where,
      select: { name: true },
      distinct: ['name'],
      orderBy: { confidence: 'desc' },
      take: limit
    });

    return suggestions.map((s: any) => s.name);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
} 