import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeCommunityIntelligence } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get community needs, service gaps, and success patterns
    let needsQuery = supabase
      .from('community_needs')
      .select(`
        *,
        communities(name, region)
      `)
      .order('urgency_score', { ascending: false });

    let gapsQuery = supabase
      .from('service_gaps')
      .select(`
        *,
        communities(name, region)
      `)
      .order('impact_score', { ascending: false });

    if (region) {
      needsQuery = needsQuery.eq('communities.region', region);
      gapsQuery = gapsQuery.eq('communities.region', region);
    }

    const [needsResult, gapsResult] = await Promise.all([
      needsQuery.limit(20),
      gapsQuery.limit(20)
    ]);

    if (needsResult.error || gapsResult.error) {
      console.error('Database error:', needsResult.error || gapsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch data for recommendations' },
        { status: 500 }
      );
    }

    // Generate investment recommendations based on needs and gaps
    const recommendations = await generateInvestmentRecommendations(
      needsResult.data || [],
      gapsResult.data || [],
      limit
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Investment recommendations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateInvestmentRecommendations(
  needs: any[],
  gaps: any[],
  limit: number
): Promise<any[]> {
  const recommendations = [];

  // Process high-priority needs
  for (const need of needs.slice(0, Math.ceil(limit * 0.6))) {
    const recommendation = {
      id: `need-${need.id}`,
      priority: calculatePriority(need.urgency_score, need.impact_score),
      investment: `Address ${need.need_category}: ${need.need_description}`,
      expectedROI: estimateROI(need.urgency_score, need.impact_score),
      communities: [need.communities?.name || 'Unknown'],
      evidence: [
        `Urgency score: ${need.urgency_score}/10`,
        `Impact score: ${need.impact_score}/10`,
        `Evidence: ${need.evidence_summary || 'Community feedback and analysis'}`
      ],
      timeline: estimateTimeline(need.urgency_score),
      estimatedCost: estimateCost(need.need_category, need.impact_score),
      potentialImpact: need.impact_score,
      riskLevel: assessRisk(need.urgency_score, need.impact_score),
      category: need.need_category || 'general'
    };
    recommendations.push(recommendation);
  }

  // Process critical service gaps
  for (const gap of gaps.slice(0, Math.ceil(limit * 0.4))) {
    const recommendation = {
      id: `gap-${gap.id}`,
      priority: calculatePriority(gap.severity_score, gap.impact_score),
      investment: `Fill service gap: ${gap.service_type} in ${gap.location}`,
      expectedROI: estimateROI(gap.severity_score, gap.impact_score),
      communities: [gap.communities?.name || 'Unknown'],
      evidence: [
        `Severity score: ${gap.severity_score}/10`,
        `Impact score: ${gap.impact_score}/10`,
        `Gap type: ${gap.gap_type}`,
        `Recommendations: ${gap.recommendations?.slice(0, 1).join(', ') || 'Service expansion needed'}`
      ],
      timeline: estimateTimeline(gap.severity_score),
      estimatedCost: estimateCost(gap.service_type, gap.impact_score),
      potentialImpact: gap.impact_score,
      riskLevel: assessRisk(gap.severity_score, gap.impact_score),
      category: gap.service_type || 'services'
    };
    recommendations.push(recommendation);
  }

  // Sort by priority and return top recommendations
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

function calculatePriority(urgency: number, impact: number): number {
  // Weighted priority calculation (urgency 60%, impact 40%)
  return Math.round((urgency * 0.6 + impact * 0.4));
}

function estimateROI(urgency: number, impact: number): number {
  // ROI estimation based on urgency and impact
  const baseROI = 15; // Base 15% ROI
  const urgencyBonus = urgency * 2; // Up to 20% bonus for urgency
  const impactBonus = impact * 1.5; // Up to 15% bonus for impact
  return Math.min(Math.round(baseROI + urgencyBonus + impactBonus), 85);
}

function estimateTimeline(urgency: number): string {
  if (urgency >= 8) return '3-6 months';
  if (urgency >= 6) return '6-12 months';
  if (urgency >= 4) return '12-18 months';
  return '18-24 months';
}

function estimateCost(category: string, impact: number): number {
  // Cost estimation based on category and impact (in thousands)
  const baseCosts = {
    'housing': 500,
    'health': 300,
    'education': 250,
    'employment': 200,
    'youth_development': 150,
    'cultural': 100,
    'services': 200,
    'general': 150
  };

  const baseCost = baseCosts[category as keyof typeof baseCosts] || 150;
  const impactMultiplier = 1 + (impact / 10); // Scale by impact
  return Math.round(baseCost * impactMultiplier);
}

function assessRisk(urgency: number, impact: number): 'low' | 'medium' | 'high' {
  const riskScore = (10 - urgency) + (10 - impact); // Lower urgency/impact = higher risk
  
  if (riskScore <= 6) return 'low';
  if (riskScore <= 12) return 'medium';
  return 'high';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generate':
        // Generate new recommendations based on current data
        const { region, categories, minPriority } = data;
        
        // This would trigger a fresh analysis of community data
        // For now, return a success response
        return NextResponse.json({ 
          message: 'New recommendations generation initiated',
          status: 'processing'
        });

      case 'approve':
        // Approve a recommendation for implementation
        const { recommendationId, approvedBy, notes } = data;
        
        // Save approval to database
        const { error } = await supabase
          .from('investment_approvals')
          .insert([{
            recommendation_id: recommendationId,
            approved_by: approvedBy,
            approval_date: new Date().toISOString(),
            notes: notes || null,
            status: 'approved'
          }]);

        if (error) {
          throw new Error(`Failed to save approval: ${error.message}`);
        }

        return NextResponse.json({ 
          message: 'Recommendation approved successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Investment recommendations POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}