import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    // Fetch summary metrics from multiple sources
    const [
      investmentData,
      programData,
      communityData,
      feedbackData,
      trendsData
    ] = await Promise.all([
      fetchInvestmentMetrics(region),
      fetchProgramMetrics(region),
      fetchCommunityMetrics(region),
      fetchFeedbackMetrics(region),
      fetchTrendMetrics(region)
    ]);

    const summary = {
      totalInvestment: investmentData.totalInvestment,
      activePrograms: programData.activePrograms,
      communitiesServed: communityData.communitiesServed,
      averageROI: investmentData.averageROI,
      pendingFeedback: feedbackData.pendingFeedback,
      emergingIssues: trendsData.emergingIssues,
      
      // Additional metrics
      programEffectiveness: programData.averageEffectiveness,
      communitySatisfaction: feedbackData.averageSatisfaction,
      healthTrend: communityData.healthTrend,
      investmentUtilization: investmentData.utilizationRate,
      
      // Breakdown by category
      investmentByCategory: investmentData.byCategory,
      programsByType: programData.byType,
      feedbackByCategory: feedbackData.byCategory,
      communitiesByStatus: communityData.byStatus
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchInvestmentMetrics(region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('government_programs')
      .select(`
        budget,
        effectiveness_score,
        program_type,
        status,
        communities(region)
      `)
      .eq('active', true);

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Investment metrics error:', error);
      return {
        totalInvestment: 0,
        averageROI: 0,
        utilizationRate: 0,
        byCategory: {}
      };
    }

    const programs = data || [];
    const totalInvestment = programs.reduce((sum, p) => sum + (p.budget || 0), 0) / 1000000; // Convert to millions
    
    // Calculate average ROI based on effectiveness scores
    const avgEffectiveness = programs.length > 0 
      ? programs.reduce((sum, p) => sum + (p.effectiveness_score || 0), 0) / programs.length
      : 0;
    const averageROI = Math.round(avgEffectiveness * 0.8); // Rough ROI estimation

    // Calculate utilization rate (programs with budget vs total programs)
    const programsWithBudget = programs.filter(p => p.budget && p.budget > 0).length;
    const utilizationRate = programs.length > 0 ? (programsWithBudget / programs.length) * 100 : 0;

    // Investment by category
    const byCategory = programs.reduce((acc, p) => {
      const category = p.program_type || 'other';
      acc[category] = (acc[category] || 0) + (p.budget || 0);
      return acc;
    }, {});

    return {
      totalInvestment: Math.round(totalInvestment * 10) / 10, // Round to 1 decimal
      averageROI,
      utilizationRate: Math.round(utilizationRate),
      byCategory
    };
  } catch (error) {
    console.error('Error fetching investment metrics:', error);
    return {
      totalInvestment: 0,
      averageROI: 0,
      utilizationRate: 0,
      byCategory: {}
    };
  }
}

async function fetchProgramMetrics(region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('government_programs')
      .select(`
        id,
        program_type,
        effectiveness_score,
        status,
        communities(region)
      `)
      .eq('active', true);

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Program metrics error:', error);
      return {
        activePrograms: 0,
        averageEffectiveness: 0,
        byType: {}
      };
    }

    const programs = data || [];
    const activePrograms = programs.length;
    
    const averageEffectiveness = programs.length > 0
      ? Math.round(programs.reduce((sum, p) => sum + (p.effectiveness_score || 0), 0) / programs.length)
      : 0;

    // Programs by type
    const byType = programs.reduce((acc, p) => {
      const type = p.program_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      activePrograms,
      averageEffectiveness,
      byType
    };
  } catch (error) {
    console.error('Error fetching program metrics:', error);
    return {
      activePrograms: 0,
      averageEffectiveness: 0,
      byType: {}
    };
  }
}

