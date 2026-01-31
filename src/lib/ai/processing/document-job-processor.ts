import { EventEmitter } from 'events';
import { AIEnhancedDocumentProcessor } from '@/utils/ai-enhanced-document-processor';
import { WorldClassDocumentProcessor } from '@/utils/world-class-document-processor';
import { AIAnalysisValidator } from '@/lib/ai/ai-analysis-validator';
import { OptimizedChunkingService } from '@/lib/ai/processing/optimized-chunking-service';
import { prisma } from '@/lib/database-safe';

export interface DocumentJob {
  id: string;
  documentId: string;
  type: 'quick' | 'standard' | 'deep' | 'world-class';
  buffer: Buffer;
  filename: string;
  originalName: string;
  options: {
    source?: string;
    category?: string;
    tags?: string[];
    useAI?: boolean;
    generateSummary?: boolean;
    generateEmbeddings?: boolean;
    extractEntities?: boolean;
    generateInsights?: boolean;
    extractThemes?: boolean;
    extractQuotes?: boolean;
    processingType?: string;
    priority?: string;
    enableValidation?: boolean;
    optimizeChunking?: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  estimatedDuration?: number;
  actualDuration?: number;
  validationResult?: any;
  chunkingMetadata?: any;
}

export class DocumentJobProcessor extends EventEmitter {
  private jobs: Map<string, DocumentJob> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrent: number;
  private processingLoop: NodeJS.Timeout | null = null;
  private validator: AIAnalysisValidator;
  private chunkingService: OptimizedChunkingService;

  constructor(maxConcurrent: number = 2) {
    super();
    this.maxConcurrent = maxConcurrent;
    this.validator = new AIAnalysisValidator();
    this.chunkingService = new OptimizedChunkingService();
    this.startProcessing();
  }

  /**
   * Add a document processing job to the queue
   */
  async addJob(
    buffer: Buffer,
    filename: string,
    originalName: string,
    options: DocumentJob['options'] = {},
    jobOptions: {
      type?: DocumentJob['type'];
      priority?: DocumentJob['priority'];
      maxRetries?: number;
      documentId?: string;
    } = {}
  ): Promise<string> {
    // Create document record first
    const documentId = jobOptions.documentId || await this.createDocumentRecord(
      filename,
      originalName,
      buffer.length,
      options
    );

    const job: DocumentJob = {
      id: this.generateJobId(),
      documentId,
      type: jobOptions.type || this.selectProcessorType(buffer, options),
      buffer,
      filename,
      originalName,
      options,
      priority: jobOptions.priority || 'medium',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: jobOptions.maxRetries || 3,
      estimatedDuration: this.estimateProcessingTime(buffer, options),
    };

    this.jobs.set(job.id, job);
    this.emit('job:added', job);

    // Update document status
    await this.updateDocumentStatus(documentId, 'PROCESSING');

    return job.id;
  }

  /**
   * Get job information
   */
  getJob(id: string): DocumentJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs with filtering
   */
  getJobs(filter?: {
    status?: DocumentJob['status'];
    documentId?: string;
    limit?: number;
  }): DocumentJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter(job => job.status === filter.status);
    }

    if (filter?.documentId) {
      jobs = jobs.filter(job => job.documentId === filter.documentId);
    }

    // Sort by priority and creation time
    jobs.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    if (filter?.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs;
  }

