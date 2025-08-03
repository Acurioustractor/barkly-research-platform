import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metricName');
    const metricCategory = searchParams.get('metricCategory');
    const communityId = searchParams.get('communityId');
    const hoursBack = parseInt(searchParams.get('hoursBack') || '24');

    const metrics = await IntelligenceDatabaseService.getRealtimeMetrics(
      metricName || undefined,
      metricCategory || undefined,
      communityId || undefined,
      hoursBack
    );

    return NextResponse.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch realtime metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.metricName || !body.metricCategory || body.metricValue === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: metricName, metricCategory, metricValue' },
        { status: 400 }
      );
    }

    // Validate metricValue is a number
    if (typeof body.metricValue !== 'number') {
      return NextResponse.json(
        { success: false, error: 'metricValue must be a number' },
        { status: 400 }
      );
    }

    const metric = await IntelligenceDatabaseService.updateRealtimeMetric(
      body.metricName,
      body.metricCategory,
      body.metricValue,
      body.communityId,
      body.metricData || {},
      body.windowDurationMinutes || 60
    );

    return NextResponse.json({
      success: true,
      data: metric
    }, { status: 201 });
  } catch (error) {
    console.error('Error updating realtime metric:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update realtime metric' },
      { status: 500 }
    );
  }
}