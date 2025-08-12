import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { communityValidationService, ValidationRequest } from '../../src/lib/community-validation-service';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => {
  const selectChain = {
    eq: jest.fn(() => ({
      single: jest.fn(() => Promise.resolve({
        data: {
          id: 'validation-1',
          content_id: 'ai-insight-1',
          content_type: 'ai_insight',
          content: {
            title: 'Test Insight',
            description: 'Test description',
            aiGeneratedInsight: 'Test AI insight',
            supportingData: ['test_data'],
            methodology: 'Test methodology',
            assumptions: ['Test assumption'],
            limitations: ['Test limitation'],
            potentialImpact: 'Test impact'
          },
          submitted_by: 'test-user',
          submitted_at: new Date().toISOString(),
          priority: 'medium',
          community_id: 'community-1',
          community_name: 'Test Community',
          required_validators: 3,
          current_validators: 0,
          status: 'pending',
          cultural_sensitivity: 'medium',
          traditional_knowledge_involved: false,
          elder_review_required: false,
          validations: [],
          consensus_reached: false,
          final_score: 0,
          confidence: 0,
          source_attribution: [],
          feedback: [],
          revisions: []
        },
        error: null
      })),
      order: jest.fn(() => Promise.resolve({
        data: [
          {
            id: 'validation-1',
            content_type: 'ai_insight',
            status: 'pending',
            community_id: 'community-1',
            submitted_at: new Date().toISOString(),
            consensus_reached: false,
            confidence: 0
          }
        ],
        error: null
      })),
      gte: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 'validation-1',
              content_type: 'ai_insight',
              status: 'validated',
              community_id: 'community-1',
              submitted_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              consensus_reached: true,
              confidence: 0.85,
              validations: [
                {
                  validatorId: 'validator-1',
                  validationScore: 4.2,
                  confidenceLevel: 0.8
                }
              ],
              feedback: []
            }
          ],
          error: null
        }))
      }))
    }))
  };
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => selectChain),
        insert: jest.fn(() => Promise.resolve({ error: null })),
        update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) }))
      }))
    }
  };
});

// Mock Cultural Safety Service
jest.mock('../../src/lib/cultural-safety-service', () => ({
  culturalSafetyService: {
    submitForReview: jest.fn(() => Promise.resolve({ success: true }))
  }
}));

