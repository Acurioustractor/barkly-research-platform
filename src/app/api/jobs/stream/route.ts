import { NextRequest, NextResponse } from 'next/server';
import { globalDocumentProcessor } from '@/lib/document-job-processor';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', timestamp: Date.now() });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      // If specific job ID is requested, send its current status
      if (jobId) {
        const job = globalDocumentProcessor.getJob(jobId);
        if (job) {
          const jobData = JSON.stringify({ 
            type: 'job:status', 
            job: {
              id: job.id,
              status: job.status,
              progress: job.progress,
              error: job.error,
            }
          });
          controller.enqueue(encoder.encode(`data: ${jobData}\n\n`));
        }
      }

      // Set up event listeners for job updates
      const handleJobEvent = (eventType: string) => (job: any) => {
        // Filter events if jobId is specified
        if (jobId && job.id !== jobId) {
          return;
        }

        const data = JSON.stringify({
          type: eventType,
          job: {
            id: job.id,
            documentId: job.documentId,
            type: job.type,
            status: job.status,
            progress: job.progress,
            error: job.error,
            estimatedDuration: job.estimatedDuration,
            actualDuration: job.actualDuration,
          },
          timestamp: Date.now(),
        });
        
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Register event listeners
      globalDocumentProcessor.on('job:added', handleJobEvent('job:added'));
      globalDocumentProcessor.on('job:started', handleJobEvent('job:started'));
      globalDocumentProcessor.on('job:progress', (job) => {
        // Filter events if jobId is specified
        if (jobId && job.id !== jobId) {
          return;
        }

        const data = JSON.stringify({
          type: 'job:progress',
          job: {
            id: job.id,
            status: job.status,
            progress: job.progress,
            message: job.message,
          },
          timestamp: Date.now(),
        });
        
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });
      globalDocumentProcessor.on('job:completed', handleJobEvent('job:completed'));
      globalDocumentProcessor.on('job:failed', handleJobEvent('job:failed'));
      globalDocumentProcessor.on('job:retry', handleJobEvent('job:retry'));
      globalDocumentProcessor.on('job:cancelled', handleJobEvent('job:cancelled'));

      // Send periodic stats updates (every 5 seconds)
      const statsInterval = setInterval(() => {
        try {
          const stats = globalDocumentProcessor.getStats();
          const data = JSON.stringify({
            type: 'stats:update',
            stats,
            timestamp: Date.now(),
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('Error sending stats update:', error);
        }
      }, 5000);

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          const data = JSON.stringify({ 
            type: 'heartbeat', 
            timestamp: Date.now() 
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(heartbeatInterval);
          clearInterval(statsInterval);
        }
      }, 30000); // Every 30 seconds

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        clearInterval(statsInterval);
        globalDocumentProcessor.removeAllListeners('job:added');
        globalDocumentProcessor.removeAllListeners('job:started');
        globalDocumentProcessor.removeAllListeners('job:progress');
        globalDocumentProcessor.removeAllListeners('job:completed');
        globalDocumentProcessor.removeAllListeners('job:failed');
        globalDocumentProcessor.removeAllListeners('job:retry');
        globalDocumentProcessor.removeAllListeners('job:cancelled');
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        cleanup();
        controller.close();
      });

      // Store cleanup function for potential later use
      (controller as any).cleanup = cleanup;
    },

    cancel() {
      // Cleanup when stream is cancelled
      if ((this as any).cleanup) {
        (this as any).cleanup();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}