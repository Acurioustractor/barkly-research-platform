export * from './ai/types';
export * from './ai/service';
import { CommunityIntelligenceResult } from './ai/types';

// Community Health Calculation
export interface CommunityHealth {
  communityId: string;
  name: string;
  status: 'thriving' | 'developing' | 'struggling' | 'improving';
  healthScore: number; // 0-100
  indicators: {
    youthEngagement: number;
    serviceAccess: number;
    culturalConnection: number;
    economicOpportunity: number;
    safetyWellbeing: number;
  };
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number; // rate of change
    confidence: number; // 0-1
  };
  lastUpdated: Date;
}

export async function calculateCommunityHealth(
  communityId: string,
  communityName: string,
  intelligenceData: CommunityIntelligenceResult[]
): Promise<CommunityHealth> {
  // Aggregate all intelligence data for this community
  const allNeeds = intelligenceData.flatMap(d => d.communityNeeds);
  const allGaps = intelligenceData.flatMap(d => d.serviceGaps);
  const allAssets = intelligenceData.flatMap(d => d.assets);
  const allSuccessPatterns = intelligenceData.flatMap(d => d.successPatterns);
  const allOpportunities = intelligenceData.flatMap(d => d.opportunities);

  // Calculate individual indicators (0-100 scale)
  const youthEngagement = calculateYouthEngagement(allNeeds, allAssets, allSuccessPatterns);
  const serviceAccess = calculateServiceAccess(allGaps, allAssets);
  const culturalConnection = calculateCulturalConnection(allAssets, allSuccessPatterns);
  const economicOpportunity = calculateEconomicOpportunity(allNeeds, allOpportunities, allAssets);
  const safetyWellbeing = calculateSafetyWellbeing(allNeeds, allAssets);

  // Overall health score (weighted average)
  const healthScore = Math.round(
    (youthEngagement * 0.25) +
    (serviceAccess * 0.2) +
    (culturalConnection * 0.2) +
    (economicOpportunity * 0.2) +
    (safetyWellbeing * 0.15)
  );

  // Determine status based on health score
  let status: 'thriving' | 'developing' | 'struggling' | 'improving';
  if (healthScore >= 80) status = 'thriving';
  else if (healthScore >= 60) status = 'developing';
  else if (healthScore >= 40) status = 'improving';
  else status = 'struggling';

  // Calculate trends (simplified - would need historical data for real trends)
  const trends = {
    direction: 'stable' as const, // Would calculate from historical data
    velocity: 0, // Rate of change over time
    confidence: 0.7 // Confidence in the trend calculation
  };

  return {
    communityId,
    name: communityName,
    status,
    healthScore,
    indicators: {
      youthEngagement,
      serviceAccess,
      culturalConnection,
      economicOpportunity,
      safetyWellbeing
    },
    trends,
    lastUpdated: new Date()
  };
}

// Helper functions for calculating specific indicators
function calculateYouthEngagement(needs: any[], assets: any[], patterns: any[]): number {
  // Look for youth-related needs, assets, and success patterns
  const youthNeeds = needs.filter(n =>
    n.category === 'youth_development' ||
    n.need.toLowerCase().includes('youth') ||
    n.need.toLowerCase().includes('young')
  );

  const youthAssets = assets.filter(a =>
    a.asset.toLowerCase().includes('youth') ||
    a.asset.toLowerCase().includes('young') ||
    a.type === 'cultural' // Cultural assets often engage youth
  );

  const youthPatterns = patterns.filter(p =>
    p.pattern.toLowerCase().includes('youth') ||
    p.pattern.toLowerCase().includes('young')
  );

  // Higher assets and patterns = higher engagement
  // Higher critical needs = lower engagement
  const criticalNeeds = youthNeeds.filter(n => n.urgency === 'critical').length;
  const totalAssets = youthAssets.length;
  const successPatterns = youthPatterns.length;

  // Simple scoring algorithm (would be refined with real data)
  let score = 50; // Base score
  score += (totalAssets * 10); // Assets boost score
  score += (successPatterns * 15); // Success patterns boost more
  score -= (criticalNeeds * 20); // Critical needs reduce score

  return Math.max(0, Math.min(100, score));
}

