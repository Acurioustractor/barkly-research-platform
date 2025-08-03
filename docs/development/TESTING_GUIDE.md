# Testing Guide - Barkley Research Platform

## Overview

This guide provides comprehensive testing instructions for the Barkley Youth Research Platform, covering document loader functionality, AI analysis systems, and deployment validation through Vercel.

## Test Suite Structure

```
src/__tests__/
├── integration/
│   ├── test-utils.ts           # Shared testing utilities
│   ├── document-upload.test.ts # Document upload pipeline tests
│   ├── ai-analysis.test.ts     # AI analysis system tests
│   └── vercel-deployment.test.ts # Production deployment tests
└── e2e/
    └── user-journey.test.ts    # End-to-end user workflows
```

## Quick Start

### Local Development Testing

```bash
# Run all tests against local development server
npm run test:all

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Run with Jest watch mode
npm run test:watch
```

### Vercel Production Testing

```bash
# Test against deployed Vercel site
VERCEL_URL=your-app.vercel.app npm run test:vercel

# Or set the environment variable
export VERCEL_URL=your-app.vercel.app
npm run test:all
```

## Test Categories

### 1. Document Upload Integration Tests

**File:** `src/__tests__/integration/document-upload.test.ts`

**What it tests:**
- PDF file upload functionality
- File size and type validation
- Bulk upload capabilities
- Server-Sent Events (SSE) progress streaming
- Document processing pipeline
- Text extraction and chunking
- Error handling and recovery
- Search and retrieval functionality

**Key test scenarios:**
```javascript
// Basic file upload
test('should upload a PDF file successfully')

// File validation
test('should handle file size validation')
test('should reject unsupported file types')

// Processing pipeline
test('should extract text from PDF correctly')
test('should create document chunks for analysis')

// Real-time features
test('should stream upload progress via SSE')

// Error handling
test('should handle corrupted PDF files gracefully')
test('should handle concurrent uploads')
```

### 2. AI Analysis System Tests

**File:** `src/__tests__/integration/ai-analysis.test.ts`

**What it tests:**
- Multi-provider AI configuration (OpenAI, Anthropic, Moonshot)
- Analysis types (quick, standard, deep, world-class)
- Provider failover mechanisms
- Cultural sensitivity compliance
- Rate limiting and error handling
- Performance and reliability

**Key test scenarios:**
```javascript
// Provider testing
test('should check AI provider availability')
test('should handle provider failover')

// Analysis types
test('should perform quick analysis')
test('should perform standard analysis with themes and quotes')
test('should perform deep analysis with entities')
test('should perform world-class analysis')

// Cultural compliance
test('should respect Indigenous cultural protocols')
test('should handle sensitive content appropriately')

// Performance
test('should complete analysis within timeout limits')
test('should handle concurrent analysis requests')
```

### 3. Vercel Deployment Tests

**File:** `src/__tests__/integration/vercel-deployment.test.ts`

**What it tests:**
- Serverless function timeouts and memory limits
- Environment variable configuration
- CORS headers and API accessibility
- Static asset optimization
- Regional deployment (iad1)
- Production error handling
- Database connection pooling

**Key test scenarios:**
```javascript
// Function configuration
test('should respect function timeout limits')
test('should handle AI function memory limits')

// Production environment
test('should have required environment variables configured')
test('should handle database connections correctly')

// Performance
test('should have acceptable latency for the region')
test('should complete requests within SLA')
```

### 4. End-to-End User Journey Tests

**File:** `src/__tests__/e2e/user-journey.test.ts`

**What it tests:**
- Complete researcher workflow
- Administrator platform management
- Data analyst advanced analytics
- Community member document discovery
- System resilience and error recovery

**Key workflows:**
```javascript
// Researcher journey
test('Complete workflow: Upload documents → Analyze → Extract insights')

// Administrator journey  
test('Admin workflow: Monitor system → Manage content → View analytics')

// Data analyst journey
test('Analyst workflow: Query data → Build visualizations → Export insights')

// Community member journey
test('Community workflow: Browse documents → Find content → Access insights')
```

## Test Configuration

### Environment Variables

Set these environment variables for comprehensive testing:

```bash
# Database connection
DATABASE_URL=your_database_url
POSTGRES_URL=your_postgres_url

# AI providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Testing configuration
API_BASE_URL=http://localhost:3000  # For local testing
VERCEL_URL=your-app.vercel.app      # For production testing
JEST_TIMEOUT=120000                 # Test timeout in milliseconds
MAX_WORKERS=2                       # Parallel test execution
```

### Test Utilities

The `test-utils.ts` file provides shared functionality:

```typescript
// File creation utilities
createMockPDFBuffer()
createMockTextFile(content)
createMockFile(filename, content, type)

// API request helpers
makeAPIRequest(endpoint, options)
uploadFile(file, endpoint, additionalFields)

// Validation utilities
validateDocumentResponse(response)
validateAIAnalysisResponse(response)
validateCulturalCompliance(content)

// Performance utilities
withTimeout(promise, timeoutMs)
retryOperation(operation, retries, delay)
```

