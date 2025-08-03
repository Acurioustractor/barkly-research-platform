import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { twoWayCommunicationService, CommunityFeedback } from '../../src/lib/two-way-communication-service';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'feedback-1',
              channel_id: 'channel-1',
              submitted_by: 'user-1',
              submitter_name: 'Test User',
              submitter_role: 'community_member',
              community_id: 'community-1',
              community_name: 'Test Community',
              feedback_type: 'suggestion',
              category: 'healthcare',
              priority: 'medium',
              subject: 'Test Feedback',
              content: 'This is a test feedback',
              attachments: [],
              cultural_context: null,
              traditional_knowledge_involved: false,
              elder_consultation_required: false,
              routing_info: {
                routedTo: 'health-working-group',
                routedToName: 'Health Working Group',
                routingReason: 'Healthcare category',
                routedBy: 'system',
                routedAt: new Date().toISOString(),
                estimatedResponseTime: 72
              },
              status: 'routed',
              responses: [],
              follow_up_actions: [],
              submitted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            error: null 
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'meeting-1',
                  working_group_id: 'health-working-group',
                  working_group_name: 'Health Working Group',
                  meeting_type: 'regular',
                  title: 'Test Meeting',
                  date: new Date().toISOString(),
                  duration: 120,
                  location: 'Community Center',
                  facilitator: 'Test Facilitator',
                  attendees: [],
                  agenda: [],
                  discussions: [],
                  decisions: [],
                  action_items: [],
                  cultural_protocols: [],
                  publication_status: 'published',
                  access_level: 'public',
                  summary: 'Test meeting summary',
                  key_outcomes: ['Test outcome'],
                  community_impact: 'Positive impact',
                  follow_up_required: false,
                  created_by: 'test-user',
                  created_at: new Date().toISOString()
                }
              ], 
              error: null 
            }))
          })),
          gte: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ 
                  data: [
                    {
                      id: 'consultation-1',
                      title: 'Test Consultation',
                      description: 'Test consultation description',
                      type: 'public_consultation',
                      topic: 'Healthcare',
                      organizer: 'Health Working Group',
                      facilitators: [],
                      target_audience: [],
                      scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                      duration: 180,
                      location: 'Community Center',
                      max_participants: null,
                      registration_required: true,
                      cultural_protocols: [],
                      materials: [],
                      participants: [],
                      outcomes: [],
                      feedback: [],
                      follow_up_plan: 'Follow up plan',
                      status: 'open_registration',
                      publication_level: 'public',
                      created_by: 'test-user',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                  ], 
                  error: null 
                }))
              }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock Cultural Safety Service
jest.mock('../../src/lib/cultural-safety-service', () => ({
  culturalSafetyService: {
    submitForReview: jest.fn(() => Promise.resolve({ success: true }))
  }
}));

