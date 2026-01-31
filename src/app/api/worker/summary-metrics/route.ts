import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const region = searchParams.get('region');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Fetch summary metrics from multiple sources
    const [
      programData,
      gapData,
      partnershipData,
      evidenceData
    ] = await Promise.all([
      fetchProgramMetrics(organizationId, region),
      fetchGapMetrics(organizationId, region),
      fetchPartnershipMetrics(organizationId, region),
      fetchEvidenceMetrics(organizationId, region)
    ]);

    const summary = {
      totalPrograms: programData.totalPrograms,
      averageEffectiveness: programData.averageEffectiveness,
      totalReach: programData.totalReach,
      criticalGaps: gapData.criticalGaps,
      activePartnerships: partnershipData.activePartnerships,
      evidenceItems: evidenceData.evidenceItems,

      // Additional metrics
      programsByType: programData.byType,
      gapsByType: gapData.byType,
      partnershipsByType: partnershipData.byType,
      evidenceByType: evidenceData.byType,

      // Performance indicators
      programEfficiencyScore: calculateProgramEfficiency(programData),
      gapResolutionRate: calculateGapResolutionRate(gapData),
      partnershipSuccessRate: calculatePartnershipSuccessRate(partnershipData),
      evidenceQualityScore: calculateEvidenceQuality(evidenceData)
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

async function fetchProgramMetrics(organizationId: string, region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('worker_programs')
      .select(`
        id,
        program_type,
        effectiveness_score,
        reach_count,
        satisfaction_score,
        budget,
        status,
        communities(region)
      `)
      .eq('organization_id', organizationId)
      .eq('active', true);

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Program metrics error:', error);
      return {
        totalPrograms: 0,
        averageEffectiveness: 0,
        totalReach: 0,
        byType: {}
      };
    }

    const programs = data || [];
    const totalPrograms = programs.length;

    const averageEffectiveness = programs.length > 0
      ? Math.round(programs.reduce((sum: number, p: any) => sum + (p.effectiveness_score || 0), 0) / programs.length)
      : 0;

    const totalReach = programs.reduce((sum: number, p: any) => sum + (p.reach_count || 0), 0);

    // Programs by type
    const byType = programs.reduce((acc: Record<string, number>, p: any) => {
      acc[p.program_type] = (acc[p.program_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPrograms,
      averageEffectiveness,
      totalReach,
      byType,
      programs // Include raw data for efficiency calculation
    };
  } catch (error) {
    console.error('Error fetching program metrics:', error);
    return {
      totalPrograms: 0,
      averageEffectiveness: 0,
      totalReach: 0,
      byType: {}
    };
  }
}

async function fetchGapMetrics(organizationId: string, region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('service_gaps')
      .select(`
        id,
        gap_type,
        severity_score,
        priority_level,
        status,
        communities(region)
      `);

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Gap metrics error:', error);
      return {
        criticalGaps: 0,
        byType: {}
      };
    }

    const gaps = data || [];
    const criticalGaps = gaps.filter((g: any) => g.priority_level === 'critical' || g.severity_score >= 8).length;

    // Gaps by type
    const byType = gaps.reduce((acc: Record<string, number>, g: any) => {
      acc[g.gap_type] = (acc[g.gap_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      criticalGaps,
      byType,
      gaps // Include raw data for resolution rate calculation
    };
  } catch (error) {
    console.error('Error fetching gap metrics:', error);
    return {
      criticalGaps: 0,
      byType: {}
    };
  }
}

async function fetchPartnershipMetrics(organizationId: string, region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('partnership_opportunities')
      .select(`
        id,
        partner_type,
        opportunity_type,
        status,
        potential_impact,
        feasibility_score,
        communities(region)
      `)
      .eq('status', 'active');

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Partnership metrics error:', error);
      return {
        activePartnerships: 0,
        byType: {}
      };
    }

    const partnerships = data || [];
    const activePartnerships = partnerships.length;

    // Partnerships by type
    const byType = partnerships.reduce((acc: Record<string, number>, p: any) => {
      acc[p.partner_type] = (acc[p.partner_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      activePartnerships,
      byType,
      partnerships // Include raw data for success rate calculation
    };
  } catch (error) {
    console.error('Error fetching partnership metrics:', error);
    return {
      activePartnerships: 0,
      byType: {}
    };
  }
}

async function fetchEvidenceMetrics(organizationId: string, region?: string | null): Promise<any> {
  try {
    let query = supabase
      .from('impact_evidence')
      .select(`
        id,
        evidence_type,
        reliability_score,
        verified,
        communities(region)
      `)
      .eq('organization_id', organizationId);

    if (region) {
      query = query.eq('communities.region', region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Evidence metrics error:', error);
      return {
        evidenceItems: 0,
        byType: {}
      };
    }

    const evidence = data || [];
    const evidenceItems = evidence.length;

    // Evidence by type
    const byType = evidence.reduce((acc: Record<string, number>, e: any) => {
      acc[e.evidence_type] = (acc[e.evidence_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      evidenceItems,
      byType,
      evidence // Include raw data for quality calculation
    };
  } catch (error) {
    console.error('Error fetching evidence metrics:', error);
    return {
      evidenceItems: 0,
      byType: {}
    };
  }
}

function calculateProgramEfficiency(programData: any): number {
  if (!programData.programs || programData.programs.length === 0) return 0;

  const programs = programData.programs;
  let efficiencyScore = 0;
  let scoredPrograms = 0;

  programs.forEach((program: any) => {
    if (program.effectiveness_score && program.budget && program.reach_count) {
      // Efficiency = (Effectiveness * Reach) / Budget (normalized)
      const costPerPerson = program.budget / Math.max(program.reach_count, 1);
      const efficiency = program.effectiveness_score / Math.max(costPerPerson / 1000, 1); // Normalize cost

      efficiencyScore += Math.min(efficiency, 100); // Cap at 100
      scoredPrograms++;
    }
  });

  return scoredPrograms > 0 ? Math.round(efficiencyScore / scoredPrograms) : 0;
}

function calculateGapResolutionRate(gapData: any): number {
  if (!gapData.gaps || gapData.gaps.length === 0) return 0;

  const gaps = gapData.gaps;
  const resolvedGaps = gaps.filter((gap: any) =>
    gap.status === 'resolved' || gap.status === 'being_addressed'
  ).length;

  return Math.round((resolvedGaps / gaps.length) * 100);
}

function calculatePartnershipSuccessRate(partnershipData: any): number {
  if (!partnershipData.partnerships || partnershipData.partnerships.length === 0) return 0;

  const partnerships = partnershipData.partnerships;

  // Success based on high impact and feasibility scores
  const successfulPartnerships = partnerships.filter((partnership: any) =>
    (partnership.potential_impact || 0) >= 7 && (partnership.feasibility_score || 0) >= 7
  ).length;

  return Math.round((successfulPartnerships / partnerships.length) * 100);
}

function calculateEvidenceQuality(evidenceData: any): number {
  if (!evidenceData.evidence || evidenceData.evidence.length === 0) return 0;

  const evidence = evidenceData.evidence;
  let qualityScore = 0;

  evidence.forEach((item: any) => {
    let itemScore = 0;

    // Verification adds 30 points
    if (item.verified) itemScore += 30;

    // Reliability score adds up to 50 points
    itemScore += Math.min((item.reliability_score || 0) * 5, 50);

    // Evidence type diversity adds 20 points (if both types exist)
    const hasQuantitative = evidence.some((e: any) => e.evidence_type === 'quantitative');
    const hasQualitative = evidence.some((e: any) => e.evidence_type === 'qualitative');
    if (hasQuantitative && hasQualitative) itemScore += 20;

    qualityScore += itemScore;
  });

  return Math.round(qualityScore / evidence.length);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'refresh':
        const { organizationId, region } = data;

        // Trigger refresh of summary metrics
        // This could involve recalculating cached metrics
        return NextResponse.json({
          message: 'Summary metrics refresh initiated',
          status: 'processing'
        });

      case 'export':
        const { organizationId: exportOrgId, format, includeDetails } = data;

        // Generate export of summary metrics
        return NextResponse.json({
          message: 'Summary metrics export generation initiated',
          exportId: `worker-summary-export-${Date.now()}`,
          status: 'processing'
        });

      case 'benchmark':
        const { organizationId: benchmarkOrgId, compareWith } = data;

        // Generate benchmark comparison
        const benchmark = await generateBenchmarkComparison(benchmarkOrgId, compareWith);
        return NextResponse.json({ benchmark });

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

async function generateBenchmarkComparison(
  organizationId: string,
  compareWith: string[] = []
): Promise<any> {
  try {
    // Get metrics for the organization and comparison organizations
    const organizationMetrics = await fetchAllMetrics(organizationId);

    const comparisonMetrics = await Promise.all(
      compareWith.map((id: string) => fetchAllMetrics(id))
    );

    // Calculate benchmarks
    const benchmark = {
      organization: organizationMetrics,
      comparisons: comparisonMetrics,
      benchmarks: {
        programEffectiveness: {
          organization: organizationMetrics.averageEffectiveness,
          average: comparisonMetrics.length > 0
            ? Math.round(comparisonMetrics.reduce((sum, m) => sum + m.averageEffectiveness, 0) / comparisonMetrics.length)
            : 0,
          percentile: calculatePercentile(
            organizationMetrics.averageEffectiveness,
            comparisonMetrics.map((m: any) => m.averageEffectiveness)
          )
        },
        programReach: {
          organization: organizationMetrics.totalReach,
          average: comparisonMetrics.length > 0
            ? Math.round(comparisonMetrics.reduce((sum, m) => sum + m.totalReach, 0) / comparisonMetrics.length)
            : 0,
          percentile: calculatePercentile(
            organizationMetrics.totalReach,
            comparisonMetrics.map((m: any) => m.totalReach)
          )
        },
        gapResolution: {
          organization: organizationMetrics.gapResolutionRate,
          average: comparisonMetrics.length > 0
            ? Math.round(comparisonMetrics.reduce((sum, m) => sum + m.gapResolutionRate, 0) / comparisonMetrics.length)
            : 0,
          percentile: calculatePercentile(
            organizationMetrics.gapResolutionRate,
            comparisonMetrics.map((m: any) => m.gapResolutionRate)
          )
        }
      },
      insights: generateBenchmarkInsights(organizationMetrics, comparisonMetrics),
      recommendations: generateBenchmarkRecommendations(organizationMetrics, comparisonMetrics)
    };

    return benchmark;
  } catch (error) {
    console.error('Error generating benchmark comparison:', error);
    return {
      organization: {},
      comparisons: [],
      benchmarks: {},
      insights: [],
      recommendations: []
    };
  }
}

async function fetchAllMetrics(organizationId: string): Promise<any> {
  const [programData, gapData, partnershipData, evidenceData] = await Promise.all([
    fetchProgramMetrics(organizationId),
    fetchGapMetrics(organizationId),
    fetchPartnershipMetrics(organizationId),
    fetchEvidenceMetrics(organizationId)
  ]);

  return {
    organizationId,
    totalPrograms: programData.totalPrograms,
    averageEffectiveness: programData.averageEffectiveness,
    totalReach: programData.totalReach,
    criticalGaps: gapData.criticalGaps,
    activePartnerships: partnershipData.activePartnerships,
    evidenceItems: evidenceData.evidenceItems,
    programEfficiencyScore: calculateProgramEfficiency(programData),
    gapResolutionRate: calculateGapResolutionRate(gapData),
    partnershipSuccessRate: calculatePartnershipSuccessRate(partnershipData),
    evidenceQualityScore: calculateEvidenceQuality(evidenceData)
  };
}

function calculatePercentile(value: number, comparisonValues: number[]): number {
  if (comparisonValues.length === 0) return 50; // Default to 50th percentile

  const sortedValues = [...comparisonValues, value].sort((a: number, b: number) => a - b);
  const index = sortedValues.indexOf(value);

  return Math.round((index / (sortedValues.length - 1)) * 100);
}

function generateBenchmarkInsights(
  organizationMetrics: any,
  comparisonMetrics: any[]
): string[] {
  const insights = [];

  if (comparisonMetrics.length === 0) {
    insights.push('No comparison data available for benchmarking');
    return insights;
  }

  // Program effectiveness insights
  const avgEffectiveness = comparisonMetrics.reduce((sum: number, m: any) => sum + m.averageEffectiveness, 0) / comparisonMetrics.length;
  if (organizationMetrics.averageEffectiveness > avgEffectiveness + 10) {
    insights.push(`Program effectiveness (${organizationMetrics.averageEffectiveness}%) significantly above average (${Math.round(avgEffectiveness)}%)`);
  } else if (organizationMetrics.averageEffectiveness < avgEffectiveness - 10) {
    insights.push(`Program effectiveness (${organizationMetrics.averageEffectiveness}%) below average (${Math.round(avgEffectiveness)}%)`);
  }

  // Reach insights
  const avgReach = comparisonMetrics.reduce((sum: number, m: any) => sum + m.totalReach, 0) / comparisonMetrics.length;
  if (organizationMetrics.totalReach > avgReach * 1.5) {
    insights.push(`Program reach (${organizationMetrics.totalReach}) significantly above average (${Math.round(avgReach)})`);
  } else if (organizationMetrics.totalReach < avgReach * 0.5) {
    insights.push(`Program reach (${organizationMetrics.totalReach}) below average (${Math.round(avgReach)})`);
  }

  // Gap resolution insights
  const avgGapResolution = comparisonMetrics.reduce((sum: number, m: any) => sum + m.gapResolutionRate, 0) / comparisonMetrics.length;
  if (organizationMetrics.gapResolutionRate > avgGapResolution + 15) {
    insights.push(`Gap resolution rate (${organizationMetrics.gapResolutionRate}%) above average (${Math.round(avgGapResolution)}%)`);
  }

  return insights;
}

function generateBenchmarkRecommendations(
  organizationMetrics: any,
  comparisonMetrics: any[]
): string[] {
  const recommendations = [];

  if (comparisonMetrics.length === 0) {
    recommendations.push('Establish benchmarking relationships with similar organizations');
    return recommendations;
  }

  // Effectiveness recommendations
  const avgEffectiveness = comparisonMetrics.reduce((sum: number, m: any) => sum + m.averageEffectiveness, 0) / comparisonMetrics.length;
  if (organizationMetrics.averageEffectiveness < avgEffectiveness) {
    recommendations.push('Review program implementation strategies to improve effectiveness');
    recommendations.push('Study best practices from higher-performing organizations');
  }

  // Reach recommendations
  const avgReach = comparisonMetrics.reduce((sum: number, m: any) => sum + m.totalReach, 0) / comparisonMetrics.length;
  if (organizationMetrics.totalReach < avgReach) {
    recommendations.push('Explore strategies to expand program reach');
    recommendations.push('Consider partnerships to increase service delivery capacity');
  }

  // Evidence recommendations
  const avgEvidenceQuality = comparisonMetrics.reduce((sum: number, m: any) => sum + m.evidenceQualityScore, 0) / comparisonMetrics.length;
  if (organizationMetrics.evidenceQualityScore < avgEvidenceQuality) {
    recommendations.push('Strengthen evidence collection and verification processes');
  }

  // General recommendations
  recommendations.push('Maintain regular benchmarking to track relative performance');
  recommendations.push('Share successful practices with peer organizations');

  return recommendations;
}