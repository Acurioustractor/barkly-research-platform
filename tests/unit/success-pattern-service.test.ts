import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as successPatternService from '../../src/lib/community/success-pattern-service';

// Mock external dependencies
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@/lib/ai/moonshot-client', () => ({
  moonshotClient: {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}));

// Mock Supabase
jest.mock('@/lib/db/supabase', () => ({
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

      const patterns = await successPatternService.identifySuccessPatterns(JSON.stringify(communityData));

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

  });
});