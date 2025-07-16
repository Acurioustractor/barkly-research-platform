/**
 * Integration tests for document upload functionality
 * Tests the complete document upload pipeline including file processing and AI analysis
 */

import { describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  createMockFile,
  uploadFile,
  makeAPIRequest,
  validateDocumentResponse,
  withTimeout,
  retryOperation,
  validateTestEnvironment,
  createSSEListener,
  TEST_CONFIG,
} from './test-utils';
import { setupMockFetch } from './mock-responses';

describe('Document Upload Integration Tests', () => {
  let testDocumentId: string | null = null;

  beforeAll(async () => {
    // Setup mock fetch responses
    setupMockFetch();
    
    // Validate test environment
    const envCheck = validateTestEnvironment();
    if (!envCheck.isValid) {
      console.warn('Test environment issues:', envCheck.errors);
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test document if created
    if (testDocumentId) {
      try {
        await makeAPIRequest(`/documents/${testDocumentId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.log('Cleanup error (expected in some cases):', error);
      }
    }
  });

  describe('Basic File Upload', () => {
    test('should upload a PDF file successfully', async () => {
      const mockFile = createMockFile('test-research.pdf');
      
      const response = await withTimeout(
        uploadFile(mockFile, '/documents', {
          category: 'research',
          source: 'test',
        })
      );

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(validateDocumentResponse(result.document)).toBe(true);
      expect(result.document.filename).toContain('.pdf');
      expect(result.document.status).toBe('uploaded');
      
      // Store for cleanup
      testDocumentId = result.document.id;
    }, TEST_CONFIG.timeout);

    test('should handle file size validation', async () => {
      // Create oversized file (larger than 10MB limit)
      const largeBuffer = Buffer.alloc(TEST_CONFIG.maxFileSize + 1000);
      const oversizedFile = createMockFile('large-file.pdf', largeBuffer);
      
      const response = await uploadFile(oversizedFile);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('file size');
    });

    test('should reject unsupported file types', async () => {
      const invalidFile = createMockFile('test-file.exe', Buffer.from('invalid'), 'application/x-executable');
      
      const response = await uploadFile(invalidFile);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('file type');
    });
  });

  describe('Bulk Upload', () => {
    test('should handle multiple file uploads', async () => {
      const files = [
        createMockFile('doc1.pdf'),
        createMockFile('doc2.pdf'),
        createMockFile('doc3.pdf'),
      ];

      // Create FormData with multiple files
      const formData = new FormData();
      files.forEach((file, index) => {
        const blob = new Blob([file.buffer], { type: file.type });
        const fileObj = new File([blob], file.name, { type: file.type });
        formData.append(`file${index}`, fileObj);
      });

      const response = await withTimeout(
        makeAPIRequest('/documents/bulk-upload', {
          method: 'POST',
          body: formData,
          headers: {}, // Let browser set multipart headers
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.successful).toBeGreaterThan(0);
      expect(result.results).toHaveLength(files.length);
    }, TEST_CONFIG.timeout * 2); // Extended timeout for bulk operations
  });

  describe('Server-Sent Events (SSE) Upload', () => {
    test('should stream upload progress via SSE', async () => {
      const mockFile = createMockFile('sse-test.pdf');
      
      // Start SSE listener
      const eventsPromise = createSSEListener('/documents/upload-sse');
      
      // Upload file
      const uploadPromise = uploadFile(mockFile, '/documents/upload-sse', {
        category: 'research',
        enableSSE: 'true',
      });

      // Wait for both upload completion and SSE events
      const [events, uploadResponse] = await Promise.all([
        eventsPromise,
        uploadPromise,
      ]);

      expect(uploadResponse.status).toBe(200);
      expect(events.length).toBeGreaterThan(0);
      
      // Verify SSE event progression
      const statusProgression = events.map(e => e.status);
      expect(statusProgression).toContain('uploading');
      expect(statusProgression[statusProgression.length - 1]).toMatch(/completed|processing/);
    }, TEST_CONFIG.timeout);
  });

  describe('Document Processing Pipeline', () => {
    test('should extract text from PDF correctly', async () => {
      const mockFile = createMockFile('text-extraction-test.pdf');
      
      const uploadResponse = await uploadFile(mockFile, '/documents', {
        processImmediately: 'true',
      });
      
      expect(uploadResponse.status).toBe(200);
      const uploadResult = await uploadResponse.json();
      const docId = uploadResult.document.id;

      // Wait for processing to complete
      await retryOperation(async () => {
        const statusResponse = await makeAPIRequest(`/documents/${docId}`);
        const doc = await statusResponse.json();
        
        if (doc.status === 'processing') {
          throw new Error('Still processing');
        }
        
        expect(doc.status).toBe('completed');
        expect(doc.wordCount).toBeGreaterThan(0);
        expect(doc.content).toBeDefined();
        
        return doc;
      }, 5, 2000); // 5 retries, 2 second delay
    }, TEST_CONFIG.timeout);

    test('should create document chunks for analysis', async () => {
      const mockFile = createMockFile('chunking-test.pdf');
      
      const uploadResponse = await uploadFile(mockFile);
      const uploadResult = await uploadResponse.json();
      const docId = uploadResult.document.id;

      // Wait for processing and check chunks
      await retryOperation(async () => {
        const chunksResponse = await makeAPIRequest(`/documents/${docId}/chunks`);
        expect(chunksResponse.status).toBe(200);
        
        const chunks = await chunksResponse.json();
        expect(chunks.chunks).toBeDefined();
        expect(chunks.chunks.length).toBeGreaterThan(0);
        
        // Verify chunk structure
        chunks.chunks.forEach((chunk: any) => {
          expect(chunk.content).toBeDefined();
          expect(chunk.embedding).toBeDefined();
          expect(chunk.position).toBeDefined();
        });
        
        return chunks;
      }, 5, 2000);
    }, TEST_CONFIG.timeout);
  });

  describe('Error Handling and Recovery', () => {
    test('should handle corrupted PDF files gracefully', async () => {
      const corruptedPDF = createMockFile(
        'corrupted.pdf',
        Buffer.from('This is not a valid PDF file'),
        'application/pdf'
      );
      
      const response = await uploadFile(corruptedPDF);
      
      // Should either reject immediately or fail processing gracefully
      if (response.status === 400) {
        const result = await response.json();
        expect(result.error).toBeDefined();
      } else if (response.status === 200) {
        const result = await response.json();
        const docId = result.document.id;
        
        // Check that processing fails gracefully
        await retryOperation(async () => {
          const statusResponse = await makeAPIRequest(`/documents/${docId}`);
          const doc = await statusResponse.json();
          
          if (doc.status === 'processing') {
            throw new Error('Still processing');
          }
          
          expect(doc.status).toBe('failed');
          expect(doc.error).toBeDefined();
          
          return doc;
        }, 5, 2000);
      }
    });

    test('should handle database connection issues', async () => {
      // Test upload when database might be temporarily unavailable
      const mockFile = createMockFile('db-test.pdf');
      
      // This test verifies graceful degradation
      const response = await uploadFile(mockFile);
      
      // Should either succeed or fail with appropriate error message
      if (response.status !== 200) {
        const result = await response.json();
        expect(result.error).toBeDefined();
        expect(result.error).not.toContain('undefined');
      }
    });

    test('should handle concurrent uploads', async () => {
      const concurrentUploads = Array.from({ length: 3 }, (_, i) => 
        uploadFile(createMockFile(`concurrent-${i}.pdf`))
      );
      
      const responses = await Promise.allSettled(concurrentUploads);
      
      // At least some uploads should succeed
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      
      expect(successful.length).toBeGreaterThan(0);
    }, TEST_CONFIG.timeout);
  });

  describe('File Metadata and Validation', () => {
    test('should preserve original filename and metadata', async () => {
      const originalName = 'Research Paper - Youth Voices.pdf';
      const mockFile = createMockFile(originalName);
      
      const response = await uploadFile(mockFile, '/documents', {
        category: 'academic',
        source: 'university',
        tags: 'youth,research,voices',
      });
      
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.document.originalName).toBe(originalName);
      expect(result.document.category).toBe('academic');
      expect(result.document.source).toBe('university');
    });

    test('should calculate file statistics correctly', async () => {
      const mockFile = createMockFile('stats-test.pdf');
      
      const response = await uploadFile(mockFile, '/documents', {
        calculateStats: 'true',
      });
      
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.document.size).toBe(mockFile.size);
      expect(typeof result.document.checksum).toBe('string');
    });
  });

  describe('Search and Retrieval', () => {
    test('should make uploaded documents searchable', async () => {
      const mockFile = createMockFile('searchable-doc.pdf');
      
      const uploadResponse = await uploadFile(mockFile, '/documents', {
        makeSearchable: 'true',
      });
      
      const uploadResult = await uploadResponse.json();
      const docId = uploadResult.document.id;

      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Search for the document
      const searchResponse = await makeAPIRequest('/documents/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test document content',
          limit: 10,
        }),
      });

      expect(searchResponse.status).toBe(200);
      const searchResults = await searchResponse.json();
      
      // Should find the uploaded document in search results
      const foundDoc = searchResults.documents.find((doc: any) => doc.id === docId);
      expect(foundDoc).toBeDefined();
    });
  });
});