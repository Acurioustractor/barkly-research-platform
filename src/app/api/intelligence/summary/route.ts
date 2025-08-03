import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const summaryType = searchParams.get('type') || 'overview';

    switch (summaryType) {
      case 'overview':
        const summary = await IntelligenceDatabaseService.getCommunityIntelligenceSummary(
          communityId || undefined
        );
        return NextResponse.json({
          success: true,
          data: summary
        });

      case 'recent_activity':
        const limit = parseInt(searchParams.get('limit') || '20');
        const recentActivity = await IntelligenceDatabaseService.getRecentIntelligenceActivity(limit);
        return NextResponse.json({
          success: true,
          data: recentActivity
        });

      case 'high_priority':
        const priorityLimit = parseInt(searchParams.get('limit') || '10');
        const highPriority = await IntelligenceDatabaseService.getHighPriorityInsights(
          communityId || undefined,
          priorityLimit
        );
        return NextResponse.json({
          success: true,
          data: highPriority
        });

      case 'dashboard':
        // Comprehensive dashboard data
        const [
          overviewData,
          recentData,
          priorityData,
          aggregationData
        ] = await Promise.all([
          IntelligenceDatabaseService.getCommunityIntelligenceSummary(communityId || undefined),
          IntelligenceDatabaseService.getRecentIntelligenceActivity(10),
          IntelligenceDatabaseService.getHighPriorityInsights(communityId || undefined, 5),
          communityId ? IntelligenceDatabaseService.getCommunityInsightAggregation(communityId) : null
        ]);

        return NextResponse.json({
          success: true,
          data: {
            overview: overviewData,
            recent_activity: recentData,
            high_priority: priorityData,
            aggregation: aggregationData
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid summary type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching intelligence summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intelligence summary' },
      { status: 500 }
    );
  }
}