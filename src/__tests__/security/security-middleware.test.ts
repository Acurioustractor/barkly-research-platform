/**
 * Security Middleware Tests
 * Tests rate limiting, validation, and security functions
 */

import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  validateFileUpload,
  sanitizeInput,
  validateIndigenousDataProtocols,
  validateContentType,
} from '@/middleware/security';

// Mock file for testing
class MockFile extends File {
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, name, options);
  }
}

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const result = checkRateLimit(request);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThan(100);
    });

    it('should block requests exceeding limit', () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      
      // Simulate many requests from same IP
      for (let i = 0; i < 101; i++) {
        checkRateLimit(request);
      }
      
      const result = checkRateLimit(request);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('File Upload Validation', () => {
    it('should accept valid PDF files', () => {
      const file = new MockFile(['PDF content'], 'test.pdf', {
        type: 'application/pdf',
      });
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      // Create a file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new MockFile([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject non-PDF files', () => {
      const file = new MockFile(['content'], 'test.txt', {
        type: 'text/plain',
      });
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject files with invalid extensions', () => {
      const file = new MockFile(['content'], 'test.exe', {
        type: 'application/pdf', // Correct MIME but wrong extension
      });
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });
  });

  describe('Input Sanitization', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>test';
      const result = sanitizeInput(input);
      
      expect(result).toBe('scriptalert(xss)/scripttest');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  test content  ';
      const result = sanitizeInput(input);
      
      expect(result).toBe('test content');
    });

    it('should limit string length', () => {
      const longInput = 'a'.repeat(2000);
      const result = sanitizeInput(longInput);
      
      expect(result.length).toBe(1000);
    });

    it('should handle non-string inputs', () => {
      const result = sanitizeInput(null as any);
      expect(result).toBe('');
    });
  });

  describe('Indigenous Data Protocols', () => {
    it('should detect culturally sensitive terms', () => {
      const content = 'This document discusses traditional knowledge and sacred ceremonies.';
      const result = validateIndigenousDataProtocols(content);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('culturally sensitive terms');
    });

    it('should detect potential PII', () => {
      const content = 'Contact John at john.doe@example.com or call 123-456-7890.';
      const result = validateIndigenousDataProtocols(content);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('personally identifying'))).toBe(true);
    });

    it('should pass clean content without warnings', () => {
      const content = 'This is a general discussion about youth education programs.';
      const result = validateIndigenousDataProtocols(content);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Content Type Validation', () => {
    it('should accept valid content types', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=something'
        }
      });
      
      const result = validateContentType(request, ['multipart/form-data']);
      expect(result).toBe(true);
    });

    it('should reject invalid content types', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      
      const result = validateContentType(request, ['multipart/form-data']);
      expect(result).toBe(false);
    });

    it('should handle missing content type', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST'
      });
      
      const result = validateContentType(request, ['multipart/form-data']);
      expect(result).toBe(false);
    });
  });
});

describe('Security Integration Tests', () => {
  it('should handle malicious file upload attempts', () => {
    // Test various malicious file scenarios
    const maliciousFiles = [
      new MockFile(['<?php evil code ?>'], '../../../etc/passwd.pdf', { type: 'application/pdf' }),
      new MockFile(['evil'], 'script.pdf.exe', { type: 'application/pdf' }),
      new MockFile(['<script>'], 'normal.pdf', { type: 'text/html' }),
    ];

    maliciousFiles.forEach(file => {
      const result = validateFileUpload(file);
      // Should either be rejected or sanitized
      expect(result.valid).toBe(false);
    });
  });

  it('should validate complete workflow security', () => {
    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Check rate limiting
    const rateLimit = checkRateLimit(request);
    expect(rateLimit.allowed).toBe(true);

    // Check content type
    const contentTypeValid = validateContentType(request, ['multipart/form-data']);
    expect(contentTypeValid).toBe(true);

    // Check file validation
    const file = new MockFile(['PDF content'], 'research.pdf', { type: 'application/pdf' });
    const fileValid = validateFileUpload(file);
    expect(fileValid.valid).toBe(true);

    // Check content validation
    const content = 'Youth education research findings.';
    const protocolValid = validateIndigenousDataProtocols(content);
    expect(protocolValid.valid).toBe(true);
  });
});