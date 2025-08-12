import { supabase } from './supabase';
import { analyzeCommunityIntelligence, analyzeDocumentChunk } from './ai-service';
import { analyzeCulturalSafety } from './cultural-safety-service';

export interface PreviewSession {
  id: string;
  title: string;
  description: string;
  community_id: string;
  facilitator_id: string;
  scheduled_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participant_count: number;
  feedback_collected: boolean;
  cultural_protocols: {
    elder_presence_required: boolean;
    traditional_opening: boolean;
    language_support: string[];
    recording_permitted: boolean;
  };
  data_subset: {
    story_ids: string[];
    feature_areas: string[];
    intelligence_samples: any[];
  };
  created_at: string;
  updated_at: string;
}

export interface PreviewFeedback {
  id: string;
  session_id: string;
  participant_id: string;
  participant_role: 'community_member' | 'elder' | 'youth' | 'leader' | 'external';
  feedback_type: 'feature_usability' | 'cultural_appropriateness' | 'intelligence_accuracy' | 'general';
  rating: number; // 1-5 scale
  comments: string;
  specific_feature?: string;
  improvement_suggestions: string[];
  cultural_concerns?: string[];
  privacy_concerns?: string[];
  accessibility_issues?: string[];
  submitted_at: string;
}

export interface StakeholderFeedback {
  id: string;
  stakeholder_type: 'government' | 'ngo' | 'funder' | 'researcher' | 'community_leader';
  organization: string;
  contact_person: string;
  feedback_category: 'platform_utility' | 'data_quality' | 'policy_impact' | 'technical_requirements';
  detailed_feedback: {
    strengths: string[];
    weaknesses: string[];
    missing_features: string[];
    integration_needs: string[];
    policy_implications: string[];
  };
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  implementation_timeline?: string;
  follow_up_required: boolean;
  submitted_at: string;
}

export interface FeedbackAnalysis {
  session_id: string;
  overall_satisfaction: number;
  feature_ratings: Record<string, number>;
  common_themes: string[];
  critical_issues: string[];
  improvement_priorities: string[];
  cultural_compliance_score: number;
  accessibility_score: number;
  recommendations: string[];
}

class CommunityPreviewService {
  async createPreviewSession(sessionData: Omit<PreviewSession, 'id' | 'created_at' | 'updated_at'>): Promise<PreviewSession> {
    try {
      // Validate cultural protocols
      await this.validateCulturalProtocols(sessionData.community_id, sessionData.cultural_protocols);
      
      // Prepare data subset for preview
      const dataSubset = await this.prepareDataSubset(
        sessionData.community_id,
        sessionData.data_subset.feature_areas
      );
      
      const { data, error } = await supabase
        .from('preview_sessions')
        .insert({
          ...sessionData,
          data_subset: dataSubset,
          status: 'scheduled',
          feedback_collected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Schedule notifications for participants
      await this.scheduleParticipantNotifications(data.id);
      
      return data;
    } catch (error) {
      console.error('Error creating preview session:', error);
      throw error;
    }
  }

  async prepareDataSubset(communityId: string, featureAreas: string[]): Promise<any> {
    try {
      const dataSubset: any = {
        story_ids: [],
        feature_areas: featureAreas,
        intelligence_samples: []
      };
      
      // Get representative stories (anonymized)
      const { data: stories } = await supabase
        .from('documents')
        .select('id, title, content, themes, created_at')
        .eq('community_id', communityId)
        .eq('status', 'approved')
        .eq('cultural_sensitivity', 'low') // Only low sensitivity for preview
        .limit(10);
      
      if (stories) {
        dataSubset.story_ids = stories.map(s => s.id);
        
        // Anonymize story content for preview
        dataSubset.anonymized_stories = stories.map(story => ({
          id: story.id,
          title: this.anonymizeText(story.title),
          content: this.anonymizeText(story.content),
          themes: story.themes,
          created_at: story.created_at
        }));
      }
      
      // Get sample intelligence insights
      if (featureAreas.includes('community_health')) {
        const healthData = await this.getHealthIndicatorSamples(communityId);
        dataSubset.intelligence_samples.push({
          type: 'community_health',
          data: healthData
        });
      }
      
      if (featureAreas.includes('service_gaps')) {
        const gapData = await this.getServiceGapSamples(communityId);
        dataSubset.intelligence_samples.push({
          type: 'service_gaps',
          data: gapData
        });
      }
      
      if (featureAreas.includes('success_patterns')) {
        const patternData = await this.getSuccessPatternSamples(communityId);
        dataSubset.intelligence_samples.push({
          type: 'success_patterns',
          data: patternData
        });
      }
      
      return dataSubset;
    } catch (error) {
      console.error('Error preparing data subset:', error);
      throw error;
    }
  }

  private anonymizeText(text: string): string {
    // Replace specific names, locations, and identifying information
    return text
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[Name]') // Names
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[Phone]') // Phone numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[Email]') // Emails
      .replace(/\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr)\b/gi, '[Address]'); // Addresses
  }

