import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/database-safe';
import { fileStorage } from '@/lib/utils/file-storage';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * Enhanced document upload endpoint that stores original files
 * AND extracts text for AI analysis
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[upload-with-files] Starting enhanced upload process...');

    // Check system health
    if (!isDatabaseAvailable()) {
      console.error('[upload-with-files] Database not available');
      return NextResponse.json(
        { 
          error: 'Database not available - please check configuration',
          code: 'DATABASE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          error: 'No files provided',
          code: 'NO_FILES'
        },
        { status: 400 }
      );
    }

    console.log(`[upload-with-files] Processing ${files.length} files`);

    // Validate files
    const maxFiles = 5;
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    if (files.length > maxFiles) {
      return NextResponse.json(
        { 
          error: `Too many files. Maximum ${maxFiles} files allowed.`,
          code: 'TOO_MANY_FILES'
        },
        { status: 400 }
      );
    }

    // Check file sizes
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { 
            error: `File "${file.name}" is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
            code: 'FILE_TOO_LARGE'
          },
          { status: 400 }
        );
      }
    }

    // Extract processing options
    const options = {
      source: (formData.get('source') as string) || 'upload',
      category: (formData.get('category') as string) || 'general',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
      enableAI: formData.get('enableAI') !== 'false',
      storeOriginal: formData.get('storeOriginal') !== 'false'
    };

    console.log('[upload-with-files] Processing options:', options);

    // Process files
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[upload-with-files] Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        let storedFile = null;
        
        // Store original file if requested
        if (options.storeOriginal) {
          try {
            storedFile = await fileStorage.storeFile(file);
            console.log(`[upload-with-files] Stored original file: ${storedFile.url}`);
          } catch (storageError) {
            console.error(`[upload-with-files] Failed to store file ${file.name}:`, storageError);
            // Continue without storing - we can still extract text
          }
        }

        // Create document record
        const document = await prisma!.document.create({
          data: {
            filename: storedFile?.filename || `${Date.now()}_${file.name}`,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            source: options.source,
            category: options.category,
            tags: options.tags.length > 0 ? JSON.stringify(options.tags) : undefined,
            status: 'PROCESSING',
            // Store file path for serving original files
            ...(storedFile && { filePath: storedFile.filepath })
          }
        });

        console.log(`[upload-with-files] Created document record: ${document.id}`);

        // Extract text for AI processing
        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = '';
        let pageCount = 1;
        let wordCount = 0;

        try {
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const pdfParse = (await import('pdf-parse')).default;
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text || '';
            pageCount = pdfData.numpages || 1;
          } else if (file.type.includes('text') || file.name.toLowerCase().endsWith('.txt')) {
            extractedText = new TextDecoder().decode(buffer);
          } else if (file.name.toLowerCase().endsWith('.md')) {
            extractedText = new TextDecoder().decode(buffer);
          } else {
            console.warn(`[upload-with-files] Unsupported file type for text extraction: ${file.type}`);
            extractedText = `Document uploaded: ${file.name}`;
          }

          wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
          console.log(`[upload-with-files] Extracted ${wordCount} words from ${pageCount} pages`);
        } catch (extractionError) {
          console.error(`[upload-with-files] Text extraction failed for ${file.name}:`, extractionError);
          extractedText = `Text extraction failed for ${file.name}. Original file is available for download.`;
          wordCount = 0;
        }

        // Create basic chunks if we have text
        if (extractedText.length > 50) {
          const chunks = createSimpleChunks(extractedText);
          
          if (chunks.length > 0) {
            await prisma!.documentChunk.createMany({
              data: chunks.map((chunk, index) => ({
                documentId: document.id,
                chunkIndex: index,
                text: chunk,
                wordCount: chunk.split(/\s+/).length,
                startChar: 0,
                endChar: chunk.length
              }))
            });
          }
        }

        // Update document as completed
        await prisma!.document.update({
          where: { id: document.id },
          data: {
            status: 'COMPLETED',
            fullText: extractedText,
            pageCount,
            wordCount,
            processedAt: new Date()
          }
        });

        results.push({
          id: document.id,
          filename: file.name,
          size: file.size,
          status: 'completed',
          wordCount,
          pageCount,
          hasOriginalFile: !!storedFile,
          originalFileUrl: storedFile?.url || null,
          textExtracted: extractedText.length > 50
        });

        console.log(`[upload-with-files] Completed processing: ${file.name}`);

      } catch (error) {
        console.error(`[upload-with-files] Failed to process ${file.name}:`, error);
        
        results.push({
          filename: file.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const processingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'completed').length;
    
    console.log(`[upload-with-files] Completed in ${processingTime}ms: ${successCount}/${files.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} of ${files.length} files`,
      results,
      processingTime,
      options
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[upload-with-files] Upload failed:', error);
    
    return NextResponse.json(
      {
        error: 'Upload processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * Simple text chunking for AI processing
 */
function createSimpleChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  
  return chunks.length > 0 ? chunks : [text];
}