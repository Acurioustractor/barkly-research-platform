/**
 * Entity Duplicates API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityValidationService } from '@/lib/entity-validation-service';
import { logger } from '@/lib/logger';

// GET /api/entities/validation/duplicates/[id] - Find potential duplicates for an entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get('threshold') || '0.8');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Entity ID is required'
      }, { status: 400 });
    }

    const duplicates = await entityValidationService.findPotentialDuplicates(id, threshold);

    return NextResponse.json({
      success: true,
      data: duplicates,
      message: `Found ${duplicates.length} potential duplicates`
    });

  } catch (error) {
    logger.error('Error finding potential duplicates', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to find potential duplicates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 