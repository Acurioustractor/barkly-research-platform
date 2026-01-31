/**
 * Performance Optimization Service for Large Document Processing
 * Handles memory management, caching, and processing optimization
 */

interface ProcessingJob {
  id: string;
  documentId: string;
  type: 'extraction' | 'analysis' | 'thumbnails' | 'chunking';
  priority: 'low' | 'medium' | 'high' | 'critical';
  fileSize: number;
  estimatedTimeMs: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  memoryUsage?: number;
  error?: string;
}

interface PerformanceMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  peakMemoryUsage: number;
  currentMemoryUsage: number;
}

class PerformanceOptimizer {
  private jobQueue: ProcessingJob[] = [];
  private activeJobs = new Map<string, ProcessingJob>();
  private completedJobs: ProcessingJob[] = [];
  private maxConcurrentJobs = 3; // Configurable based on server resources
  private memoryThreshold = 512 * 1024 * 1024; // 512MB threshold
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private cacheMaxSize = 100 * 1024 * 1024; // 100MB cache limit

  /**
   * Add a processing job to the queue
   */
  addJob(job: Omit<ProcessingJob, 'id' | 'status' | 'estimatedTimeMs'>): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const estimatedTime = this.estimateProcessingTime(job.fileSize, job.type);
    
    const processingJob: ProcessingJob = {
      ...job,
      id: jobId,
      status: 'queued',
      estimatedTimeMs: estimatedTime
    };

    // Insert job in priority order
    this.insertJobByPriority(processingJob);
    
    console.log(`[PerformanceOptimizer] Added job ${jobId} to queue (priority: ${job.priority}, estimated: ${estimatedTime}ms)`);
    
    // Try to start processing
    this.processNextJob();
    
