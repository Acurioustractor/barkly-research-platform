import { NextRequest, NextResponse } from 'next/server';
import { communityStatusService } from '@/lib/community/community-status-service';
import { prisma } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const type = searchParams.get('type'); // 'current', 'history', 'changes', 'trends'
    const days = parseInt(searchParams.get('days') || '30');

    let data;

    if (communityId) {
      // Get status for specific community
      switch (type) {
        case 'history':
          data = await getStatusHistory(communityId, days);
          break;
        case 'current':
        default:
          data = await communityStatusService.trackCommunityStatus(communityId);
      }
    } else {
      // Get status for all communities or specific queries
      switch (type) {
        case 'changes':
          data = await communityStatusService.getRecentStatusChanges(days);
          break;
        case 'trends':
          data = await getStatusTrends(days);
          break;
        case 'all':
        default:
          data = await communityStatusService.getAllCommunityStatuses();
      }
    }

    return NextResponse.json({
      success: true,
      data,
      type: type || 'current',
      communityId: communityId || 'all'
    });

  } catch (error) {
    console.error('Community status tracking error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get community status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getStatusHistory(communityId: string, days: number) {
  try {
    const history = await prisma.$queryRaw<Array<{
      timestamp: Date;
      health_score: number;
      status: string;
      score_change: number;
      status_changed: boolean;
      trigger_event: string;
    }>>`
      SELECT 
        timestamp, health_score, status, 
        COALESCE(health_score - LAG(health_score) OVER (ORDER BY timestamp), 0) as score_change,
        COALESCE(status != LAG(status) OVER (ORDER BY timestamp), false) as status_changed,
        trigger_event
      FROM community_status_updates
      WHERE community_id = ${communityId}::uuid
      AND timestamp > NOW() - INTERVAL '1 day' * ${days}
      ORDER BY timestamp
    `;

    return {
      communityId,
      days,
      dataPoints: history.length,
      history
    };

  } catch (error) {
    console.warn('Could not get status history from database:', error);
    return {
      communityId,
      days,
      dataPoints: 0,
      history: []
    };
  }
}

async function getStatusTrends(days: number) {
  try {
    const trends = await prisma.$queryRaw<Array<{
      community_id: string;
      community_name: string;
      trend_direction: string;
      trend_velocity: number;
      confidence_score: number;
      data_points: number;
      score_range_min: number;
      score_range_max: number;
      latest_score: number;
      latest_status: string;
    }>>`
      WITH trend_data AS (
        SELECT 
          csu.community_id,
          c.name as community_name,
          COUNT(*) as data_points,
          MIN(csu.health_score) as score_min,
          MAX(csu.health_score) as score_max,
          -- Simple linear regression for trend
          CASE 
            WHEN COUNT(*) > 1 THEN
              (COUNT(*) * SUM(EXTRACT(EPOCH FROM csu.timestamp) * csu.health_score) - 
               SUM(EXTRACT(EPOCH FROM csu.timestamp)) * SUM(csu.health_score)) /
              (COUNT(*) * SUM(POWER(EXTRACT(EPOCH FROM csu.timestamp), 2)) - 
               POWER(SUM(EXTRACT(EPOCH FROM csu.timestamp)), 2))
            ELSE 0
          END as slope,
          -- Latest values
          (SELECT health_score FROM community_status_updates 
           WHERE community_id = csu.community_id 
           ORDER BY timestamp DESC LIMIT 1) as latest_score,
          (SELECT status FROM community_status_updates 
           WHERE community_id = csu.community_id 
           ORDER BY timestamp DESC LIMIT 1) as latest_status
        FROM community_status_updates csu
        LEFT JOIN communities c ON csu.community_id::text = c.id::text
        WHERE csu.timestamp > NOW() - INTERVAL '1 day' * ${days}
        GROUP BY csu.community_id, c.name
      )
      SELECT 
        td.community_id,
        td.community_name,
        CASE 
          WHEN td.slope > 0.001 THEN 'improving'
          WHEN td.slope < -0.001 THEN 'declining'
          ELSE 'stable'
        END as trend_direction,
        ROUND(ABS(td.slope * 86400)::numeric, 4)::float as trend_velocity,
        ROUND(LEAST(1.0, td.data_points / 10.0)::numeric, 2)::float as confidence_score,
        td.data_points::int,
        td.score_min::int as score_range_min,
        td.score_max::int as score_range_max,
        td.latest_score::int,
        td.latest_status
      FROM trend_data td
      WHERE td.data_points > 0
      ORDER BY td.latest_score DESC, td.community_name
    `;

    return {
      days,
      totalCommunities: trends.length,
      trends
    };

  } catch (error) {
    console.warn('Could not get status trends from database:', error);
    return {
      days,
      totalCommunities: 0,
      trends: []
    };
  }
}

// POST endpoint to trigger status updates
export async function POST(request: NextRequest) {
  try {
    const { action, communityId } = await request.json();

    let result;

    switch (action) {
      case 'update-status':
        if (communityId) {
          result = await communityStatusService.trackCommunityStatus(communityId);
        } else {
          result = await communityStatusService.getAllCommunityStatuses();
        }
        break;
      
      case 'recalculate-all':
        result = await communityStatusService.getAllCommunityStatuses();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Community status POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process status update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}