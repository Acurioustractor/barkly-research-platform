import { NextRequest, NextResponse } from 'next/server';
import { intelligenceValidationService } from '@/lib/intelligence-validation-service';
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
    const expertiseArea = searchParams.get('expertise_area');
    const availabilityStatus = searchParams.get('availability_status');

    // Build query
    let query = supabase
      .from('community_experts')
      .select(`
        *,
        users (
          id,
          email,
          profile
        )
      `);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (expertiseArea) {
      query = query.contains('expertise_areas', [expertiseArea]);
    }

    if (availabilityStatus) {
      query = query.eq('availability_status', availabilityStatus);
    }

    const { data: experts, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: experts || [],
      count: experts?.length || 0
    });

  } catch (error) {
    console.error('Error fetching community experts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community experts' },
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
    const requiredFields = ['community_id', 'expertise_areas', 'cultural_role'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate expertise areas
    if (!Array.isArray(body.expertise_areas) || body.expertise_areas.length === 0) {
      return NextResponse.json(
        { error: 'expertise_areas must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate cultural role
    const validRoles = ['community_member', 'elder', 'cultural_advisor', 'subject_expert', 'community_leader'];
    if (!validRoles.includes(body.cultural_role)) {
      return NextResponse.json(
        { error: 'Invalid cultural role' },
        { status: 400 }
      );
    }

    // Check if user can register as expert for this community
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canRegisterAsExpert = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      user.community_id === body.community_id;

    if (!canRegisterAsExpert) {
      return NextResponse.json(
        { error: 'You can only register as an expert for your own community' },
        { status: 403 }
      );
    }

    // Check if user is already registered as expert for this community
    const { data: existingExpert } = await supabase
      .from('community_experts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('community_id', body.community_id)
      .single();

    if (existingExpert) {
      return NextResponse.json(
        { error: 'You are already registered as an expert for this community' },
        { status: 400 }
      );
    }

    const expertData = {
      user_id: session.user.id,
      community_id: body.community_id,
      expertise_areas: body.expertise_areas,
      cultural_role: body.cultural_role,
      availability_status: body.availability_status || 'available',
      preferred_languages: body.preferred_languages || ['en'],
      cultural_protocols: body.cultural_protocols || {
        elder_consultation_required: false,
        traditional_knowledge_areas: [],
        cultural_sensitivity_level: 'medium'
      }
    };

    const newExpert = await intelligenceValidationService.registerCommunityExpert(expertData);

    return NextResponse.json({
      success: true,
      data: newExpert,
      message: 'Successfully registered as community expert'
    });

  } catch (error) {
    console.error('Error registering community expert:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register as community expert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expert_id, availability_status } = body;

    if (!expert_id || !availability_status) {
      return NextResponse.json(
        { error: 'expert_id and availability_status are required' },
        { status: 400 }
      );
    }

    // Validate availability status
    const validStatuses = ['available', 'busy', 'unavailable'];
    if (!validStatuses.includes(availability_status)) {
      return NextResponse.json(
        { error: 'Invalid availability status' },
        { status: 400 }
      );
    }

    // Verify user owns this expert profile
    const { data: expert } = await supabase
      .from('community_experts')
      .select('user_id')
      .eq('id', expert_id)
      .single();

    if (!expert) {
      return NextResponse.json({ error: 'Expert profile not found' }, { status: 404 });
    }

    if (expert.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own expert profile' },
        { status: 403 }
      );
    }

    await intelligenceValidationService.updateExpertAvailability(expert_id, availability_status);

    return NextResponse.json({
      success: true,
      message: 'Expert availability updated successfully'
    });

  } catch (error) {
    console.error('Error updating expert availability:', error);
    return NextResponse.json(
      { error: 'Failed to update expert availability' },
      { status: 500 }
    );
  }
}