/**
 * Entity Relationships Analysis API
 * Provides advanced analysis and insights for entity relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityRelationshipsService } from '@/lib/ai/entity-relationships-service';
import { logger } from '@/lib/utils/logger';

// GET /api/entities/relationships/analysis - Get relationship analysis and insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const documentId = searchParams.get('documentId');
    const entityIds = searchParams.get('entityIds')?.split(',').filter(Boolean);
    const includeInsights = searchParams.get('includeInsights') !== 'false'; // Default true
    const includeNetworkMetrics = searchParams.get('includeNetworkMetrics') !== 'false'; // Default true
    const includeClusters = searchParams.get('includeClusters') !== 'false'; // Default true

    if (!documentId && (!entityIds || entityIds.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Either documentId or entityIds must be provided'
      }, { status: 400 });
    }

    // Generate comprehensive analysis
    const analysis = await entityRelationshipsService.analyzeRelationships(
      documentId || undefined,
      entityIds || undefined
    );

    let insights = null;
    if (includeInsights) {
      insights = await entityRelationshipsService.generateRelationshipInsights(
        documentId || undefined,
        entityIds || undefined
      );
    }

    // Filter analysis components based on request
    const result: any = {
      totalRelationships: analysis.totalRelationships,
      relationshipTypes: analysis.relationshipTypes,
      strongestRelationships: analysis.strongestRelationships,
      entityConnections: analysis.entityConnections
    };

    if (includeNetworkMetrics) {
      result.networkMetrics = analysis.networkMetrics;
    }

    if (includeClusters) {
      result.clusters = analysis.clusters;
    }

    if (includeInsights) {
      result.insights = insights;
    }

    // Add summary statistics
    result.summary = {
      totalEntities: analysis.entityConnections.length,
      averageConnectionsPerEntity: analysis.entityConnections.length > 0 ?
        analysis.entityConnections.reduce((sum, entity) => sum + entity.connectionCount, 0) / analysis.entityConnections.length : 0,
      strongRelationshipsCount: analysis.strongestRelationships.filter((rel: any) => rel.strength >= 0.7).length,
      relationshipTypeDistribution: analysis.relationshipTypes,
      topConnectedEntities: analysis.entityConnections
        .sort((a, b) => b.connectionCount - a.connectionCount)
        .slice(0, 5)
        .map((entity: any) => ({
          id: entity.entityId,
          name: entity.entityName,
          type: entity.entityType,
          connectionCount: entity.connectionCount,
          averageStrength: entity.averageStrength
        }))
    };

    logger.info('Relationship analysis completed', {
      documentId,
      entityIds: entityIds?.length || 0,
      totalRelationships: analysis.totalRelationships,
      totalEntities: analysis.entityConnections.length,
      clustersFound: analysis.clusters.length,
      insightsGenerated: insights?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analysisScope: documentId ? 'document' : 'entities',
        documentId,
        entityIds,
        generatedAt: new Date().toISOString(),
        options: {
          includeInsights,
          includeNetworkMetrics,
          includeClusters
        }
      }
    });

  } catch (error) {
    logger.error('Error generating relationship analysis', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate relationship analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 