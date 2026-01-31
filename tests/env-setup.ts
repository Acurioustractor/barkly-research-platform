// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-anthropic-key';

// Test database configuration
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

// Test-specific configurations
process.env.SUPPRESS_LOGS = 'true';
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.ENABLE_TEST_MODE = 'true';
process.env.ENABLE_PARALLEL_PROCESSING = 'false';
process.env.ENABLE_EMBEDDINGS = 'false';

// Mock external service URLs
process.env.MOCK_AI_SERVICES = 'true';
process.env.MOCK_EMAIL_SERVICE = 'true';
process.env.MOCK_FILE_STORAGE = 'true';

// Performance test configurations
process.env.PERFORMANCE_TEST_TIMEOUT = '300000';
process.env.LOAD_TEST_CONCURRENT_USERS = '50';
process.env.STRESS_TEST_DURATION = '60000';

// Security test configurations
process.env.SECURITY_TEST_MODE = 'true';
process.env.BYPASS_RATE_LIMITS = 'true';

// Cultural safety test configurations
process.env.MOCK_ELDER_REVIEWS = 'true';
process.env.CULTURAL_TEST_MODE = 'true';

// Accessibility test configurations
process.env.ACCESSIBILITY_TEST_MODE = 'true';
process.env.SCREEN_READER_TEST = 'true';

// Mobile test configurations
process.env.MOBILE_TEST_MODE = 'true';
process.env.PWA_TEST_MODE = 'true';

console.log('Test environment configured with the following settings:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('- Test mode enabled:', process.env.ENABLE_TEST_MODE);
console.log('- Mock services enabled:', process.env.MOCK_AI_SERVICES);