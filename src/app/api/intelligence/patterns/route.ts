import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'trends', 'gaps', 'opportunities', 'risks'
    const communityId = searchParams.get('communityId');

    let patterns;

    switch (type) {
      case 'trends':
        patterns = await getCrossCommunityTrends(communityId);
        break;
      case 'gaps':
        patterns = await getServiceGapPatterns(communityId);
        break;
      case 'opportunities':
        patterns = await getOpportunityPatterns(communityId);
        break;
      case 'risks':
        patterns = await getRiskPatterns(communityId);
        break;
      default:
        patterns = await getAllPatterns(communityId);
    }

    return NextResponse.json({
      success: true,
      patterns,
      type: type || 'all'
    });

  } catch (error) {
    console.error('Pattern recognition error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getCrossCommunityTrends(communityId?: string | null) {
  try {
    // Get all documents with AI analysis
    const whereClause = communityId ? { community_id: communityId } : {};
    
    const documents = await prisma.document.findMany({
      where: {
        ...whereClause,
        ai_analysis: { not: null }
      },
      select: {
        id: true,
        community_id: true,
        ai_analysis: true,
        community: {
          select: { name: true }
        }
      }
    });

    // Extract themes and needs across communities
    const themeMap = new Map<string, { communities: Set<string>; count: number; evidence: string[] }>();
    const needMap = new Map<string, { communities: Set<string>; urgency: string[]; count: number }>();

    documents.forEach(doc => {
      const intelligence = doc.ai_analysis?.intelligence;
      const communityName = doc.community?.name || 'Unknown';

      if (intelligence) {
        // Process themes
        intelligence.themes?.forEach((theme: any) => {
          if (!themeMap.has(theme.name)) {
            themeMap.set(theme.name, { communities: new Set(), count: 0, evidence: [] });
          }
          const themeData = themeMap.get(theme.name)!;
          themeData.communities.add(communityName);
          themeData.count++;
          themeData.evidence.push(theme.evidence);
        });

        // Process community needs
        intelligence.communityNeeds?.forEach((need: any) => {
          const needKey = need.category || need.need;
          if (!needMap.has(needKey)) {
            needMap.set(needKey, { communities: new Set(), urgency: [], count: 0 });
          }
          const needData = needMap.get(needKey)!;
          needData.communities.add(communityName);
          needData.urgency.push(need.urgency);
          needData.count++;
        });
      }
    });

    // Convert to trend analysis
    const trends = Array.from(themeMap.entries())
      .filter(([_, data]) => data.communities.size > 1) // Cross-community trends
      .map(([theme, data]) => ({
        trend: theme,
        communities: Array.from(data.communities),
        strength: data.count,
        trajectory: data.count > 5 ? 'growing' : 'emerging',
        implications: [`Appears across ${data.communities.size} communities`, `Mentioned ${data.count} times`]
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);

    const needTrends = Array.from(needMap.entries())
      .filter(([_, data]) => data.communities.size > 1)
      .map(([need, data]) => {
        const criticalCount = data.urgency.filter(u => u === 'critical').length;
        const highCount = data.urgency.filter(u => u === 'high').length;
        
        return {
          trend: `${need} needs`,
          communities: Array.from(data.communities),
          strength: data.count,
          trajectory: criticalCount > 0 ? 'critical' : highCount > 0 ? 'growing' : 'stable',
          implications: [
            `Identified in ${data.communities.size} communities`,
            `${criticalCount} critical, ${highCount} high priority instances`
          ]
        };
      })
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10);

    return {
      crossCommunityTrends: trends,
      needTrends: needTrends,
      summary: {
        total_documents: documents.length,
        communities_analyzed: new Set(documents.map(d => d.community?.name).filter(Boolean)).size,
        trends_identified: trends.length + needTrends.length
      }
    };

  } catch (error) {
    console.error('Error analyzing cross-community trends:', error);
    throw error;
  }
}

async function getServiceGapPatterns(communityId?: string | null) {
  try {
    const whereClause = communityId ? { community_id: communityId } : {};
    
    const documents = await prisma.document.findMany({
      where: {
        ...whereClause,
        ai_analysis: { not: null }
      },
      select: {
        ai_analysis: true,
        community: { select: { name: true } }
      }
    });

    const gapMap = new Map<string, { locations: Set<string>; impact: number[]; urgency: string[] }>();

    documents.forEach(doc => {
      const intelligence = doc.ai_analysis?.intelligence;
      const communityName = doc.community?.name || 'Unknown';

      intelligence?.serviceGaps?.forEach((gap: any) => {
        if (!gapMap.has(gap.service)) {
          gapMap.set(gap.service, { locations: new Set(), impact: [], urgency: [] });
        }
        const gapData = gapMap.get(gap.service)!;
        gapData.locations.add(gap.location || communityName);
        gapData.impact.push(gap.impact || 5);
        gapData.urgency.push(gap.urgency || 'medium');
      });
    });

    const gapPatterns = Array.from(gapMap.entries())
      .map(([service, data]) => {
        const avgImpact = data.impact.reduce((a, b) => a + b, 0) / data.impact.length;
        const criticalCount = data.urgency.filter(u => u === 'critical').length;
        
        return {
          service,
          locations: Array.from(data.locations),
          averageImpact: Math.round(avgImpact * 10) / 10,
          urgencyDistribution: {
            critical: criticalCount,
            high: data.urgency.filter(u => u === 'high').length,
            medium: data.urgency.filter(u => u === 'medium').length,
            low: data.urgency.filter(u => u === 'low').length
          },
          priority: criticalCount > 0 ? 'critical' : avgImpact > 7 ? 'high' : 'medium'
        };
      })
      .sort((a, b) => b.averageImpact - a.averageImpact);

    return {
      serviceGaps: gapPatterns,
      summary: {
        total_gaps_identified: gapPatterns.length,
        critical_gaps: gapPatterns.filter(g => g.priority === 'critical').length,
        high_impact_gaps: gapPatterns.filter(g => g.averageImpact > 7).length
      }
    };

  } catch (error) {
    console.error('Error analyzing service gap patterns:', error);
    throw error;
  }
}

async function getOpportunityPatterns(communityId?: string | null) {
  try {
    const whereClause = communityId ? { community_id: communityId } : {};
    
    const documents = await prisma.document.findMany({
      where: {
        ...whereClause,
        ai_analysis: { not: null }
      },
      select: {
        ai_analysis: true,
        community: { select: { name: true } }
      }
    });

    const opportunityMap = new Map<string, { communities: Set<string>; potential: number[]; timelines: string[] }>();

    documents.forEach(doc => {
      const intelligence = doc.ai_analysis?.intelligence;
      const communityName = doc.community?.name || 'Unknown';

      intelligence?.opportunities?.forEach((opp: any) => {
        const oppKey = opp.opportunity;
        if (!opportunityMap.has(oppKey)) {
          opportunityMap.set(oppKey, { communities: new Set(), potential: [], timelines: [] });
        }
        const oppData = opportunityMap.get(oppKey)!;
        oppData.communities.add(communityName);
        oppData.potential.push(opp.potential || 5);
        oppData.timelines.push(opp.timeline || 'medium-term');
      });
    });

    const opportunities = Array.from(opportunityMap.entries())
      .map(([opportunity, data]) => {
        const avgPotential = data.potential.reduce((a, b) => a + b, 0) / data.potential.length;
        
        return {
          opportunity,
          communities: Array.from(data.communities),
          averagePotential: Math.round(avgPotential * 10) / 10,
          replicability: data.communities.size > 1 ? 'high' : 'medium',
          commonTimelines: [...new Set(data.timelines)]
        };
      })
      .sort((a, b) => b.averagePotential - a.averagePotential);

    return {
      opportunities,
      summary: {
        total_opportunities: opportunities.length,
        high_potential: opportunities.filter(o => o.averagePotential > 7).length,
        cross_community: opportunities.filter(o => o.communities.length > 1).length
      }
    };

  } catch (error) {
    console.error('Error analyzing opportunity patterns:', error);
    throw error;
  }
}

async function getRiskPatterns(communityId?: string | null) {
  try {
    const whereClause = communityId ? { community_id: communityId } : {};
    
    const documents = await prisma.document.findMany({
      where: {
        ...whereClause,
        ai_analysis: { not: null }
      },
      select: {
        ai_analysis: true,
        community: { select: { name: true } }
      }
    });

    const riskMap = new Map<string, { communities: Set<string>; probability: number[]; impact: number[] }>();

    documents.forEach(doc => {
      const intelligence = doc.ai_analysis?.intelligence;
      const communityName = doc.community?.name || 'Unknown';

      intelligence?.riskFactors?.forEach((risk: any) => {
        if (!riskMap.has(risk.risk)) {
          riskMap.set(risk.risk, { communities: new Set(), probability: [], impact: [] });
        }
        const riskData = riskMap.get(risk.risk)!;
        riskData.communities.add(communityName);
        riskData.probability.push(risk.probability || 0.5);
        riskData.impact.push(risk.impact || 5);
      });
    });

    const risks = Array.from(riskMap.entries())
      .map(([risk, data]) => {
        const avgProbability = data.probability.reduce((a, b) => a + b, 0) / data.probability.length;
        const avgImpact = data.impact.reduce((a, b) => a + b, 0) / data.impact.length;
        const riskScore = avgProbability * avgImpact;
        
        return {
          risk,
          communities: Array.from(data.communities),
          averageProbability: Math.round(avgProbability * 100) / 100,
          averageImpact: Math.round(avgImpact * 10) / 10,
          riskScore: Math.round(riskScore * 10) / 10,
          priority: riskScore > 5 ? 'high' : riskScore > 3 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      risks,
      summary: {
        total_risks: risks.length,
        high_priority: risks.filter(r => r.priority === 'high').length,
        cross_community: risks.filter(r => r.communities.length > 1).length
      }
    };

  } catch (error) {
    console.error('Error analyzing risk patterns:', error);
    throw error;
  }
}

async function getAllPatterns(communityId?: string | null) {
  try {
    const [trends, gaps, opportunities, risks] = await Promise.all([
      getCrossCommunityTrends(communityId),
      getServiceGapPatterns(communityId),
      getOpportunityPatterns(communityId),
      getRiskPatterns(communityId)
    ]);

    return {
      trends,
      serviceGaps: gaps,
      opportunities,
      risks,
      summary: {
        analysis_scope: communityId ? 'single_community' : 'regional',
        patterns_identified: {
          trends: trends.crossCommunityTrends.length + trends.needTrends.length,
          service_gaps: gaps.serviceGaps.length,
          opportunities: opportunities.opportunities.length,
          risks: risks.risks.length
        }
      }
    };

  } catch (error) {
    console.error('Error analyzing all patterns:', error);
    throw error;
  }
}