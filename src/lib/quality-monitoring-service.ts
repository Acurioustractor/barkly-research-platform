import { supabase } from './supabase';
import { analyzeDocumentChunk, analyzeCommunityIntelligence } from './ai-service';

export interface QualityMetrics {
  id: string;
  metric_type: 'accuracy' | 'bias' | 'cultural_sensitivity' | 'completeness' | 'relevance';
  metric_name: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  community_id?: string;
  insight_type?: string;
  time_period: string;
  calculated_at: string;
  details: any;
}

export interface BiasDetection {
  id: string;
  insight_id: string;
  bias_type: 'demographic' | 'cultural' | 'geographic' | 'temporal' | 'confirmation';
  bias_score: number; // 0-1 scale, higher = more biased
  confidence: number; // 0-1 scale
  description: string;
  affected_groups: string[];
  mitigation_suggestions: string[];
  detected_at: string;
  status: 'detected' | 'reviewed' | 'mitigated' | 'false_positive';
}

export interface AccuracyTracking {
  id: string;
  insight_id: string;
  predicted_accuracy: number; // AI's confidence
  validated_accuracy: number; // Community validation score
  accuracy_delta: number; // Difference between predicted and validated
  validation_count: number;
  consensus_level: number;
  cultural_appropriateness: number;
  source_reliability: number;
  tracked_at: string;
}