async function fetchCommunityMetrics(region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('communities')
      .select(`
        id,
        name,
        region,
        community_health(health_score, status)
      `);

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Community metrics error:', error);
      return {
        communitiesServed: 0,
        healthTrend: 'stable',
        byStatus: {}
      };
    }

    const communities = data || [];
    const communitiesServed = communities.length;

    // Calculate health trend
    const healthScores = communities
      .map(c => c.community_health?.[0]?.health_score)
      .filter(score => score !== undefined && score !== null);
    
    const avgHealthScore = healthScores.length > 0
      ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
      : 0;

    let healthTrend = 'stable';
    if (avgHealthScore > 70) healthTrend = 'improving';
    else if (avgHealthScore < 50) healthTrend = 'declining';

    // Communities by status
    const byStatus = communities.reduce((acc, c) => {
      const status = c.community_health?.[0]?.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      communitiesServed,
      healthTrend,
      byStatus
    };
  } catch (error) {
    console.error('Error fetching community metrics:', error);
    return {
      communitiesServed: 0,
      healthTrend: 'stable',
      byStatus: {}
    };
  }
}

async function fetchFeedbackMetrics(region?: string | null): Promise<any> {
  try {
    // Get feedback from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from('community_feedback')
      .select(`
        id,
        category,
        priority,
        sentiment,
        status,
        communities(region)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Feedback metrics error:', error);
      return {
        pendingFeedback: 0,
        averageSatisfaction: 0,
        byCategory: {}
      };
    }

    const feedback = data || [];
    const pendingFeedback = feedback.filter(f => f.status === 'new' || f.status === 'submitted').length;

    // Calculate satisfaction based on sentiment
    const sentimentScores = {
      'positive': 5,
      'neutral': 3,
      'negative': 1
    };

    const avgSatisfaction = feedback.length > 0
      ? Math.round(
          feedback.reduce((sum, f) => sum + (sentimentScores[f.sentiment as keyof typeof sentimentScores] || 3), 0) 
          / feedback.length * 20 // Convert to percentage
        )
      : 0;

    // Feedback by category
    const byCategory = feedback.reduce((acc, f) => {
      const category = f.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      pendingFeedback,
      averageSatisfaction,
      byCategory
    };
  } catch (error) {
    console.error('Error fetching feedback metrics:', error);
    return {
      pendingFeedback: 0,
      averageSatisfaction: 0,
      byCategory: {}
    };
  }
}

async function fetchTrendMetrics(region?: string | null): Promise<any> {
  try {
    // Get recent trends and issues
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count urgent feedback as emerging issues
    let feedbackQuery = supabase
      .from('community_feedback')
      .select(`
        id,
        priority,
        communities(region)
      `)
      .eq('priority', 'urgent')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (region) {
      feedbackQuery = feedbackQuery.eq('communities.region', region);
    }

    // Count high-priority needs as emerging issues
    let needsQuery = supabase
      .from('community_needs')
      .select(`
        id,
        urgency_score,
        communities(region)
      `)
      .gte('urgency_score', 8)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (region) {
      needsQuery = needsQuery.eq('communities.region', region);
    }

    const [feedbackResult, needsResult] = await Promise.all([
      feedbackQuery,
      needsQuery
    ]);

    const urgentFeedback = feedbackResult.data?.length || 0;
    const highPriorityNeeds = needsResult.data?.length || 0;
    const emergingIssues = urgentFeedback + highPriorityNeeds;

    return {
      emergingIssues
    };
  } catch (error) {
    console.error('Error fetching trend metrics:', error);
    return {
      emergingIssues: 0
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'refresh':
        // Trigger refresh of summary metrics
        // This could involve recalculating cached metrics
        return NextResponse.json({
          message: 'Summary metrics refresh initiated',
          status: 'processing'
        });

      case 'export':
        const { format, includeDetails } = data;
        
        // Generate export of summary metrics
        return NextResponse.json({
          message: 'Summary metrics export generation initiated',
          exportId: `summary-export-${Date.now()}`,
          status: 'processing'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Summary metrics POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}