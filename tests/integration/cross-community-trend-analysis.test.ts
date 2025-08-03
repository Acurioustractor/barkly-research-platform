import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CrossCommunityTrendAnalysisService } from '../../src/lib/cross-community-trend-analysis';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-analysis-1',
              analysis_type: 'community_health',
              timeframe: 'monthly',
              communities: ['community-1', 'community-2'],
              confidence: 0.85,
              generated_at: new Date().toISOString()
            },
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'community-1',
                  name: 'Test Community 1',
                  cultural_context: 'indigenous',
                  population: 2500,
                  geographic_region: 'northern'
                },
                {
                  id: 'community-2',
                  name: 'Test Community 2',
                  cultural_context: 'rural',
                  population: 1800,
                  geographic_region: 'southern'
                }
              ],
              error: null
            }))
          }))
        })),
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'health-1',
                  community_id: 'community-1',
                  overall_score: 75.5,
                  updated_at: new Date().toISOString()
                }
              ],
              error: null
            }))
          }))
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock AI service
jest.mock('../../src/lib/ai-service', () => ({
  analyzeDocument: jest.fn(() => Promise.resolve({
    analysis: JSON.stringify({
      concerns: ['Limited healthcare access', 'Youth engagement'],
      successes: ['Strong cultural programs', 'Community leadership']
    })
  }))
}));

