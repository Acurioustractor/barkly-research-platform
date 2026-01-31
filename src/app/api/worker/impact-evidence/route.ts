import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const programId = searchParams.get('programId');
    const evidenceType = searchParams.get('evidenceType');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get impact evidence data
    let query = supabase
      .from('impact_evidence')
      .select(`
        id,
        program_id,
        evidence_type,
        metric_name,
        metric_value,
        timeframe,
        data_source,
        reliability_score,
        supporting_stories,
        methodology,
        baseline_value,
        target_value,
        collection_date,
        verified,
        created_at,
        worker_programs(program_name, organization_name),
        communities(name, region)
      `)
      .eq('organization_id', organizationId)
      .order('collection_date', { ascending: false });

    if (programId) {
      query = query.eq('program_id', programId);
    }

    if (evidenceType) {
      query = query.eq('evidence_type', evidenceType);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch impact evidence' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const evidence = data?.map((item: any) => ({
      id: item.id,
      programId: item.program_id,
      programName: item.worker_programs?.program_name || 'Unknown Program',
      evidenceType: item.evidence_type,
      metric: item.metric_name,
      value: item.metric_value,
      timeframe: item.timeframe,
      source: item.data_source,
      reliability: item.reliability_score || 5,
      stories: item.supporting_stories || [],
      methodology: item.methodology,
      baseline: item.baseline_value,
      target: item.target_value,
      collectionDate: item.collection_date,
      verified: item.verified || false,
      community: item.communities?.name || 'Unknown',
      organization: item.worker_programs?.organization_name || 'Unknown'
    })) || [];

    return NextResponse.json({ evidence });
  } catch (error) {
    console.error('Impact evidence API error:', error);
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
      case 'addEvidence':
        const {
          organizationId,
          programId,
          evidenceType,
          metricName,
          metricValue,
          timeframe,
          dataSource,
          reliabilityScore,
          supportingStories,
          methodology,
          baselineValue,
          targetValue
        } = data;

        if (!organizationId || !programId || !metricName || !metricValue) {
          return NextResponse.json(
            { error: 'Organization ID, program ID, metric name, and value are required' },
            { status: 400 }
          );
        }

        const { data: newEvidence, error: createError } = await supabase
          .from('impact_evidence')
          .insert([{
            organization_id: organizationId,
            program_id: programId,
            evidence_type: evidenceType || 'quantitative',
            metric_name: metricName,
            metric_value: metricValue,
            timeframe: timeframe,
            data_source: dataSource,
            reliability_score: reliabilityScore || 5,
            supporting_stories: supportingStories || [],
            methodology: methodology,
            baseline_value: baselineValue,
            target_value: targetValue,
            collection_date: new Date().toISOString(),
            verified: false
          }])
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to add evidence: ${createError.message}`);
        }

        return NextResponse.json({
          evidence: newEvidence,
          message: 'Impact evidence added successfully'
        }, { status: 201 });

      case 'generateReport':
        const { organizationId: reportOrgId, programIds, reportType, dateRange } = data;

        const report = await generateImpactReport({
          organizationId: reportOrgId,
          programIds,
          reportType: reportType || 'comprehensive',
          dateRange
        });

        return NextResponse.json({ report });

      case 'verifyEvidence':
        const { evidenceId, verifiedBy, verificationNotes } = data;

        if (!evidenceId || !verifiedBy) {
          return NextResponse.json(
            { error: 'Evidence ID and verifier are required' },
            { status: 400 }
          );
        }

        const { error: verifyError } = await supabase
          .from('impact_evidence')
          .update({
            verified: true,
            verified_by: verifiedBy,
            verification_date: new Date().toISOString(),
            verification_notes: verificationNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', evidenceId);

        if (verifyError) {
          throw new Error(`Failed to verify evidence: ${verifyError.message}`);
        }

        return NextResponse.json({
          message: 'Evidence verified successfully'
        });

      case 'analyzeImpact':
        const { programId: analyzeProgram, analysisType } = data;

        const impactAnalysis = await analyzeProgram(analyzeProgram, analysisType);
        return NextResponse.json({ analysis: impactAnalysis });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Impact evidence POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateImpactReport(params: {
  organizationId: string;
  programIds?: string[];
  reportType: string;
  dateRange?: { start: string; end: string };
}): Promise<any> {
  try {
    // Get evidence data for report
    let query = supabase
      .from('impact_evidence')
      .select(`
        *,
        worker_programs(program_name, program_type, organization_name),
        communities(name, region, population)
      `)
      .eq('organization_id', params.organizationId);

    if (params.programIds && params.programIds.length > 0) {
      query = query.in('program_id', params.programIds);
    }

    if (params.dateRange) {
      query = query
        .gte('collection_date', params.dateRange.start)
        .lte('collection_date', params.dateRange.end);
    }

    const { data: evidence, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch evidence: ${error.message}`);
    }

    // Generate report based on type
    const report = {
      reportType: params.reportType,
      generatedAt: new Date().toISOString(),
      organizationId: params.organizationId,
      summary: generateReportSummary(evidence || []),
      programs: generateProgramSummaries(evidence || []),
      keyFindings: generateKeyFindings(evidence || []),
      recommendations: generateRecommendations(evidence || []),
      methodology: generateMethodologySection(evidence || []),
      appendices: {
        rawData: evidence || [],
        dataQuality: assessDataQuality(evidence || [])
      }
    };

    return report;
  } catch (error) {
    console.error('Error generating impact report:', error);
    return {
      reportType: params.reportType,
      generatedAt: new Date().toISOString(),
      error: 'Failed to generate report',
      summary: {},
      programs: [],
      keyFindings: [],
      recommendations: []
    };
  }
}

