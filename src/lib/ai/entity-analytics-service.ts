/**
 * Entity Analytics Service
 * Provides advanced analytics and insights for document entities
 */

import { prisma } from '@/lib/database-safe';
import { logger } from '@/lib/utils/logger';

export interface EntityAnalyticsResult {
  summary: EntitySummary;
  patterns: EntityPattern[];
  relationships: EntityRelationshipAnalysis;
  trends: EntityTrend[];
  insights: EntityInsight[];
  recommendations: EntityRecommendation[];
}

export interface EntitySummary {
  totalEntities: number;
  uniqueEntityNames: number;
  entityTypes: { type: string; count: number; percentage: number }[];
  avgConfidence: number;
  documentsWithEntities: number;
  entitiesPerDocument: {
    avg: number;
    min: number;
    max: number;
  };
}

export interface EntityPattern {
  id: string;
  type: 'co_occurrence' | 'frequency' | 'distribution' | 'temporal' | 'contextual';
  title: string;
  description: string;
  confidence: number;
  entities: string[];
  evidence: any[];
  significance: 'high' | 'medium' | 'low';
}

export interface EntityRelationshipAnalysis {
  strongRelationships: EntityRelationship[];
  clusters: EntityCluster[];
  networkMetrics: NetworkMetrics;
}

export interface EntityRelationship {
  entity1: string;
  entity2: string;
  relationshipType: string;
  strength: number;
  coOccurrences: number;
  contexts: string[];
  documents: string[];
}

export interface EntityCluster {
  id: string;
  name: string;
  entities: string[];
  centralEntity: string;
  cohesion: number;
  theme: string;
}

export interface NetworkMetrics {
  density: number;
  centrality: { entity: string; score: number }[];
  modularity: number;
  avgPathLength: number;
}

export interface EntityTrend {
  entityName: string;
  entityType: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'emerging';
  trendStrength: number;
  timeSeriesData: { date: string; count: number }[];
  significance: string;
}

export interface EntityInsight {
  id: string;
  type: 'anomaly' | 'pattern' | 'opportunity' | 'risk' | 'correlation';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  relatedEntities: string[];
  evidence: any[];
}

export interface EntityRecommendation {
  id: string;
  type: 'extraction' | 'relationship' | 'categorization' | 'analysis';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionSteps: string[];
  expectedBenefit: string;
  relatedEntities: string[];
}

/**
 * Generate comprehensive entity analytics
 */