## Running Tests

### Prerequisites

1. **Development server running:**
   ```bash
   npm run dev
   ```

2. **Database accessible:**
   - Local: Ensure PostgreSQL is running
   - Production: Verify Vercel database connection

3. **AI providers configured:**
   - At least one AI provider API key set
   - Providers available and responsive

### Test Execution

#### Local Development

```bash
# Full test suite with coverage
npm run test:all

# Individual test suites
npm run test:integration
npm run test:e2e

# With debugging output
DEBUG=1 npm run test:all

# Specific test file
npx jest src/__tests__/integration/document-upload.test.ts
```

#### Production/Vercel Testing

```bash
# Test against deployed Vercel application
export VERCEL_URL=barkly-research-platform.vercel.app
npm run test:vercel

# Test specific functionality
VERCEL_URL=your-app.vercel.app npm run test:integration
```

#### CI/CD Pipeline

```bash
# CI-optimized test run
npm run test:ci

# Integration tests only (faster for CI)
npm run test:integration
```

## Test Results and Reports

### Coverage Reports

- **HTML Report:** `coverage/lcov-report/index.html`
- **JSON Report:** `coverage/coverage-final.json`
- **Integration Coverage:** `coverage/integration/`

### Test Output

```bash
# Example successful test output
=============================================================
  Barkley Research Platform - Integration Test Suite
=============================================================

Environment Check
────────────────────────────────────────
Node.js version: v18.17.0
API Base URL: http://localhost:3000
Test Timeout: 120000ms
Max Workers: 2
🏠 Testing against local development server

Running Integration Tests
────────────────────────────────────────
 PASS  src/__tests__/integration/document-upload.test.ts
 PASS  src/__tests__/integration/ai-analysis.test.ts
 PASS  src/__tests__/integration/vercel-deployment.test.ts

Running End-to-End Tests
────────────────────────────────────────
 PASS  src/__tests__/e2e/user-journey.test.ts

=============================================================
  Test Suite Summary
=============================================================
🎉 All tests passed successfully!
✅ Document loader and AI system are working correctly
🚀 Platform is ready for production use
```

## Troubleshooting

### Common Issues

#### 1. Test Timeouts
```bash
# Increase timeout for slow operations
JEST_TIMEOUT=300000 npm run test:all
```

#### 2. Database Connection Errors
```bash
# Check database status
npm run test -- --testNamePattern="database"

# Reset database connection
npm run db:push
```

#### 3. AI Provider Issues
```bash
# Test individual providers
npm run test -- --testNamePattern="AI provider"

# Check API keys
npm run test -- --testNamePattern="configuration"
```

#### 4. Vercel Deployment Issues
```bash
# Test local vs production
npm run test:integration  # Local
VERCEL_URL=your-app.vercel.app npm run test:integration  # Production
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=1 VERBOSE=1 npm run test:all
```

### Selective Testing

Run specific test patterns:

```bash
# Test only document upload functionality
npx jest --testNamePattern="upload"

# Test only AI analysis
npx jest --testNamePattern="AI"

# Test only error handling
npx jest --testNamePattern="error"
```

## Cultural Compliance Testing

The test suite includes specific validation for Indigenous research compliance:

- **CARE+ Principles:** Collective benefit, Authority to control, Responsibility, Ethics
- **Cultural Sensitivity:** Appropriate handling of cultural content
- **Data Sovereignty:** Respect for Indigenous data governance

Cultural compliance tests ensure:
- Sensitive cultural content is handled appropriately
- Proper context and respect indicators are present
- Traditional knowledge is protected and respected

## Continuous Integration

### GitHub Actions Example

```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Vercel Integration

Add to `vercel.json`:

```json
{
  "build": {
    "env": {
      "RUN_TESTS": "true"
    }
  },
  "functions": {
    "src/app/api/test/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Performance Benchmarks

Expected performance metrics:

- **Document Upload:** < 30 seconds for 10MB PDF
- **AI Analysis (Quick):** < 60 seconds
- **AI Analysis (World-class):** < 300 seconds
- **API Response Time:** < 5 seconds
- **Database Queries:** < 2 seconds

## Security Testing

Security considerations in tests:

- **Input Validation:** Malformed requests and data
- **File Upload Security:** Malicious file handling
- **API Authentication:** Protected endpoint access
- **Data Sanitization:** XSS and injection prevention

## Next Steps

After successful testing:

1. **Monitor in Production:** Set up alerts for test failures
2. **Expand Coverage:** Add more edge cases and scenarios
3. **Performance Testing:** Load testing for high-volume usage
4. **User Acceptance:** Community feedback and validation

For questions or issues with testing, refer to the development team or create an issue in the project repository.