  async validateCulturalProtocols(communityId: string, protocols: any): Promise<void> {
    const { data: communityProtocols } = await supabase
      .from('cultural_protocols')
      .select('*')
      .eq('community_id', communityId)
      .eq('protocol_type', 'preview_sessions');
    
    if (communityProtocols && communityProtocols.length > 0) {
      const required = communityProtocols[0].requirements;
      
      if (required.elder_presence_required && !protocols.elder_presence_required) {
        throw new Error('Elder presence is required for preview sessions in this community');
      }
      
      if (required.traditional_opening && !protocols.traditional_opening) {
        throw new Error('Traditional opening is required for preview sessions in this community');
      }
    }
  }

  async getHealthIndicatorSamples(communityId: string): Promise<any> {
    const { data } = await supabase
      .from('community_health_indicators')
      .select('*')
      .eq('community_id', communityId)
      .limit(5);
    
    return data || [];
  }

  async getServiceGapSamples(communityId: string): Promise<any> {
    const { data } = await supabase
      .from('service_gaps')
      .select('*')
      .eq('community_id', communityId)
      .eq('severity', 'high')
      .limit(3);
    
    return data || [];
  }

  async getSuccessPatternSamples(communityId: string): Promise<any> {
    const { data } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('community_id', communityId)
      .eq('replication_potential', 'high')
      .limit(3);
    
    return data || [];
  }

