import { supabase } from './supabase';
import { analyzeDocument } from './ai-service';
import { crossCommunityTrendAnalysisService } from './cross-community-trend-analysis';

export interface EarlyWarningAlert {
  id: string;
  communityId: string;
  communityName: string;
  alertType: 'emerging_issue' | 'service_strain' | 'funding_opportunity' | 'resource_match' | 'cultural_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  indicators: AlertIndicator[];
  evidence: AlertEvidence[];
  recommendations: AlertRecommendation[];
  culturalConsiderations: string[];
  stakeholders: string[];
  timeframe: 'immediate' | 'short_term' | 'medium_term';
  confidence: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  communityResponse?: string;
  followUpActions: FollowUpAction[];
}

export interface AlertIndicator {
  id: string;
  name: string;
  currentValue: number;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  dataSource: string;
  lastUpdated: Date;
  historicalContext: string;
  culturalRelevance: 'high' | 'medium' | 'low';
}

export interface AlertEvidence {
  id: string;
  type: 'document' | 'story' | 'data_point' | 'community_feedback' | 'external_source';
  source: string;
  content: string;
  relevanceScore: number;
  timestamp: Date;
  culturalSensitivity: 'public' | 'restricted' | 'elder_review';
  verificationStatus: 'verified' | 'pending' | 'disputed';
}

export interface AlertRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  timeframe: string;
  stakeholders: string[];
  resources: string[];
  culturalProtocols: string[];
  expectedOutcome: string;
  riskIfIgnored: string;
  successMetrics: string[];
}

export interface FollowUpAction {
  id: string;
  action: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
  completedAt?: Date;
}

export interface ServiceStrainMetrics {
  communityId: string;
  serviceType: 'healthcare' | 'education' | 'social_services' | 'cultural_programs' | 'emergency_response';
  currentDemand: number;
  capacity: number;
  utilizationRate: number;
  waitTimes: number;
  qualityMetrics: { [key: string]: number };
  staffingLevels: number;
  resourceAvailability: number;
  communityFeedback: number;
  trendDirection: 'improving' | 'stable' | 'declining' | 'critical';
  lastAssessed: Date;
}

export interface OpportunityMatch {
  id: string;
  type: 'funding' | 'partnership' | 'resource_sharing' | 'knowledge_exchange' | 'capacity_building';
  title: string;
  description: string;
  source: string;
  eligibilityCriteria: string[];
  matchingCommunities: string[];
  matchScore: number;
  deadline?: Date;
  estimatedValue: number;
  requirements: string[];
  culturalAlignment: number;
  communityBenefit: string;
  applicationProcess: string;
  contactInformation: string;
  status: 'available' | 'applied' | 'awarded' | 'expired';
}

export interface EmergingIssuePattern {
  id: string;
  pattern: string;
  description: string;
  indicators: string[];
  affectedCommunities: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  firstDetected: Date;
  lastUpdated: Date;
  relatedIssues: string[];
  preventionStrategies: string[];
  interventionOptions: string[];
  culturalFactors: string[];
}

/**
 * Early Warning System Service
 * Monitors community data for emerging issues, opportunities, and service strain
 */
