import { supabase } from './supabase';
import { analyzeCommunityIntelligence } from './ai-service';

export interface CulturalSafetyLevel {
  level: 'public' | 'community' | 'restricted' | 'sacred';
  description: string;
  accessRules: string[];
  reviewRequired: boolean;
  elderApprovalRequired: boolean;
}

export interface ContentReview {
  id: string;
  contentId: string;
  contentType: 'document' | 'story' | 'insight' | 'comment';
  reviewType: 'automatic' | 'community' | 'elder' | 'authority';
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  culturalSafetyLevel: string;
  reviewNotes: string;
  reviewedBy: string;
  reviewedAt: Date;
  escalationRequired: boolean;
}

export interface ElderReview {
  id: string;
  contentId: string;
  elderName: string;
  elderRole: string;
  reviewDecision: 'approve' | 'reject' | 'modify' | 'escalate';
  culturalConcerns: string[];
  recommendations: string[];
  protocolViolations: string[];
  reviewDate: Date;
}

export interface CulturalProtocol {
  id: string;
  protocolName: string;
  protocolType: 'content' | 'access' | 'sharing' | 'ceremony' | 'knowledge';
  description: string;
  applicableContent: string[];
  restrictions: string[];
  requiredApprovals: string[];
  consequences: string[];
  isActive: boolean;
}

export interface ModerationQueue {
  id: string;
  contentId: string;
  contentType: string;
  submittedBy: string;
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  culturalFlags: string[];
  automaticFlags: string[];
  assignedModerator: string;
  estimatedReviewTime: number; // hours
  status: 'queued' | 'in_review' | 'completed';
}

/**
 * Cultural Safety Levels with their definitions and requirements
 */
export const CULTURAL_SAFETY_LEVELS: Record<string, CulturalSafetyLevel> = {
  public: {
    level: 'public',
    description: 'Content safe for general public viewing with no cultural restrictions',
    accessRules: ['Available to all users', 'No special permissions required'],
    reviewRequired: false,
    elderApprovalRequired: false
  },
  community: {
    level: 'community',
    description: 'Content appropriate for community members with basic cultural context',
    accessRules: ['Available to registered community members', 'Cultural context provided'],
    reviewRequired: true,
    elderApprovalRequired: false
  },
  restricted: {
    level: 'restricted',
    description: 'Culturally sensitive content requiring special permissions and context',
    accessRules: ['Requires specific permissions', 'Cultural authority approval needed', 'Limited sharing'],
    reviewRequired: true,
    elderApprovalRequired: true
  },
  sacred: {
    level: 'sacred',
    description: 'Sacred or highly sensitive cultural content with strict access controls',
    accessRules: ['Elder approval required', 'Ceremony or protocol specific', 'No sharing without permission'],
    reviewRequired: true,
    elderApprovalRequired: true
  }
};

/**
 * Analyze content for cultural safety and assign appropriate level
 */
export async function analyzeCulturalSafety(
  content: string,
  contentType: string,
  communityContext?: string
): Promise<{
  safetyLevel: string;
  confidence: number;
  flags: string[];
  recommendations: string[];
}> {
  try {
    // Use AI to analyze cultural sensitivity
    const analysis = await analyzeCommunityIntelligence(
      content,
      `Cultural safety analysis for ${contentType}`,
      communityContext
    );

    // Define cultural sensitivity keywords and patterns
    const culturalKeywords = {
      sacred: ['sacred', 'ceremony', 'ritual', 'traditional law', 'secret', 'men only', 'women only', 'initiation'],
      restricted: ['cultural protocol', 'traditional knowledge', 'elder', 'ancestor', 'spiritual', 'cultural practice'],
      community: ['community story', 'local knowledge', 'cultural context', 'traditional', 'cultural'],
      sensitive: ['sorry business', 'deceased', 'funeral', 'mourning', 'grief', 'loss']
    };

    const flags = [];
    let safetyLevel = 'public';
    let confidence = 0.7;

    const lowerContent = content.toLowerCase();

    // Check for sacred content indicators
    if (culturalKeywords.sacred.some(keyword => lowerContent.includes(keyword))) {
      safetyLevel = 'sacred';
      confidence = 0.9;
      flags.push('Contains sacred or ceremonial content');
    }
    // Check for restricted content indicators
    else if (culturalKeywords.restricted.some(keyword => lowerContent.includes(keyword))) {
      safetyLevel = 'restricted';
      confidence = 0.8;
      flags.push('Contains traditional knowledge or cultural protocols');
    }
    // Check for community-level content
    else if (culturalKeywords.community.some(keyword => lowerContent.includes(keyword))) {
      safetyLevel = 'community';
      confidence = 0.7;
      flags.push('Contains community-specific cultural content');
    }

    // Check for sensitive content that needs special handling
    if (culturalKeywords.sensitive.some(keyword => lowerContent.includes(keyword))) {
      flags.push('Contains culturally sensitive content requiring careful handling');
      if (safetyLevel === 'public') {
        safetyLevel = 'community';
      }
    }

    // Generate recommendations based on analysis
    const recommendations = generateCulturalRecommendations(safetyLevel, flags, contentType);

    return {
      safetyLevel,
      confidence,
      flags,
      recommendations
    };
  } catch (error) {
    console.error('Error analyzing cultural safety:', error);
    // Default to restricted level for safety
    return {
      safetyLevel: 'restricted',
      confidence: 0.5,
      flags: ['Analysis failed - defaulting to restricted access'],
      recommendations: ['Manual review required due to analysis failure']
    };
  }
}

