import { supabase } from './supabase';
import { analyzeDocumentChunk, analyzeCommunityIntelligence } from './ai-service';
import { analyzeCulturalSafety } from './cultural-safety-service';

export interface IntelligenceInsight {
  id: string;
  type: 'community_need' | 'service_gap' | 'success_pattern' | 'health_indicator' | 'trend_analysis';
  title: string;
  description: string;
  content: any;
  community_id: string;
  source_documents: string[];
  ai_confidence: number;
  validation_status: 'pending' | 'in_review' | 'validated' | 'rejected' | 'needs_revision';
  validation_score?: number;
  cultural_appropriateness: 'pending' | 'approved' | 'concerns' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ValidationRequest {
  id: string;
  insight_id: string;
  validator_id: string;
  validator_role: 'community_expert' | 'elder' | 'cultural_advisor' | 'subject_expert' | 'community_member';
  validation_type: 'accuracy' | 'cultural_appropriateness' | 'relevance' | 'completeness';
  status: 'assigned' | 'in_progress' | 'completed';
  assigned_at: string;
  completed_at?: string;
  deadline: string;
}

export interface ValidationResponse {
  id: string;
  request_id: string;
  validator_id: string;
  accuracy_score: number; // 1-5 scale
  relevance_score: number; // 1-5 scale
  completeness_score: number; // 1-5 scale
  cultural_appropriateness_score: number; // 1-5 scale
  overall_rating: number; // 1-5 scale
  feedback_comments: string;
  suggested_improvements: string[];
  cultural_concerns: string[];
  factual_corrections: string[];
  source_verification: {
    sources_accurate: boolean;
    missing_sources: string[];
    additional_sources: string[];
  };
  recommendation: 'approve' | 'approve_with_changes' | 'reject' | 'needs_more_review';
  confidence_level: number; // 0-1 scale
  submitted_at: string;
}

export interface CommunityExpert {
  id: string;
  user_id: string;
  community_id: string;
  expertise_areas: string[];
  cultural_role: string;
  validation_history: {
    total_validations: number;
    accuracy_rating: number;
    response_time_avg: number;
  };
  availability_status: 'available' | 'busy' | 'unavailable';
  preferred_languages: string[];
  cultural_protocols: {
    elder_consultation_required: boolean;
    traditional_knowledge_areas: string[];
    cultural_sensitivity_level: 'high' | 'medium' | 'low';
  };
}

export interface ValidationMetrics {
  insight_id: string;
  total_validators: number;
  completed_validations: number;
  average_accuracy: number;
  average_relevance: number;
  average_completeness: number;
  average_cultural_appropriateness: number;
  overall_validation_score: number;
  consensus_level: number; // How much validators agree
  cultural_compliance: boolean;
  recommendation_summary: {
    approve: number;
    approve_with_changes: number;
    reject: number;
    needs_more_review: number;
  };
  common_concerns: string[];
  improvement_suggestions: string[];
}

class IntelligenceValidationService {
  async submitInsightForValidation(insight: Omit<IntelligenceInsight, 'id' | 'created_at' | 'updated_at'>): Promise<IntelligenceInsight> {
    try {
      // Store the insight
      const { data: newInsight, error } = await supabase
        .from('intelligence_insights')
        .insert({
          ...insight,
          validation_status: 'pending',
          cultural_appropriateness: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically assign validators based on insight type and community
      await this.assignValidators(newInsight.id, insight.type, insight.community_id);

      // Check for cultural sensitivity and assign cultural review if needed
      if (await this.requiresCulturalReview(insight)) {
        await this.assignCulturalReview(newInsight.id, insight.community_id);
      }

      return newInsight;
    } catch (error) {
      console.error('Error submitting insight for validation:', error);
      throw error;
    }
  }

  async assignValidators(insightId: string, insightType: string, communityId: string): Promise<void> {
    try {
      // Get available community experts for this type of insight
      const experts = await this.getAvailableExperts(communityId, insightType);
      
      // Assign 2-3 validators per insight for consensus
      const selectedExperts = this.selectValidators(experts, 3);
      
      const validationRequests = selectedExperts.map(expert => ({
        insight_id: insightId,
        validator_id: expert.user_id,
        validator_role: expert.cultural_role as any,
        validation_type: this.getValidationTypeForInsight(insightType),
        status: 'assigned' as const,
        assigned_at: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));

      const { error } = await supabase
        .from('validation_requests')
        .insert(validationRequests);

      if (error) throw error;

      // Send notifications to assigned validators
      await this.notifyValidators(validationRequests);
    } catch (error) {
      console.error('Error assigning validators:', error);
      throw error;
    }
  }

  async getAvailableExperts(communityId: string, insightType: string): Promise<CommunityExpert[]> {
    try {
      const { data: experts, error } = await supabase
        .from('community_experts')
        .select(`
          *,
          users (
            id,
            email,
            profile
          )
        `)
        .eq('community_id', communityId)
        .eq('availability_status', 'available')
        .contains('expertise_areas', [insightType]);

      if (error) throw error;

      return experts || [];
    } catch (error) {
      console.error('Error getting available experts:', error);
      return [];
    }
  }

  private selectValidators(experts: CommunityExpert[], count: number): CommunityExpert[] {
    // Prioritize experts with:
    // 1. High accuracy rating
    // 2. Fast response time
    // 3. Relevant cultural role
    
    const sortedExperts = experts.sort((a, b) => {
      const scoreA = a.validation_history.accuracy_rating * 0.5 + 
                    (1 / (a.validation_history.response_time_avg + 1)) * 0.3 +
                    (a.cultural_role === 'elder' ? 0.2 : 0);
      
      const scoreB = b.validation_history.accuracy_rating * 0.5 + 
                    (1 / (b.validation_history.response_time_avg + 1)) * 0.3 +
                    (b.cultural_role === 'elder' ? 0.2 : 0);
      
      return scoreB - scoreA;
    });

    return sortedExperts.slice(0, Math.min(count, sortedExperts.length));
  }

  private getValidationTypeForInsight(insightType: string): 'accuracy' | 'cultural_appropriateness' | 'relevance' | 'completeness' {
    switch (insightType) {
      case 'community_need':
      case 'service_gap':
        return 'accuracy';
      case 'success_pattern':
        return 'relevance';
      case 'health_indicator':
        return 'completeness';
      case 'trend_analysis':
        return 'accuracy';
      default:
        return 'accuracy';
    }
  }

  async requiresCulturalReview(insight: Omit<IntelligenceInsight, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    // Check if insight content contains culturally sensitive information
    const culturalKeywords = [
      'traditional', 'ceremony', 'sacred', 'elder', 'spiritual', 
      'cultural', 'indigenous', 'ancestral', 'ritual', 'medicine'
    ];

    const contentText = JSON.stringify(insight.content).toLowerCase();
    return culturalKeywords.some(keyword => contentText.includes(keyword));
  }

  async assignCulturalReview(insightId: string, communityId: string): Promise<void> {
    try {
      // Get cultural advisors and elders for this community
      const { data: culturalExperts } = await supabase
        .from('community_experts')
        .select('*')
        .eq('community_id', communityId)
        .in('cultural_role', ['elder', 'cultural_advisor'])
        .eq('availability_status', 'available');

      if (culturalExperts && culturalExperts.length > 0) {
        const culturalRequest = {
          insight_id: insightId,
          validator_id: culturalExperts[0].user_id,
          validator_role: culturalExperts[0].cultural_role as any,
          validation_type: 'cultural_appropriateness' as const,
          status: 'assigned' as const,
          assigned_at: new Date().toISOString(),
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days for cultural review
        };

        await supabase
          .from('validation_requests')
          .insert(culturalRequest);
      }
    } catch (error) {
      console.error('Error assigning cultural review:', error);
    }
  }

  async submitValidationResponse(response: Omit<ValidationResponse, 'id' | 'submitted_at'>): Promise<ValidationResponse> {
    try {
      // Validate response data
      this.validateResponseData(response);

      const { data: newResponse, error } = await supabase
        .from('validation_responses')
        .insert({
          ...response,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update validation request status
      await supabase
        .from('validation_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', response.request_id);

      // Check if all validations are complete and update insight status
      await this.checkValidationCompletion(response.request_id);

      return newResponse;
    } catch (error) {
      console.error('Error submitting validation response:', error);
      throw error;
    }
  }

  private validateResponseData(response: Omit<ValidationResponse, 'id' | 'submitted_at'>): void {
    const requiredScores = ['accuracy_score', 'relevance_score', 'completeness_score', 'cultural_appropriateness_score', 'overall_rating'];
    
    for (const score of requiredScores) {
      const value = (response as any)[score];
      if (typeof value !== 'number' || value < 1 || value > 5) {
        throw new Error(`${score} must be a number between 1 and 5`);
      }
    }

    if (typeof response.confidence_level !== 'number' || response.confidence_level < 0 || response.confidence_level > 1) {
      throw new Error('confidence_level must be a number between 0 and 1');
    }

    const validRecommendations = ['approve', 'approve_with_changes', 'reject', 'needs_more_review'];
    if (!validRecommendations.includes(response.recommendation)) {
      throw new Error('Invalid recommendation value');
    }
  }

  async checkValidationCompletion(requestId: string): Promise<void> {
    try {
      // Get the insight ID from the request
      const { data: request } = await supabase
        .from('validation_requests')
        .select('insight_id')
        .eq('id', requestId)
        .single();

      if (!request) return;

      // Check if all validation requests for this insight are completed
      const { data: allRequests } = await supabase
        .from('validation_requests')
        .select('status')
        .eq('insight_id', request.insight_id);

      const allCompleted = allRequests?.every(req => req.status === 'completed');

      if (allCompleted) {
        // Calculate validation metrics and update insight
        const metrics = await this.calculateValidationMetrics(request.insight_id);
        await this.updateInsightValidationStatus(request.insight_id, metrics);
      }
    } catch (error) {
      console.error('Error checking validation completion:', error);
    }
  }

  async calculateValidationMetrics(insightId: string): Promise<ValidationMetrics> {
    try {
      const { data: responses } = await supabase
        .from('validation_responses')
        .select(`
          *,
          validation_requests!inner (
            insight_id
          )
        `)
        .eq('validation_requests.insight_id', insightId);

      if (!responses || responses.length === 0) {
        throw new Error('No validation responses found');
      }

      const totalValidators = responses.length;
      const completedValidations = responses.length;

      // Calculate averages
      const averageAccuracy = responses.reduce((sum, r) => sum + r.accuracy_score, 0) / totalValidators;
      const averageRelevance = responses.reduce((sum, r) => sum + r.relevance_score, 0) / totalValidators;
      const averageCompleteness = responses.reduce((sum, r) => sum + r.completeness_score, 0) / totalValidators;
      const averageCulturalAppropriateness = responses.reduce((sum, r) => sum + r.cultural_appropriateness_score, 0) / totalValidators;
      
      const overallValidationScore = (averageAccuracy + averageRelevance + averageCompleteness + averageCulturalAppropriateness) / 4;

      // Calculate consensus level (how much validators agree)
      const overallRatings = responses.map(r => r.overall_rating);
      const variance = this.calculateVariance(overallRatings);
      const consensusLevel = Math.max(0, 1 - (variance / 4)); // Normalize to 0-1

      // Count recommendations
      const recommendationCounts = responses.reduce((counts, r) => {
        counts[r.recommendation] = (counts[r.recommendation] || 0) + 1;
        return counts;
      }, {} as any);

      // Extract common concerns and suggestions
      const allConcerns = responses.flatMap(r => r.cultural_concerns || []);
      const allSuggestions = responses.flatMap(r => r.suggested_improvements || []);

      const commonConcerns = this.findCommonItems(allConcerns);
      const improvementSuggestions = this.findCommonItems(allSuggestions);

      // Determine cultural compliance
      const culturalCompliance = averageCulturalAppropriateness >= 3.5 && 
                                responses.every(r => (r.cultural_concerns || []).length === 0);

      return {
        insight_id: insightId,
        total_validators: totalValidators,
        completed_validations: completedValidations,
        average_accuracy: averageAccuracy,
        average_relevance: averageRelevance,
        average_completeness: averageCompleteness,
        average_cultural_appropriateness: averageCulturalAppropriateness,
        overall_validation_score: overallValidationScore,
        consensus_level: consensusLevel,
        cultural_compliance: culturalCompliance,
        recommendation_summary: {
          approve: recommendationCounts.approve || 0,
          approve_with_changes: recommendationCounts.approve_with_changes || 0,
          reject: recommendationCounts.reject || 0,
          needs_more_review: recommendationCounts.needs_more_review || 0
        },
        common_concerns: commonConcerns,
        improvement_suggestions: improvementSuggestions
      };
    } catch (error) {
      console.error('Error calculating validation metrics:', error);
      throw error;
    }
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private findCommonItems(items: string[]): string[] {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return items mentioned by at least 2 validators
    return Object.entries(counts)
      .filter(([_, count]) => count >= 2)
      .map(([item, _]) => item)
      .slice(0, 5); // Top 5 common items
  }

  async updateInsightValidationStatus(insightId: string, metrics: ValidationMetrics): Promise<void> {
    try {
      let validationStatus: IntelligenceInsight['validation_status'];
      let culturalAppropriateness: IntelligenceInsight['cultural_appropriateness'];

      // Determine validation status based on metrics
      if (metrics.overall_validation_score >= 4.0 && metrics.consensus_level >= 0.7) {
        if (metrics.recommendation_summary.approve >= metrics.recommendation_summary.reject) {
          validationStatus = 'validated';
        } else if (metrics.recommendation_summary.approve_with_changes > 0) {
          validationStatus = 'needs_revision';
        } else {
          validationStatus = 'rejected';
        }
      } else if (metrics.overall_validation_score >= 3.0) {
        validationStatus = 'needs_revision';
      } else {
        validationStatus = 'rejected';
      }

      // Determine cultural appropriateness
      if (metrics.cultural_compliance && metrics.average_cultural_appropriateness >= 4.0) {
        culturalAppropriateness = 'approved';
      } else if (metrics.average_cultural_appropriateness >= 3.0) {
        culturalAppropriateness = 'concerns';
      } else {
        culturalAppropriateness = 'rejected';
      }

      // Update insight
      await supabase
        .from('intelligence_insights')
        .update({
          validation_status: validationStatus,
          validation_score: metrics.overall_validation_score,
          cultural_appropriateness: culturalAppropriateness,
          updated_at: new Date().toISOString()
        })
        .eq('id', insightId);

      // Store validation metrics
      await supabase
        .from('validation_metrics')
        .upsert({
          insight_id: insightId,
          metrics: metrics,
          calculated_at: new Date().toISOString()
        });

      // If insight is validated, integrate it into the platform
      if (validationStatus === 'validated') {
        await this.integrateValidatedInsight(insightId);
      }

    } catch (error) {
      console.error('Error updating insight validation status:', error);
      throw error;
    }
  }

  async integrateValidatedInsight(insightId: string): Promise<void> {
    try {
      const { data: insight } = await supabase
        .from('intelligence_insights')
        .select('*')
        .eq('id', insightId)
        .single();

      if (!insight) return;

      // Based on insight type, integrate into appropriate system
      switch (insight.type) {
        case 'community_need':
          await this.integrateAsNeed(insight);
          break;
        case 'service_gap':
          await this.integrateAsServiceGap(insight);
          break;
        case 'success_pattern':
          await this.integrateAsSuccessPattern(insight);
          break;
        case 'health_indicator':
          await this.integrateAsHealthIndicator(insight);
          break;
        case 'trend_analysis':
          await this.integrateAsTrend(insight);
          break;
      }

      // Notify relevant stakeholders
      await this.notifyStakeholders(insight);

    } catch (error) {
      console.error('Error integrating validated insight:', error);
    }
  }

  private async integrateAsNeed(insight: IntelligenceInsight): Promise<void> {
    // Add to community needs database
    await supabase
      .from('community_needs')
      .insert({
        community_id: insight.community_id,
        need_type: insight.content.category,
        description: insight.description,
        urgency: insight.content.urgency,
        evidence_sources: insight.source_documents,
        validation_score: insight.validation_score,
        identified_at: insight.created_at
      });
  }

  private async integrateAsServiceGap(insight: IntelligenceInsight): Promise<void> {
    // Add to service gaps database
    await supabase
      .from('service_gaps')
      .insert({
        community_id: insight.community_id,
        gap_type: insight.content.service_area,
        description: insight.description,
        severity: insight.content.severity,
        affected_population: insight.content.affected_groups,
        evidence_sources: insight.source_documents,
        validation_score: insight.validation_score,
        identified_at: insight.created_at
      });
  }

  private async integrateAsSuccessPattern(insight: IntelligenceInsight): Promise<void> {
    // Add to success patterns database
    await supabase
      .from('success_patterns')
      .insert({
        community_id: insight.community_id,
        title: insight.title,
        description: insight.description,
        category: insight.content.category,
        success_metrics: insight.content.metrics,
        implementation_factors: insight.content.factors,
        replication_potential: insight.content.replication_potential,
        evidence_sources: insight.source_documents,
        validation_score: insight.validation_score,
        identified_at: insight.created_at
      });
  }

  private async integrateAsHealthIndicator(insight: IntelligenceInsight): Promise<void> {
    // Update community health indicators
    await supabase
      .from('community_health_indicators')
      .upsert({
        community_id: insight.community_id,
        indicator_type: insight.content.indicator_type,
        value: insight.content.value,
        trend: insight.content.trend,
        data_sources: insight.source_documents,
        validation_score: insight.validation_score,
        last_updated: new Date().toISOString()
      });
  }

  private async integrateAsTrend(insight: IntelligenceInsight): Promise<void> {
    // Add to trend analysis database
    await supabase
      .from('community_trends')
      .insert({
        community_id: insight.community_id,
        trend_type: insight.content.trend_type,
        description: insight.description,
        direction: insight.content.direction,
        confidence: insight.content.confidence,
        time_period: insight.content.time_period,
        evidence_sources: insight.source_documents,
        validation_score: insight.validation_score,
        identified_at: insight.created_at
      });
  }

  async notifyValidators(requests: any[]): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Notifying ${requests.length} validators of new validation assignments`);
  }

  async notifyStakeholders(insight: IntelligenceInsight): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Notifying stakeholders of validated insight: ${insight.title}`);
  }

  async getValidationRequests(validatorId: string, status?: string): Promise<ValidationRequest[]> {
    try {
      let query = supabase
        .from('validation_requests')
        .select(`
          *,
          intelligence_insights (
            title,
            description,
            type,
            community_id
          )
        `)
        .eq('validator_id', validatorId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('assigned_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting validation requests:', error);
      return [];
    }
  }

  async getValidationMetrics(insightId: string): Promise<ValidationMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('validation_metrics')
        .select('metrics')
        .eq('insight_id', insightId)
        .single();

      if (error) throw error;

      return data?.metrics || null;
    } catch (error) {
      console.error('Error getting validation metrics:', error);
      return null;
    }
  }

  async getValidatedInsights(communityId?: string, type?: string): Promise<IntelligenceInsight[]> {
    try {
      let query = supabase
        .from('intelligence_insights')
        .select('*')
        .eq('validation_status', 'validated');

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting validated insights:', error);
      return [];
    }
  }

  async registerCommunityExpert(expertData: Omit<CommunityExpert, 'id'>): Promise<CommunityExpert> {
    try {
      const { data, error } = await supabase
        .from('community_experts')
        .insert({
          ...expertData,
          validation_history: {
            total_validations: 0,
            accuracy_rating: 0,
            response_time_avg: 0
          }
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error registering community expert:', error);
      throw error;
    }
  }

  async updateExpertAvailability(expertId: string, status: CommunityExpert['availability_status']): Promise<void> {
    try {
      await supabase
        .from('community_experts')
        .update({ availability_status: status })
        .eq('id', expertId);
    } catch (error) {
      console.error('Error updating expert availability:', error);
      throw error;
    }
  }
}

export const intelligenceValidationService = new IntelligenceValidationService();