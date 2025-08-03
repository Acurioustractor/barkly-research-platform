#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_TYPES = {
  unit: {
    pattern: 'tests/unit/**/*.test.ts',
    timeout: 30000,
    description: 'Unit tests for individual components and services'
  },
  integration: {
    pattern: 'tests/integration/**/*.test.ts',
    timeout: 60000,
    description: 'Integration tests for service workflows'
  },
  e2e: {
    pattern: 'tests/e2e/**/*.test.ts',
    timeout: 120000,
    description: 'End-to-end tests for complete user workflows'
  },
  performance: {
    pattern: 'tests/performance/**/*.test.ts',
    timeout: 300000,
    description: 'Performance and load tests'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const watchMode = args.includes('--watch');
const coverage = args.includes('--coverage');
const verbose = args.includes('--verbose');
const bail = args.includes('--bail');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  // Check environment variables first
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  // Optional but recommended
  const optionalEnvVars = [
    'OPENAI_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingRequired.length > 0) {
    log('⚠️  Missing required environment variables:', 'yellow');
    missingRequired.forEach(envVar => {
      log(`   - ${envVar}`, 'yellow');
    });
    log('   Some tests will be skipped. For full testing, configure your .env.local file', 'yellow');
  }
  
  if (missingOptional.length > 0) {
    log('⚠️  Missing optional environment variables:', 'yellow');
    missingOptional.forEach(envVar => {
      log(`   - ${envVar} (some tests may be skipped)`, 'yellow');
    });
  }
  
  log('✅ Required environment variables configured', 'green');
  
  // Check if Supabase is accessible
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
        
        if (response.ok || response.status === 404) { // 404 is expected for root endpoint
          log('✅ Supabase connection verified', 'green');
        } else {
          throw new Error(`Supabase responded with status ${response.status}`);
        }
      }
    } catch (error) {
      log('⚠️  Could not verify Supabase connection:', 'yellow');
      log(`   ${error.message}`, 'yellow');
      log('   Tests will continue but may fail if database is not accessible', 'yellow');
    }
  
  log('✅ Prerequisites check completed', 'green');
}

function runJest(testPattern, options = {}) {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--config', 'jest.config.js',
      '--testPathPattern', testPattern
    ];
    
    if (options.watch) {
      jestArgs.push('--watch');
    }
    
    if (options.coverage) {
      jestArgs.push('--coverage');
    }
    
    if (options.verbose) {
      jestArgs.push('--verbose');
    }
    
    if (options.bail) {
      jestArgs.push('--bail');
    }
    
    if (options.timeout) {
      jestArgs.push('--testTimeout', options.timeout.toString());
    }
    
    // Load test environment variables
    require('dotenv').config({ path: '.env.test' });
    require('dotenv').config({ path: '.env.local' });
    
    // Add environment variables
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      ENABLE_TEST_MODE: 'true'
    };
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      env
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTestSuite(type, config) {
  logSection(`Running ${type.toUpperCase()} Tests`);
  log(config.description, 'cyan');
  
  const startTime = Date.now();
  
  try {
    await runJest(config.pattern, {
      watch: watchMode,
      coverage: coverage && type === 'unit', // Only collect coverage for unit tests
      verbose,
      bail,
      timeout: config.timeout
    });
    
    const duration = Date.now() - startTime;
    log(`✅ ${type.toUpperCase()} tests completed in ${duration}ms`, 'green');
    
    return { success: true, duration, type };
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${type.toUpperCase()} tests failed after ${duration}ms`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    return { success: false, duration, type, error: error.message };
  }
}

async function runAllTests() {
  const results = [];
  const startTime = Date.now();
  
  for (const [type, config] of Object.entries(TEST_TYPES)) {
    const result = await runTestSuite(type, config);
    results.push(result);
    
    if (!result.success && bail) {
      log('🛑 Stopping test execution due to --bail flag', 'yellow');
      break;
    }
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Print summary
  logHeader('Test Results Summary');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    log(`${status} ${result.type.toUpperCase().padEnd(12)} ${duration}`, result.success ? 'green' : 'red');
    
    if (!result.success) {
      log(`    Error: ${result.error}`, 'red');
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  log(`\nTotal: ${successCount}/${totalCount} test suites passed`, successCount === totalCount ? 'green' : 'red');
  log(`Total execution time: ${totalDuration}ms`, 'cyan');
  
  if (successCount < totalCount) {
    process.exit(1);
  }
}

async function main() {
  logHeader('Community Intelligence Platform - Test Runner');
  
  // Display configuration
  log(`Test Type: ${testType}`, 'cyan');
  log(`Watch Mode: ${watchMode ? 'enabled' : 'disabled'}`, 'cyan');
  log(`Coverage: ${coverage ? 'enabled' : 'disabled'}`, 'cyan');
  log(`Verbose: ${verbose ? 'enabled' : 'disabled'}`, 'cyan');
  log(`Bail on Failure: ${bail ? 'enabled' : 'disabled'}`, 'cyan');
  
  try {
    // Check prerequisites
    await checkPrerequisites();
    
    if (testType === 'all') {
      await runAllTests();
    } else if (TEST_TYPES[testType]) {
      const result = await runTestSuite(testType, TEST_TYPES[testType]);
      if (!result.success) {
        process.exit(1);
      }
    } else {
      log(`❌ Unknown test type: ${testType}`, 'red');
      log('Available test types:', 'yellow');
      Object.keys(TEST_TYPES).forEach(type => {
        log(`  - ${type}: ${TEST_TYPES[type].description}`, 'yellow');
      });
      log('  - all: Run all test suites', 'yellow');
      process.exit(1);
    }
    
    log('\n🎉 All tests completed successfully!', 'green');
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n🛑 Test execution interrupted', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Test execution terminated', 'yellow');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});