function generateCulturalRecommendations(
  safetyLevel: string,
  flags: string[],
  contentType: string
): string[] {
  const recommendations = [];

  switch (safetyLevel) {
    case 'sacred':
      recommendations.push('Requires elder approval before any sharing or publication');
      recommendations.push('Must follow traditional protocols for sacred content');
      recommendations.push('Consider if this content should be shared at all');
      break;
    case 'restricted':
      recommendations.push('Requires cultural authority review');
      recommendations.push('Provide appropriate cultural context when sharing');
      recommendations.push('Limit access to authorized community members');
      break;
    case 'community':
      recommendations.push('Include cultural context and background information');
      recommendations.push('Ensure community members can provide feedback');
      recommendations.push('Consider cultural protocols for sharing');
      break;
    case 'public':
      recommendations.push('Content appears culturally safe for public sharing');
      recommendations.push('Monitor for community feedback on cultural appropriateness');
      break;
  }

  // Content type specific recommendations
  if (contentType === 'story') {
    recommendations.push('Ensure storyteller has given appropriate permissions');
    recommendations.push('Consider traditional storytelling protocols');
  } else if (contentType === 'document') {
    recommendations.push('Review document for cultural references and context');
  }

  return recommendations;
}

/**
 * Submit content for cultural safety review
 */
export async function submitForCulturalReview(
  contentId: string,
  contentType: string,
  content: string,
  submittedBy: string,
  communityContext?: string
): Promise<string> {
  try {
    // Analyze cultural safety first
    const safetyAnalysis = await analyzeCulturalSafety(content, contentType, communityContext);

    // Create moderation queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from('cultural_moderation_queue')
      .insert([{
        content_id: contentId,
        content_type: contentType,
        submitted_by: submittedBy,
        priority: safetyAnalysis.safetyLevel === 'sacred' ? 'urgent' : 
                 safetyAnalysis.safetyLevel === 'restricted' ? 'high' : 'medium',
        cultural_flags: safetyAnalysis.flags,
        automatic_flags: [`Safety level: ${safetyAnalysis.safetyLevel}`, `Confidence: ${safetyAnalysis.confidence}`],
        estimated_review_time: getEstimatedReviewTime(safetyAnalysis.safetyLevel),
        status: 'queued'
      }])
      .select('id')
      .single();

    if (queueError) {
      throw new Error(`Failed to queue for review: ${queueError.message}`);
    }

    // Create initial content review record
    const { error: reviewError } = await supabase
      .from('cultural_content_reviews')
      .insert([{
        content_id: contentId,
        content_type: contentType,
        review_type: 'automatic',
        status: 'pending',
        cultural_safety_level: safetyAnalysis.safetyLevel,
        review_notes: `Automatic analysis: ${safetyAnalysis.flags.join(', ')}`,
        escalation_required: safetyAnalysis.safetyLevel === 'sacred' || safetyAnalysis.safetyLevel === 'restricted'
      }]);

    if (reviewError) {
      console.error('Failed to create review record:', reviewError);
    }

    return queueEntry.id;
  } catch (error) {
    console.error('Error submitting for cultural review:', error);
    throw error;
  }
}

