/**
 * Structured logging system for better debugging and monitoring
 * Supports different log levels and contextual information
 */

import { config, features } from './config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
  trace?: string;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.isDevelopment = features.isDevelopment();
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelName = levelNames[entry.level] || 'UNKNOWN';
    const timestamp = new Date(entry.timestamp).toISOString();
    
    let message = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      message += ` Error: ${entry.error.message}`;
      if (this.isDevelopment && entry.error.stack) {
        message += `\n${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    // Get trace for errors in development
    if (this.isDevelopment && level >= LogLevel.ERROR) {
      entry.trace = new Error().stack;
    }

    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console
    const formattedMessage = this.formatMessage(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }

    // In production, send errors to monitoring service
    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket)
    // For now, just log that we would send it
    if (features.isDevelopment()) {
      console.log('[Logger] Would send to monitoring:', entry);
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, contextOrError?: LogContext | Error, error?: Error) {
    if (contextOrError instanceof Error) {
      this.log(LogLevel.ERROR, message, undefined, contextOrError);
    } else {
      this.log(LogLevel.ERROR, message, contextOrError, error);
    }
  }

  fatal(message: string, contextOrError?: LogContext | Error, error?: Error) {
    if (contextOrError instanceof Error) {
      this.log(LogLevel.FATAL, message, undefined, contextOrError);
    } else {
      this.log(LogLevel.FATAL, message, contextOrError, error);
    }
  }

  // Specialized logging methods
  logRequest(method: string, url: string, context?: LogContext) {
    this.info(`${method} ${url}`, { type: 'request', ...context });
  }

  logResponse(method: string, url: string, status: number, duration: number, context?: LogContext) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `${method} ${url} ${status} ${duration}ms`, { 
      type: 'response', 
      status, 
      duration,
      ...context 
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    this.debug(`Database query (${duration}ms)`, { 
      type: 'database',
      query: this.isDevelopment ? query : query.substring(0, 100) + '...',
      duration,
      ...context 
    });
  }

  logDocumentProcessing(stage: string, documentId: string, context?: LogContext) {
    this.info(`Document processing: ${stage}`, {
      type: 'document-processing',
      stage,
      documentId,
      ...context
    });
  }

  logAIRequest(service: string, model: string, context?: LogContext) {
    this.info(`AI request: ${service}/${model}`, {
      type: 'ai-request',
      service,
      model,
      ...context
    });
  }

  logAIResponse(service: string, model: string, duration: number, tokensUsed?: number, context?: LogContext) {
    this.info(`AI response: ${service}/${model} (${duration}ms)`, {
      type: 'ai-response',
      service,
      model,
      duration,
      tokensUsed,
      ...context
    });
  }

  // Get recent logs for debugging
  getRecentLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let logs = this.logs;
    
    if (level !== undefined) {
      logs = logs.filter(log => log.level >= level);
    }
    
    return logs.slice(-limit);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Performance logging
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer ${label}: ${duration}ms`, { type: 'performance', label, duration });
      return duration;
    };
  }

  // Group related logs
  group(label: string, fn: () => void | Promise<void>): void | Promise<void> {
    if (this.isDevelopment) {
      console.group(label);
    }
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => {
          if (this.isDevelopment) {
            console.groupEnd();
          }
        });
      }
      
      if (this.isDevelopment) {
        console.groupEnd();
      }
      
      return result;
    } catch (error) {
      if (this.isDevelopment) {
        console.groupEnd();
      }
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, contextOrError?: LogContext | Error, error?: Error) => 
  logger.error(message, contextOrError, error);
export const logFatal = (message: string, contextOrError?: LogContext | Error, error?: Error) => 
  logger.fatal(message, contextOrError, error);

// Middleware for API routes
export function withLogging(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const start = Date.now();
    const url = new URL(req.url);
    
    logger.logRequest(req.method, url.pathname, {
      headers: Object.fromEntries(req.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries()),
    });
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      
      logger.logResponse(req.method, url.pathname, response.status, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.logResponse(req.method, url.pathname, 500, duration, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  };
}