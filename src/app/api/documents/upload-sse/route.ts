import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { ImprovedPDFExtractor } from '@/utils/pdf-extractor-improved';
import { DocumentChunker } from '@/utils/document-chunker';
import { AIEnhancedDocumentProcessor } from '@/utils/ai-enhanced-document-processor';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sendSSE(writer: WritableStreamDefaultWriter, data: unknown) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  writer.write(encoder.encode(message));
}

export async function POST(request: NextRequest) {
  console.log('[upload-sse] Request received');
  
  // Set up SSE response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start the response immediately
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Process in background
  (async () => {
    try {
      sendSSE(writer, { type: 'status', message: 'Starting upload process...' });
      
      if (!prisma) {
        sendSSE(writer, { type: 'error', message: 'Database not available' });
        await writer.close();
        return;
      }

      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const extractSystems = formData.get('extractSystems') === 'true';
      
      if (!files || files.length === 0) {
        sendSSE(writer, { type: 'error', message: 'No files provided' });
        await writer.close();
        return;
      }
      
      console.log('[upload-sse] Processing options:', { extractSystems });

      sendSSE(writer, { 
        type: 'init', 
        totalFiles: files.length,
        message: `Processing ${files.length} file(s)...`
      });

      const results = [];
      const aiProcessor = extractSystems ? new AIEnhancedDocumentProcessor() : null;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        sendSSE(writer, { 
          type: 'file_start',
          fileIndex: i,
          fileName: file.name,
          progress: (i / files.length) * 100
        });

        try {
          // Validate file
          if (file.type !== 'application/pdf') {
            throw new Error('Only PDF files are supported');
          }
          
          if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size exceeds 10MB limit');
          }

          sendSSE(writer, { type: 'status', message: 'Reading file...' });
          const buffer = Buffer.from(await file.arrayBuffer());
          
          // Use AI processor if systems extraction is enabled, otherwise simple processing
          if (aiProcessor && extractSystems) {
            sendSSE(writer, { type: 'status', message: 'Processing with AI (extracting systems)...' });
            
            const result = await aiProcessor.processAndStoreDocument(
              buffer,
              file.name,
              file.name,
              {
                useAI: true,
                generateSummary: true,
                extractSystems: true
              }
            );
            
            results.push(result);
            
            sendSSE(writer, { 
              type: 'status', 
              message: `Found ${result.themes} themes, ${result.insights} insights` 
            });
          } else {
            // Simple processing without AI
            sendSSE(writer, { type: 'status', message: 'Extracting text from PDF...' });
            const extractor = new ImprovedPDFExtractor(buffer);
            const extraction = await extractor.extractText();
            
            const wordCount = extraction.text.trim() ? extraction.text.trim().split(/\s+/).length : 0;
            
            sendSSE(writer, { type: 'status', message: 'Storing document...' });
            const document = await prisma.document.create({
              data: {
                filename: file.name,
                originalName: file.name,
                mimeType: 'application/pdf',
                size: buffer.length,
                fullText: extraction.text,
                pageCount: extraction.pageCount,
                wordCount: wordCount,
                status: 'COMPLETED',
                processedAt: new Date()
              }
            });

            sendSSE(writer, { type: 'status', message: 'Creating document chunks...' });
            const chunker = new DocumentChunker();
            const chunks = chunker.chunkDocument(extraction.text);
            
            if (chunks.length > 0) {
              await prisma.documentChunk.createMany({
                data: chunks.map((chunk, idx) => ({
                  documentId: document.id,
                  chunkIndex: idx,
                  text: chunk.text,
                  wordCount: chunk.wordCount || 0,
                  startChar: chunk.startChar,
                  endChar: chunk.endChar,
                  startPage: 0,
                  endPage: 0
                }))
              });
            }

            results.push({
              documentId: document.id,
              status: 'COMPLETED',
              chunks: chunks.length,
              themes: 0,
              quotes: 0,
              insights: 0,
              keywords: 0
            });
          }

          sendSSE(writer, { 
            type: 'file_complete',
            fileIndex: i,
            fileName: file.name,
            documentId: document.id,
            progress: ((i + 1) / files.length) * 100
          });

        } catch (error) {
          console.error(`[upload-sse] Error processing ${file.name}:`, error);
          
          results.push({
            documentId: null,
            fileName: file.name,
            status: 'FAILED',
            chunks: 0,
            themes: 0,
            quotes: 0,
            insights: 0,
            keywords: 0,
            errorMessage: error instanceof Error ? error.message : 'Processing failed'
          });

          sendSSE(writer, { 
            type: 'file_error',
            fileIndex: i,
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }

      // Send completion
      const summary = {
        totalFiles: files.length,
        successful: results.filter(r => r.status === 'COMPLETED').length,
        failed: results.filter(r => r.status === 'FAILED').length,
        totalChunks: results.reduce((sum, r) => sum + r.chunks, 0),
        totalThemes: 0,
        totalQuotes: 0,
        totalInsights: 0,
        totalKeywords: 0
      };

      sendSSE(writer, { 
        type: 'complete',
        summary,
        results,
        message: `Successfully processed ${summary.successful} of ${summary.totalFiles} documents`
      });

    } catch (error) {
      console.error('[upload-sse] Fatal error:', error);
      sendSSE(writer, { 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      await writer.close();
    }
  })();

  return response;
}