export class EarlyWarningSystemService {
  private alertThresholds: Map<string, number> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeAlerts: Map<string, EarlyWarningAlert> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the early warning system
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadAlertThresholds();
      await this.loadActiveAlerts();
      this.startMonitoring();
      console.log('Early warning system initialized');
    } catch (error) {
      console.error('Error initializing early warning system:', error);
    }
  }

  /**
   * Start continuous monitoring for all communities
   */
  public startMonitoring(): void {
    // Monitor emerging issues every 30 minutes
    const emergingIssuesInterval = setInterval(async () => {
      await this.monitorEmergingIssues();
    }, 30 * 60 * 1000);

    // Monitor service strain every 15 minutes
    const serviceStrainInterval = setInterval(async () => {
      await this.monitorServiceStrain();
    }, 15 * 60 * 1000);

    // Monitor opportunities daily
    const opportunitiesInterval = setInterval(async () => {
      await this.monitorOpportunities();
    }, 24 * 60 * 60 * 1000);

    this.monitoringIntervals.set('emerging_issues', emergingIssuesInterval);
    this.monitoringIntervals.set('service_strain', serviceStrainInterval);
    this.monitoringIntervals.set('opportunities', opportunitiesInterval);

    console.log('Early warning monitoring started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    this.monitoringIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();
    console.log('Early warning monitoring stopped');
  }

  /**
   * Monitor for emerging community issues
   */
  public async monitorEmergingIssues(): Promise<void> {
    try {
      console.log('Monitoring for emerging community issues...');

      const communities = await this.getAllCommunities();
      
      for (const community of communities) {
        await this.analyzeEmergingIssues(community.id);
      }
    } catch (error) {
      console.error('Error monitoring emerging issues:', error);
    }
  }

  /**
   * Monitor service strain across communities
   */
  public async monitorServiceStrain(): Promise<void> {
    try {
      console.log('Monitoring service strain...');

      const communities = await this.getAllCommunities();
      
      for (const community of communities) {
        await this.analyzeServiceStrain(community.id);
      }
    } catch (error) {
      console.error('Error monitoring service strain:', error);
    }
  }

  /**
   * Monitor for funding and resource opportunities
   */
  public async monitorOpportunities(): Promise<void> {
    try {
      console.log('Monitoring opportunities...');

      const communities = await this.getAllCommunities();
      const opportunities = await this.identifyOpportunities();
      
      for (const community of communities) {
        await this.matchOpportunities(community.id, opportunities);
      }
    } catch (error) {
      console.error('Error monitoring opportunities:', error);
    }
  }

  /**
   * Analyze emerging issues for a specific community
   */
  private async analyzeEmergingIssues(communityId: string): Promise<void> {
    try {
      // Get recent documents and stories
      const recentData = await this.getRecentCommunityData(communityId, 30); // Last 30 days
      
      if (recentData.length === 0) {
        return;
      }

      // Analyze for emerging patterns
      const emergingPatterns = await this.detectEmergingPatterns(recentData);
      
      // Check against historical baselines
      const historicalBaseline = await this.getHistoricalBaseline(communityId);
      
      // Generate alerts for significant deviations
      for (const pattern of emergingPatterns) {
        const alert = await this.evaluateEmergingIssue(
          communityId,
          pattern,
          historicalBaseline
        );
        
        if (alert) {
          await this.createAlert(alert);
        }
      }
    } catch (error) {
      console.error(`Error analyzing emerging issues for community ${communityId}:`, error);
    }
  }

  /**
   * Analyze service strain for a specific community
   */
  private async analyzeServiceStrain(communityId: string): Promise<void> {
    try {
      const serviceMetrics = await this.getServiceStrainMetrics(communityId);
      
      for (const metrics of serviceMetrics) {
        const strainLevel = this.calculateStrainLevel(metrics);
        
        if (strainLevel >= this.alertThresholds.get('service_strain') || 0.7) {
          const alert = await this.createServiceStrainAlert(communityId, metrics, strainLevel);
          await this.createAlert(alert);
        }
      }
    } catch (error) {
      console.error(`Error analyzing service strain for community ${communityId}:`, error);
    }
  }

  /**
   * Match opportunities to community needs
   */
  private async matchOpportunities(
    communityId: string,
    opportunities: OpportunityMatch[]
  ): Promise<void> {
    try {
      const communityNeeds = await this.getCommunityNeeds(communityId);
      const communityProfile = await this.getCommunityProfile(communityId);
      
      for (const opportunity of opportunities) {
        const matchScore = this.calculateOpportunityMatch(
          opportunity,
          communityNeeds,
          communityProfile
        );
        
        if (matchScore >= 0.7) { // High match threshold
          const alert = await this.createOpportunityAlert(
            communityId,
            opportunity,
            matchScore
          );
          await this.createAlert(alert);
        }
      }
    } catch (error) {
      console.error(`Error matching opportunities for community ${communityId}:`, error);
    }
  }

  /**
   * Detect emerging patterns in community data
   */
  private async detectEmergingPatterns(data: any[]): Promise<EmergingIssuePattern[]> {
    try {
      const patterns: EmergingIssuePattern[] = [];
      
      // Use AI to analyze patterns in the data
      const analysisPrompt = `
        Analyze the following community data for emerging issues or concerning patterns.
        Look for:
        1. Increasing mentions of problems or concerns
        2. New types of issues not seen before
        3. Escalating severity of existing issues
        4. Patterns that might indicate systemic problems
        5. Cultural or social tensions
        
        Data: ${JSON.stringify(data.slice(0, 10))} // Limit for prompt size
        
        Return patterns in JSON format with: pattern, description, indicators, severity, confidence
      `;
      
      const analysis = await analyzeDocument(analysisPrompt, 'pattern_detection');
      
      // Parse AI response and create pattern objects
      if (analysis && analysis.themes) {
        for (const theme of analysis.themes) {
          if (theme.urgency === 'high' || theme.urgency === 'critical') {
            patterns.push({
              id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              pattern: theme.theme,
              description: theme.description || '',
              indicators: theme.keywords || [],
              affectedCommunities: [data[0]?.community_id || ''],
              severity: theme.urgency as 'low' | 'medium' | 'high' | 'critical',
              confidence: theme.confidence || 0.5,
              firstDetected: new Date(),
              lastUpdated: new Date(),
              relatedIssues: [],
              preventionStrategies: [],
              interventionOptions: [],
              culturalFactors: []
            });
          }
        }
      }
      
      return patterns;
    } catch (error) {
      console.error('Error detecting emerging patterns:', error);
      return [];
    }
  }

  /**
   * Evaluate if an emerging issue warrants an alert
   */
  private async evaluateEmergingIssue(
    communityId: string,
    pattern: EmergingIssuePattern,
    baseline: any
  ): Promise<EarlyWarningAlert | null> {
    try {
      // Check if this is significantly different from baseline
      const isSignificant = pattern.confidence > 0.6 && 
                           (pattern.severity === 'high' || pattern.severity === 'critical');
      
      if (!isSignificant) {
        return null;
      }

      const community = await this.getCommunityInfo(communityId);
      
      const alert: EarlyWarningAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        communityId,
        communityName: community?.name || 'Unknown Community',
        alertType: 'emerging_issue',
        severity: pattern.severity,
        title: `Emerging Issue: ${pattern.pattern}`,
        description: pattern.description,
        indicators: [{
          id: `indicator-${Date.now()}`,
          name: pattern.pattern,
          currentValue: pattern.confidence,
          threshold: 0.6,
          trend: 'increasing',
          dataSource: 'Community Data Analysis',
          lastUpdated: new Date(),
          historicalContext: 'New pattern detected',
          culturalRelevance: 'high'
        }],
        evidence: await this.gatherEvidence(communityId, pattern),
        recommendations: await this.generateRecommendations(pattern, community),
        culturalConsiderations: pattern.culturalFactors,
        stakeholders: await this.identifyStakeholders(pattern, community),
        timeframe: pattern.severity === 'critical' ? 'immediate' : 'short_term',
        confidence: pattern.confidence,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        followUpActions: []
      };

      return alert;
    } catch (error) {
      console.error('Error evaluating emerging issue:', error);
      return null;
    }
  }

  /**
   * Create service strain alert
   */
  private async createServiceStrainAlert(
    communityId: string,
    metrics: ServiceStrainMetrics,
    strainLevel: number
  ): Promise<EarlyWarningAlert> {
    const community = await this.getCommunityInfo(communityId);
    
    const severity = strainLevel >= 0.9 ? 'critical' : 
                    strainLevel >= 0.8 ? 'high' : 
                    strainLevel >= 0.7 ? 'medium' : 'low';

    return {
      id: `alert-strain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      communityId,
      communityName: community?.name || 'Unknown Community',
      alertType: 'service_strain',
      severity,
      title: `Service Strain Alert: ${metrics.serviceType.replace('_', ' ')}`,
      description: `${metrics.serviceType.replace('_', ' ')} services are experiencing ${severity} strain with ${(strainLevel * 100).toFixed(1)}% capacity utilization.`,
      indicators: [{
        id: `indicator-strain-${Date.now()}`,
        name: 'Service Utilization Rate',
        currentValue: metrics.utilizationRate,
        threshold: 0.8,
        trend: metrics.trendDirection === 'declining' ? 'increasing' : 'stable',
        dataSource: 'Service Metrics',
        lastUpdated: metrics.lastAssessed,
        historicalContext: `Capacity: ${metrics.capacity}, Demand: ${metrics.currentDemand}`,
        culturalRelevance: 'high'
      }],
      evidence: [{
        id: `evidence-strain-${Date.now()}`,
        type: 'data_point',
        source: 'Service Monitoring System',
        content: `Utilization: ${metrics.utilizationRate}%, Wait Times: ${metrics.waitTimes} days, Quality Score: ${Object.values(metrics.qualityMetrics).reduce((a, b) => a + b, 0) / Object.keys(metrics.qualityMetrics).length}`,
        relevanceScore: 0.9,
        timestamp: new Date(),
        culturalSensitivity: 'public',
        verificationStatus: 'verified'
      }],
      recommendations: await this.generateServiceStrainRecommendations(metrics, severity),
      culturalConsiderations: ['Consider cultural preferences for service delivery', 'Ensure culturally appropriate staffing'],
      stakeholders: ['Service Providers', 'Community Leaders', 'Government Officials'],
      timeframe: severity === 'critical' ? 'immediate' : 'short_term',
      confidence: 0.85,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      followUpActions: []
    };
  }

  /**
   * Create opportunity alert
   */
  private async createOpportunityAlert(
    communityId: string,
    opportunity: OpportunityMatch,
    matchScore: number
  ): Promise<EarlyWarningAlert> {
    const community = await this.getCommunityInfo(communityId);
    
    return {
      id: `alert-opportunity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      communityId,
      communityName: community?.name || 'Unknown Community',
      alertType: opportunity.type === 'funding' ? 'funding_opportunity' : 'resource_match',
      severity: matchScore >= 0.9 ? 'high' : 'medium',
      title: `Opportunity Match: ${opportunity.title}`,
      description: opportunity.description,
      indicators: [{
        id: `indicator-opportunity-${Date.now()}`,
        name: 'Match Score',
        currentValue: matchScore,
        threshold: 0.7,
        trend: 'stable',
        dataSource: 'Opportunity Matching System',
        lastUpdated: new Date(),
        historicalContext: `Estimated Value: $${opportunity.estimatedValue}`,
        culturalRelevance: opportunity.culturalAlignment >= 0.7 ? 'high' : 'medium'
      }],
      evidence: [{
        id: `evidence-opportunity-${Date.now()}`,
        type: 'external_source',
        source: opportunity.source,
        content: `${opportunity.description}\nRequirements: ${opportunity.requirements.join(', ')}`,
        relevanceScore: matchScore,
        timestamp: new Date(),
        culturalSensitivity: 'public',
        verificationStatus: 'verified'
      }],
      recommendations: [{
        id: `rec-opportunity-${Date.now()}`,
        priority: matchScore >= 0.9 ? 'high' : 'medium',
        action: 'Apply for Opportunity',
        description: `This opportunity has a ${(matchScore * 100).toFixed(1)}% match with community needs and profile.`,
        timeframe: opportunity.deadline ? `Before ${opportunity.deadline.toLocaleDateString()}` : 'As soon as possible',
        stakeholders: ['Community Leaders', 'Grant Writers', 'Program Managers'],
        resources: ['Application Materials', 'Community Data', 'Letters of Support'],
        culturalProtocols: ['Elder Consultation', 'Community Approval'],
        expectedOutcome: opportunity.communityBenefit,
        riskIfIgnored: 'Missed funding opportunity',
        successMetrics: ['Application Submitted', 'Funding Received', 'Program Implementation']
      }],
      culturalConsiderations: ['Ensure opportunity aligns with community values', 'Consider traditional governance processes'],
      stakeholders: ['Community Leaders', 'Grant Writers', 'Program Staff'],
      timeframe: opportunity.deadline ? 'immediate' : 'short_term',
      confidence: matchScore,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      followUpActions: []
    };
  }

  /**
   * Create and save an alert
   */
  private async createAlert(alert: EarlyWarningAlert): Promise<void> {
    try {
      // Check if similar alert already exists
      const existingAlert = await this.findSimilarAlert(alert);
      if (existingAlert) {
        await this.updateExistingAlert(existingAlert.id, alert);
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('early_warning_alerts')
        .insert([{
          id: alert.id,
          community_id: alert.communityId,
          community_name: alert.communityName,
          alert_type: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          indicators: alert.indicators,
          evidence: alert.evidence,
          recommendations: alert.recommendations,
          cultural_considerations: alert.culturalConsiderations,
          stakeholders: alert.stakeholders,
          timeframe: alert.timeframe,
          confidence: alert.confidence,
          status: alert.status,
          created_at: alert.createdAt.toISOString(),
          updated_at: alert.updatedAt.toISOString(),
          follow_up_actions: alert.followUpActions
        }]);

      if (error) {
        throw error;
      }

      // Add to active alerts cache
      this.activeAlerts.set(alert.id, alert);

      // Notify stakeholders
      await this.notifyStakeholders(alert);

      console.log(`Created alert: ${alert.title} for community ${alert.communityName}`);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  /**
   * Get all active alerts for a community
   */
  public async getActiveAlerts(communityId?: string): Promise<EarlyWarningAlert[]> {
    try {
      let query = supabase
        .from('early_warning_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToAlert) || [];
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('early_warning_alerts')
        .update({
          status: 'acknowledged',
          assigned_to: acknowledgedBy,
          community_response: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      // Update cache
      const alert = this.activeAlerts.get(alertId);
      if (alert) {
        alert.status = 'acknowledged';
        alert.assignedTo = acknowledgedBy;
        alert.communityResponse = notes;
        alert.updatedAt = new Date();
      }

      console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('early_warning_alerts')
        .update({
          status: 'resolved',
          community_response: resolution,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }

      // Remove from active alerts cache
      this.activeAlerts.delete(alertId);

      console.log(`Alert ${alertId} resolved by ${resolvedBy}`);
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  /**
   * Get alert statistics
   */
  public async getAlertStatistics(
    communityId?: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<any> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('early_warning_alerts')
        .select('alert_type, severity, status, created_at')
        .gte('created_at', startDate.toISOString());

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        byType: {} as { [key: string]: number },
        bySeverity: {} as { [key: string]: number },
        byStatus: {} as { [key: string]: number },
        responseTime: 0,
        resolutionRate: 0
      };

      data?.forEach(alert => {
        stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1;
        stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
        stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
      });

      const resolvedAlerts = data?.filter(a => a.status === 'resolved') || [];
      stats.resolutionRate = stats.total > 0 ? (resolvedAlerts.length / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      return null;
    }
  }

  // Helper methods
  private async getAllCommunities(): Promise<any[]> {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name');
    
    if (error) {
      console.error('Error getting communities:', error);
      return [];
    }
    
    return data || [];
  }

  private async getCommunityInfo(communityId: string): Promise<any> {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();
    
    if (error) {
      console.error('Error getting community info:', error);
      return null;
    }
    
    return data;
  }

  private async getRecentCommunityData(communityId: string, days: number): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('documents')
      .select('*, analysis')
      .eq('community_id', communityId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting recent community data:', error);
      return [];
    }
    
    return data || [];
  }

  private async getHistoricalBaseline(communityId: string): Promise<any> {
    // Get historical data for comparison
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('documents')
      .select('analysis')
      .eq('community_id', communityId)
      .lt('created_at', sixMonthsAgo.toISOString());
    
    if (error) {
      console.error('Error getting historical baseline:', error);
      return {};
    }
    
    return data || [];
  }

  private async getServiceStrainMetrics(communityId: string): Promise<ServiceStrainMetrics[]> {
    // This would typically come from service monitoring systems
    // For now, return mock data structure
    return [
      {
        communityId,
        serviceType: 'healthcare',
        currentDemand: 100,
        capacity: 80,
        utilizationRate: 1.25,
        waitTimes: 14,
        qualityMetrics: { satisfaction: 0.7, effectiveness: 0.8 },
        staffingLevels: 0.8,
        resourceAvailability: 0.6,
        communityFeedback: 0.6,
        trendDirection: 'declining',
        lastAssessed: new Date()
      }
    ];
  }

  private calculateStrainLevel(metrics: ServiceStrainMetrics): number {
    // Calculate overall strain level based on multiple factors
    const utilizationStrain = Math.min(metrics.utilizationRate, 2) / 2;
    const waitTimeStrain = Math.min(metrics.waitTimes / 30, 1); // 30 days max
    const qualityStrain = 1 - (Object.values(metrics.qualityMetrics).reduce((a, b) => a + b, 0) / Object.keys(metrics.qualityMetrics).length);
    const staffingStrain = 1 - metrics.staffingLevels;
    const resourceStrain = 1 - metrics.resourceAvailability;
    const feedbackStrain = 1 - metrics.communityFeedback;
    
    return (utilizationStrain + waitTimeStrain + qualityStrain + staffingStrain + resourceStrain + feedbackStrain) / 6;
  }

  private async getCommunityNeeds(communityId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('community_needs')
      .select('*')
      .eq('community_id', communityId);
    
    if (error) {
      console.error('Error getting community needs:', error);
      return [];
    }
    
    return data || [];
  }

  private async getCommunityProfile(communityId: string): Promise<any> {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();
    
    if (error) {
      console.error('Error getting community profile:', error);
      return {};
    }
    
    return data || {};
  }

  private async identifyOpportunities(): Promise<OpportunityMatch[]> {
    // This would typically integrate with external funding databases
    // For now, return mock opportunities
    return [
      {
        id: 'opp-1',
        type: 'funding',
        title: 'Community Health Initiative Grant',
        description: 'Funding for community-led health programs',
        source: 'Health Foundation',
        eligibilityCriteria: ['Indigenous communities', 'Population < 5000'],
        matchingCommunities: [],
        matchScore: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estimatedValue: 50000,
        requirements: ['Community health assessment', 'Elder support'],
        culturalAlignment: 0.9,
        communityBenefit: 'Improved health outcomes',
        applicationProcess: 'Online application with community consultation',
        contactInformation: 'grants@healthfoundation.org',
        status: 'available'
      }
    ];
  }

  private calculateOpportunityMatch(
    opportunity: OpportunityMatch,
    needs: any[],
    profile: any
  ): number {
    // Simple matching algorithm - in production would be more sophisticated
    let score = 0;
    
    // Check eligibility criteria
    if (opportunity.eligibilityCriteria.some(criteria => 
      criteria.toLowerCase().includes('indigenous') && profile.is_indigenous)) {
      score += 0.3;
    }
    
    // Check needs alignment
    const relevantNeeds = needs.filter(need => 
      opportunity.description.toLowerCase().includes(need.category?.toLowerCase())
    );
    score += Math.min(relevantNeeds.length * 0.2, 0.4);
    
    // Cultural alignment
    score += opportunity.culturalAlignment * 0.3;
    
    return Math.min(score, 1);
  }

  private async gatherEvidence(
    communityId: string,
    pattern: EmergingIssuePattern
  ): Promise<AlertEvidence[]> {
    const evidence: AlertEvidence[] = [];
    
    // Get related documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    documents?.forEach(doc => {
      if (pattern.indicators.some(indicator => 
        doc.content?.toLowerCase().includes(indicator.toLowerCase())
      )) {
        evidence.push({
          id: `evidence-${doc.id}`,
          type: 'document',
          source: doc.title || 'Community Document',
          content: doc.content?.substring(0, 200) + '...' || '',
          relevanceScore: 0.8,
          timestamp: new Date(doc.created_at),
          culturalSensitivity: 'public',
          verificationStatus: 'verified'
        });
      }
    });
    
    return evidence;
  }

  private async generateRecommendations(
    pattern: EmergingIssuePattern,
    community: any
  ): Promise<AlertRecommendation[]> {
    return [
      {
        id: `rec-${Date.now()}`,
        priority: pattern.severity === 'critical' ? 'critical' : 'high',
        action: 'Investigate and Address Issue',
        description: `Investigate the emerging pattern: ${pattern.pattern}`,
        timeframe: pattern.severity === 'critical' ? 'Within 24 hours' : 'Within 1 week',
        stakeholders: ['Community Leaders', 'Service Providers', 'Elders'],
        resources: ['Community consultation', 'Expert assessment'],
        culturalProtocols: ['Elder consultation', 'Community meeting'],
        expectedOutcome: 'Issue identified and mitigation plan developed',
        riskIfIgnored: 'Issue may escalate and affect more community members',
        successMetrics: ['Issue assessed', 'Action plan created', 'Community informed']
      }
    ];
  }

  private async generateServiceStrainRecommendations(
    metrics: ServiceStrainMetrics,
    severity: string
  ): Promise<AlertRecommendation[]> {
    const recommendations: AlertRecommendation[] = [];
    
    if (metrics.utilizationRate > 1) {
      recommendations.push({
        id: `rec-capacity-${Date.now()}`,
        priority: severity === 'critical' ? 'critical' : 'high',
        action: 'Increase Service Capacity',
        description: 'Service demand exceeds capacity - immediate expansion needed',
        timeframe: severity === 'critical' ? 'Immediate' : 'Within 2 weeks',
        stakeholders: ['Service Managers', 'Government Officials', 'Funding Bodies'],
        resources: ['Additional staff', 'Equipment', 'Facilities'],
        culturalProtocols: ['Community consultation on service expansion'],
        expectedOutcome: 'Reduced wait times and improved service access',
        riskIfIgnored: 'Service quality degradation and community dissatisfaction',
        successMetrics: ['Capacity increased', 'Wait times reduced', 'Utilization normalized']
      });
    }
    
    if (metrics.staffingLevels < 0.8) {
      recommendations.push({
        id: `rec-staffing-${Date.now()}`,
        priority: 'high',
        action: 'Address Staffing Shortage',
        description: 'Staffing levels below optimal - recruitment and retention needed',
        timeframe: 'Within 1 month',
        stakeholders: ['HR Department', 'Service Managers', 'Training Providers'],
        resources: ['Recruitment budget', 'Training programs', 'Retention incentives'],
        culturalProtocols: ['Prioritize local hiring', 'Cultural competency training'],
        expectedOutcome: 'Adequate staffing levels restored',
        riskIfIgnored: 'Continued service strain and staff burnout',
        successMetrics: ['Staff hired', 'Training completed', 'Retention improved']
      });
    }
    
    return recommendations;
  }

  private async identifyStakeholders(pattern: EmergingIssuePattern, community: any): Promise<string[]> {
    const stakeholders = ['Community Leaders', 'Elders'];
    
    // Add specific stakeholders based on pattern type
    if (pattern.pattern.toLowerCase().includes('health')) {
      stakeholders.push('Health Services', 'Nurses', 'Traditional Healers');
    }
    
    if (pattern.pattern.toLowerCase().includes('youth')) {
      stakeholders.push('Youth Workers', 'Schools', 'Recreation Programs');
    }
    
    if (pattern.pattern.toLowerCase().includes('housing')) {
      stakeholders.push('Housing Authority', 'Construction Services', 'Government Officials');
    }
    
    return stakeholders;
  }

  private async findSimilarAlert(alert: EarlyWarningAlert): Promise<EarlyWarningAlert | null> {
    const { data, error } = await supabase
      .from('early_warning_alerts')
      .select('*')
      .eq('community_id', alert.communityId)
      .eq('alert_type', alert.alertType)
      .eq('status', 'active')
      .ilike('title', `%${alert.title.split(':')[0]}%`);
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return this.mapDatabaseToAlert(data[0]);
  }

  private async updateExistingAlert(alertId: string, newAlert: EarlyWarningAlert): Promise<void> {
    const { error } = await supabase
      .from('early_warning_alerts')
      .update({
        severity: newAlert.severity,
        description: newAlert.description,
        indicators: newAlert.indicators,
        evidence: newAlert.evidence,
        confidence: newAlert.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);
    
    if (error) {
      console.error('Error updating existing alert:', error);
    }
  }

  private async notifyStakeholders(alert: EarlyWarningAlert): Promise<void> {
    // In production, this would send notifications via email, SMS, etc.
    console.log(`Notifying stakeholders for alert: ${alert.title}`);
    console.log(`Stakeholders: ${alert.stakeholders.join(', ')}`);
  }

  private mapDatabaseToAlert(data: any): EarlyWarningAlert {
    return {
      id: data.id,
      communityId: data.community_id,
      communityName: data.community_name,
      alertType: data.alert_type,
      severity: data.severity,
      title: data.title,
      description: data.description,
      indicators: data.indicators || [],
      evidence: data.evidence || [],
      recommendations: data.recommendations || [],
      culturalConsiderations: data.cultural_considerations || [],
      stakeholders: data.stakeholders || [],
      timeframe: data.timeframe,
      confidence: data.confidence,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      assignedTo: data.assigned_to,
      communityResponse: data.community_response,
      followUpActions: data.follow_up_actions || []
    };
  }

  private async loadAlertThresholds(): Promise<void> {
    // Load configurable thresholds from database or config
    this.alertThresholds.set('service_strain', 0.7);
    this.alertThresholds.set('emerging_issue_confidence', 0.6);
    this.alertThresholds.set('opportunity_match', 0.7);
  }

  private async loadActiveAlerts(): Promise<void> {
    const alerts = await this.getActiveAlerts();
    alerts.forEach(alert => {
      this.activeAlerts.set(alert.id, alert);
    });
  }
}

// Export singleton instance
export const earlyWarningSystemService = new EarlyWarningSystemService();