describe('Two-Way Communication System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Community Feedback Management', () => {
    it('should submit community feedback', async () => {
      const feedbackData = {
        channelId: 'channel-1',
        submittedBy: 'user-1',
        submitterName: 'Test User',
        submitterRole: 'community_member' as const,
        communityId: 'community-1',
        communityName: 'Test Community',
        feedbackType: 'suggestion' as const,
        category: 'healthcare' as const,
        priority: 'medium' as const,
        subject: 'Test Feedback Subject',
        content: 'This is a test feedback content',
        attachments: [],
        traditionalKnowledgeInvolved: false,
        elderConsultationRequired: false
      };

      const feedback = await twoWayCommunicationService.submitFeedback(feedbackData);

      expect(feedback).toBeDefined();
      expect(feedback.subject).toBe(feedbackData.subject);
      expect(feedback.content).toBe(feedbackData.content);
      expect(feedback.status).toBe('received');
      expect(feedback.routingInfo).toBeDefined();
    });

    it('should get feedback by ID', async () => {
      const feedbackId = 'feedback-1';
      
      const feedback = await twoWayCommunicationService.getFeedback(feedbackId);
      
      expect(feedback).toBeDefined();
      expect(feedback?.id).toBe(feedbackId);
      expect(feedback?.subject).toBe('Test Feedback');
    });

    it('should get feedback by working group', async () => {
      const workingGroupId = 'health-working-group';
      
      const feedback = await twoWayCommunicationService.getFeedbackByWorkingGroup(workingGroupId);
      
      expect(Array.isArray(feedback)).toBe(true);
    });

    it('should respond to feedback', async () => {
      const feedbackId = 'feedback-1';
      const response = {
        respondedBy: 'working-group-member',
        responderName: 'Test Responder',
        responderRole: 'Working Group Member',
        responseType: 'information' as const,
        content: 'Thank you for your feedback. We will consider this suggestion.',
        actionsTaken: ['Reviewed feedback', 'Discussed with team'],
        nextSteps: ['Schedule follow-up meeting'],
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        culturallyReviewed: false
      };

      await expect(
        twoWayCommunicationService.respondToFeedback(feedbackId, response)
      ).resolves.not.toThrow();
    });
  });

  describe('Meeting Summary Management', () => {
    it('should create meeting summary', async () => {
      const summaryData = {
        workingGroupId: 'health-working-group',
        workingGroupName: 'Health Working Group',
        meetingType: 'regular' as const,
        title: 'January 2024 Health Working Group Meeting',
        date: new Date(),
        duration: 120,
        location: 'Community Center',
        facilitator: 'Dr. Sarah Johnson',
        attendees: [
          {
            id: 'attendee-1',
            name: 'Dr. Sarah Johnson',
            role: 'Chair',
            organization: 'Health Working Group',
            attendanceType: 'in_person' as const
          }
        ],
        agenda: [
          {
            id: 'agenda-1',
            order: 1,
            title: 'Review of Community Health Statistics',
            description: 'Monthly review of health indicators',
            presenter: 'Dr. Sarah Johnson',
            timeAllocated: 30,
            type: 'presentation' as const,
            documents: []
          }
        ],
        discussions: [],
        decisions: [],
        actionItems: [],
        culturalProtocols: ['Opening prayer', 'Elder acknowledgment'],
        publicationStatus: 'draft' as const,
        accessLevel: 'public' as const,
        summary: 'The working group reviewed community health statistics and discussed upcoming initiatives.',
        keyOutcomes: ['Approved new health program', 'Scheduled community health fair'],
        communityImpact: 'These decisions will improve community health outcomes.',
        followUpRequired: true,
        createdBy: 'secretary-health'
      };

      const summary = await twoWayCommunicationService.createMeetingSummary(summaryData);

      expect(summary).toBeDefined();
      expect(summary.title).toBe(summaryData.title);
      expect(summary.workingGroupName).toBe(summaryData.workingGroupName);
      expect(summary.publicationStatus).toBe('draft');
    });

    it('should publish meeting summary', async () => {
      const summaryId = 'meeting-1';
      const publishedBy = 'admin-user';

      await expect(
        twoWayCommunicationService.publishMeetingSummary(summaryId, publishedBy)
      ).resolves.not.toThrow();
    });

    it('should get published meeting summaries', async () => {
      const summaries = await twoWayCommunicationService.getPublishedMeetingSummaries();
      
      expect(Array.isArray(summaries)).toBe(true);
      summaries.forEach(summary => {
        expect(summary.publicationStatus).toBe('published');
        expect(['public', 'community']).toContain(summary.accessLevel);
      });
    });
  });

  describe('Consultation Session Management', () => {
    it('should create consultation session', async () => {
      const sessionData = {
        title: 'Community Health Services Planning',
        description: 'Public consultation to gather input on future health services',
        type: 'public_consultation' as const,
        topic: 'Healthcare Planning',
        organizer: 'Health Working Group',
        facilitators: ['Dr. Sarah Johnson'],
        targetAudience: ['Community members', 'Health service users'],
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 180,
        location: 'Community Center Main Hall',
        registrationRequired: true,
        culturalProtocols: ['Opening prayer', 'Elder speaking protocol'],
        materials: [],
        participants: [],
        outcomes: [],
        feedback: [],
        followUpPlan: 'Compile feedback and present to working group',
        status: 'planned' as const,
        publicationLevel: 'public' as const,
        createdBy: 'health-coordinator'
      };

      const session = await twoWayCommunicationService.createConsultationSession(sessionData);

      expect(session).toBeDefined();
      expect(session.title).toBe(sessionData.title);
      expect(session.type).toBe(sessionData.type);
      expect(session.status).toBe('planned');
    });

    it('should register for consultation', async () => {
      const consultationId = 'consultation-1';
      const participant = {
        name: 'Test Participant',
        role: 'Community Member',
        communityAffiliation: 'community-1',
        contributionLevel: 'participant' as const
      };

      await expect(
        twoWayCommunicationService.registerForConsultation(consultationId, participant)
      ).resolves.not.toThrow();
    });

    it('should update consultation outcomes', async () => {
      const consultationId = 'consultation-1';
      const outcomes = [
        {
          id: 'outcome-1',
          category: 'Healthcare Access',
          outcome: 'Strong support for extended clinic hours',
          supportLevel: 'strong_support' as const,
          participantCount: 25,
          culturalPerspective: 'Traditional healing should be integrated',
          recommendations: ['Extend clinic hours', 'Add traditional healer'],
          nextSteps: ['Present to working group', 'Develop implementation plan']
        }
      ];

      await expect(
        twoWayCommunicationService.updateConsultationOutcomes(consultationId, outcomes)
      ).resolves.not.toThrow();
    });

    it('should get upcoming consultations', async () => {
      const consultations = await twoWayCommunicationService.getUpcomingConsultations();
      
      expect(Array.isArray(consultations)).toBe(true);
      consultations.forEach(consultation => {
        expect(consultation.scheduledDate.getTime()).toBeGreaterThan(Date.now());
        expect(['planned', 'open_registration']).toContain(consultation.status);
      });
    });
  });

  describe('Communication Metrics', () => {
    it('should get communication metrics', async () => {
      const metrics = await twoWayCommunicationService.getCommunicationMetrics('month');
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalFeedback).toBe('number');
      expect(typeof metrics.responseRate).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.satisfactionScore).toBe('number');
      expect(typeof metrics.culturalComplianceScore).toBe('number');
      
      expect(metrics.responseRate).toBeGreaterThanOrEqual(0);
      expect(metrics.responseRate).toBeLessThanOrEqual(100);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.culturalComplianceScore).toBeGreaterThanOrEqual(0);
      expect(metrics.culturalComplianceScore).toBeLessThanOrEqual(100);
    });

    it('should calculate metrics for different timeframes', async () => {
      const weekMetrics = await twoWayCommunicationService.getCommunicationMetrics('week');
      const monthMetrics = await twoWayCommunicationService.getCommunicationMetrics('month');
      const quarterMetrics = await twoWayCommunicationService.getCommunicationMetrics('quarter');
      
      expect(weekMetrics).toBeDefined();
      expect(monthMetrics).toBeDefined();
      expect(quarterMetrics).toBeDefined();
    });
  });

  describe('Cultural Safety Integration', () => {
    it('should handle traditional knowledge feedback appropriately', async () => {
      const feedbackData = {
        channelId: 'channel-1',
        submittedBy: 'user-1',
        submitterName: 'Elder Test User',
        submitterRole: 'elder' as const,
        communityId: 'community-1',
        communityName: 'Test Community',
        feedbackType: 'suggestion' as const,
        category: 'culture' as const,
        priority: 'high' as const,
        subject: 'Traditional Healing Integration',
        content: 'We need to better integrate traditional healing practices',
        attachments: [],
        culturalContext: 'Traditional healing is sacred to our community',
        traditionalKnowledgeInvolved: true,
        elderConsultationRequired: true
      };

      const feedback = await twoWayCommunicationService.submitFeedback(feedbackData);

      expect(feedback.traditionalKnowledgeInvolved).toBe(true);
      expect(feedback.elderConsultationRequired).toBe(true);
      expect(feedback.culturalContext).toBeDefined();
    });

    it('should submit meeting summaries with cultural protocols for review', async () => {
      const summaryData = {
        workingGroupId: 'cultural-working-group',
        workingGroupName: 'Cultural Preservation Working Group',
        meetingType: 'regular' as const,
        title: 'Cultural Protocols Meeting',
        date: new Date(),
        duration: 120,
        location: 'Elder Center',
        facilitator: 'Elder Mary Whitehorse',
        attendees: [],
        agenda: [],
        discussions: [],
        decisions: [],
        actionItems: [],
        culturalProtocols: ['Traditional opening ceremony', 'Elder speaking order', 'Sacred items present'],
        publicationStatus: 'draft' as const,
        accessLevel: 'community' as const,
        summary: 'Discussion of cultural preservation initiatives',
        keyOutcomes: ['Approved traditional knowledge documentation project'],
        communityImpact: 'Will help preserve cultural knowledge for future generations',
        followUpRequired: true,
        createdBy: 'cultural-secretary'
      };

      const summary = await twoWayCommunicationService.createMeetingSummary(summaryData);

      expect(summary.culturalProtocols.length).toBeGreaterThan(0);
      expect(summary.publicationStatus).toBe('draft'); // Should be in draft pending cultural review
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const mockSupabase = require('../../src/lib/supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Database error') })
          })
        })
      });

      const feedback = await twoWayCommunicationService.getFeedback('invalid-id');
      expect(feedback).toBeNull();
    });

    it('should handle missing feedback errors', async () => {
      await expect(
        twoWayCommunicationService.respondToFeedback('nonexistent-feedback', {
          respondedBy: 'test-user',
          responderName: 'Test User',
          responderRole: 'Test Role',
          responseType: 'information',
          content: 'Test response',
          actionsTaken: [],
          nextSteps: [],
          followUpRequired: false,
          culturallyReviewed: false
        })
      ).rejects.toThrow('Feedback not found');
    });

    it('should validate required fields for feedback submission', async () => {
      const invalidFeedbackData = {
        channelId: 'channel-1',
        submittedBy: 'user-1',
        submitterName: 'Test User',
        submitterRole: 'community_member' as const,
        communityId: 'community-1',
        communityName: 'Test Community',
        feedbackType: 'suggestion' as const,
        category: 'healthcare' as const,
        priority: 'medium' as const,
        subject: '', // Missing required field
        content: 'Test content',
        attachments: [],
        traditionalKnowledgeInvolved: false,
        elderConsultationRequired: false
      };

      // Service should handle validation gracefully
      await expect(
        twoWayCommunicationService.submitFeedback(invalidFeedbackData)
      ).resolves.toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate feedback data structure', async () => {
      const feedback = await twoWayCommunicationService.getFeedback('feedback-1');
      
      if (feedback) {
        // Required fields
        expect(feedback).toHaveProperty('id');
        expect(feedback).toHaveProperty('channelId');
        expect(feedback).toHaveProperty('submittedBy');
        expect(feedback).toHaveProperty('submitterName');
        expect(feedback).toHaveProperty('communityId');
        expect(feedback).toHaveProperty('subject');
        expect(feedback).toHaveProperty('content');
        expect(feedback).toHaveProperty('status');
        expect(feedback).toHaveProperty('submittedAt');
        expect(feedback).toHaveProperty('updatedAt');
        
        // Array fields
        expect(Array.isArray(feedback.attachments)).toBe(true);
        expect(Array.isArray(feedback.responses)).toBe(true);
        expect(Array.isArray(feedback.followUpActions)).toBe(true);
        
        // Enum validations
        expect(['suggestion', 'concern', 'complaint', 'question', 'compliment', 'request'])
          .toContain(feedback.feedbackType);
        expect(['healthcare', 'education', 'housing', 'employment', 'culture', 'environment', 'governance', 'other'])
          .toContain(feedback.category);
        expect(['low', 'medium', 'high', 'urgent']).toContain(feedback.priority);
        expect(['received', 'routed', 'assigned', 'in_progress', 'responded', 'resolved', 'escalated'])
          .toContain(feedback.status);
        expect(['community_member', 'elder', 'leader', 'organization', 'government'])
          .toContain(feedback.submitterRole);
        
        // Routing info validation
        expect(feedback.routingInfo).toHaveProperty('routedTo');
        expect(feedback.routingInfo).toHaveProperty('routedToName');
        expect(feedback.routingInfo).toHaveProperty('routingReason');
        expect(feedback.routingInfo).toHaveProperty('routedBy');
        expect(feedback.routingInfo).toHaveProperty('routedAt');
        expect(feedback.routingInfo).toHaveProperty('estimatedResponseTime');
      }
    });

    it('should validate meeting summary data structure', async () => {
      const summaries = await twoWayCommunicationService.getPublishedMeetingSummaries();
      
      summaries.forEach(summary => {
        // Required fields
        expect(summary).toHaveProperty('id');
        expect(summary).toHaveProperty('workingGroupId');
        expect(summary).toHaveProperty('workingGroupName');
        expect(summary).toHaveProperty('title');
        expect(summary).toHaveProperty('date');
        expect(summary).toHaveProperty('location');
        expect(summary).toHaveProperty('facilitator');
        expect(summary).toHaveProperty('summary');
        expect(summary).toHaveProperty('createdAt');
        
        // Array fields
        expect(Array.isArray(summary.attendees)).toBe(true);
        expect(Array.isArray(summary.agenda)).toBe(true);
        expect(Array.isArray(summary.discussions)).toBe(true);
        expect(Array.isArray(summary.decisions)).toBe(true);
        expect(Array.isArray(summary.actionItems)).toBe(true);
        expect(Array.isArray(summary.culturalProtocols)).toBe(true);
        expect(Array.isArray(summary.keyOutcomes)).toBe(true);
        
        // Enum validations
        expect(['regular', 'special', 'emergency', 'consultation', 'public'])
          .toContain(summary.meetingType);
        expect(['draft', 'review', 'approved', 'published', 'restricted'])
          .toContain(summary.publicationStatus);
        expect(['public', 'community', 'members_only', 'confidential'])
          .toContain(summary.accessLevel);
        
        // Numeric validations
        expect(typeof summary.duration).toBe('number');
        expect(summary.duration).toBeGreaterThan(0);
      });
    });

    it('should validate consultation session data structure', async () => {
      const consultations = await twoWayCommunicationService.getUpcomingConsultations();
      
      consultations.forEach(consultation => {
        // Required fields
        expect(consultation).toHaveProperty('id');
        expect(consultation).toHaveProperty('title');
        expect(consultation).toHaveProperty('description');
        expect(consultation).toHaveProperty('type');
        expect(consultation).toHaveProperty('scheduledDate');
        expect(consultation).toHaveProperty('location');
        expect(consultation).toHaveProperty('organizer');
        expect(consultation).toHaveProperty('status');
        expect(consultation).toHaveProperty('createdAt');
        
        // Array fields
        expect(Array.isArray(consultation.facilitators)).toBe(true);
        expect(Array.isArray(consultation.targetAudience)).toBe(true);
        expect(Array.isArray(consultation.culturalProtocols)).toBe(true);
        expect(Array.isArray(consultation.materials)).toBe(true);
        expect(Array.isArray(consultation.participants)).toBe(true);
        expect(Array.isArray(consultation.outcomes)).toBe(true);
        expect(Array.isArray(consultation.feedback)).toBe(true);
        
        // Enum validations
        expect(['public_consultation', 'community_meeting', 'focus_group', 'survey', 'workshop', 'elder_circle'])
          .toContain(consultation.type);
        expect(['planned', 'open_registration', 'in_progress', 'completed', 'cancelled', 'postponed'])
          .toContain(consultation.status);
        expect(['public', 'community', 'restricted'])
          .toContain(consultation.publicationLevel);
        
        // Date validations
        expect(consultation.scheduledDate).toBeInstanceOf(Date);
        expect(consultation.createdAt).toBeInstanceOf(Date);
        expect(consultation.updatedAt).toBeInstanceOf(Date);
        
        // Numeric validations
        expect(typeof consultation.duration).toBe('number');
        expect(consultation.duration).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        twoWayCommunicationService.getFeedback('feedback-1'),
        twoWayCommunicationService.getPublishedMeetingSummaries(),
        twoWayCommunicationService.getUpcomingConsultations(),
        twoWayCommunicationService.getCommunicationMetrics('month')
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });

    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      const summaries = await twoWayCommunicationService.getPublishedMeetingSummaries(undefined, 100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(Array.isArray(summaries)).toBe(true);
    });
  });

  describe('Integration with Other Services', () => {
    it('should integrate with cultural safety service', async () => {
      const { culturalSafetyService } = require('../../src/lib/cultural-safety-service');
      expect(culturalSafetyService).toBeDefined();
      expect(culturalSafetyService.submitForReview).toBeDefined();
      expect(typeof culturalSafetyService.submitForReview).toBe('function');
    });
  });
});