/**
 * Security Middleware for Barkley Research Platform
 * Implements rate limiting, validation, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
  cors: {
    allowedOrigins: string[];
  };
}

const defaultConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf'],
  },
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app',
    ],
  },
};

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  request: NextRequest,
  config: SecurityConfig = defaultConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  // Clean up expired entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }

  // Get or create rate limit entry
  let rateLimitEntry = rateLimitMap.get(identifier);
  if (!rateLimitEntry || now > rateLimitEntry.resetTime) {
    rateLimitEntry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(identifier, rateLimitEntry);
  }

  // Check if limit exceeded
  if (rateLimitEntry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimitEntry.resetTime,
    };
  }

  // Increment counter
  rateLimitEntry.count++;
  rateLimitMap.set(identifier, rateLimitEntry);

  return {
    allowed: true,
    remaining: maxRequests - rateLimitEntry.count,
    resetTime: rateLimitEntry.resetTime,
  };
}

/**
 * Validate file upload security
 */
export function validateFileUpload(
  file: File,
  config: SecurityConfig = defaultConfig
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > config.upload.maxFileSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${config.upload.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type (more lenient for form-data compatibility)
  if (file.type && !config.upload.allowedMimeTypes.includes(file.type)) {
    console.warn('[SECURITY] File type check:', file.type, 'not in', config.upload.allowedMimeTypes);
    // Don't block if type is empty or undefined (common with form-data)
    if (file.type !== '' && file.type !== 'application/octet-stream') {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`,
      };
    }
  }

  // Check file extension
  const allowedExtensions = ['.pdf'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize input strings
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate request content type
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): boolean {
  const contentType = request.headers.get('content-type');
  if (!contentType) return false;

  return allowedTypes.some(type => contentType.includes(type));
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSRF protection
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

/**
 * CORS validation
 */
export function validateCORS(
  request: NextRequest,
  config: SecurityConfig = defaultConfig
): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow same-origin requests

  return config.cors.allowedOrigins.includes(origin);
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for production behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || '';
  
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Validate Indigenous data protocols
 */
export function validateIndigenousDataProtocols(
  content: string,
  metadata?: Record<string, any>
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for sensitive cultural content
  const sensitiveTerms = [
    'sacred', 'ceremony', 'ritual', 'elder', 'traditional knowledge',
    'cultural practice', 'spiritual', 'ancestral', 'totem'
  ];

  const contentLower = content.toLowerCase();
  const foundSensitiveTerms = sensitiveTerms.filter(term => 
    contentLower.includes(term)
  );

  if (foundSensitiveTerms.length > 0) {
    warnings.push(
      `Content contains culturally sensitive terms: ${foundSensitiveTerms.join(', ')}. ` +
      'Ensure proper community consent and CARE+ principles compliance.'
    );
  }

  // Check for personally identifying information
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
  ];

  for (const pattern of piiPatterns) {
    if (pattern.test(content)) {
      warnings.push('Content may contain personally identifying information. Review for data privacy compliance.');
      break;
    }
  }

  return {
    valid: true, // Always allow, but with warnings
    warnings,
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  request: NextRequest,
  details?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent'),
    path: request.nextUrl.pathname,
    method: request.method,
    ...details,
  };

  // In production, send to monitoring service
  console.warn('[SECURITY]', JSON.stringify(logEntry));
}