function getEstimatedReviewTime(safetyLevel: string): number {
  switch (safetyLevel) {
    case 'sacred': return 72; // 3 days for elder consultation
    case 'restricted': return 24; // 1 day for cultural authority review
    case 'community': return 8; // 8 hours for community moderation
    case 'public': return 2; // 2 hours for basic review
    default: return 24;
  }
}

/**
 * Get pending reviews for a moderator
 */
export async function getPendingReviews(
  moderatorId: string,
  reviewType?: string
): Promise<ModerationQueue[]> {
  try {
    let query = supabase
      .from('cultural_moderation_queue')
      .select(`
        id,
        content_id,
        content_type,
        submitted_by,
        submitted_at,
        priority,
        cultural_flags,
        automatic_flags,
        assigned_moderator,
        estimated_review_time,
        status
      `)
      .in('status', ['queued', 'in_review'])
      .order('priority', { ascending: false })
      .order('submitted_at', { ascending: true });

    if (reviewType) {
      // Filter by review type if specified
      query = query.eq('review_type', reviewType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch pending reviews: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      contentId: item.content_id,
      contentType: item.content_type,
      submittedBy: item.submitted_by,
      submittedAt: new Date(item.submitted_at),
      priority: item.priority,
      culturalFlags: item.cultural_flags || [],
      automaticFlags: item.automatic_flags || [],
      assignedModerator: item.assigned_moderator,
      estimatedReviewTime: item.estimated_review_time,
      status: item.status
    })) || [];
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    throw error;
  }
}

/**
 * Complete a cultural safety review
 */
