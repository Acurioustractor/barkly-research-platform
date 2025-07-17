import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { ImprovedPDFExtractor } from '@/utils/pdf-extractor-improved';
// Temporarily disable security middleware for Vercel debugging
// import { 
//   checkRateLimit, 
//   validateFileUpload, 
//   validateContentType,
//   addSecurityHeaders,
//   validateIndigenousDataProtocols,
//   sanitizeInput,
//   logSecurityEvent
// } from '@/middleware/security';

export async function POST(request: NextRequest) {
  try {
    console.log('[documents] POST request received');

    // Temporarily disable security checks for Vercel debugging
    // // Rate limiting check
    // const rateLimitResult = checkRateLimit(request);
    // if (!rateLimitResult.allowed) {
    //   logSecurityEvent('RATE_LIMIT_EXCEEDED', request);
    //   return NextResponse.json(
    //     { error: 'Rate limit exceeded. Please try again later.' },
    //     { 
    //       status: 429,
    //       headers: {
    //         'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    //         'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    //       }
    //     }
    //   );
    // }

    // // Content type validation (more lenient for development)
    // const contentType = request.headers.get('content-type');
    // if (contentType && !contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
    //   logSecurityEvent('INVALID_CONTENT_TYPE', request, { 
    //     contentType: contentType 
    //   });
    //   console.warn('[SECURITY] Unexpected content type:', contentType);
    //   // Don't block for now, just log
    // }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File || formData.get('files') as File;
    
    if (!file) {
      // logSecurityEvent('MISSING_FILE', request);
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[documents] Processing file: ${file.name}, size: ${file.size}`);

    // Enhanced file validation with size-based recommendations
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large (max 10MB)', 
        recommendation: 'Try compressing the PDF or splitting into smaller sections',
        currentSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: '10MB'
      }, { status: 413 });
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Warn about large files that might have processing issues
    if (file.size > 5 * 1024 * 1024) {
      console.log(`[documents] Large file upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Basic form input handling
    const category = (formData.get('category') as string || 'general').trim();
    const source = (formData.get('source') as string || 'upload').trim();
    const tags = (formData.get('tags') as string || '').trim();

    // Create document record first with PROCESSING status
    const document = await prisma.document.create({
      data: {
        filename: `${Date.now()}-${file.name}`,
        originalName: file.name,
        mimeType: 'application/pdf',
        size: file.size,
        wordCount: 0, // Will be updated after processing
        pageCount: 0, // Will be updated after processing
        fullText: '', // Will be updated after processing
        status: 'PROCESSING',
        category,
        source,
        tags,
        uploadedAt: new Date(),
      }
    });

    try {
      console.log(`[documents] Starting PDF extraction for document ${document.id}`);
      
      // Extract text content with timeout protection
      const buffer = Buffer.from(await file.arrayBuffer());
      const extractor = new ImprovedPDFExtractor(buffer);
      
      // Use shorter timeout for large documents to prevent hanging
      const extractionPromise = extractor.extractText();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF extraction timeout - document too large or complex. Try breaking into smaller sections.')), 45000) // 45 seconds for faster feedback
      );
      
      const extractedData = await Promise.race([extractionPromise, timeoutPromise]) as any;
      
      console.log(`[documents] PDF extraction completed for document ${document.id}, pages: ${extractedData.pageCount}`);

      // Update document with extracted data
      await prisma.document.update({
        where: { id: document.id },
        data: {
          wordCount: extractedData.text.split(/\s+/).length,
          pageCount: extractedData.pageCount || 1,
          fullText: extractedData.text,
          status: 'COMPLETED',
          processedAt: new Date(),
        }
      });

      console.log(`[documents] Document ${document.id} processing completed successfully`);

    } catch (error) {
      console.error(`[documents] Processing failed for document ${document.id}:`, error);
      
      let errorMessage = 'Unknown processing error';
      let userFriendlyMessage = 'Document processing failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('timeout')) {
          userFriendlyMessage = 'Document too large or complex for processing. Try splitting into smaller sections or compressing the PDF.';
        } else if (error.message.includes('memory')) {
          userFriendlyMessage = 'Document requires too much memory to process. Try reducing file size.';
        } else if (error.message.includes('extraction')) {
          userFriendlyMessage = 'Could not extract text from PDF. File may be image-based or corrupted.';
        }
      }
      
      // Update document with detailed error status
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'FAILED',
          errorMessage: userFriendlyMessage,
          processedAt: new Date(),
        }
      });
      
      console.log(`[documents] Document ${document.id} marked as FAILED: ${userFriendlyMessage}`);
      // Don't throw error - return partial success with processing status
    }

    // Get updated document for response
    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id }
    });

    console.log(`[documents] Document created with ID: ${document.id}`);

    // Return response with current status
    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument?.id || document.id,
        filename: updatedDocument?.filename || document.filename,
        originalName: updatedDocument?.originalName || document.originalName,
        size: updatedDocument?.size || document.size,
        wordCount: updatedDocument?.wordCount || document.wordCount,
        pageCount: updatedDocument?.pageCount || document.pageCount,
        status: updatedDocument?.status || document.status,
        uploadedAt: updatedDocument?.uploadedAt || document.uploadedAt,
        processedAt: updatedDocument?.processedAt,
        errorMessage: updatedDocument?.errorMessage,
      },
      message: updatedDocument?.status === 'COMPLETED' ? 'Document processed successfully' :
               updatedDocument?.status === 'FAILED' ? 'Document upload succeeded but processing failed' :
               'Document uploaded and processing...'
    });

  } catch (error) {
    console.error('[documents] Upload error:', error);
    // Temporarily simplified error handling for Vercel debugging
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const where = status ? { status: status as any } : {};

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: {
          id: true,
          filename: true,
          originalName: true,
          status: true,
          uploadedAt: true,
          processedAt: true,
          size: true,
          wordCount: true,
          pageCount: true,
          category: true,
          source: true,
          errorMessage: true,
          _count: {
            select: {
              chunks: true,
              themes: true,
              insights: true
            }
          }
        },
        orderBy: {
          uploadedAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.document.count({ where })
    ]);

    return NextResponse.json({
      documents,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}