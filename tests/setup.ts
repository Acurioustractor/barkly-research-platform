import { jest } from '@jest/globals';

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-key';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
  
  // Mock console methods in test environment
  if (process.env.SUPPRESS_LOGS === 'true') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock fetch for tests that don't explicitly mock it
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.MockedFunction<typeof fetch>;

// Mock WebSocket for real-time tests
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
})) as any;

// Mock IntersectionObserver for component tests
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// Mock ResizeObserver for component tests
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock URL.createObjectURL for file upload tests
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader for file processing tests
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  result: null,
  error: null,
  readyState: 0,
})) as any;

// Mock Blob for file tests
global.Blob = jest.fn((content, options) => ({
  size: content ? content.length : 0,
  type: options?.type || '',
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
  text: jest.fn(() => Promise.resolve('')),
  stream: jest.fn(),
  slice: jest.fn(),
})) as any;

// Mock File for file upload tests
global.File = jest.fn((bits, name, options) => ({
  ...new (global.Blob as any)(bits, options),
  name,
  lastModified: Date.now(),
  webkitRelativePath: '',
})) as any;

// Mock crypto for secure operations
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mocked-uuid'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
      encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
      decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    },
  },
});

// Mock performance API
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn(cb => setTimeout(cb, 1));
global.cancelIdleCallback = jest.fn(id => clearTimeout(id));

// Custom test utilities
export const testUtils = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'mock-user-id',
    email: 'test@example.com',
    role: 'community_member',
    community_id: 'mock-community-id',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Create mock community
  createMockCommunity: (overrides = {}) => ({
    id: 'mock-community-id',
    name: 'Test Community',
    description: 'A test community',
    location: 'Test Location',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Create mock story
  createMockStory: (overrides = {}) => ({
    id: 'mock-story-id',
    title: 'Test Story',
    content: 'This is a test story',
    type: 'story',
    status: 'approved',
    community_id: 'mock-community-id',
    submitted_by: 'mock-user-id',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Create mock AI analysis
  createMockAnalysis: (overrides = {}) => ({
    id: 'mock-analysis-id',
    document_id: 'mock-story-id',
    analysis_type: 'story_analysis',
    themes: [
      {
        theme: 'Healthcare',
        description: 'Healthcare access issues',
        urgency: 'high',
        confidence: 0.85,
        keywords: ['healthcare', 'clinic', 'access']
      }
    ],
    sentiment: 'concerned',
    urgency: 'high',
    actionable_insights: ['Improve healthcare access'],
    confidence_score: 0.85,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Mock Supabase response
  mockSupabaseResponse: (data: any, error: any = null) => ({
    data,
    error,
    count: Array.isArray(data) ? data.length : data ? 1 : 0,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }),
  
  // Mock API response
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  }),
};

// Declare global test types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

// Export test utilities for use in tests
export default testUtils;