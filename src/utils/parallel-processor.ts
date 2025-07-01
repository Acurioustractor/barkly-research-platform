/**
 * Parallel document processing with rate limiting and concurrency control
 * Optimizes throughput while respecting API limits and system resources
 */

import { EventEmitter } from 'events';

export interface ParallelProcessingOptions {
  // Concurrency settings
  maxConcurrency?: number;
  maxBatchSize?: number;
  
  // Rate limiting
  maxRequestsPerMinute?: number;
  maxRequestsPerSecond?: number;
  
  // Retry settings
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  
  // Resource limits
  maxMemoryUsage?: number; // In MB
  maxQueueSize?: number;
  
  // Monitoring
  enableMetrics?: boolean;
  metricsInterval?: number; // ms
}

export interface ProcessingTask<T> {
  id: string;
  data: T;
  priority?: number;
  retryCount?: number;
  createdAt?: Date;
}

export interface ProcessingResult<R> {
  id: string;
  success: boolean;
  result?: R;
  error?: Error;
  duration?: number;
  retries?: number;
}

export interface ProcessingMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  currentConcurrency: number;
  queueLength: number;
  requestsPerMinute: number;
  memoryUsage: number;
}

export class ParallelProcessor<T, R> extends EventEmitter {
  private options: Required<ParallelProcessingOptions>;
  private queue: ProcessingTask<T>[] = [];
  private activeProcessing = new Map<string, Promise<R>>();
  private rateLimiter: RateLimiter;
  private metrics: ProcessingMetrics;
  private metricsTimer?: NodeJS.Timeout;
  private paused = false;

  constructor(options: ParallelProcessingOptions = {}) {
    super();
    
    this.options = {
      maxConcurrency: options.maxConcurrency || 5,
      maxBatchSize: options.maxBatchSize || 10,
      maxRequestsPerMinute: options.maxRequestsPerMinute || 60,
      maxRequestsPerSecond: options.maxRequestsPerSecond || 2,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      backoffMultiplier: options.backoffMultiplier || 2,
      maxMemoryUsage: options.maxMemoryUsage || 500,
      maxQueueSize: options.maxQueueSize || 1000,
      enableMetrics: options.enableMetrics ?? true,
      metricsInterval: options.metricsInterval || 5000
    };

    this.rateLimiter = new RateLimiter({
      maxPerMinute: this.options.maxRequestsPerMinute,
      maxPerSecond: this.options.maxRequestsPerSecond
    });

    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageProcessingTime: 0,
      currentConcurrency: 0,
      queueLength: 0,
      requestsPerMinute: 0,
      memoryUsage: 0
    };

    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  /**
   * Process a single task
   */
  async processTask(
    task: ProcessingTask<T>,
    processor: (data: T) => Promise<R>
  ): Promise<ProcessingResult<R>> {
    const startTime = Date.now();
    
    try {
      // Wait for rate limit
      await this.rateLimiter.waitForSlot();
      
      // Check memory usage
      if (this.isMemoryPressure()) {
        await this.waitForMemoryRelief();
      }
      
      // Process the task
      const result = await processor(task.data);
      
      const duration = Date.now() - startTime;
      this.updateMetrics('success', duration);
      
      return {
        id: task.id,
        success: true,
        result,
        duration,
        retries: task.retryCount || 0
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.shouldRetry(task, error as Error)) {
        task.retryCount = (task.retryCount || 0) + 1;
        await this.delay(this.calculateRetryDelay(task.retryCount));
        
        return this.processTask(task, processor);
      }
      
      this.updateMetrics('failure', duration);
      
      return {
        id: task.id,
        success: false,
        error: error as Error,
        duration,
        retries: task.retryCount || 0
      };
    }
  }

