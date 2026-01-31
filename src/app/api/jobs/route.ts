import { NextRequest, NextResponse } from 'next/server';
import { globalDocumentProcessor } from '@/lib/ai/processing/document-job-processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const jobId = searchParams.get('jobId');
    const documentId = searchParams.get('documentId');
    const status = searchParams.get('status') as any;
    const limit = searchParams.get('limit');

    switch (action) {
      case 'stats':
        const stats = globalDocumentProcessor.getStats();
        return NextResponse.json({ stats });

      case 'job':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required' },
            { status: 400 }
          );
        }
        const job = globalDocumentProcessor.getJob(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ job });

      case 'list':
      default:
        const jobs = globalDocumentProcessor.getJobs({
          status,
          documentId: documentId || undefined,
          limit: limit ? parseInt(limit) : undefined,
        });
        return NextResponse.json({ jobs });
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'cancel': {
        const body = await request.json();
        const { jobId } = body;
        
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required' },
            { status: 400 }
          );
        }

        const cancelled = globalDocumentProcessor.cancelJob(jobId);
        return NextResponse.json({ cancelled });
      }

      case 'cleanup': {
        const body = await request.json();
        const { maxAge } = body;
        
        const cleaned = globalDocumentProcessor.cleanupJobs(
          maxAge || 24 * 60 * 60 * 1000 // Default 24 hours
        );
        
        return NextResponse.json({ cleaned });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Jobs API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}