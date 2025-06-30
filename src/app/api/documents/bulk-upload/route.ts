import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDocumentProcessor } from '@/utils/enhanced-document-processor';
import { isDatabaseAvailable } from '@/lib/database-safe';

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    const dbAvailable = isDatabaseAvailable();
    console.log('[bulk-upload] Database available:', dbAvailable);
    
    if (!dbAvailable) {
      console.error('[bulk-upload] Database not available - processing will continue without DB storage');
      // Continue processing without database storage for now
    }

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
    const maxSize = 50 * 1024 * 1024; // 50MB per file for bulk upload
    const maxFiles = 100; // Allow up to 100 files in bulk

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

    // Process documents - use basic processor if database not available
    const results = [];
    
    if (dbAvailable) {
      // Use enhanced processor with database
      const processor = new EnhancedDocumentProcessor();
      const processingOptions = {
        source,
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      };

      // Process in smaller batches to avoid memory issues
      const batchSize = 5;
      
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchResults = await processor.processBatchDocuments(batch, processingOptions);
        results.push(...batchResults);
      }
    } else {
      // Fallback: Use basic processor without database
      const { DocumentProcessor } = await import('@/utils/document-processor');
      
      for (const doc of documents) {
        try {
          const extractedContent = await DocumentProcessor.extractTextFromPDF(doc.buffer, doc.filename);
          results.push({
            documentId: doc.filename,
            status: 'COMPLETED' as const,
            chunks: Math.ceil(extractedContent.text.length / 1500), // Estimate chunks
            themes: extractedContent.themes.length,
            quotes: extractedContent.quotes.length,
            insights: extractedContent.insights.length,
            keywords: extractedContent.keywords.length,
            extractedContent // Include the actual content in results
          });
        } catch (error) {
          console.error(`Failed to process ${doc.originalName}:`, error);
          results.push({
            documentId: doc.filename,
            status: 'FAILED' as const,
            chunks: 0,
            themes: 0,
            quotes: 0,
            insights: 0,
            keywords: 0,
            errorMessage: error instanceof Error ? error.message : 'Processing failed'
          });
        }
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
      'Metadata management'
    ]
  });
}