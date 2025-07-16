/**
 * Test utilities for integration tests
 * Provides common functionality for testing document uploads, AI analysis, and API endpoints
 */

import { NextRequest } from 'next/server';
import { Readable } from 'stream';

// Test environment configuration
export const TEST_CONFIG = {
  timeout: 30000, // 30 seconds for integration tests
  apiBaseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['.pdf', '.txt', '.md'],
} as const;

// Mock file creation utilities
export function createMockPDFBuffer(): Buffer {
  // Simple PDF structure for testing
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
294
%%EOF`;
  
  return Buffer.from(pdfContent);
}

export function createMockTextFile(content: string = 'Test document content for analysis'): Buffer {
  return Buffer.from(content, 'utf-8');
}

// File upload simulation
export interface MockFile {
  name: string;
  size: number;
  type: string;
  buffer: Buffer;
}

export function createMockFile(
  filename: string = 'test-document.pdf',
  content?: Buffer,
  type: string = 'application/pdf'
): MockFile {
  const buffer = content || createMockPDFBuffer();
  return {
    name: filename,
    size: buffer.length,
    type,
    buffer,
  };
}

// FormData creation for file uploads (browser compatibility)
export function createFormDataWithFile(file: MockFile, additionalFields?: Record<string, string>): FormData {
  // This function is for browser compatibility only
  // For Node.js testing, we use form-data in uploadFile function
  throw new Error('Use uploadFile() function for Node.js testing environment');
}

// API request helpers
export async function makeAPIRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${TEST_CONFIG.apiBaseUrl}/api${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Use global fetch (polyfilled by Jest environment)
  return global.fetch(url, { ...defaultOptions, ...options });
}

export async function uploadFile(
  file: MockFile,
  endpoint: string = '/documents',
  additionalFields?: Record<string, string>
): Promise<Response> {
  const formData = new FormData();
  
  // Create a mock File for testing
  const blob = new Blob([file.buffer], { type: file.type });
  formData.append('file', blob, file.name);
  
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  const url = `${TEST_CONFIG.apiBaseUrl}/api${endpoint}`;
  
  return global.fetch(url, {
    method: 'POST',
    body: formData,
  });
}

// AI analysis helpers
export function createMockAIAnalysisRequest(
  content: string = 'Test content for AI analysis',
  analysisType: 'quick' | 'standard' | 'deep' | 'world-class' = 'quick'
) {
  return {
    content,
    analysisType,
    options: {
      extractThemes: true,
      extractQuotes: true,
      extractInsights: true,
      extractEntities: analysisType !== 'quick',
      extractSystems: analysisType === 'deep' || analysisType === 'world-class',
    },
  };
}

// Database test helpers
export function createMockDocument(overrides: Partial<any> = {}) {
  return {
    id: 'test-doc-' + Date.now(),
    filename: 'test-document.pdf',
    originalName: 'Test Document.pdf',
    status: 'uploaded',
    uploadedAt: new Date(),
    size: 1024,
    wordCount: 100,
    pageCount: 1,
    category: 'research',
    source: 'test',
    ...overrides,
  };
}

// Test data validation
export function validateDocumentResponse(response: any): boolean {
  return (
    response &&
    typeof response.id === 'string' &&
    typeof response.filename === 'string' &&
    typeof response.status === 'string' &&
    response.uploadedAt &&
    typeof response.size === 'number'
  );
}

export function validateAIAnalysisResponse(response: any): boolean {
  return (
    response &&
    typeof response === 'object' &&
    (Array.isArray(response.themes) || 
     Array.isArray(response.quotes) || 
     Array.isArray(response.insights) || 
     Array.isArray(response.entities))
  );
}

// Timeout and retry utilities
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TEST_CONFIG.timeout): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Environment validation
export function validateTestEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    errors.push('Database URL not configured');
  }
  
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    errors.push('No AI provider API keys configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// SSE (Server-Sent Events) testing utilities
export async function createSSEListener(endpoint: string): Promise<any[]> {
  // For testing, we'll simulate SSE by polling the endpoint
  // In a real implementation, you might use a specialized SSE client for Node.js
  const events: any[] = [];
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await makeAPIRequest(endpoint);
      if (response.status === 200) {
        const data = await response.json();
        events.push(data);
        
        if (data.status === 'completed' || data.status === 'failed') {
          break;
        }
      }
    } catch (error) {
      // Continue polling on error
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
  }
  
  return events;
}

// Cultural sensitivity validation for Indigenous research
export function validateCulturalCompliance(content: any): { isCompliant: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for CARE+ principles compliance
  if (content.themes) {
    const culturalThemes = content.themes.filter((theme: any) => 
      theme.category === 'cultural' || theme.category === 'identity'
    );
    
    if (culturalThemes.length > 0) {
      // Ensure cultural themes have proper context and respect
      culturalThemes.forEach((theme: any) => {
        if (!theme.context || !theme.respect_level) {
          issues.push(`Cultural theme "${theme.title}" lacks proper context or respect indicators`);
        }
      });
    }
  }
  
  return {
    isCompliant: issues.length === 0,
    issues,
  };
}

export default {
  TEST_CONFIG,
  createMockPDFBuffer,
  createMockTextFile,
  createMockFile,
  createFormDataWithFile,
  makeAPIRequest,
  uploadFile,
  createMockAIAnalysisRequest,
  createMockDocument,
  validateDocumentResponse,
  validateAIAnalysisResponse,
  withTimeout,
  retryOperation,
  validateTestEnvironment,
  createSSEListener,
  validateCulturalCompliance,
};