export interface QualityAlert {
  id: string;
  alert_type: 'accuracy_drop' | 'bias_detected' | 'cultural_concern' | 'validation_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_insights: string[];
  affected_communities: string[];
  recommended_actions: string[];
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface CommunityFeedbackMetrics {
  community_id: string;
  total_insights: number;
  validated_insights: number;
  average_accuracy: number;
  average_cultural_appropriateness: number;
  community_satisfaction: number;
  feedback_response_rate: number;
  common_concerns: string[];
  improvement_areas: string[];
  time_period: string;
}

class QualityMonitoringService {
  async calculateQualityMetrics(timeRange: string = '30d', communityId?: string): Promise<QualityMetrics[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Parse time range
      const days = parseInt(timeRange.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      // Build base query
      let query = supabase
        .from('intelligence_insights')
        .select(`
          *,
          validation_metrics (*)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data: insights, error } = await query;
      if (error) throw error;

      const metrics: QualityMetrics[] = [];

      // Calculate accuracy metrics
      const accuracyMetric = await this.calculateAccuracyMetric(insights || [], timeRange, communityId);
      metrics.push(accuracyMetric);

      // Calculate bias metrics
      const biasMetric = await this.calculateBiasMetric(insights || [], timeRange, communityId);
      metrics.push(biasMetric);

      // Calculate cultural sensitivity metrics
      const culturalMetric = await this.calculateCulturalSensitivityMetric(insights || [], timeRange, communityId);
      metrics.push(culturalMetric);

      // Calculate completeness metrics
      const completenessMetric = await this.calculateCompletenessMetric(insights || [], timeRange, communityId);
      metrics.push(completenessMetric);

      // Calculate relevance metrics
      const relevanceMetric = await this.calculateRelevanceMetric(insights || [], timeRange, communityId);
      metrics.push(relevanceMetric);

      // Store metrics in database
      await this.storeQualityMetrics(metrics);

      return metrics;
    } catch (error) {
      console.error('Error calculating quality metrics:', error);
      throw error;
    }
  }

  private async calculateAccuracyMetric(insights: any[], timeRange: string, communityId?: string): Promise<QualityMetrics> {
    const validatedInsights = insights.filter(i => i.validation_status === 'validated' && i.validation_score);
    const totalAccuracy = validatedInsights.reduce((sum, i) => sum + i.validation_score, 0);
    const averageAccuracy = validatedInsights.length > 0 ? totalAccuracy / validatedInsights.length : 0;

    // Accuracy threshold: 3.5/5 is good, 3.0/5 is warning, below 3.0 is critical
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (averageAccuracy < 3.0) status = 'critical';
    else if (averageAccuracy < 3.5) status = 'warning';

    return {
      id: `accuracy-${Date.now()}`,
      metric_type: 'accuracy',
      metric_name: 'Average Validation Accuracy',
      value: averageAccuracy,
      threshold: 3.5,
      status,
      community_id: communityId,
      time_period: timeRange,
      calculated_at: new Date().toISOString(),
      details: {
        total_insights: insights.length,
        validated_insights: validatedInsights.length,
        validation_rate: insights.length > 0 ? validatedInsights.length / insights.length : 0
      }
    };
  }

  private async calculateBiasMetric(insights: any[], timeRange: string, communityId?: string): Promise<QualityMetrics> {
    // Detect potential bias in insights
    let totalBiasScore = 0;
    let biasDetections = 0;

    for (const insight of insights) {
      const biasScore = await this.detectBias(insight);
      if (biasScore > 0.3) { // Threshold for bias detection
        totalBiasScore += biasScore;
        biasDetections++;
      }
    }

    const averageBiasScore = biasDetections > 0 ? totalBiasScore / biasDetections : 0;
    const biasRate = insights.length > 0 ? biasDetections / insights.length : 0;

    // Bias threshold: <0.2 is good, 0.2-0.4 is warning, >0.4 is critical
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (biasRate > 0.4) status = 'critical';
    else if (biasRate > 0.2) status = 'warning';

    return {
      id: `bias-${Date.now()}`,
      metric_type: 'bias',
      metric_name: 'Bias Detection Rate',
      value: biasRate,
      threshold: 0.2,
      status,
      community_id: communityId,
      time_period: timeRange,
      calculated_at: new Date().toISOString(),
      details: {
        total_insights: insights.length,
        bias_detections: biasDetections,
        average_bias_score: averageBiasScore,
        bias_types_detected: await this.getBiasTypesDetected(insights)
      }
    };
  }

  private async calculateCulturalSensitivityMetric(insights: any[], timeRange: string, communityId?: string): Promise<QualityMetrics> {
    const culturallyReviewed = insights.filter(i => i.cultural_appropriateness !== 'pending');
    const culturallyApproved = insights.filter(i => i.cultural_appropriateness === 'approved');
    
    const culturalApprovalRate = culturallyReviewed.length > 0 ? culturallyApproved.length / culturallyReviewed.length : 1;

    // Cultural sensitivity threshold: >0.9 is good, 0.8-0.9 is warning, <0.8 is critical
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (culturalApprovalRate < 0.8) status = 'critical';
    else if (culturalApprovalRate < 0.9) status = 'warning';

    return {
      id: `cultural-${Date.now()}`,
      metric_type: 'cultural_sensitivity',
      metric_name: 'Cultural Appropriateness Rate',
      value: culturalApprovalRate,
      threshold: 0.9,
      status,
      community_id: communityId,
      time_period: timeRange,
      calculated_at: new Date().toISOString(),
      details: {
        total_insights: insights.length,
        culturally_reviewed: culturallyReviewed.length,
        culturally_approved: culturallyApproved.length,
        cultural_concerns: insights.filter(i => i.cultural_appropriateness === 'concerns').length,
        cultural_rejections: insights.filter(i => i.cultural_appropriateness === 'rejected').length
      }
    };
  }

  private async calculateCompletenessMetric(insights: any[], timeRange: string, communityId?: string): Promise<QualityMetrics> {
    let totalCompletenessScore = 0;
    let scoredInsights = 0;

    // Analyze completeness based on validation responses
    for (const insight of insights) {
      if (insight.validation_metrics && insight.validation_metrics.length > 0) {
        const metrics = insight.validation_metrics[0].metrics;
        if (metrics.average_completeness) {
          totalCompletenessScore += metrics.average_completeness;
          scoredInsights++;
        }
      }
    }

    const averageCompleteness = scoredInsights > 0 ? totalCompletenessScore / scoredInsights : 0;

    // Completeness threshold: >3.5 is good, 3.0-3.5 is warning, <3.0 is critical
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (averageCompleteness < 3.0) status = 'critical';
    else if (averageCompleteness < 3.5) status = 'warning';

    return {
      id: `completeness-${Date.now()}`,
      metric_type: 'completeness',
      metric_name: 'Average Completeness Score',
      value: averageCompleteness,
      threshold: 3.5,
      status,
      community_id: communityId,
      time_period: timeRange,
      calculated_at: new Date().toISOString(),
      details: {
        total_insights: insights.length,
        scored_insights: scoredInsights,
        completeness_distribution: await this.getCompletenessDistribution(insights)
      }
    };
  }

  private async calculateRelevanceMetric(insights: any[], timeRange: string, communityId?: string): Promise<QualityMetrics> {
    let totalRelevanceScore = 0;
    let scoredInsights = 0;

    // Analyze relevance based on validation responses
    for (const insight of insights) {
      if (insight.validation_metrics && insight.validation_metrics.length > 0) {
        const metrics = insight.validation_metrics[0].metrics;
        if (metrics.average_relevance) {
          totalRelevanceScore += metrics.average_relevance;
          scoredInsights++;
        }
      }
    }

    const averageRelevance = scoredInsights > 0 ? totalRelevanceScore / scoredInsights : 0;

    // Relevance threshold: >3.5 is good, 3.0-3.5 is warning, <3.0 is critical
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (averageRelevance < 3.0) status = 'critical';
    else if (averageRelevance < 3.5) status = 'warning';

    return {
      id: `relevance-${Date.now()}`,
      metric_type: 'relevance',
      metric_name: 'Average Relevance Score',
      value: averageRelevance,
      threshold: 3.5,
      status,
      community_id: communityId,
      time_period: timeRange,
      calculated_at: new Date().toISOString(),
      details: {
        total_insights: insights.length,
        scored_insights: scoredInsights,
        relevance_by_type: await this.getRelevanceByType(insights)
      }
    };
  }

  async detectBias(insight: any): Promise<number> {
    try {
      // Use AI to detect potential bias in the insight
      const biasAnalysis = await analyzeDocumentChunk(
        JSON.stringify(insight.content),
        'bias_detection'
      );

      // Calculate bias score based on various factors
      let biasScore = 0;

      // Check for demographic bias
      if (this.containsDemographicBias(insight.content)) {
        biasScore += 0.3;
      }

      // Check for cultural bias
      if (this.containsCulturalBias(insight.content)) {
        biasScore += 0.4;
      }

      // Check for geographic bias
      if (this.containsGeographicBias(insight.content)) {
        biasScore += 0.2;
      }

      // Check for confirmation bias
      if (this.containsConfirmationBias(insight.content)) {
        biasScore += 0.3;
      }

      // Store bias detection if significant
      if (biasScore > 0.3) {
        await this.storeBiasDetection(insight.id, biasScore, biasAnalysis);
      }

      return Math.min(biasScore, 1.0); // Cap at 1.0
    } catch (error) {
      console.error('Error detecting bias:', error);
      return 0;
    }
  }

  private containsDemographicBias(content: any): boolean {
    // Check for demographic bias indicators
    const biasKeywords = ['young people', 'elderly', 'men', 'women', 'certain groups'];
    const contentText = JSON.stringify(content).toLowerCase();
    return biasKeywords.some(keyword => contentText.includes(keyword));
  }

  private containsCulturalBias(content: any): boolean {
    // Check for cultural bias indicators
    const biasKeywords = ['traditional', 'modern', 'backward', 'primitive', 'civilized'];
    const contentText = JSON.stringify(content).toLowerCase();
    return biasKeywords.some(keyword => contentText.includes(keyword));
  }

  private containsGeographicBias(content: any): boolean {
    // Check for geographic bias indicators
    const biasKeywords = ['urban', 'rural', 'remote', 'isolated', 'developed'];
    const contentText = JSON.stringify(content).toLowerCase();
    return biasKeywords.some(keyword => contentText.includes(keyword));
  }

  private containsConfirmationBias(content: any): boolean {
    // Check for confirmation bias indicators
    const biasKeywords = ['obviously', 'clearly', 'everyone knows', 'it is evident'];
    const contentText = JSON.stringify(content).toLowerCase();
    return biasKeywords.some(keyword => contentText.includes(keyword));
  }

  private async storeBiasDetection(insightId: string, biasScore: number, analysis: any): Promise<void> {
    const biasDetection: Omit<BiasDetection, 'id'> = {
      insight_id: insightId,
      bias_type: this.determineBiasType(analysis),
      bias_score: biasScore,
      confidence: analysis.confidence || 0.7,
      description: analysis.description || 'Potential bias detected in insight content',
      affected_groups: analysis.affected_groups || [],
      mitigation_suggestions: analysis.mitigation_suggestions || [],
      detected_at: new Date().toISOString(),
      status: 'detected'
    };

    await supabase
      .from('bias_detections')
      .insert(biasDetection);
  }

  private determineBiasType(analysis: any): BiasDetection['bias_type'] {
    // Determine the primary type of bias based on analysis
    if (analysis.demographic_bias_score > 0.5) return 'demographic';
    if (analysis.cultural_bias_score > 0.5) return 'cultural';
    if (analysis.geographic_bias_score > 0.5) return 'geographic';
    if (analysis.confirmation_bias_score > 0.5) return 'confirmation';
    return 'demographic'; // Default
  }

  private async getBiasTypesDetected(insights: any[]): Promise<Record<string, number>> {
    const biasTypes: Record<string, number> = {};
    
    for (const insight of insights) {
      const biasScore = await this.detectBias(insight);
      if (biasScore > 0.3) {
        // This is a simplified version - in practice, you'd analyze the specific bias types
        biasTypes['demographic'] = (biasTypes['demographic'] || 0) + 1;
      }
    }
    
    return biasTypes;
  }

  private async getCompletenessDistribution(insights: any[]): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {
      'very_complete': 0,
      'complete': 0,
      'partial': 0,
      'incomplete': 0
    };

    for (const insight of insights) {
      if (insight.validation_metrics && insight.validation_metrics.length > 0) {
        const completeness = insight.validation_metrics[0].metrics.average_completeness;
        if (completeness >= 4.5) distribution['very_complete']++;
        else if (completeness >= 3.5) distribution['complete']++;
        else if (completeness >= 2.5) distribution['partial']++;
        else distribution['incomplete']++;
      }
    }

    return distribution;
  }

  private async getRelevanceByType(insights: any[]): Promise<Record<string, number>> {
    const relevanceByType: Record<string, number> = {};

    for (const insight of insights) {
      if (insight.validation_metrics && insight.validation_metrics.length > 0) {
        const relevance = insight.validation_metrics[0].metrics.average_relevance;
        const type = insight.type;
        
        if (!relevanceByType[type]) {
          relevanceByType[type] = 0;
        }
        relevanceByType[type] += relevance;
      }
    }

    // Calculate averages
    Object.keys(relevanceByType).forEach(type => {
      const count = insights.filter(i => i.type === type).length;
      if (count > 0) {
        relevanceByType[type] = relevanceByType[type] / count;
      }
    });

    return relevanceByType;
  }

  private async storeQualityMetrics(metrics: QualityMetrics[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('quality_metrics')
        .insert(metrics);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing quality metrics:', error);
    }
  }

  async trackAccuracy(insightId: string): Promise<AccuracyTracking> {
    try {
      // Get insight and validation data
      const { data: insight } = await supabase
        .from('intelligence_insights')
        .select(`
          *,
          validation_metrics (*)
        `)
        .eq('id', insightId)
        .single();

      if (!insight) throw new Error('Insight not found');

      const validationMetrics = insight.validation_metrics[0]?.metrics;
      
      const accuracyTracking: Omit<AccuracyTracking, 'id'> = {
        insight_id: insightId,
        predicted_accuracy: insight.ai_confidence,
        validated_accuracy: insight.validation_score || 0,
        accuracy_delta: Math.abs((insight.validation_score || 0) - insight.ai_confidence),
        validation_count: validationMetrics?.total_validators || 0,
        consensus_level: validationMetrics?.consensus_level || 0,
        cultural_appropriateness: validationMetrics?.average_cultural_appropriateness || 0,
        source_reliability: this.calculateSourceReliability(insight.source_documents),
        tracked_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('accuracy_tracking')
        .insert(accuracyTracking)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error tracking accuracy:', error);
      throw error;
    }
  }

  private calculateSourceReliability(sourceDocuments: string[]): number {
    // Simple source reliability calculation
    // In practice, this would be more sophisticated
    if (!sourceDocuments || sourceDocuments.length === 0) return 0.5;
    
    // More sources generally means higher reliability
    const sourceCount = sourceDocuments.length;
    return Math.min(0.5 + (sourceCount * 0.1), 1.0);
  }

  async generateQualityAlert(alertData: Omit<QualityAlert, 'id' | 'created_at'>): Promise<QualityAlert> {
    try {
      const alert = {
        ...alertData,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('quality_alerts')
        .insert(alert)
        .select()
        .single();

      if (error) throw error;

      // Send notifications for high/critical alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await this.sendQualityAlertNotifications(data);
      }

      return data;
    } catch (error) {
      console.error('Error generating quality alert:', error);
      throw error;
    }
  }

  private async sendQualityAlertNotifications(alert: QualityAlert): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Sending quality alert notifications for: ${alert.title}`);
  }

  async getCommunityFeedbackMetrics(communityId: string, timeRange: string = '30d'): Promise<CommunityFeedbackMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      // Get community insights and validation data
      const { data: insights } = await supabase
        .from('intelligence_insights')
        .select(`
          *,
          validation_metrics (*)
        `)
        .eq('community_id', communityId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!insights) throw new Error('No insights found');

      const validatedInsights = insights.filter(i => i.validation_status === 'validated');
      const totalAccuracy = validatedInsights.reduce((sum, i) => sum + (i.validation_score || 0), 0);
      const averageAccuracy = validatedInsights.length > 0 ? totalAccuracy / validatedInsights.length : 0;

      // Calculate cultural appropriateness
      const culturallyReviewed = insights.filter(i => i.cultural_appropriateness !== 'pending');
      const culturallyApproved = insights.filter(i => i.cultural_appropriateness === 'approved');
      const averageCulturalAppropriateness = culturallyReviewed.length > 0 ? 
        culturallyApproved.length / culturallyReviewed.length : 0;

      // Get community feedback from validation responses
      const { data: feedbackResponses } = await supabase
        .from('validation_responses')
        .select(`
          *,
          validation_requests!inner (
            insight_id,
            intelligence_insights!inner (
              community_id
            )
          )
        `)
        .eq('validation_requests.intelligence_insights.community_id', communityId)
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString());

