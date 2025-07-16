import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { ImprovedPDFExtractor } from '@/utils/pdf-extractor-improved';
import { 
  checkRateLimit, 
  validateFileUpload, 
  validateContentType,
  addSecurityHeaders,
  validateIndigenousDataProtocols,
  sanitizeInput,
  logSecurityEvent
} from '@/middleware/security';

export async function POST(request: NextRequest) {
  try {
    console.log('[documents] POST request received');

    // Rate limiting check
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', request);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    // Content type validation (more lenient for development)
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      logSecurityEvent('INVALID_CONTENT_TYPE', request, { 
        contentType: contentType 
      });
      console.warn('[SECURITY] Unexpected content type:', contentType);
      // Don't block for now, just log
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File || formData.get('files') as File;
    
    if (!file) {
      logSecurityEvent('MISSING_FILE', request);
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[documents] Processing file: ${file.name}, size: ${file.size}`);

    // Enhanced file validation
    try {
      const fileValidation = validateFileUpload(file);
      if (!fileValidation.valid) {
        logSecurityEvent('INVALID_FILE_UPLOAD', request, { 
          fileName: file.name, 
          fileSize: file.size,
          error: fileValidation.error 
        });
        return NextResponse.json({ error: fileValidation.error }, { status: 400 });
      }
    } catch (validationError) {
      console.error('[SECURITY] File validation error:', validationError);
      // Continue with basic validation as fallback
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
      }
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
      }
    }

    // Extract text content
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractor = new ImprovedPDFExtractor(buffer);
    const extractedData = await extractor.extractText();

    // Validate Indigenous data protocols
    const protocolValidation = validateIndigenousDataProtocols(extractedData.text);
    if (protocolValidation.warnings.length > 0) {
      logSecurityEvent('INDIGENOUS_DATA_WARNING', request, {
        fileName: file.name,
        warnings: protocolValidation.warnings
      });
      console.warn('[INDIGENOUS_DATA]', protocolValidation.warnings);
    }

    // Sanitize form inputs
    const category = sanitizeInput(formData.get('category') as string || 'general');
    const source = sanitizeInput(formData.get('source') as string || 'upload');
    const tags = sanitizeInput(formData.get('tags') as string || '');

    // Create document record
    const document = await prisma.document.create({
      data: {
        filename: `${Date.now()}-${sanitizeInput(file.name)}`,
        originalName: sanitizeInput(file.name),
        mimeType: 'application/pdf',
        size: file.size,
        wordCount: extractedData.text.split(/\s+/).length,
        pageCount: extractedData.pageCount || 1,
        fullText: extractedData.text,
        status: 'COMPLETED',
        category,
        source,
        tags,
        uploadedAt: new Date(),
        processedAt: new Date(),
      }
    });

    console.log(`[documents] Document created with ID: ${document.id}`);

    // Log successful upload
    logSecurityEvent('DOCUMENT_UPLOAD_SUCCESS', request, {
      documentId: document.id,
      fileName: document.originalName,
      fileSize: document.size,
      wordCount: document.wordCount,
      indigenousWarnings: protocolValidation.warnings.length
    });

    const response = NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        size: document.size,
        wordCount: document.wordCount,
        pageCount: document.pageCount,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
      indigenousDataWarnings: protocolValidation.warnings,
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('[documents] Upload error:', error);
    logSecurityEvent('DOCUMENT_UPLOAD_ERROR', request, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const response = NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    
    return addSecurityHeaders(response);
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