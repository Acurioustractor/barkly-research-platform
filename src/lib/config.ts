/**
 * Centralized configuration with runtime validation
 * Uses Zod for type-safe environment variable parsing
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  DIRECT_URL: z.string().url().optional().describe('Direct PostgreSQL connection for migrations'),
  
  // AI Services
  OPENAI_API_KEY: z.string().min(1).optional().describe('OpenAI API key for GPT models'),
  ANTHROPIC_API_KEY: z.string().min(1).optional().describe('Anthropic API key for Claude models'),
  
  // Redis (optional)
  REDIS_URL: z.string().url().optional().describe('Redis connection string for job queue'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Feature Flags
  ENABLE_AI_ANALYSIS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EMBEDDINGS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PARALLEL_PROCESSING: z.string().transform(val => val === 'true').default('true'),
  
  // Limits
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val)).default('10485760'), // 10MB
  MAX_CONCURRENT_UPLOADS: z.string().transform(val => parseInt(val)).default('3'),
  CHUNK_SIZE: z.string().transform(val => parseInt(val)).default('1000'),
  
  // Timeouts
  AI_TIMEOUT_MS: z.string().transform(val => parseInt(val)).default('30000'),
  PDF_EXTRACTION_TIMEOUT_MS: z.string().transform(val => parseInt(val)).default('60000'),
});

// Parse and validate environment variables (server-side only)
function parseEnv() {
  // Skip validation on client side
  if (typeof window !== 'undefined') {
    return {
      NODE_ENV: 'development',
      ENABLE_AI_ANALYSIS: true,
      ENABLE_EMBEDDINGS: true,
      ENABLE_PARALLEL_PROCESSING: true,
      MAX_FILE_SIZE: 10485760,
      MAX_CONCURRENT_UPLOADS: 3,
      CHUNK_SIZE: 1000,
      AI_TIMEOUT_MS: 30000,
      PDF_EXTRACTION_TIMEOUT_MS: 60000,
    } as any;
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      console.error('❌ Environment validation failed:');
      
      if (missingVars.length > 0) {
        console.error('\nMissing required environment variables:');
        missingVars.forEach(varName => {
          const field = envSchema.shape[varName as keyof typeof envSchema.shape];
          console.error(`  - ${varName}: ${field._def.description || 'No description'}`);
        });
      }
      
      if (invalidVars.length > 0) {
        console.error('\nInvalid environment variables:');
        invalidVars.forEach(msg => console.error(`  - ${msg}`));
      }
      
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

// Export validated config
export const config = parseEnv();

// Feature availability checks
export const features = {
  hasOpenAI: () => typeof window === 'undefined' ? !!config.OPENAI_API_KEY : false,
  hasAnthropic: () => typeof window === 'undefined' ? !!config.ANTHROPIC_API_KEY : false,
  hasAnyAI: () => features.hasOpenAI() || features.hasAnthropic(),
  hasRedis: () => typeof window === 'undefined' ? !!config.REDIS_URL : false,
  isProduction: () => config.NODE_ENV === 'production',
  isDevelopment: () => config.NODE_ENV === 'development',
  
  // Feature flags
  aiAnalysisEnabled: () => config.ENABLE_AI_ANALYSIS && features.hasAnyAI(),
  embeddingsEnabled: () => config.ENABLE_EMBEDDINGS && features.hasOpenAI(),
  parallelProcessingEnabled: () => config.ENABLE_PARALLEL_PROCESSING,
};

// Configuration helpers
export const limits = {
  maxFileSize: config.MAX_FILE_SIZE,
  maxConcurrentUploads: config.MAX_CONCURRENT_UPLOADS,
  chunkSize: config.CHUNK_SIZE,
  
  // Human-readable versions
  maxFileSizeMB: Math.round(config.MAX_FILE_SIZE / 1024 / 1024),
};

export const timeouts = {
  ai: config.AI_TIMEOUT_MS,
  pdfExtraction: config.PDF_EXTRACTION_TIMEOUT_MS,
};

// Validate minimum requirements
export function validateMinimumRequirements() {
  const errors: string[] = [];
  
  if (!config.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }
  
  if (!features.hasAnyAI()) {
    console.warn('⚠️  No AI service configured. Document processing will use fallback methods.');
  }
  
  if (!features.hasRedis()) {
    console.warn('⚠️  Redis not configured. Using in-memory job queue (not recommended for production).');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

// Run validation on module load
if (typeof window === 'undefined') { // Only run on server
  try {
    validateMinimumRequirements();
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    if (features.isProduction()) {
      process.exit(1);
    }
  }
}