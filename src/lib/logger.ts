/**
 * Application logger utility
 * Provides structured logging with different levels
 */

// Temporarily disabled Sentry to avoid module resolution issues
// import * as Sentry from '@sentry/node';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
    
    // Sentry disabled for now
    // if (context) {
    //   Sentry.setContext('warning', context);
    // }
    // Sentry.captureMessage(message, 'warning');
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context));
    if (error) {
      console.error('Error details:', error);
    }

    // Sentry disabled for now
    // if (context) {
    //   Sentry.setContext('error', context);
    // }
    // 
    // if (error) {
    //   Sentry.captureException(error);
    // } else {
    //   Sentry.captureMessage(message, 'error');
    // }
  }

  // Utility method for timing operations
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Specialized logging methods that were missing
  logRequest(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, { type: 'request', ...context });
  }

  logResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method} ${url} ${status} ${duration}ms`;
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, { 
        type: 'response', 
        status, 
        duration,
        ...context 
      });
    } else {
      this.info(message, { 
        type: 'response', 
        status, 
        duration,
        ...context 
      });
    }
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug(`Database query (${duration}ms)`, { 
      type: 'database',
      query: this.isDevelopment ? query : query.substring(0, 100) + '...',
      duration,
      ...context 
    });
  }

  logDocumentProcessing(stage: string, documentId: string, context?: LogContext): void {
    this.info(`Document processing: ${stage}`, {
      type: 'document-processing',
      stage,
      documentId,
      ...context
    });
  }

  logAIRequest(service: string, model: string, context?: LogContext): void {
    this.info(`AI request: ${service}/${model}`, {
      type: 'ai-request',
      service,
      model,
      ...context
    });
  }

  logAIResponse(service: string, model: string, duration: number, tokensUsed?: number, context?: LogContext): void {
    this.info(`AI response: ${service}/${model} (${duration}ms)`, {
      type: 'ai-response',
      service,
      model,
      duration,
      tokensUsed,
      ...context
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);

// Middleware for API routes
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R> | R,
  context?: LogContext
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      
      logger.debug('Function completed', {
        ...context,
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('Function failed', error as Error, {
        ...context,
        duration,
        success: false
      });
      
      throw error;
    }
  };
}