import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { fileStorage } from '@/lib/utils/file-storage';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const forceDownload = searchParams.get('download') === 'true';
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get document from database
    const document = await prisma.document.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true
      }
    });

    if (!document) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    // Try to get the stored file
    let fileBuffer: Buffer | null = null;
    let filename = document.filename;
    let mimeType = document.mimeType;

    // For backward compatibility, try to find file by document filename or check subfolders
    fileBuffer = await fileStorage.getFile(document.filename);

    if (!fileBuffer) {
      // Try again with just the basename just in case
      fileBuffer = await fileStorage.getFile(path.basename(document.filename));
    }

    if (!fileBuffer) {
      // Fallback: check if file exists in test-documents directory
      const testDocPath = path.join(process.cwd(), 'test-documents');
      try {
        const fs = await import('fs/promises');
        const testFiles = await fs.readdir(testDocPath);

        // Try to find a matching file
        const matchingFile = testFiles.find((file: any) =>
          file.includes(document.originalName.replace(/[^a-zA-Z0-9.-]/g, '')) ||
          document.originalName.includes(file.replace(/[^a-zA-Z0-9.-]/g, ''))
        );

        if (matchingFile) {
          const testFilePath = path.join(testDocPath, matchingFile);
          fileBuffer = await fs.readFile(testFilePath);
          filename = matchingFile;

          // Update mime type based on file extension
          if (matchingFile.endsWith('.pdf')) {
            mimeType = 'application/pdf';
          } else if (matchingFile.endsWith('.docx')) {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          }
        }
      } catch (error) {
        console.error('Failed to check test documents:', error);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({
        error: 'Original file not available',
        message: 'This document was processed for text extraction only. The original file is not stored in the system.',
        alternatives: [
          'View extracted text content',
          'Download text version',
          'View AI analysis'
        ]
      }, { status: 404 });
    }

    // Set appropriate headers for file serving
    const headers = new Headers();
    headers.set('Content-Type', mimeType || 'application/octet-stream');
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Content-Disposition', `${forceDownload ? 'attachment' : 'inline'}; filename="${document.originalName}"`);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json({
      error: 'Failed to serve file'
    }, { status: 500 });
  }
}