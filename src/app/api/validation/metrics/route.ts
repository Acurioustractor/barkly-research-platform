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
    const insightId = searchParams.get('insight_id');

    if (!insightId) {
      return NextResponse.json(
        { error: 'insight_id parameter is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to view this insight's metrics
    const { data: insight } = await supabase
      .from('intelligence_insights')
      .select('community_id')
      .eq('id', insightId)
      .single();

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Check if user can view this insight
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canViewMetrics = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      user.community_id === insight.community_id;

    if (!canViewMetrics) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view validation metrics' },
        { status: 403 }
      );
    }

    const metrics = await intelligenceValidationService.getValidationMetrics(insightId);

    if (!metrics) {
      return NextResponse.json(
        { error: 'Validation metrics not found or not yet calculated' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching validation metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation metrics' },
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
    const { insight_id } = body;

    if (!insight_id) {
      return NextResponse.json(
        { error: 'insight_id is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to recalculate metrics
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canRecalculateMetrics = 
      user.role === 'admin' || 
      user.role === 'moderator';

    if (!canRecalculateMetrics) {
      return NextResponse.json(
        { error: 'Insufficient permissions to recalculate validation metrics' },
        { status: 403 }
      );
    }

    // Verify insight exists
    const { data: insight } = await supabase
      .from('intelligence_insights')
      .select('id')
      .eq('id', insight_id)
      .single();

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Recalculate metrics
    const metrics = await intelligenceValidationService.calculateValidationMetrics(insight_id);

    return NextResponse.json({
      success: true,
      data: metrics,
      message: 'Validation metrics recalculated successfully'
    });

  } catch (error) {
    console.error('Error recalculating validation metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recalculate validation metrics' },
      { status: 500 }
    );
  }
}