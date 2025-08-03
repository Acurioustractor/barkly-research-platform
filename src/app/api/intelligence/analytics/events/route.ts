import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const eventCategory = searchParams.get('eventCategory');
    const communityId = searchParams.get('communityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const events = await IntelligenceDatabaseService.getAnalyticsEvents(
      eventType || undefined,
      eventCategory || undefined,
      communityId || undefined,
      startDate || undefined,
      endDate || undefined,
      limit
    );

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.event_type || !body.event_category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: event_type and event_category' },
        { status: 400 }
      );
    }

    // Validate event_category
    const validCategories = ['intelligence_generation', 'user_interaction', 'system_performance', 'cultural_safety', 'validation', 'dashboard_usage'];
    if (!validCategories.includes(body.event_category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event_category' },
        { status: 400 }
      );
    }

    const event = await IntelligenceDatabaseService.recordAnalyticsEvent(body);

    return NextResponse.json({
      success: true,
      data: event
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}