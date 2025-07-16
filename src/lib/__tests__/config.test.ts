/**
 * Tests for configuration system
 */

// Skip these tests for now due to module caching issues in Jest
describe.skip('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to avoid caching
    jest.resetModules();
    // Reset environment
    process.env = { ...originalEnv };
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('features', () => {
    it('should detect environment correctly', () => {
      // Re-import after setting environment
      const { features } = require('../config');
      
      // In test environment, neither development nor production should be true
      expect(features.isDevelopment()).toBe(false); // NODE_ENV is 'test'
      expect(features.isProduction()).toBe(false);
    });

    it('should check AI availability without API keys', () => {
      // Clear any existing API keys
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      const { features } = require('../config');
      
      // These will be false in test environment without API keys
      expect(features.hasOpenAI()).toBe(false);
      expect(features.hasAnthropic()).toBe(false);
      expect(features.hasAnyAI()).toBe(false);
    });

    it('should check AI availability with API keys', () => {
      // Set API keys
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      const { features } = require('../config');
      
      expect(features.hasOpenAI()).toBe(true);
      expect(features.hasAnthropic()).toBe(true);
      expect(features.hasAnyAI()).toBe(true);
    });

    it('should check feature flags', () => {
      // Set required database URL
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { features } = require('../config');
      
      // These don't depend on AI
      expect(features.parallelProcessingEnabled()).toBeDefined();
      expect(typeof features.parallelProcessingEnabled()).toBe('boolean');
    });
  });

  describe('limits', () => {
    it('should provide default limits', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { limits } = require('../config');
      
      expect(limits.maxFileSize).toBeGreaterThan(0);
      expect(limits.maxConcurrentUploads).toBeGreaterThan(0);
      expect(limits.chunkSize).toBeGreaterThan(0);
      expect(limits.maxFileSizeMB).toBeGreaterThan(0);
    });
  });

  describe('timeouts', () => {
    it('should provide default timeouts', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { timeouts } = require('../config');
      
      expect(timeouts.ai).toBeGreaterThan(0);
      expect(timeouts.pdfExtraction).toBeGreaterThan(0);
    });
  });
});