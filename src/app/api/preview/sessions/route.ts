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

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('community_id');
    const status = searchParams.get('status');

    let sessions = await communityPreviewService.getPreviewSessions(
      communityId || undefined
    );

    // Filter by status if provided
    if (status) {
      sessions = sessions.filter(session => session.status === status);
    }

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('Error fetching preview sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview sessions' },
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
    const requiredFields = ['title', 'community_id', 'scheduled_date', 'feature_areas'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate user has permission to create sessions for this community
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can create sessions for this community
    const canCreateSession = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      (user.role === 'community_leader' && user.community_id === body.community_id);

    if (!canCreateSession) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create preview session' },
        { status: 403 }
      );
    }

    const sessionData = {
      title: body.title,
      description: body.description || '',
      community_id: body.community_id,
      facilitator_id: session.user.id,
      scheduled_date: body.scheduled_date,
      duration_minutes: body.duration_minutes || 120,
      participant_count: body.participant_count || 0,
      cultural_protocols: {
        elder_presence_required: body.cultural_protocols?.elder_presence_required || false,
        traditional_opening: body.cultural_protocols?.traditional_opening || false,
        language_support: body.cultural_protocols?.language_support || ['en'],
        recording_permitted: body.cultural_protocols?.recording_permitted || false
      },
      data_subset: {
        story_ids: [],
        feature_areas: body.feature_areas,
        intelligence_samples: []
      }
    };

    const newSession = await communityPreviewService.createPreviewSession(sessionData);

    return NextResponse.json({
      success: true,
      data: newSession,
      message: 'Preview session created successfully'
    });

  } catch (error) {
    console.error('Error creating preview session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create preview session' },
      { status: 500 }
    );
  }
}