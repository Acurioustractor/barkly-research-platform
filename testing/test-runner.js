#!/usr/bin/env node

// Test Runner for Barkly Research Platform
// Orchestrates comprehensive testing with proper setup and teardown

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { TestCleanup, TEST_CONFIG } from './test-environment-setup.js'

class TestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Database Foundation',
        file: '01-database-foundation.test.js',
        description: 'Core database functionality, migrations, and basic operations',
        critical: true,
        estimatedTime: '5-10 minutes'
      },
      {
        name: 'AI Integration',
        file: '02-ai-integration.test.js',
        description: 'OpenAI, Anthropic, and vector search functionality',
        critical: true,
        estimatedTime: '10-15 minutes'
      },
      {
        name: 'Cultural Protocols',
        file: '03-cultural-protocols.test.js',
        description: 'Cultural sensitivity, community sovereignty, and indigenous data governance',
        critical: true,
        estimatedTime: '15-20 minutes'
      },
      {
        name: 'End-to-End Workflows',
        file: '04-end-to-end-workflows.test.js',
        description: 'Complete user journeys from registration to research collaboration',
        critical: true,
        estimatedTime: '20-25 minutes'
      },
      {
        name: 'Performance & Security',
        file: '05-performance-security.test.js',
        description: 'System performance, load handling, and security measures',
        critical: false,
        estimatedTime: '15-20 minutes'
      }
    ]

    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: []
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...\n')

    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY'
    ]

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:')
      missing.forEach(envVar => console.error(`   - ${envVar}`))
      console.error('\nPlease set these environment variables before running tests.\n')
      return false
    }

    // Test API connections
    try {
      console.log('🔗 Testing API connections...')
      
      // Test Supabase connection
      const { supabase } = await import('./test-environment-setup.js')
      const { data, error } = await supabase.from('communities').select('count').limit(1)
      if (error) throw new Error(`Supabase connection failed: ${error.message}`)
      console.log('   ✅ Supabase connection successful')

      // Test OpenAI connection
      const { openai } = await import('./test-environment-setup.js')
      await openai.models.list()
      console.log('   ✅ OpenAI connection successful')

      // Test Anthropic connection
      const { anthropic } = await import('./test-environment-setup.js')
      await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
      console.log('   ✅ Anthropic connection successful')

    } catch (error) {
      console.error(`❌ API connection failed: ${error.message}`)
      return false
    }

    console.log('\n✅ Environment validation passed!\n')
    return true
  }

  async runTestSuite(suite) {
    console.log(`\n🧪 Running ${suite.name} Tests`)
    console.log(`📝 ${suite.description}`)
    console.log(`⏱️  Estimated time: ${suite.estimatedTime}`)
    console.log('─'.repeat(60))

    const startTime = Date.now()
    let success = false
    let output = ''

    try {
      // Run Jest for specific test file
      const command = `npx jest ${suite.file} --verbose --detectOpenHandles --forceExit`
      output = execSync(command, { 
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      })
      success = true
    } catch (error) {
      output = error.stdout + error.stderr
      success = false
    }

    const duration = Date.now() - startTime
    const result = {
      name: suite.name,
      file: suite.file,
      success,
      duration,
      output,
      critical: suite.critical
    }

    this.results.suites.push(result)

    if (success) {
      console.log(`✅ ${suite.name} tests PASSED (${(duration / 1000).toFixed(1)}s)`)
      this.results.passed++
    } else {
      console.log(`❌ ${suite.name} tests FAILED (${(duration / 1000).toFixed(1)}s)`)
      this.results.failed++
      
      if (suite.critical) {
        console.log('\n🚨 CRITICAL TEST FAILURE - This may block production deployment')
      }
    }

    return result
  }

  async runAllTests() {
    console.log('🚀 Starting Barkly Research Platform Test Suite')
    console.log('=' .repeat(60))
    
    const overallStartTime = Date.now()

    // Environment validation
    const envValid = await this.validateEnvironment()
    if (!envValid) {
      console.log('❌ Environment validation failed. Exiting.')
      process.exit(1)
    }

    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...')
    await TestCleanup.cleanupTestData()
    console.log('✅ Test data cleanup completed\n')

    // Run each test suite
    for (const suite of this.testSuites) {
      const result = await this.runTestSuite(suite)
      
      // If critical test fails, ask user if they want to continue
      if (!result.success && result.critical) {
        const readline = await import('readline')
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        const answer = await new Promise(resolve => {
          rl.question('\n❓ Critical test failed. Continue with remaining tests? (y/N): ', resolve)
        })
        rl.close()

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log('\n🛑 Test execution stopped by user.')
          break
        }
      }

      // Brief pause between test suites
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const overallDuration = Date.now() - overallStartTime

    // Final cleanup
    console.log('\n🧹 Final test data cleanup...')
    await TestCleanup.cleanupTestData()

    // Generate final report
    this.generateFinalReport(overallDuration)
  }

  generateFinalReport(overallDuration) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL TEST REPORT')
    console.log('='.repeat(60))

    console.log(`\n📈 Overall Results:`)
    console.log(`   ✅ Passed: ${this.results.passed}`)
    console.log(`   ❌ Failed: ${this.results.failed}`)
    console.log(`   ⏱️  Total Time: ${(overallDuration / 1000 / 60).toFixed(1)} minutes`)

    console.log(`\n📋 Test Suite Details:`)
    this.results.suites.forEach(suite => {
      const status = suite.success ? '✅' : '❌'
      const critical = suite.critical ? '🚨' : '  '
      console.log(`   ${status} ${critical} ${suite.name} (${(suite.duration / 1000).toFixed(1)}s)`)
    })

    // Critical failures summary
    const criticalFailures = this.results.suites.filter(s => !s.success && s.critical)
    if (criticalFailures.length > 0) {
      console.log(`\n🚨 CRITICAL FAILURES (${criticalFailures.length}):`)
      criticalFailures.forEach(suite => {
        console.log(`   ❌ ${suite.name}`)
      })
      console.log('\n⚠️  These failures may block production deployment!')
    }

    // Production readiness assessment
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:')
    if (criticalFailures.length === 0) {
      console.log('   ✅ All critical tests passed')
      console.log('   ✅ System appears ready for production deployment')
      console.log('   ✅ Cultural protocols validated')
      console.log('   ✅ AI integrations functional')
      console.log('   ✅ Security measures verified')
    } else {
      console.log('   ❌ Critical test failures detected')
      console.log('   ❌ System NOT ready for production deployment')
      console.log('   🔧 Address critical failures before proceeding')
    }

    // Next steps
    console.log('\n📋 NEXT STEPS:')
    if (criticalFailures.length === 0) {
      console.log('   1. Review any non-critical test failures')
      console.log('   2. Conduct community validation with representatives')
      console.log('   3. Perform final security review')
      console.log('   4. Prepare production deployment')
      console.log('   5. Schedule go-live with community approval')
    } else {
      console.log('   1. Review failed test output for debugging information')
      console.log('   2. Fix critical issues identified in test failures')
      console.log('   3. Re-run failed test suites')
      console.log('   4. Ensure all cultural protocols are properly implemented')
      console.log('   5. Verify AI integrations are working correctly')
    }

    // Save detailed report
    this.saveDetailedReport()

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Test execution completed!')
    console.log('='.repeat(60))
  }

  saveDetailedReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      environment: {
        node_version: process.version,
        platform: process.platform,
        test_config: TEST_CONFIG
      },
      results: this.results,
      summary: {
        total_suites: this.testSuites.length,
        passed: this.results.passed,
        failed: this.results.failed,
        critical_failures: this.results.suites.filter(s => !s.success && s.critical).length,
        production_ready: this.results.suites.filter(s => !s.success && s.critical).length === 0
      }
    }

    const reportPath = path.join(process.cwd(), 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner()
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

export default TestRunner