  /**
   * Process multiple tasks in parallel
   */
  async processBatch(
    tasks: T[],
    processor: (data: T) => Promise<R>,
    options?: {
      onProgress?: (completed: number, total: number) => void;
      preserveOrder?: boolean;
    }
  ): Promise<ProcessingResult<R>[]> {
    // Convert to processing tasks
    const processingTasks: ProcessingTask<T>[] = tasks.map((data, index) => ({
      id: `task-${Date.now()}-${index}`,
      data,
      createdAt: new Date()
    }));

    // Add to queue
    this.addToQueue(processingTasks);

    // Process queue
    const results = new Map<string, ProcessingResult<R>>();
    const totalTasks = processingTasks.length;
    let completedCount = 0;

    // Start processing
    while (this.queue.length > 0 || this.activeProcessing.size > 0) {
      // Fill up to max concurrency
      while (
        this.activeProcessing.size < this.options.maxConcurrency &&
        this.queue.length > 0 &&
        !this.paused
      ) {
        const task = this.getNextTask();
        if (!task) break;

        const processingPromise = this.processTask(task, processor)
          .then(result => {
            results.set(task.id, result);
            completedCount++;
            
            if (options?.onProgress) {
              options.onProgress(completedCount, totalTasks);
            }
            
            return result;
          })
          .finally(() => {
            this.activeProcessing.delete(task.id);
          });

        this.activeProcessing.set(task.id, processingPromise as any);
      }

      // Wait for at least one task to complete
      if (this.activeProcessing.size > 0) {
        await Promise.race(Array.from(this.activeProcessing.values()));
      }
    }

    // Return results in order if requested
    if (options?.preserveOrder) {
      return processingTasks.map(task => results.get(task.id)!);
    }

    return Array.from(results.values());
  }

  /**
   * Process tasks with streaming results
   */
  async *processStream(
    tasks: T[],
    processor: (data: T) => Promise<R>
  ): AsyncGenerator<ProcessingResult<R>, void, unknown> {
    const processingTasks: ProcessingTask<T>[] = tasks.map((data, index) => ({
      id: `task-${Date.now()}-${index}`,
      data,
      createdAt: new Date()
    }));

    this.addToQueue(processingTasks);

    while (this.queue.length > 0 || this.activeProcessing.size > 0) {
      // Fill up to max concurrency
      const promises: Promise<ProcessingResult<R>>[] = [];
      
      while (
        this.activeProcessing.size < this.options.maxConcurrency &&
        this.queue.length > 0 &&
        !this.paused
      ) {
        const task = this.getNextTask();
        if (!task) break;

        const processingPromise = this.processTask(task, processor)
          .finally(() => {
            this.activeProcessing.delete(task.id);
          });

        this.activeProcessing.set(task.id, processingPromise as any);
        promises.push(processingPromise);
      }

      // Yield results as they complete
      if (promises.length > 0) {
        const result = await Promise.race(promises);
        yield result;
      } else if (this.activeProcessing.size > 0) {
        // Wait for active tasks
        const result = await Promise.race(
          Array.from(this.activeProcessing.values()).map(p => p as any as Promise<ProcessingResult<R>>)
        );
        yield result;
      }
    }
  }

  /**
   * Pause processing
   */
  pause() {
    this.paused = true;
    this.emit('paused');
  }

  /**
   * Resume processing
   */
  resume() {
    this.paused = false;
    this.emit('resumed');
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
    this.emit('queueCleared');
  }

  /**
   * Shutdown processor
   */
  async shutdown() {
    this.pause();
    
    // Wait for active tasks to complete
    if (this.activeProcessing.size > 0) {
      await Promise.all(Array.from(this.activeProcessing.values()));
    }
    
    this.clearQueue();
    
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    this.emit('shutdown');
  }

  private addToQueue(tasks: ProcessingTask<T>[]) {
    for (const task of tasks) {
      if (this.queue.length >= this.options.maxQueueSize) {
        throw new Error(`Queue size limit exceeded: ${this.options.maxQueueSize}`);
      }
      this.queue.push(task);
    }
    
    this.metrics.queueLength = this.queue.length;
    this.metrics.totalTasks += tasks.length;
  }

  private getNextTask(): ProcessingTask<T> | null {
    if (this.queue.length === 0) return null;
    
    // Sort by priority if available
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    const task = this.queue.shift()!;
    this.metrics.queueLength = this.queue.length;
    
    return task;
  }

