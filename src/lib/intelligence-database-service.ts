import { supabase } from './supabase';

export interface IntelligenceInsight {
  id: string;
  community_id: string;
  insight_type: 'community_need' | 'service_gap' | 'success_pattern' | 'risk_factor' | 'opportunity' | 'trend_analysis';
  title: string;
  description: string;
  confidence_score: number;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  impact_level: 'low' | 'medium' | 'high' | 'transformational';
  source_documents: string[];
  source_stories: string[];
  source_workshops: string[];
  ai_model_version?: string;
  generation_timestamp: string;
  processing_duration_ms?: number;
  validation_status: 'pending' | 'community_validated' | 'expert_validated' | 'rejected' | 'needs_review';
  validation_score?: number;
  validation_feedback?: string;
  validated_by?: string;
  validated_at?: string;
  cultural_review_required: boolean;
  cultural_review_status: 'pending' | 'approved' | 'requires_modification' | 'rejected';
  elder_consultation_id?: string;
  cultural_context: Record<string, any>;
  status: 'active' | 'archived' | 'superseded';
  superseded_by?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface DocumentInsightMapping {
  id: string;
  document_id: string;
  insight_id: string;
  relevance_score: number;
  evidence_text: string;
  evidence_location: Record<string, any>;
  extraction_method: 'ai_analysis' | 'manual_annotation' | 'pattern_matching';
  created_at: string;
}

export interface CommunityInsightAggregation {
  id: string;
  community_id: string;
  aggregation_date: string;
  total_insights: number;
  community_needs_count: number;
  service_gaps_count: number;
  success_patterns_count: number;
  risk_factors_count: number;
  opportunities_count: number;
  avg_confidence_score: number;
  validated_insights_count: number;
  validation_rate: number;
  culturally_reviewed_count: number;
  elder_approved_count: number;
  cultural_compliance_rate: number;
  critical_insights_count: number;
  high_urgency_count: number;
  medium_urgency_count: number;
  low_urgency_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_category: 'intelligence_generation' | 'user_interaction' | 'system_performance' | 'cultural_safety' | 'validation' | 'dashboard_usage';
  community_id?: string;
  user_id?: string;
  session_id?: string;
  event_data: Record<string, any>;
  event_timestamp: string;
  processing_time_ms?: number;
  memory_usage_mb?: number;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  batch_id?: string;
  processed: boolean;
  processed_at?: string;
}

export interface RealtimeMetric {
  id: string;
  metric_name: string;
  metric_category: string;
  community_id?: string;
  metric_value: number;
  metric_count: number;
  metric_data: Record<string, any>;
  time_window_start: string;
  time_window_end: string;
  window_duration_minutes: number;
  created_at: string;
}

export interface CrossCommunityPattern {
  id: string;
  pattern_name: string;
  pattern_type: string;
  primary_community_id: string;
  related_community_ids: string[];
  pattern_strength: number;
  confidence_level: number;
  supporting_insights: string[];
  contradicting_insights: string[];
  first_detected_at: string;
  last_confirmed_at: string;
  detection_frequency: number;
  geographic_scope: 'local' | 'regional' | 'provincial' | 'national';
  demographic_factors: Record<string, any>;
  status: 'active' | 'monitoring' | 'archived';
  created_at: string;
  updated_at: string;
}

export class IntelligenceDatabaseService {
  // =============================================
  // INTELLIGENCE INSIGHTS OPERATIONS
  // =============================================

  static async createIntelligenceInsight(insight: Partial<IntelligenceInsight>): Promise<IntelligenceInsight> {
    const { data, error } = await supabase.rpc('create_intelligence_insight', {
      p_community_id: insight.community_id,
      p_insight_type: insight.insight_type,
      p_title: insight.title,
      p_description: insight.description,
      p_confidence_score: insight.confidence_score,
      p_urgency_level: insight.urgency_level,
      p_impact_level: insight.impact_level,
      p_source_documents: insight.source_documents || [],
      p_source_stories: insight.source_stories || [],
      p_ai_model_version: insight.ai_model_version,
      p_processing_duration_ms: insight.processing_duration_ms,
      p_created_by: insight.created_by,
      p_tags: insight.tags || [],
      p_metadata: insight.metadata || {}
    });

    if (error) {
      console.error('Error creating intelligence insight:', error);
      throw error;
    }

    // Fetch the created insight
    const { data: createdInsight, error: fetchError } = await supabase
      .from('intelligence_insights')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching created insight:', fetchError);
      throw fetchError;
    }

