import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const region = searchParams.get('region');
    const programType = searchParams.get('programType');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get programs with analysis data
    let query = supabase
      .from('worker_programs')
      .select(`
        id,
        program_name,
        organization_name,
        program_type,
        description,
        budget,
        start_date,
        end_date,
        effectiveness_score,
        reach_count,
        target_reach,
        satisfaction_score,
        outcomes,
        challenges,
        improvement_suggestions,
        cost_per_beneficiary,
        status,
        communities(name, region),
        program_metrics(
          metric_type,
          metric_value,
          measurement_date
        )
      `)
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('effectiveness_score', { ascending: false });

    if (region) {
      query = query.eq('communities.region', region);
    }

    if (programType) {
      query = query.eq('program_type', programType);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch program analysis' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const programs = data?.map((program: any) => ({
      id: program.id,
      programName: program.program_name,
      organization: program.organization_name,
      effectiveness: program.effectiveness_score || 0,
      reach: program.reach_count || 0,
      satisfaction: program.satisfaction_score || 0,
      outcomes: program.outcomes || [],
      challenges: program.challenges || [],
      improvements: program.improvement_suggestions || [],
      budget: program.budget || 0,
      costPerBeneficiary: program.cost_per_beneficiary || 0,
      category: program.program_type || 'general',
      status: program.status,
      startDate: program.start_date,
      endDate: program.end_date,
      community: program.communities?.name || 'Unknown',
      region: program.communities?.region || 'Unknown',
      detailedMetrics: program.program_metrics || []
    })) || [];

    return NextResponse.json({ programs });
  } catch (error) {
    console.error('Program analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'comparePrograms':
        const { programIds, comparisonType } = data;

        if (!programIds || !Array.isArray(programIds) || programIds.length < 2) {
          return NextResponse.json(
            { error: 'At least 2 program IDs are required for comparison' },
            { status: 400 }
          );
        }

        const comparison = await performProgramComparison(programIds, comparisonType);
        return NextResponse.json({ comparison });

      case 'generateBestPractices':
        const { organizationId, category, minEffectiveness } = data;

        const bestPractices = await identifyBestPractices({
          organizationId,
          category,
          minEffectiveness: minEffectiveness || 70
        });

        return NextResponse.json({ bestPractices });

      case 'updateProgram':
        const {
          programId,
          effectivenessScore,
          reachCount,
          satisfactionScore,
          outcomes,
          challenges,
          improvements
        } = data;

        if (!programId) {
          return NextResponse.json(
            { error: 'Program ID is required' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('worker_programs')
          .update({
            effectiveness_score: effectivenessScore,
            reach_count: reachCount,
            satisfaction_score: satisfactionScore,
            outcomes: outcomes,
            challenges: challenges,
            improvement_suggestions: improvements,
            updated_at: new Date().toISOString()
          })
          .eq('id', programId);

        if (updateError) {
          throw new Error(`Failed to update program: ${updateError.message}`);
        }

        return NextResponse.json({
          message: 'Program updated successfully'
        });

      case 'analyzeEffectiveness':
        const { programId: analyzeId, analysisType } = data;

        const analysis = await analyzeProgram(analyzeId, analysisType);
        return NextResponse.json({ analysis });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Program analysis POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performProgramComparison(
  programIds: string[],
  comparisonType: string = 'effectiveness'
): Promise<any> {
  try {
    // Get program data for comparison
    const { data: programs, error } = await supabase
      .from('worker_programs')
      .select(`
        id,
        program_name,
        organization_name,
        program_type,
        budget,
        effectiveness_score,
        reach_count,
        satisfaction_score,
        cost_per_beneficiary,
        outcomes,
        challenges,
        communities(name, population)
      `)
      .in('id', programIds);

    if (error || !programs) {
      throw new Error(`Failed to fetch programs: ${error?.message}`);
    }

    const comparison = {
      programs: programs.map((p: any) => ({
        id: p.id,
        name: p.program_name,
        organization: p.organization_name,
        type: p.program_type,
        effectiveness: p.effectiveness_score || 0,
        reach: p.reach_count || 0,
        satisfaction: p.satisfaction_score || 0,
        budget: p.budget || 0,
        costPerBeneficiary: p.cost_per_beneficiary || 0,
        outcomes: p.outcomes?.length || 0,
        challenges: p.challenges?.length || 0,
        community: p.communities?.name || 'Unknown'
      })),
      insights: generateComparisonInsights(programs, comparisonType),
      recommendations: generateComparisonRecommendations(programs)
    };

    return comparison;
  } catch (error) {
    console.error('Error performing program comparison:', error);
    return {
      programs: [],
      insights: [],
      recommendations: []
    };
  }
}

function generateComparisonInsights(programs: any[], comparisonType: string): string[] {
  const insights: string[] = [];

  if (programs.length < 2) return insights;

  // Effectiveness comparison
  const effectivenessScores = programs.map((p: any) => p.effectiveness_score || 0);
  const maxEffectiveness = Math.max(...effectivenessScores);
  const minEffectiveness = Math.min(...effectivenessScores);
  const avgEffectiveness = effectivenessScores.reduce((a: number, b: number) => a + b, 0) / effectivenessScores.length;

  if (maxEffectiveness - minEffectiveness > 20) {
    const bestProgram = programs.find(p => p.effectiveness_score === maxEffectiveness);
    insights.push(`${bestProgram?.program_name} shows significantly higher effectiveness (${maxEffectiveness}%) compared to others`);
  }

  // Cost efficiency comparison
  const costPerBeneficiary = programs.map((p: any) => p.cost_per_beneficiary || 0).filter((c: number) => c > 0);
  if (costPerBeneficiary.length > 1) {
    const minCost = Math.min(...costPerBeneficiary);
    const maxCost = Math.max(...costPerBeneficiary);
    const mostEfficient = programs.find(p => p.cost_per_beneficiary === minCost);

    if (maxCost > minCost * 2) {
      insights.push(`${mostEfficient?.program_name} is most cost-efficient at $${minCost} per beneficiary`);
    }
  }

  // Reach comparison
  const reachCounts = programs.map((p: any) => p.reach_count || 0);
  const totalReach = reachCounts.reduce((a: number, b: number) => a + b, 0);
  const maxReach = Math.max(...reachCounts);
  const programWithMaxReach = programs.find(p => p.reach_count === maxReach);

  if (maxReach > totalReach * 0.5) {
    insights.push(`${programWithMaxReach?.program_name} reaches ${maxReach} people, more than half of total program reach`);
  }

  return insights;
}

function generateComparisonRecommendations(programs: any[]): string[] {
  const recommendations = [];

  // Find best performing program
  const bestProgram = programs.reduce((best: any, current: any) =>
    (current.effectiveness_score || 0) > (best.effectiveness_score || 0) ? current : best
  );

  if (bestProgram.effectiveness_score > 80) {
    recommendations.push(`Scale up ${bestProgram.program_name} model to other communities`);
    recommendations.push(`Document best practices from ${bestProgram.program_name} for replication`);
  }

  // Find programs needing improvement
  const underperforming = programs.filter((p: any) => (p.effectiveness_score || 0) < 60);
  if (underperforming.length > 0) {
    recommendations.push(`Review and improve programs with effectiveness below 60%`);
    recommendations.push(`Consider adopting successful strategies from higher-performing programs`);
  }

  // Cost efficiency recommendations
  const costEfficient = programs.filter((p: any) => p.cost_per_beneficiary > 0)
    .sort((a: any, b: any) => a.cost_per_beneficiary - b.cost_per_beneficiary)[0];

  if (costEfficient) {
    recommendations.push(`Analyze cost-saving strategies from ${costEfficient.program_name}`);
  }

  return recommendations;
}

async function identifyBestPractices(params: {
  organizationId: string;
  category?: string;
  minEffectiveness: number;
}): Promise<any[]> {
  try {
    let query = supabase
      .from('worker_programs')
      .select(`
        id,
        program_name,
        organization_name,
        program_type,
        effectiveness_score,
        reach_count,
        satisfaction_score,
        outcomes,
        success_factors,
        implementation_approach,
        communities(name)
      `)
      .eq('organization_id', params.organizationId)
      .gte('effectiveness_score', params.minEffectiveness)
      .eq('active', true)
      .order('effectiveness_score', { ascending: false });

    if (params.category) {
      query = query.eq('program_type', params.category);
    }

    const { data: programs, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch best practices: ${error.message}`);
    }

    const bestPractices = programs?.map((program: any) => ({
      id: program.id,
      programName: program.program_name,
      organization: program.organization_name,
      category: program.program_type,
      effectiveness: program.effectiveness_score,
      reach: program.reach_count,
      satisfaction: program.satisfaction_score,
      keyOutcomes: program.outcomes?.slice(0, 3) || [],
      successFactors: program.success_factors || [],
      approach: program.implementation_approach || '',
      community: program.communities?.name || 'Unknown',
      replicability: calculateReplicability(program)
    })) || [];

    return bestPractices;
  } catch (error) {
    console.error('Error identifying best practices:', error);
    return [];
  }
}

function calculateReplicability(program: any): number {
  let score = 0;

  // High effectiveness increases replicability
  if (program.effectiveness_score >= 80) score += 30;
  else if (program.effectiveness_score >= 70) score += 20;
  else if (program.effectiveness_score >= 60) score += 10;

  // High satisfaction increases replicability
  if (program.satisfaction_score >= 80) score += 20;
  else if (program.satisfaction_score >= 70) score += 15;
  else if (program.satisfaction_score >= 60) score += 10;

  // Clear success factors increase replicability
  if (program.success_factors && program.success_factors.length >= 3) score += 20;
  else if (program.success_factors && program.success_factors.length >= 1) score += 10;

  // Clear implementation approach increases replicability
  if (program.implementation_approach && program.implementation_approach.length > 100) score += 15;
  else if (program.implementation_approach && program.implementation_approach.length > 50) score += 10;

  // Multiple outcomes increase replicability
  if (program.outcomes && program.outcomes.length >= 3) score += 15;
  else if (program.outcomes && program.outcomes.length >= 1) score += 10;

  return Math.min(score, 100);
}

async function analyzeProgram(programId: string, analysisType: string): Promise<any> {
  try {
    // Get program data with detailed metrics
    const { data: program, error } = await supabase
      .from('worker_programs')
      .select(`
        *,
        program_metrics(
          metric_type,
          metric_value,
          measurement_date
        ),
        communities(name, population)
      `)
      .eq('id', programId)
      .single();

    if (error || !program) {
      throw new Error(`Failed to fetch program: ${error?.message}`);
    }

    const analysis = {
      programId: program.id,
      programName: program.program_name,
      analysisType,
      overallScore: program.effectiveness_score || 0,
      strengths: identifyProgramStrengths(program),
      weaknesses: identifyProgramWeaknesses(program),
      opportunities: identifyProgramOpportunities(program),
      threats: identifyProgramThreats(program),
      recommendations: generateProgramRecommendations(program),
      trendAnalysis: analyzeProgramTrends(program.program_metrics || [])
    };

    return analysis;
  } catch (error) {
    console.error('Error analyzing program:', error);
    return {
      programId,
      analysisType,
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      recommendations: [],
      trendAnalysis: {}
    };
  }
}

function identifyProgramStrengths(program: any): string[] {
  const strengths = [];

  if (program.effectiveness_score >= 80) {
    strengths.push('High program effectiveness score');
  }

  if (program.satisfaction_score >= 80) {
    strengths.push('High participant satisfaction');
  }

  if (program.reach_count >= program.target_reach * 0.9) {
    strengths.push('Meeting or exceeding reach targets');
  }

  if (program.cost_per_beneficiary < 500) { // Arbitrary threshold
    strengths.push('Cost-effective service delivery');
  }

  if (program.outcomes && program.outcomes.length >= 3) {
    strengths.push('Multiple documented positive outcomes');
  }

  return strengths;
}

function identifyProgramWeaknesses(program: any): string[] {
  const weaknesses = [];

  if (program.effectiveness_score < 60) {
    weaknesses.push('Below-average effectiveness score');
  }

  if (program.satisfaction_score < 60) {
    weaknesses.push('Low participant satisfaction');
  }

  if (program.reach_count < program.target_reach * 0.7) {
    weaknesses.push('Not meeting reach targets');
  }

  if (program.cost_per_beneficiary > 1000) { // Arbitrary threshold
    weaknesses.push('High cost per beneficiary');
  }

  if (program.challenges && program.challenges.length >= 3) {
    weaknesses.push('Multiple ongoing challenges');
  }

  return weaknesses;
}

function identifyProgramOpportunities(program: any): string[] {
  const opportunities = [];

  if (program.satisfaction_score >= 70 && program.reach_count < program.target_reach) {
    opportunities.push('Scale up successful program to reach more beneficiaries');
  }

  if (program.effectiveness_score >= 70) {
    opportunities.push('Replicate successful model in other communities');
  }

  if (program.improvement_suggestions && program.improvement_suggestions.length > 0) {
    opportunities.push('Implement identified improvement suggestions');
  }

  opportunities.push('Develop partnerships to enhance program delivery');
  opportunities.push('Seek additional funding for program expansion');

  return opportunities;
}

function identifyProgramThreats(program: any): string[] {
  const threats = [];

  if (program.budget < 50000) { // Arbitrary threshold
    threats.push('Limited budget may constrain program activities');
  }

  if (program.challenges && program.challenges.some((c: string) => c.toLowerCase().includes('funding'))) {
    threats.push('Funding challenges may impact sustainability');
  }

  if (program.challenges && program.challenges.some((c: string) => c.toLowerCase().includes('staff'))) {
    threats.push('Staffing issues may affect program delivery');
  }

  threats.push('Changes in community needs may require program adaptation');
  threats.push('Competition for resources with other programs');

  return threats;
}

function generateProgramRecommendations(program: any): string[] {
  const recommendations = [];

  if (program.effectiveness_score < 70) {
    recommendations.push('Conduct detailed program review to identify improvement areas');
    recommendations.push('Implement monitoring and evaluation framework');
  }

  if (program.satisfaction_score < 70) {
    recommendations.push('Gather detailed participant feedback');
    recommendations.push('Adjust program delivery based on participant needs');
  }

  if (program.reach_count < program.target_reach * 0.8) {
    recommendations.push('Review and improve outreach strategies');
    recommendations.push('Address barriers to program participation');
  }

  recommendations.push('Document and share successful practices');
  recommendations.push('Develop sustainability plan for long-term impact');

  return recommendations;
}

function analyzeProgramTrends(metrics: any[]): any {
  if (metrics.length === 0) {
    return { trend: 'insufficient_data', message: 'Not enough data for trend analysis' };
  }

  // Simple trend analysis based on metrics over time
  const sortedMetrics = metrics.sort((a, b) =>
    new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime()
  );

  if (sortedMetrics.length < 2) {
    return { trend: 'insufficient_data', message: 'Need at least 2 data points for trend analysis' };
  }

  const firstValue = parseFloat(sortedMetrics[0].metric_value);
  const lastValue = parseFloat(sortedMetrics[sortedMetrics.length - 1].metric_value);

  if (isNaN(firstValue) || isNaN(lastValue)) {
    return { trend: 'invalid_data', message: 'Unable to analyze non-numeric metrics' };
  }

  const change = ((lastValue - firstValue) / firstValue) * 100;

  let trend = 'stable';
  if (change > 10) trend = 'improving';
  else if (change < -10) trend = 'declining';

  return {
    trend,
    change: Math.round(change * 100) / 100,
    firstValue,
    lastValue,
    dataPoints: sortedMetrics.length,
    message: `Program metrics show ${trend} trend with ${Math.abs(change).toFixed(1)}% change`
  };
}