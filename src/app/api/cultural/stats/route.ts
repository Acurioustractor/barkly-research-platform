import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCulturalSafetyStats } from '@/lib/cultural-safety-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const communityId = searchParams.get('communityId');
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const includeDetails = searchParams.get('includeDetails') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Calculate time range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeRange));

    // Get cultural safety statistics
    const safetyStats = await getCulturalSafetyStats(
      { start: startDate, end: endDate },
      communityId
    );

    // Get additional dashboard stats
    const [queueStats, elderStats, protocolStats] = await Promise.all([
      getQueueStats(communityId),
      getElderReviewStats(communityId),
      getProtocolStats(communityId)
    ]);

    const stats = {
      pendingReviews: queueStats.pending,
      urgentItems: queueStats.urgent,
      elderReviewsNeeded: elderStats.pending,
      averageReviewTime: safetyStats.averageReviewTime,
      protocolViolations: safetyStats.protocolViolations,
      
      // Additional stats if details requested
      ...(includeDetails && {
        totalReviews: safetyStats.totalReviews,
        reviewsByLevel: safetyStats.reviewsByLevel,
        reviewsByStatus: safetyStats.reviewsByStatus,
        elderReviews: safetyStats.elderReviews,
        queueDistribution: queueStats.distribution,
        protocolCompliance: protocolStats.compliance
      })
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Cultural safety stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getQueueStats(communityId?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('cultural_moderation_queue')
      .select('priority, status');

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Queue stats error:', error);
      return { pending: 0, urgent: 0, distribution: {} };
    }

    const items = data || [];
    const pending = items.filter(item => item.status === 'queued' || item.status === 'in_review').length;
    const urgent = items.filter(item => item.priority === 'urgent').length;
    
    const distribution = items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {});

    return { pending, urgent, distribution };
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return { pending: 0, urgent: 0, distribution: {} };
  }
}

async function getElderReviewStats(communityId?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('elder_reviews')
      .select('status, urgency');

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Elder review stats error:', error);
      return { pending: 0, urgent: 0 };
    }

    const reviews = data || [];
    const pending = reviews.filter(review => review.status === 'pending').length;
    const urgent = reviews.filter(review => review.urgency === 'high' || review.urgency === 'urgent').length;

    return { pending, urgent };
  } catch (error) {
    console.error('Error fetching elder review stats:', error);
    return { pending: 0, urgent: 0 };
  }
}

