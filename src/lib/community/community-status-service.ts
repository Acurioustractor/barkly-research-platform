import { prisma } from '@/lib/db/database';

// Community status tracking types
export interface CommunityStatus {
  communityId: string;
  name: string;
  status: 'thriving' | 'developing' | 'struggling' | 'improving';
  previousStatus?: string;
  statusChanged: boolean;
  changeDate?: Date;
  healthScore: number;
  previousHealthScore?: number;
  scoreChange: number;
  trend: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number; // rate of change
    confidence: number; // 0-1
    period: string; // time period for trend
  };
  indicators: {
    youthEngagement: { current: number; previous?: number; change: number };
    serviceAccess: { current: number; previous?: number; change: number };
    culturalConnection: { current: number; previous?: number; change: number };
    economicOpportunity: { current: number; previous?: number; change: number };
    safetyWellbeing: { current: number; previous?: number; change: number };
  };
  lastUpdated: Date;
  dataQuality: {
    freshness: number; // 0-100
    completeness: number; // 0-100
    reliability: number; // 0-100
  };
}

export interface StatusUpdate {
  communityId: string;
  timestamp: Date;
  healthScore: number;
  status: string;
  indicators: Record<string, number>;
  triggerEvent?: string; // what caused the update
  metadata?: Record<string, any>;
}

export class CommunityStatusService {
  
  /**
   * Track status for a specific community with historical comparison
   */
  async trackCommunityStatus(communityId: string): Promise<CommunityStatus> {
    try {
      // Get current health data
      const currentHealth = await this.getCurrentHealthData(communityId);
      
      // Get historical data for comparison
      const historicalData = await this.getHistoricalData(communityId, 30); // 30 days
      
      // Calculate trends and changes
      const statusTracking = await this.calculateStatusChanges(
        currentHealth, 
        historicalData
      );
      
      // Store the status update
      await this.storeStatusUpdate(statusTracking);
      
      return statusTracking;

    } catch (error) {
      console.error(`Error tracking status for community ${communityId}:`, error);
      throw error;
    }
  }

