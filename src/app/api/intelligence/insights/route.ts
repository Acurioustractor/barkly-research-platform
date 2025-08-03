import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const insightType = searchParams.get('insightType');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const insights = await IntelligenceDatabaseService.getIntelligenceInsights(
      communityId || undefined,
      insightType || undefined,
      status,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: insights,
      pagination: {
        limit,
        offset,
        total: insights.length
      }
    });
  } catch (error) {
    console.error('Error fetching intelligence insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intelligence insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['community_id', 'insight_type', 'title', 'description', 'confidence_score', 'urgency_level', 'impact_level'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate insight_type
    const validInsightTypes = ['community_need', 'service_gap', 'success_pattern', 'risk_factor', 'opportunity', 'trend_analysis'];
    if (!validInsightTypes.includes(body.insight_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid insight_type' },
        { status: 400 }
      );
    }

    // Validate urgency_level
    const validUrgencyLevels = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencyLevels.includes(body.urgency_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid urgency_level' },
        { status: 400 }
      );
    }

    // Validate impact_level
    const validImpactLevels = ['low', 'medium', 'high', 'transformational'];
    if (!validImpactLevels.includes(body.impact_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid impact_level' },
        { status: 400 }
      );
    }

    // Validate confidence_score
    if (body.confidence_score < 0 || body.confidence_score > 1) {
      return NextResponse.json(
        { success: false, error: 'confidence_score must be between 0 and 1' },
        { status: 400 }
      );
    }

    const insight = await IntelligenceDatabaseService.createIntelligenceInsight(body);

    return NextResponse.json({
      success: true,
      data: insight
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating intelligence insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create intelligence insight' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing insight ID' },
        { status: 400 }
      );
    }

    const insight = await IntelligenceDatabaseService.updateIntelligenceInsight(id, updates);

    return NextResponse.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error updating intelligence insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update intelligence insight' },
      { status: 500 }
    );
  }
}