/**
 * Mock API responses for integration testing
 * Simulates real API responses without requiring a running server
 */

// Mock document response
export const mockDocumentResponse = {
  document: {
    id: 'doc_123456789',
    filename: 'test-document.pdf',
    originalName: 'Test Document.pdf',
    status: 'uploaded',
    uploadedAt: new Date().toISOString(),
    processedAt: null,
    size: 1024,
    wordCount: 0,
    pageCount: 1,
    category: 'research',
    source: 'test',
    _count: {
      chunks: 0,
      themes: 0,
      insights: 0,
    },
  },
};

// Mock documents list response
export const mockDocumentsListResponse = {
  documents: [mockDocumentResponse.document],
  total: 1,
  limit: 10,
  offset: 0,
  hasMore: false,
};

// Mock AI analysis response
export const mockAIAnalysisResponse = {
  analysisType: 'standard',
  processingTime: 2500,
  providerUsed: 'openai',
  themes: [
    {
      title: 'Education and Learning',
      category: 'social',
      confidence: 0.92,
      context: 'Discussion of educational pathways and learning preferences',
    },
    {
      title: 'Cultural Identity',
      category: 'cultural',
      confidence: 0.88,
      context: 'Strong connection to Indigenous heritage and traditions',
      respect_level: 'high',
    },
    {
      title: 'Youth Empowerment',
      category: 'social',
      confidence: 0.85,
      context: 'Youth voices and leadership opportunities',
    },
  ],
  quotes: [
    {
      text: 'Education is really important to me, but I want to learn in ways that connect to my culture.',
      confidence: 0.9,
      themes: ['Education and Learning', 'Cultural Identity'],
      speaker: 'Participant 1',
    },
    {
      text: 'We need safe spaces where we can talk about our challenges without judgment.',
      confidence: 0.87,
      themes: ['Youth Empowerment', 'Mental Health'],
      speaker: 'Participant 2',
    },
  ],
  insights: [
    {
      title: 'Intergenerational Knowledge Transfer',
      content: 'Young people value learning from elders and traditional knowledge systems',
      confidence: 0.89,
      supportingQuotes: 1,
    },
    {
      title: 'Culturally Responsive Education',
      content: 'There is a strong desire for education that integrates Indigenous knowledge',
      confidence: 0.91,
      supportingQuotes: 2,
    },
  ],
  entities: [
    {
      name: 'Barkly Region',
      type: 'location',
      confidence: 0.95,
      mentions: 3,
    },
    {
      name: 'Indigenous Youth',
      type: 'demographic',
      confidence: 0.93,
      mentions: 5,
    },
  ],
  systems: [
    {
      name: 'Education System',
      type: 'institutional',
      relationships: ['Cultural Knowledge', 'Youth Development'],
      confidence: 0.87,
    },
  ],
};

// Mock AI provider config response
export const mockAIConfigResponse = {
  providers: ['openai', 'anthropic', 'moonshot'],
  currentProvider: 'openai',
  isHealthy: true,
  providersAvailable: ['openai', 'anthropic'],
};

// Mock AI provider status response
export const mockAIStatusResponse = {
  providers: {
    openai: {
      available: true,
      models: ['gpt-4', 'gpt-3.5-turbo'],
      rateLimit: {
        remaining: 950,
        total: 1000,
      },
    },
    anthropic: {
      available: true,
      models: ['claude-3-sonnet', 'claude-3-haiku'],
      rateLimit: {
        remaining: 48,
        total: 50,
      },
    },
    moonshot: {
      available: false,
      error: 'API key not configured',
    },
  },
};

// Mock database status response
export const mockDBStatusResponse = {
  connected: true,
  provider: 'postgresql',
  version: '14.9',
  migrations: 'up-to-date',
};

// Mock bulk upload response
export const mockBulkUploadResponse = {
  successful: 3,
  failed: 0,
  results: [
    { ...mockDocumentResponse.document, id: 'doc_1' },
    { ...mockDocumentResponse.document, id: 'doc_2' },
    { ...mockDocumentResponse.document, id: 'doc_3' },
  ],
};

// Mock search response
export const mockSearchResponse = {
  documents: [mockDocumentResponse.document],
  total: 1,
  query: 'education',
  processingTime: 150,
};

// Mock chunks response
export const mockChunksResponse = {
  chunks: [
    {
      id: 'chunk_1',
      content: 'Education is really important to me...',
      position: 0,
      embedding: new Array(1536).fill(0.1), // Mock embedding vector
      tokens: 25,
    },
    {
      id: 'chunk_2', 
      content: 'Mental health support is something we really need...',
      position: 1,
      embedding: new Array(1536).fill(0.2),
      tokens: 30,
    },
  ],
};

// Mock insights response
export const mockInsightsResponse = {
  summary: 'This collection reveals strong themes around education, cultural identity, and youth empowerment in the Barkly region.',
  keyFindings: [
    'Youth value culturally responsive education approaches',
    'Mental health support is a critical community need',
    'Intergenerational knowledge transfer is highly valued',
  ],
  recommendations: [
    'Develop mentorship programs connecting youth with elders',
    'Create culturally appropriate mental health services',
    'Support youth-led community development initiatives',
  ],
  statisticalSummary: {
    totalThemes: 15,
    totalQuotes: 28,
    totalInsights: 8,
    confidenceAverage: 0.87,
  },
};

// Mock collection response
export const mockCollectionResponse = {
  id: 'collection_123',
  name: 'Barkly Youth Voices Study',
  description: 'Community research project exploring youth perspectives',
  documentIds: ['doc_123456789'],
  tags: ['youth', 'community', 'barkly', 'research'],
  createdAt: new Date().toISOString(),
  documentCount: 1,
};