  /**
   * Get real-time status updates for all communities
   */
  async getAllCommunityStatuses(): Promise<CommunityStatus[]> {
    try {
      // Get all communities
      const communities = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM communities ORDER BY name
      `;

      // Track status for each community
      const statusPromises = communities.map(async (community) => {
        try {
          return await this.trackCommunityStatus(community.id);
        } catch (error) {
          console.error(`Failed to track status for ${community.name}:`, error);
          return this.getDefaultStatus(community.id, community.name);
        }
      });

      return await Promise.all(statusPromises);

    } catch (error) {
      console.error('Error getting all community statuses:', error);
      throw error;
    }
  }  /**
 
  * Get communities with recent status changes
   */
  async getRecentStatusChanges(days: number = 7): Promise<CommunityStatus[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get communities with recent health updates
      const recentUpdates = await prisma.$queryRaw<Array<{
        community_id: string;
        calculated_at: Date;
        health_score: number;
        status: string;
      }>>`
        SELECT community_id, calculated_at, health_score, status
        FROM community_health_indicators
        WHERE calculated_at > ${cutoffDate}
        ORDER BY calculated_at DESC
      `;

      // Track status for communities with recent updates
      const uniqueCommunities = [...new Set(recentUpdates.map(u => u.community_id))];
      const statusPromises = uniqueCommunities.map(id => this.trackCommunityStatus(id));
      
      const statuses = await Promise.all(statusPromises);
      return statuses.filter(s => s.statusChanged || s.scoreChange !== 0);

    } catch (error) {
      console.error('Error getting recent status changes:', error);
      return [];
    }
  }

  /**
   * Get current health data from database
   */
  private async getCurrentHealthData(communityId: string) {
    const healthData = await prisma.$queryRaw<Array<{
      community_id: string;
      health_score: number;
      status: string;
      youth_engagement: number;
      service_access: number;
      cultural_connection: number;
      economic_opportunity: number;
      safety_wellbeing: number;
      calculated_at: Date;
      total_documents: number;
      recent_documents: number;
      analysis_completeness: number;
      data_freshness: number;
      community_engagement: number;
    }>>`
      SELECT 
        community_id, health_score, status,
        youth_engagement, service_access, cultural_connection,
        economic_opportunity, safety_wellbeing, calculated_at,
        total_documents, recent_documents, analysis_completeness,
        data_freshness, community_engagement
      FROM community_health_indicators
      WHERE community_id = ${communityId}::uuid
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    if (healthData.length === 0) {
      throw new Error(`No health data found for community ${communityId}`);
    }

    return healthData[0];
  }

  /**
   * Get historical health data for trend analysis
   */
  private async getHistoricalData(communityId: string, days: number) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const historicalData = await prisma.$queryRaw<Array<{
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
        health_score, status, youth_engagement, service_access,
        cultural_connection, economic_opportunity, safety_wellbeing,
        calculated_at
      FROM community_health_indicators
      WHERE community_id = ${communityId}::uuid
      AND calculated_at > ${cutoffDate}
      ORDER BY calculated_at ASC
    `;

    return historicalData;
  } 
 /**
   * Calculate status changes and trends
   */
  private async calculateStatusChanges(currentHealth: any, historicalData: any[]): Promise<CommunityStatus> {
    const communityName = await this.getCommunityName(currentHealth.community_id);
    
    // Get previous data point for comparison
    const previousData = historicalData.length > 1 ? historicalData[historicalData.length - 2] : null;
    
    // Calculate score change
    const scoreChange = previousData 
      ? currentHealth.health_score - previousData.health_score 
      : 0;
    
    // Check if status changed
    const statusChanged = previousData 
      ? currentHealth.status !== previousData.status 
      : false;
    
    // Calculate indicator changes
    const indicators = {
      youthEngagement: {
        current: currentHealth.youth_engagement,
        previous: previousData?.youth_engagement,
        change: previousData ? currentHealth.youth_engagement - previousData.youth_engagement : 0
      },
      serviceAccess: {
        current: currentHealth.service_access,
        previous: previousData?.service_access,
        change: previousData ? currentHealth.service_access - previousData.service_access : 0
      },
      culturalConnection: {
        current: currentHealth.cultural_connection,
        previous: previousData?.cultural_connection,
        change: previousData ? currentHealth.cultural_connection - previousData.cultural_connection : 0
      },
      economicOpportunity: {
        current: currentHealth.economic_opportunity,
        previous: previousData?.economic_opportunity,
        change: previousData ? currentHealth.economic_opportunity - previousData.economic_opportunity : 0
      },
      safetyWellbeing: {
        current: currentHealth.safety_wellbeing,
        previous: previousData?.safety_wellbeing,
        change: previousData ? currentHealth.safety_wellbeing - previousData.safety_wellbeing : 0
      }
    };
    
    // Calculate trend
    const trend = this.calculateTrend(historicalData);
    
    // Calculate data quality
    const dataQuality = {
      freshness: currentHealth.data_freshness || 50,
      completeness: currentHealth.analysis_completeness || 50,
      reliability: this.calculateReliability(historicalData)
    };
    
    return {
      communityId: currentHealth.community_id,
      name: communityName,
      status: currentHealth.status,
      previousStatus: previousData?.status,
      statusChanged,
      changeDate: statusChanged ? new Date(currentHealth.calculated_at) : undefined,
      healthScore: currentHealth.health_score,
      previousHealthScore: previousData?.health_score,
      scoreChange,
      trend,
      indicators,
      lastUpdated: new Date(currentHealth.calculated_at),
      dataQuality
    };
  }

  /**
   * Calculate trend direction and velocity
   */
  private calculateTrend(historicalData: any[]) {
    if (historicalData.length < 2) {
      return {
        direction: 'stable' as const,
        velocity: 0,
        confidence: 0.3,
        period: 'insufficient data'
      };
    }

    // Calculate linear trend over the data points
    const scores = historicalData.map(d => d.health_score);
    const n = scores.length;
    
    // Simple linear regression to find trend
    const xSum = (n * (n - 1)) / 2; // sum of indices 0,1,2...n-1
    const ySum = scores.reduce((a, b) => a + b, 0);
    const xySum = scores.reduce((sum, score, index) => sum + score * index, 0);
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6; // sum of squares 0²+1²+2²...
    
    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    
    // Determine direction and velocity
    let direction: 'improving' | 'stable' | 'declining';
    if (slope > 1) direction = 'improving';
    else if (slope < -1) direction = 'declining';
    else direction = 'stable';
    
    const velocity = Math.abs(slope);
    const confidence = Math.min(1, n / 10); // More data points = higher confidence
    
    return {
      direction,
      velocity: Math.round(velocity * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      period: `${historicalData.length} data points`
    };
  }  
/**
   * Calculate data reliability score
   */
  private calculateReliability(historicalData: any[]): number {
    if (historicalData.length === 0) return 0;
    
    // Reliability based on data consistency and frequency
    const dataPoints = historicalData.length;
    const timeSpan = historicalData.length > 1 
      ? new Date(historicalData[historicalData.length - 1].calculated_at).getTime() - 
        new Date(historicalData[0].calculated_at).getTime()
      : 0;
    
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const frequency = daysSpan > 0 ? dataPoints / daysSpan : 0;
    
    // Score based on frequency and consistency
    let reliabilityScore = Math.min(100, frequency * 20); // More frequent updates = higher reliability
    
    // Adjust for data consistency (less variance = more reliable)
    if (historicalData.length > 2) {
      const scores = historicalData.map(d => d.health_score);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const consistency = Math.max(0, 100 - variance); // Lower variance = higher consistency
      
      reliabilityScore = (reliabilityScore + consistency) / 2;
    }
    
    return Math.round(reliabilityScore);
  }

  /**
   * Get community name by ID
   */
  private async getCommunityName(communityId: string): Promise<string> {
    try {
      const community = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM communities WHERE id = ${communityId}::uuid
      `;
      return community[0]?.name || 'Unknown Community';
    } catch (error) {
      return 'Unknown Community';
    }
  }

