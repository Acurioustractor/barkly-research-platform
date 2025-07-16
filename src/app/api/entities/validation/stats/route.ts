/**
 * Entity Validation Statistics API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { entityValidationService } from '@/lib/entity-validation-service';
import { logger } from '@/lib/logger';

// GET /api/entities/validation/stats - Get validation statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await entityValidationService.getValidationStats();

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Validation statistics retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting validation statistics', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve validation statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 