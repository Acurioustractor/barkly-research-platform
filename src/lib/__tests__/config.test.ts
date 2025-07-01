/**
 * Tests for configuration system
 */

describe('Configuration', () => {
  // Mock the config module
  let features: any;
  let limits: any;
  let timeouts: any;

  beforeEach(() => {
    jest.resetModules();
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    // Re-import after clearing env
    const config = require('../config');
    features = config.features;
    limits = config.limits;
    timeouts = config.timeouts;
  });
  describe('features', () => {
    it('should detect environment correctly', () => {
      expect(features.isDevelopment()).toBe(false); // NODE_ENV is 'test'
      expect(features.isProduction()).toBe(false);
    });

    it('should check AI availability', () => {
      // These will be false in test environment without API keys
      expect(features.hasOpenAI()).toBe(false);
      expect(features.hasAnthropic()).toBe(false);
      expect(features.hasAnyAI()).toBe(false);
    });

    it('should check feature flags', () => {
      // Without AI services, these should be false
      expect(features.aiAnalysisEnabled()).toBe(false);
      expect(features.embeddingsEnabled()).toBe(false);
      
      // These don't depend on AI
      expect(features.parallelProcessingEnabled()).toBeDefined();
    });
  });

  describe('limits', () => {
    it('should provide default limits', () => {
      expect(limits.maxFileSize).toBeGreaterThan(0);
      expect(limits.maxConcurrentUploads).toBeGreaterThan(0);
      expect(limits.chunkSize).toBeGreaterThan(0);
      expect(limits.maxFileSizeMB).toBeGreaterThan(0);
    });
  });

  describe('timeouts', () => {
    it('should provide default timeouts', () => {
      expect(timeouts.ai).toBeGreaterThan(0);
      expect(timeouts.pdfExtraction).toBeGreaterThan(0);
    });
  });
});