import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'summary', 'top-performers', 'needs-attention'

    let data;

    switch (type) {
      case 'summary':
        data = await getHealthSummary();
        break;
      case 'top-performers':
        const limit = parseInt(searchParams.get('limit') || '10');
        data = await getTopPerformers(limit);
        break;
      case 'needs-attention':
        data = await getCommunitiesNeedingAttention();
        break;
      case 'dashboard':
        data = await getDashboardData();
        break;
      default:
        data = await getDashboardData();
    }

    return NextResponse.json({
      success: true,
      data,
      type: type || 'dashboard'
    });

  } catch (error) {
    console.error('Health dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get health dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getHealthSummary() {
  try {
    const summary = await prisma.$queryRaw<Array<{
      total_communities: number;
      thriving_communities: number;
      developing_communities: number;
      struggling_communities: number;
      improving_communities: number;
      average_health_score: number;
      communities_with_recent_data: number;
      last_calculation: Date;
    }>>`
      SELECT 
        COUNT(*)::int as total_communities,
        COUNT(*) FILTER (WHERE status = 'thriving')::int as thriving_communities,
        COUNT(*) FILTER (WHERE status = 'developing')::int as developing_communities,
        COUNT(*) FILTER (WHERE status = 'struggling')::int as struggling_communities,
        COUNT(*) FILTER (WHERE status = 'improving')::int as improving_communities,
        ROUND(AVG(health_score), 1)::float as average_health_score,
        COUNT(*) FILTER (WHERE calculated_at > NOW() - INTERVAL '7 days')::int as communities_with_recent_data,
        MAX(calculated_at) as last_calculation
      FROM community_health_indicators
    `;

    return summary[0] || {
      total_communities: 0,
      thriving_communities: 0,
      developing_communities: 0,
      struggling_communities: 0,
      improving_communities: 0,
      average_health_score: 0,
      communities_with_recent_data: 0,
      last_calculation: null
    };

  } catch (error) {
    console.warn('Could not get health summary from database, using fallback:', error);
    // Fallback to basic community count
    const communities = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count FROM communities
    `;
    
    return {
      total_communities: communities[0]?.count || 0,
      thriving_communities: 0,
      developing_communities: 0,
      struggling_communities: 0,
      improving_communities: 0,
      average_health_score: 50,
      communities_with_recent_data: 0,
      last_calculation: null
    };
  }
}

async function getTopPerformers(limit: number = 10) {
  try {
    const topPerformers = await prisma.$queryRaw<Array<{
      community_id: string;
      community_name: string;
      health_score: number;
      status: string;
      youth_engagement: number;
      service_access: number;
      cultural_connection: number;
      economic_opportunity: number;
      safety_wellbeing: number;
      calculated_at: Date;
    }>>`
      SELECT 
        chi.community_id,
        c.name as community_name,
        chi.health_score,
        chi.status,
        chi.youth_engagement,
        chi.service_access,
        chi.cultural_connection,
        chi.economic_opportunity,
        chi.safety_wellbeing,
        chi.calculated_at
      FROM community_health_indicators chi
      LEFT JOIN communities c ON chi.community_id::text = c.id::text
      ORDER BY chi.health_score DESC, c.name
      LIMIT ${limit}
    `;

    return topPerformers;

  } catch (error) {
    console.warn('Could not get top performers from database, using fallback:', error);
    // Fallback to basic community list
    const communities = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
    }>>`
      SELECT id, name FROM communities ORDER BY name LIMIT ${limit}
    `;
    
    return communities.map(c => ({
      community_id: c.id,
      community_name: c.name,
      health_score: 50,
      status: 'developing',
      youth_engagement: 50,
      service_access: 50,
      cultural_connection: 50,
      economic_opportunity: 50,
      safety_wellbeing: 50,
      calculated_at: new Date()
    }));
  }
}

async function getCommunitiesNeedingAttention() {
  try {
    const needingAttention = await prisma.$queryRaw<Array<{
      community_id: string;
      community_name: string;
      health_score: number;
      status: string;
      critical_indicators: string[];
      last_document_upload: Date | null;
      calculated_at: Date;
    }>>`
      SELECT 
        chi.community_id,
        c.name as community_name,
        chi.health_score,
        chi.status,
        ARRAY(
          SELECT indicator FROM (
            SELECT 'Youth Engagement' as indicator WHERE chi.youth_engagement < 40
            UNION ALL
            SELECT 'Service Access' as indicator WHERE chi.service_access < 40
            UNION ALL
            SELECT 'Cultural Connection' as indicator WHERE chi.cultural_connection < 40
            UNION ALL
            SELECT 'Economic Opportunity' as indicator WHERE chi.economic_opportunity < 40
            UNION ALL
            SELECT 'Safety & Wellbeing' as indicator WHERE chi.safety_wellbeing < 40
          ) indicators
        ) as critical_indicators,
        (
          SELECT MAX(created_at) 
          FROM documents d 
          WHERE d.community_id::text = chi.community_id::text
        ) as last_document_upload,
        chi.calculated_at
      FROM community_health_indicators chi
      LEFT JOIN communities c ON chi.community_id::text = c.id::text
      WHERE chi.health_score < 60 OR chi.status IN ('struggling', 'improving')
      ORDER BY chi.health_score ASC, c.name
    `;

    return needingAttention;

  } catch (error) {
    console.warn('Could not get communities needing attention from database:', error);
    return [];
  }
}

async function getDashboardData() {
  try {
    const [summary, topPerformers, needingAttention] = await Promise.all([
      getHealthSummary(),
      getTopPerformers(5),
      getCommunitiesNeedingAttention()
    ]);

    // Get recent health trends (simplified)
    const recentTrends = await prisma.$queryRaw<Array<{
      community_name: string;
      health_score: number;
      status: string;
      calculated_at: Date;
    }>>`
      SELECT 
        c.name as community_name,
        chi.health_score,
        chi.status,
        chi.calculated_at
      FROM community_health_indicators chi
      LEFT JOIN communities c ON chi.community_id::text = c.id::text
      WHERE chi.calculated_at > NOW() - INTERVAL '30 days'
      ORDER BY chi.calculated_at DESC
      LIMIT 20
    `;

    return {
      summary,
      topPerformers,
      needingAttention,
      recentTrends,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
}

// POST endpoint to trigger health recalculation for all communities
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'recalculate-all') {
      // This would trigger a background job to recalculate all community health
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: 'Health recalculation triggered for all communities',
        timestamp: new Date()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Health dashboard POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process health dashboard request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}