export async function completeCulturalReview(
  reviewId: string,
  decision: 'approve' | 'reject' | 'needs_revision',
  reviewNotes: string,
  reviewedBy: string,
  culturalSafetyLevel?: string
): Promise<void> {
  try {
    // Update the review record
    const { error: reviewError } = await supabase
      .from('cultural_content_reviews')
      .update({
        status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'needs_revision',
        review_notes: reviewNotes,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        cultural_safety_level: culturalSafetyLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (reviewError) {
      throw new Error(`Failed to update review: ${reviewError.message}`);
    }

    // Update moderation queue status
    const { error: queueError } = await supabase
      .from('cultural_moderation_queue')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (queueError) {
      console.error('Failed to update queue status:', queueError);
    }

    // If approved, update the content's cultural safety level
    if (decision === 'approve' && culturalSafetyLevel) {
      await updateContentCulturalSafety(reviewId, culturalSafetyLevel);
    }
  } catch (error) {
    console.error('Error completing cultural review:', error);
    throw error;
  }
}

/**
 * Submit content for elder review
 */
export async function submitForElderReview(
  contentId: string,
  contentType: string,
  elderIds: string[],
  culturalConcerns: string[],
  urgency: 'low' | 'medium' | 'high' = 'medium'
): Promise<string[]> {
  try {
    const reviewIds = [];

    for (const elderId of elderIds) {
      const { data: review, error } = await supabase
        .from('elder_reviews')
        .insert([{
          content_id: contentId,
          content_type: contentType,
          elder_id: elderId,
          cultural_concerns: culturalConcerns,
          urgency: urgency,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) {
        console.error(`Failed to submit to elder ${elderId}:`, error);
        continue;
      }

      reviewIds.push(review.id);
    }

    return reviewIds;
  } catch (error) {
    console.error('Error submitting for elder review:', error);
    throw error;
  }
}

/**
 * Get cultural protocols for content type
 */
export async function getCulturalProtocols(
  contentType: string,
  communityId?: string
): Promise<CulturalProtocol[]> {
  try {
    let query = supabase
      .from('cultural_protocols')
      .select('*')
      .eq('is_active', true)
      .contains('applicable_content', [contentType]);

    if (communityId) {
      query = query.or(`community_id.eq.${communityId},community_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch cultural protocols: ${error.message}`);
    }

    return data?.map(protocol => ({
      id: protocol.id,
      protocolName: protocol.protocol_name,
      protocolType: protocol.protocol_type,
      description: protocol.description,
      applicableContent: protocol.applicable_content || [],
      restrictions: protocol.restrictions || [],
      requiredApprovals: protocol.required_approvals || [],
      consequences: protocol.consequences || [],
      isActive: protocol.is_active
    })) || [];
  } catch (error) {
    console.error('Error fetching cultural protocols:', error);
    return [];
  }
}

/**
 * Check if content violates cultural protocols
 */
export async function checkProtocolCompliance(
  content: string,
  contentType: string,
  communityId?: string
): Promise<{
  compliant: boolean;
  violations: string[];
  requiredActions: string[];
}> {
  try {
    const protocols = await getCulturalProtocols(contentType, communityId);
    const violations = [];
    const requiredActions = [];

    // Simple keyword-based protocol checking
    // In a real implementation, this would be more sophisticated
    const lowerContent = content.toLowerCase();

    for (const protocol of protocols) {
      // Check for restriction violations
      for (const restriction of protocol.restrictions) {
        if (lowerContent.includes(restriction.toLowerCase())) {
          violations.push(`Violates ${protocol.protocolName}: ${restriction}`);
          requiredActions.push(...protocol.requiredApprovals);
        }
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      requiredActions: [...new Set(requiredActions)] // Remove duplicates
    };
  } catch (error) {
    console.error('Error checking protocol compliance:', error);
    return {
      compliant: false,
      violations: ['Error checking compliance - manual review required'],
      requiredActions: ['Manual protocol review']
    };
  }
}

/**
 * Update content's cultural safety level
 */
async function updateContentCulturalSafety(
  contentId: string,
  safetyLevel: string
): Promise<void> {
  try {
    // This would update the appropriate content table based on content type
    // For now, we'll update a generic content_safety table
    const { error } = await supabase
      .from('content_cultural_safety')
      .upsert({
        content_id: contentId,
        safety_level: safetyLevel,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to update content safety level:', error);
    }
  } catch (error) {
    console.error('Error updating content cultural safety:', error);
  }
}

/**
 * Get cultural safety statistics
 */
export async function getCulturalSafetyStats(
  timeRange: { start: Date; end: Date },
  communityId?: string
): Promise<{
  totalReviews: number;
  reviewsByLevel: Record<string, number>;
  reviewsByStatus: Record<string, number>;
  averageReviewTime: number;
  elderReviews: number;
  protocolViolations: number;
}> {
  try {
    let query = supabase
      .from('cultural_content_reviews')
      .select('*')
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data: reviews, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch review stats: ${error.message}`);
    }

    const stats = {
      totalReviews: reviews?.length || 0,
      reviewsByLevel: {},
      reviewsByStatus: {},
      averageReviewTime: 0,
      elderReviews: 0,
      protocolViolations: 0
    };

    if (reviews && reviews.length > 0) {
      // Calculate stats
      stats.reviewsByLevel = reviews.reduce((acc, review) => {
        acc[review.cultural_safety_level] = (acc[review.cultural_safety_level] || 0) + 1;
        return acc;
      }, {});

      stats.reviewsByStatus = reviews.reduce((acc, review) => {
        acc[review.status] = (acc[review.status] || 0) + 1;
        return acc;
      }, {});

      stats.elderReviews = reviews.filter(r => r.review_type === 'elder').length;
      stats.protocolViolations = reviews.filter(r => r.escalation_required).length;

      // Calculate average review time for completed reviews
      const completedReviews = reviews.filter(r => r.reviewed_at);
      if (completedReviews.length > 0) {
        const totalTime = completedReviews.reduce((sum, review) => {
          const created = new Date(review.created_at);
          const reviewed = new Date(review.reviewed_at);
          return sum + (reviewed.getTime() - created.getTime());
        }, 0);
        stats.averageReviewTime = Math.round(totalTime / completedReviews.length / (1000 * 60 * 60)); // Convert to hours
      }
    }

    return stats;
  } catch (error) {
    console.error('Error fetching cultural safety stats:', error);
    return {
      totalReviews: 0,
      reviewsByLevel: {},
      reviewsByStatus: {},
      averageReviewTime: 0,
      elderReviews: 0,
      protocolViolations: 0
    };
  }
}