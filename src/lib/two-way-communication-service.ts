import { supabase } from './supabase';
import { analyzeCulturalSafety, submitForCulturalReview } from './cultural-safety-service';

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'feedback_portal' | 'meeting_summary' | 'consultation' | 'working_group' | 'community_forum' | 'direct_message';
  description: string;
  isActive: boolean;
  moderators: string[];
  participants: string[];
  culturalProtocols: string[];
  accessLevel: 'public' | 'community' | 'restricted' | 'private';
  languages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityFeedback {
  id: string;
  channelId: string;
  submittedBy: string;
  submitterName: string;
  submitterRole: 'community_member' | 'elder' | 'leader' | 'organization' | 'government';
  communityId: string;
  communityName: string;
  feedbackType: 'suggestion' | 'concern' | 'complaint' | 'question' | 'compliment' | 'request';
  category: 'healthcare' | 'education' | 'housing' | 'employment' | 'culture' | 'environment' | 'governance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  content: string;
  attachments: FeedbackAttachment[];
  culturalContext?: string;
  traditionalKnowledgeInvolved: boolean;
  elderConsultationRequired: boolean;
  routingInfo: FeedbackRouting;
  status: 'received' | 'routed' | 'assigned' | 'in_progress' | 'responded' | 'resolved' | 'escalated';
  responses: FeedbackResponse[];
  followUpActions: FollowUpAction[];
  submittedAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface FeedbackAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  culturalSensitivity: 'none' | 'low' | 'medium' | 'high';
  uploadedAt: Date;
}

export interface FeedbackRouting {
  routedTo: string; // Working group or department ID
  routedToName: string;
  routingReason: string;
  routedBy: string;
  routedAt: Date;
  estimatedResponseTime: number; // in hours
  actualResponseTime?: number;
}

export interface FeedbackResponse {
  id: string;
  respondedBy: string;
  responderName: string;
  responderRole: string;
  responseType: 'acknowledgment' | 'information' | 'action_plan' | 'resolution' | 'referral';
  content: string;
  actionsTaken: string[];
  nextSteps: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  culturallyReviewed: boolean;
  respondedAt: Date;
}

export interface FollowUpAction {
  id: string;
  action: string;
  assignedTo: string;
  assignedToName: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
  completedAt?: Date;
}

export interface WorkingGroup {
  id: string;
  name: string;
  description: string;
  mandate: string;
  members: WorkingGroupMember[];
  chair: string;
  secretary: string;
  meetingSchedule: string;
  responsibilityAreas: string[];
  culturalAdvisors: string[];
  contactInfo: ContactInfo;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingGroupMember {
  id: string;
  name: string;
  role: string;
  organization: string;
  expertise: string[];
  culturalAffiliation?: string;
  contactInfo: ContactInfo;
  joinedAt: Date;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  preferredMethod: 'email' | 'phone' | 'in_person' | 'mail';
}

export interface MeetingSummary {
  id: string;
  workingGroupId: string;
  workingGroupName: string;
  meetingType: 'regular' | 'special' | 'emergency' | 'consultation' | 'public';
  title: string;
  date: Date;
  duration: number; // in minutes
  location: string;
  facilitator: string;
  attendees: MeetingAttendee[];
  agenda: AgendaItem[];
  discussions: DiscussionPoint[];
  decisions: MeetingDecision[];
  actionItems: ActionItem[];
  nextMeeting?: Date;
  culturalProtocols: string[];
  publicationStatus: 'draft' | 'review' | 'approved' | 'published' | 'restricted';
  accessLevel: 'public' | 'community' | 'members_only' | 'confidential';
  summary: string;
  keyOutcomes: string[];
  communityImpact: string;
  followUpRequired: boolean;
  createdBy: string;
  createdAt: Date;
  publishedAt?: Date;
}

export interface MeetingAttendee {
  id: string;
  name: string;
  role: string;
  organization: string;
  attendanceType: 'in_person' | 'virtual' | 'phone';
  culturalRole?: string;
}

export interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description: string;
  presenter: string;
  timeAllocated: number; // in minutes
  type: 'presentation' | 'discussion' | 'decision' | 'information' | 'cultural_protocol';
  documents: string[];
}

