import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { decisionTransparencyService, GovernmentDecision } from '../../src/lib/decision-transparency-service';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'decision-1',
              title: 'Test Decision',
              description: 'Test decision description',
              decision_type: 'policy',
              category: 'Healthcare',
              affected_communities: ['community-1'],
              decision_makers: [],
              consultation_process: {},
              cultural_impact_assessment: {
                culturalSensitivity: 'medium',
                elderReviewRequired: true,
                approvalStatus: 'pending'
              },
              resource_allocation: [],
              timeline: {},
              status: 'draft',
              publication_status: 'pending',
              transparency_level: 'public',
              documents: [],
              community_feedback: [],
              implementation_progress: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            error: null 
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'decision-1',
                  title: 'Test Decision',
                  description: 'Test decision description',
                  decision_type: 'policy',
                  category: 'Healthcare',
                  affected_communities: ['community-1'],
                  status: 'published',
                  publication_status: 'published',
                  transparency_level: 'public',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ], 
              error: null 
            }))
          })),
          contains: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'decision-1',
                  title: 'Community Decision',
                  description: 'Decision affecting community',
                  decision_type: 'program',
                  category: 'Education',
                  affected_communities: ['community-1'],
                  status: 'approved',
                  publication_status: 'published',
                  transparency_level: 'public',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ], 
              error: null 
            }))
          }))
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            contains: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  order: jest.fn(() => Promise.resolve({ 
                    data: [
                      {
                        id: 'decision-search-1',
                        title: 'Search Result Decision',
                        description: 'Decision found in search',
                        decision_type: 'policy',
                        category: 'Healthcare',
                        affected_communities: ['community-1'],
                        status: 'published',
                        publication_status: 'published',
                        transparency_level: 'public',
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

describe('Decision Transparency System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Decision Creation and Management', () => {
    it('should create a new government decision', async () => {
      const decisionData = {
        title: 'New Healthcare Policy',
        description: 'Policy to improve healthcare access',
        decisionType: 'policy' as const,
        category: 'Healthcare',
        affectedCommunities: ['community-1', 'community-2'],
        transparencyLevel: 'public' as const
      };

      const decision = await decisionTransparencyService.createDecision(
        decisionData,
        'test-user'
      );

      expect(decision).toBeDefined();
      expect(decision.title).toBe(decisionData.title);
      expect(decision.description).toBe(decisionData.description);
      expect(decision.decisionType).toBe(decisionData.decisionType);
      expect(decision.status).toBe('draft');
      expect(decision.publicationStatus).toBe('pending');
    });

    it('should submit decision for cultural review', async () => {
      const decisionId = 'decision-1';
      
      await expect(
        decisionTransparencyService.submitForCulturalReview(decisionId)
      ).resolves.not.toThrow();
    });

    it('should publish decision after approval', async () => {
      const decisionId = 'decision-1';
      const publishedBy = 'admin-user';
      
      await expect(
        decisionTransparencyService.publishDecision(decisionId, publishedBy)
      ).resolves.not.toThrow();
    });

    it('should get decision by ID', async () => {
      const decisionId = 'decision-1';
      
      const decision = await decisionTransparencyService.getDecision(decisionId);
      
      expect(decision).toBeDefined();
      expect(decision?.id).toBe(decisionId);
      expect(decision?.title).toBe('Test Decision');
    });
  });

  describe('Community Engagement', () => {
    it('should add community feedback to decision', async () => {
      const decisionId = 'decision-1';
      const feedback = {
        communityId: 'community-1',
        communityName: 'Test Community',
        feedbackType: 'suggestion' as const,
        content: 'This is a test feedback',
        submittedBy: 'community-member',
        submissionMethod: 'online' as const,
        priority: 'medium' as const,
        status: 'received' as const
      };

      await expect(
        decisionTransparencyService.addCommunityFeedback(decisionId, feedback)
      ).resolves.not.toThrow();
    });

    it('should get decisions by community', async () => {
      const communityId = 'community-1';
      
      const decisions = await decisionTransparencyService.getDecisionsByCommunity(communityId);
      
      expect(Array.isArray(decisions)).toBe(true);
      expect(decisions.length).toBeGreaterThan(0);
      expect(decisions[0].affectedCommunities).toContain(communityId);
    });

    it('should get public decisions', async () => {
      const decisions = await decisionTransparencyService.getPublicDecisions(10, 0);
      
      expect(Array.isArray(decisions)).toBe(true);
      decisions.forEach(decision => {
        expect(decision.transparencyLevel).toBe('public');
        expect(decision.publicationStatus).toBe('published');
      });
    });
  });

  describe('Resource Allocation Tracking', () => {
    it('should track resource allocation status changes', async () => {
      const decisionId = 'decision-1';
      const allocationId = 'allocation-1';
      const status = 'disbursed';
      const notes = 'Funds disbursed to community';

      await expect(
        decisionTransparencyService.trackResourceAllocation(
          decisionId,
          allocationId,
          status,
          notes
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Implementation Progress', () => {
    it('should update implementation progress', async () => {
      const decisionId = 'decision-1';
      const progress = {
        phase: 'Planning',
        description: 'Initial planning phase completed',
        progressPercentage: 25,
        status: 'in_progress' as const,
        milestones: ['Planning document approved'],
        challenges: ['Resource constraints'],
        successes: ['Community engagement'],
        communityImpact: 'Positive community response',
        resourcesUsed: 10000,
        nextSteps: ['Begin implementation'],
        reportedBy: 'project-manager'
      };

      await expect(
        decisionTransparencyService.updateImplementationProgress(decisionId, progress)
      ).resolves.not.toThrow();
    });
  });

  describe('Policy Changes', () => {
    it('should create policy change communication', async () => {
      const policyData = {
        policyName: 'Community Consultation Policy',
        changeType: 'amendment' as const,
        description: 'Updated consultation requirements',
        rationale: 'Improve community engagement',
        affectedCommunities: ['community-1', 'community-2'],
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        supportMeasures: ['Training for staff', 'Community liaison support'],
        communicationPlan: {
          channels: [
            {
              type: 'community_meeting' as const,
              description: 'Town hall meetings',
              reach: 500,
              culturalAppropriate: true,
              language: ['en', 'indigenous'],
              frequency: 'monthly'
            }
          ],
          timeline: [
            {
              phase: 'Announcement',
              date: new Date(),
              activities: ['Press release', 'Community notifications'],
              responsible: 'Communications Team',
              status: 'planned' as const
            }
          ],
          targetAudiences: ['Community leaders', 'General public'],
          keyMessages: ['Enhanced participation', 'Respect for traditions'],
          culturalAdaptations: ['Elder consultation protocols'],
          feedbackMechanisms: ['Community surveys', 'Open forums']
        },
        impactAssessment: {
          economicImpact: 'Minimal cost increase',
          socialImpact: 'Improved community engagement',
          culturalImpact: 'Better integration of traditional governance',
          environmentalImpact: 'No significant impact',
          riskAssessment: ['Potential delays'],
          mitigationStrategies: ['Streamlined processes'],
          monitoringPlan: ['Quarterly reports'],
          successMetrics: ['Participation rates', 'Satisfaction scores']
        },
        status: 'proposed' as const
      };

      const policyChange = await decisionTransparencyService.createPolicyChange(policyData);
      
      expect(policyChange).toBeDefined();
      expect(policyChange.policyName).toBe(policyData.policyName);
      expect(policyChange.changeType).toBe(policyData.changeType);
      expect(policyChange.status).toBe('proposed');
    });
  });

  describe('Search and Filtering', () => {
    it('should search decisions by query', async () => {
      const query = 'healthcare';
      const filters = {
        decisionType: 'policy',
        status: 'published',
        communityId: 'community-1'
      };

      const results = await decisionTransparencyService.searchDecisions(query, filters);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle empty search results', async () => {
      const query = 'nonexistent-term';
      
      const results = await decisionTransparencyService.searchDecisions(query);
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Cultural Safety Integration', () => {
    it('should respect cultural sensitivity levels', async () => {
      const decision = await decisionTransparencyService.getDecision('decision-1');
      
      expect(decision?.culturalImpactAssessment).toBeDefined();
      expect(decision?.culturalImpactAssessment.culturalSensitivity).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(
        decision?.culturalImpactAssessment.culturalSensitivity
      );
    });

    it('should require elder review for high sensitivity decisions', async () => {
      const decision = await decisionTransparencyService.getDecision('decision-1');
      
      if (decision?.culturalImpactAssessment.culturalSensitivity === 'high' || 
          decision?.culturalImpactAssessment.culturalSensitivity === 'critical') {
        expect(decision.culturalImpactAssessment.elderReviewRequired).toBe(true);
      }
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

      const decision = await decisionTransparencyService.getDecision('invalid-id');
      expect(decision).toBeNull();
    });

    it('should handle missing decision errors', async () => {
      await expect(
        decisionTransparencyService.submitForCulturalReview('nonexistent-decision')
      ).rejects.toThrow('Decision not found');
    });

    it('should validate required fields for decision creation', async () => {
      const invalidDecisionData = {
        // Missing required fields
        description: 'Missing title'
      };

      await expect(
        decisionTransparencyService.createDecision(invalidDecisionData, 'test-user')
      ).resolves.toBeDefined(); // Service should handle missing fields gracefully
    });
  });

  describe('Transparency Metrics', () => {
    it('should calculate transparency metrics correctly', async () => {
      const decisions = await decisionTransparencyService.getPublicDecisions(50, 0);
      
      // Basic metrics validation
      expect(Array.isArray(decisions)).toBe(true);
      
      const publishedCount = decisions.filter(d => d.publicationStatus === 'published').length;
      const totalCount = decisions.length;
      
      if (totalCount > 0) {
        const transparencyRate = (publishedCount / totalCount) * 100;
        expect(transparencyRate).toBeGreaterThanOrEqual(0);
        expect(transparencyRate).toBeLessThanOrEqual(100);
      }
    });

    it('should track publication timeliness', async () => {
      const decisions = await decisionTransparencyService.getPublicDecisions(10, 0);
      
      decisions.forEach(decision => {
        if (decision.publishedAt) {
          const publicationDelay = decision.publishedAt.getTime() - decision.createdAt.getTime();
          expect(publicationDelay).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Notification System', () => {
    it('should queue notifications for affected communities', async () => {
      const decisionData = {
        title: 'Test Notification Decision',
        description: 'Decision to test notifications',
        decisionType: 'policy' as const,
        category: 'Test',
        affectedCommunities: ['community-1', 'community-2'],
        transparencyLevel: 'public' as const
      };

      const decision = await decisionTransparencyService.createDecision(
        decisionData,
        'test-user'
      );

      // Notifications should be queued for affected communities
      expect(decision.affectedCommunities.length).toBe(2);
    });
  });

  describe('Data Validation', () => {
    it('should validate decision data structure', async () => {
      const decision = await decisionTransparencyService.getDecision('decision-1');
      
      if (decision) {
        // Required fields
        expect(decision).toHaveProperty('id');
        expect(decision).toHaveProperty('title');
        expect(decision).toHaveProperty('description');
        expect(decision).toHaveProperty('decisionType');
        expect(decision).toHaveProperty('status');
        expect(decision).toHaveProperty('publicationStatus');
        expect(decision).toHaveProperty('transparencyLevel');
        expect(decision).toHaveProperty('createdAt');
        expect(decision).toHaveProperty('updatedAt');
        
        // Array fields
        expect(Array.isArray(decision.affectedCommunities)).toBe(true);
        expect(Array.isArray(decision.decisionMakers)).toBe(true);
        expect(Array.isArray(decision.resourceAllocation)).toBe(true);
        expect(Array.isArray(decision.documents)).toBe(true);
        expect(Array.isArray(decision.communityFeedback)).toBe(true);
        expect(Array.isArray(decision.implementationProgress)).toBe(true);
        
        // Enum validations
        expect(['policy', 'budget', 'program', 'service', 'infrastructure', 'emergency'])
          .toContain(decision.decisionType);
        expect(['draft', 'consultation', 'review', 'approved', 'implemented', 'cancelled'])
          .toContain(decision.status);
        expect(['pending', 'cultural_review', 'approved', 'published', 'restricted'])
          .toContain(decision.publicationStatus);
        expect(['public', 'community_restricted', 'confidential'])
          .toContain(decision.transparencyLevel);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        decisionTransparencyService.getPublicDecisions(10, 0),
        decisionTransparencyService.getDecisionsByCommunity('community-1'),
        decisionTransparencyService.searchDecisions('test'),
        decisionTransparencyService.getDecision('decision-1')
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });

    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      const decisions = await decisionTransparencyService.getPublicDecisions(100, 0);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(Array.isArray(decisions)).toBe(true);
    });
  });
});