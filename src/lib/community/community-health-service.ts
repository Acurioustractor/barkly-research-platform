import { prisma } from '@/lib/db/database';
import { calculateCommunityHealth, CommunityHealth } from '@/lib/ai-service';

// Extended community health interface with database integration
export interface CommunityHealthWithMetrics extends CommunityHealth {
  metrics: {
    totalDocuments: number;
    recentDocuments: number;
    analysisCompleteness: number;
    dataFreshness: number;
    communityEngagement: number;
  };
  insights: {
    topNeeds: Array<{ need: string; urgency: string; count: number }>;
    keyAssets: Array<{ asset: string; type: string; strength: number }>;
    criticalGaps: Array<{ service: string; impact: number; location: string }>;
    opportunities: Array<{ opportunity: string; potential: number; timeline: string }>;
  };
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number;
    confidence: number;
    recentChanges: Array<{ indicator: string; change: number; period: string }>;
  };
}

// Community health calculation service
export class CommunityHealthService {
  
  /**
   * Calculate comprehensive health for a specific community
   */
  async calculateCommunityHealth(communityId: string): Promise<CommunityHealthWithMetrics> {
    try {
      // Get community basic info
      const community = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM communities WHERE id = ${communityId}::uuid
      `;

      if (!community || community.length === 0) {
        throw new Error(`Community not found: ${communityId}`);
      }

      const communityInfo = community[0];

      // Get all documents for this community with AI analysis
      const documents = await prisma.$queryRaw<Array<{
        id: string;
        ai_analysis: any;
        created_at: Date;
        processing_status: string;
      }>>`
        SELECT id, ai_analysis, created_at, processing_status
        FROM documents 
        WHERE community_id = ${communityId}::uuid
        AND ai_analysis IS NOT NULL
        ORDER BY created_at DESC
      `;

      // Extract intelligence data from documents
      const intelligenceData = documents
        .map(doc => doc.ai_analysis?.intelligence)
        .filter(Boolean);

      // Calculate base health using AI service
      const baseHealth = await calculateCommunityHealth(
        communityId,
        communityInfo.name,
        intelligenceData
      );

      // Calculate additional metrics
      const metrics = await this.calculateHealthMetrics(communityId, documents);
      const insights = await this.extractHealthInsights(intelligenceData);
      const trends = await this.calculateHealthTrends(communityId, documents);

      return {
        ...baseHealth,
        metrics,
        insights,
        trends
      };

    } catch (error) {
      console.error(`Error calculating health for community ${communityId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate health metrics for all communities
   */
  async calculateAllCommunityHealth(): Promise<CommunityHealthWithMetrics[]> {
    try {
      // Get all communities
      const communities = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM communities ORDER BY name
      `;

      // Calculate health for each community in parallel
      const healthPromises = communities.map(async (community) => {
        try {
          return await this.calculateCommunityHealth(community.id);
        } catch (error) {
          console.error(`Failed to calculate health for ${community.name}:`, error);
          // Return default health data if calculation fails
          return this.getDefaultCommunityHealth(community.id, community.name);
        }
      });

      const allHealth = await Promise.all(healthPromises);
      return allHealth;

    } catch (error) {
      console.error('Error calculating health for all communities:', error);
      throw error;
    }
  }

  /**
   * Store community health data in database
   */
  async storeCommunityHealth(health: CommunityHealthWithMetrics): Promise<void> {
    try {
      // Store health data in community record (assuming health_metrics column exists)
      await prisma.$executeRaw`
        UPDATE communities 
        SET health_metrics = ${JSON.stringify(health)}::jsonb,
            updated_at = NOW()
        WHERE id = ${health.communityId}::uuid
      `;

      // Store individual health indicators for querying
      await this.storeHealthIndicators(health);

    } catch (error) {
      console.warn('Could not store health metrics in database:', error);
      // Don't throw - health calculation can continue without storage
    }
  }

  /**
   * Get community health trends over time
   */
  async getCommunityHealthHistory(communityId: string, days: number = 30): Promise<Array<{
    date: Date;
    healthScore: number;
    indicators: any;
  }>> {
    try {
      // This would require historical health data storage
      // For now, return current health as single point
      const currentHealth = await this.calculateCommunityHealth(communityId);
      
      return [{
        date: new Date(),
        healthScore: currentHealth.healthScore,
        indicators: currentHealth.indicators
      }];

    } catch (error) {
      console.error(`Error getting health history for community ${communityId}:`, error);
      return [];
    }
  }

  /**
   * Calculate additional health metrics
   */
  private async calculateHealthMetrics(
    communityId: string, 
    documents: Array<{ id: string; ai_analysis: any; created_at: Date; processing_status: string }>
  ) {
    const totalDocuments = documents.length;
    const recentDocuments = documents.filter(
      doc => new Date(doc.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    // Analysis completeness (percentage of documents with AI analysis)
    const allDocuments = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count FROM documents WHERE community_id = ${communityId}::uuid
    `;
    const totalAllDocuments = allDocuments[0]?.count || 0;
    const analysisCompleteness = totalAllDocuments > 0 ? (totalDocuments / totalAllDocuments) * 100 : 0;

    // Data freshness (average age of analyzed documents)
    const avgAge = documents.length > 0 
      ? documents.reduce((sum, doc) => sum + (Date.now() - new Date(doc.created_at).getTime()), 0) / documents.length
      : 0;
    const dataFreshness = Math.max(0, 100 - (avgAge / (30 * 24 * 60 * 60 * 1000)) * 100); // 30 days = 0% freshness

    // Community engagement (based on document upload frequency)
    const engagementScore = Math.min(100, (recentDocuments / 5) * 100); // 5 docs per month = 100%

    return {
      totalDocuments,
      recentDocuments,
      analysisCompleteness: Math.round(analysisCompleteness),
      dataFreshness: Math.round(dataFreshness),
      communityEngagement: Math.round(engagementScore)
    };
  }

  /**
   * Extract key insights from intelligence data
   */
  private async extractHealthInsights(intelligenceData: any[]) {
    // Aggregate needs
    const needsMap = new Map<string, { urgency: string; count: number }>();
    intelligenceData.forEach(data => {
      data.communityNeeds?.forEach((need: any) => {
        const key = need.need || need.category;
        if (needsMap.has(key)) {
          needsMap.get(key)!.count++;
        } else {
          needsMap.set(key, { urgency: need.urgency, count: 1 });
        }
      });
    });

    const topNeeds = Array.from(needsMap.entries())
      .map(([need, data]) => ({ need, urgency: data.urgency, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Aggregate assets
    const assetsMap = new Map<string, { type: string; strength: number; count: number }>();
    intelligenceData.forEach(data => {
      data.assets?.forEach((asset: any) => {
        const key = asset.asset;
        if (assetsMap.has(key)) {
          const existing = assetsMap.get(key)!;
          existing.strength = (existing.strength * existing.count + asset.strength) / (existing.count + 1);
          existing.count++;
        } else {
          assetsMap.set(key, { type: asset.type, strength: asset.strength, count: 1 });
        }
      });
    });

    const keyAssets = Array.from(assetsMap.entries())
      .map(([asset, data]) => ({ asset, type: data.type, strength: Math.round(data.strength) }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);

    // Aggregate service gaps
    const gapsMap = new Map<string, { impact: number; location: string; count: number }>();
    intelligenceData.forEach(data => {
      data.serviceGaps?.forEach((gap: any) => {
        const key = gap.service;
        if (gapsMap.has(key)) {
          const existing = gapsMap.get(key)!;
          existing.impact = Math.max(existing.impact, gap.impact);
          existing.count++;
        } else {
          gapsMap.set(key, { impact: gap.impact, location: gap.location, count: 1 });
        }
      });
    });

    const criticalGaps = Array.from(gapsMap.entries())
      .map(([service, data]) => ({ service, impact: data.impact, location: data.location }))
      .filter(gap => gap.impact >= 7) // High impact gaps only
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);

    // Aggregate opportunities
    const opportunitiesMap = new Map<string, { potential: number; timeline: string; count: number }>();
    intelligenceData.forEach(data => {
      data.opportunities?.forEach((opp: any) => {
        const key = opp.opportunity;
        if (opportunitiesMap.has(key)) {
          const existing = opportunitiesMap.get(key)!;
          existing.potential = Math.max(existing.potential, opp.potential);
          existing.count++;
        } else {
          opportunitiesMap.set(key, { potential: opp.potential, timeline: opp.timeline, count: 1 });
        }
      });
    });

    const opportunities = Array.from(opportunitiesMap.entries())
      .map(([opportunity, data]) => ({ opportunity, potential: data.potential, timeline: data.timeline }))
      .sort((a, b) => b.potential - a.potential)
      .slice(0, 5);

    return {
      topNeeds,
      keyAssets,
      criticalGaps,
      opportunities
    };
  }

  /**
   * Calculate health trends (simplified - would need historical data for real trends)
   */
  private async calculateHealthTrends(
    communityId: string,
    documents: Array<{ id: string; ai_analysis: any; created_at: Date }>
  ) {
    // For now, return stable trends - would calculate from historical data in production
    const recentDocs = documents.filter(
      doc => new Date(doc.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const direction = recentDocs > 2 ? 'improving' : recentDocs === 0 ? 'declining' : 'stable';
    const velocity = recentDocs * 0.1; // Simple velocity calculation
    const confidence = documents.length > 10 ? 0.8 : 0.5; // More data = higher confidence

    return {
      direction: direction as 'improving' | 'stable' | 'declining',
      velocity,
      confidence,
      recentChanges: [
        { indicator: 'Document Activity', change: recentDocs, period: '7 days' },
        { indicator: 'Analysis Coverage', change: documents.length, period: 'total' }
      ]
    };
  }

  /**
   * Store health indicators for querying
   */
  private async storeHealthIndicators(health: CommunityHealthWithMetrics): Promise<void> {
    try {
      // Create a health indicators record (assuming table exists or will be created)
      const healthRecord = {
        community_id: health.communityId,
        health_score: health.healthScore,
        youth_engagement: health.indicators.youthEngagement,
        service_access: health.indicators.serviceAccess,
        cultural_connection: health.indicators.culturalConnection,
        economic_opportunity: health.indicators.economicOpportunity,
        safety_wellbeing: health.indicators.safetyWellbeing,
        status: health.status,
        total_documents: health.metrics.totalDocuments,
        recent_documents: health.metrics.recentDocuments,
        analysis_completeness: health.metrics.analysisCompleteness,
        data_freshness: health.metrics.dataFreshness,
        community_engagement: health.metrics.communityEngagement,
        calculated_at: new Date(),
        trends: health.trends
      };

      // Store in health indicators table (create if doesn't exist)
      await prisma.$executeRaw`
        INSERT INTO community_health_indicators (
          community_id, health_score, youth_engagement, service_access, 
          cultural_connection, economic_opportunity, safety_wellbeing, status,
          total_documents, recent_documents, analysis_completeness, 
          data_freshness, community_engagement, trends, calculated_at
        ) VALUES (
          ${healthRecord.community_id}::uuid, ${healthRecord.health_score}, 
          ${healthRecord.youth_engagement}, ${healthRecord.service_access},
          ${healthRecord.cultural_connection}, ${healthRecord.economic_opportunity}, 
          ${healthRecord.safety_wellbeing}, ${healthRecord.status},
          ${healthRecord.total_documents}, ${healthRecord.recent_documents}, 
          ${healthRecord.analysis_completeness}, ${healthRecord.data_freshness}, 
          ${healthRecord.community_engagement}, ${JSON.stringify(healthRecord.trends)}::jsonb, 
          ${healthRecord.calculated_at}
        )
        ON CONFLICT (community_id) DO UPDATE SET
          health_score = EXCLUDED.health_score,
          youth_engagement = EXCLUDED.youth_engagement,
          service_access = EXCLUDED.service_access,
          cultural_connection = EXCLUDED.cultural_connection,
          economic_opportunity = EXCLUDED.economic_opportunity,
          safety_wellbeing = EXCLUDED.safety_wellbeing,
          status = EXCLUDED.status,
          total_documents = EXCLUDED.total_documents,
          recent_documents = EXCLUDED.recent_documents,
          analysis_completeness = EXCLUDED.analysis_completeness,
          data_freshness = EXCLUDED.data_freshness,
          community_engagement = EXCLUDED.community_engagement,
          trends = EXCLUDED.trends,
          calculated_at = EXCLUDED.calculated_at,
          updated_at = NOW()
      `;

    } catch (error) {
      console.warn('Could not store health indicators (table may not exist):', error);
      // Continue without failing
    }
  }

  /**
   * Get default community health when calculation fails
   */
  private getDefaultCommunityHealth(communityId: string, communityName: string): CommunityHealthWithMetrics {
    return {
      communityId,
      name: communityName,
      status: 'developing',
      healthScore: 50,
      indicators: {
        youthEngagement: 50,
        serviceAccess: 50,
        culturalConnection: 50,
        economicOpportunity: 50,
        safetyWellbeing: 50
      },
      trends: {
        direction: 'stable',
        velocity: 0,
        confidence: 0.3,
        recentChanges: []
      },
      lastUpdated: new Date(),
      metrics: {
        totalDocuments: 0,
        recentDocuments: 0,
        analysisCompleteness: 0,
        dataFreshness: 0,
        communityEngagement: 0
      },
      insights: {
        topNeeds: [],
        keyAssets: [],
        criticalGaps: [],
        opportunities: []
      }
    };
  }
}

// Export singleton instance
export const communityHealthService = new CommunityHealthService();