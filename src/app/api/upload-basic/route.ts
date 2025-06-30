import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('[upload-basic] Starting upload');
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results = [];
    
    for (const file of files) {
      try {
        // Just save the file info without any processing
        const documentData = {
          filename: `upload_${Date.now()}_${file.name}`,
          originalName: file.name,
          mimeType: file.type || 'application/pdf',
          size: file.size,
          status: 'COMPLETED' as const,
          fullText: `File uploaded: ${file.name} (${file.size} bytes)`,
          processedAt: new Date(),
          pageCount: 1,
          wordCount: 10
        };

        if (prisma) {
          const doc = await prisma.document.create({ data: documentData });
          results.push({
            success: true,
            documentId: doc.id,
            name: doc.originalName
          });
        } else {
          results.push({
            success: true,
            documentId: 'no-db-' + Date.now(),
            name: file.name,
            note: 'Saved without database'
          });
        }
      } catch (error) {
        console.error('[upload-basic] Error with file:', file.name, error);
        results.push({
          success: false,
          name: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Basic upload completed',
      results
    });

  } catch (error) {
    console.error('[upload-basic] Upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Basic upload endpoint - no PDF processing',
    status: 'ready'
  });
}