function generateReportSummary(evidence: any[]): any {
  const programs = [...new Set(evidence.map((e: any) => e.program_id))];
  const communities = [...new Set(evidence.map((e: any) => e.communities?.name).filter(Boolean))];
  const verifiedEvidence = evidence.filter((e: any) => e.verified);

  // Calculate aggregate metrics
  const quantitativeEvidence = evidence.filter((e: any) => e.evidence_type === 'quantitative');
  const qualitativeEvidence = evidence.filter((e: any) => e.evidence_type === 'qualitative');

  const avgReliability = evidence.length > 0
    ? evidence.reduce((sum: number, e: any) => sum + (e.reliability_score || 0), 0) / evidence.length
    : 0;

  return {
    totalPrograms: programs.length,
    totalCommunities: communities.length,
    totalEvidenceItems: evidence.length,
    verifiedEvidence: verifiedEvidence.length,
    quantitativeEvidence: quantitativeEvidence.length,
    qualitativeEvidence: qualitativeEvidence.length,
    averageReliability: Math.round(avgReliability * 10) / 10,
    dataQualityScore: calculateDataQualityScore(evidence)
  };
}

function generateProgramSummaries(evidence: any[]): any[] {
  const programGroups = evidence.reduce((groups, item) => {
    const programId = item.program_id;
    if (!groups[programId]) {
      groups[programId] = [];
    }
    groups[programId].push(item);
    return groups;
  }, {} as Record<string, any>);

  return Object.entries(programGroups).map(([programId, programEvidence]: [string, any]) => {
    const firstItem = programEvidence[0];
    const quantitative = programEvidence.filter((e: any) => e.evidence_type === 'quantitative');
    const qualitative = programEvidence.filter((e: any) => e.evidence_type === 'qualitative');

    return {
      programId,
      programName: firstItem.worker_programs?.program_name || 'Unknown',
      programType: firstItem.worker_programs?.program_type || 'Unknown',
      community: firstItem.communities?.name || 'Unknown',
      evidenceCount: programEvidence.length,
      quantitativeMetrics: quantitative.length,
      qualitativeInsights: qualitative.length,
      keyMetrics: extractKeyMetrics(programEvidence),
      impactStories: extractImpactStories(programEvidence),
      dataQuality: assessProgramDataQuality(programEvidence)
    };
  });
}

function extractKeyMetrics(evidence: any[]): any[] {
  return evidence
    .filter((e: any) => e.evidence_type === 'quantitative')
    .map((e: any) => ({
      metric: e.metric_name,
      value: e.metric_value,
      baseline: e.baseline_value,
      target: e.target_value,
      timeframe: e.timeframe,
      reliability: e.reliability_score
    }))
    .sort((a, b) => (b.reliability || 0) - (a.reliability || 0))
    .slice(0, 5); // Top 5 most reliable metrics
}

function extractImpactStories(evidence: any[]): string[] {
  const allStories = evidence.flatMap(e => e.supporting_stories || []);
  return [...new Set(allStories)].slice(0, 10); // Unique stories, max 10
}

