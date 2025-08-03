import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');

    // If a specific date is requested, get single aggregation
    if (date && communityId) {
      const aggregation = await IntelligenceDatabaseService.getCommunityInsightAggregation(
        communityId,
        date
      );

      return NextResponse.json({
        success: true,
        data: aggregation
      });
    }

    // Otherwise get multiple aggregations
    const aggregations = await IntelligenceDatabaseService.getCommunityInsightAggregations(
      communityId || undefined,
      startDate || undefined,
      endDate || undefined
    );

    return NextResponse.json({
      success: true,
      data: aggregations,
      count: aggregations.length
    });
  } catch (error) {
    console.error('Error fetching community insight aggregations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community insight aggregations' },
      { status: 500 }
    );
  }
}