function calculateServiceAccess(gaps: any[], assets: any[]): number {
  // Service gaps reduce access, service assets improve access
  const criticalGaps = gaps.filter(g => g.urgency === 'critical').length;
  const highGaps = gaps.filter(g => g.urgency === 'high').length;
  const serviceAssets = assets.filter(a => a.type === 'physical' || a.type === 'social').length;

  let score = 70; // Base score (assuming some services exist)
  score -= (criticalGaps * 25); // Critical gaps heavily impact
  score -= (highGaps * 15); // High priority gaps impact
  score += (serviceAssets * 8); // Service assets improve access

  return Math.max(0, Math.min(100, score));
}

function calculateCulturalConnection(assets: any[], patterns: any[]): number {
  // Cultural assets and patterns indicate strong cultural connection
  const culturalAssets = assets.filter(a => a.type === 'cultural').length;
  const culturalPatterns = patterns.filter(p =>
    p.pattern.toLowerCase().includes('cultural') ||
    p.pattern.toLowerCase().includes('elder') ||
    p.pattern.toLowerCase().includes('traditional')
  ).length;

  let score = 60; // Base score
  score += (culturalAssets * 12); // Cultural assets boost score
  score += (culturalPatterns * 18); // Cultural success patterns boost more

  return Math.max(0, Math.min(100, score));
}

function calculateEconomicOpportunity(needs: any[], opportunities: any[], assets: any[]): number {
  // Employment needs reduce score, economic opportunities and assets improve it
  const employmentNeeds = needs.filter(n =>
    n.category === 'employment' ||
    n.need.toLowerCase().includes('job') ||
    n.need.toLowerCase().includes('work') ||
    n.need.toLowerCase().includes('employment')
  );

  const economicOpportunities = opportunities.filter(o =>
    o.opportunity.toLowerCase().includes('job') ||
    o.opportunity.toLowerCase().includes('employment') ||
    o.opportunity.toLowerCase().includes('economic') ||
    o.opportunity.toLowerCase().includes('business')
  );

  const economicAssets = assets.filter(a => a.type === 'economic').length;

  const criticalEmploymentNeeds = employmentNeeds.filter(n => n.urgency === 'critical').length;

  let score = 45; // Lower base score (economic opportunity often challenging)
  score += (economicOpportunities.length * 15); // Opportunities boost score
  score += (economicAssets * 12); // Economic assets boost score
  score -= (criticalEmploymentNeeds * 20); // Critical employment needs reduce score

  return Math.max(0, Math.min(100, score));
}

function calculateSafetyWellbeing(needs: any[], assets: any[]): number {
  // Safety and health needs reduce score, relevant assets improve it
  const safetyNeeds = needs.filter(n =>
    n.category === 'health' ||
    n.category === 'justice' ||
    n.need.toLowerCase().includes('safe') ||
    n.need.toLowerCase().includes('health') ||
    n.need.toLowerCase().includes('mental')
  );

  const wellbeingAssets = assets.filter(a =>
    a.asset.toLowerCase().includes('health') ||
    a.asset.toLowerCase().includes('safe') ||
    a.asset.toLowerCase().includes('support') ||
    a.type === 'social'
  );

  const criticalSafetyNeeds = safetyNeeds.filter(n => n.urgency === 'critical').length;
  const highSafetyNeeds = safetyNeeds.filter(n => n.urgency === 'high').length;

  let score = 65; // Base score
  score += (wellbeingAssets.length * 10); // Wellbeing assets boost score
  score -= (criticalSafetyNeeds * 25); // Critical safety needs heavily impact
  score -= (highSafetyNeeds * 15); // High priority safety needs impact

  return Math.max(0, Math.min(100, score));
}