#!/usr/bin/env node

/**
 * Integration test runner for Barkley Research Platform
 * Runs comprehensive tests against local development or Vercel deployment
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const TEST_CONFIG = {
  // Test environment
  NODE_ENV: process.env.NODE_ENV || 'test',
  
  // API endpoint (defaults to localhost, can be overridden for Vercel testing)
  API_BASE_URL: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.API_BASE_URL || 'http://localhost:3000',
  
  // Test timeouts
  JEST_TIMEOUT: process.env.JEST_TIMEOUT || '120000',
  
  // Parallel test execution
  MAX_WORKERS: process.env.MAX_WORKERS || '2',
  
  // Test patterns
  INTEGRATION_PATTERN: 'src/__tests__/integration/*.test.ts',
  E2E_PATTERN: 'src/__tests__/e2e/*.test.ts',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'─'.repeat(40)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'─'.repeat(40)}`, 'blue');
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, 'yellow');
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env },
      ...options,
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkEnvironment() {
  logSection('Environment Check');
  
  log(`Node.js version: ${process.version}`, 'green');
  log(`API Base URL: ${TEST_CONFIG.API_BASE_URL}`, 'green');
  log(`Test Timeout: ${TEST_CONFIG.JEST_TIMEOUT}ms`, 'green');
  log(`Max Workers: ${TEST_CONFIG.MAX_WORKERS}`, 'green');
  
  // Check if we're testing against Vercel
  if (TEST_CONFIG.API_BASE_URL.includes('vercel.app')) {
    log('🚀 Testing against Vercel production deployment', 'magenta');
  } else if (TEST_CONFIG.API_BASE_URL.includes('localhost')) {
    log('🏠 Testing against local development server', 'magenta');
  } else {
    log('🌐 Testing against custom endpoint', 'magenta');
  }
}

async function runTestSuite(pattern, suiteName) {
  logSection(`Running ${suiteName}`);
  
  const jestArgs = [
    '--testMatch', `**/${pattern}`,
    '--testTimeout', TEST_CONFIG.JEST_TIMEOUT,
    '--maxWorkers', TEST_CONFIG.MAX_WORKERS,
    '--verbose',
    '--detectOpenHandles',
    '--forceExit',
  ];
  
  // Add coverage for integration tests
  if (pattern.includes('integration')) {
    jestArgs.push('--coverage', '--coverageDirectory', 'coverage/integration');
  }
  
  const env = {
    NODE_ENV: TEST_CONFIG.NODE_ENV,
    API_BASE_URL: TEST_CONFIG.API_BASE_URL,
  };
  
  try {
    await runCommand('npx', ['jest', ...jestArgs], { env });
    log(`✅ ${suiteName} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${suiteName} failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateTestReport() {
  logSection('Generating Test Report');
  
  try {
    // Generate HTML coverage report if coverage exists
    const fs = require('fs');
    const coverageDir = path.join(process.cwd(), 'coverage');
    
    if (fs.existsSync(coverageDir)) {
      log('📊 Coverage report generated in coverage/ directory', 'green');
    }
    
    // Create test summary
    const testSummary = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        apiBaseUrl: TEST_CONFIG.API_BASE_URL,
        testTimeout: TEST_CONFIG.JEST_TIMEOUT,
      },
      results: 'See Jest output above',
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'test-results.json'),
      JSON.stringify(testSummary, null, 2)
    );
    
    log('📝 Test summary written to test-results.json', 'green');
  } catch (error) {
    log(`⚠️ Failed to generate test report: ${error.message}`, 'yellow');
  }
}

async function main() {
  logHeader('Barkley Research Platform - Integration Test Suite');
  
  try {
    // Environment check
    await checkEnvironment();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const runIntegration = args.includes('--integration') || args.length === 0;
    const runE2E = args.includes('--e2e') || args.length === 0;
    const runAll = args.includes('--all') || args.length === 0;
    
    let allPassed = true;
    
    // Run integration tests
    if (runIntegration || runAll) {
      const success = await runTestSuite(TEST_CONFIG.INTEGRATION_PATTERN, 'Integration Tests');
      allPassed = allPassed && success;
    }
    
    // Run E2E tests
    if (runE2E || runAll) {
      const success = await runTestSuite(TEST_CONFIG.E2E_PATTERN, 'End-to-End Tests');
      allPassed = allPassed && success;
    }
    
    // Generate report
    await generateTestReport();
    
    // Final summary
    logHeader('Test Suite Summary');
    
    if (allPassed) {
      log('🎉 All tests passed successfully!', 'green');
      log('✅ Document loader and AI system are working correctly', 'green');
      log('🚀 Platform is ready for production use', 'green');
      process.exit(0);
    } else {
      log('❌ Some tests failed', 'red');
      log('🔧 Please review the test output and fix issues before deployment', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\n⚠️ Test suite interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n⚠️ Test suite terminated', 'yellow');
  process.exit(1);
});

// Run the test suite
if (require.main === module) {
  main().catch((error) => {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  TEST_CONFIG,
  runTestSuite,
  checkEnvironment,
};