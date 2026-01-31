/**
 * Entity Relationships API Routes
 * Handles CRUD operations and analysis for entity relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityRelationshipsService } from '@/lib/ai/entity-relationships-service';
import { logger } from '@/lib/utils/logger';

// GET /api/entities/relationships - Get relationships with filtering and analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const documentId = searchParams.get('documentId');
    const entityId = searchParams.get('entityId');
    const relationshipType = searchParams.get('type') as any;
    const minStrength = parseFloat(searchParams.get('minStrength') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeAnalysis = searchParams.get('includeAnalysis') === 'true';
    const includeInsights = searchParams.get('includeInsights') === 'true';

    let relationships = [];
    let analysis = null;
    let insights = null;

    if (documentId) {
      // Get relationships for a specific document
      relationships = await entityRelationshipsService.getDocumentRelationships(
        documentId,
        {
          includeEntities: true,
          minStrength,
          relationshipType,
          limit
        }
      );

      if (includeAnalysis) {
        analysis = await entityRelationshipsService.analyzeRelationships(documentId);
      }

      if (includeInsights) {
        insights = await entityRelationshipsService.generateRelationshipInsights(documentId);
      }

    } else if (entityId) {
      // Get relationships for a specific entity
      relationships = await entityRelationshipsService.getEntityRelationships(
        entityId,
        {
          includeEntities: true,
          minStrength,
          limit
        }
      );

      if (includeAnalysis) {
        analysis = await entityRelationshipsService.analyzeRelationships(undefined, [entityId]);
      }

      if (includeInsights) {
        insights = await entityRelationshipsService.generateRelationshipInsights(undefined, [entityId]);
      }

    } else {
      return NextResponse.json({
        success: false,
        error: 'Either documentId or entityId must be provided'
      }, { status: 400 });
    }

    logger.info('Entity relationships retrieved', {
      documentId,
      entityId,
      relationshipCount: relationships.length,
      includeAnalysis,
      includeInsights
    });

    return NextResponse.json({
      success: true,
      data: {
        relationships,
        analysis,
        insights,
        metadata: {
          total: relationships.length,
          filters: {
            documentId,
            entityId,
            relationshipType,
            minStrength,
            limit
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving entity relationships', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve entity relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/entities/relationships - Create manual relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromEntityId,
      toEntityId,
      relationship,
      type,
      strength = 0.8,
      description,
      userId
    } = body;

    // Validate required fields
    if (!fromEntityId || !toEntityId || !relationship || !type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: fromEntityId, toEntityId, relationship, type'
      }, { status: 400 });
    }

    // Validate relationship type
    const validTypes = ['hierarchical', 'associative', 'causal', 'temporal', 'spatial'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate strength
    if (typeof strength !== 'number' || strength < 0 || strength > 1) {
      return NextResponse.json({
        success: false,
        error: 'Strength must be a number between 0 and 1'
      }, { status: 400 });
    }

    const createdRelationship = await entityRelationshipsService.createManualRelationship(
      fromEntityId,
      toEntityId,
      relationship,
      type,
      strength,
      description,
      userId
    );

    if (!createdRelationship) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create relationship'
      }, { status: 500 });
    }

    logger.info('Manual relationship created', {
      relationshipId: createdRelationship.id,
      fromEntityId,
      toEntityId,
      relationship,
      type,
      userId
    });

    return NextResponse.json({
      success: true,
      data: createdRelationship,
      message: 'Relationship created successfully'
    });

  } catch (error) {
    logger.error('Error creating manual relationship', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create relationship',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/entities/relationships - Update relationship
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      relationshipId,
      strength,
      description,
      confidence,
      userId
    } = body;

    if (!relationshipId) {
      return NextResponse.json({
        success: false,
        error: 'relationshipId is required'
      }, { status: 400 });
    }

    const updates: any = {};
    if (typeof strength === 'number') {
      if (strength < 0 || strength > 1) {
        return NextResponse.json({
          success: false,
          error: 'Strength must be between 0 and 1'
        }, { status: 400 });
      }
      updates.strength = strength;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (typeof confidence === 'number') {
      if (confidence < 0 || confidence > 1) {
        return NextResponse.json({
          success: false,
          error: 'Confidence must be between 0 and 1'
        }, { status: 400 });
      }
      updates.confidence = confidence;
    }

    const updatedRelationship = await entityRelationshipsService.updateRelationship(
      relationshipId,
      updates,
      userId
    );

    if (!updatedRelationship) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update relationship'
      }, { status: 500 });
    }

    logger.info('Relationship updated', {
      relationshipId,
      updates,
      userId
    });

    return NextResponse.json({
      success: true,
      data: updatedRelationship,
      message: 'Relationship updated successfully'
    });

  } catch (error) {
    logger.error('Error updating relationship', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update relationship',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/entities/relationships - Delete relationship
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('relationshipId');
    const userId = searchParams.get('userId');

    if (!relationshipId) {
      return NextResponse.json({
        success: false,
        error: 'relationshipId is required'
      }, { status: 400 });
    }

    const deleted = await entityRelationshipsService.deleteRelationship(
      relationshipId,
      userId || undefined
    );

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete relationship'
      }, { status: 500 });
    }

    logger.info('Relationship deleted', {
      relationshipId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Relationship deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting relationship', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete relationship',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 