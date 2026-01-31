#!/usr/bin/env node

/**
 * Background worker process for document processing
 * Run this as a separate process: npm run worker
 */

import { createDocumentWorker, shutdownQueue } from './job-queue';

console.log('Starting document processing worker...');

// Create and start worker
const worker = createDocumentWorker();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await worker.close();
  await shutdownQueue();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await worker.close();
  await shutdownQueue();
  process.exit(0);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Don't exit, let the worker continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit, let the worker continue
});

console.log('Worker started and listening for jobs...');