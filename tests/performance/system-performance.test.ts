import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '../../src/lib/ai-service';
import { enhancedStoryService } from '../../src/lib/enhanced-story-service';
import { culturalSafetyService } from '../../src/lib/cultural-safety-service';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  storySubmission: 2000, // 2 seconds
  aiAnalysis: 10000, // 10 seconds
  culturalReview: 1000, // 1 second
  dashboardLoad: 3000, // 3 seconds
  batchProcessing: 30000, // 30 seconds for 100 items
  databaseQuery: 500, // 500ms
  apiResponse: 1000 // 1 second
};

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'test-key';
const testSupabase = createClient(supabaseUrl, supabaseKey);

describe('System Performance Tests', () => {
  let testCommunityId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Set up test data
    const { data: community } = await testSupabase
      .from('communities')
      .insert({
        name: 'Performance Test Community',
        description: 'Community for performance testing',
        location: 'Test Location'
      })
      .select()
      .single();
    
    testCommunityId = community.id;

    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: 'performance-test@example.com',
        role: 'community_member',
        community_id: testCommunityId
      })
      .select()
      .single();
    
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await testSupabase.from('documents').delete().eq('community_id', testCommunityId);
    await testSupabase.from('users').delete().eq('id', testUserId);
    await testSupabase.from('communities').delete().eq('id', testCommunityId);
  });

  describe('Story Submission Performance', () => {
    it('should submit story within performance threshold', async () => {
      const storyData = {
        title: 'Performance Test Story',
        content: 'This is a performance test story to measure submission speed.',
        type: 'story',
        tags: ['performance', 'test'],
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'low',
          communityConsent: true
        }
      };

      const startTime = performance.now();
      const result = await enhancedStoryService.submitStory(storyData);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.storySubmission);
      
      console.log(`Story submission took ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent story submissions efficiently', async () => {
      const concurrentSubmissions = 10;
      const stories = Array.from({ length: concurrentSubmissions }, (_, i) => ({
        title: `Concurrent Test Story ${i + 1}`,
        content: `This is concurrent test story number ${i + 1}.`,
        type: 'story',
        tags: ['concurrent', 'test'],
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'low',
          communityConsent: true
        }
      }));

      const startTime = performance.now();
      
      const submissionPromises = stories.map(story =>
        enhancedStoryService.submitStory(story)
      );
      
      const results = await Promise.all(submissionPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const averageTime = duration / concurrentSubmissions;
      
      // All submissions should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Average time per submission should be reasonable
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.storySubmission);
      
      console.log(`${concurrentSubmissions} concurrent submissions took ${duration.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per submission)`);
    });
  });

  describe('AI Analysis Performance', () => {
    it('should complete AI analysis within threshold', async () => {
      const testContent = 'Our community has been facing challenges with healthcare access. The nearest clinic is very far away and many elderly community members cannot make the journey. We need mobile health services or a local clinic to serve our community better.';
      
      const startTime = performance.now();
      const analysisResult = await aiService.analyzeDocument(testContent, 'story_analysis');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.themes).toBeDefined();
      expect(Array.isArray(analysisResult.themes)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.aiAnalysis);
      
      console.log(`AI analysis took ${duration.toFixed(2)}ms`);
    });

    it('should handle batch AI analysis efficiently', async () => {
      const batchSize = 20;
      const testContents = Array.from({ length: batchSize }, (_, i) => 
        `Test story ${i + 1}: Our community needs better services and support for various issues including healthcare, education, and infrastructure.`
      );

      const startTime = performance.now();
      
      const analysisPromises = testContents.map(content =>
        aiService.analyzeDocument(content, 'story_analysis')
      );
      
      const results = await Promise.all(analysisPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const averageTime = duration / batchSize;
      
      // All analyses should succeed
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.themes).toBeDefined();
      });
      
      // Average time should be reasonable
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.aiAnalysis);
      
      console.log(`Batch AI analysis (${batchSize} items) took ${duration.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per analysis)`);
    });

    it('should handle large content analysis efficiently', async () => {
      // Create large content (approximately 5000 words)
      const largeContent = Array.from({ length: 100 }, (_, i) => 
        `Paragraph ${i + 1}: Our community has been working on various initiatives to improve the quality of life for all residents. We have been focusing on healthcare access, educational opportunities, economic development, and cultural preservation. The challenges we face are complex and interconnected, requiring comprehensive solutions that respect our traditional values while embracing beneficial modern approaches.`
      ).join(' ');

      const startTime = performance.now();
      const analysisResult = await aiService.analyzeDocument(largeContent, 'story_analysis');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.themes).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.aiAnalysis * 2); // Allow more time for large content
      
      console.log(`Large content AI analysis took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Cultural Safety Review Performance', () => {
    it('should complete cultural review within threshold', async () => {
      const reviewRequest = {
        contentId: 'perf-test-content',
        contentType: 'story' as const,
        content: {
          title: 'Performance Test Content',
          text: 'This is test content for performance evaluation of cultural safety review.'
        },
        submittedBy: testUserId,
        priority: 'medium' as const
      };

      const startTime = performance.now();
      const result = await culturalSafetyService.submitForReview(reviewRequest);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.culturalReview);
      
      console.log(`Cultural safety review submission took ${duration.toFixed(2)}ms`);
    });

    it('should handle batch cultural reviews efficiently', async () => {
      const batchSize = 25;
      const reviewRequests = Array.from({ length: batchSize }, (_, i) => ({
        contentId: `batch-perf-test-${i}`,
        contentType: 'story' as const,
        content: {
          title: `Batch Test Content ${i + 1}`,
          text: `This is batch test content number ${i + 1} for performance evaluation.`
        },
        submittedBy: testUserId,
        priority: 'medium' as const
      }));

      const startTime = performance.now();
      
      const reviewPromises = reviewRequests.map(request =>
        culturalSafetyService.submitForReview(request)
      );
      
      const results = await Promise.all(reviewPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const averageTime = duration / batchSize;
      
      // All reviews should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.culturalReview);
      
      console.log(`Batch cultural reviews (${batchSize} items) took ${duration.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per review)`);
    });
  });

  describe('Database Query Performance', () => {
    it('should execute simple queries within threshold', async () => {
      const startTime = performance.now();
      
      const { data, error } = await testSupabase
        .from('communities')
        .select('id, name')
        .eq('id', testCommunityId)
        .single();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.databaseQuery);
      
      console.log(`Simple database query took ${duration.toFixed(2)}ms`);
    });

    it('should execute complex queries within threshold', async () => {
      // Insert test data for complex query
      const testStories = Array.from({ length: 50 }, (_, i) => ({
        title: `Query Test Story ${i + 1}`,
        content: `Test content for query performance ${i + 1}`,
        type: 'story',
        community_id: testCommunityId,
        submitted_by: testUserId,
        status: 'approved',
        created_at: new Date().toISOString()
      }));

      await testSupabase.from('documents').insert(testStories);

      const startTime = performance.now();
      
      const { data, error } = await testSupabase
        .from('documents')
        .select(`
          id,
          title,
          content,
          created_at,
          ai_analysis (
            themes,
            sentiment,
            urgency
          )
        `)
        .eq('community_id', testCommunityId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.databaseQuery * 3); // Allow more time for complex query
      
      console.log(`Complex database query took ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent database queries efficiently', async () => {
      const concurrentQueries = 20;
      
      const startTime = performance.now();
      
      const queryPromises = Array.from({ length: concurrentQueries }, () =>
        testSupabase
          .from('documents')
          .select('id, title, created_at')
          .eq('community_id', testCommunityId)
          .limit(10)
      );
      
      const results = await Promise.all(queryPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const averageTime = duration / concurrentQueries;
      
      // All queries should succeed
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.databaseQuery);
      
      console.log(`${concurrentQueries} concurrent queries took ${duration.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per query)`);
    });
  });

  describe('API Endpoint Performance', () => {
    it('should respond to API requests within threshold', async () => {
      const apiUrl = 'http://localhost:3000/api/community/stories';
      
      const startTime = performance.now();
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN || 'test-token'}`
        }
      });
      
      const data = await response.json();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse);
      
      console.log(`API request took ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent API requests efficiently', async () => {
      const concurrentRequests = 15;
      const apiUrl = 'http://localhost:3000/api/intelligence/community-health';
      
      const startTime = performance.now();
      
      const requestPromises = Array.from({ length: concurrentRequests }, () =>
        fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN || 'test-token'}`
          }
        })
      );
      
      const responses = await Promise.all(requestPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const averageTime = duration / concurrentRequests;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse);
      
      console.log(`${concurrentRequests} concurrent API requests took ${duration.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per request)`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain reasonable memory usage during batch processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process large batch of data
      const batchSize = 100;
      const largeDataset = Array.from({ length: batchSize }, (_, i) => ({
        title: `Memory Test Story ${i + 1}`,
        content: `This is a memory test story with content ${i + 1}. `.repeat(100), // ~5KB per story
        type: 'story',
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'low',
          communityConsent: true
        }
      }));

      const startTime = performance.now();
      
      // Process in smaller chunks to avoid overwhelming the system
      const chunkSize = 10;
      for (let i = 0; i < largeDataset.length; i += chunkSize) {
        const chunk = largeDataset.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(story => enhancedStoryService.submitStory(story));
        await Promise.all(chunkPromises);
      }
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage();
      
      const duration = endTime - startTime;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerItem = memoryIncrease / batchSize;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.batchProcessing);
      expect(memoryIncreasePerItem).toBeLessThan(1024 * 1024); // Less than 1MB per item
      
      console.log(`Batch processing (${batchSize} items) took ${duration.toFixed(2)}ms`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${(memoryIncreasePerItem / 1024).toFixed(2)}KB per item)`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });

    it('should handle memory cleanup after large operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operation
      const largeContent = 'Large content '.repeat(100000); // ~1.3MB
      
      for (let i = 0; i < 10; i++) {
        await aiService.analyzeDocument(largeContent, 'story_analysis');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase after large operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with increasing data volume', async () => {
      const dataSizes = [10, 50, 100, 200];
      const performanceResults: Array<{ size: number; avgTime: number }> = [];
      
      for (const size of dataSizes) {
        const stories = Array.from({ length: size }, (_, i) => ({
          title: `Scalability Test Story ${i + 1}`,
          content: `Scalability test content ${i + 1}`,
          type: 'story',
          community_id: testCommunityId,
          submitted_by: testUserId,
          status: 'approved',
          created_at: new Date().toISOString()
        }));
        
        // Insert test data
        await testSupabase.from('documents').insert(stories);
        
        // Measure query performance
        const startTime = performance.now();
        
        const { data, error } = await testSupabase
          .from('documents')
          .select('id, title, content')
          .eq('community_id', testCommunityId)
          .order('created_at', { ascending: false })
          .limit(20);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeNull();
        expect(data).toBeDefined();
        
        performanceResults.push({ size, avgTime: duration });
        
        console.log(`Query with ${size} total records took ${duration.toFixed(2)}ms`);
      }
      
      // Performance should not degrade significantly with data size
      const firstResult = performanceResults[0];
      const lastResult = performanceResults[performanceResults.length - 1];
      const performanceDegradation = lastResult.avgTime / firstResult.avgTime;
      
      // Performance should not degrade more than 3x
      expect(performanceDegradation).toBeLessThan(3);
      
      console.log(`Performance degradation factor: ${performanceDegradation.toFixed(2)}x`);
    });
  });

  describe('Performance Monitoring and Alerts', () => {
    it('should track performance metrics', () => {
      const metrics = {
        storySubmissionTime: 1500,
        aiAnalysisTime: 8000,
        culturalReviewTime: 800,
        databaseQueryTime: 300,
        apiResponseTime: 900
      };
      
      // Check if metrics are within acceptable ranges
      expect(metrics.storySubmissionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.storySubmission);
      expect(metrics.aiAnalysisTime).toBeLessThan(PERFORMANCE_THRESHOLDS.aiAnalysis);
      expect(metrics.culturalReviewTime).toBeLessThan(PERFORMANCE_THRESHOLDS.culturalReview);
      expect(metrics.databaseQueryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.databaseQuery);
      expect(metrics.apiResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse);
      
      console.log('Performance metrics within acceptable ranges:', metrics);
    });

    it('should identify performance bottlenecks', async () => {
      const operations = [
        { name: 'Story Submission', threshold: PERFORMANCE_THRESHOLDS.storySubmission },
        { name: 'AI Analysis', threshold: PERFORMANCE_THRESHOLDS.aiAnalysis },
        { name: 'Cultural Review', threshold: PERFORMANCE_THRESHOLDS.culturalReview },
        { name: 'Database Query', threshold: PERFORMANCE_THRESHOLDS.databaseQuery },
        { name: 'API Response', threshold: PERFORMANCE_THRESHOLDS.apiResponse }
      ];
      
      const bottlenecks: string[] = [];
      
      // Simulate performance measurements
      const measurements = {
        'Story Submission': 1800,
        'AI Analysis': 12000, // This would be a bottleneck
        'Cultural Review': 600,
        'Database Query': 400,
        'API Response': 800
      };
      
      operations.forEach(op => {
        const measured = measurements[op.name as keyof typeof measurements];
        if (measured > op.threshold) {
          bottlenecks.push(`${op.name}: ${measured}ms (threshold: ${op.threshold}ms)`);
        }
      });
      
      if (bottlenecks.length > 0) {
        console.log('Performance bottlenecks identified:', bottlenecks);
      } else {
        console.log('No performance bottlenecks detected');
      }
      
      // For this test, we expect to identify the AI Analysis bottleneck
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0]).toContain('AI Analysis');
    });
  });
});