    return createdInsight;
  }

  static async getIntelligenceInsights(
    communityId?: string,
    insightType?: string,
    status: string = 'active',
    limit: number = 50,
    offset: number = 0
  ): Promise<IntelligenceInsight[]> {
    let query = supabase
      .from('intelligence_insights')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (insightType) {
      query = query.eq('insight_type', insightType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching intelligence insights:', error);
      throw error;
    }

    return data || [];
  }

  static async updateIntelligenceInsight(
    insightId: string,
    updates: Partial<IntelligenceInsight>
  ): Promise<IntelligenceInsight> {
    const { data, error } = await supabase
      .from('intelligence_insights')
      .update(updates)
      .eq('id', insightId)
      .select()
      .single();

    if (error) {
      console.error('Error updating intelligence insight:', error);
      throw error;
    }

    return data;
  }

  static async validateIntelligenceInsight(
    insightId: string,
    validationStatus: string,
    validationScore?: number,
    validationFeedback?: string,
    validatedBy?: string
  ): Promise<IntelligenceInsight> {
    const updates: Partial<IntelligenceInsight> = {
      validation_status: validationStatus as any,
      validation_score: validationScore,
      validation_feedback: validationFeedback,
      validated_by: validatedBy,
      validated_at: new Date().toISOString()
    };

    return this.updateIntelligenceInsight(insightId, updates);
  }

  // =============================================
  // DOCUMENT-INSIGHT MAPPING OPERATIONS
  // =============================================

  static async createDocumentInsightMapping(mapping: Partial<DocumentInsightMapping>): Promise<DocumentInsightMapping> {
    const { data, error } = await supabase
      .from('document_insight_mappings')
      .insert(mapping)
      .select()
      .single();

    if (error) {
      console.error('Error creating document insight mapping:', error);
      throw error;
    }

    return data;
  }

  static async getDocumentInsightMappings(
    documentId?: string,
    insightId?: string
  ): Promise<DocumentInsightMapping[]> {
    let query = supabase
      .from('document_insight_mappings')
      .select('*')
      .order('relevance_score', { ascending: false });

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    if (insightId) {
      query = query.eq('insight_id', insightId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching document insight mappings:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // COMMUNITY AGGREGATIONS
  // =============================================

  static async getCommunityInsightAggregation(
    communityId: string,
    date?: string
  ): Promise<CommunityInsightAggregation | null> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('community_insight_aggregations')
      .select('*')
      .eq('community_id', communityId)
      .eq('aggregation_date', targetDate)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching community insight aggregation:', error);
      throw error;
    }

    return data;
  }

  static async getCommunityInsightAggregations(
    communityId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<CommunityInsightAggregation[]> {
    let query = supabase
      .from('community_insight_aggregations')
      .select('*')
      .order('aggregation_date', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (startDate) {
      query = query.gte('aggregation_date', startDate);
    }

    if (endDate) {
      query = query.lte('aggregation_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community insight aggregations:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // ANALYTICS EVENTS
  // =============================================

  static async recordAnalyticsEvent(event: Partial<AnalyticsEvent>): Promise<AnalyticsEvent> {
    const { data, error } = await supabase.rpc('record_analytics_event', {
      p_event_type: event.event_type,
      p_event_category: event.event_category,
      p_community_id: event.community_id,
      p_user_id: event.user_id,
      p_session_id: event.session_id,
      p_event_data: event.event_data || {},
      p_processing_time_ms: event.processing_time_ms
    });

    if (error) {
      console.error('Error recording analytics event:', error);
      throw error;
    }

    // Fetch the created event
    const { data: createdEvent, error: fetchError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching created event:', fetchError);
      throw fetchError;
    }

    return createdEvent;
  }

  static async getAnalyticsEvents(
    eventType?: string,
    eventCategory?: string,
    communityId?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<AnalyticsEvent[]> {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (eventCategory) {
      query = query.eq('event_category', eventCategory);
    }

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (startDate) {
      query = query.gte('event_timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('event_timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analytics events:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // REALTIME METRICS
  // =============================================

  static async updateRealtimeMetric(
    metricName: string,
    metricCategory: string,
    metricValue: number,
    communityId?: string,
    metricData: Record<string, any> = {},
    windowDurationMinutes: number = 60
  ): Promise<RealtimeMetric> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowDurationMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from('realtime_metrics')
      .insert({
        metric_name: metricName,
        metric_category: metricCategory,
        community_id: communityId,
        metric_value: metricValue,
        metric_count: 1,
        metric_data: metricData,
        time_window_start: windowStart.toISOString(),
        time_window_end: now.toISOString(),
        window_duration_minutes: windowDurationMinutes
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating realtime metric:', error);
      throw error;
    }

    return data;
  }

  static async getRealtimeMetrics(
    metricName?: string,
    metricCategory?: string,
    communityId?: string,
    hoursBack: number = 24
  ): Promise<RealtimeMetric[]> {
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('realtime_metrics')
      .select('*')
      .gte('time_window_start', startTime)
      .order('time_window_start', { ascending: false });

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    if (metricCategory) {
      query = query.eq('metric_category', metricCategory);
    }

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching realtime metrics:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // CROSS-COMMUNITY PATTERNS
  // =============================================

  static async createCrossCommunityPattern(pattern: Partial<CrossCommunityPattern>): Promise<CrossCommunityPattern> {
    const { data, error } = await supabase
      .from('cross_community_patterns')
      .insert(pattern)
      .select()
      .single();

    if (error) {
      console.error('Error creating cross-community pattern:', error);
      throw error;
    }

    return data;
  }

  static async getCrossCommunityPatterns(
    patternType?: string,
    communityId?: string,
    status: string = 'active'
  ): Promise<CrossCommunityPattern[]> {
    let query = supabase
      .from('cross_community_patterns')
      .select('*')
      .eq('status', status)
      .order('pattern_strength', { ascending: false });

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    if (communityId) {
      query = query.or(`primary_community_id.eq.${communityId},related_community_ids.cs.{${communityId}}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cross-community patterns:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // VIEWS AND SUMMARY QUERIES
  // =============================================

  static async getCommunityIntelligenceSummary(communityId?: string) {
    let query = supabase
      .from('community_intelligence_summary')
      .select('*');

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community intelligence summary:', error);
      throw error;
    }

    return data || [];
  }

  static async getRecentIntelligenceActivity(limit: number = 20) {
    const { data, error } = await supabase
      .from('recent_intelligence_activity')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching recent intelligence activity:', error);
      throw error;
    }

    return data || [];
  }

  static async getHighPriorityInsights(communityId?: string, limit: number = 10) {
    let query = supabase
      .from('high_priority_insights')
      .select('*')
      .limit(limit);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching high priority insights:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  static async batchCreateInsights(insights: Partial<IntelligenceInsight>[]): Promise<IntelligenceInsight[]> {
    const results: IntelligenceInsight[] = [];

    for (const insight of insights) {
      try {
        const created = await this.createIntelligenceInsight(insight);
        results.push(created);
      } catch (error) {
        console.error('Error in batch insight creation:', error);
        // Continue with other insights
      }
    }

    return results;
  }

  static async batchRecordEvents(events: Partial<AnalyticsEvent>[]): Promise<AnalyticsEvent[]> {
    const results: AnalyticsEvent[] = [];

    for (const event of events) {
      try {
        const recorded = await this.recordAnalyticsEvent(event);
        results.push(recorded);
      } catch (error) {
        console.error('Error in batch event recording:', error);
        // Continue with other events
      }
    }

    return results;
  }

  // =============================================
  // CLEANUP AND MAINTENANCE
  // =============================================

  static async cleanupOldAnalyticsEvents(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analytics_events')
      .delete()
      .lt('event_timestamp', cutoffDate);

    if (error) {
      console.error('Error cleaning up old analytics events:', error);
      throw error;
    }

    return data?.length || 0;
  }

  static async cleanupOldRealtimeMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('realtime_metrics')
      .delete()
      .lt('time_window_start', cutoffDate);

    if (error) {
      console.error('Error cleaning up old realtime metrics:', error);
      throw error;
    }

    return data?.length || 0;
  }
}