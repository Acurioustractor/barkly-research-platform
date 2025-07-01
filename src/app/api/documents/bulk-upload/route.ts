import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancedDocumentProcessor } from '@/utils/ai-enhanced-document-processor';
import { isDatabaseAvailable } from '@/lib/database-safe';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// Increase body size limit to 50MB
export async function POST(request: NextRequest) {
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
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB per file (Vercel limit)
    const maxFiles = 10; // Reduce to 10 files to stay under limits

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed in bulk upload` },
        { status: 400 }
      );
    }

    const invalidFiles = files.filter(file => 
      file.type !== 'application/pdf' || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `${invalidFiles.length} files rejected. Only PDF files under 50MB are allowed.`,
          rejectedFiles: invalidFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
        },
        { status: 400 }
      );
    }

    // Prepare documents for processing
    const documents = await Promise.all(
      files.map(async (file, index) => ({
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
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      useAI,
      generateSummary,
      generateEmbeddings
    };

    // Process in smaller batches to avoid memory issues
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      try {
        const batchResults = await processor.processBatchDocuments(batch, processingOptions);
        results.push(...batchResults);
      } catch (batchError) {
        console.error(`Batch ${i/batchSize + 1} failed:`, batchError);
        console.error('Full error details:', {
          error: batchError,
          stack: batchError instanceof Error ? batchError.stack : 'No stack trace',
          options: processingOptions
        });
        // Add failed results for this batch
        batch.forEach(doc => {
          results.push({
            documentId: doc.filename,
            status: 'FAILED' as const,
            chunks: 0,
            themes: 0,
            quotes: 0,
            insights: 0,
            keywords: 0,
            errorMessage: batchError instanceof Error ? batchError.message : 'Batch processing failed'
          });
        });
      }
    }

    // Summary statistics
    const summary = {
      totalFiles: files.length,
      successful: results.filter(r => r.status === 'COMPLETED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      totalChunks: results.reduce((sum, r) => sum + r.chunks, 0),
      totalThemes: results.reduce((sum, r) => sum + r.themes, 0),
      totalQuotes: results.reduce((sum, r) => sum + r.quotes, 0),
      totalInsights: results.reduce((sum, r) => sum + r.insights, 0),
      totalKeywords: results.reduce((sum, r) => sum + r.keywords, 0)
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Successfully processed ${summary.successful} of ${summary.totalFiles} documents`
    });

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