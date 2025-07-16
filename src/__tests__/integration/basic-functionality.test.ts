/**
 * Basic functionality tests that can run without a live server
 * Tests core utilities, validation, and mock scenarios
 */

import { describe, expect, test } from '@jest/globals';
import {
  createMockPDFBuffer,
  createMockTextFile,
  createMockFile,
  createMockAIAnalysisRequest,
  createMockDocument,
  validateDocumentResponse,
  validateAIAnalysisResponse,
  validateCulturalCompliance,
  validateTestEnvironment,
  withTimeout,
  retryOperation,
  TEST_CONFIG,
} from './test-utils';

describe('Basic Functionality Tests', () => {
  describe('Test Utilities', () => {
    test('should create mock PDF buffer', () => {
      const pdfBuffer = createMockPDFBuffer();
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      expect(pdfBuffer.toString().startsWith('%PDF')).toBe(true);
    });

    test('should create mock text file', () => {
      const content = 'Test document content';
      const textBuffer = createMockTextFile(content);
      
      expect(textBuffer).toBeInstanceOf(Buffer);
      expect(textBuffer.toString()).toBe(content);
    });

    test('should create mock file with metadata', () => {
      const filename = 'test-document.pdf';
      const mockFile = createMockFile(filename);
      
      expect(mockFile.name).toBe(filename);
      expect(mockFile.type).toBe('application/pdf');
      expect(mockFile.size).toBeGreaterThan(0);
      expect(mockFile.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Validation Functions', () => {
    test('should validate document response correctly', () => {
      const validDocument = {
        id: 'test-123',
        filename: 'test.pdf',
        status: 'completed',
        uploadedAt: new Date(),
        size: 1024,
      };
      
      expect(validateDocumentResponse(validDocument)).toBe(true);
      
      const invalidDocument = {
        filename: 'test.pdf',
        // Missing required fields
      };
      
      expect(validateDocumentResponse(invalidDocument)).toBe(false);
    });

    test('should validate AI analysis response correctly', () => {
      const validAnalysis = {
        themes: [
          { title: 'Education', category: 'social', confidence: 0.9 }
        ],
        quotes: [
          { text: 'Test quote', confidence: 0.8 }
        ],
      };
      
      expect(validateAIAnalysisResponse(validAnalysis)).toBe(true);
      
      const invalidAnalysis = {};
      expect(validateAIAnalysisResponse(invalidAnalysis)).toBe(false);
    });

    test('should validate cultural compliance', () => {
      const compliantContent = {
        themes: [
          {
            title: 'Cultural Identity',
            category: 'cultural',
            context: 'Respectful discussion of Indigenous heritage',
            respect_level: 'high',
          }
        ],
      };
      
      const compliance = validateCulturalCompliance(compliantContent);
      expect(compliance.isCompliant).toBe(true);
      expect(compliance.issues).toHaveLength(0);
      
      const nonCompliantContent = {
        themes: [
          {
            title: 'Cultural Identity',
            category: 'cultural',
            // Missing context and respect_level
          }
        ],
      };
      
      const nonCompliance = validateCulturalCompliance(nonCompliantContent);
      expect(nonCompliance.isCompliant).toBe(false);
      expect(nonCompliance.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Mock Data Generators', () => {
    test('should create mock AI analysis request', () => {
      const request = createMockAIAnalysisRequest('Test content', 'standard');
      
      expect(request.content).toBe('Test content');
      expect(request.analysisType).toBe('standard');
      expect(request.options.extractThemes).toBe(true);
      expect(request.options.extractQuotes).toBe(true);
    });

    test('should create mock document with overrides', () => {
      const overrides = {
        filename: 'custom-name.pdf',
        category: 'research',
      };
      
      const document = createMockDocument(overrides);
      
      expect(document.filename).toBe('custom-name.pdf');
      expect(document.category).toBe('research');
      expect(document.id).toBeDefined();
      expect(document.status).toBe('uploaded');
    });
  });

  describe('Utility Functions', () => {
    test('should handle timeout operations', async () => {
      const fastOperation = () => Promise.resolve('success');
      const result = await withTimeout(fastOperation(), 1000);
      expect(result).toBe('success');
      
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve('late'), 2000)
      );
      
      await expect(withTimeout(slowOperation(), 100)).rejects.toThrow('timed out');
    });

    test('should retry failed operations', async () => {
      let attempts = 0;
      const flakyOperation = () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve('success');
      };
      
      const result = await retryOperation(flakyOperation, 5, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should validate test environment', () => {
      const validation = validateTestEnvironment();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Configuration', () => {
    test('should have valid test configuration', () => {
      expect(TEST_CONFIG.timeout).toBeGreaterThan(0);
      expect(TEST_CONFIG.maxFileSize).toBeGreaterThan(0);
      expect(TEST_CONFIG.supportedFileTypes).toContain('.pdf');
      expect(TEST_CONFIG.apiBaseUrl).toBeDefined();
    });

    test('should handle different API base URLs', () => {
      // Test localhost
      expect(TEST_CONFIG.apiBaseUrl.includes('localhost') || 
             TEST_CONFIG.apiBaseUrl.includes('vercel.app') ||
             TEST_CONFIG.apiBaseUrl.includes('127.0.0.1')).toBe(true);
    });
  });

  describe('File Type Validation', () => {
    test('should support PDF files', () => {
      const pdfFile = createMockFile('document.pdf', undefined, 'application/pdf');
      expect(pdfFile.type).toBe('application/pdf');
      expect(pdfFile.name.endsWith('.pdf')).toBe(true);
    });

    test('should handle different file sizes', () => {
      const smallFile = createMockFile('small.pdf');
      expect(smallFile.size).toBeLessThan(TEST_CONFIG.maxFileSize);
      
      const largeBuffer = Buffer.alloc(TEST_CONFIG.maxFileSize + 1000);
      const largeFile = createMockFile('large.pdf', largeBuffer);
      expect(largeFile.size).toBeGreaterThan(TEST_CONFIG.maxFileSize);
    });
  });

  describe('Cultural Sensitivity Framework', () => {
    test('should identify cultural themes', () => {
      const culturalContent = {
        themes: [
          { title: 'Traditional Knowledge', category: 'cultural' },
          { title: 'Education', category: 'social' },
          { title: 'Connection to Country', category: 'cultural' },
        ],
      };
      
      const culturalThemes = culturalContent.themes.filter(
        theme => theme.category === 'cultural'
      );
      
      expect(culturalThemes).toHaveLength(2);
      expect(culturalThemes[0].title).toBe('Traditional Knowledge');
    });

    test('should handle sensitive content flags', () => {
      const sensitiveContent = {
        themes: [
          {
            title: 'Mental Health Challenges',
            category: 'health',
            sensitive: true,
            handlingGuidelines: 'Requires cultural protocols and community consent',
          }
        ],
      };
      
      const sensitiveThemes = sensitiveContent.themes.filter(
        theme => theme.sensitive
      );
      
      expect(sensitiveThemes).toHaveLength(1);
      expect(sensitiveThemes[0].handlingGuidelines).toBeDefined();
    });
  });

  describe('Analysis Type Configuration', () => {
    test('should configure quick analysis', () => {
      const quickAnalysis = createMockAIAnalysisRequest('Test', 'quick');
      
      expect(quickAnalysis.analysisType).toBe('quick');
      expect(quickAnalysis.options.extractThemes).toBe(true);
      expect(quickAnalysis.options.extractEntities).toBe(false);
      expect(quickAnalysis.options.extractSystems).toBe(false);
    });

    test('should configure deep analysis', () => {
      const deepAnalysis = createMockAIAnalysisRequest('Test', 'deep');
      
      expect(deepAnalysis.analysisType).toBe('deep');
      expect(deepAnalysis.options.extractThemes).toBe(true);
      expect(deepAnalysis.options.extractEntities).toBe(true);
      expect(deepAnalysis.options.extractSystems).toBe(true);
    });

    test('should configure world-class analysis', () => {
      const worldClassAnalysis = createMockAIAnalysisRequest('Test', 'world-class');
      
      expect(worldClassAnalysis.analysisType).toBe('world-class');
      expect(worldClassAnalysis.options.extractSystems).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid file types gracefully', () => {
      const invalidFile = createMockFile('malware.exe', Buffer.from(''), 'application/x-executable');
      
      expect(invalidFile.type).toBe('application/x-executable');
      expect(TEST_CONFIG.supportedFileTypes.includes('.exe')).toBe(false);
    });

    test('should handle empty content', () => {
      const emptyFile = createMockFile('empty.pdf', Buffer.from(''));
      
      expect(emptyFile.size).toBe(0);
      expect(emptyFile.buffer).toBeInstanceOf(Buffer);
    });

    test('should handle malformed AI requests', () => {
      expect(() => {
        createMockAIAnalysisRequest('', 'invalid' as any);
      }).not.toThrow(); // Should handle gracefully
    });
  });
});