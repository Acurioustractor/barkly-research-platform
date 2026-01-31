/**
 * Manual Entity Addition API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityValidationService } from '@/lib/ai/entity-validation-service';
import { logger } from '@/lib/utils/logger';

// POST /api/entities/validation/manual - Add a manual entity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, type, name, category, context, userId } = body;

    // Validate required fields
    if (!documentId || !type || !name || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: documentId, type, name, userId'
      }, { status: 400 });
    }

    const entity = await entityValidationService.addManualEntity({
      documentId,
      type,
      name,
      category,
      context,
      userId
    });

    return NextResponse.json({
      success: true,
      data: entity,
      message: 'Manual entity added successfully'
    });

  } catch (error) {
    logger.error('Error adding manual entity', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add manual entity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 