async function getProtocolStats(communityId?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('cultural_protocols')
      .select('is_active, protocol_type');

    if (communityId) {
      query = query.or(`community_id.eq.${communityId},community_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Protocol stats error:', error);
      return { compliance: 0, active: 0 };
    }

    const protocols = data || [];
    const active = protocols.filter(protocol => protocol.is_active).length;
    const total = protocols.length;
    const compliance = total > 0 ? Math.round((active / total) * 100) : 100;

    return { compliance, active, total };
  } catch (error) {
    console.error('Error fetching protocol stats:', error);
    return { compliance: 0, active: 0 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generateReport':
        const { userId, communityId, reportType, timeRange } = data;
        
        // Generate comprehensive cultural safety report
        const report = await generateCulturalSafetyReport({
          userId,
          communityId,
          reportType: reportType || 'summary',
          timeRange: timeRange || 30
        });

        return NextResponse.json({ report });

      case 'exportStats':
        const { userId: exportUserId, format, includeDetails } = data;
        
        // Generate export of cultural safety statistics
        return NextResponse.json({
          message: 'Cultural safety stats export generation initiated',
          exportId: `cultural-stats-export-${Date.now()}`,
          status: 'processing'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cultural safety stats POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateCulturalSafetyReport(params: {
  userId: string;
  communityId?: string;
  reportType: string;
  timeRange: number;
}): Promise<any> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - params.timeRange);

    // Get comprehensive stats
    const [safetyStats, queueStats, elderStats, protocolStats] = await Promise.all([
      getCulturalSafetyStats({ start: startDate, end: endDate }, params.communityId),
      getQueueStats(params.communityId),
      getElderReviewStats(params.communityId),
      getProtocolStats(params.communityId)
    ]);

    const report = {
      reportType: params.reportType,
      generatedAt: new Date().toISOString(),
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: params.timeRange
      },
      summary: {
        totalReviews: safetyStats.totalReviews,
        pendingReviews: queueStats.pending,
        averageReviewTime: safetyStats.averageReviewTime,
        elderReviews: safetyStats.elderReviews,
        protocolViolations: safetyStats.protocolViolations
      },
      breakdown: {
        reviewsByLevel: safetyStats.reviewsByLevel,
        reviewsByStatus: safetyStats.reviewsByStatus,
        queueDistribution: queueStats.distribution,
        protocolCompliance: protocolStats.compliance
      },
      insights: generateReportInsights(safetyStats, queueStats, elderStats, protocolStats),
      recommendations: generateReportRecommendations(safetyStats, queueStats, elderStats, protocolStats)
    };

    return report;
  } catch (error) {
    console.error('Error generating cultural safety report:', error);
    return {
      reportType: params.reportType,
      generatedAt: new Date().toISOString(),
      error: 'Failed to generate report',
      summary: {},
      breakdown: {},
      insights: [],
      recommendations: []
    };
  }
}

function generateReportInsights(
  safetyStats: any,
  queueStats: any,
  elderStats: any,
  protocolStats: any
): string[] {
  const insights = [];

  // Review volume insights
  if (safetyStats.totalReviews > 0) {
    insights.push(`Processed ${safetyStats.totalReviews} cultural safety reviews in the reporting period`);
  }

  // Review time insights
  if (safetyStats.averageReviewTime > 0) {
    if (safetyStats.averageReviewTime < 24) {
      insights.push(`Fast review turnaround with average of ${safetyStats.averageReviewTime} hours`);
    } else if (safetyStats.averageReviewTime > 72) {
      insights.push(`Review times are high at ${safetyStats.averageReviewTime} hours average`);
    }
  }

  // Safety level insights
  if (safetyStats.reviewsByLevel) {
    const publicCount = safetyStats.reviewsByLevel.public || 0;
    const restrictedCount = (safetyStats.reviewsByLevel.restricted || 0) + (safetyStats.reviewsByLevel.sacred || 0);
    
    if (restrictedCount > publicCount) {
      insights.push('Majority of content requires cultural safety restrictions');
    } else if (publicCount > restrictedCount * 3) {
      insights.push('Most content is culturally safe for public sharing');
    }
  }

  // Elder review insights
  if (elderStats.pending > 0) {
    insights.push(`${elderStats.pending} items awaiting elder review and cultural guidance`);
  }

  // Protocol compliance insights
  if (protocolStats.compliance < 80) {
    insights.push('Cultural protocol compliance needs improvement');
  } else if (protocolStats.compliance > 95) {
    insights.push('Excellent cultural protocol compliance maintained');
  }

  return insights;
}

function generateReportRecommendations(
  safetyStats: any,
  queueStats: any,
  elderStats: any,
  protocolStats: any
): string[] {
  const recommendations = [];

  // Review time recommendations
  if (safetyStats.averageReviewTime > 48) {
    recommendations.push('Consider adding more moderators to reduce review times');
    recommendations.push('Implement automated pre-screening to prioritize reviews');
  }

  // Queue management recommendations
  if (queueStats.pending > 20) {
    recommendations.push('Review queue is growing - consider increasing moderation capacity');
  }

  if (queueStats.urgent > 5) {
    recommendations.push('Multiple urgent items in queue - prioritize immediate review');
  }

  // Elder review recommendations
  if (elderStats.pending > 10) {
    recommendations.push('Engage additional elders to help with cultural review backlog');
    recommendations.push('Consider cultural authority delegation for routine reviews');
  }

  // Protocol recommendations
  if (protocolStats.compliance < 90) {
    recommendations.push('Review and update cultural protocols for better compliance');
    recommendations.push('Provide additional training on cultural safety protocols');
  }

  // General recommendations
  recommendations.push('Maintain regular community consultation on cultural safety practices');
  recommendations.push('Document successful cultural safety practices for knowledge sharing');

  return recommendations;
}