  /**
   * Store status update for historical tracking
   */
  private async storeStatusUpdate(status: CommunityStatus): Promise<void> {
    try {
      const updateData: StatusUpdate = {
        communityId: status.communityId,
        timestamp: status.lastUpdated,
        healthScore: status.healthScore,
        status: status.status,
        indicators: {
          youthEngagement: status.indicators.youthEngagement.current,
          serviceAccess: status.indicators.serviceAccess.current,
          culturalConnection: status.indicators.culturalConnection.current,
          economicOpportunity: status.indicators.economicOpportunity.current,
          safetyWellbeing: status.indicators.safetyWellbeing.current
        },
        triggerEvent: status.statusChanged ? 'status_change' : 'routine_update',
        metadata: {
          scoreChange: status.scoreChange,
          trend: status.trend,
          dataQuality: status.dataQuality
        }
      };

      // Store in status updates table (create if doesn't exist)
      await prisma.$executeRaw`
        INSERT INTO community_status_updates (
          community_id, timestamp, health_score, status, indicators, 
          trigger_event, metadata, created_at
        ) VALUES (
          ${updateData.communityId}::uuid, ${updateData.timestamp}, 
          ${updateData.healthScore}, ${updateData.status}, 
          ${JSON.stringify(updateData.indicators)}::jsonb,
          ${updateData.triggerEvent}, ${JSON.stringify(updateData.metadata)}::jsonb,
          NOW()
        )
        ON CONFLICT (community_id, timestamp) DO UPDATE SET
          health_score = EXCLUDED.health_score,
          status = EXCLUDED.status,
          indicators = EXCLUDED.indicators,
          trigger_event = EXCLUDED.trigger_event,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `;

    } catch (error) {
      console.warn('Could not store status update (table may not exist):', error);
      // Continue without failing
    }
  }

  /**
   * Get default status when tracking fails
   */
  private getDefaultStatus(communityId: string, communityName: string): CommunityStatus {
    return {
      communityId,
      name: communityName,
      status: 'developing',
      statusChanged: false,
      healthScore: 50,
      scoreChange: 0,
      trend: {
        direction: 'stable',
        velocity: 0,
        confidence: 0.3,
        period: 'no data'
      },
      indicators: {
        youthEngagement: { current: 50, change: 0 },
        serviceAccess: { current: 50, change: 0 },
        culturalConnection: { current: 50, change: 0 },
        economicOpportunity: { current: 50, change: 0 },
        safetyWellbeing: { current: 50, change: 0 }
      },
      lastUpdated: new Date(),
      dataQuality: {
        freshness: 0,
        completeness: 0,
        reliability: 0
      }
    };
  }
}

// Export singleton instance
export const communityStatusService = new CommunityStatusService();