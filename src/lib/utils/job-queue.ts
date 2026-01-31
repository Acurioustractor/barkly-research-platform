// Temporarily disable Redis/BullMQ for Vercel deployment
// import { Queue, Worker, Job } from 'bullmq';
// import Redis from 'ioredis';
import { AIEnhancedDocumentProcessor } from '@/utils/ai-enhanced-document-processor';

// Check if Redis is available
const isRedisAvailable = () => {
  return !!(process.env.REDIS_HOST || process.env.REDIS_URL) && process.env.NODE_ENV !== 'production';
};

// Mock Redis connection for Vercel
const connection = null;

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

// Mock queue for Vercel deployment
export const documentQueue = {
  add: async () => Promise.resolve({ id: 'mock-job-id' }),
  getJob: async () => Promise.resolve(null),
  getWaitingCount: async () => Promise.resolve(0),
  getActiveCount: async () => Promise.resolve(0),
  getCompletedCount: async () => Promise.resolve(0),
  getFailedCount: async () => Promise.resolve(0),
  close: async () => Promise.resolve()
};

// Mock worker for Vercel deployment
export function createDocumentWorker() {
  console.warn('[JOB-QUEUE] Redis not available - background processing disabled');
  return {
    on: () => {},
    close: async () => Promise.resolve()
  };
}

// Helper functions
export async function addDocumentToQueue(
  documentData: Omit<DocumentProcessingJob, 'documentId'> & { documentId?: string }
): Promise<string> {
  console.warn('[JOB-QUEUE] Background processing disabled - returning mock job ID');
  return 'mock-job-' + Date.now();
}

export async function getJobStatus(jobId: string) {
  return {
    id: jobId,
    state: 'completed',
    progress: 100,
    result: null,
    failedReason: null,
    createdAt: Date.now(),
    processedAt: Date.now(),
    finishedAt: Date.now(),
  };
}

export async function getQueueStatus() {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };
}

// Utility function to generate document ID
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Graceful shutdown
export async function shutdownQueue() {
  console.log('[JOB-QUEUE] Shutdown complete (mocked)');
}