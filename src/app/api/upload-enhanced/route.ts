import { NextRequest, NextResponse } from 'next/server';
import { EnhancedWorldClassDocumentProcessor } from '@/utils/world-class-document-processor-enhanced';
import { 
  DocumentProcessingError,
  ErrorType 
} from '@/utils/error-handler';

export const maxDuration = 60; // 1 minute
export const dynamic = 'force-dynamic';

interface UploadResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
  hints?: string[];
  warnings?: string[];
  partialResults?: any;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Get processing options from form data
    const options = {
      source: formData.get('source') as string,
      category: formData.get('category') as string,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
      allowPartialSuccess: formData.get('allowPartialSuccess') === 'true',
      retryFailedOperations: formData.get('retryFailedOperations') !== 'false',
      generateEmbeddings: formData.get('generateEmbeddings') !== 'false',
      analysisDepth: (formData.get('analysisDepth') as 'standard' | 'deep' | 'exhaustive') || 'standard'
    };

    // Validation
    const validationError = validateUpload(files);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    const processor = new EnhancedWorldClassDocumentProcessor();
    const results: any[] = [];
    const errors: any[] = [];

    // Process each file
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.size} bytes)`);
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await processor.processAndStoreDocument(
          buffer,
          `${Date.now()}-${file.name}`,
          file.name,
          options
        );

        results.push({
          filename: file.name,
          ...result
        });

        // Log processing time
        const processingTime = Date.now() - startTime;
        console.log(`File ${file.name} processed in ${processingTime}ms`);

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        
        if (error instanceof DocumentProcessingError) {
          errors.push({
            filename: file.name,
            error: {
              type: error.type,
              message: error.message,
              recoverable: error.recoverable,
              suggestions: error.suggestions
            }
          });

          // If not allowing partial success, stop processing
          if (!options.allowPartialSuccess) {
            return createErrorResponse(error, file.name);
          }
        } else {
          // Unknown error
          errors.push({
            filename: file.name,
            error: {
              type: ErrorType.VALIDATION,
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }
    }

    // Prepare response
    const totalProcessingTime = Date.now() - startTime;
    
    if (results.length === 0) {
      // All files failed
      return NextResponse.json({
        success: false,
        error: 'All files failed to process',
        errors,
        processingTime: totalProcessingTime
      }, { status: 422 });
    }

    const response: UploadResponse = {
      success: errors.length === 0,
      data: {
        processed: results,
        failed: errors,
        summary: {
          total: files.length,
          successful: results.length,
          failed: errors.length,
          processingTime: totalProcessingTime
        }
      }
    };

    // Add warnings if any
    const allWarnings = results.flatMap(r => r.warnings || []);
    if (allWarnings.length > 0) {
      response.warnings = [...new Set(allWarnings)]; // Unique warnings
    }

    // Add partial results info if applicable
    if (errors.length > 0 && options.allowPartialSuccess) {
      response.partialResults = {
        message: `Processed ${results.length} of ${files.length} files successfully`,
        successRate: results.length / files.length
      };
    }

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200 // 207 Multi-Status for partial success
    });

  } catch (error) {
    // Unexpected error
    console.error('Unexpected error in upload handler:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Unexpected server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      hints: [
        'Try uploading fewer files at once',
        'Ensure your files are valid PDFs',
        'Check your internet connection'
      ]
    }, { status: 500 });
  }
}

function validateUpload(files: File[]): UploadResponse | null {
  if (!files || files.length === 0) {
    return {
      success: false,
      error: 'No files provided',
      hints: ['Select one or more PDF files to upload']
    };
  }

  // Check file types
  const invalidFiles = files.filter(file => 
    !file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')
  );
  
  if (invalidFiles.length > 0) {
    return {
      success: false,
      error: 'Invalid file type',
      details: `Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`,
      hints: ['Only PDF files are supported']
    };
  }

  // Check file sizes
  const maxSize = 4.5 * 1024 * 1024; // 4.5MB Vercel limit
  const oversizedFiles = files.filter(file => file.size > maxSize);
  
  if (oversizedFiles.length > 0) {
    return {
      success: false,
      error: 'File size limit exceeded',
      details: `Files over 4.5MB: ${oversizedFiles.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`
      ).join(', ')}`,
      hints: [
        'Maximum file size is 4.5MB due to server limits',
        'Try compressing your PDFs',
        'Split large documents into smaller parts'
      ]
    };
  }

  // Check total upload size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = 10 * 1024 * 1024; // 10MB total
  
  if (totalSize > maxTotalSize) {
    return {
      success: false,
      error: 'Total upload size limit exceeded',
      details: `Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB (max: 10MB)`,
      hints: ['Upload files in smaller batches']
    };
  }

  // Check number of files
  if (files.length > 10) {
    return {
      success: false,
      error: 'Too many files',
      details: `${files.length} files provided (max: 10)`,
      hints: ['Upload a maximum of 10 files at once']
    };
  }

  return null;
}

function createErrorResponse(
  error: DocumentProcessingError,
  filename: string
): NextResponse {
  const response: UploadResponse = {
    success: false,
    error: error.message,
    details: `Failed to process: ${filename}`,
    hints: error.suggestions
  };

  // Add specific hints based on error type
  switch (error.type) {
    case ErrorType.PDF_EXTRACTION:
      response.hints = [
        ...(response.hints || []),
        'Ensure the PDF is not corrupted',
        'Check if the PDF contains selectable text',
        'Try re-saving the PDF with a different tool'
      ];
      break;
    
    case ErrorType.RATE_LIMIT:
      response.hints = [
        'Wait a few minutes before trying again',
        'Reduce the number of files',
        'Process files one at a time'
      ];
      break;
    
    case ErrorType.MEMORY:
      response.hints = [
        'Upload smaller files',
        'Process files individually',
        'Split large PDFs into sections'
      ];
      break;
  }

  const statusCode = error.recoverable ? 503 : 422;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (error.type === ErrorType.RATE_LIMIT) {
    headers['Retry-After'] = '60';
  }
  
  return NextResponse.json(response, { 
    status: statusCode,
    headers
  });
}