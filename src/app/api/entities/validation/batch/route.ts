/**
 * Batch Entity Validation API Endpoints
 * Handles batch validation operations for multiple entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityValidationService, ValidationAction } from '@/lib/ai/entity-validation-service';
import { logger } from '@/lib/utils/logger';

// POST /api/entities/validation/batch - Validate multiple entities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { validations, userId } = body;

    // Validate required fields
    if (!validations || !Array.isArray(validations) || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: validations (array), userId'
        },
        { status: 400 }
      );
    }

    // Validate batch size
    if (validations.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batch size cannot exceed 100 entities'
        },
        { status: 400 }
      );
    }

    // Validate each validation object
    for (const validation of validations) {
      if (!validation.entityId || !validation.action) {
        return NextResponse.json(
          {
            success: false,
            error: 'Each validation must have entityId and action'
          },
          { status: 400 }
        );
      }

      if (!Object.values(ValidationAction).includes(validation.action)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action: ${validation.action}. Must be one of: ${Object.values(ValidationAction).join(', ')}`
          },
          { status: 400 }
        );
      }

      if (validation.action === ValidationAction.MERGE && !validation.mergeWithEntityId) {
        return NextResponse.json(
          {
            success: false,
            error: `mergeWithEntityId is required for merge action on entity ${validation.entityId}`
          },
          { status: 400 }
        );
      }
    }

    // Add userId to each validation
    const validationsWithUser = validations.map((v: any) => ({
      ...v,
      userId
    }));

    const result = await entityValidationService.batchValidateEntities(validationsWithUser);

    logger.info('Batch entity validation completed', {
      totalEntities: validations.length,
      successful: result.successful.length,
      failed: result.failed.length,
      userId
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Batch validation completed: ${result.successful.length} successful, ${result.failed.length} failed`
    });

  } catch (error) {
    logger.error('Error in batch entity validation', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process batch validation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/entities/validation/batch/status - Get batch validation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: batchId'
        },
        { status: 400 }
      );
    }

    // For now, return a simple status response
    // In a production system, you might track batch operations in a separate table
    return NextResponse.json({
      success: true,
      data: {
        batchId,
        status: 'completed',
        message: 'Batch validation completed successfully'
      }
    });

  } catch (error) {
    logger.error('Error getting batch validation status', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get batch validation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 