import { NextRequest, NextResponse } from 'next/server';
import { communityPreviewService } from '@/lib/community-preview-service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const feedbackType = searchParams.get('type');

    if (sessionId) {
      // Get feedback for specific session
      const feedback = await communityPreviewService.getSessionFeedback(sessionId);
      
      // Filter by type if provided
      const filteredFeedback = feedbackType 
        ? feedback.filter(f => f.feedback_type === feedbackType)
        : feedback;

      return NextResponse.json({
        success: true,
        data: filteredFeedback,
        count: filteredFeedback.length
      });
    } else {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error fetching preview feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['session_id', 'feedback_type', 'rating'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validFeedbackTypes = ['feature_usability', 'cultural_appropriateness', 'intelligence_accuracy', 'general'];
    if (!validFeedbackTypes.includes(body.feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Validate participant role
    const validRoles = ['community_member', 'elder', 'youth', 'leader', 'external'];
    if (body.participant_role && !validRoles.includes(body.participant_role)) {
      return NextResponse.json(
        { error: 'Invalid participant role' },
        { status: 400 }
      );
    }

    // Get user information
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user can submit feedback for this session
    const { data: previewSession } = await supabase
      .from('preview_sessions')
      .select('community_id, status')
      .eq('id', body.session_id)
      .single();

    if (!previewSession) {
      return NextResponse.json({ error: 'Preview session not found' }, { status: 404 });
    }

    if (previewSession.status !== 'in_progress' && previewSession.status !== 'completed') {
      return NextResponse.json(
        { error: 'Feedback can only be submitted for active or completed sessions' },
        { status: 400 }
      );
    }

    const feedbackData = {
      session_id: body.session_id,
      participant_id: session.user.id,
      participant_role: body.participant_role || user.role,
      feedback_type: body.feedback_type,
      rating: body.rating,
      comments: body.comments || '',
      specific_feature: body.specific_feature,
      improvement_suggestions: body.improvement_suggestions || [],
      cultural_concerns: body.cultural_concerns || [],
      privacy_concerns: body.privacy_concerns || [],
      accessibility_issues: body.accessibility_issues || []
    };

    const newFeedback = await communityPreviewService.submitPreviewFeedback(feedbackData);

    return NextResponse.json({
      success: true,
      data: newFeedback,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting preview feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}