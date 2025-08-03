import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { successPatternService } from '../../src/lib/success-pattern-service';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'pattern-1',
              title: 'Community Health Initiative Success',
              description: 'Successful implementation of community-led health program',
              category: 'healthcare',
              success_metrics: {
                healthOutcomes: 85,
                communityEngagement: 92,
                sustainability: 78
              },
              implementation_factors: [
                'Strong community leadership',
                'Elder involvement',
                'Cultural integration'
              ],
              replication_potential: 'high',
              communities_implemented: ['community-1', 'community-2'],
              created_at: new Date().toISOString()
            }, 
            error: null 
          })),
          order: jest.fn(() => Promise.resolve({ 
            data: [
              {
                id: 'pattern-1',
                title: 'Healthcare Success Pattern',
                category: 'healthcare',
                success_score: 85,
                replication_potential: 'high',
                created_at: new Date().toISOString()
              }
            ], 
            error: null 
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

describe('Success Pattern Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pattern Identification', () => {
    it('should identify success patterns from community data', async () => {
      const communityData = {
        communityId: 'community-1',
        programs: [
          {
            name: 'Community Health Program',
            outcomes: { healthImprovement: 85, participation: 90 },
            duration: 12,
            budget: 50000
          }
        ],
        stories: [
          {
            content: 'The health program has been very successful with strong community participation',
            themes: ['healthcare', 'community engagement']
          }
        ]
      };

      const patterns = await successPatternService.identifySuccessPatterns(communityData);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should calculate success scores accurately', async () => {
      const programData = {
        outcomes: {
          primaryMetric: 85,
          secondaryMetric: 78,
          participationRate: 92
        },
        sustainability: {
          funding: 'secured',
          communitySupport: 'high',
          institutionalSupport: 'medium'
        },
        culturalAlignment: 0.9
      };

      const successScore = await successPatternService.calculateSuccessScore(programData);

      expect(successScore).toBeDefined();
      expect(typeof successScore).toBe('number');
      expect(successScore).toBeGreaterThanOrEqual(0);
      expect(successScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Pattern Storage and Retrieval', () => {
    it('should store identified success patterns', async () => {
      const pattern = {
        title: 'Youth Education Program Success',
        description: 'Successful implementation of culturally integrated youth education',
        category: 'education',
        communityId: 'community-1',
        successMetrics: {
          academicImprovement: 88,
          culturalEngagement: 95,
          communitySupport: 90
        },
        implementationFactors: [
          'Elder teaching integration',
          'Community involvement',
          'Cultural curriculum'
        ],
        replicationPotential: 'high'
      };

      const result = await successPatternService.storePattern(pattern);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should retrieve patterns by category', async () => {
      const category = 'healthcare';
      const patterns = await successPatternService.getPatternsByCategory(category);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing pattern data', async () => {
      const nonexistentId = 'nonexistent-pattern';

      await expect(
        successPatternService.getPatternById(nonexistentId)
      ).rejects.toThrow();
    });
  });
});