function assessProgramDataQuality(evidence: any[]): any {
  const verified = evidence.filter((e: any) => e.verified).length;
  const withBaseline = evidence.filter((e: any) => e.baseline_value).length;
  const withTarget = evidence.filter((e: any) => e.target_value).length;
  const highReliability = evidence.filter((e: any) => (e.reliability_score || 0) >= 7).length;

  const total = evidence.length;

  return {
    verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
    baselineRate: total > 0 ? Math.round((withBaseline / total) * 100) : 0,
    targetRate: total > 0 ? Math.round((withTarget / total) * 100) : 0,
    highReliabilityRate: total > 0 ? Math.round((highReliability / total) * 100) : 0,
    overallScore: total > 0 ? Math.round(((verified + withBaseline + withTarget + highReliability) / (total * 4)) * 100) : 0
  };
}

function generateKeyFindings(evidence: any[]): string[] {
  const findings = [];

  // Data coverage findings
  const programs = [...new Set(evidence.map((e: any) => e.program_id))];
  const communities = [...new Set(evidence.map((e: any) => e.communities?.name).filter(Boolean))];

  findings.push(`Impact data collected across ${programs.length} programs in ${communities.length} communities`);

  // Data quality findings
  const verifiedRate = evidence.length > 0
    ? (evidence.filter((e: any) => e.verified).length / evidence.length) * 100
    : 0;

  if (verifiedRate >= 80) {
    findings.push(`High data verification rate (${Math.round(verifiedRate)}%) indicates strong evidence quality`);
  } else if (verifiedRate < 50) {
    findings.push(`Low data verification rate (${Math.round(verifiedRate)}%) suggests need for improved validation processes`);
  }

  // Evidence type findings
  const quantitative = evidence.filter((e: any) => e.evidence_type === 'quantitative').length;
  const qualitative = evidence.filter((e: any) => e.evidence_type === 'qualitative').length;

  if (quantitative > qualitative * 2) {
    findings.push('Strong quantitative evidence base with opportunities to enhance qualitative insights');
  } else if (qualitative > quantitative * 2) {
    findings.push('Rich qualitative evidence with opportunities to strengthen quantitative measurement');
  } else {
    findings.push('Balanced mix of quantitative and qualitative evidence provides comprehensive impact picture');
  }

  // Reliability findings
  const avgReliability = evidence.length > 0
    ? evidence.reduce((sum: number, e: any) => sum + (e.reliability_score || 0), 0) / evidence.length
    : 0;

  if (avgReliability >= 7) {
    findings.push(`High average reliability score (${avgReliability.toFixed(1)}/10) indicates trustworthy evidence`);
  } else if (avgReliability < 5) {
    findings.push(`Low average reliability score (${avgReliability.toFixed(1)}/10) suggests need for improved data collection methods`);
  }

  return findings;
}

function generateRecommendations(evidence: any[]): string[] {
  const recommendations = [];

  // Data quality recommendations
  const unverified = evidence.filter((e: any) => !e.verified).length;
  if (unverified > 0) {
    recommendations.push(`Verify ${unverified} unverified evidence items to improve data credibility`);
  }

  const withoutBaseline = evidence.filter((e: any) => !e.baseline_value).length;
  if (withoutBaseline > evidence.length * 0.3) {
    recommendations.push('Establish baseline measurements for better impact assessment');
  }

  const withoutTargets = evidence.filter((e: any) => !e.target_value).length;
  if (withoutTargets > evidence.length * 0.3) {
    recommendations.push('Set clear targets for all metrics to enable progress tracking');
  }

  // Evidence type recommendations
  const quantitative = evidence.filter((e: any) => e.evidence_type === 'quantitative').length;
  const qualitative = evidence.filter((e: any) => e.evidence_type === 'qualitative').length;

  if (quantitative < qualitative * 0.5) {
    recommendations.push('Strengthen quantitative measurement to complement qualitative insights');
  }

  if (qualitative < quantitative * 0.5) {
    recommendations.push('Enhance qualitative data collection to provide context for quantitative results');
  }

  // General recommendations
  recommendations.push('Implement regular data collection schedules for consistent monitoring');
  recommendations.push('Develop standardized metrics across similar programs for better comparison');
  recommendations.push('Create data sharing protocols to maximize evidence utilization');

  return recommendations;
}

function generateMethodologySection(evidence: any[]): any {
  const methodologies = [...new Set(evidence.map((e: any) => e.methodology).filter(Boolean))];
  const dataSources = [...new Set(evidence.map((e: any) => e.data_source).filter(Boolean))];
  const evidenceTypes = [...new Set(evidence.map((e: any) => e.evidence_type))];

  return {
    dataCollectionMethods: methodologies,
    dataSources: dataSources,
    evidenceTypes: evidenceTypes,
    collectionPeriod: {
      start: evidence.length > 0 ? Math.min(...evidence.map((e: any) => new Date(e.collection_date).getTime())) : null,
      end: evidence.length > 0 ? Math.max(...evidence.map((e: any) => new Date(e.collection_date).getTime())) : null
    },
    qualityAssurance: {
      verificationProcess: 'Evidence items undergo verification by program managers',
      reliabilityScoring: 'All evidence rated on 1-10 reliability scale',
      dataValidation: 'Cross-referencing with program records and community feedback'
    }
  };
}