describe('CrossCommunityTrendAnalysisService', () => {
  let service: CrossCommunityTrendAnalysisService;

  beforeEach(() => {
    service = new CrossCommunityTrendAnalysisService();
    jest.clearAllMocks();
  });

  describe('Trend Analysis', () => {
    it('should perform comprehensive trend analysis', async () => {
      const analysis = await service.performTrendAnalysis(
        'community_health',
        'monthly',
        ['community-1', 'community-2']
      );

      expect(analysis).toBeDefined();
      expect(analysis.analysisType).toBe('community_health');
      expect(analysis.timeframe).toBe('monthly');
      expect(analysis.communities).toEqual(['community-1', 'community-2']);
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(analysis.trendData)).toBe(true);
      expect(Array.isArray(analysis.insights)).toBe(true);
      expect(Array.isArray(analysis.patterns)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should handle analysis without specific communities', async () => {
      const analysis = await service.performTrendAnalysis(
        'service_effectiveness',
        'quarterly'
      );

      expect(analysis).toBeDefined();
      expect(analysis.analysisType).toBe('service_effectiveness');
      expect(analysis.timeframe).toBe('quarterly');
      expect(Array.isArray(analysis.communities)).toBe(true);
    });

    it('should generate different analysis types', async () => {
      const analysisTypes = [
        'community_health',
        'service_effectiveness',
        'emerging_needs',
        'cultural_patterns',
        'resource_allocation'
      ] as const;

      for (const type of analysisTypes) {
        const analysis = await service.performTrendAnalysis(type, 'monthly');
        expect(analysis.analysisType).toBe(type);
      }
    });

    it('should handle different timeframes', async () => {
      const timeframes = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;

      for (const timeframe of timeframes) {
        const analysis = await service.performTrendAnalysis('community_health', timeframe);
        expect(analysis.timeframe).toBe(timeframe);
      }
    });

    it('should calculate appropriate confidence levels', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Service Effectiveness Analysis', () => {
    it('should analyze service effectiveness', async () => {
      const effectiveness = await service.analyzeServiceEffectiveness('health_services', 'quarterly');

      expect(effectiveness).toBeDefined();
      expect(effectiveness.serviceType).toBe('health_services');
      expect(typeof effectiveness.overallEffectiveness).toBe('number');
      expect(Array.isArray(effectiveness.communityVariations)).toBe(true);
      expect(Array.isArray(effectiveness.bestPractices)).toBe(true);
      expect(Array.isArray(effectiveness.improvementOpportunities)).toBe(true);
    });

    it('should handle different service types', async () => {
      const serviceTypes = ['health_services', 'education', 'social_services', 'cultural_programs'];

      for (const serviceType of serviceTypes) {
        const effectiveness = await service.analyzeServiceEffectiveness(serviceType);
        expect(effectiveness.serviceType).toBe(serviceType);
      }
    });

    it('should provide actionable insights', async () => {
      const effectiveness = await service.analyzeServiceEffectiveness('health_services');

      expect(effectiveness.overallEffectiveness).toBeGreaterThanOrEqual(0);
      expect(effectiveness.overallEffectiveness).toBeLessThanOrEqual(100);
    });
  });

  describe('Emerging Needs Detection', () => {
    it('should detect emerging needs', async () => {
      const emergingNeeds = await service.detectEmergingNeeds('monthly');

      expect(Array.isArray(emergingNeeds)).toBe(true);
      
      emergingNeeds.forEach(need => {
        expect(need.needCategory).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(need.urgency);
        expect(['increasing', 'stable', 'decreasing']).toContain(need.trendDirection);
        expect(need.prevalence).toBeGreaterThanOrEqual(0);
        expect(need.prevalence).toBeLessThanOrEqual(100);
        expect(Array.isArray(need.affectedCommunities)).toBe(true);
        expect(Array.isArray(need.rootCauses)).toBe(true);
        expect(Array.isArray(need.potentialSolutions)).toBe(true);
      });
    });

    it('should handle different timeframes for needs detection', async () => {
      const timeframes = ['weekly', 'monthly', 'quarterly'] as const;

      for (const timeframe of timeframes) {
        const needs = await service.detectEmergingNeeds(timeframe);
        expect(Array.isArray(needs)).toBe(true);
      }
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize different pattern types', async () => {
      const patternTypes = [
        'seasonal',
        'geographic',
        'demographic',
        'cultural',
        'economic',
        'service_related'
      ] as const;

      for (const patternType of patternTypes) {
        const patterns = await service.recognizePatterns(patternType, 12);
        
        expect(Array.isArray(patterns)).toBe(true);
        patterns.forEach(pattern => {
          expect(pattern.patternType).toBe(patternType);
          expect(['recurring', 'emerging', 'declining']).toContain(pattern.frequency);
          expect(pattern.strength).toBeGreaterThanOrEqual(0);
          expect(pattern.strength).toBeLessThanOrEqual(1);
          expect(pattern.predictability).toBeGreaterThanOrEqual(0);
          expect(pattern.predictability).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should handle different lookback periods', async () => {
      const lookbackPeriods = [3, 6, 12, 24];

      for (const period of lookbackPeriods) {
        const patterns = await service.recognizePatterns('seasonal', period);
        expect(Array.isArray(patterns)).toBe(true);
      }
    });

    it('should cache pattern recognition results', async () => {
      // First call
      const patterns1 = await service.recognizePatterns('cultural', 12);
      
      // Second call with same parameters should use cache
      const patterns2 = await service.recognizePatterns('cultural', 12);
      
      expect(patterns1).toEqual(patterns2);
    });
  });

  describe('Data Collection and Processing', () => {
    it('should collect trend data from multiple sources', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      expect(analysis.trendData.length).toBeGreaterThan(0);
      
      analysis.trendData.forEach(dataPoint => {
        expect(dataPoint.communityId).toBeDefined();
        expect(dataPoint.communityName).toBeDefined();
        expect(dataPoint.timestamp).toBeDefined();
        expect(typeof dataPoint.metrics).toBe('object');
        expect(typeof dataPoint.qualitativeData).toBe('object');
        expect(dataPoint.culturalContext).toBeDefined();
        expect(typeof dataPoint.population).toBe('number');
        expect(dataPoint.geographicRegion).toBeDefined();
      });
    });

    it('should handle missing or incomplete data gracefully', async () => {
      // Mock empty data response
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      });

      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      expect(analysis).toBeDefined();
      expect(Array.isArray(analysis.trendData)).toBe(true);
    });
  });

  describe('Insight Generation', () => {
    it('should generate meaningful insights', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      analysis.insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(['positive_trend', 'negative_trend', 'emerging_pattern', 'anomaly', 'correlation']).toContain(insight.type);
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(Array.isArray(insight.affectedCommunities)).toBe(true);
        expect(['weak', 'moderate', 'strong']).toContain(insight.strength);
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(insight.implications)).toBe(true);
        expect(Array.isArray(insight.culturalConsiderations)).toBe(true);
      });
    });

    it('should generate culturally appropriate insights', async () => {
      const analysis = await service.performTrendAnalysis('cultural_patterns', 'monthly');
      
      const culturalInsights = analysis.insights.filter(insight => 
        insight.culturalConsiderations.length > 0
      );
      
      expect(culturalInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate actionable recommendations', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      analysis.recommendations.forEach(recommendation => {
        expect(recommendation.id).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(recommendation.priority);
        expect(['policy', 'resource_allocation', 'service_improvement', 'capacity_building', 'collaboration']).toContain(recommendation.type);
        expect(recommendation.title).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(Array.isArray(recommendation.targetCommunities)).toBe(true);
        expect(recommendation.expectedImpact).toBeDefined();
        expect(recommendation.timeframe).toBeDefined();
        expect(Array.isArray(recommendation.resources)).toBe(true);
        expect(Array.isArray(recommendation.stakeholders)).toBe(true);
        expect(Array.isArray(recommendation.successMetrics)).toBe(true);
      });
    });

    it('should prioritize recommendations appropriately', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      const criticalRecs = analysis.recommendations.filter(r => r.priority === 'critical');
      const highRecs = analysis.recommendations.filter(r => r.priority === 'high');
      
      // Critical recommendations should have more urgent timeframes
      criticalRecs.forEach(rec => {
        expect(rec.timeframe).toMatch(/weeks|1-2 months|immediate/i);
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save trend analysis to database', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      const { supabase } = require('../../src/lib/supabase');
      expect(supabase.from).toHaveBeenCalledWith('cross_community_trend_analyses');
    });

    it('should retrieve saved trend analysis', async () => {
      const analysisId = 'test-analysis-1';
      const analysis = await service.getTrendAnalysis(analysisId);
      
      expect(analysis).toBeDefined();
      expect(analysis?.id).toBe(analysisId);
    });

    it('should return null for non-existent analysis', async () => {
      // Mock not found response
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      });

      const analysis = await service.getTrendAnalysis('non-existent');
      expect(analysis).toBeNull();
    });

    it('should retrieve recent trend analyses', async () => {
      const analyses = await service.getRecentTrendAnalyses(5);
      
      expect(Array.isArray(analyses)).toBe(true);
      expect(analyses.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate correlations correctly', async () => {
      // Test correlation calculation with known data
      const service = new CrossCommunityTrendAnalysisService();
      
      // Access private method for testing
      const calculateCorrelation = (service as any).calculateCorrelation;
      
      // Perfect positive correlation
      const perfectPositive = calculateCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
      expect(perfectPositive).toBeCloseTo(1, 2);
      
      // Perfect negative correlation
      const perfectNegative = calculateCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
      expect(perfectNegative).toBeCloseTo(-1, 2);
      
      // No correlation
      const noCorrelation = calculateCorrelation([1, 2, 3, 4, 5], [3, 1, 4, 1, 5]);
      expect(Math.abs(noCorrelation)).toBeLessThan(0.5);
    });

    it('should handle edge cases in correlation calculation', async () => {
      const service = new CrossCommunityTrendAnalysisService();
      const calculateCorrelation = (service as any).calculateCorrelation;
      
      // Empty arrays
      expect(calculateCorrelation([], [])).toBe(0);
      
      // Mismatched lengths
      expect(calculateCorrelation([1, 2, 3], [1, 2])).toBe(0);
      
      // Constant values
      expect(calculateCorrelation([5, 5, 5, 5], [3, 3, 3, 3])).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      });

      await expect(
        service.performTrendAnalysis('community_health', 'monthly')
      ).rejects.toThrow();
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service error
      const { analyzeDocument } = require('../../src/lib/ai-service');
      analyzeDocument.mockRejectedValueOnce(new Error('AI service unavailable'));

      // Should still complete analysis without AI insights
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      expect(analysis).toBeDefined();
    });

    it('should handle invalid parameters', async () => {
      await expect(
        service.performTrendAnalysis('invalid_type' as any, 'monthly')
      ).rejects.toThrow();

      await expect(
        service.performTrendAnalysis('community_health', 'invalid_timeframe' as any)
      ).rejects.toThrow();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache analysis results', async () => {
      const analysis1 = await service.performTrendAnalysis('community_health', 'monthly');
      
      // Verify analysis is cached
      const cachedAnalysis = await service.getTrendAnalysis(analysis1.id);
      expect(cachedAnalysis).toEqual(analysis1);
    });

    it('should handle concurrent analysis requests', async () => {
      const promises = [
        service.performTrendAnalysis('community_health', 'monthly'),
        service.performTrendAnalysis('service_effectiveness', 'quarterly'),
        service.performTrendAnalysis('emerging_needs', 'weekly')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full trend analysis workflow', async () => {
      // 1. Perform trend analysis
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      expect(analysis).toBeDefined();

      // 2. Analyze service effectiveness
      const effectiveness = await service.analyzeServiceEffectiveness('health_services');
      expect(effectiveness).toBeDefined();

      // 3. Detect emerging needs
      const emergingNeeds = await service.detectEmergingNeeds('monthly');
      expect(Array.isArray(emergingNeeds)).toBe(true);

      // 4. Recognize patterns
      const patterns = await service.recognizePatterns('cultural', 12);
      expect(Array.isArray(patterns)).toBe(true);

      // 5. Retrieve saved analysis
      const savedAnalysis = await service.getTrendAnalysis(analysis.id);
      expect(savedAnalysis).toBeDefined();
    });

    it('should handle multi-community analysis', async () => {
      const communityIds = ['community-1', 'community-2', 'community-3'];
      
      const analysis = await service.performTrendAnalysis(
        'community_health',
        'monthly',
        communityIds
      );

      expect(analysis.communities).toEqual(communityIds);
      expect(analysis.trendData.length).toBeGreaterThan(0);
      
      // Should have insights that consider multiple communities
      const multiCommunityInsights = analysis.insights.filter(insight =>
        insight.affectedCommunities.length > 1
      );
      
      expect(multiCommunityInsights.length).toBeGreaterThan(0);
    });

    it('should generate comprehensive recommendations', async () => {
      const analysis = await service.performTrendAnalysis('community_health', 'monthly');
      
      // Should have recommendations with different priorities
      const priorities = [...new Set(analysis.recommendations.map(r => r.priority))];
      expect(priorities.length).toBeGreaterThan(1);
      
      // Should have recommendations with different types
      const types = [...new Set(analysis.recommendations.map(r => r.type))];
      expect(types.length).toBeGreaterThan(1);
      
      // All recommendations should have required fields
      analysis.recommendations.forEach(rec => {
        expect(rec.title).toBeTruthy();
        expect(rec.description).toBeTruthy();
        expect(rec.expectedImpact).toBeTruthy();
        expect(rec.timeframe).toBeTruthy();
        expect(rec.resources.length).toBeGreaterThan(0);
        expect(rec.stakeholders.length).toBeGreaterThan(0);
        expect(rec.successMetrics.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Cross-Community Trend Analysis API Integration', () => {
  it('should handle API requests correctly', async () => {
    // This would test the API endpoints
    // For now, we verify the service methods work as expected
    const service = new CrossCommunityTrendAnalysisService();
    
    const analysis = await service.performTrendAnalysis('community_health', 'monthly');
    expect(analysis).toBeDefined();
    
    const recentAnalyses = await service.getRecentTrendAnalyses(5);
    expect(Array.isArray(recentAnalyses)).toBe(true);
  });
});