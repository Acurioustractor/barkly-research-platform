import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancedDocumentProcessor } from '@/utils/ai-enhanced-document-processor';
import { isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// Increase body size limit to 50MB
export async function POST(request: NextRequest) {
  console.log('[bulk-upload] Request received at:', new Date().toISOString());

  try {
    // Check if database is available
    const dbAvailable = isDatabaseAvailable();
    console.log('[bulk-upload] Database available:', dbAvailable);
    console.log('[bulk-upload] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: Boolean(process.env.VERCEL),
      hasPostgresUrl: Boolean(process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL)
    });

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const source = formData.get('source') as string || 'bulk_upload';
    const category = formData.get('category') as string || 'general';
    const tags = formData.get('tags') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB per file (safe for Vercel)
    const maxFiles = 20; // Allow up to 20 files

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed in bulk upload` },
        { status: 400 }
      );
    }

    // Validate files
    const invalidFiles = files.filter((file: any) =>
      file.type !== 'application/pdf' || file.size > 20 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      return NextResponse.json(
        {
          error: `${invalidFiles.length} files rejected. Only PDF files under 20MB are allowed.`,
          rejectedFiles: invalidFiles.map((f: any) => ({ name: f.name, size: f.size, type: f.type }))
        },
        { status: 400 }
      );
    }

    // Prepare documents for processing
    const documents = await Promise.all(
      files.map(async (file: File, index: number) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: `bulk_${Date.now()}_${index}_${file.name}`,
        originalName: file.name
      }))
    );

    // Process documents with AI-enhanced processor
    const processor = new AIEnhancedDocumentProcessor();
    const useAI = formData.get('useAI') !== 'false'; // Default to true
    const generateSummary = formData.get('generateSummary') === 'true';
    const generateEmbeddings = formData.get('generateEmbeddings') === 'true';

    const processingOptions = {
      source,
      category,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      useAI,
      generateSummary,
      generateEmbeddings
    };

    // Enable AI processing based on form parameters
    console.log(`[bulk-upload] Processing ${documents.length} documents (AI ${processingOptions.useAI ? 'enabled' : 'disabled'})...`);

    // Process documents with timeout and better error handling
    const results: Array<{
      documentId: string;
      status: 'COMPLETED' | 'FAILED' | 'PENDING';
      chunks: number;
      themes: number;
      quotes: number;
      insights: number;
      keywords: number;
      errorMessage?: string;
    }> = [];
    const processingTimeout = 240000; // 4 minutes total (under Vercel's 5 min limit)
    const startTime = Date.now();

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const elapsed = Date.now() - startTime;

      // Check if we're running out of time
      if (elapsed > processingTimeout) {
        console.log(`[bulk-upload] Timeout approaching, stopping at document ${i}/${documents.length}`);
        // Add pending status for remaining documents
        for (let j = i; j < documents.length; j++) {
          results.push({
            documentId: documents[j].filename,
            status: 'PENDING' as const,
            chunks: 0,
            themes: 0,
            quotes: 0,
            insights: 0,
            keywords: 0,
            errorMessage: 'Processing timed out - please retry this document'
          });
        }
        break;
      }

      console.log(`[bulk-upload] Processing document ${i + 1}/${documents.length}: ${doc.originalName}`);

      try {
        // Set a timeout for individual document processing
        const documentPromise = processor.processAndStoreDocument(
          doc.buffer,
          doc.filename,
          doc.originalName,
          processingOptions
        );

        // Timeout after 5 minutes per document (AI analysis takes time)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Document processing timeout')), 300000)
        );

        const result = await Promise.race([documentPromise, timeoutPromise]) as any;
        results.push(result);
        console.log(`[bulk-upload] Document ${i + 1} processed successfully`);
      } catch (docError) {
        console.error(`[bulk-upload] Document ${i + 1} failed:`, docError);

        // Add failed result for this document
        results.push({
          documentId: doc.filename,
          status: 'FAILED' as const,
          chunks: 0,
          themes: 0,
          quotes: 0,
          insights: 0,
          keywords: 0,
          errorMessage: docError instanceof Error ? docError.message : 'Document processing failed'
        });
      }
    }

    // Summary statistics
    const summary = {
      totalFiles: files.length,
      successful: results.filter((r: any) => r.status === 'COMPLETED').length,
      failed: results.filter((r: any) => r.status === 'FAILED').length,
      totalChunks: results.reduce((sum: number, r: any) => sum + (r.chunks || 0), 0),
      totalThemes: results.reduce((sum: number, r: any) => sum + (r.themes || 0), 0),
      totalQuotes: results.reduce((sum: number, r: any) => sum + (r.quotes || 0), 0),
      totalInsights: results.reduce((sum: number, r: any) => sum + (r.insights || 0), 0),
      totalKeywords: results.reduce((sum: number, r: any) => sum + (r.keywords || 0), 0)
    };

    const response = {
      success: true,
      summary,
      results,
      message: `Processed ${summary.successful} of ${summary.totalFiles} files`
    };

    console.log(`[bulk-upload] Request completed successfully at:`, new Date().toISOString());
    console.log(`[bulk-upload] Summary:`, summary);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Bulk upload error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process bulk upload',
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
    message: 'Bulk document upload endpoint',
    supportedFormats: ['PDF'],
    maxFileSize: '50MB',
    maxFiles: 100,
    batchSize: 5,
    features: [
      'Automatic chunking',
      'Theme extraction',
      'Quote identification',
      'Insight generation',
      'Keyword analysis',
      'Database storage',
      'Metadata management',
      'AI-powered analysis (OpenAI/Anthropic)',
      'Intelligent document summarization',
      'Context-aware theme extraction',
      'Semantic quote identification'
    ]
  });
}