export async function generateEntityAnalytics(
  options: {
    documentId?: string;
    entityType?: string;
    timeRange?: string;
    includeRelationships?: boolean;
    includeTrends?: boolean;
    minConfidence?: number;
  } = {}
): Promise<EntityAnalyticsResult> {
  try {
    logger.info('Starting entity analytics generation', options);

    // Build base filters
    const baseWhere = buildBaseFilters(options);

    // Generate all analytics components in parallel
    const [
      summary,
      patterns,
      relationships,
      trends,
      insights,
      recommendations
    ] = await Promise.all([
      generateEntitySummary(baseWhere),
      generateEntityPatterns(baseWhere),
      options.includeRelationships ? generateRelationshipAnalysis(baseWhere) : Promise.resolve({
        strongRelationships: [],
        clusters: [],
        networkMetrics: { density: 0, centrality: [], modularity: 0, avgPathLength: 0 }
      }),
      options.includeTrends ? generateEntityTrends(baseWhere) : Promise.resolve([]),
      generateEntityInsights(baseWhere),
      generateEntityRecommendations(baseWhere)
    ]);

    logger.info('Entity analytics generation completed', {
      summary: summary.totalEntities,
      patterns: patterns.length,
      relationships: relationships.strongRelationships.length,
      trends: trends.length,
      insights: insights.length,
      recommendations: recommendations.length
    });

    return {
      summary,
      patterns,
      relationships,
      trends,
      insights,
      recommendations
    };

  } catch (error) {
    logger.error('Entity analytics generation failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Build base filters for queries
 */
function buildBaseFilters(options: any): any {
  const where: any = {};

  if (options.documentId) {
    where.documentId = options.documentId;
  }

  if (options.entityType) {
    where.type = options.entityType;
  }

  if (options.minConfidence) {
    where.confidence = { gte: options.minConfidence };
  }

  if (options.timeRange && options.timeRange !== 'all') {
    const days = parseInt(options.timeRange.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    where.createdAt = { gte: cutoffDate };
  }

  return where;
}

/**
 * Generate entity summary statistics
 */
async function generateEntitySummary(baseWhere: any): Promise<EntitySummary> {
  if (!prisma) throw new Error('Database not available');

  const [
    totalEntities,
    uniqueEntityNames,
    typeDistribution,
    confidenceStats,
    documentsWithEntities,
    entitiesPerDocStats
  ] = await Promise.all([
    prisma.documentEntity.count({ where: baseWhere }),
    
    prisma.documentEntity.findMany({
      where: baseWhere,
      select: { name: true },
      distinct: ['name']
    }).then(results => results.length),
    
    prisma.documentEntity.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true }
    }),
    
    prisma.documentEntity.aggregate({
      where: baseWhere,
      _avg: { confidence: true }
    }),
    
    prisma.documentEntity.findMany({
      where: baseWhere,
      select: { documentId: true },
      distinct: ['documentId']
    }).then(results => results.length),
    
    prisma.documentEntity.groupBy({
      by: ['documentId'],
      where: baseWhere,
      _count: { documentId: true }
    })
  ]);

  const entityCounts = entitiesPerDocStats.map(stat => stat._count.documentId);
  const entitiesPerDocument = {
    avg: entityCounts.reduce((sum, count) => sum + count, 0) / entityCounts.length || 0,
    min: Math.min(...entityCounts) || 0,
    max: Math.max(...entityCounts) || 0
  };

  return {
    totalEntities,
    uniqueEntityNames,
    entityTypes: typeDistribution.map(t => ({
      type: t.type,
      count: t._count.type,
      percentage: (t._count.type / totalEntities) * 100
    })),
    avgConfidence: confidenceStats._avg.confidence || 0,
    documentsWithEntities,
    entitiesPerDocument
  };
}

/**
 * Generate entity patterns
 */
async function generateEntityPatterns(baseWhere: any): Promise<EntityPattern[]> {
  if (!prisma) return [];

  const patterns: EntityPattern[] = [];

  // 1. Co-occurrence patterns
  const coOccurrencePatterns = await findCoOccurrencePatterns(baseWhere);
  patterns.push(...coOccurrencePatterns);

  // 2. Frequency patterns
  const frequencyPatterns = await findFrequencyPatterns(baseWhere);
  patterns.push(...frequencyPatterns);

  // 3. Distribution patterns
  const distributionPatterns = await findDistributionPatterns(baseWhere);
  patterns.push(...distributionPatterns);

  // 4. Contextual patterns
  const contextualPatterns = await findContextualPatterns(baseWhere);
  patterns.push(...contextualPatterns);

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find co-occurrence patterns
 */
async function findCoOccurrencePatterns(baseWhere: any): Promise<EntityPattern[]> {
  if (!prisma) return [];

  try {
    const coOccurrenceQuery = `
      SELECT 
        e1.name as entity1,
        e2.name as entity2,
        COUNT(DISTINCT e1."documentId") as co_occurrences,
        AVG(e1.confidence + e2.confidence) / 2 as avg_confidence,
        STRING_AGG(DISTINCT d."originalName", ', ') as documents
      FROM document_entities e1
      JOIN document_entities e2 ON e1."documentId" = e2."documentId"
      JOIN documents d ON e1."documentId" = d.id
      WHERE e1.id < e2.id
      GROUP BY e1.name, e2.name
      HAVING COUNT(DISTINCT e1."documentId") >= 2
      ORDER BY co_occurrences DESC, avg_confidence DESC
      LIMIT 10
    `;

    const coOccurrences = await prisma.$queryRawUnsafe(coOccurrenceQuery) as any[];

    return coOccurrences.map((co, index) => ({
      id: `co_occurrence_${index}`,
      type: 'co_occurrence' as const,
      title: `${co.entity1} & ${co.entity2} Co-occurrence`,
      description: `${co.entity1} and ${co.entity2} appear together in ${co.co_occurrences} documents`,
      confidence: Math.min(co.avg_confidence, 1.0),
      entities: [co.entity1, co.entity2],
      evidence: [{
        coOccurrences: co.co_occurrences,
        documents: co.documents?.split(', ') || []
      }],
      significance: co.co_occurrences >= 5 ? 'high' : co.co_occurrences >= 3 ? 'medium' : 'low'
    }));
  } catch (error) {
    console.error('Error finding co-occurrence patterns:', error);
    return [];
  }
}

/**
 * Find frequency patterns
 */
async function findFrequencyPatterns(baseWhere: any): Promise<EntityPattern[]> {
  if (!prisma) return [];

  try {
    const frequencyStats = await prisma.documentEntity.groupBy({
      by: ['name', 'type'],
      where: baseWhere,
      _count: { name: true },
      _avg: { confidence: true },
      orderBy: { _count: { name: 'desc' } },
      take: 5
    });

    return frequencyStats.map((stat, index) => ({
      id: `frequency_${index}`,
      type: 'frequency' as const,
      title: `High Frequency: ${stat.name}`,
      description: `${stat.name} appears ${stat._count.name} times across documents`,
      confidence: stat._avg.confidence || 0,
      entities: [stat.name],
      evidence: [{
        frequency: stat._count.name,
        type: stat.type,
        avgConfidence: stat._avg.confidence
      }],
      significance: stat._count.name >= 10 ? 'high' : stat._count.name >= 5 ? 'medium' : 'low'
    }));
  } catch (error) {
    console.error('Error finding frequency patterns:', error);
    return [];
  }
}

/**
 * Find distribution patterns
 */
async function findDistributionPatterns(baseWhere: any): Promise<EntityPattern[]> {
  if (!prisma) return [];

  try {
    const typeDistribution = await prisma.documentEntity.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true },
      _avg: { confidence: true }
    });

    const totalEntities = typeDistribution.reduce((sum, t) => sum + t._count.type, 0);
    
    return typeDistribution
      .filter(t => t._count.type / totalEntities > 0.1) // More than 10% of entities
      .map((dist, index) => ({
        id: `distribution_${index}`,
        type: 'distribution' as const,
        title: `${dist.type} Entity Dominance`,
        description: `${dist.type} entities represent ${((dist._count.type / totalEntities) * 100).toFixed(1)}% of all entities`,
        confidence: dist._avg.confidence || 0,
        entities: [],
        evidence: [{
          type: dist.type,
          count: dist._count.type,
          percentage: (dist._count.type / totalEntities) * 100,
          avgConfidence: dist._avg.confidence
        }],
        significance: dist._count.type / totalEntities > 0.3 ? 'high' : 'medium'
      }));
  } catch (error) {
    console.error('Error finding distribution patterns:', error);
    return [];
  }
}