  /**
   * Cancel a pending job
   */
  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job && job.status === 'pending') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = new Date();
      this.emit('job:cancelled', job);
      return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    estimatedWaitTime: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const pending = jobs.filter(j => j.status === 'pending');
    const processing = jobs.filter(j => j.status === 'processing');
    
    // Estimate wait time for pending jobs
    const avgProcessingTime = this.calculateAverageProcessingTime();
    const estimatedWaitTime = Math.ceil(
      (pending.length * avgProcessingTime) / this.maxConcurrent
    );

    return {
      total: jobs.length,
      pending: pending.length,
      processing: processing.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      retrying: jobs.filter(j => j.status === 'retrying').length,
      estimatedWaitTime,
    };
  }

  /**
   * Start the job processing loop
   */
  private startProcessing(): void {
    if (this.processingLoop) {
      clearInterval(this.processingLoop);
    }
    
    this.processingLoop = setInterval(() => {
      this.processNext();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Process the next job in the queue
   */
  private async processNext(): Promise<void> {
    if (this.processing.size >= this.maxConcurrent) {
      return; // At capacity
    }

    const pendingJobs = this.getJobs({ status: 'pending' });
    const nextJob = pendingJobs[0];

    if (!nextJob) {
      return; // No pending jobs
    }

    this.processing.add(nextJob.id);
    
    try {
      await this.processJob(nextJob);
    } finally {
      this.processing.delete(nextJob.id);
    }
  }

  /**
   * Process a specific job
   */
  private async processJob(job: DocumentJob): Promise<void> {
    job.status = 'processing';
    job.startedAt = new Date();
    this.emit('job:started', job);

    try {
      const processor = this.createProcessor(job.type);
      
      // Set up progress reporting
      const progressCallback = (progress: number, message?: string) => {
        job.progress = Math.min(100, Math.max(0, progress));
        this.emit('job:progress', { ...job, message });
      };

      // Process the document
      const result = await this.processDocument(
        processor,
        job,
        progressCallback
      );

      // Validate AI analysis results if enabled
      if (job.options.enableValidation && job.options.useAI) {
        progressCallback(90, 'Validating AI analysis results...');
        const validationResult = await this.validateAnalysisResults(result, job);
        job.validationResult = validationResult;
        
        // Check if reprocessing is needed
        if (validationResult.shouldReprocess && job.retryCount < job.maxRetries) {
          progressCallback(95, 'Quality check failed, reprocessing...');
          job.retryCount++;
          job.status = 'retrying';
          this.emit('job:retrying', job);
          await this.processJob(job);
          return;
        }
      }

      job.result = result;
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      job.actualDuration = Date.now() - job.startedAt!.getTime();

      // Update document status
      await this.updateDocumentStatus(job.documentId, 'COMPLETED');
      
      this.emit('job:completed', job);
    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  /**
   * Handle job processing errors with retry logic
   */
  private async handleJobError(job: DocumentJob, error: any): Promise<void> {
    job.error = error.message || 'Unknown error';
    job.retryCount++;

    if (job.retryCount <= job.maxRetries) {
      job.status = 'retrying';
      this.emit('job:retry', job);

      // Schedule retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, job.retryCount - 1), 30000);
      setTimeout(() => {
        job.status = 'pending';
        job.error = undefined;
      }, delay);
    } else {
      job.status = 'failed';
      job.completedAt = new Date();
      
      // Update document status
      await this.updateDocumentStatus(job.documentId, 'FAILED', job.error);
      
      this.emit('job:failed', job);
    }
  }

  /**
   * Create the appropriate processor for the job type
   */
  private createProcessor(type: DocumentJob['type']) {
    switch (type) {
      case 'world-class':
        return new WorldClassDocumentProcessor();
      case 'deep':
      case 'standard':
      case 'quick':
      default:
        return new AIEnhancedDocumentProcessor();
    }
  }

  /**
   * Process document with the selected processor
   */
  private async processDocument(
    processor: any,
    job: DocumentJob,
    progressCallback: (progress: number, message?: string) => void
  ): Promise<any> {
    // Optimize chunking strategy if enabled
    if (job.options.optimizeChunking && job.options.useAI) {
      progressCallback(10, 'Optimizing chunking strategy...');
      await this.optimizeChunkingForJob(job);
    }
    
    if (processor instanceof WorldClassDocumentProcessor) {
      // World-class processor with progress updates
      return await processor.processAndStoreDocument(
        job.buffer,
        job.filename,
        job.originalName,
        job.options
      );
    } else {
      // Standard AI-enhanced processor
      progressCallback(25, 'Starting document processing...');
      
      const result = await processor.processAndStoreDocument(
        job.buffer,
        job.filename,
        job.originalName,
        job.options
      );
      
      progressCallback(100, 'Processing completed');
      return result;
    }
  }

  /**
   * Select the appropriate processor type based on document and options
   */
  private selectProcessorType(
    buffer: Buffer,
    options: DocumentJob['options']
  ): DocumentJob['type'] {
    const sizeInMB = buffer.length / (1024 * 1024);
    
    // Large documents or comprehensive analysis use world-class
    if (sizeInMB > 5 || options.generateInsights || options.extractEntities) {
      return 'world-class';
    }
    
    // Medium documents with AI use deep processing
    if (sizeInMB > 2 && options.useAI) {
      return 'deep';
    }
    
    // Standard processing for most documents
    return options.useAI ? 'standard' : 'quick';
  }

  /**
   * Validate AI analysis results
   */
  private async validateAnalysisResults(result: any, job: DocumentJob): Promise<any> {
    try {
      const validation = await this.validator.validateCompleteAnalysis({
        themes: result.themes || [],
        quotes: result.quotes || [],
        insights: result.insights || [],
        entities: result.entities || [],
        documentId: job.documentId
      });
      
      return validation;
    } catch (error) {
      console.error('Validation error:', error);
      return {
        overallScore: 0.5,
        componentScores: { themes: 0.5, quotes: 0.5, insights: 0.5, entities: 0.5 },
        issues: ['Validation failed'],
        recommendations: ['Manual review recommended'],
        shouldReprocess: false
      };
    }
  }
  
  /**
   * Optimize chunking strategy for job
   */
  private async optimizeChunkingForJob(job: DocumentJob): Promise<void> {
    try {
      const text = job.buffer.toString('utf-8');
      const recommendation = await this.chunkingService.recommendStrategy(text);
      
      // Store chunking metadata
      job.chunkingMetadata = {
        recommendedStrategy: recommendation.strategy,
        reasoning: recommendation.reasoning,
        expectedPerformance: recommendation.expectedPerformance
      };
      
      // Update job options with optimized chunking parameters
      if (recommendation.strategy === 'embedding-optimized') {
        job.options.generateEmbeddings = true;
      }
      
    } catch (error) {
      console.error('Chunking optimization error:', error);
      // Continue with default chunking
    }
  }
  
  /**
   * Get chunking performance statistics
   */
  getChunkingStats(): any {
    return this.chunkingService.getPerformanceStats();
  }
  
  /**
   * Get validation configuration
   */
  getValidationConfig(): any {
    return this.validator.getValidationConfig();
  }
  
  /**
   * Update validation configuration
   */
  updateValidationConfig(config: any): void {
    this.validator.updateValidationConfig(config);
  }
  
  /**
   * Estimate processing time based on document and options
   */
  private estimateProcessingTime(
    buffer: Buffer,
    options: DocumentJob['options']
  ): number {
    const sizeInMB = buffer.length / (1024 * 1024);
    let baseTime = Math.max(10, sizeInMB * 5); // 5 seconds per MB, min 10 seconds
    
    if (options.useAI) baseTime *= 3;
    if (options.generateInsights) baseTime *= 2;
    if (options.extractEntities) baseTime *= 1.5;
    if (options.generateEmbeddings) baseTime *= 1.5;
    
    return Math.ceil(baseTime);
  }

  /**
   * Calculate average processing time from completed jobs
   */
  private calculateAverageProcessingTime(): number {
    const completedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' && job.actualDuration);
    
    if (completedJobs.length === 0) {
      return 60; // Default 60 seconds
    }
    
    const totalTime = completedJobs.reduce(
      (sum, job) => sum + (job.actualDuration || 0),
      0
    );
    
    return totalTime / completedJobs.length / 1000; // Convert to seconds
  }

  /**
   * Create initial document record
   */
  private async createDocumentRecord(
    filename: string,
    originalName: string,
    size: number,
    options: DocumentJob['options']
  ): Promise<string> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const document = await prisma.document.create({
      data: {
        filename,
        originalName,
        mimeType: this.getMimeType(filename),
        size,
        source: options.source,
        category: options.category,
        tags: options.tags ? JSON.stringify(options.tags) : undefined,
        status: 'PROCESSING',
      },
    });

    return document.id;
  }

  /**
   * Update document status
   */
  private async updateDocumentStatus(
    documentId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    errorMessage?: string
  ): Promise<void> {
    if (!prisma) return;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        errorMessage,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      md: 'text/markdown',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup completed jobs periodically
   */
  cleanupJobs(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const jobsToRemove = Array.from(this.jobs.values())
      .filter(job => 
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt.getTime() < cutoff
      );
    
    for (const job of jobsToRemove) {
      this.jobs.delete(job.id);
    }
    
    return jobsToRemove.length;
  }

  /**
   * Shutdown the processor
   */
  shutdown(): void {
    if (this.processingLoop) {
      clearInterval(this.processingLoop);
      this.processingLoop = null;
    }
  }
}

// Global document job processor
export const globalDocumentProcessor = new DocumentJobProcessor();