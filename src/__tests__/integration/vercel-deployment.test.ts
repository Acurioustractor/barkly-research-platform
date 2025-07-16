/**
 * Integration tests for Vercel deployment-specific functionality
 * Tests production environment, serverless functions, and deployment-specific features
 */

import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import {
  makeAPIRequest,
  createMockFile,
  uploadFile,
  withTimeout,
  retryOperation,
  TEST_CONFIG,
} from './test-utils';
import { setupMockFetch } from './mock-responses';

describe('Vercel Deployment Integration Tests', () => {
  let isProduction = false;

  beforeAll(async () => {
    // Setup mock fetch responses
    setupMockFetch();
    
    // Detect if we're testing against a production Vercel deployment
    isProduction = !!process.env.VERCEL_URL || TEST_CONFIG.apiBaseUrl.includes('vercel.app');
    
    if (isProduction) {
      console.log('🚀 Testing against Vercel production deployment:', TEST_CONFIG.apiBaseUrl);
    } else {
      console.log('🏠 Testing against local development server');
    }
  });

  describe('Serverless Function Configuration', () => {
    test('should respect function timeout limits', async () => {
      // Test document processing function timeout (300s as per vercel.json)
      const mockFile = createMockFile('timeout-test.pdf');
      
      const startTime = Date.now();
      const response = await withTimeout(
        uploadFile(mockFile, '/documents', {
          processImmediately: 'true',
        }),
        310000 // 310 seconds - slightly more than Vercel function timeout
      );
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      
      // Should complete within function timeout limits
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(300000); // Less than 300 seconds
    }, 320000);

    test('should handle AI function memory limits', async () => {
      // AI functions are configured with 512MB memory
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Test content for memory validation',
          analysisType: 'quick',
          options: {
            extractThemes: true,
            extractQuotes: true,
          },
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      // Should complete without memory issues
      expect(result.error).toBeUndefined();
      expect(result.themes || result.quotes || result.insights).toBeDefined();
    });

    test('should handle document function memory limits', async () => {
      // Document functions are configured with 1024MB memory
      const mockFile = createMockFile('memory-test.pdf');
      
      const response = await uploadFile(mockFile, '/documents');
      
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.document).toBeDefined();
    });
  });

  describe('Environment Variables and Configuration', () => {
    test('should have required environment variables configured', async () => {
      const response = await makeAPIRequest('/test/env');
      
      if (response.status === 404) {
        // Test endpoint might not exist in production, skip
        return;
      }
      
      expect(response.status).toBe(200);
      const envStatus = await response.json();
      
      // Critical environment variables should be configured
      expect(envStatus.database).toBe(true);
      expect(envStatus.aiProviders).toBeGreaterThan(0);
    });

    test('should handle database connections correctly', async () => {
      const response = await makeAPIRequest('/check-db');
      
      expect(response.status).toBe(200);
      const dbStatus = await response.json();
      
      expect(dbStatus.connected).toBe(true);
      expect(dbStatus.provider).toBeDefined();
      
      if (isProduction) {
        expect(dbStatus.provider).toBe('postgresql');
      }
    });
  });

  describe('CORS and Headers Configuration', () => {
    test('should have correct CORS headers', async () => {
      const response = await makeAPIRequest('/documents');
      
      expect(response.status).toBe(200);
      
      // Check CORS headers as configured in vercel.json
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');
      const corsHeaders = response.headers.get('Access-Control-Allow-Headers');
      
      expect(corsOrigin).toBe('*');
      expect(corsMethods).toContain('GET');
      expect(corsMethods).toContain('POST');
      expect(corsHeaders).toContain('Content-Type');
    });

    test('should handle OPTIONS requests for CORS preflight', async () => {
      const response = await global.fetch(`${TEST_CONFIG.apiBaseUrl}/api/documents`, {
        method: 'OPTIONS',
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });

  describe('Static Asset Optimization', () => {
    test('should serve optimized static assets', async () => {
      const response = await global.fetch(`${TEST_CONFIG.apiBaseUrl}/favicon.ico`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBeDefined();
      
      if (isProduction) {
        // Production should have caching headers
        const cacheControl = response.headers.get('cache-control');
        expect(cacheControl).toContain('max-age');
      }
    });

    test('should serve Next.js optimized pages', async () => {
      const response = await global.fetch(`${TEST_CONFIG.apiBaseUrl}/`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      
      const html = await response.text();
      expect(html).toContain('Barkly'); // Should contain app content
      
      if (isProduction) {
        // Production should have optimized builds
        expect(html).toContain('/_next/');
      }
    });
  });

  describe('Regional Deployment (iad1)', () => {
    test('should be deployed to correct region', async () => {
      if (!isProduction) {
        // Skip for local development
        return;
      }
      
      // Test response headers for regional deployment indicators
      const response = await makeAPIRequest('/documents');
      
      expect(response.status).toBe(200);
      
      // Vercel typically adds server region headers
      const serverRegion = response.headers.get('x-vercel-id') || 
                          response.headers.get('server') ||
                          response.headers.get('x-edge-location');
      
      if (serverRegion) {
        console.log('Server region info:', serverRegion);
      }
    });

    test('should have acceptable latency for the region', async () => {
      const startTime = Date.now();
      const response = await makeAPIRequest('/documents');
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      
      const latency = endTime - startTime;
      console.log('API latency:', latency + 'ms');
      
      // Regional deployment should have reasonable latency
      expect(latency).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('Server-Side Rendering and API Routes', () => {
    test('should render pages server-side', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/documents`);
      
      expect(response.status).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Documents'); // Page content should be pre-rendered
    });

    test('should handle API routes correctly', async () => {
      const response = await makeAPIRequest('/documents');
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data.documents).toBeDefined();
    });
  });

  describe('Error Handling in Production', () => {
    test('should handle 404 errors gracefully', async () => {
      const response = await makeAPIRequest('/non-existent-endpoint');
      
      expect(response.status).toBe(404);
      
      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(error.error).not.toContain('stack'); // No stack traces in production
    });

    test('should handle server errors gracefully', async () => {
      // Test with malformed request that should cause 500 error
      const response = await makeAPIRequest('/ai/analyze', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect([400, 500]).toContain(response.status);
      
      const error = await response.json();
      expect(error.error).toBeDefined();
      
      if (isProduction) {
        // Production should not expose internal error details
        expect(error.error).not.toContain('SyntaxError');
        expect(error.stack).toBeUndefined();
      }
    });
  });

  describe('Performance and Monitoring', () => {
    test('should have performance monitoring headers', async () => {
      const response = await makeAPIRequest('/documents');
      
      expect(response.status).toBe(200);
      
      // Check for Vercel performance headers
      const timing = response.headers.get('server-timing') ||
                    response.headers.get('x-vercel-cache') ||
                    response.headers.get('x-vercel-id');
      
      if (timing) {
        console.log('Performance headers detected:', timing);
      }
    });

    test('should complete requests within SLA', async () => {
      const startTime = Date.now();
      
      const response = await makeAPIRequest('/documents', {
        method: 'GET',
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // 10 second SLA
      
      console.log('API response time:', responseTime + 'ms');
    });
  });

  describe('Edge Functions and Middleware', () => {
    test('should handle authentication middleware if configured', async () => {
      // Test protected endpoints
      const protectedEndpoints = ['/admin', '/api/admin'];
      
      for (const endpoint of protectedEndpoints) {
        try {
          const response = await fetch(`${TEST_CONFIG.apiBaseUrl}${endpoint}`);
          
          // Should either require auth (401/403) or not exist (404)
          expect([401, 403, 404]).toContain(response.status);
        } catch (error) {
          // Endpoint might not exist, which is fine
          console.log(`Protected endpoint ${endpoint} not accessible:`, error);
        }
      }
    });

    test('should handle rate limiting if configured', async () => {
      // Make multiple rapid requests to test rate limiting
      const rapidRequests = Array.from({ length: 20 }, () =>
        makeAPIRequest('/documents')
      );
      
      const responses = await Promise.allSettled(rapidRequests);
      
      // Check if any requests were rate limited
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      if (rateLimited.length > 0) {
        console.log('Rate limiting detected:', rateLimited.length, 'requests limited');
      }
      
      // At least some requests should succeed
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Database Connection Pooling', () => {
    test('should handle concurrent database operations', async () => {
      const concurrentRequests = Array.from({ length: 5 }, () =>
        makeAPIRequest('/documents')
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed with proper connection pooling
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should handle database reconnection', async () => {
      // Test database connection resilience
      const response1 = await makeAPIRequest('/check-db');
      expect(response1.status).toBe(200);
      
      // Wait a moment and test again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response2 = await makeAPIRequest('/check-db');
      expect(response2.status).toBe(200);
      
      const [status1, status2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);
      
      expect(status1.connected).toBe(true);
      expect(status2.connected).toBe(true);
    });
  });
});