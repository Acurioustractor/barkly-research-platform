import { NextRequest, NextResponse } from 'next/server';
import { intelligenceValidationService } from '@/lib/ai/intelligence-validation-service';
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
    const communityId = searchParams.get('community_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Get user's community if not specified
    let targetCommunityId = communityId;
    if (!targetCommunityId) {
      const { data: user } = await supabase
        .from('users')
        .select('community_id')
        .eq('id', session.user.id)
        .single();
      
      targetCommunityId = user?.community_id;
    }

    // Get insights based on status
    let insights;
    if (status === 'validated') {
      insights = await intelligenceValidationService.getValidatedInsights(
        targetCommunityId || undefined,
        type || undefined
      );
    } else {
      // Get all insights for the community
      const { data, error } = await supabase
        .from('intelligence_insights')
        .select('*')
        .eq('community_id', targetCommunityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      insights = data || [];

      // Filter by type if specified
      if (type) {
        insights = insights.filter(insight => insight.type === type);
      }

      // Filter by status if specified
      if (status) {
        insights = insights.filter(insight => insight.validation_status === status);
      }
    }

    return NextResponse.json({
      success: true,
      data: insights,
      count: insights.length
    });

  } catch (error) {
    console.error('Error fetching intelligence insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intelligence insights' },
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
    const requiredFields = ['type', 'title', 'description', 'content', 'community_id', 'ai_confidence'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate insight type
    const validTypes = ['community_need', 'service_gap', 'success_pattern', 'health_indicator', 'trend_analysis'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid insight type' },
        { status: 400 }
      );
    }

    // Validate AI confidence
    if (typeof body.ai_confidence !== 'number' || body.ai_confidence < 0 || body.ai_confidence > 1) {
      return NextResponse.json(
        { error: 'AI confidence must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Check if user has permission to submit insights for this community
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canSubmitInsight = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      user.community_id === body.community_id;

    if (!canSubmitInsight) {
      return NextResponse.json(
        { error: 'Insufficient permissions to submit insights for this community' },
        { status: 403 }
      );
    }

    const insightData = {
      type: body.type,
      title: body.title,
      description: body.description,
      content: body.content,
      community_id: body.community_id,
      source_documents: body.source_documents || [],
      ai_confidence: body.ai_confidence
    };

    const newInsight = await intelligenceValidationService.submitInsightForValidation(insightData);

    return NextResponse.json({
      success: true,
      data: newInsight,
      message: 'Intelligence insight submitted for validation'
    });

  } catch (error) {
    console.error('Error submitting intelligence insight:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit intelligence insight' },
      { status: 500 }
    );
  }
}