      const totalFeedback = feedbackResponses?.length || 0;
      const averageSatisfaction = totalFeedback > 0 ? 
        feedbackResponses!.reduce((sum, r) => sum + r.overall_rating, 0) / totalFeedback : 0;

      // Extract common concerns
      const allConcerns = feedbackResponses?.flatMap(r => r.cultural_concerns || []) || [];
      const commonConcerns = this.getTopConcerns(allConcerns);

      // Extract improvement areas
      const allSuggestions = feedbackResponses?.flatMap(r => r.suggested_improvements || []) || [];
      const improvementAreas = this.getTopSuggestions(allSuggestions);

      return {
        community_id: communityId,
        total_insights: insights.length,
        validated_insights: validatedInsights.length,
        average_accuracy: averageAccuracy,
        average_cultural_appropriateness: averageCulturalAppropriateness,
        community_satisfaction: averageSatisfaction,
        feedback_response_rate: insights.length > 0 ? totalFeedback / insights.length : 0,
        common_concerns: commonConcerns,
        improvement_areas: improvementAreas,
        time_period: timeRange
      };
    } catch (error) {
      console.error('Error getting community feedback metrics:', error);
      throw error;
    }
  }

  private getTopConcerns(concerns: string[]): string[] {
    const concernCounts = concerns.reduce((acc, concern) => {
      acc[concern] = (acc[concern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(concernCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([concern]) => concern);
  }

  private getTopSuggestions(suggestions: string[]): string[] {
    const suggestionCounts = suggestions.reduce((acc, suggestion) => {
      acc[suggestion] = (acc[suggestion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(suggestionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([suggestion]) => suggestion);
  }

  async getQualityTrends(timeRange: string = '90d', communityId?: string): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      // Get historical quality metrics
      let query = supabase
        .from('quality_metrics')
        .select('*')
        .gte('calculated_at', startDate.toISOString())
        .lte('calculated_at', endDate.toISOString())
        .order('calculated_at', { ascending: true });

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data: metrics, error } = await query;
      if (error) throw error;

      // Group metrics by type and calculate trends
      const trends: Record<string, any[]> = {};
      
      metrics?.forEach(metric => {
        if (!trends[metric.metric_type]) {
          trends[metric.metric_type] = [];
        }
        trends[metric.metric_type].push({
          date: metric.calculated_at,
          value: metric.value,
          status: metric.status
        });
      });

      return trends;
    } catch (error) {
      console.error('Error getting quality trends:', error);
      throw error;
    }
  }

  async getActiveAlerts(severity?: string): Promise<QualityAlert[]> {
    try {
      let query = supabase
        .from('quality_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  async resolveAlert(alertId: string, resolutionNotes: string): Promise<void> {
    try {
      await supabase
        .from('quality_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }
}

export const qualityMonitoringService = new QualityMonitoringService();