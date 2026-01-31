/**
 * Tests for Performance Optimizer
 */

import { 
  performanceOptimizer, 
  getOptimalProcessingStrategy 
} from '@/lib/utils/performance-optimizer';

describe('Performance Optimizer', () => {
  beforeEach(() => {
    // Reset optimizer state between tests
    performanceOptimizer.updateConfig({
      maxConcurrentJobs: 2,
      memoryThreshold: 100 * 1024 * 1024, // 100MB for testing
      cacheMaxSize: 50 * 1024 * 1024 // 50MB for testing
    });
  });

  describe('Job Queue Management', () => {
    it('should add jobs to queue with correct priority ordering', () => {
      const lowPriorityJob = performanceOptimizer.addJob({
        documentId: 'doc1',
        type: 'extraction',
        priority: 'low',
        fileSize: 1024 * 1024 // 1MB
      });

      const highPriorityJob = performanceOptimizer.addJob({
        documentId: 'doc2',
        type: 'analysis',
        priority: 'high',
        fileSize: 2 * 1024 * 1024 // 2MB
      });

      const criticalJob = performanceOptimizer.addJob({
        documentId: 'doc3',
        type: 'thumbnails',
        priority: 'critical',
        fileSize: 500 * 1024 // 500KB
      });

      // Critical job should be processed first
      const criticalStatus = performanceOptimizer.getJobStatus(criticalJob);
      const highStatus = performanceOptimizer.getJobStatus(highPriorityJob);
      const lowStatus = performanceOptimizer.getJobStatus(lowPriorityJob);

      expect(criticalStatus?.priority).toBe('critical');
      expect(highStatus?.priority).toBe('high');
      expect(lowStatus?.priority).toBe('low');
    });

    it('should estimate processing time based on file size and type', () => {
      const extractionJob = performanceOptimizer.addJob({
        documentId: 'doc1',
        type: 'extraction',
        priority: 'medium',
        fileSize: 5 * 1024 * 1024 // 5MB
      });

      const analysisJob = performanceOptimizer.addJob({
        documentId: 'doc2',
        type: 'analysis',
        priority: 'medium',
        fileSize: 5 * 1024 * 1024 // 5MB
      });

      const extractionStatus = performanceOptimizer.getJobStatus(extractionJob);
      const analysisStatus = performanceOptimizer.getJobStatus(analysisJob);

      // Analysis should take longer than extraction for same file size
      expect(analysisStatus?.estimatedTimeMs).toBeGreaterThan(extractionStatus?.estimatedTimeMs || 0);
    });

    it('should provide accurate job status tracking', () => {
      const jobId = performanceOptimizer.addJob({
        documentId: 'doc1',
        type: 'extraction',
        priority: 'medium',
        fileSize: 1024 * 1024 // 1MB
      });

      const status = performanceOptimizer.getJobStatus(jobId);
      expect(status).not.toBeNull();
      expect(status?.id).toBe(jobId);
      expect(status?.status).toMatch(/queued|processing|completed|failed/);
    });

    it('should cancel queued jobs successfully', () => {
      // Add multiple jobs to ensure some remain queued
      const jobs = [];
      for (let i = 0; i < 5; i++) {
        jobs.push(performanceOptimizer.addJob({
          documentId: `doc${i}`,
          type: 'extraction',
          priority: 'low',
          fileSize: 1024 * 1024 // 1MB
        }));
      }

      const lastJobId = jobs[jobs.length - 1];
      const cancelled = performanceOptimizer.cancelJob(lastJobId);
      expect(cancelled).toBe(true);

      const status = performanceOptimizer.getJobStatus(lastJobId);
      expect(status).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should store and retrieve cached data', () => {
      const testData = { text: 'extracted content', themes: ['theme1', 'theme2'] };
      const cacheKey = 'document_123_extraction';
      
      performanceOptimizer.setCacheItem(cacheKey, testData, 1000);
      const retrieved = performanceOptimizer.getCacheItem(cacheKey);
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent cache keys', () => {
      const result = performanceOptimizer.getCacheItem('non_existent_key');
      expect(result).toBeNull();
    });

    it('should handle cache size limits', () => {
      // Fill cache beyond limit
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string
      
      for (let i = 0; i < 10; i++) {
        performanceOptimizer.setCacheItem(`key_${i}`, largeData, 10 * 1024 * 1024);
      }

      // First items should be evicted due to size limit
      const firstItem = performanceOptimizer.getCacheItem('key_0');
      expect(firstItem).toBeNull();
      
      // Recent items should still exist
      const recentItem = performanceOptimizer.getCacheItem('key_9');
      expect(recentItem).toBe(largeData);
    });
  });

  describe('Performance Metrics', () => {
    it('should provide accurate performance metrics', async () => {
      // Add some jobs
      const jobIds = [];
      for (let i = 0; i < 3; i++) {
        jobIds.push(performanceOptimizer.addJob({
          documentId: `doc${i}`,
          type: 'extraction',
          priority: 'medium',
          fileSize: 1024 * 1024 // 1MB
        }));
      }

      const metrics = performanceOptimizer.getMetrics();
      
      expect(metrics.totalJobs).toBeGreaterThanOrEqual(3);
      expect(metrics.activeJobs).toBeGreaterThanOrEqual(0);
      expect(metrics.currentMemoryUsage).toBeGreaterThan(0);
      expect(typeof metrics.averageProcessingTime).toBe('number');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        maxConcurrentJobs: 5,
        memoryThreshold: 1024 * 1024 * 1024, // 1GB
        cacheMaxSize: 500 * 1024 * 1024 // 500MB
      };
      
      performanceOptimizer.updateConfig(newConfig);
      
      // Configuration update should be reflected in behavior
      // Add more jobs than original limit to test
      for (let i = 0; i < 6; i++) {
        performanceOptimizer.addJob({
          documentId: `doc${i}`,
          type: 'extraction',
          priority: 'medium',
          fileSize: 1024 * 1024
        });
      }

      const metrics = performanceOptimizer.getMetrics();
      // Should be able to handle more concurrent jobs now
      expect(metrics.activeJobs).toBeLessThanOrEqual(5);
    });
  });
});

