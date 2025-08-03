// Jest Setup Configuration
// Global test setup and configuration

import pkg from '@jest/globals'
const { jest } = pkg

// Extend Jest timeout for AI operations
jest.setTimeout(60000)

// Global test configuration
global.testConfig = {
  // Test data prefixes to identify test records
  TEST_PREFIX: 'TEST_',
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    DATABASE_QUERY: 1000, // 1 second
    AI_EMBEDDING: 10000,   // 10 seconds
    AI_ANALYSIS: 30000,    // 30 seconds
    VECTOR_SEARCH: 2000,   // 2 seconds
    API_RESPONSE: 500      // 500ms
  },
  
  // Cultural protocol test settings
  CULTURAL_PROTOCOLS: {
    REQUIRE_COMMUNITY_APPROVAL: true,
    REQUIRE_ELDER_CONSULTATION: true,
    ENFORCE_ATTRIBUTION: true,
    TRACK_USAGE: true
  },
  
  // AI service settings
  AI_SERVICES: {
    OPENAI_MODEL: 'text-embedding-3-small',
    ANTHROPIC_MODEL: 'claude-3-sonnet-20240229',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  }
}

// Global test utilities
global.testUtils = {
  // Wait for a specified time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate unique test identifiers
  generateTestId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Clean test string for database insertion
  cleanTestString: (str) => str.replace(/[^\w\s-]/g, '').trim(),
  
  // Validate email format
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  // Check if object has required properties
  hasRequiredProperties: (obj, requiredProps) => {
    return requiredProps.every(prop => obj.hasOwnProperty(prop))
  },
  
  // Deep clone object
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
  
  // Generate mock embedding vector
  generateMockEmbedding: (dimensions = 1536) => {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1)
  },
  
  // Calculate cosine similarity between vectors
  cosineSimilarity: (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// Console formatting for better test output
const originalConsoleLog = console.log
const originalConsoleError = console.error

console.log = (...args) => {
  const timestamp = new Date().toISOString()
  originalConsoleLog(`[${timestamp}]`, ...args)
}

console.error = (...args) => {
  const timestamp = new Date().toISOString()
  originalConsoleError(`[${timestamp}] ERROR:`, ...args)
}

// Test environment validation
beforeAll(async () => {
  // Validate required environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ]

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  console.log('✅ Test environment validation passed')
})

// Global cleanup after all tests
afterAll(async () => {
  console.log('🧹 Running global test cleanup...')
  
  try {
    // Import cleanup function
    const { TestCleanup } = await import('./test-environment-setup.js')
    await TestCleanup.cleanupTestData()
    console.log('✅ Global test cleanup completed')
  } catch (error) {
    console.error('❌ Global test cleanup failed:', error)
  }
})

// Custom Jest matchers for cultural protocol testing
expect.extend({
  // Check if a document has proper cultural metadata
  toHaveCulturalMetadata(received) {
    const requiredFields = ['cultural_sensitivity', 'community_id']
    const hasRequired = requiredFields.every(field => received.hasOwnProperty(field))
    
    if (hasRequired) {
      return {
        message: () => `Expected document not to have cultural metadata`,
        pass: true
      }
    } else {
      return {
        message: () => `Expected document to have cultural metadata fields: ${requiredFields.join(', ')}`,
        pass: false
      }
    }
  },

  // Check if access control is properly enforced
  toEnforceAccessControl(received, expectedAccess) {
    const hasData = received.data && received.data.length > 0
    const hasError = received.error !== null
    
    if (expectedAccess && hasData && !hasError) {
      return {
        message: () => `Expected access to be granted`,
        pass: true
      }
    } else if (!expectedAccess && (!hasData || hasError)) {
      return {
        message: () => `Expected access to be denied`,
        pass: true
      }
    } else {
      return {
        message: () => `Access control not properly enforced. Expected: ${expectedAccess}, Got: ${hasData && !hasError}`,
        pass: false
      }
    }
  },

  // Check if AI response has valid cultural analysis
  toHaveValidCulturalAnalysis(received) {
    const requiredFields = ['sensitivity_level', 'cultural_indicators', 'requires_special_handling', 'confidence_score']
    const validSensitivityLevels = ['public', 'community', 'restricted', 'sacred']
    
    const hasRequiredFields = requiredFields.every(field => received.hasOwnProperty(field))
    const hasValidSensitivity = validSensitivityLevels.includes(received.sensitivity_level)
    const hasValidConfidence = typeof received.confidence_score === 'number' && 
                               received.confidence_score >= 0 && 
                               received.confidence_score <= 1
    
    if (hasRequiredFields && hasValidSensitivity && hasValidConfidence) {
      return {
        message: () => `Expected cultural analysis to be invalid`,
        pass: true
      }
    } else {
      return {
        message: () => `Expected valid cultural analysis with fields: ${requiredFields.join(', ')} and valid sensitivity level`,
        pass: false
      }
    }
  },

  // Check if performance is within acceptable thresholds
  toBeWithinPerformanceThreshold(received, operation) {
    const threshold = global.testConfig.PERFORMANCE_THRESHOLDS[operation]
    
    if (!threshold) {
      return {
        message: () => `Unknown performance operation: ${operation}`,
        pass: false
      }
    }
    
    if (received <= threshold) {
      return {
        message: () => `Expected ${received}ms to exceed ${threshold}ms threshold for ${operation}`,
        pass: true
      }
    } else {
      return {
        message: () => `Expected ${received}ms to be within ${threshold}ms threshold for ${operation}`,
        pass: false
      }
    }
  }
})

console.log('🧪 Jest setup completed - Ready for testing!')