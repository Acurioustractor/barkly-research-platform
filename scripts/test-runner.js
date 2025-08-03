#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test runner configuration
const config = {
  testTypes: {
    unit: {
      pattern: 'tests/unit/**/*.test.{js,ts,tsx}',
      timeout: 10000,
      coverage: true
    },
    integration: {
      pattern: 'tests/integration/**/*.test.{js,ts,tsx}',
      timeout: 30000,
      coverage: true
    },
    e2e: {
      pattern: 'tests/e2e/**/*.test.{js,ts,tsx}',
      timeout: 60000,
      coverage: false
    },
    performance: {
      pattern: 'tests/performance/**/*.test.{js,ts,tsx}',
      timeout: 300000,
      coverage: false
    }
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const watchMode = args.includes('--watch');
const coverageMode = args.includes('--coverage');
const verboseMode = args.includes('--verbose');

// Helper functions
function runCommand(command, options = {}) {
  try {
    console.log(`🚀 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

function createTestReport(testType, results) {
  const reportDir = path.join(process.cwd(), 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `${testType}-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📊 Test report saved: ${reportPath}`);
}

function runTestSuite(type) {
  const testConfig = config.testTypes[type];
  if (!testConfig) {
    console.error(`❌ Unknown test type: ${type}`);
    process.exit(1);
  }

  console.log(`\n🧪 Running ${type} tests...`);
  
  let jestCommand = 'npx jest';
  
  // Add test pattern
  jestCommand += ` --testPathPattern="${testConfig.pattern}"`;
  
  // Add timeout
  jestCommand += ` --testTimeout=${testConfig.timeout}`;
  
  // Add coverage if enabled
  if (testConfig.coverage && (coverageMode || type !== 'e2e')) {
    jestCommand += ' --coverage';
    jestCommand += ` --coverageDirectory=coverage/${type}`;
  }
  
  // Add watch mode
  if (watchMode) {
    jestCommand += ' --watch';
  }
  
  // Add verbose mode
  if (verboseMode) {
    jestCommand += ' --verbose';
  }
  
  // Add project-specific configuration
  jestCommand += ` --selectProjects=${type}`;
  
  // Add environment variables
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    TEST_TYPE: type
  };
  
  runCommand(jestCommand, { env });
}

function runAllTests() {
  console.log('🎯 Running all test suites...');
  
  const testOrder = ['unit', 'integration', 'e2e'];
  
  for (const testType of testOrder) {
    try {
      runTestSuite(testType);
      console.log(`✅ ${testType} tests completed successfully`);
    } catch (error) {
      console.error(`❌ ${testType} tests failed`);
      if (!args.includes('--continue-on-error')) {
        process.exit(1);
      }
    }
  }
  
  // Run performance tests separately (optional)
  if (args.includes('--include-performance')) {
    try {
      runTestSuite('performance');
      console.log('✅ Performance tests completed successfully');
    } catch (error) {
      console.error('❌ Performance tests failed');
    }
  }
}

function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  // Check for required environment files
  const requiredFiles = ['.env.test'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Required file missing: ${file}`);
      process.exit(1);
    }
  }
  
  // Create necessary directories
  const dirs = ['test-reports', 'coverage', 'tests/logs'];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  console.log('✅ Test environment ready');
}

function showHelp() {
  console.log(`
🧪 Test Runner Help

Usage: npm run test [type] [options]

Test Types:
  unit         Run unit tests only
  integration  Run integration tests only
  e2e          Run end-to-end tests only
  performance  Run performance tests only
  all          Run all tests (default)

Options:
  --watch                Watch for file changes
  --coverage             Generate coverage report
  --verbose              Verbose output
  --continue-on-error    Continue running tests even if some fail
  --include-performance  Include performance tests in 'all' run

Examples:
  npm run test unit
  npm run test integration --coverage
  npm run test e2e --verbose
  npm run test all --include-performance
  npm run test unit --watch
  `);
}

// Main execution
function main() {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  setupTestEnvironment();
  
  switch (testType) {
    case 'all':
      runAllTests();
      break;
    case 'unit':
    case 'integration':
    case 'e2e':
    case 'performance':
      runTestSuite(testType);
      break;
    default:
      console.error(`❌ Unknown test type: ${testType}`);
      showHelp();
      process.exit(1);
  }
  
  console.log('\n🎉 Test execution completed!');
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Test execution interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test execution terminated');
  process.exit(0);
});

// Run the main function
main();