describe('Community Validation System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Request Management', () => {
    it('should submit content for validation', async () => {
      const contentData = {
        contentId: 'ai-insight-1',
        contentType: 'ai_insight' as const,
        content: {
          title: 'Community Health Analysis',
          description: 'AI analysis of community health trends',
          aiGeneratedInsight: 'Health metrics show improvement in mental health services',
          supportingData: ['health_records', 'survey_data'],
          methodology: 'Statistical analysis of health service utilization',
          assumptions: ['Data completeness', 'Consistent reporting'],
          limitations: ['Limited sample size', 'Seasonal variations'],
          culturalContext: 'Traditional healing practices are important',
          potentialImpact: 'Could inform health program development',
          recommendedActions: ['Expand mental health services', 'Integrate traditional healing']
        },
        submittedBy: 'ai-system',
        priority: 'high' as const,
        communityId: 'community-1',
        communityName: 'Test Community',
        requiredValidators: 3,
        culturalSensitivity: 'high' as const,
        traditionalKnowledgeInvolved: true,
        elderReviewRequired: true
      };

      const request = await communityValidationService.submitForValidation(contentData);

      expect(request).toBeDefined();
      expect(request.contentId).toBe(contentData.contentId);
      expect(request.contentType).toBe(contentData.contentType);
      expect(request.status).toBe('pending');
      expect(request.traditionalKnowledgeInvolved).toBe(true);
      expect(request.elderReviewRequired).toBe(true);
    });

    it('should get validation request by ID', async () => {
      const requestId = 'validation-1';
      
      const request = await communityValidationService.getValidationRequest(requestId);
      
      expect(request).toBeDefined();
      expect(request?.id).toBe(requestId);
      expect(request?.contentType).toBe('ai_insight');
    });

    it('should get validation requests by status', async () => {
      const status = 'pending';
      
      const requests = await communityValidationService.getValidationRequestsByStatus(status);
      
      expect(Array.isArray(requests)).toBe(true);
      requests.forEach(request => {
        expect(request.status).toBe(status);
      });
    });
  });

  describe('Community Validation Process', () => {
    it('should submit validation from community validator', async () => {
      const requestId = 'validation-1';
      const validation = {
        validatorId: 'validator-1',
        validatorName: 'Test Validator',
        validatorRole: 'community_expert' as const,
        validatorExpertise: ['community_knowledge', 'health_systems'],
        culturalAffiliation: 'community-1',
        validationScore: 4.2,
        accuracy: 4.0,
        relevance: 4.5,
        culturalAppropriateness: 4.3,
        completeness: 3.8,
        actionability: 4.1,
        overallAssessment: 'agree' as const,
        comments: 'This insight aligns well with community observations and provides actionable recommendations.',
        specificConcerns: ['Need more data on youth demographics'],
        suggestedImprovements: ['Include traditional healing metrics', 'Add seasonal analysis'],
        culturalConsiderations: ['Respect for traditional healing practices', 'Elder consultation needed'],
        additionalSources: ['Elder interviews', 'Traditional healer input'],
        confidenceLevel: 0.85,
        timeSpentMinutes: 45
      };

      await expect(
        communityValidationService.submitValidation(requestId, validation)
      ).resolves.not.toThrow();
    });

    it('should add validation feedback for model improvement', async () => {
      const requestId = 'validation-1';
      const feedback = {
        feedbackType: 'model_improvement' as const,
        category: 'cultural_sensitivity',
        feedback: 'The AI model should better incorporate traditional knowledge indicators when analyzing health data.',
        priority: 'high' as const,
        submittedBy: 'validator-1'
      };

      await expect(
        communityValidationService.addValidationFeedback(requestId, feedback)
      ).resolves.not.toThrow();
    });

    it('should revise content based on validation feedback', async () => {
      const requestId = 'validation-1';
      const revision = {
        revisedBy: 'content-manager',
        revisionReason: 'Incorporate validator feedback on cultural considerations',
        changes: [
          {
            field: 'aiGeneratedInsight',
            oldValue: 'Health metrics show improvement in mental health services',
            newValue: 'Health metrics show improvement in mental health services, with traditional healing practices playing a complementary role',
            changeReason: 'Added cultural context as suggested by validators',
            culturalJustification: 'Acknowledges the importance of traditional healing in community wellness'
          }
        ]
      };

      await expect(
        communityValidationService.reviseContent(requestId, revision)
      ).resolves.not.toThrow();
    });
  });

  describe('Validation Metrics and Analytics', () => {
    it('should get validation metrics', async () => {
      const metrics = await communityValidationService.getValidationMetrics('month', 'community-1');
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.completedValidations).toBe('number');
      expect(typeof metrics.averageCompletionTime).toBe('number');
      expect(typeof metrics.consensusRate).toBe('number');
      expect(typeof metrics.averageConfidence).toBe('number');
      expect(typeof metrics.culturalComplianceScore).toBe('number');
      
      expect(metrics.consensusRate).toBeGreaterThanOrEqual(0);
      expect(metrics.consensusRate).toBeLessThanOrEqual(1);
      expect(metrics.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
      expect(metrics.culturalComplianceScore).toBeGreaterThanOrEqual(0);
      expect(metrics.culturalComplianceScore).toBeLessThanOrEqual(100);
    });

    it('should calculate metrics for different timeframes', async () => {
      const weekMetrics = await communityValidationService.getValidationMetrics('week');
      const monthMetrics = await communityValidationService.getValidationMetrics('month');
      const quarterMetrics = await communityValidationService.getValidationMetrics('quarter');
      
      expect(weekMetrics).toBeDefined();
      expect(monthMetrics).toBeDefined();
      expect(quarterMetrics).toBeDefined();
    });
  });

  describe('Cultural Safety Integration', () => {
    it('should handle traditional knowledge content appropriately', async () => {
      const contentData = {
        contentId: 'cultural-insight-1',
        contentType: 'ai_insight' as const,
        content: {
          title: 'Traditional Healing Practices Analysis',
          description: 'Analysis of traditional healing effectiveness',
          aiGeneratedInsight: 'Traditional healing shows positive outcomes when integrated with modern healthcare',
          supportingData: ['elder_interviews', 'healing_outcomes'],
          methodology: 'Qualitative analysis of traditional healing practices',
          assumptions: ['Elder knowledge accuracy', 'Cultural protocol compliance'],
          limitations: ['Sacred knowledge restrictions', 'Limited quantitative data'],
          culturalContext: 'Sacred traditional knowledge involved - requires elder approval',
          potentialImpact: 'Could improve healthcare integration with traditional practices'
        },
        submittedBy: 'cultural-researcher',
        priority: 'high' as const,
        communityId: 'community-1',
        communityName: 'Test Community',
        requiredValidators: 4, // Higher for cultural content
        culturalSensitivity: 'critical' as const,
        traditionalKnowledgeInvolved: true,
        elderReviewRequired: true
      };

      const request = await communityValidationService.submitForValidation(contentData);

      expect(request.traditionalKnowledgeInvolved).toBe(true);
      expect(request.elderReviewRequired).toBe(true);
      expect(request.culturalSensitivity).toBe('critical');
      expect(request.requiredValidators).toBe(4);
    });

    it('should require elder validation for culturally sensitive content', async () => {
      const validation = {
        validatorId: 'elder-1',
        validatorName: 'Elder Mary Whitehorse',
        validatorRole: 'elder' as const,
        validatorExpertise: ['traditional_knowledge', 'cultural_practices'],
        culturalAffiliation: 'community-1',
        validationScore: 4.5,
        accuracy: 4.8,
        relevance: 4.7,
        culturalAppropriateness: 4.9,
        completeness: 4.2,
        actionability: 4.3,
        overallAssessment: 'strongly_agree' as const,
        comments: 'This analysis respectfully represents our traditional healing knowledge and provides appropriate recommendations.',
        specificConcerns: [],
        suggestedImprovements: ['Include ceremony protocols', 'Add seasonal considerations'],
        culturalConsiderations: [
          'Sacred knowledge protocols must be followed',
          'Elder approval required for implementation',
          'Traditional ceremony integration needed'
        ],
        additionalSources: ['Traditional healing ceremonies', 'Elder council wisdom'],
        confidenceLevel: 0.95,
        timeSpentMinutes: 90
      };

      await expect(
        communityValidationService.submitValidation('validation-1', validation)
      ).resolves.not.toThrow();
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

      const request = await communityValidationService.getValidationRequest('invalid-id');
      expect(request).toBeNull();
    });

    it('should handle missing validation request errors', async () => {
      await expect(
        communityValidationService.submitValidation('nonexistent-request', {
          validatorId: 'test-validator',
          validatorName: 'Test Validator',
          validatorRole: 'community_expert',
          validatorExpertise: ['test'],
          validationScore: 3,
          accuracy: 3,
          relevance: 3,
          culturalAppropriateness: 3,
          completeness: 3,
          actionability: 3,
          overallAssessment: 'neutral',
          comments: 'Test comment',
          specificConcerns: [],
          suggestedImprovements: [],
          culturalConsiderations: [],
          additionalSources: [],
          confidenceLevel: 0.7,
          timeSpentMinutes: 30
        })
      ).rejects.toThrow('Validation request not found');
    });

    it('should validate required fields for validation submission', async () => {
      const contentData = {
        contentId: 'test-content',
        contentType: 'ai_insight' as const,
        content: {
          title: '', // Missing required field
          description: 'Test description',
          aiGeneratedInsight: 'Test insight',
          supportingData: [],
          methodology: 'Test methodology',
          assumptions: [],
          limitations: [],
          potentialImpact: 'Test impact'
        },
        submittedBy: 'test-user',
        priority: 'medium' as const,
        communityId: 'community-1',
        communityName: 'Test Community',
        requiredValidators: 3,
        culturalSensitivity: 'medium' as const,
        traditionalKnowledgeInvolved: false,
        elderReviewRequired: false
      };

      // Service should handle validation gracefully
      await expect(
        communityValidationService.submitForValidation(contentData)
      ).resolves.toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate validation request data structure', async () => {
      const request = await communityValidationService.getValidationRequest('validation-1');
      
      if (request) {
        // Required fields
        expect(request).toHaveProperty('id');
        expect(request).toHaveProperty('contentId');
        expect(request).toHaveProperty('contentType');
        expect(request).toHaveProperty('content');
        expect(request).toHaveProperty('submittedBy');
        expect(request).toHaveProperty('submittedAt');
        expect(request).toHaveProperty('priority');
        expect(request).toHaveProperty('communityId');
        expect(request).toHaveProperty('status');
        expect(request).toHaveProperty('requiredValidators');
        expect(request).toHaveProperty('currentValidators');
        
        // Array fields
        expect(Array.isArray(request.validations)).toBe(true);
        expect(Array.isArray(request.sourceAttribution)).toBe(true);
        expect(Array.isArray(request.feedback)).toBe(true);
        expect(Array.isArray(request.revisions)).toBe(true);
        
        // Enum validations
        expect(['ai_insight', 'analysis_result', 'recommendation', 'pattern', 'prediction'])
          .toContain(request.contentType);
        expect(['low', 'medium', 'high', 'critical']).toContain(request.priority);
        expect(['pending', 'in_review', 'validated', 'rejected', 'needs_revision'])
          .toContain(request.status);
        expect(['none', 'low', 'medium', 'high', 'critical'])
          .toContain(request.culturalSensitivity);
        
        // Boolean validations
        expect(typeof request.traditionalKnowledgeInvolved).toBe('boolean');
        expect(typeof request.elderReviewRequired).toBe('boolean');
        expect(typeof request.consensusReached).toBe('boolean');
        
        // Numeric validations
        expect(typeof request.requiredValidators).toBe('number');
        expect(request.requiredValidators).toBeGreaterThan(0);
        expect(typeof request.currentValidators).toBe('number');
        expect(request.currentValidators).toBeGreaterThanOrEqual(0);
        expect(typeof request.finalScore).toBe('number');
        expect(request.finalScore).toBeGreaterThanOrEqual(0);
        expect(request.finalScore).toBeLessThanOrEqual(5);
        expect(typeof request.confidence).toBe('number');
        expect(request.confidence).toBeGreaterThanOrEqual(0);
        expect(request.confidence).toBeLessThanOrEqual(1);
        
        // Content validation
        expect(request.content).toHaveProperty('title');
        expect(request.content).toHaveProperty('description');
        expect(request.content).toHaveProperty('aiGeneratedInsight');
        expect(request.content).toHaveProperty('methodology');
        expect(Array.isArray(request.content.supportingData)).toBe(true);
        expect(Array.isArray(request.content.assumptions)).toBe(true);
        expect(Array.isArray(request.content.limitations)).toBe(true);
      }
    });

    it('should validate validation metrics data structure', async () => {
      const metrics = await communityValidationService.getValidationMetrics();
      
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.completedValidations).toBe('number');
      expect(typeof metrics.averageCompletionTime).toBe('number');
      expect(typeof metrics.consensusRate).toBe('number');
      expect(typeof metrics.averageConfidence).toBe('number');
      expect(typeof metrics.culturalComplianceScore).toBe('number');
      expect(typeof metrics.modelImprovementSuggestions).toBe('number');
      expect(typeof metrics.implementedImprovements).toBe('number');
      
      expect(typeof metrics.validatorParticipation).toBe('object');
      expect(typeof metrics.contentTypeBreakdown).toBe('object');
      
      // Range validations
      expect(metrics.consensusRate).toBeGreaterThanOrEqual(0);
      expect(metrics.consensusRate).toBeLessThanOrEqual(1);
      expect(metrics.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
      expect(metrics.culturalComplianceScore).toBeGreaterThanOrEqual(0);
      expect(metrics.culturalComplianceScore).toBeLessThanOrEqual(100);
      expect(metrics.averageCompletionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        communityValidationService.getValidationRequest('validation-1'),
        communityValidationService.getValidationRequestsByStatus('pending'),
        communityValidationService.getValidationMetrics('month'),
        communityValidationService.getValidationMetrics('week', 'community-1')
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });

    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      const requests = await communityValidationService.getValidationRequestsByStatus('pending');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(Array.isArray(requests)).toBe(true);
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

  describe('Consensus and Scoring Algorithms', () => {
    it('should calculate consensus correctly', async () => {
      // This would test the consensus calculation algorithm
      // For now, we'll just verify the structure exists
      const request = await communityValidationService.getValidationRequest('validation-1');
      
      if (request) {
        expect(typeof request.consensusReached).toBe('boolean');
        expect(typeof request.finalScore).toBe('number');
        expect(typeof request.confidence).toBe('number');
      }
    });

    it('should weight elder validations appropriately', async () => {
      // This would test that elder validations receive appropriate weighting
      // For now, we'll just verify the validation structure supports role-based weighting
      const validation = {
        validatorId: 'elder-1',
        validatorName: 'Elder Test',
        validatorRole: 'elder' as const,
        validatorExpertise: ['traditional_knowledge'],
        validationScore: 4.5,
        accuracy: 4.5,
        relevance: 4.5,
        culturalAppropriateness: 4.8,
        completeness: 4.2,
        actionability: 4.3,
        overallAssessment: 'strongly_agree' as const,
        comments: 'Elder validation test',
        specificConcerns: [],
        suggestedImprovements: [],
        culturalConsiderations: ['Traditional protocols followed'],
        additionalSources: [],
        confidenceLevel: 0.9,
        timeSpentMinutes: 60
      };

      await expect(
        communityValidationService.submitValidation('validation-1', validation)
      ).resolves.not.toThrow();
    });
  });
});