import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeCommunityIntelligence } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const timeRange = parseInt(searchParams.get('timeRange') || '90'); // days
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get trend analysis data from multiple sources
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    // Fetch data for trend analysis
    const [
      communityHealthData,
      feedbackData,
      needsData,
      serviceGapsData,
      successPatternsData
    ] = await Promise.all([
      fetchCommunityHealthTrends(startDate, endDate, region),
      fetchFeedbackTrends(startDate, endDate, region, category),
      fetchNeedsTrends(startDate, endDate, region),
      fetchServiceGapsTrends(startDate, endDate, region),
      fetchSuccessPatternsTrends(startDate, endDate, region)
    ]);

    // Generate trend analysis
    const trends = await generateTrendAnalysis({
      communityHealth: communityHealthData,
      feedback: feedbackData,
      needs: needsData,
      serviceGaps: serviceGapsData,
      successPatterns: successPatternsData,
      timeRange,
      region
    });

    return NextResponse.json({ 
      trends: trends.slice(0, limit),
      summary: {
        totalTrends: trends.length,
        improving: trends.filter(t => t.direction === 'improving').length,
        declining: trends.filter(t => t.direction === 'declining').length,
        stable: trends.filter(t => t.direction === 'stable').length
      }
    });
  } catch (error) {
    console.error('Trend analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchCommunityHealthTrends(
  startDate: Date, 
  endDate: Date, 
  region?: string | null
): Promise<any[]> {
  let query = supabase
    .from('community_health_history')
    .select(`
      *,
      communities(name, region)
    `)
    .gte('recorded_at', startDate.toISOString())
    .lte('recorded_at', endDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (region) {
    query = query.eq('communities.region', region);
  }

  const { data, error } = await query;
  return data || [];
}

async function fetchFeedbackTrends(
  startDate: Date, 
  endDate: Date, 
  region?: string | null,
  category?: string | null
): Promise<any[]> {
  let query = supabase
    .from('community_feedback')
    .select(`
      category,
      priority,
      sentiment,
      created_at,
      communities(name, region)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (region) {
    query = query.eq('communities.region', region);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  return data || [];
}

async function fetchNeedsTrends(
  startDate: Date, 
  endDate: Date, 
  region?: string | null
): Promise<any[]> {
  let query = supabase
    .from('community_needs')
    .select(`
      need_category,
      urgency_score,
      impact_score,
      created_at,
      communities(name, region)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (region) {
    query = query.eq('communities.region', region);
  }

  const { data, error } = await query;
  return data || [];
}

async function fetchServiceGapsTrends(
  startDate: Date, 
  endDate: Date, 
  region?: string | null
): Promise<any[]> {
  let query = supabase
    .from('service_gaps')
    .select(`
      service_type,
      severity_score,
      impact_score,
      created_at,
      communities(name, region)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (region) {
    query = query.eq('communities.region', region);
  }

  const { data, error } = await query;
  return data || [];
}

async function fetchSuccessPatternsTrends(
  startDate: Date, 
  endDate: Date, 
  region?: string | null
): Promise<any[]> {
  let query = supabase
    .from('success_patterns')
    .select(`
      category,
      replicability,
      sustainability,
      created_at,
      pattern_communities(community_name)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  const { data, error } = await query;
  return data || [];
}

async function generateTrendAnalysis(data: {
  communityHealth: any[];
  feedback: any[];
  needs: any[];
  serviceGaps: any[];
  successPatterns: any[];
  timeRange: number;
  region?: string | null;
}): Promise<any[]> {
  const trends = [];

  // Analyze community health trends
  const healthTrends = analyzeCommunityHealthTrends(data.communityHealth);
  trends.push(...healthTrends);

  // Analyze feedback sentiment trends
  const feedbackTrends = analyzeFeedbackTrends(data.feedback);
  trends.push(...feedbackTrends);

  // Analyze emerging needs trends
  const needsTrends = analyzeNeedsTrends(data.needs);
  trends.push(...needsTrends);

  // Analyze service gap trends
  const gapTrends = analyzeServiceGapTrends(data.serviceGaps);
  trends.push(...gapTrends);

  // Analyze success pattern trends
  const successTrends = analyzeSuccessPatternTrends(data.successPatterns);
  trends.push(...successTrends);

  // Sort by strength and return
  return trends.sort((a, b) => b.strength - a.strength);
}

function analyzeCommunityHealthTrends(healthData: any[]): any[] {
  const trends = [];

  if (healthData.length < 2) return trends;

  // Group by community
  const communityGroups = healthData.reduce((groups, item) => {
    const community = item.communities?.name || 'Unknown';
    if (!groups[community]) groups[community] = [];
    groups[community].push(item);
    return groups;
  }, {});

  Object.entries(communityGroups).forEach(([community, data]: [string, any]) => {
    if (data.length < 2) return;

    const sortedData = data.sort((a: any, b: any) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const firstScore = sortedData[0].health_score;
    const lastScore = sortedData[sortedData.length - 1].health_score;
    const change = lastScore - firstScore;

    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (change > 2) direction = 'improving';
    else if (change < -2) direction = 'declining';

    trends.push({
      id: `health-${community}`,
      trend: `Community health in ${community}`,
      direction,
      strength: Math.abs(change) / 10, // Normalize to 0-1
      communities: [community],
      implications: [
        direction === 'improving' 
          ? `Positive health trends indicate successful interventions in ${community}`
          : direction === 'declining'
          ? `Declining health scores require immediate attention in ${community}`
          : `Stable health indicators suggest consistent service delivery in ${community}`
      ],
      recommendations: [
        direction === 'improving'
          ? `Continue and expand successful programs in ${community}`
          : direction === 'declining'
          ? `Investigate causes of decline and implement targeted interventions`
          : `Maintain current service levels while exploring improvement opportunities`
      ]
    });
  });

  return trends;
}

function analyzeFeedbackTrends(feedbackData: any[]): any[] {
  const trends = [];

  if (feedbackData.length === 0) return trends;

  // Analyze sentiment trends over time
  const sentimentCounts = feedbackData.reduce((counts, item) => {
    counts[item.sentiment] = (counts[item.sentiment] || 0) + 1;
    return counts;
  }, {});

  const totalFeedback = feedbackData.length;
  const negativeRatio = (sentimentCounts.negative || 0) / totalFeedback;
  const positiveRatio = (sentimentCounts.positive || 0) / totalFeedback;

  let direction: 'improving' | 'stable' | 'declining' = 'stable';
  let strength = 0;

  if (positiveRatio > 0.6) {
    direction = 'improving';
    strength = positiveRatio;
  } else if (negativeRatio > 0.4) {
    direction = 'declining';
    strength = negativeRatio;
  } else {
    strength = 0.5;
  }

  trends.push({
    id: 'feedback-sentiment',
    trend: 'Community sentiment and satisfaction',
    direction,
    strength,
    communities: [...new Set(feedbackData.map(f => f.communities?.name).filter(Boolean))],
    implications: [
      direction === 'improving'
        ? 'Increasing positive community sentiment indicates effective governance and service delivery'
        : direction === 'declining'
        ? 'Rising negative sentiment suggests community concerns need urgent attention'
        : 'Mixed community sentiment indicates varied experiences across different areas'
    ],
    recommendations: [
      direction === 'improving'
        ? 'Maintain current approaches and share successful practices across communities'
        : direction === 'declining'
        ? 'Conduct detailed analysis of negative feedback and implement targeted improvements'
        : 'Focus on addressing specific community concerns while building on positive feedback'
    ]
  });

  // Analyze category-specific trends
  const categoryTrends = analyzeCategoryTrends(feedbackData);
  trends.push(...categoryTrends);

  return trends;
}

function analyzeCategoryTrends(feedbackData: any[]): any[] {
  const trends = [];
  
  // Group by category
  const categoryGroups = feedbackData.reduce((groups, item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
    return groups;
  }, {});

  Object.entries(categoryGroups).forEach(([category, data]: [string, any]) => {
    if (data.length < 3) return; // Need minimum data for trend analysis

    const urgentCount = data.filter((f: any) => f.priority === 'urgent').length;
    const negativeCount = data.filter((f: any) => f.sentiment === 'negative').length;
    const totalCount = data.length;

    const urgencyRatio = urgentCount / totalCount;
    const negativityRatio = negativeCount / totalCount;

    if (urgencyRatio > 0.3 || negativityRatio > 0.4) {
      trends.push({
        id: `category-${category}`,
        trend: `Emerging concerns in ${category}`,
        direction: 'declining' as const,
        strength: Math.max(urgencyRatio, negativityRatio),
        communities: [...new Set(data.map((f: any) => f.communities?.name).filter(Boolean))],
        implications: [
          `Increasing urgent and negative feedback in ${category} indicates systemic issues`,
          `Community dissatisfaction with ${category} services may impact overall wellbeing`
        ],
        recommendations: [
          `Conduct comprehensive review of ${category} services and policies`,
          `Engage directly with affected communities to understand specific concerns`,
          `Develop targeted action plan to address ${category} issues`
        ]
      });
    }
  });

  return trends;
}

function analyzeNeedsTrends(needsData: any[]): any[] {
  const trends = [];

  if (needsData.length === 0) return trends;

  // Analyze emerging high-priority needs
  const categoryNeeds = needsData.reduce((groups, item) => {
    if (!groups[item.need_category]) groups[item.need_category] = [];
    groups[item.need_category].push(item);
    return groups;
  }, {});

  Object.entries(categoryNeeds).forEach(([category, data]: [string, any]) => {
    const avgUrgency = data.reduce((sum: number, item: any) => sum + item.urgency_score, 0) / data.length;
    const avgImpact = data.reduce((sum: number, item: any) => sum + item.impact_score, 0) / data.length;

    if (avgUrgency > 7 || avgImpact > 7) {
      trends.push({
        id: `needs-${category}`,
        trend: `Rising ${category} needs across communities`,
        direction: 'declining' as const,
        strength: Math.max(avgUrgency, avgImpact) / 10,
        communities: [...new Set(data.map((n: any) => n.communities?.name).filter(Boolean))],
        implications: [
          `High-priority ${category} needs indicate gaps in current service provision`,
          `Unaddressed ${category} needs may lead to broader community challenges`
        ],
        recommendations: [
          `Prioritize investment in ${category} services and infrastructure`,
          `Develop comprehensive ${category} strategy with community input`,
          `Monitor ${category} outcomes to ensure effective intervention`
        ]
      });
    }
  });

  return trends;
}

function analyzeServiceGapTrends(gapsData: any[]): any[] {
  const trends = [];

  if (gapsData.length === 0) return trends;

  // Analyze critical service gaps
  const serviceTypes = gapsData.reduce((groups, item) => {
    if (!groups[item.service_type]) groups[item.service_type] = [];
    groups[item.service_type].push(item);
    return groups;
  }, {});

  Object.entries(serviceTypes).forEach(([serviceType, data]: [string, any]) => {
    const avgSeverity = data.reduce((sum: number, item: any) => sum + item.severity_score, 0) / data.length;
    const avgImpact = data.reduce((sum: number, item: any) => sum + item.impact_score, 0) / data.length;

    if (avgSeverity > 6 || avgImpact > 6) {
      trends.push({
        id: `gaps-${serviceType}`,
        trend: `Critical gaps in ${serviceType} services`,
        direction: 'declining' as const,
        strength: Math.max(avgSeverity, avgImpact) / 10,
        communities: [...new Set(data.map((g: any) => g.communities?.name).filter(Boolean))],
        implications: [
          `Significant ${serviceType} service gaps limit community access to essential services`,
          `Service gaps in ${serviceType} may disproportionately affect vulnerable populations`
        ],
        recommendations: [
          `Develop targeted ${serviceType} service expansion plan`,
          `Explore partnerships to fill ${serviceType} service gaps`,
          `Implement interim solutions while building long-term ${serviceType} capacity`
        ]
      });
    }
  });

  return trends;
}

function analyzeSuccessPatternTrends(patternsData: any[]): any[] {
  const trends = [];

  if (patternsData.length === 0) return trends;

  // Analyze successful approaches
  const categoryPatterns = patternsData.reduce((groups, item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
    return groups;
  }, {});

  Object.entries(categoryPatterns).forEach(([category, data]: [string, any]) => {
    const avgReplicability = data.reduce((sum: number, item: any) => sum + item.replicability, 0) / data.length;
    const avgSustainability = data.reduce((sum: number, item: any) => sum + item.sustainability, 0) / data.length;

    if (avgReplicability > 0.7 && avgSustainability > 0.6) {
      trends.push({
        id: `success-${category}`,
        trend: `Proven success patterns in ${category}`,
        direction: 'improving' as const,
        strength: (avgReplicability + avgSustainability) / 2,
        communities: [...new Set(data.flatMap((p: any) => 
          p.pattern_communities?.map((pc: any) => pc.community_name) || []
        ))],
        implications: [
          `Successful ${category} approaches demonstrate effective community development strategies`,
          `Replicable ${category} patterns offer opportunities for scaling successful interventions`
        ],
        recommendations: [
          `Scale successful ${category} patterns to additional communities`,
          `Document and share ${category} best practices across the region`,
          `Invest in expanding proven ${category} approaches`
        ]
      });
    }
  });

  return trends;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generateReport':
        const { trendIds, reportType, includeRecommendations } = data;
        
        // Generate comprehensive trend report
        return NextResponse.json({
          message: 'Trend analysis report generation initiated',
          reportId: `trend-report-${Date.now()}`,
          status: 'processing'
        });

      case 'updateTrend':
        const { trendId, status, notes } = data;
        
        // Update trend tracking status
        const { error } = await supabase
          .from('trend_tracking')
          .upsert({
            trend_id: trendId,
            status: status || 'monitoring',
            notes: notes || '',
            updated_at: new Date().toISOString()
          });

        if (error) {
          throw new Error(`Failed to update trend: ${error.message}`);
        }

        return NextResponse.json({ 
          message: 'Trend updated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Trend analysis POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}