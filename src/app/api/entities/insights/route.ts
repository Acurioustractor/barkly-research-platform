import { NextRequest, NextResponse } from 'next/server';
import { generateEntityAnalytics } from '@/lib/ai/entity-analytics-service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const documentId = searchParams.get('documentId');
    const entityType = searchParams.get('type');
    const timeRange = searchParams.get('timeRange') || '30d';
    const includeRelationships = searchParams.get('includeRelationships') === 'true';
    const includeTrends = searchParams.get('includeTrends') === 'true';
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.3');
    const analysisDepth = searchParams.get('analysisDepth') || 'standard'; // standard, deep, comprehensive

    logger.info('Entity insights request', {
      documentId,
      entityType,
      timeRange,
      includeRelationships,
      includeTrends,
      minConfidence,
      analysisDepth
    });

    // Generate comprehensive entity analytics
    const analytics = await generateEntityAnalytics({
      documentId: documentId || undefined,
      entityType: entityType || undefined,
      timeRange,
      includeRelationships,
      includeTrends,
      minConfidence
    });

    // Filter results based on analysis depth
    let filteredAnalytics = analytics;

    if (analysisDepth === 'standard') {
      // Return core insights only
      filteredAnalytics = {
        ...analytics,
        patterns: analytics.patterns.slice(0, 5),
        insights: analytics.insights.slice(0, 3),
        recommendations: analytics.recommendations.slice(0, 3)
      };
    } else if (analysisDepth === 'deep') {
      // Return more detailed analysis
      filteredAnalytics = {
        ...analytics,
        patterns: analytics.patterns.slice(0, 10),
        insights: analytics.insights.slice(0, 7),
        recommendations: analytics.recommendations.slice(0, 5)
      };
    }
    // 'comprehensive' returns everything

    // Add metadata
    const response = {
      ...filteredAnalytics,
      metadata: {
        analysisDepth,
        timeRange,
        includeRelationships,
        includeTrends,
        minConfidence,
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - Date.now() // Placeholder
      }
    };

    logger.info('Entity insights generated successfully', {
      totalPatterns: analytics.patterns.length,
      totalInsights: analytics.insights.length,
      totalRecommendations: analytics.recommendations.length,
      analysisDepth
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Entity insights generation failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to generate entity insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support batch analysis for multiple documents or entities
    const {
      documentIds,
      entityTypes,
      analysisOptions = {},
      compareMode = false
    } = body;

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: 'documentIds array is required' },
        { status: 400 }
      );
    }

    logger.info('Batch entity insights request', {
      documentCount: documentIds.length,
      entityTypes,
      compareMode
    });

    if (compareMode) {
      // Generate comparative analysis across documents
      const comparativeResults = await generateComparativeAnalysis(
        documentIds,
        entityTypes,
        analysisOptions
      );

      return NextResponse.json({
        type: 'comparative',
        results: comparativeResults,
        metadata: {
          documentCount: documentIds.length,
          entityTypes,
          generatedAt: new Date().toISOString()
        }
      });
    } else {
      // Generate individual analysis for each document
      const batchResults = await Promise.all(
        documentIds.map(async (documentId: string) => {
          try {
            const analytics = await generateEntityAnalytics({
              documentId,
              entityType: entityTypes?.[0], // Use first entity type if provided
              ...analysisOptions
            });

            return {
              documentId,
              success: true,
              analytics
            };
          } catch (error) {
            logger.error(`Batch analysis failed for document ${documentId}`, error instanceof Error ? error : new Error(String(error)));
            return {
              documentId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      return NextResponse.json({
        type: 'batch',
        results: batchResults,
        metadata: {
          documentCount: documentIds.length,
          successCount: batchResults.filter((r: any) => r.success).length,
          failureCount: batchResults.filter((r: any) => !r.success).length, // Also fixed logic error (was successCount again)
          generatedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    logger.error('Batch entity insights generation failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to generate batch entity insights' },
      { status: 500 }
    );
  }
}

/**
 * Generate comparative analysis across multiple documents
 */
async function generateComparativeAnalysis(
  documentIds: string[],
  entityTypes?: string[],
  analysisOptions: any = {}
): Promise<any> {
  try {
    // Generate analytics for each document
    const documentAnalytics = await Promise.all(
      documentIds.map(async (documentId: string) => {
        const analytics = await generateEntityAnalytics({
          documentId,
          entityType: entityTypes?.[0],
          ...analysisOptions
        });
        return { documentId, analytics };
      })
    );

    // Compare entity distributions
    const entityDistributions = documentAnalytics.map(({ documentId, analytics }: any) => ({
      documentId,
      totalEntities: analytics.summary.totalEntities,
      uniqueEntities: analytics.summary.uniqueEntityNames,
      typeDistribution: analytics.summary.entityTypes,
      avgConfidence: analytics.summary.avgConfidence
    }));

    // Find common entities across documents
    const allEntities = new Map<string, { count: number; documents: string[] }>();

    documentAnalytics.forEach(({ documentId, analytics }: any) => {
      analytics.patterns
        .filter((p: any) => p.type === 'frequency')
        .forEach((pattern: any) => {
          pattern.entities.forEach((entity: string) => {
            if (!allEntities.has(entity)) {
              allEntities.set(entity, { count: 0, documents: [] });
            }
            const entityData = allEntities.get(entity)!;
            entityData.count++;
            entityData.documents.push(documentId);
          });
        });
    });

    // Find entities that appear in multiple documents
    const commonEntities = Array.from(allEntities.entries())
      .filter(([, data]: [string, { count: number; documents: string[] }]) => data.count > 1)
      .map(([entity, data]: [string, { count: number; documents: string[] }]) => ({
        entity,
        documentCount: data.count,
        documents: data.documents,
        coverage: (data.count / documentIds.length) * 100
      }))
      .sort((a, b) => b.documentCount - a.documentCount);

    // Compare pattern types across documents
    const patternComparison = documentAnalytics.map(({ documentId, analytics }: any) => ({
      documentId,
      patternCounts: {
        coOccurrence: analytics.patterns.filter((p: any) => p.type === 'co_occurrence').length,
        frequency: analytics.patterns.filter((p: any) => p.type === 'frequency').length,
        distribution: analytics.patterns.filter((p: any) => p.type === 'distribution').length,
        contextual: analytics.patterns.filter((p: any) => p.type === 'contextual').length
      },
      totalPatterns: analytics.patterns.length,
      highSignificancePatterns: analytics.patterns.filter((p: any) => p.significance === 'high').length
    }));

    // Generate comparative insights
    const comparativeInsights = generateComparativeInsights(
      documentAnalytics,
      commonEntities,
      entityDistributions
    );

    return {
      documentAnalytics: documentAnalytics.map(({ documentId, analytics }: any) => ({
        documentId,
        summary: analytics.summary,
        topPatterns: analytics.patterns.slice(0, 3),
        keyInsights: analytics.insights.slice(0, 2)
      })),
      comparison: {
        entityDistributions,
        commonEntities,
        patternComparison,
        insights: comparativeInsights
      }
    };

  } catch (error) {
    logger.error('Comparative analysis failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Generate insights from comparative analysis
 */
function generateComparativeInsights(
  documentAnalytics: any[],
  commonEntities: any[],
  entityDistributions: any[]
): any[] {
  const insights = [];

  // Insight 1: Entity overlap analysis
  if (commonEntities.length > 0) {
    const highOverlapEntities = commonEntities.filter((e: any) => e.coverage > 50);
    if (highOverlapEntities.length > 0) {
      insights.push({
        id: 'high_entity_overlap',
        type: 'pattern',
        title: 'High Entity Overlap Detected',
        description: `${highOverlapEntities.length} entities appear in more than 50% of documents`,
        confidence: 0.9,
        evidence: highOverlapEntities.slice(0, 5),
        actionable: true,
        recommendations: [
          'These entities may represent key themes across documents',
          'Consider creating entity clusters for better organization',
          'Use common entities for cross-document analysis'
        ]
      });
    }
  }

  // Insight 2: Confidence variation analysis
  const confidenceScores = entityDistributions.map((d: any) => d.avgConfidence);
  const confidenceVariation = Math.max(...confidenceScores) - Math.min(...confidenceScores);

  if (confidenceVariation > 0.3) {
    insights.push({
      id: 'confidence_variation',
      type: 'risk',
      title: 'High Confidence Variation',
      description: `Entity confidence varies significantly across documents (${confidenceVariation.toFixed(2)} range)`,
      confidence: 0.8,
      evidence: { confidenceRange: confidenceVariation, distributions: entityDistributions },
      actionable: true,
      recommendations: [
        'Review documents with low confidence scores',
        'Standardize entity extraction parameters',
        'Consider document-specific extraction strategies'
      ]
    });
  }

  // Insight 3: Entity density analysis
  const entityDensities = entityDistributions.map((d: any) => d.totalEntities / Math.max(d.uniqueEntities, 1));
  const avgDensity = entityDensities.reduce((sum: number, d: number) => sum + d, 0) / entityDensities.length;

  if (avgDensity > 3) {
    insights.push({
      id: 'high_entity_density',
      type: 'opportunity',
      title: 'High Entity Density',
      description: `Documents have high entity density (${avgDensity.toFixed(1)} entities per unique name)`,
      confidence: 0.7,
      evidence: { avgDensity, densities: entityDensities },
      actionable: true,
      recommendations: [
        'Rich entity content suggests good extraction quality',
        'Consider entity relationship mapping',
        'Explore entity-based document clustering'
      ]
    });
  }

  return insights;
} 