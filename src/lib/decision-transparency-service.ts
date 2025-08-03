import { supabase } from './supabase';
import { culturalSafetyService } from './cultural-safety-service';

export interface GovernmentDecision {
  id: string;
  title: string;
  description: string;
  decisionType: 'policy' | 'budget' | 'program' | 'service' | 'infrastructure' | 'emergency';
  category: string;
  affectedCommunities: string[];
  decisionMakers: DecisionMaker[];
  consultationProcess: ConsultationProcess;
  culturalImpactAssessment: CulturalImpactAssessment;
  resourceAllocation: ResourceAllocation[];
  timeline: DecisionTimeline;
  status: 'draft' | 'consultation' | 'review' | 'approved' | 'implemented' | 'cancelled';
  publicationStatus: 'pending' | 'cultural_review' | 'approved' | 'published' | 'restricted';
  transparencyLevel: 'public' | 'community_restricted' | 'confidential';
  documents: DecisionDocument[];
  communityFeedback: CommunityFeedback[];
  implementationProgress: ImplementationProgress[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  implementedAt?: Date;
}

export interface DecisionMaker {
  id: string;
  name: string;
  role: string;
  organization: string;
  contactInfo?: string;
  culturalAffiliation?: string;
}

export interface ConsultationProcess {
  id: string;
  type: 'community_meeting' | 'survey' | 'focus_group' | 'elder_consultation' | 'online_forum';
  description: string;
  participants: number;
  duration: string;
  culturalProtocols: string[];
  outcomes: string[];
  feedback: string[];
  conductedAt: Date;
  facilitator: string;
}

export interface CulturalImpactAssessment {
  id: string;
  assessor: string;
  assessmentDate: Date;
  culturalSensitivity: 'low' | 'medium' | 'high' | 'critical';
  traditionalKnowledgeImpact: string;
  communityValuesAlignment: number; // 0-1 scale
  elderReviewRequired: boolean;
  elderReviewStatus?: 'pending' | 'approved' | 'requires_changes' | 'rejected';
  elderComments?: string;
  mitigationMeasures: string[];
  recommendations: string[];
  approvalStatus: 'pending' | 'approved' | 'conditional' | 'rejected';
}

export interface ResourceAllocation {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  source: string;
  recipient: string;
  timeline: string;
  conditions: string[];
  reportingRequirements: string[];
  culturalConsiderations: string[];
  status: 'allocated' | 'disbursed' | 'completed' | 'cancelled';
  disbursementDate?: Date;
  completionDate?: Date;
}

export interface DecisionTimeline {
  phases: TimelinePhase[];
  milestones: Milestone[];
  criticalDates: CriticalDate[];
}

export interface TimelinePhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed' | 'delayed' | 'cancelled';
  deliverables: string[];
  stakeholders: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'pending' | 'achieved' | 'missed' | 'cancelled';
  significance: 'low' | 'medium' | 'high' | 'critical';
}

export interface CriticalDate {
  id: string;
  event: string;
  date: Date;
  importance: string;
  culturalSignificance?: string;
}

export interface DecisionDocument {
  id: string;
  title: string;
  type: 'proposal' | 'assessment' | 'consultation_report' | 'decision_record' | 'implementation_plan';
  description: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  accessLevel: 'public' | 'community' | 'restricted' | 'confidential';
  culturalSensitivity: 'none' | 'low' | 'medium' | 'high';
  language: string;
  translationAvailable: string[];
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
}

export interface CommunityFeedback {
  id: string;
  communityId: string;
  communityName: string;
  feedbackType: 'support' | 'concern' | 'suggestion' | 'question' | 'objection';
  content: string;
  submittedBy: string;
  submissionMethod: 'online' | 'meeting' | 'survey' | 'letter' | 'phone';
  culturalContext?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'received' | 'reviewed' | 'responded' | 'incorporated' | 'rejected';
  response?: string;
  respondedBy?: string;
  submittedAt: Date;
  respondedAt?: Date;
}

export interface ImplementationProgress {
  id: string;
  phase: string;
  description: string;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  milestones: string[];
  challenges: string[];
  successes: string[];
  communityImpact: string;
  resourcesUsed: number;
  nextSteps: string[];
  reportedBy: string;
  reportedAt: Date;
}

