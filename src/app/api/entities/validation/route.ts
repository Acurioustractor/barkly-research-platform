/**
 * Entity Validation API Routes
 * Handles validation operations for AI-extracted entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityValidationService, ValidationAction } from '@/lib/ai/entity-validation-service';
import { logger } from '@/lib/utils/logger';

// GET /api/entities/validation - Get entities pending validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      minConfidence: parseFloat(searchParams.get('minConfidence') || '0'),
      maxConfidence: parseFloat(searchParams.get('maxConfidence') || '1'),
      entityType: searchParams.get('entityType') || undefined,
      documentId: searchParams.get('documentId') || undefined,
      sortBy: (searchParams.get('sortBy') as 'confidence' | 'extractedAt' | 'name') || 'confidence',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    const result = await entityValidationService.getPendingValidation(options);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Retrieved ${result.entities.length} entities pending validation`
    });

  } catch (error) {
    logger.error('Error getting pending validation entities', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve pending validation entities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/entities/validation - Validate a single entity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { entityId, action, userId, notes, newData, mergeWithEntityId } = body;

    // Validate required fields
    if (!entityId || !action || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: entityId, action, userId'
      }, { status: 400 });
    }

    // Validate action
    if (!Object.values(ValidationAction).includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Must be one of: ' + Object.values(ValidationAction).join(', ')
      }, { status: 400 });
    }

    // Validate merge action
    if (action === ValidationAction.MERGE && !mergeWithEntityId) {
      return NextResponse.json({
        success: false,
        error: 'mergeWithEntityId is required for merge action'
      }, { status: 400 });
    }

    const result = await entityValidationService.validateEntity({
      entityId,
      action,
      userId,
      notes,
      newData,
      mergeWithEntityId
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Entity ${action} completed successfully`
    });

  } catch (error) {
    logger.error('Error validating entity', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to validate entity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/entities/validation - Batch validate multiple entities
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { validations } = body;

    if (!Array.isArray(validations) || validations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'validations must be a non-empty array'
      }, { status: 400 });
    }

    // Validate each validation request
    for (const validation of validations) {
      if (!validation.entityId || !validation.action || !validation.userId) {
        return NextResponse.json({
          success: false,
          error: 'Each validation must have entityId, action, and userId'
        }, { status: 400 });
      }
    }

    const result = await entityValidationService.batchValidateEntities(validations);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Batch validation completed: ${result.successful.length} successful, ${result.failed.length} failed`
    });

  } catch (error) {
    logger.error('Error in batch validation', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to complete batch validation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 