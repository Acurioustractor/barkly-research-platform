/**
 * Centralized error handling for document processing
 * Provides consistent error messages and recovery strategies
 */

export enum ErrorType {
  PDF_EXTRACTION = 'PDF_EXTRACTION',
  CHUNKING = 'CHUNKING',
  AI_ANALYSIS = 'AI_ANALYSIS',
  DATABASE = 'DATABASE',
  EMBEDDING = 'EMBEDDING',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  MEMORY = 'MEMORY',
  VALIDATION = 'VALIDATION'
}

export interface ProcessingError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  recoverable: boolean;
  retryable: boolean;
  context?: Record<string, any>;
  suggestions?: string[];
}

export class DocumentProcessingError extends Error {
  public readonly type: ErrorType;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly context?: Record<string, any>;
  public readonly suggestions?: string[];
  public readonly originalError?: Error;

  constructor(error: ProcessingError) {
    super(error.message);
    this.name = 'DocumentProcessingError';
    this.type = error.type;
    this.recoverable = error.recoverable;
    this.retryable = error.retryable;
    this.context = error.context;
    this.suggestions = error.suggestions;
    this.originalError = error.originalError;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      recoverable: this.recoverable,
      retryable: this.retryable,
      context: this.context,
      suggestions: this.suggestions,
      stack: this.stack
    };
  }
}

export class ErrorHandler {
  /**
   * Handle PDF extraction errors
   */
  static handlePDFError(error: Error, context?: Record<string, any>): DocumentProcessingError {
    const message = error.message.toLowerCase();
    
    if (message.includes('scanned') || message.includes('ocr')) {
      return new DocumentProcessingError({
        type: ErrorType.PDF_EXTRACTION,
        message: 'Document appears to be scanned. OCR is required but not available.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Use a PDF with selectable text',
          'Pre-process the PDF with OCR software',
          'Convert scanned images to text before uploading'
        ]
      });
    }