/**
 * Find contextual patterns
 */
async function findContextualPatterns(baseWhere: any): Promise<EntityPattern[]> {
  if (!prisma) return [];

  try {
    const contextData = await prisma.documentEntity.findMany({
      where: baseWhere,
      select: {
        name: true,
        type: true,
        context: true,
        confidence: true
      },
      take: 100
    });

    // Extract common phrases from contexts
    const contextPhrases: { [key: string]: { count: number; entities: string[]; avgConfidence: number } } = {};
    
    contextData.forEach(entity => {
      if (entity.context) {
        const phrases = extractContextPhrases(entity.context);
        phrases.forEach(phrase => {
          if (!contextPhrases[phrase]) {
            contextPhrases[phrase] = { count: 0, entities: [], avgConfidence: 0 };
          }
          contextPhrases[phrase].count++;
          if (!contextPhrases[phrase].entities.includes(entity.name)) {
            contextPhrases[phrase].entities.push(entity.name);
          }
          contextPhrases[phrase].avgConfidence += entity.confidence || 0;
        });
      }
    });

    // Convert to patterns
    return Object.entries(contextPhrases)
      .filter(([, data]) => data.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([phrase, data], index) => ({
        id: `contextual_${index}`,
        type: 'contextual' as const,
        title: `Common Context: "${phrase}"`,
        description: `The phrase "${phrase}" appears in ${data.count} entity contexts`,
        confidence: data.avgConfidence / data.count,
        entities: data.entities,
        evidence: [{
          phrase,
          occurrences: data.count,
          relatedEntities: data.entities.length
        }],
        significance: data.count >= 5 ? 'high' : 'medium'
      }));
  } catch (error) {
    console.error('Error finding contextual patterns:', error);
    return [];
  }
}