export interface PolicyChange {
  id: string;
  policyName: string;
  changeType: 'new' | 'amendment' | 'repeal' | 'suspension';
  description: string;
  rationale: string;
  affectedCommunities: string[];
  effectiveDate: Date;
  transitionPeriod?: string;
  supportMeasures: string[];
  communicationPlan: CommunicationPlan;
  impactAssessment: PolicyImpactAssessment;
  status: 'proposed' | 'consultation' | 'approved' | 'implemented' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationPlan {
  channels: CommunicationChannel[];
  timeline: CommunicationTimeline[];
  targetAudiences: string[];
  keyMessages: string[];
  culturalAdaptations: string[];
  feedbackMechanisms: string[];
}

export interface CommunicationChannel {
  type: 'website' | 'newsletter' | 'social_media' | 'community_meeting' | 'radio' | 'print' | 'elder_network';
  description: string;
  reach: number;
  culturalAppropriate: boolean;
  language: string[];
  frequency: string;
}

export interface CommunicationTimeline {
  phase: string;
  date: Date;
  activities: string[];
  responsible: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
}

export interface PolicyImpactAssessment {
  economicImpact: string;
  socialImpact: string;
  culturalImpact: string;
  environmentalImpact: string;
  riskAssessment: string[];
  mitigationStrategies: string[];
  monitoringPlan: string[];
  successMetrics: string[];
}

export interface DecisionNotification {
  id: string;
  decisionId: string;
  recipientType: 'community' | 'stakeholder' | 'public' | 'media';
  recipients: string[];
  notificationType: 'announcement' | 'consultation_invite' | 'status_update' | 'implementation_update';
  title: string;
  message: string;
  culturallyAdapted: boolean;
  language: string;
  deliveryMethod: 'email' | 'sms' | 'postal' | 'in_person' | 'website' | 'social_media';
  sentAt: Date;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  readAt?: Date;
}

/**
 * Decision Transparency Service
 * Manages government decision publication, tracking, and community communication
 */
export class DecisionTransparencyService {
  private notificationQueue: DecisionNotification[] = [];

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the decision transparency service
   */
  private async initializeService(): Promise<void> {
    try {
      console.log('Decision transparency service initialized');
    } catch (error) {
      console.error('Error initializing decision transparency service:', error);
    }
  }

