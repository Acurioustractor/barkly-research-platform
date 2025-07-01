/**
 * API Error Handler for consistent error responses
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

export class ApiErrorResponse extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Handle API errors and return consistent error responses
 */
export function handleApiError(error: unknown, context?: Record<string, any>): NextResponse {
  // Log the error with context
  logger.error('API Error', { ...context }, error instanceof Error ? error : new Error(String(error)));

  // Handle known error types
  if (error instanceof ApiErrorResponse) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: {
              message: 'A record with this value already exists',
              code: 'DUPLICATE_ENTRY',
              details: { field: error.meta?.target },
            },
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: {
              message: 'Record not found',
              code: 'NOT_FOUND',
            },
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: {
              message: 'Database operation failed',
              code: 'DATABASE_ERROR',
              details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
          },
          { status: 500 }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: {
          message: 'Invalid database operation',
          code: 'VALIDATION_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error: {
            message: 'Service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE',
          },
        },
        { status: 503 }
      );
    }

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return NextResponse.json(
        {
          error: {
            message: 'Request timeout',
            code: 'TIMEOUT',
          },
        },
        { status: 504 }
      );
    }

    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : error.message,
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: 500 }
  );
}

/**
 * Wrap an API handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  }) as T;
}

/**
 * Common API error responses
 */
export const ApiErrors = {
  badRequest: (message: string = 'Bad request', details?: any) =>
    new ApiErrorResponse(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiErrorResponse(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new ApiErrorResponse(message, 403, 'FORBIDDEN'),

  notFound: (message: string = 'Not found') =>
    new ApiErrorResponse(message, 404, 'NOT_FOUND'),

  methodNotAllowed: (method: string) =>
    new ApiErrorResponse(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED'),

  conflict: (message: string = 'Conflict', details?: any) =>
    new ApiErrorResponse(message, 409, 'CONFLICT', details),

  validationError: (message: string = 'Validation error', details?: any) =>
    new ApiErrorResponse(message, 422, 'VALIDATION_ERROR', details),

  tooManyRequests: (message: string = 'Too many requests') =>
    new ApiErrorResponse(message, 429, 'RATE_LIMIT_EXCEEDED'),

  internalError: (message: string = 'Internal server error') =>
    new ApiErrorResponse(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    new ApiErrorResponse(message, 503, 'SERVICE_UNAVAILABLE'),
};