/**
 * Extract meaningful phrases from context
 */
function extractContextPhrases(context: string): string[] {
  const phrases: string[] = [];
  const words = context.toLowerCase().split(/\s+/);
  
  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase2 = words.slice(i, i + 2).join(' ');
    if (phrase2.length > 6 && !phrase2.includes('the') && !phrase2.includes('and')) {
      phrases.push(phrase2);
    }
    
    if (i < words.length - 2) {
      const phrase3 = words.slice(i, i + 3).join(' ');
      if (phrase3.length > 10 && !phrase3.includes('the') && !phrase3.includes('and')) {
        phrases.push(phrase3);
      }
    }
  }
  
  return phrases;
}

/**
 * Generate relationship analysis
 */
async function generateRelationshipAnalysis(baseWhere: any): Promise<EntityRelationshipAnalysis> {
  // Placeholder implementation - would need more sophisticated graph analysis
  return {
    strongRelationships: [],
    clusters: [],
    networkMetrics: {
      density: 0,
      centrality: [],
      modularity: 0,
      avgPathLength: 0
    }
  };
}

/**
 * Generate entity trends
 */
async function generateEntityTrends(baseWhere: any): Promise<EntityTrend[]> {
  // Placeholder implementation - would need time series analysis
  return [];
}

/**
 * Generate entity insights
 */
async function generateEntityInsights(baseWhere: any): Promise<EntityInsight[]> {
  const insights: EntityInsight[] = [];

  // Add some basic insights based on patterns
  try {
    const lowConfidenceEntities = await prisma?.documentEntity.count({
      where: {
        ...baseWhere,
        confidence: { lt: 0.5 }
      }
    });

    if (lowConfidenceEntities && lowConfidenceEntities > 0) {
      insights.push({
        id: 'low_confidence_entities',
        type: 'risk',
        title: 'Low Confidence Entities Detected',
        description: `${lowConfidenceEntities} entities have confidence scores below 0.5`,
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Review and validate low-confidence entities',
          'Improve entity extraction prompts',
          'Consider manual annotation for critical entities'
        ],
        relatedEntities: [],
        evidence: [{ lowConfidenceCount: lowConfidenceEntities }]
      });
    }
  } catch (error) {
    console.error('Error generating insights:', error);
  }

  return insights;
}

/**
 * Generate entity recommendations
 */
async function generateEntityRecommendations(baseWhere: any): Promise<EntityRecommendation[]> {
  const recommendations: EntityRecommendation[] = [];

  // Add basic recommendations
  recommendations.push({
    id: 'improve_extraction',
    type: 'extraction',
    priority: 'high',
    title: 'Enhance Entity Extraction',
    description: 'Improve entity extraction accuracy and coverage',
    actionSteps: [
      'Review entity extraction prompts',
      'Add domain-specific entity types',
      'Implement confidence thresholds',
      'Add manual validation workflow'
    ],
    expectedBenefit: 'Improved entity accuracy and coverage',
    relatedEntities: []
  });

  return recommendations;
} 