    return jobId;
  }

  /**
   * Insert job into queue based on priority
   */
  private insertJobByPriority(job: ProcessingJob): void {
    const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    
    let insertIndex = 0;
    for (let i = 0; i < this.jobQueue.length; i++) {
      if (priorityWeights[job.priority] > priorityWeights[this.jobQueue[i].priority]) {
        break;
      }
      insertIndex = i + 1;
    }
    
    this.jobQueue.splice(insertIndex, 0, job);
  }

  /**
   * Estimate processing time based on file size and type
   */
  private estimateProcessingTime(fileSize: number, type: string): number {
    // Base time estimates per MB
    const baseTimesPerMB = {
      extraction: 2000,    // 2 seconds per MB
      analysis: 5000,      // 5 seconds per MB  
      thumbnails: 1000,    // 1 second per MB
      chunking: 500        // 0.5 seconds per MB
    };
    
    const fileSizeMB = fileSize / (1024 * 1024);
    const baseTime = baseTimesPerMB[type as keyof typeof baseTimesPerMB] || 2000;
    
    // Add overhead for larger files
    const overhead = fileSizeMB > 10 ? fileSizeMB * 200 : 0;
    
    return Math.round((fileSizeMB * baseTime) + overhead);
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    // Check if we can start a new job
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      console.log(`[PerformanceOptimizer] Max concurrent jobs reached (${this.maxConcurrentJobs})`);
      return;
    }

    // Check memory usage
    if (this.getCurrentMemoryUsage() > this.memoryThreshold) {
      console.log(`[PerformanceOptimizer] Memory threshold exceeded, skipping new jobs`);
      await this.optimizeMemory();
      return;
    }

    const job = this.jobQueue.shift();
    if (!job) return;

    job.status = 'processing';
    job.startTime = Date.now();
    this.activeJobs.set(job.id, job);

    console.log(`[PerformanceOptimizer] Starting job ${job.id} (${job.type})`);

    try {
      await this.executeJob(job);
      job.status = 'completed';
      job.endTime = Date.now();
      
      console.log(`[PerformanceOptimizer] Completed job ${job.id} in ${job.endTime - job.startTime!}ms`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = Date.now();
      
      console.error(`[PerformanceOptimizer] Job ${job.id} failed:`, error);
    } finally {
      this.activeJobs.delete(job.id);
      this.completedJobs.push(job);
      
      // Keep only last 100 completed jobs to prevent memory leak
      if (this.completedJobs.length > 100) {
        this.completedJobs.splice(0, this.completedJobs.length - 100);
      }
      
      // Process next job
      setImmediate(() => this.processNextJob());
    }
  }

  /**
   * Execute a specific job (placeholder - actual implementation would be job-specific)
   */
  private async executeJob(job: ProcessingJob): Promise<void> {
    // This is a placeholder - actual implementation would call appropriate services
    return new Promise((resolve, reject) => {
      const timeout = Math.min(job.estimatedTimeMs * 2, 300000); // Max 5 minutes
      
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate simulation
          resolve();
        } else {
          reject(new Error(`Job ${job.type} failed for document ${job.documentId}`));
        }
      }, Math.min(job.estimatedTimeMs, timeout));
    });
  }

  /**
   * Get current memory usage (simplified estimate)
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Fallback estimation based on active jobs and cache
    let estimate = this.activeJobs.size * 50 * 1024 * 1024; // 50MB per job
    
    for (const [, cacheItem] of this.cache) {
      estimate += cacheItem.size;
    }
    
    return estimate;
  }

  /**
   * Optimize memory usage
   */
  private async optimizeMemory(): Promise<void> {
    console.log('[PerformanceOptimizer] Starting memory optimization...');
    
    // Clear old cache entries
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
    
    // If cache is still too large, remove oldest entries
    while (this.getCacheSize() > this.cacheMaxSize && this.cache.size > 0) {
      const oldestKey = this.getOldestCacheKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    console.log(`[PerformanceOptimizer] Memory optimization complete. Cache size: ${this.getCacheSize()} bytes`);
  }

  /**
   * Get total cache size
   */
  private getCacheSize(): number {
    let totalSize = 0;
    for (const [, item] of this.cache) {
      totalSize += item.size;
    }
    return totalSize;
  }

  /**
   * Get oldest cache key
   */
  private getOldestCacheKey(): string | null {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Cache processed data
   */
  setCacheItem(key: string, data: any, size: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size: size || JSON.stringify(data).length * 2 // Rough estimate
    });
    
    // Check if cache exceeds limit
    if (this.getCacheSize() > this.cacheMaxSize) {
      this.optimizeMemory();
    }
  }

  /**
   * Get cached data
   */
  getCacheItem(key: string): any | null {
    const item = this.cache.get(key);
    return item ? item.data : null;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const totalJobs = this.completedJobs.length + this.activeJobs.size + this.jobQueue.length;
    const completedJobsList = this.completedJobs.filter(job => job.status === 'completed');
    const averageTime = completedJobsList.length > 0 
      ? completedJobsList.reduce((sum, job) => sum + (job.endTime! - job.startTime!), 0) / completedJobsList.length
      : 0;

    return {
      totalJobs,
      activeJobs: this.activeJobs.size,
      completedJobs: this.completedJobs.filter(job => job.status === 'completed').length,
      failedJobs: this.completedJobs.filter(job => job.status === 'failed').length,
      averageProcessingTime: Math.round(averageTime),
      peakMemoryUsage: 0, // Would need proper tracking
      currentMemoryUsage: this.getCurrentMemoryUsage()
    };
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ProcessingJob | null {
    // Check active jobs first
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) return activeJob;
    
    // Check completed jobs
    const completedJob = this.completedJobs.find(job => job.id === jobId);
    if (completedJob) return completedJob;
    
    // Check queue
    const queuedJob = this.jobQueue.find(job => job.id === jobId);
    if (queuedJob) return queuedJob;
    
    return null;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    // Remove from queue if not started
    const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (queueIndex !== -1) {
      this.jobQueue.splice(queueIndex, 1);
      return true;
    }
    
    // Can't cancel active jobs easily, but could be implemented with proper job control
    return false;
  }

  /**
   * Update processing configuration
   */
  updateConfig(config: {
    maxConcurrentJobs?: number;
    memoryThreshold?: number;
    cacheMaxSize?: number;
  }): void {
    if (config.maxConcurrentJobs) {
      this.maxConcurrentJobs = config.maxConcurrentJobs;
    }
    if (config.memoryThreshold) {
      this.memoryThreshold = config.memoryThreshold;
    }
    if (config.cacheMaxSize) {
      this.cacheMaxSize = config.cacheMaxSize;
    }
    
    console.log('[PerformanceOptimizer] Configuration updated:', config);
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

/**
 * Helper function to optimize file processing based on size
 */
export function getOptimalProcessingStrategy(fileSize: number): {
  strategy: 'immediate' | 'queued' | 'chunked' | 'deferred';
  chunkSize?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
} {
  const fileSizeMB = fileSize / (1024 * 1024);
  
  if (fileSizeMB < 1) {
    return {
      strategy: 'immediate',
      priority: 'high',
      warnings: []
    };
  }
  
  if (fileSizeMB < 5) {
    return {
      strategy: 'queued',
      priority: 'medium',
      warnings: []
    };
  }
  
  if (fileSizeMB < 25) {
    return {
      strategy: 'queued',
      priority: 'low',
      warnings: ['Large file may take several minutes to process']
    };
  }
  
  if (fileSizeMB < 50) {
    return {
      strategy: 'chunked',
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      priority: 'low',
      warnings: [
        'Very large file will be processed in chunks',
        'Processing may take 10+ minutes',
        'Consider splitting document manually for better performance'
      ]
    };
  }
  
  return {
    strategy: 'deferred',
    priority: 'low',
    warnings: [
      'Extremely large file detected',
      'Manual processing recommended',
      'Consider reducing file size or splitting into smaller documents',
      'Automatic processing may fail due to memory constraints'
    ]
  };
}