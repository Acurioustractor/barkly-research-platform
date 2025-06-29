import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/utils/document-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
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

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Process files
    const documents = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return { buffer, filename: file.name };
      })
    );

    let result;
    if (documents.length === 1) {
      // Single document processing
      result = await DocumentProcessor.extractTextFromPDF(
        documents[0]!.buffer,
        documents[0]!.filename
      );
    } else {
      // Multiple document processing with comparative analysis
      result = await DocumentProcessor.processMultipleDocuments(documents);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully processed ${files.length} document(s)`
    });

  } catch (error) {
    console.error('Document processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Document upload endpoint',
    supportedFormats: ['PDF'],
    maxFileSize: '10MB',
    maxFiles: 10
  });
}