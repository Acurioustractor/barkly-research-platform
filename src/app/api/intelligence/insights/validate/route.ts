import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightId, validationStatus, validationScore, validationFeedback, validatedBy } = body;

    if (!insightId) {
      return NextResponse.json(
        { success: false, error: 'Missing insight ID' },
        { status: 400 }
      );
    }

    if (!validationStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing validation status' },
        { status: 400 }
      );
    }

    // Validate validation status
    const validStatuses = ['pending', 'community_validated', 'expert_validated', 'rejected', 'needs_review'];
    if (!validStatuses.includes(validationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid validation status' },
        { status: 400 }
      );
    }

    // Validate validation score if provided
    if (validationScore !== undefined && (validationScore < 0 || validationScore > 1)) {
      return NextResponse.json(
        { success: false, error: 'Validation score must be between 0 and 1' },
        { status: 400 }
      );
    }

    const insight = await IntelligenceDatabaseService.validateIntelligenceInsight(
      insightId,
      validationStatus,
      validationScore,
      validationFeedback,
      validatedBy
    );

    // Record analytics event
    await IntelligenceDatabaseService.recordAnalyticsEvent({
      event_type: 'insight_validated',
      event_category: 'validation',
      community_id: insight.community_id,
      user_id: validatedBy,
      event_data: {
        insight_id: insightId,
        validation_status: validationStatus,
        validation_score: validationScore,
        insight_type: insight.insight_type
      }
    });

    return NextResponse.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error validating intelligence insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate intelligence insight' },
      { status: 500 }
    );
  }
}