  /**
   * Create a new government decision
   */
  public async createDecision(
    decisionData: Partial<GovernmentDecision>,
    createdBy: string
  ): Promise<GovernmentDecision> {
    try {
      const decision: GovernmentDecision = {
        id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: decisionData.title || '',
        description: decisionData.description || '',
        decisionType: decisionData.decisionType || 'policy',
        category: decisionData.category || '',
        affectedCommunities: decisionData.affectedCommunities || [],
        decisionMakers: decisionData.decisionMakers || [],
        consultationProcess: decisionData.consultationProcess || this.createDefaultConsultationProcess(),
        culturalImpactAssessment: decisionData.culturalImpactAssessment || this.createDefaultCulturalAssessment(),
        resourceAllocation: decisionData.resourceAllocation || [],
        timeline: decisionData.timeline || this.createDefaultTimeline(),
        status: 'draft',
        publicationStatus: 'pending',
        transparencyLevel: decisionData.transparencyLevel || 'public',
        documents: [],
        communityFeedback: [],
        implementationProgress: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      const { error } = await supabase
        .from('government_decisions')
        .insert([{
          id: decision.id,
          title: decision.title,
          description: decision.description,
          decision_type: decision.decisionType,
          category: decision.category,
          affected_communities: decision.affectedCommunities,
          decision_makers: decision.decisionMakers,
          consultation_process: decision.consultationProcess,
          cultural_impact_assessment: decision.culturalImpactAssessment,
          resource_allocation: decision.resourceAllocation,
          timeline: decision.timeline,
          status: decision.status,
          publication_status: decision.publicationStatus,
          transparency_level: decision.transparencyLevel,
          documents: decision.documents,
          community_feedback: decision.communityFeedback,
          implementation_progress: decision.implementationProgress,
          created_at: decision.createdAt.toISOString(),
          updated_at: decision.updatedAt.toISOString(),
          created_by: createdBy
        }]);

      if (error) {
        throw error;
      }

      console.log(`Created decision: ${decision.title}`);
      return decision;
    } catch (error) {
      console.error('Error creating decision:', error);
      throw error;
    }
  }

  /**
   * Submit decision for cultural safety review
   */
  public async submitForCulturalReview(decisionId: string): Promise<void> {
    try {
      const decision = await this.getDecision(decisionId);
      if (!decision) {
        throw new Error('Decision not found');
      }

      // Update status to cultural review
      await this.updateDecisionStatus(decisionId, 'consultation', 'cultural_review');

      // Submit to cultural safety service for review
      const reviewRequest = {
        contentId: decisionId,
        contentType: 'government_decision',
        content: {
          title: decision.title,
          description: decision.description,
          culturalImpactAssessment: decision.culturalImpactAssessment
        },
        submittedBy: 'decision_transparency_system',
        priority: decision.culturalImpactAssessment.culturalSensitivity === 'critical' ? 'high' : 'medium'
      };

      await culturalSafetyService.submitForReview(reviewRequest);

      console.log(`Decision ${decisionId} submitted for cultural review`);
    } catch (error) {
      console.error('Error submitting decision for cultural review:', error);
      throw error;
    }
  }

  /**
   * Publish decision after approval
   */
  public async publishDecision(
    decisionId: string,
    publishedBy: string
  ): Promise<void> {
    try {
      const decision = await this.getDecision(decisionId);
      if (!decision) {
        throw new Error('Decision not found');
      }

      // Check if cultural review is complete
      if (decision.culturalImpactAssessment.elderReviewRequired && 
          decision.culturalImpactAssessment.elderReviewStatus !== 'approved') {
        throw new Error('Elder review required before publication');
      }

      // Update publication status
      const { error } = await supabase
        .from('government_decisions')
        .update({
          publication_status: 'published',
          published_at: new Date().toISOString(),
          published_by: publishedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', decisionId);

      if (error) {
        throw error;
      }

      // Send notifications to affected communities
      await this.notifyAffectedCommunities(decision, 'announcement');

      // Create public announcement
      await this.createPublicAnnouncement(decision);

      console.log(`Decision ${decisionId} published successfully`);
    } catch (error) {
      console.error('Error publishing decision:', error);
      throw error;
    }
  }

  /**
   * Track resource allocation
   */
  public async trackResourceAllocation(
    decisionId: string,
    allocationId: string,
    status: ResourceAllocation['status'],
    notes?: string
  ): Promise<void> {
    try {
      const decision = await this.getDecision(decisionId);
      if (!decision) {
        throw new Error('Decision not found');
      }

      // Find and update the allocation
      const allocation = decision.resourceAllocation.find(a => a.id === allocationId);
      if (!allocation) {
        throw new Error('Resource allocation not found');
      }

      allocation.status = status;
      if (status === 'disbursed') {
        allocation.disbursementDate = new Date();
      } else if (status === 'completed') {
        allocation.completionDate = new Date();
      }

      // Update in database
      const { error } = await supabase
        .from('government_decisions')
        .update({
          resource_allocation: decision.resourceAllocation,
          updated_at: new Date().toISOString()
        })
        .eq('id', decisionId);

      if (error) {
        throw error;
      }

      // Log the allocation change
      await this.logResourceAllocationChange(decisionId, allocationId, status, notes);

      // Notify communities if significant change
      if (status === 'disbursed' || status === 'completed') {
        await this.notifyResourceAllocationUpdate(decision, allocation);
      }

      console.log(`Resource allocation ${allocationId} updated to ${status}`);
    } catch (error) {
      console.error('Error tracking resource allocation:', error);
      throw error;
    }
  }

  /**
   * Add community feedback to decision
   */
  public async addCommunityFeedback(
    decisionId: string,
    feedback: Omit<CommunityFeedback, 'id' | 'submittedAt'>
  ): Promise<void> {
    try {
      const decision = await this.getDecision(decisionId);
      if (!decision) {
        throw new Error('Decision not found');
      }

      const newFeedback: CommunityFeedback = {
        ...feedback,
        id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date()
      };

      decision.communityFeedback.push(newFeedback);

      // Update in database
      const { error } = await supabase
        .from('government_decisions')
        .update({
          community_feedback: decision.communityFeedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', decisionId);

      if (error) {
        throw error;
      }

      // Notify decision makers of new feedback
      await this.notifyDecisionMakersOfFeedback(decision, newFeedback);

      console.log(`Community feedback added to decision ${decisionId}`);
    } catch (error) {
      console.error('Error adding community feedback:', error);
      throw error;
    }
  }

  /**
   * Update implementation progress
   */
  public async updateImplementationProgress(
    decisionId: string,
    progress: Omit<ImplementationProgress, 'id' | 'reportedAt'>
  ): Promise<void> {
    try {
      const decision = await this.getDecision(decisionId);
      if (!decision) {
        throw new Error('Decision not found');
      }

      const newProgress: ImplementationProgress = {
        ...progress,
        id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reportedAt: new Date()
      };

      decision.implementationProgress.push(newProgress);

      // Update decision status if fully implemented
      if (newProgress.progressPercentage >= 100 && newProgress.status === 'completed') {
        decision.status = 'implemented';
        decision.implementedAt = new Date();
      }

      // Update in database
      const { error } = await supabase
        .from('government_decisions')
        .update({
          implementation_progress: decision.implementationProgress,
          status: decision.status,
          implemented_at: decision.implementedAt?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', decisionId);

      if (error) {
        throw error;
      }

      // Notify communities of progress update
      await this.notifyImplementationProgress(decision, newProgress);

      console.log(`Implementation progress updated for decision ${decisionId}`);
    } catch (error) {
      console.error('Error updating implementation progress:', error);
      throw error;
    }
  }

  /**
   * Create policy change communication
   */
  public async createPolicyChange(
    policyData: Omit<PolicyChange, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PolicyChange> {
    try {
      const policyChange: PolicyChange = {
        ...policyData,
        id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      const { error } = await supabase
        .from('policy_changes')
        .insert([{
          id: policyChange.id,
          policy_name: policyChange.policyName,
          change_type: policyChange.changeType,
          description: policyChange.description,
          rationale: policyChange.rationale,
          affected_communities: policyChange.affectedCommunities,
          effective_date: policyChange.effectiveDate.toISOString(),
          transition_period: policyChange.transitionPeriod,
          support_measures: policyChange.supportMeasures,
          communication_plan: policyChange.communicationPlan,
          impact_assessment: policyChange.impactAssessment,
          status: policyChange.status,
          created_at: policyChange.createdAt.toISOString(),
          updated_at: policyChange.updatedAt.toISOString()
        }]);

      if (error) {
        throw error;
      }

      // Execute communication plan
      await this.executeCommunicationPlan(policyChange);

      console.log(`Policy change created: ${policyChange.policyName}`);
      return policyChange;
    } catch (error) {
      console.error('Error creating policy change:', error);
      throw error;
    }
  }

  /**
   * Get decision by ID
   */
  public async getDecision(decisionId: string): Promise<GovernmentDecision | null> {
    try {
      const { data, error } = await supabase
        .from('government_decisions')
        .select('*')
        .eq('id', decisionId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapDatabaseToDecision(data);
    } catch (error) {
      console.error('Error getting decision:', error);
      return null;
    }
  }

  /**
   * Get decisions by community
   */
  public async getDecisionsByCommunity(
    communityId: string,
    status?: GovernmentDecision['status']
  ): Promise<GovernmentDecision[]> {
    try {
      let query = supabase
        .from('government_decisions')
        .select('*')
        .contains('affected_communities', [communityId])
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToDecision) || [];
    } catch (error) {
      console.error('Error getting decisions by community:', error);
      return [];
    }
  }

  /**
   * Get public decisions
   */
  public async getPublicDecisions(
    limit: number = 50,
    offset: number = 0
  ): Promise<GovernmentDecision[]> {
    try {
      const { data, error } = await supabase
        .from('government_decisions')
        .select('*')
        .eq('transparency_level', 'public')
        .eq('publication_status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToDecision) || [];
    } catch (error) {
      console.error('Error getting public decisions:', error);
      return [];
    }
  }

  /**
   * Search decisions
   */
  public async searchDecisions(
    query: string,
    filters?: {
      decisionType?: string;
      status?: string;
      communityId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<GovernmentDecision[]> {
    try {
      let dbQuery = supabase
        .from('government_decisions')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      if (filters?.decisionType) {
        dbQuery = dbQuery.eq('decision_type', filters.decisionType);
      }

      if (filters?.status) {
        dbQuery = dbQuery.eq('status', filters.status);
      }

      if (filters?.communityId) {
        dbQuery = dbQuery.contains('affected_communities', [filters.communityId]);
      }

      if (filters?.dateFrom) {
        dbQuery = dbQuery.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        dbQuery = dbQuery.lte('created_at', filters.dateTo.toISOString());
      }

      dbQuery = dbQuery.order('created_at', { ascending: false });

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToDecision) || [];
    } catch (error) {
      console.error('Error searching decisions:', error);
      return [];
    }
  }

  // Helper methods
  private createDefaultConsultationProcess(): ConsultationProcess {
    return {
      id: `consultation-${Date.now()}`,
      type: 'community_meeting',
      description: 'Community consultation to be scheduled',
      participants: 0,
      duration: 'TBD',
      culturalProtocols: ['Elder consultation', 'Traditional meeting format'],
      outcomes: [],
      feedback: [],
      conductedAt: new Date(),
      facilitator: 'TBD'
    };
  }

  private createDefaultCulturalAssessment(): CulturalImpactAssessment {
    return {
      id: `assessment-${Date.now()}`,
      assessor: 'TBD',
      assessmentDate: new Date(),
      culturalSensitivity: 'medium',
      traditionalKnowledgeImpact: 'To be assessed',
      communityValuesAlignment: 0.5,
      elderReviewRequired: true,
      mitigationMeasures: [],
      recommendations: [],
      approvalStatus: 'pending'
    };
  }

  private createDefaultTimeline(): DecisionTimeline {
    return {
      phases: [],
      milestones: [],
      criticalDates: []
    };
  }

  private async updateDecisionStatus(
    decisionId: string,
    status: GovernmentDecision['status'],
    publicationStatus?: GovernmentDecision['publicationStatus']
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (publicationStatus) {
      updateData.publication_status = publicationStatus;
    }

    const { error } = await supabase
      .from('government_decisions')
      .update(updateData)
      .eq('id', decisionId);

    if (error) {
      throw error;
    }
  }

  private async notifyAffectedCommunities(
    decision: GovernmentDecision,
    type: DecisionNotification['notificationType']
  ): Promise<void> {
    for (const communityId of decision.affectedCommunities) {
      const notification: DecisionNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        decisionId: decision.id,
        recipientType: 'community',
        recipients: [communityId],
        notificationType: type,
        title: `Decision Update: ${decision.title}`,
        message: `A government decision affecting your community has been ${type === 'announcement' ? 'published' : 'updated'}.`,
        culturallyAdapted: true,
        language: 'en', // Would be determined by community preference
        deliveryMethod: 'email',
        sentAt: new Date(),
        deliveryStatus: 'pending'
      };

      this.notificationQueue.push(notification);
    }

    await this.processNotificationQueue();
  }

  private async createPublicAnnouncement(decision: GovernmentDecision): Promise<void> {
    // Create public announcement record
    const { error } = await supabase
      .from('public_announcements')
      .insert([{
        id: `announcement-${decision.id}`,
        decision_id: decision.id,
        title: decision.title,
        summary: decision.description,
        announcement_type: 'decision_publication',
        target_audience: 'public',
        publication_date: new Date().toISOString(),
        status: 'published'
      }]);

    if (error) {
      console.error('Error creating public announcement:', error);
    }
  }

  private async logResourceAllocationChange(
    decisionId: string,
    allocationId: string,
    status: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('resource_allocation_log')
      .insert([{
        decision_id: decisionId,
        allocation_id: allocationId,
        status_change: status,
        notes: notes,
        logged_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error logging resource allocation change:', error);
    }
  }

  private async notifyResourceAllocationUpdate(
    decision: GovernmentDecision,
    allocation: ResourceAllocation
  ): Promise<void> {
    // Notify affected communities about resource allocation updates
    for (const communityId of decision.affectedCommunities) {
      const notification: DecisionNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        decisionId: decision.id,
        recipientType: 'community',
        recipients: [communityId],
        notificationType: 'implementation_update',
        title: `Resource Update: ${decision.title}`,
        message: `Resources for ${allocation.description} have been ${allocation.status}.`,
        culturallyAdapted: true,
        language: 'en',
        deliveryMethod: 'email',
        sentAt: new Date(),
        deliveryStatus: 'pending'
      };

      this.notificationQueue.push(notification);
    }

    await this.processNotificationQueue();
  }

  private async notifyDecisionMakersOfFeedback(
    decision: GovernmentDecision,
    feedback: CommunityFeedback
  ): Promise<void> {
    // Notify decision makers of new community feedback
    for (const decisionMaker of decision.decisionMakers) {
      const notification: DecisionNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        decisionId: decision.id,
        recipientType: 'stakeholder',
        recipients: [decisionMaker.id],
        notificationType: 'status_update',
        title: `New Feedback: ${decision.title}`,
        message: `New ${feedback.feedbackType} received from ${feedback.communityName}.`,
        culturallyAdapted: false,
        language: 'en',
        deliveryMethod: 'email',
        sentAt: new Date(),
        deliveryStatus: 'pending'
      };

      this.notificationQueue.push(notification);
    }

    await this.processNotificationQueue();
  }

  private async notifyImplementationProgress(
    decision: GovernmentDecision,
    progress: ImplementationProgress
  ): Promise<void> {
    // Notify communities of implementation progress
    for (const communityId of decision.affectedCommunities) {
      const notification: DecisionNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        decisionId: decision.id,
        recipientType: 'community',
        recipients: [communityId],
        notificationType: 'implementation_update',
        title: `Progress Update: ${decision.title}`,
        message: `Implementation is ${progress.progressPercentage}% complete. ${progress.description}`,
        culturallyAdapted: true,
        language: 'en',
        deliveryMethod: 'email',
        sentAt: new Date(),
        deliveryStatus: 'pending'
      };

      this.notificationQueue.push(notification);
    }

    await this.processNotificationQueue();
  }

  private async executeCommunicationPlan(policyChange: PolicyChange): Promise<void> {
    // Execute the communication plan for policy changes
    for (const timeline of policyChange.communicationPlan.timeline) {
      if (timeline.date <= new Date()) {
        // Execute immediate communications
        for (const activity of timeline.activities) {
          console.log(`Executing communication activity: ${activity}`);
          // Implementation would depend on the specific activity
        }
      }
    }
  }

  private async processNotificationQueue(): Promise<void> {
    // Process queued notifications
    for (const notification of this.notificationQueue) {
      try {
        // Save notification to database
        const { error } = await supabase
          .from('decision_notifications')
          .insert([{
            id: notification.id,
            decision_id: notification.decisionId,
            recipient_type: notification.recipientType,
            recipients: notification.recipients,
            notification_type: notification.notificationType,
            title: notification.title,
            message: notification.message,
            culturally_adapted: notification.culturallyAdapted,
            language: notification.language,
            delivery_method: notification.deliveryMethod,
            sent_at: notification.sentAt.toISOString(),
            delivery_status: notification.deliveryStatus
          }]);

        if (error) {
          console.error('Error saving notification:', error);
        } else {
          notification.deliveryStatus = 'sent';
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    }

    // Clear processed notifications
    this.notificationQueue = [];
  }

  private mapDatabaseToDecision(data: any): GovernmentDecision {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      decisionType: data.decision_type,
      category: data.category,
      affectedCommunities: data.affected_communities || [],
      decisionMakers: data.decision_makers || [],
      consultationProcess: data.consultation_process,
      culturalImpactAssessment: data.cultural_impact_assessment,
      resourceAllocation: data.resource_allocation || [],
      timeline: data.timeline,
      status: data.status,
      publicationStatus: data.publication_status,
      transparencyLevel: data.transparency_level,
      documents: data.documents || [],
      communityFeedback: data.community_feedback || [],
      implementationProgress: data.implementation_progress || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      implementedAt: data.implemented_at ? new Date(data.implemented_at) : undefined
    };
  }
}

// Export singleton instance
export const decisionTransparencyService = new DecisionTransparencyService();