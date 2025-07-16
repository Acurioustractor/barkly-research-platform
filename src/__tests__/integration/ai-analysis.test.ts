/**
 * Integration tests for AI analysis system
 * Tests multi-provider AI functionality, analysis pipelines, and error handling
 */

import { describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  makeAPIRequest,
  createMockAIAnalysisRequest,
  validateAIAnalysisResponse,
  withTimeout,
  retryOperation,
  validateTestEnvironment,
  validateCulturalCompliance,
  TEST_CONFIG,
} from './test-utils';
import { setupMockFetch } from './mock-responses';

describe('AI Analysis Integration Tests', () => {
  let testContent: string;

  beforeAll(async () => {
    // Setup mock fetch responses
    setupMockFetch();
    
    // Validate AI providers are available
    const envCheck = validateTestEnvironment();
    if (!envCheck.isValid) {
      console.warn('AI test environment issues:', envCheck.errors);
    }

    // Sample content for analysis
    testContent = `
      Young people in the Barkly region face unique challenges and opportunities. 
      
      Education is a critical pathway for youth development, with many students 
      expressing interest in both traditional knowledge and modern learning approaches.
      
      Cultural identity remains strong among Indigenous youth, who value connection 
      to country and community elders. They emphasize the importance of maintaining 
      cultural practices while embracing new technologies.
      
      Health and wellbeing concerns include mental health support and access to 
      recreational activities. Youth consistently mention the need for safe spaces 
      and community programs.
      
      Employment opportunities are limited, but there's interest in entrepreneurship 
      and community-based enterprises that align with cultural values.
    `;
  });

  describe('AI Provider Configuration', () => {
    test('should check AI provider availability', async () => {
      const response = await makeAPIRequest('/ai/config');
      
      expect(response.status).toBe(200);
      const config = await response.json();
      
      expect(config.providers).toBeDefined();
      expect(config.currentProvider).toBeDefined();
      expect(config.isHealthy).toBe(true);
      
      // Should have at least one provider available
      expect(config.providers.length).toBeGreaterThan(0);
    });

    test('should show provider status and capabilities', async () => {
      const response = await makeAPIRequest('/ai/status');
      
      expect(response.status).toBe(200);
      const status = await response.json();
      
      expect(status.providers).toBeDefined();
      
      // Check each provider status
      Object.entries(status.providers).forEach(([provider, info]: [string, any]) => {
        expect(info.available).toBeDefined();
        if (info.available) {
          expect(info.models).toBeDefined();
          expect(info.rateLimit).toBeDefined();
        }
      });
    });
  });

  describe('Basic AI Analysis', () => {
    test('should perform quick analysis', async () => {
      const analysisRequest = createMockAIAnalysisRequest(testContent, 'quick');
      
      const response = await withTimeout(
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(analysisRequest),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(validateAIAnalysisResponse(result)).toBe(true);
      expect(result.analysisType).toBe('quick');
      expect(result.processingTime).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);

    test('should perform standard analysis with themes and quotes', async () => {
      const analysisRequest = createMockAIAnalysisRequest(testContent, 'standard');
      
      const response = await withTimeout(
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(analysisRequest),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.themes).toBeDefined();
      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.quotes).toBeDefined();
      expect(result.insights).toBeDefined();
      
      // Verify theme structure
      result.themes.forEach((theme: any) => {
        expect(theme.title).toBeDefined();
        expect(theme.category).toBeDefined();
        expect(theme.confidence).toBeGreaterThan(0);
      });
    }, TEST_CONFIG.timeout);

    test('should perform deep analysis with entities', async () => {
      const analysisRequest = createMockAIAnalysisRequest(testContent, 'deep');
      
      const response = await withTimeout(
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(analysisRequest),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.entities).toBeDefined();
      expect(result.systems).toBeDefined();
      
      // Verify entity extraction
      if (result.entities.length > 0) {
        result.entities.forEach((entity: any) => {
          expect(entity.name).toBeDefined();
          expect(entity.type).toBeDefined();
          expect(entity.confidence).toBeGreaterThan(0);
        });
      }
    }, TEST_CONFIG.timeout * 2);

    test('should perform world-class analysis with comprehensive extraction', async () => {
      const analysisRequest = createMockAIAnalysisRequest(testContent, 'world-class');
      
      const response = await withTimeout(
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(analysisRequest),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.themes).toBeDefined();
      expect(result.quotes).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.systems).toBeDefined();
      expect(result.relationships).toBeDefined();
      
      // World-class should have the most comprehensive results
      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout * 3);
  });

  describe('Multi-Provider Testing', () => {
    test('should handle provider failover', async () => {
      // Test with specific provider preference
      const analysisRequest = {
        ...createMockAIAnalysisRequest(testContent, 'quick'),
        preferredProvider: 'non-existent-provider', // Force failover
      };
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      // Should still succeed with fallback provider
      expect(validateAIAnalysisResponse(result)).toBe(true);
      expect(result.providerUsed).toBeDefined();
      expect(result.providerUsed).not.toBe('non-existent-provider');
    });

    test('should test each available provider', async () => {
      // Get available providers
      const configResponse = await makeAPIRequest('/ai/config');
      const config = await configResponse.json();
      
      const testPromises = config.providers.map(async (provider: string) => {
        const analysisRequest = {
          ...createMockAIAnalysisRequest('Test content for ' + provider, 'quick'),
          preferredProvider: provider,
        };
        
        try {
          const response = await makeAPIRequest('/ai/analyze', {
            method: 'POST',
            body: JSON.stringify(analysisRequest),
          });
          
          if (response.status === 200) {
            const result = await response.json();
            return {
              provider,
              success: true,
              result,
            };
          } else {
            return {
              provider,
              success: false,
              error: await response.text(),
            };
          }
        } catch (error) {
          return {
            provider,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });
      
      const results = await Promise.all(testPromises);
      
      // At least one provider should work
      const successful = results.filter(r => r.success);
      expect(successful.length).toBeGreaterThan(0);
      
      console.log('Provider test results:', results);
    }, TEST_CONFIG.timeout * 2);
  });

  describe('Cultural Sensitivity and Compliance', () => {
    test('should respect Indigenous cultural protocols', async () => {
      const culturalContent = `
        Traditional knowledge holders shared stories about connection to country.
        Elders emphasized the importance of cultural protocols and respect.
        Young people spoke about balancing traditional ways with modern life.
        Sacred sites and cultural practices were mentioned with reverence.
      `;
      
      const analysisRequest = createMockAIAnalysisRequest(culturalContent, 'standard');
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      // Validate cultural compliance
      const compliance = validateCulturalCompliance(result);
      expect(compliance.isCompliant).toBe(true);
      
      if (compliance.issues.length > 0) {
        console.warn('Cultural compliance issues:', compliance.issues);
      }
    });

    test('should handle sensitive content appropriately', async () => {
      const sensitiveContent = `
        Youth discussed challenges with substance abuse and mental health.
        Some participants shared personal trauma experiences.
        Family violence and community safety were recurring themes.
      `;
      
      const analysisRequest = {
        ...createMockAIAnalysisRequest(sensitiveContent, 'standard'),
        sensitivityLevel: 'high',
        respectProtocols: true,
      };
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      // Should handle sensitive content with appropriate care
      expect(result.sensitivityFlags).toBeDefined();
      if (result.themes) {
        result.themes.forEach((theme: any) => {
          if (theme.sensitive) {
            expect(theme.handlingGuidelines).toBeDefined();
          }
        });
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty content gracefully', async () => {
      const analysisRequest = createMockAIAnalysisRequest('', 'quick');
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('content');
    });

    test('should handle very long content', async () => {
      const longContent = 'Test content. '.repeat(10000); // Very long content
      
      const analysisRequest = createMockAIAnalysisRequest(longContent, 'quick');
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });

      // Should either succeed or fail gracefully with content length error
      if (response.status !== 200) {
        const result = await response.json();
        expect(result.error).toBeDefined();
      } else {
        const result = await response.json();
        expect(validateAIAnalysisResponse(result)).toBe(true);
      }
    });

    test('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const rapidRequests = Array.from({ length: 10 }, () =>
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(createMockAIAnalysisRequest('Quick test', 'quick')),
        })
      );
      
      const responses = await Promise.allSettled(rapidRequests);
      
      // Some requests might be rate limited
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      if (rateLimited.length > 0) {
        // Rate limiting is working
        expect(rateLimited.length).toBeGreaterThan(0);
      } else {
        // All requests succeeded (rate limits not hit)
        const successful = responses.filter(r => 
          r.status === 'fulfilled' && r.value.status === 200
        );
        expect(successful.length).toBeGreaterThan(0);
      }
    });

    test('should handle malformed requests', async () => {
      const malformedRequest = {
        invalidField: 'test',
        content: 123, // Should be string
      };
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(malformedRequest),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete analysis within timeout limits', async () => {
      const startTime = Date.now();
      
      const analysisRequest = createMockAIAnalysisRequest(testContent, 'standard');
      
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(TEST_CONFIG.timeout);
      
      const result = await response.json();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(processingTime + 1000); // Account for overhead
    });

    test('should handle concurrent analysis requests', async () => {
      const concurrentRequests = Array.from({ length: 3 }, (_, i) =>
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(
            createMockAIAnalysisRequest(`Concurrent test ${i}`, 'quick')
          ),
        })
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const results = await Promise.all(
        responses.map(r => r.json())
      );
      
      results.forEach(result => {
        expect(validateAIAnalysisResponse(result)).toBe(true);
      });
    });

    test('should provide consistent results for identical content', async () => {
      const analysisRequest = createMockAIAnalysisRequest(testContent, 'quick');
      
      // Run same analysis twice
      const [response1, response2] = await Promise.all([
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(analysisRequest),
        }),
        makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify(analysisRequest),
        }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      const [result1, result2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);
      
      // Results should be similar (allowing for AI variability)
      expect(result1.themes?.length).toBeCloseTo(result2.themes?.length || 0, 1);
      expect(result1.analysisType).toBe(result2.analysisType);
    });
  });
});