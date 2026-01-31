import { NextRequest, NextResponse } from 'next/server';
import { communityPreviewService } from '@/lib/community/community-preview-service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view stakeholder feedback
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || !['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view stakeholder feedback' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stakeholderType = searchParams.get('stakeholder_type');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');

    let feedback = await communityPreviewService.getStakeholderFeedback(
      stakeholderType || undefined
    );

    // Apply additional filters
    if (category) {
      feedback = feedback.filter(f => f.feedback_category === category);
    }

    if (priority) {
      feedback = feedback.filter(f => f.priority_level === priority);
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      count: feedback.length
    });

  } catch (error) {
    console.error('Error fetching stakeholder feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stakeholder feedback' },
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
    const requiredFields = ['stakeholder_type', 'organization', 'contact_person', 'feedback_category', 'detailed_feedback'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate stakeholder type
    const validStakeholderTypes = ['government', 'ngo', 'funder', 'researcher', 'community_leader'];
    if (!validStakeholderTypes.includes(body.stakeholder_type)) {
      return NextResponse.json(
        { error: 'Invalid stakeholder type' },
        { status: 400 }
      );
    }

    // Validate feedback category
    const validCategories = ['platform_utility', 'data_quality', 'policy_impact', 'technical_requirements'];
    if (!validCategories.includes(body.feedback_category)) {
      return NextResponse.json(
        { error: 'Invalid feedback category' },
        { status: 400 }
      );
    }

    // Validate priority level
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (body.priority_level && !validPriorities.includes(body.priority_level)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Validate detailed feedback structure
    const detailedFeedback = body.detailed_feedback;
    if (!detailedFeedback || typeof detailedFeedback !== 'object') {
      return NextResponse.json(
        { error: 'detailed_feedback must be an object' },
        { status: 400 }
      );
    }

    // Ensure required arrays exist in detailed feedback
    const feedbackDefaults = {
      strengths: [],
      weaknesses: [],
      missing_features: [],
      integration_needs: [],
      policy_implications: []
    };

    const feedbackData = {
      stakeholder_type: body.stakeholder_type,
      organization: body.organization,
      contact_person: body.contact_person,
      feedback_category: body.feedback_category,
      detailed_feedback: {
        ...feedbackDefaults,
        ...detailedFeedback
      },
      priority_level: body.priority_level || 'medium',
      implementation_timeline: body.implementation_timeline,
      follow_up_required: body.follow_up_required || false
    };

    const newFeedback = await communityPreviewService.submitStakeholderFeedback(feedbackData);

    return NextResponse.json({
      success: true,
      data: newFeedback,
      message: 'Stakeholder feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting stakeholder feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit stakeholder feedback' },
      { status: 500 }
    );
  }
}