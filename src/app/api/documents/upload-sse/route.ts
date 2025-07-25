import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { ImprovedPDFExtractor } from '@/utils/pdf-extractor-improved';
import { DocumentChunker } from '@/utils/document-chunker';
import { globalDocumentProcessor } from '@/lib/document-job-processor';

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
      
      // Get AI analysis options from form data
      const aiEnabled = formData.get('aiEnabled') === 'true';
      const processingType = formData.get('processingType') as 'quick' | 'standard' | 'deep' | 'world-class' || 'standard';
      const priority = formData.get('priority') as 'low' | 'medium' | 'high' || 'medium';
      const extractSystems = formData.get('extractSystems') === 'true';
      const extractQuotes = formData.get('extractQuotes') === 'true';
      const extractThemes = formData.get('extractThemes') === 'true';
      const extractInsights = formData.get('extractInsights') === 'true';
      
      // Legacy support for useAI parameter
      const useAI = aiEnabled || formData.get('useAI') === 'true' || extractSystems;
      
      if (!files || files.length === 0) {
        sendSSE(writer, { type: 'error', message: 'No files provided' });
        await writer.close();
        return;
      }
      
      console.log('[upload-sse] Processing options:', { 
        aiEnabled,
        useAI, 
        processingType, 
        priority,
        extractSystems,
        extractQuotes,
        extractThemes,
        extractInsights,
        fileCount: files.length 
      });

      sendSSE(writer, { 
        type: 'init', 
        totalFiles: files.length,
        message: aiEnabled ? `Queuing ${files.length} file(s) for AI analysis...` : `Processing ${files.length} file(s)...`,
        options: { 
          aiEnabled,
          useAI, 
          processingType, 
          priority, 
          extractSystems,
          extractQuotes,
          extractThemes,
          extractInsights
        }
      });

      const jobIds = [];
      const results = [];
      
      // Process files - either queue for background processing or process immediately
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
          
          if (file.size > 50 * 1024 * 1024) { // Increased limit to 50MB
            throw new Error('File size exceeds 50MB limit');
          }

          sendSSE(writer, { type: 'status', message: 'Reading file...' });
          const buffer = Buffer.from(await file.arrayBuffer());
          
          // For complex processing or large files, use background job queue
          if (useAI || buffer.length > 5 * 1024 * 1024 || processingType === 'world-class') {
            sendSSE(writer, { 
              type: 'status', 
              message: 'Queuing for background processing...' 
            });
            
            const jobId = await globalDocumentProcessor.addJob(
              buffer,
              file.name,
              file.name,
              {
                useAI,
                generateSummary: useAI && extractInsights,
                generateEmbeddings: useAI,
                extractEntities: extractSystems,
                generateInsights: useAI && extractInsights,
                extractThemes: useAI && extractThemes,
                extractQuotes: useAI && extractQuotes,
                processingType,
                priority
              },
              {
                type: processingType,
                priority,
                maxRetries: processingType === 'world-class' ? 5 : 3,
              }
            );
            
            jobIds.push(jobId);
            
            results.push({
              jobId,
              fileName: file.name,
              status: 'QUEUED',
              message: 'Queued for background processing',
              estimatedDuration: globalDocumentProcessor.getJob(jobId)?.estimatedDuration,
            });
            
            const job = globalDocumentProcessor.getJob(jobId);
            const estimatedDuration = job?.estimatedDuration || 0;
            const processingMessage = {
              'quick': 'Basic text extraction',
              'standard': 'Theme and quote extraction',
              'deep': 'Advanced analysis with insights',
              'world-class': 'Full systems mapping'
            }[processingType] || 'AI analysis';
            
            sendSSE(writer, { 
              type: 'file_queued',
              fileIndex: i,
              fileName: file.name,
              jobId,
              estimatedDuration,
              processingMessage,
              progress: ((i + 1) / files.length) * 100
            });
          } else {
            // Simple processing for small files without AI
            sendSSE(writer, { type: 'status', message: 'Processing immediately...' });
            
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
              fileName: file.name,
              status: 'COMPLETED',
              chunks: chunks.length,
              themes: 0,
              quotes: 0,
              insights: 0,
              keywords: 0
            });
            
            sendSSE(writer, { 
              type: 'file_complete',
              fileIndex: i,
              fileName: file.name,
              documentId: document.id,
              progress: ((i + 1) / files.length) * 100
            });
          }

        } catch (error) {
          console.error(`[upload-sse] Error processing ${file.name}:`, error);
          
          results.push({
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

      // Send completion with job tracking information
      const summary = {
        totalFiles: files.length,
        completed: results.filter(r => r.status === 'COMPLETED').length,
        queued: results.filter(r => r.status === 'QUEUED').length,
        failed: results.filter(r => r.status === 'FAILED').length,
        totalChunks: results.reduce((sum, r) => sum + (r.chunks || 0), 0),
        jobIds: jobIds,
        queueStats: globalDocumentProcessor.getStats(),
        processingOptions: {
          aiEnabled,
          processingType,
          priority,
          extractSystems,
          extractQuotes,
          extractThemes,
          extractInsights
        }
      };

      let message = '';
      if (summary.completed > 0 && summary.queued > 0) {
        message = `${summary.completed} files processed immediately, ${summary.queued} queued for ${processingType} AI analysis`;
      } else if (summary.completed > 0) {
        message = `Successfully processed ${summary.completed} of ${summary.totalFiles} files`;
      } else if (summary.queued > 0) {
        message = `${summary.queued} files queued for ${processingType} AI analysis`;
      } else {
        message = 'Upload completed';
      }
      
      if (aiEnabled && summary.queued > 0) {
        const features = [];
        if (extractSystems) features.push('systems mapping');
        if (extractThemes) features.push('theme extraction');
        if (extractQuotes) features.push('quote extraction');
        if (extractInsights) features.push('insight generation');
        
        if (features.length > 0) {
          message += ` with ${features.join(', ')}`;
        }
      }

      sendSSE(writer, { 
        type: 'complete',
        summary,
        results,
        message,
        jobStreamUrl: jobIds.length > 0 ? '/api/jobs/stream' : null,
        nextSteps: aiEnabled && summary.queued > 0 ? 
          'Documents are being analyzed in the background. You can monitor progress in the Job Queue or check back later for results.' :
          'Documents have been processed and are ready for analysis.'
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