  async scheduleParticipantNotifications(sessionId: string): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Scheduling notifications for preview session ${sessionId}`);
  }

  async submitPreviewFeedback(feedback: Omit<PreviewFeedback, 'id' | 'submitted_at'>): Promise<PreviewFeedback> {
    try {
      // Validate feedback content for cultural appropriateness
      if (feedback.comments) {
        const culturalCheck = await analyzeCulturalSafety(feedback.comments);
        if (!culturalCheck.isAppropriate) {
          throw new Error('Feedback contains culturally inappropriate content');
        }
      }
      
      const { data, error } = await supabase
        .from('preview_feedback')
        .insert({
          ...feedback,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Trigger feedback analysis update
      await this.updateFeedbackAnalysis(feedback.session_id);
      
      return data;
    } catch (error) {
      console.error('Error submitting preview feedback:', error);
      throw error;
    }
  }

  async submitStakeholderFeedback(feedback: Omit<StakeholderFeedback, 'id' | 'submitted_at'>): Promise<StakeholderFeedback> {
    try {
      const { data, error } = await supabase
        .from('stakeholder_feedback')
        .insert({
          ...feedback,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create follow-up tasks if required
      if (feedback.follow_up_required) {
        await this.createFollowUpTask(data.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error submitting stakeholder feedback:', error);
      throw error;
    }
  }

  async updateFeedbackAnalysis(sessionId: string): Promise<FeedbackAnalysis> {
    try {
      // Get all feedback for the session
      const { data: feedbackList } = await supabase
        .from('preview_feedback')
        .select('*')
        .eq('session_id', sessionId);
      
      if (!feedbackList || feedbackList.length === 0) {
        throw new Error('No feedback found for session');
      }
      
      // Calculate overall satisfaction
      const overallSatisfaction = feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length;
      
      // Calculate feature ratings
      const featureRatings: Record<string, number> = {};
      const featureFeedback = feedbackList.filter(f => f.specific_feature);
      
      featureFeedback.forEach(f => {
        if (!featureRatings[f.specific_feature!]) {
          featureRatings[f.specific_feature!] = 0;
        }
        featureRatings[f.specific_feature!] += f.rating;
      });
      
      Object.keys(featureRatings).forEach(feature => {
        const count = featureFeedback.filter(f => f.specific_feature === feature).length;
        featureRatings[feature] = featureRatings[feature] / count;
      });
      
      // Extract common themes using AI
      const allComments = feedbackList.map(f => f.comments).join(' ');
      const themeAnalysis = await analyzeDocumentChunk(allComments, 'feedback_analysis');
      
      // Identify critical issues
      const criticalIssues = feedbackList
        .filter(f => f.rating <= 2 || f.cultural_concerns?.length || f.privacy_concerns?.length)
        .map(f => f.comments);
      
      // Calculate cultural compliance score
      const culturalConcerns = feedbackList.filter(f => f.cultural_concerns?.length).length;
      const culturalComplianceScore = Math.max(0, 100 - (culturalConcerns / feedbackList.length * 100));
      
      // Calculate accessibility score
      const accessibilityIssues = feedbackList.filter(f => f.accessibility_issues?.length).length;
      const accessibilityScore = Math.max(0, 100 - (accessibilityIssues / feedbackList.length * 100));
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(feedbackList);
      
      const analysis: FeedbackAnalysis = {
        session_id: sessionId,
        overall_satisfaction: overallSatisfaction,
        feature_ratings: featureRatings,
        common_themes: themeAnalysis.themes.map(t => t.theme),
        critical_issues: criticalIssues,
        improvement_priorities: await this.prioritizeImprovements(feedbackList),
        cultural_compliance_score: culturalComplianceScore,
        accessibility_score: accessibilityScore,
        recommendations: recommendations
      };
      
      // Store analysis
      const { data, error } = await supabase
        .from('feedback_analysis')
        .upsert({
          session_id: sessionId,
          analysis: analysis,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return analysis;
    } catch (error) {
      console.error('Error updating feedback analysis:', error);
      throw error;
    }
  }

  async generateRecommendations(feedbackList: PreviewFeedback[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze ratings by feature
    const lowRatedFeatures = feedbackList
      .filter(f => f.rating <= 2 && f.specific_feature)
      .map(f => f.specific_feature!);
    
    if (lowRatedFeatures.length > 0) {
      recommendations.push(`Prioritize improvements to: ${[...new Set(lowRatedFeatures)].join(', ')}`);
    }
    
    // Cultural concerns
    const culturalConcerns = feedbackList.flatMap(f => f.cultural_concerns || []);
    if (culturalConcerns.length > 0) {
      recommendations.push('Conduct additional cultural safety review with community elders');
    }
    
    // Accessibility issues
    const accessibilityIssues = feedbackList.flatMap(f => f.accessibility_issues || []);
    if (accessibilityIssues.length > 0) {
      recommendations.push('Address accessibility concerns before launch');
    }
    
    // Privacy concerns
    const privacyConcerns = feedbackList.flatMap(f => f.privacy_concerns || []);
    if (privacyConcerns.length > 0) {
      recommendations.push('Review and strengthen privacy protections');
    }
    
    return recommendations;
  }

  async prioritizeImprovements(feedbackList: PreviewFeedback[]): Promise<string[]> {
    const improvements: Array<{ suggestion: string; frequency: number; avgRating: number }> = [];
    
    // Collect all improvement suggestions
    feedbackList.forEach(feedback => {
      feedback.improvement_suggestions.forEach(suggestion => {
        const existing = improvements.find(i => i.suggestion === suggestion);
        if (existing) {
          existing.frequency++;
          existing.avgRating = (existing.avgRating + feedback.rating) / 2;
        } else {
          improvements.push({
            suggestion,
            frequency: 1,
            avgRating: feedback.rating
          });
        }
      });
    });
    
    // Sort by frequency and low rating (high priority)
    improvements.sort((a, b) => {
      const priorityA = a.frequency * (6 - a.avgRating); // Higher frequency + lower rating = higher priority
      const priorityB = b.frequency * (6 - b.avgRating);
      return priorityB - priorityA;
    });
    
    return improvements.slice(0, 10).map(i => i.suggestion);
  }

  async createFollowUpTask(feedbackId: string): Promise<void> {
    // Implementation would integrate with task management system
    console.log(`Creating follow-up task for feedback ${feedbackId}`);
  }

  async getPreviewSessions(communityId?: string): Promise<PreviewSession[]> {
    try {
      let query = supabase.from('preview_sessions').select('*');
      
      if (communityId) {
        query = query.eq('community_id', communityId);
      }
      
      const { data, error } = await query.order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting preview sessions:', error);
      throw error;
    }
  }

  async getSessionFeedback(sessionId: string): Promise<PreviewFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('preview_feedback')
        .select('*')
        .eq('session_id', sessionId)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting session feedback:', error);
      throw error;
    }
  }

  async getStakeholderFeedback(stakeholderType?: string): Promise<StakeholderFeedback[]> {
    try {
      let query = supabase.from('stakeholder_feedback').select('*');
      
      if (stakeholderType) {
        query = query.eq('stakeholder_type', stakeholderType);
      }
      
      const { data, error } = await query.order('submitted_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting stakeholder feedback:', error);
      throw error;
    }
  }

  async getFeedbackAnalysis(sessionId: string): Promise<FeedbackAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('feedback_analysis')
        .select('analysis')
        .eq('session_id', sessionId)
        .single();
      
      if (error) throw error;
      
      return data?.analysis || null;
    } catch (error) {
      console.error('Error getting feedback analysis:', error);
      return null;
    }
  }

  async implementFeedbackImprovements(sessionId: string, implementedChanges: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('feedback_implementation')
        .insert({
          session_id: sessionId,
          implemented_changes: implementedChanges,
          implementation_date: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update session status
      await supabase
        .from('preview_sessions')
        .update({
          status: 'completed',
          feedback_collected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
    } catch (error) {
      console.error('Error implementing feedback improvements:', error);
      throw error;
    }
  }

  async generateFeedbackReport(sessionId: string): Promise<any> {
    try {
      const session = await supabase
        .from('preview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      const feedback = await this.getSessionFeedback(sessionId);
      const analysis = await this.getFeedbackAnalysis(sessionId);
      
      return {
        session: session.data,
        feedback_summary: {
          total_participants: feedback.length,
          response_rate: (feedback.length / session.data.participant_count) * 100,
          average_satisfaction: analysis?.overall_satisfaction || 0,
          completion_date: new Date().toISOString()
        },
        detailed_analysis: analysis,
        raw_feedback: feedback,
        recommendations: analysis?.recommendations || []
      };
    } catch (error) {
      console.error('Error generating feedback report:', error);
      throw error;
    }
  }
}

export const communityPreviewService = new CommunityPreviewService();