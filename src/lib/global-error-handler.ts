/**
 * Global error handler for unhandled errors
 * Sets up error handling for both client and server
 */

import { logger } from './logger';

/**
 * Initialize global error handlers
 */
export function initializeErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Client-side error handling
    initializeClientErrorHandlers();
  } else {
    // Server-side error handling
    initializeServerErrorHandlers();
  }
}

/**
 * Client-side error handlers
 */
function initializeClientErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));

    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error', event.error || new Error(event.message));

    // Let default handler run for development
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
  });

  // Log navigation errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        logger.warn('Resource loading error', {
          type: target.tagName,
          src: (target as any).src || (target as any).href,
        });
      }
    }
  }, true);
}

/**
 * Server-side error handlers
 */
function initializeServerErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    
    // Give the logger time to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
  });

  // Handle warnings
  process.on('warning', (warning) => {
    logger.warn('Node.js warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  // Handle SIGTERM and SIGINT for graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    // Perform cleanup
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Error reporting utilities
 */
export const errorReporter = {
  /**
   * Report an error with context
   */
  report: (error: Error, context?: Record<string, any>, severity: 'warning' | 'error' | 'fatal' = 'error') => {
    switch (severity) {
      case 'warning':
        logger.warn(error.message);
        break;
      case 'error':
        logger.error(error.message, error);
        break;
      case 'fatal':
        logger.error(error.message, error);
        break;
    }
  },

  /**
   * Report a caught error with recovery
   */
  reportAndRecover: (error: Error, recovery: () => void, context?: Record<string, any>) => {
    errorReporter.report(error, context, 'warning');
    recovery();
  },

  /**
   * Create a wrapped function that reports errors
   */
  wrap: <T extends (...args: any[]) => any>(
    fn: T,
    context?: Record<string, any>
  ): T => {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.catch((error) => {
            errorReporter.report(error, context);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        errorReporter.report(error as Error, context);
        throw error;
      }
    }) as T;
  },
};

// Initialize on module load (but only run appropriate handlers for each environment)
initializeErrorHandlers();