    if (message.includes('encrypted') || message.includes('password')) {
      return new DocumentProcessingError({
        type: ErrorType.PDF_EXTRACTION,
        message: 'PDF is encrypted or password-protected.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Remove password protection from the PDF',
          'Export an unencrypted version of the document'
        ]
      });
    }

    if (message.includes('corrupt') || message.includes('invalid')) {
      return new DocumentProcessingError({
        type: ErrorType.PDF_EXTRACTION,
        message: 'PDF file appears to be corrupted or invalid.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Re-save or re-export the PDF',
          'Check if the file was fully uploaded',
          'Try a different PDF reader to verify the file'
        ]
      });
    }

    return new DocumentProcessingError({
      type: ErrorType.PDF_EXTRACTION,
      message: `Failed to extract text from PDF: ${error.message}`,
      originalError: error,
      recoverable: false,
      retryable: true,
      context
    });
  }

  /**
   * Handle AI service errors
   */
  static handleAIError(error: Error, context?: Record<string, any>): DocumentProcessingError {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('429')) {
      return new DocumentProcessingError({
        type: ErrorType.RATE_LIMIT,
        message: 'AI service rate limit exceeded. Please try again later.',
        originalError: error,
        recoverable: true,
        retryable: true,
        context,
        suggestions: [
          'Wait a few minutes before retrying',
          'Process documents in smaller batches',
          'Consider upgrading your AI service plan'
        ]
      });
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new DocumentProcessingError({
        type: ErrorType.TIMEOUT,
        message: 'AI analysis timed out. The document may be too large.',
        originalError: error,
        recoverable: true,
        retryable: true,
        context,
        suggestions: [
          'Try processing a smaller document',
          'Split large documents into sections',
          'Reduce the analysis depth setting'
        ]
      });
    }

    if (message.includes('api key') || message.includes('unauthorized')) {
      return new DocumentProcessingError({
        type: ErrorType.AI_ANALYSIS,
        message: 'AI service authentication failed. Check API key configuration.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Verify your API key is correct',
          'Check if the API key has expired',
          'Ensure the API key has proper permissions'
        ]
      });
    }

    return new DocumentProcessingError({
      type: ErrorType.AI_ANALYSIS,
      message: `AI analysis failed: ${error.message}`,
      originalError: error,
      recoverable: true,
      retryable: true,
      context
    });
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: Error, context?: Record<string, any>): DocumentProcessingError {
    const message = error.message.toLowerCase();

    if (message.includes('connection') || message.includes('econnrefused')) {
      return new DocumentProcessingError({
        type: ErrorType.DATABASE,
        message: 'Database connection failed. Service may be temporarily unavailable.',
        originalError: error,
        recoverable: true,
        retryable: true,
        context,
        suggestions: [
          'Check database connection settings',
          'Verify database service is running',
          'Try again in a few moments'
        ]
      });
    }

    if (message.includes('unique constraint') || message.includes('duplicate')) {
      return new DocumentProcessingError({
        type: ErrorType.DATABASE,
        message: 'Document already exists in the database.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Check if the document was already uploaded',
          'Use a different filename',
          'Delete the existing document first'
        ]
      });
    }

    if (message.includes('disk full') || message.includes('quota exceeded')) {
      return new DocumentProcessingError({
        type: ErrorType.DATABASE,
        message: 'Database storage limit exceeded.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Delete old documents to free up space',
          'Contact administrator to increase storage',
          'Archive completed documents'
        ]
      });
    }

    return new DocumentProcessingError({
      type: ErrorType.DATABASE,
      message: `Database error: ${error.message}`,
      originalError: error,
      recoverable: true,
      retryable: true,
      context
    });
  }

  /**
   * Handle embedding errors
   */
  static handleEmbeddingError(error: Error, context?: Record<string, any>): DocumentProcessingError {
    const message = error.message.toLowerCase();

    if (message.includes('pgvector') || message.includes('vector')) {
      return new DocumentProcessingError({
        type: ErrorType.EMBEDDING,
        message: 'Vector database extension not available.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Enable pgvector extension in database',
          'Contact administrator to install pgvector',
          'Process without semantic search features'
        ]
      });
    }

    if (message.includes('dimension')) {
      return new DocumentProcessingError({
        type: ErrorType.EMBEDDING,
        message: 'Embedding dimension mismatch.',
        originalError: error,
        recoverable: false,
        retryable: false,
        context,
        suggestions: [
          'Check embedding model configuration',
          'Ensure consistent embedding dimensions',
          'Re-process all documents with same model'
        ]
      });
    }

    return new DocumentProcessingError({
      type: ErrorType.EMBEDDING,
      message: `Embedding generation failed: ${error.message}`,
      originalError: error,
      recoverable: true,
      retryable: true,
      context
    });
  }

  /**
   * Handle memory errors
   */
  static handleMemoryError(error: Error, context?: Record<string, any>): DocumentProcessingError {
    return new DocumentProcessingError({
      type: ErrorType.MEMORY,
      message: 'Out of memory while processing document.',
      originalError: error,
      recoverable: false,
      retryable: true,
      context,
      suggestions: [
        'Process smaller documents',
        'Reduce chunk size settings',
        'Process documents one at a time',
        'Use background job processing'
      ]
    });
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(message: string, context?: Record<string, any>): DocumentProcessingError {
    return new DocumentProcessingError({
      type: ErrorType.VALIDATION,
      message,
      recoverable: false,
      retryable: false,
      context
    });
  }

  /**
   * Create error context with useful debugging information
   */
  static createContext(
    documentId?: string,
    filename?: string,
    stage?: string,
    additionalInfo?: Record<string, any>
  ): Record<string, any> {
    return {
      documentId,
      filename,
      stage,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };
  }

  /**
   * Log error with appropriate severity
   */
  static logError(error: DocumentProcessingError | Error, severity: 'info' | 'warn' | 'error' = 'error') {
    const logData = {
      message: error.message,
      type: error instanceof DocumentProcessingError ? error.type : 'UNKNOWN',
      stack: error.stack,
      context: error instanceof DocumentProcessingError ? error.context : undefined
    };

    switch (severity) {
      case 'info':
        console.info('Document processing info:', logData);
        break;
      case 'warn':
        console.warn('Document processing warning:', logData);
        break;
      case 'error':
        console.error('Document processing error:', logData);
        break;
    }
  }

  /**
   * Wrap async function with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    errorType: ErrorType,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof DocumentProcessingError) {
        throw error;
      }

      const processedError = this.processError(error as Error, errorType, context);
      this.logError(processedError);
      throw processedError;
    }
  }

  /**
   * Process generic error into appropriate DocumentProcessingError
   */
  private static processError(
    error: Error,
    errorType: ErrorType,
    context?: Record<string, any>
  ): DocumentProcessingError {
    switch (errorType) {
      case ErrorType.PDF_EXTRACTION:
        return this.handlePDFError(error, context);
      case ErrorType.AI_ANALYSIS:
        return this.handleAIError(error, context);
      case ErrorType.DATABASE:
        return this.handleDatabaseError(error, context);
      case ErrorType.EMBEDDING:
        return this.handleEmbeddingError(error, context);
      default:
        return new DocumentProcessingError({
          type: errorType,
          message: error.message,
          originalError: error,
          recoverable: false,
          retryable: false,
          context
        });
    }
  }
}

/**
 * Retry logic with exponential backoff
 */
export class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      shouldRetry = (error) => {
        if (error instanceof DocumentProcessingError) {
          return error.retryable;
        }
        return true;
      }
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!shouldRetry(lastError) || attempt === maxRetries) {
          throw lastError;
        }

        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError!;
  }
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,
    private readonly resetTimeout: number = 300000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new DocumentProcessingError({
          type: ErrorType.RATE_LIMIT,
          message: 'Service temporarily unavailable due to repeated failures',
          recoverable: true,
          retryable: true,
          suggestions: ['Wait a few minutes before retrying']
        });
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker opened after ${this.failures} failures`);
      
      // Auto-reset after timeout
      setTimeout(() => this.reset(), this.resetTimeout);
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    console.info('Circuit breaker reset');
  }
}