function calculateDataQualityScore(evidence: any[]): number {
  if (evidence.length === 0) return 0;

  const verified = evidence.filter((e: any) => e.verified).length;
  const withBaseline = evidence.filter((e: any) => e.baseline_value).length;
  const withTarget = evidence.filter((e: any) => e.target_value).length;
  const withMethodology = evidence.filter((e: any) => e.methodology).length;
  const highReliability = evidence.filter((e: any) => (e.reliability_score || 0) >= 7).length;

  const total = evidence.length;
  const maxScore = total * 5; // 5 quality criteria
  const actualScore = verified + withBaseline + withTarget + withMethodology + highReliability;

  return Math.round((actualScore / maxScore) * 100);
}

function assessDataQuality(evidence: any[]): any {
  return {
    totalItems: evidence.length,
    qualityScore: calculateDataQualityScore(evidence),
    verificationRate: evidence.length > 0 ? Math.round((evidence.filter((e: any) => e.verified).length / evidence.length) * 100) : 0,
    reliabilityDistribution: {
      high: evidence.filter((e: any) => (e.reliability_score || 0) >= 7).length,
      medium: evidence.filter((e: any) => (e.reliability_score || 0) >= 4 && (e.reliability_score || 0) < 7).length,
      low: evidence.filter((e: any) => (e.reliability_score || 0) < 4).length
    },
    completeness: {
      withBaseline: evidence.filter((e: any) => e.baseline_value).length,
      withTarget: evidence.filter((e: any) => e.target_value).length,
      withMethodology: evidence.filter((e: any) => e.methodology).length,
      withStories: evidence.filter((e: any) => e.supporting_stories && e.supporting_stories.length > 0).length
    }
  };
}

async function analyzeProgram(programId: string, analysisType: string): Promise<any> {
  try {
    // Get all evidence for the program
    const { data: evidence, error } = await supabase
      .from('impact_evidence')
      .select(`
        *,
        worker_programs(program_name, program_type, organization_name),
        communities(name, population)
      `)
      .eq('program_id', programId);

    if (error) {
      throw new Error(`Failed to fetch program evidence: ${error.message}`);
    }

    if (!evidence || evidence.length === 0) {
      return {
        programId,
        analysisType,
        message: 'No evidence available for analysis',
        overallImpact: 0,
        keyMetrics: [],
        trends: {},
        recommendations: []
      };
    }

    const analysis = {
      programId,
      programName: evidence[0].worker_programs?.program_name || 'Unknown',
      analysisType,
      overallImpact: calculateOverallImpact(evidence),
      keyMetrics: extractKeyMetrics(evidence),
      impactTrends: analyzeImpactTrends(evidence),
      outcomeAchievement: analyzeOutcomeAchievement(evidence),
      dataQuality: assessProgramDataQuality(evidence),
      recommendations: generateProgramRecommendations(evidence),
      comparativeBenchmarks: generateBenchmarks(evidence)
    };

    return analysis;
  } catch (error) {
    console.error('Error analyzing program impact:', error);
    return {
      programId,
      analysisType,
      error: 'Analysis failed',
      overallImpact: 0,
      keyMetrics: [],
      recommendations: []
    };
  }
}

function calculateOverallImpact(evidence: any[]): number {
  // Simple impact calculation based on target achievement
  const withTargets = evidence.filter((e: any) => e.target_value && e.metric_value);

  if (withTargets.length === 0) return 0;

  const achievements = withTargets.map((e: any) => {
    const target = parseFloat(e.target_value);
    const actual = parseFloat(e.metric_value);

    if (isNaN(target) || isNaN(actual) || target === 0) return 0;

    return Math.min((actual / target) * 100, 150); // Cap at 150% achievement
  });

  return Math.round(achievements.reduce((sum, achievement) => sum + achievement, 0) / achievements.length);
}