// Error responses
export const mockErrorResponses = {
  notFound: {
    error: 'Resource not found',
    code: 'NOT_FOUND',
    details: 'The requested resource could not be found',
  },
  validation: {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: 'Request data does not meet requirements',
  },
  serverError: {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: 'An unexpected error occurred',
  },
  unauthorized: {
    error: 'Unauthorized access',
    code: 'UNAUTHORIZED',
    details: 'Authentication required',
  },
  rateLimited: {
    error: 'Rate limit exceeded',
    code: 'RATE_LIMITED',
    details: 'Too many requests, please try again later',
  },
};

// Setup mock fetch responses
export function setupMockFetch() {
  const mockFetch = jest.fn();
  
  // Document endpoints
  mockFetch.mockImplementation((url: string, options?: any) => {
    const method = options?.method || 'GET';
    
    // Document upload
    if (url.includes('/api/documents') && method === 'POST') {
      // Handle validation errors
      if (options?.body instanceof FormData) {
        // Mock file validation
        const fileData = options.body.get('file');
        if (fileData && fileData.size > 10 * 1024 * 1024) {
          return Promise.resolve({
            status: 400,
            json: () => Promise.resolve({
              error: 'File size exceeds maximum limit of 10MB',
            }),
            headers: new Headers(),
          });
        }
        
        if (fileData && fileData.type === 'application/x-executable') {
          return Promise.resolve({
            status: 400,
            json: () => Promise.resolve({
              error: 'File type not supported',
            }),
            headers: new Headers(),
          });
        }
      }
      
      // Successful upload - customize based on request data
      const response = { ...mockDocumentResponse };
      if (options?.body instanceof FormData) {
        const categoryField = options.body.get('category');
        const sourceField = options.body.get('source');
        const fileData = options.body.get('file');
        
        if (categoryField) response.document.category = categoryField;
        if (sourceField) response.document.source = sourceField;
        if (fileData) {
          response.document.originalName = fileData.name || response.document.originalName;
          response.document.size = fileData.size || response.document.size;
        }
      }
      
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(response),
        headers: new Headers(),
      });
    }
    
    // Documents list
    if (url.includes('/api/documents') && method === 'GET') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockDocumentsListResponse),
        headers: new Headers(),
      });
    }
    
    // Document by ID
    if (url.match(/\/api\/documents\/doc_\w+$/) && method === 'GET') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockDocumentResponse.document),
        headers: new Headers(),
      });
    }
    
    // Document chunks
    if (url.includes('/chunks') && method === 'GET') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockChunksResponse),
        headers: new Headers(),
      });
    }
    
    // Bulk upload
    if (url.includes('/bulk-upload') && method === 'POST') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockBulkUploadResponse),
        headers: new Headers(),
      });
    }
    
    // AI analysis
    if (url.includes('/api/ai/analyze') && method === 'POST') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockAIAnalysisResponse),
        headers: new Headers(),
      });
    }
    
    // AI config
    if (url.includes('/api/ai/config')) {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockAIConfigResponse),
        headers: new Headers(),
      });
    }
    
    // AI status
    if (url.includes('/api/ai/status')) {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockAIStatusResponse),
        headers: new Headers(),
      });
    }
    
    // Database check
    if (url.includes('/api/check-db')) {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockDBStatusResponse),
        headers: new Headers(),
      });
    }
    
    // Search
    if (url.includes('/search') && method === 'POST') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockSearchResponse),
        headers: new Headers(),
      });
    }
    
    // Collections
    if (url.includes('/collections') && method === 'POST') {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockCollectionResponse),
        headers: new Headers(),
      });
    }
    
    // Insights
    if (url.includes('/insights')) {
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockInsightsResponse),
        headers: new Headers(),
      });
    }
    
    // Static assets
    if (url.includes('/favicon.ico')) {
      return Promise.resolve({
        status: 200,
        headers: new Headers({
          'cache-control': 'public, max-age=31536000',
          'content-type': 'image/x-icon',
        }),
        blob: () => Promise.resolve(new Blob()),
      });
    }
    
    // Main page
    if (url.endsWith('/') || url.includes('localhost:3000')) {
      return Promise.resolve({
        status: 200,
        headers: new Headers({
          'content-type': 'text/html',
        }),
        text: () => Promise.resolve('<html><head><title>Barkly Research Platform</title></head><body>Welcome to Barkly Research Platform</body></html>'),
      });
    }
    
    // CORS preflight
    if (method === 'OPTIONS') {
      return Promise.resolve({
        status: 200,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }),
      });
    }
    
    // Non-existent endpoints
    if (url.includes('/non-existent-endpoint')) {
      return Promise.resolve({
        status: 404,
        json: () => Promise.resolve(mockErrorResponses.notFound),
        headers: new Headers(),
      });
    }
    
    // Malformed requests
    if (options?.body === 'invalid json') {
      return Promise.resolve({
        status: 400,
        json: () => Promise.resolve(mockErrorResponses.validation),
        headers: new Headers(),
      });
    }
    
    // Default response for unmatched requests
    return Promise.resolve({
      status: 404,
      json: () => Promise.resolve(mockErrorResponses.notFound),
      headers: new Headers(),
    });
  });
  
  global.fetch = mockFetch;
  return mockFetch;
}

export default {
  mockDocumentResponse,
  mockDocumentsListResponse,
  mockAIAnalysisResponse,
  mockAIConfigResponse,
  mockAIStatusResponse,
  mockDBStatusResponse,
  mockBulkUploadResponse,
  mockSearchResponse,
  mockChunksResponse,
  mockInsightsResponse,
  mockCollectionResponse,
  mockErrorResponses,
  setupMockFetch,
};