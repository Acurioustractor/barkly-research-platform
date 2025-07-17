import { NextRequest, NextResponse } from 'next/server';
import { addDocumentToQueue, getJobStatus, getQueueStatus } from '@/lib/job-queue';
import { isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 30; // 30 seconds for initial upload
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check if Redis is configured (temporarily disabled for Vercel)
    // if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    //   return NextResponse.json(
    //     { 
    //       error: 'Background processing not configured',
    //       details: 'Redis connection required for async processing'
    //     },
    //     { status: 501 }
    //   );
    // }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const source = formData.get('source') as string || 'async_upload';
    const category = formData.get('category') as string || 'general';
    const tags = formData.get('tags') as string;
    const useAI = formData.get('useAI') !== 'false';
    const generateSummary = formData.get('generateSummary') === 'true';
    const generateEmbeddings = formData.get('generateEmbeddings') === 'true';
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file types
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // No size limit for async processing (within reason)
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `File size must be less than 50MB`,
          oversizedFiles: oversizedFiles.map(f => ({ name: f.name, size: f.size }))
        },
        { status: 400 }
      );
    }

    // Process files
    const jobs = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `async_${Date.now()}_${file.name}`;
        
        const jobId = await addDocumentToQueue({
          buffer,
          filename,
          originalName: file.name,
          options: {
            source,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            useAI,
            generateSummary,
            generateEmbeddings
          }
        });

        return {
          jobId,
          filename: file.name,
          size: file.size
        };
      })
    );

    // Get queue status
    const queueStatus = await getQueueStatus();

    return NextResponse.json({
      success: true,
      message: `${jobs.length} documents queued for processing`,
      jobs,
      queueStatus,
      statusEndpoint: '/api/documents/async-upload/status'
    });

  } catch (error) {
    console.error('Async upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to queue documents for processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (jobId) {
      // Get specific job status
      const status = await getJobStatus(jobId);
      
      if (!status) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(status);
    } else {
      // Get queue status
      const queueStatus = await getQueueStatus();
      return NextResponse.json(queueStatus);
    }

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}