function analyzeImpactTrends(evidence: any[]): any {
  // Group evidence by metric and analyze trends over time
  const metricGroups = evidence.reduce((groups, item) => {
    if (!groups[item.metric_name]) {
      groups[item.metric_name] = [];
    }
    groups[item.metric_name].push(item);
    return groups;
  }, {} as Record<string, any>);

  const trends: Record<string, any> = {};

  Object.entries(metricGroups).forEach(([metric, items]: [string, any]) => {
    if (items.length < 2) {
      trends[metric] = { trend: 'insufficient_data', message: 'Need more data points' };
      return;
    }

    const sortedItems = items.sort((a: any, b: any) =>
      new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime()
    );

    const firstValue = parseFloat(sortedItems[0].metric_value);
    const lastValue = parseFloat(sortedItems[sortedItems.length - 1].metric_value);

    if (isNaN(firstValue) || isNaN(lastValue)) {
      trends[metric] = { trend: 'invalid_data', message: 'Non-numeric data' };
      return;
    }

    const change = ((lastValue - firstValue) / firstValue) * 100;

    let trend = 'stable';
    if (change > 10) trend = 'improving';
    else if (change < -10) trend = 'declining';

    trends[metric] = {
      trend,
      change: Math.round(change * 100) / 100,
      firstValue,
      lastValue,
      dataPoints: sortedItems.length
    };
  });

  return trends;
}

function analyzeOutcomeAchievement(evidence: any[]): any {
  const withTargets = evidence.filter((e: any) => e.target_value && e.metric_value);

  if (withTargets.length === 0) {
    return {
      totalMetrics: evidence.length,
      metricsWithTargets: 0,
      achieved: 0,
      partiallyAchieved: 0,
      notAchieved: 0,
      overAchieved: 0
    };
  }

  let achieved = 0;
  let partiallyAchieved = 0;
  let notAchieved = 0;
  let overAchieved = 0;

  withTargets.forEach(e => {
    const target = parseFloat(e.target_value);
    const actual = parseFloat(e.metric_value);

    if (isNaN(target) || isNaN(actual)) return;

    const achievement = (actual / target) * 100;

    if (achievement >= 100) {
      if (achievement > 120) overAchieved++;
      else achieved++;
    } else if (achievement >= 70) {
      partiallyAchieved++;
    } else {
      notAchieved++;
    }
  });

  return {
    totalMetrics: evidence.length,
    metricsWithTargets: withTargets.length,
    achieved,
    partiallyAchieved,
    notAchieved,
    overAchieved,
    achievementRate: withTargets.length > 0 ? Math.round(((achieved + overAchieved) / withTargets.length) * 100) : 0
  };
}

function generateProgramRecommendations(evidence: any[]): string[] {
  const recommendations = [];

  // Based on outcome achievement
  const outcomeAnalysis = analyzeOutcomeAchievement(evidence);
  if (outcomeAnalysis.achievementRate < 70) {
    recommendations.push('Review program implementation to improve target achievement');
  }

  if (outcomeAnalysis.overAchieved > 0) {
    recommendations.push('Consider scaling up successful interventions that exceeded targets');
  }

  // Based on data quality
  const dataQuality = assessProgramDataQuality(evidence);
  if (dataQuality.verificationRate < 80) {
    recommendations.push('Improve evidence verification processes');
  }

  if (dataQuality.baselineRate < 70) {
    recommendations.push('Establish baseline measurements for all key metrics');
  }

  // Based on trends
  const trends = analyzeImpactTrends(evidence);
  const decliningMetrics = Object.entries(trends).filter(([_, trend]: [string, any]) => trend.trend === 'declining');

  if (decliningMetrics.length > 0) {
    recommendations.push(`Address declining trends in: ${decliningMetrics.map(([metric, _]) => metric).join(', ')}`);
  }

  // General recommendations
  recommendations.push('Maintain regular data collection and monitoring schedule');
  recommendations.push('Document and share successful practices with other programs');

  return recommendations;
}

function generateBenchmarks(evidence: any[]): any {
  // Simple benchmarking against typical program performance
  const benchmarks = {
    dataQuality: {
      target: 80,
      actual: calculateDataQualityScore(evidence),
      status: calculateDataQualityScore(evidence) >= 80 ? 'meeting' : 'below'
    },
    verificationRate: {
      target: 90,
      actual: evidence.length > 0 ? Math.round((evidence.filter((e: any) => e.verified).length / evidence.length) * 100) : 0,
      status: evidence.length > 0 && (evidence.filter((e: any) => e.verified).length / evidence.length) >= 0.9 ? 'meeting' : 'below'
    },
    evidenceDiversity: {
      target: 2, // Both quantitative and qualitative
      actual: [...new Set(evidence.map((e: any) => e.evidence_type))].length,
      status: [...new Set(evidence.map((e: any) => e.evidence_type))].length >= 2 ? 'meeting' : 'below'
    }
  };

  return benchmarks;
}