export interface DiscussionPoint {
  id: string;
  agendaItemId: string;
  topic: string;
  keyPoints: string[];
  concerns: string[];
  suggestions: string[];
  culturalPerspectives: string[];
  consensus?: string;
}

export interface MeetingDecision {
  id: string;
  agendaItemId: string;
  decision: string;
  rationale: string;
  votingResults?: VotingResults;
  culturalConsiderations: string[];
  implementationPlan: string;
  responsibleParty: string;
  deadline?: Date;
  followUpRequired: boolean;
}

export interface VotingResults {
  totalVotes: number;
  inFavor: number;
  against: number;
  abstained: number;
  consensus: boolean;
  culturalConsensus: boolean;
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dependencies: string[];
  resources: string[];
  culturalProtocols: string[];
  progress: number; // 0-100
  notes?: string;
  completedAt?: Date;
}

export interface ConsultationSession {
  id: string;
  title: string;
  description: string;
  type: 'public_consultation' | 'community_meeting' | 'focus_group' | 'survey' | 'workshop' | 'elder_circle';
  topic: string;
  organizer: string;
  facilitators: string[];
  targetAudience: string[];
  scheduledDate: Date;
  duration: number; // in minutes
  location: string;
  maxParticipants?: number;
  registrationRequired: boolean;
  culturalProtocols: string[];
  materials: ConsultationMaterial[];
  participants: ConsultationParticipant[];
  outcomes: ConsultationOutcome[];
  feedback: ConsultationFeedback[];
  followUpPlan: string;
  status: 'planned' | 'open_registration' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  publicationLevel: 'public' | 'community' | 'restricted';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationMaterial {
  id: string;
  title: string;
  type: 'document' | 'presentation' | 'video' | 'audio' | 'infographic';
  description: string;
  filePath: string;
  language: string;
  culturallyAdapted: boolean;
  accessLevel: 'public' | 'participants_only' | 'restricted';
  uploadedAt: Date;
}

export interface ConsultationParticipant {
  id: string;
  name: string;
  role: string;
  organization?: string;
  communityAffiliation: string;
  culturalRole?: string;
  registeredAt: Date;
  attended: boolean;
  contributionLevel: 'observer' | 'participant' | 'presenter' | 'facilitator';
}

export interface ConsultationOutcome {
  id: string;
  category: string;
  outcome: string;
  supportLevel: 'strong_support' | 'support' | 'neutral' | 'concern' | 'strong_concern';
  participantCount: number;
  culturalPerspective: string;
  recommendations: string[];
  nextSteps: string[];
}

export interface ConsultationFeedback {
  id: string;
  participantId: string;
  feedbackType: 'process' | 'content' | 'outcome' | 'suggestion';
  rating: number; // 1-5
  comments: string;
  culturalAppropriate: boolean;
  improvements: string[];
  submittedAt: Date;
}

export interface CommunicationMetrics {
  totalFeedback: number;
  responseRate: number;
  averageResponseTime: number;
  satisfactionScore: number;
  channelUsage: { [channelId: string]: number };
  workingGroupPerformance: { [groupId: string]: WorkingGroupMetrics };
  consultationEngagement: ConsultationMetrics;
  culturalComplianceScore: number;
}

export interface WorkingGroupMetrics {
  feedbackReceived: number;
  feedbackResolved: number;
  averageResponseTime: number;
  satisfactionScore: number;
  meetingsHeld: number;
  decisionsPublished: number;
}

export interface ConsultationMetrics {
  sessionsHeld: number;
  totalParticipants: number;
  averageParticipation: number;
  outcomeImplementationRate: number;
  participantSatisfaction: number;
}

/**
 * Two-Way Communication Service
 * Manages community feedback routing, meeting summaries, and consultation tracking
 */
export class TwoWayCommunicationService {
  private feedbackQueue: CommunityFeedback[] = [];
  private routingRules: Map<string, string> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the communication service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadRoutingRules();
      console.log('Two-way communication service initialized');
    } catch (error) {
      console.error('Error initializing communication service:', error);
    }
  }

  /**
   * Submit community feedback
   */
  public async submitFeedback(
    feedbackData: Omit<CommunityFeedback, 'id' | 'routingInfo' | 'status' | 'responses' | 'followUpActions' | 'submittedAt' | 'updatedAt'>
  ): Promise<CommunityFeedback> {
    try {
      const feedback: CommunityFeedback = {
        ...feedbackData,
        id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        routingInfo: await this.determineFeedbackRouting(feedbackData),
        status: 'received',
        responses: [],
        followUpActions: [],
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      const { error } = await supabase
        .from('community_feedback')
        .insert([{
          id: feedback.id,
          channel_id: feedback.channelId,
          submitted_by: feedback.submittedBy,
          submitter_name: feedback.submitterName,
          submitter_role: feedback.submitterRole,
          community_id: feedback.communityId,
          community_name: feedback.communityName,
          feedback_type: feedback.feedbackType,
          category: feedback.category,
          priority: feedback.priority,
          subject: feedback.subject,
          content: feedback.content,
          attachments: feedback.attachments,
          cultural_context: feedback.culturalContext,
          traditional_knowledge_involved: feedback.traditionalKnowledgeInvolved,
          elder_consultation_required: feedback.elderConsultationRequired,
          routing_info: feedback.routingInfo,
          status: feedback.status,
          responses: feedback.responses,
          follow_up_actions: feedback.followUpActions,
          submitted_at: feedback.submittedAt.toISOString(),
          updated_at: feedback.updatedAt.toISOString()
        }]);

      if (error) {
        throw error;
      }

      // Route feedback to appropriate working group
      await this.routeFeedback(feedback);

      // Send acknowledgment to submitter
      await this.sendFeedbackAcknowledgment(feedback);

      console.log(`Feedback submitted: ${feedback.subject}`);
      return feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Route feedback to appropriate working group
   */
  private async routeFeedback(feedback: CommunityFeedback): Promise<void> {
    try {
      // Update feedback status
      await this.updateFeedbackStatus(feedback.id, 'routed');

      // Notify working group
      await this.notifyWorkingGroup(feedback);

      // Create follow-up action if needed
      if (feedback.priority === 'urgent' || feedback.elderConsultationRequired) {
        await this.createFollowUpAction(feedback.id, {
          action: 'Urgent review required',
          assignedTo: feedback.routingInfo.routedTo,
          assignedToName: feedback.routingInfo.routedToName,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          status: 'pending'
        });
      }

      console.log(`Feedback routed to ${feedback.routingInfo.routedToName}`);
    } catch (error) {
      console.error('Error routing feedback:', error);
    }
  }

  /**
   * Respond to community feedback
   */
  public async respondToFeedback(
    feedbackId: string,
    response: Omit<FeedbackResponse, 'id' | 'respondedAt'>
  ): Promise<void> {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      const newResponse: FeedbackResponse = {
        ...response,
        id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        respondedAt: new Date()
      };

      feedback.responses.push(newResponse);
      feedback.status = 'responded';
      feedback.updatedAt = new Date();

      // Update in database
      const { error } = await supabase
        .from('community_feedback')
        .update({
          responses: feedback.responses,
          status: feedback.status,
          updated_at: feedback.updatedAt.toISOString()
        })
        .eq('id', feedbackId);

      if (error) {
        throw error;
      }

      // Notify submitter of response
      await this.notifyFeedbackSubmitter(feedback, newResponse);

      // Create follow-up actions if needed
      if (newResponse.followUpRequired && newResponse.followUpDate) {
        await this.createFollowUpAction(feedbackId, {
          action: 'Follow up on response',
          assignedTo: response.respondedBy,
          assignedToName: response.responderName,
          dueDate: newResponse.followUpDate,
          status: 'pending'
        });
      }

      console.log(`Response added to feedback ${feedbackId}`);
    } catch (error) {
      console.error('Error responding to feedback:', error);
      throw error;
    }
  }

  /**
   * Create meeting summary
   */
  public async createMeetingSummary(
    summaryData: Omit<MeetingSummary, 'id' | 'createdAt' | 'publishedAt'>
  ): Promise<MeetingSummary> {
    try {
      const summary: MeetingSummary = {
        ...summaryData,
        id: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };

      // Save to database
      const { error } = await supabase
        .from('meeting_summaries')
        .insert([{
          id: summary.id,
          working_group_id: summary.workingGroupId,
          working_group_name: summary.workingGroupName,
          meeting_type: summary.meetingType,
          title: summary.title,
          date: summary.date.toISOString(),
          duration: summary.duration,
          location: summary.location,
          facilitator: summary.facilitator,
          attendees: summary.attendees,
          agenda: summary.agenda,
          discussions: summary.discussions,
          decisions: summary.decisions,
          action_items: summary.actionItems,
          next_meeting: summary.nextMeeting?.toISOString(),
          cultural_protocols: summary.culturalProtocols,
          publication_status: summary.publicationStatus,
          access_level: summary.accessLevel,
          summary: summary.summary,
          key_outcomes: summary.keyOutcomes,
          community_impact: summary.communityImpact,
          follow_up_required: summary.followUpRequired,
          created_by: summary.createdBy,
          created_at: summary.createdAt.toISOString()
        }]);

      if (error) {
        throw error;
      }

      // Submit for cultural review if needed
      if (summary.culturalProtocols.length > 0) {
        await this.submitMeetingSummaryForReview(summary.id);
      }

      console.log(`Meeting summary created: ${summary.title}`);
      return summary;
    } catch (error) {
      console.error('Error creating meeting summary:', error);
      throw error;
    }
  }

  /**
   * Publish meeting summary
   */
  public async publishMeetingSummary(
    summaryId: string,
    publishedBy: string
  ): Promise<void> {
    try {
      const summary = await this.getMeetingSummary(summaryId);
      if (!summary) {
        throw new Error('Meeting summary not found');
      }

      // Update publication status
      const { error } = await supabase
        .from('meeting_summaries')
        .update({
          publication_status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', summaryId);

      if (error) {
        throw error;
      }

      // Notify community if public meeting
      if (summary.accessLevel === 'public' || summary.accessLevel === 'community') {
        await this.notifyMeetingSummaryPublication(summary);
      }

      console.log(`Meeting summary published: ${summaryId}`);
    } catch (error) {
      console.error('Error publishing meeting summary:', error);
      throw error;
    }
  }

  /**
   * Create consultation session
   */
  public async createConsultationSession(
    sessionData: Omit<ConsultationSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ConsultationSession> {
    try {
      const session: ConsultationSession = {
        ...sessionData,
        id: `consultation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      const { error } = await supabase
        .from('consultation_sessions')
        .insert([{
          id: session.id,
          title: session.title,
          description: session.description,
          type: session.type,
          topic: session.topic,
          organizer: session.organizer,
          facilitators: session.facilitators,
          target_audience: session.targetAudience,
          scheduled_date: session.scheduledDate.toISOString(),
          duration: session.duration,
          location: session.location,
          max_participants: session.maxParticipants,
          registration_required: session.registrationRequired,
          cultural_protocols: session.culturalProtocols,
          materials: session.materials,
          participants: session.participants,
          outcomes: session.outcomes,
          feedback: session.feedback,
          follow_up_plan: session.followUpPlan,
          status: session.status,
          publication_level: session.publicationLevel,
          created_by: session.createdBy,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString()
        }]);

      if (error) {
        throw error;
      }

      // Send invitations if registration required
      if (session.registrationRequired) {
        await this.sendConsultationInvitations(session);
      }

      console.log(`Consultation session created: ${session.title}`);
      return session;
    } catch (error) {
      console.error('Error creating consultation session:', error);
      throw error;
    }
  }

  /**
   * Register for consultation session
   */
  public async registerForConsultation(
    sessionId: string,
    participant: Omit<ConsultationParticipant, 'id' | 'registeredAt' | 'attended'>
  ): Promise<void> {
    try {
      const session = await this.getConsultationSession(sessionId);
      if (!session) {
        throw new Error('Consultation session not found');
      }

      if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
        throw new Error('Consultation session is full');
      }

      const newParticipant: ConsultationParticipant = {
        ...participant,
        id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        registeredAt: new Date(),
        attended: false
      };

      session.participants.push(newParticipant);
      session.updatedAt = new Date();

      // Update in database
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          participants: session.participants,
          updated_at: session.updatedAt.toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      // Send confirmation to participant
      await this.sendRegistrationConfirmation(session, newParticipant);

      console.log(`Participant registered for consultation: ${sessionId}`);
    } catch (error) {
      console.error('Error registering for consultation:', error);
      throw error;
    }
  }

  /**
   * Update consultation outcomes
   */
  public async updateConsultationOutcomes(
    sessionId: string,
    outcomes: ConsultationOutcome[]
  ): Promise<void> {
    try {
      const session = await this.getConsultationSession(sessionId);
      if (!session) {
        throw new Error('Consultation session not found');
      }

      session.outcomes = outcomes;
      session.status = 'completed';
      session.updatedAt = new Date();

      // Update in database
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          outcomes: session.outcomes,
          status: session.status,
          updated_at: session.updatedAt.toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      // Create follow-up actions based on outcomes
      await this.createConsultationFollowUp(session);

      console.log(`Consultation outcomes updated: ${sessionId}`);
    } catch (error) {
      console.error('Error updating consultation outcomes:', error);
      throw error;
    }
  }

  /**
   * Get feedback by ID
   */
  public async getFeedback(feedbackId: string): Promise<CommunityFeedback | null> {
    try {
      const { data, error } = await supabase
        .from('community_feedback')
        .select('*')
        .eq('id', feedbackId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapDatabaseToFeedback(data);
    } catch (error) {
      console.error('Error getting feedback:', error);
      return null;
    }
  }

  /**
   * Get feedback by working group
   */
  public async getFeedbackByWorkingGroup(
    workingGroupId: string,
    status?: CommunityFeedback['status']
  ): Promise<CommunityFeedback[]> {
    try {
      let query = supabase
        .from('community_feedback')
        .select('*')
        .eq('routing_info->routedTo', workingGroupId)
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToFeedback) || [];
    } catch (error) {
      console.error('Error getting feedback by working group:', error);
      return [];
    }
  }

  /**
   * Get meeting summary by ID
   */
  public async getMeetingSummary(summaryId: string): Promise<MeetingSummary | null> {
    try {
      const { data, error } = await supabase
        .from('meeting_summaries')
        .select('*')
        .eq('id', summaryId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapDatabaseToMeetingSummary(data);
    } catch (error) {
      console.error('Error getting meeting summary:', error);
      return null;
    }
  }

  /**
   * Get published meeting summaries
   */
  public async getPublishedMeetingSummaries(
    workingGroupId?: string,
    limit: number = 50
  ): Promise<MeetingSummary[]> {
    try {
      let query = supabase
        .from('meeting_summaries')
        .select('*')
        .eq('publication_status', 'published')
        .in('access_level', ['public', 'community'])
        .order('date', { ascending: false })
        .limit(limit);

      if (workingGroupId) {
        query = query.eq('working_group_id', workingGroupId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToMeetingSummary) || [];
    } catch (error) {
      console.error('Error getting published meeting summaries:', error);
      return [];
    }
  }

  /**
   * Get consultation session by ID
   */
  public async getConsultationSession(sessionId: string): Promise<ConsultationSession | null> {
    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapDatabaseToConsultationSession(data);
    } catch (error) {
      console.error('Error getting consultation session:', error);
      return null;
    }
  }

  /**
   * Get upcoming consultation sessions
   */
  public async getUpcomingConsultations(
    communityId?: string,
    limit: number = 20
  ): Promise<ConsultationSession[]> {
    try {
      let query = supabase
        .from('consultation_sessions')
        .select('*')
        .gte('scheduled_date', new Date().toISOString())
        .in('status', ['planned', 'open_registration'])
        .order('scheduled_date', { ascending: true })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToConsultationSession) || [];
    } catch (error) {
      console.error('Error getting upcoming consultations:', error);
      return [];
    }
  }

  /**
   * Get communication metrics
   */
  public async getCommunicationMetrics(
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<CommunicationMetrics> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get feedback metrics
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('community_feedback')
        .select('*')
        .gte('submitted_at', startDate.toISOString());

      if (feedbackError) {
        throw feedbackError;
      }

      const totalFeedback = feedbackData?.length || 0;
      const respondedFeedback = feedbackData?.filter(f => f.status === 'responded' || f.status === 'resolved').length || 0;
      const responseRate = totalFeedback > 0 ? (respondedFeedback / totalFeedback) * 100 : 0;

      // Calculate average response time
      const responseTimes = feedbackData?.filter(f => f.responses && f.responses.length > 0)
        .map(f => {
          const submitted = new Date(f.submitted_at);
          const responded = new Date(f.responses[0].respondedAt);
          return (responded.getTime() - submitted.getTime()) / (1000 * 60 * 60); // hours
        }) || [];

      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      return {
        totalFeedback,
        responseRate,
        averageResponseTime,
        satisfactionScore: 4.2, // Would be calculated from actual feedback
        channelUsage: {}, // Would be calculated from channel data
        workingGroupPerformance: {}, // Would be calculated from working group data
        consultationEngagement: {
          sessionsHeld: 0,
          totalParticipants: 0,
          averageParticipation: 0,
          outcomeImplementationRate: 0,
          participantSatisfaction: 0
        },
        culturalComplianceScore: 85 // Would be calculated from cultural review data
      };
    } catch (error) {
      console.error('Error getting communication metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private async loadRoutingRules(): Promise<void> {
    // Load routing rules from database or configuration
    this.routingRules.set('healthcare', 'health-working-group');
    this.routingRules.set('education', 'education-working-group');
    this.routingRules.set('housing', 'housing-working-group');
    this.routingRules.set('employment', 'economic-development-working-group');
    this.routingRules.set('culture', 'cultural-preservation-working-group');
    this.routingRules.set('environment', 'environmental-working-group');
    this.routingRules.set('governance', 'governance-working-group');
  }

  private async determineFeedbackRouting(
    feedback: Partial<CommunityFeedback>
  ): Promise<FeedbackRouting> {
    const workingGroupId = this.routingRules.get(feedback.category || 'other') || 'general-working-group';
    
    return {
      routedTo: workingGroupId,
      routedToName: this.getWorkingGroupName(workingGroupId),
      routingReason: `Routed based on category: ${feedback.category}`,
      routedBy: 'system',
      routedAt: new Date(),
      estimatedResponseTime: this.getEstimatedResponseTime(feedback.priority || 'medium')
    };
  }

  private getWorkingGroupName(workingGroupId: string): string {
    const names: { [key: string]: string } = {
      'health-working-group': 'Health Working Group',
      'education-working-group': 'Education Working Group',
      'housing-working-group': 'Housing Working Group',
      'economic-development-working-group': 'Economic Development Working Group',
      'cultural-preservation-working-group': 'Cultural Preservation Working Group',
      'environmental-working-group': 'Environmental Working Group',
      'governance-working-group': 'Governance Working Group',
      'general-working-group': 'General Working Group'
    };
    
    return names[workingGroupId] || 'Unknown Working Group';
  }

  private getEstimatedResponseTime(priority: string): number {
    switch (priority) {
      case 'urgent': return 24; // 24 hours
      case 'high': return 72; // 3 days
      case 'medium': return 168; // 1 week
      case 'low': return 336; // 2 weeks
      default: return 168;
    }
  }

  private async updateFeedbackStatus(
    feedbackId: string,
    status: CommunityFeedback['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('community_feedback')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId);

    if (error) {
      throw error;
    }
  }

  private async createFollowUpAction(
    feedbackId: string,
    action: Omit<FollowUpAction, 'id'>
  ): Promise<void> {
    const newAction: FollowUpAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Add to feedback follow-up actions
    const feedback = await this.getFeedback(feedbackId);
    if (feedback) {
      feedback.followUpActions.push(newAction);
      
      const { error } = await supabase
        .from('community_feedback')
        .update({
          follow_up_actions: feedback.followUpActions,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) {
        throw error;
      }
    }
  }

  private async notifyWorkingGroup(feedback: CommunityFeedback): Promise<void> {
    // Implementation would send notifications to working group members
    console.log(`Notifying ${feedback.routingInfo.routedToName} of new feedback: ${feedback.subject}`);
  }

  private async sendFeedbackAcknowledgment(feedback: CommunityFeedback): Promise<void> {
    // Implementation would send acknowledgment to feedback submitter
    console.log(`Sending acknowledgment to ${feedback.submitterName} for feedback: ${feedback.subject}`);
  }

  private async notifyFeedbackSubmitter(
    feedback: CommunityFeedback,
    response: FeedbackResponse
  ): Promise<void> {
    // Implementation would notify submitter of response
    console.log(`Notifying ${feedback.submitterName} of response to: ${feedback.subject}`);
  }

  private async submitMeetingSummaryForReview(summaryId: string): Promise<void> {
    // Submit to cultural safety service for review
    const reviewRequest = {
      contentId: summaryId,
      contentType: 'meeting_summary',
      submittedBy: 'meeting_summary_system',
      priority: 'medium'
    };

    await submitForCulturalReview(reviewRequest);
  }

  private async notifyMeetingSummaryPublication(summary: MeetingSummary): Promise<void> {
    // Implementation would notify community of published meeting summary
    console.log(`Notifying community of published meeting summary: ${summary.title}`);
  }

  private async sendConsultationInvitations(session: ConsultationSession): Promise<void> {
    // Implementation would send invitations to target audience
    console.log(`Sending invitations for consultation: ${session.title}`);
  }

  private async sendRegistrationConfirmation(
    session: ConsultationSession,
    participant: ConsultationParticipant
  ): Promise<void> {
    // Implementation would send confirmation to participant
    console.log(`Sending registration confirmation to ${participant.name} for: ${session.title}`);
  }

  private async createConsultationFollowUp(session: ConsultationSession): Promise<void> {
    // Create follow-up actions based on consultation outcomes
    for (const outcome of session.outcomes) {
      for (const nextStep of outcome.nextSteps) {
        console.log(`Creating follow-up action: ${nextStep}`);
      }
    }
  }

  private mapDatabaseToFeedback(data: any): CommunityFeedback {
    return {
      id: data.id,
      channelId: data.channel_id,
      submittedBy: data.submitted_by,
      submitterName: data.submitter_name,
      submitterRole: data.submitter_role,
      communityId: data.community_id,
      communityName: data.community_name,
      feedbackType: data.feedback_type,
      category: data.category,
      priority: data.priority,
      subject: data.subject,
      content: data.content,
      attachments: data.attachments || [],
      culturalContext: data.cultural_context,
      traditionalKnowledgeInvolved: data.traditional_knowledge_involved,
      elderConsultationRequired: data.elder_consultation_required,
      routingInfo: data.routing_info,
      status: data.status,
      responses: data.responses || [],
      followUpActions: data.follow_up_actions || [],
      submittedAt: new Date(data.submitted_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined
    };
  }

  private mapDatabaseToMeetingSummary(data: any): MeetingSummary {
    return {
      id: data.id,
      workingGroupId: data.working_group_id,
      workingGroupName: data.working_group_name,
      meetingType: data.meeting_type,
      title: data.title,
      date: new Date(data.date),
      duration: data.duration,
      location: data.location,
      facilitator: data.facilitator,
      attendees: data.attendees || [],
      agenda: data.agenda || [],
      discussions: data.discussions || [],
      decisions: data.decisions || [],
      actionItems: data.action_items || [],
      nextMeeting: data.next_meeting ? new Date(data.next_meeting) : undefined,
      culturalProtocols: data.cultural_protocols || [],
      publicationStatus: data.publication_status,
      accessLevel: data.access_level,
      summary: data.summary,
      keyOutcomes: data.key_outcomes || [],
      communityImpact: data.community_impact,
      followUpRequired: data.follow_up_required,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      publishedAt: data.published_at ? new Date(data.published_at) : undefined
    };
  }

  private mapDatabaseToConsultationSession(data: any): ConsultationSession {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      topic: data.topic,
      organizer: data.organizer,
      facilitators: data.facilitators || [],
      targetAudience: data.target_audience || [],
      scheduledDate: new Date(data.scheduled_date),
      duration: data.duration,
      location: data.location,
      maxParticipants: data.max_participants,
      registrationRequired: data.registration_required,
      culturalProtocols: data.cultural_protocols || [],
      materials: data.materials || [],
      participants: data.participants || [],
      outcomes: data.outcomes || [],
      feedback: data.feedback || [],
      followUpPlan: data.follow_up_plan,
      status: data.status,
      publicationLevel: data.publication_level,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

// Export singleton instance
export const twoWayCommunicationService = new TwoWayCommunicationService();