  private shouldRetry(task: ProcessingTask<T>, error: Error): boolean {
    const retryCount = task.retryCount || 0;
    
    if (retryCount >= this.options.maxRetries) {
      return false;
    }
    
    // Check if error is retryable
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'rate limit',
      'timeout',
      '429',
      '503'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(e => errorMessage.includes(e));
  }

  private calculateRetryDelay(retryCount: number): number {
    return this.options.retryDelay * Math.pow(this.options.backoffMultiplier, retryCount - 1);
  }

  private isMemoryPressure(): boolean {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    return heapUsedMB > this.options.maxMemoryUsage;
  }

  private async waitForMemoryRelief(): Promise<void> {
    const checkInterval = 100;
    const maxWaitTime = 10000;
    let waited = 0;
    
    while (this.isMemoryPressure() && waited < maxWaitTime) {
      await this.delay(checkInterval);
      waited += checkInterval;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  private updateMetrics(result: 'success' | 'failure', duration: number) {
    if (result === 'success') {
      this.metrics.completedTasks++;
    } else {
      this.metrics.failedTasks++;
    }
    
    // Update average processing time
    const totalProcessed = this.metrics.completedTasks + this.metrics.failedTasks;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (totalProcessed - 1) + duration) / totalProcessed;
    
    this.metrics.currentConcurrency = this.activeProcessing.size;
  }

  private startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      const usage = process.memoryUsage();
      this.metrics.memoryUsage = usage.heapUsed / 1024 / 1024;
      this.metrics.requestsPerMinute = this.rateLimiter.getRequestsPerMinute();
      
      this.emit('metrics', this.getMetrics());
    }, this.options.metricsInterval);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiter implementation
 */
class RateLimiter {
  private requestTimestamps: number[] = [];
  private maxPerMinute: number;
  private maxPerSecond: number;

  constructor(options: { maxPerMinute: number; maxPerSecond: number }) {
    this.maxPerMinute = options.maxPerMinute;
    this.maxPerSecond = options.maxPerSecond;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => now - ts < 60000
    );

    // Check per-second limit
    const lastSecond = this.requestTimestamps.filter(
      ts => now - ts < 1000
    );
    
    if (lastSecond.length >= this.maxPerSecond) {
      const oldestInSecond = Math.min(...lastSecond);
      const waitTime = 1000 - (now - oldestInSecond) + 50; // Add small buffer
      await this.delay(waitTime);
      return this.waitForSlot();
    }

    // Check per-minute limit
    if (this.requestTimestamps.length >= this.maxPerMinute) {
      const oldest = Math.min(...this.requestTimestamps);
      const waitTime = 60000 - (now - oldest) + 50;
      await this.delay(waitTime);
      return this.waitForSlot();
    }

    // Add current request
    this.requestTimestamps.push(now);
  }

  getRequestsPerMinute(): number {
    const now = Date.now();
    return this.requestTimestamps.filter(ts => now - ts < 60000).length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Batch processor with automatic batching
 */
export class BatchProcessor<T, R> {
  private processor: ParallelProcessor<T[], R[]>;
  private batchQueue: T[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(
    private batchFn: (items: T[]) => Promise<R[]>,
    private options: {
      maxBatchSize: number;
      maxBatchDelay: number;
      parallelOptions?: ParallelProcessingOptions;
    }
  ) {
    this.processor = new ParallelProcessor(options.parallelOptions);
  }

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push(item);
      
      // Set up result handler
      const resultIndex = this.batchQueue.length - 1;
      
      // Process if batch is full
      if (this.batchQueue.length >= this.options.maxBatchSize) {
        this.processBatch().then(results => {
          resolve(results[resultIndex] as R);
        }).catch(reject);
      } else {
        // Set timer for batch delay
        if (!this.batchTimer) {
          this.batchTimer = setTimeout(() => {
            this.processBatch().then(results => {
              resolve(results[resultIndex] as R);
            }).catch(reject);
          }, this.options.maxBatchDelay);
        }
      }
    });
  }

  private async processBatch(): Promise<R[]> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    if (batch.length === 0) {
      return [];
    }

    const result = await this.processor.processTask(
      {
        id: `batch-${Date.now()}`,
        data: batch
      },
      this.batchFn
    );

    if (!result.success) {
      throw result.error;
    }

    return result.result!;
  }
}