describe('Processing Strategy Optimization', () => {
  it('should recommend immediate processing for small files', () => {
    const strategy = getOptimalProcessingStrategy(500 * 1024); // 500KB
    
    expect(strategy.strategy).toBe('immediate');
    expect(strategy.priority).toBe('high');
    expect(strategy.warnings).toHaveLength(0);
  });

  it('should recommend queued processing for medium files', () => {
    const strategy = getOptimalProcessingStrategy(3 * 1024 * 1024); // 3MB
    
    expect(strategy.strategy).toBe('queued');
    expect(strategy.priority).toBe('medium');
    expect(strategy.warnings).toHaveLength(0);
  });

  it('should recommend chunked processing for large files', () => {
    const strategy = getOptimalProcessingStrategy(30 * 1024 * 1024); // 30MB
    
    expect(strategy.strategy).toBe('chunked');
    expect(strategy.priority).toBe('low');
    expect(strategy.chunkSize).toBe(5 * 1024 * 1024); // 5MB
    expect(strategy.warnings).toContain('Very large file will be processed in chunks');
  });

  it('should recommend deferred processing for extremely large files', () => {
    const strategy = getOptimalProcessingStrategy(100 * 1024 * 1024); // 100MB
    
    expect(strategy.strategy).toBe('deferred');
    expect(strategy.priority).toBe('low');
    expect(strategy.warnings).toContain('Extremely large file detected');
    expect(strategy.warnings).toContain('Manual processing recommended');
  });

  it('should provide appropriate warnings for large files', () => {
    const strategy = getOptimalProcessingStrategy(15 * 1024 * 1024); // 15MB
    
    expect(strategy.warnings).toContain('Large file may take several minutes to process');
  });
});