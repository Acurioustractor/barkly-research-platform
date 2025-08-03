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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to view this analysis
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get session details to check permissions
    const { data: previewSession } = await supabase
      .from('preview_sessions')
      .select('community_id, facilitator_id')
      .eq('id', sessionId)
      .single();

    if (!previewSession) {
      return NextResponse.json({ error: 'Preview session not found' }, { status: 404 });
    }

    // Check if user can view this analysis
    const canViewAnalysis = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      previewSession.facilitator_id === user.id ||
      (user.community_id === previewSession.community_id);

    if (!canViewAnalysis) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view feedback analysis' },
        { status: 403 }
      );
    }

    const analysis = await communityPreviewService.getFeedbackAnalysis(sessionId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Feedback analysis not found or not yet generated' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error fetching feedback analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback analysis' },
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
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to generate analysis
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get session details to check permissions
    const { data: previewSession } = await supabase
      .from('preview_sessions')
      .select('facilitator_id, status')
      .eq('id', session_id)
      .single();

    if (!previewSession) {
      return NextResponse.json({ error: 'Preview session not found' }, { status: 404 });
    }

    // Check if user can generate analysis
    const canGenerateAnalysis = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      previewSession.facilitator_id === user.id;

    if (!canGenerateAnalysis) {
      return NextResponse.json(
        { error: 'Insufficient permissions to generate feedback analysis' },
        { status: 403 }
      );
    }

    // Generate or update analysis
    const analysis = await communityPreviewService.updateFeedbackAnalysis(session_id);

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Feedback analysis generated successfully'
    });

  } catch (error) {
    console.error('Error generating feedback analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate feedback analysis' },
      { status: 500 }
    );
  }
}