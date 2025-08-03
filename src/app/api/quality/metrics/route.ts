import { NextRequest, NextResponse } from 'next/server';
import { qualityMonitoringService } from '@/lib/quality-monitoring-service';
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
    const timeRange = searchParams.get('time_range') || '30d';
    const communityId = searchParams.get('community_id');
    const metricType = searchParams.get('metric_type');

    // Check if user has permission to view quality metrics
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which community's metrics to show
    let targetCommunityId = communityId;
    if (!targetCommunityId && user.role !== 'admin' && user.role !== 'moderator') {
      targetCommunityId = user.community_id;
    }

    const canViewMetrics = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      !targetCommunityId ||
      user.community_id === targetCommunityId;

    if (!canViewMetrics) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view quality metrics' },
        { status: 403 }
      );
    }

    const metrics = await qualityMonitoringService.calculateQualityMetrics(
      timeRange,
      targetCommunityId || undefined
    );

    // Filter by metric type if specified
    const filteredMetrics = metricType 
      ? metrics.filter(m => m.metric_type === metricType)
      : metrics;

    return NextResponse.json({
      success: true,
      data: filteredMetrics,
      count: filteredMetrics.length
    });

  } catch (error) {
    console.error('Error fetching quality metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality metrics' },
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
    const { time_range, community_id, force_recalculate } = body;

    // Check if user has permission to trigger metric calculation
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canTriggerCalculation = 
      user.role === 'admin' || 
      user.role === 'moderator';

    if (!canTriggerCalculation) {
      return NextResponse.json(
        { error: 'Insufficient permissions to trigger metric calculation' },
        { status: 403 }
      );
    }

    // Calculate metrics
    const metrics = await qualityMonitoringService.calculateQualityMetrics(
      time_range || '30d',
      community_id
    );

    return NextResponse.json({
      success: true,
      data: metrics,
      message: 'Quality metrics calculated successfully'
    });

  } catch (error) {
    console.error('Error calculating quality metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate quality metrics' },
      { status: 500 }
    );
  }
}