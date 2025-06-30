import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { AIEnhancedDocumentProcessor } from '@/utils/ai-enhanced-document-processor';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
};

// Create Redis connection
const connection = new Redis(redisConfig);

// Define job types
export interface DocumentProcessingJob {
  documentId: string;
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
  };
}

// Create queues
export const documentQueue = new Queue<DocumentProcessingJob>('document-processing', {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100      // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job processor
export function createDocumentWorker() {
  const worker = new Worker<DocumentProcessingJob>(
    'document-processing',
    async (job: Job<DocumentProcessingJob>) => {
      const { buffer, filename, originalName, options } = job.data;
      
      // Update job progress
      await job.updateProgress(10);
      
      // Create processor instance
      const processor = new AIEnhancedDocumentProcessor();
      
      // Process document
      const result = await processor.processAndStoreDocument(
        Buffer.from(buffer), // Recreate buffer from serialized data
        filename,
        originalName,
        options
      );
      
      await job.updateProgress(100);
      
      return result;
    },
    {
      connection,
      concurrency: parseInt(process.env.JOB_CONCURRENCY || '2'), // Process 2 documents at a time
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  worker.on('progress', (job, progress) => {
    console.log(`Job ${job.id} progress: ${progress}%`);
  });

  return worker;
}

// Helper functions
export async function addDocumentToQueue(
  documentData: Omit<DocumentProcessingJob, 'documentId'> & { documentId?: string }
): Promise<string> {
  const job = await documentQueue.add(
    'process-document',
    {
      ...documentData,
      documentId: documentData.documentId || generateDocumentId(),
      // Ensure buffer is properly serialized
      buffer: Buffer.from(documentData.buffer)
    },
    {
      priority: documentData.options.useAI ? 1 : 2, // AI jobs have higher priority
    }
  );
  
  return job.id || '';
}

export async function getJobStatus(jobId: string) {
  const job = await documentQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const result = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    state,
    progress,
    result,
    failedReason,
    createdAt: job.timestamp,
    processedAt: job.processedOn,
    finishedAt: job.finishedOn,
  };
}

export async function getQueueStatus() {
  const [waiting, active, completed, failed] = await Promise.all([
    documentQueue.getWaitingCount(),
    documentQueue.getActiveCount(),
    documentQueue.getCompletedCount(),
    documentQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

// Utility function to generate document ID
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Graceful shutdown
export async function shutdownQueue() {
  await documentQueue.close();
  await connection.quit();
}