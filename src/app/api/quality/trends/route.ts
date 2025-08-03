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
    const timeRange = searchParams.get('time_range') || '90d';
    const communityId = searchParams.get('community_id');
    const metricType = searchParams.get('metric_type');

    // Check if user has permission to view quality trends
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which community's trends to show
    let targetCommunityId = communityId;
    if (!targetCommunityId && user.role !== 'admin' && user.role !== 'moderator') {
      targetCommunityId = user.community_id;
    }

    const canViewTrends = 
      user.role === 'admin' || 
      user.role === 'moderator' ||
      !targetCommunityId ||
      user.community_id === targetCommunityId;

    if (!canViewTrends) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view quality trends' },
        { status: 403 }
      );
    }

    const trends = await qualityMonitoringService.getQualityTrends(
      timeRange,
      targetCommunityId || undefined
    );

    // Filter by metric type if specified
    const filteredTrends = metricType && trends[metricType] 
      ? { [metricType]: trends[metricType] }
      : trends;

    return NextResponse.json({
      success: true,
      data: filteredTrends,
      metadata: {
        time_range: timeRange,
        community_id: targetCommunityId,
        metric_types: Object.keys(filteredTrends)
      }
    });

  } catch (error) {
    console.error('Error fetching quality trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality trends' },
      { status: 500 }
    );
  }
}