// Simple Master Database Setup Script
// Executes SQL files directly through Supabase client

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

class SimpleDatabaseSetup {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Essential files in order for basic functionality
    this.essentialFiles = [
      // Core setup
      '../database-setup/01-supabase-advanced-config-fixed.sql',
      '../database-setup/02-security-foundation.sql',
      
      // Basic tables
      '../database-setup/03-community-management-simple.sql',
      '../database-setup/04-advanced-user-management-simple.sql', 
      '../database-setup/05-document-storage-system-minimal.sql',
      
      // Document processing
      '../database-setup/task-6-step-1-document-chunks.sql',
      '../database-setup/task-6-step-2-chunking-algorithms.sql',
      
      // AI analysis
      '../database-setup/task-7-step-1-document-themes.sql',
      '../database-setup/task-7-step-2-document-quotes.sql',
      '../database-setup/task-7-step-3-ai-model-tracking.sql',
      
      // Search capabilities
      '../database-setup/task-8-step-1-fulltext-search.sql',
      '../database-setup/task-8-step-2-faceted-search.sql',
      
      // Collections
      '../database-setup/task-9-step-1-research-collections.sql',
      '../database-setup/task-9-step-2-collection-functions.sql',
      
      // Performance
      '../database-setup/task-11-step-1-indexing-strategy.sql',
      '../database-setup/task-11-step-2-materialized-views.sql'
    ]

    this.results = {
      successful: [],
      failed: [],
      skipped: []
    }
  }

  async testConnection() {
    console.log('🔍 Testing database connection...')
    try {
      // Try a simple query that should work with service role
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)

      if (error) {
        console.log('❌ Connection test failed:', error.message)
        return false
      }

      console.log('✅ Database connection successful')
      return true
    } catch (error) {
      console.log('❌ Connection error:', error.message)
      return false
    }
  }

  async executeSQL(sqlContent, filename) {
    try {
      // Clean up the SQL content
      const cleanSQL = sqlContent
        .replace(/--.*$/gm, '') // Remove comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

      if (!cleanSQL) {
        return { success: true, message: 'Empty SQL file' }
      }

      // Split into individual statements
      const statements = cleanSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      let successCount = 0
      let errorCount = 0
      const errors = []

      for (const statement of statements) {
        try {
          // Use raw SQL execution
          const { error } = await this.supabase.rpc('exec', {
            sql: statement
          })

          if (error) {
            // Check if it's an ignorable error
            if (this.isIgnorableError(error)) {
              console.log(`   ⚠️  Ignorable: ${error.message.substring(0, 100)}...`)
              successCount++
            } else {
              errors.push(error.message)
              errorCount++
            }
          } else {
            successCount++
          }
        } catch (execError) {
          if (this.isIgnorableError(execError)) {
            successCount++
          } else {
            errors.push(execError.message)
            errorCount++
          }
        }
      }

      const success = errorCount === 0 || successCount > errorCount
      return {
        success,
        message: `${successCount} statements succeeded, ${errorCount} failed`,
        errors: errors.slice(0, 3) // Limit error output
      }

    } catch (error) {
      return {
        success: false,
        message: error.message,
        errors: [error.message]
      }
    }
  }

  isIgnorableError(error) {
    const ignorablePatterns = [
      'already exists',
      'does not exist',
      'permission denied for schema',
      'relation .* already exists',
      'function .* already exists',
      'type .* already exists',
      'extension .* already exists',
      'role .* already exists'
    ]

    const errorMessage = error.message || error.toString()
    return ignorablePatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i')
      return regex.test(errorMessage)
    })
  }

  async executeFile(filename) {
    const filePath = path.resolve(__dirname, filename)
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found: ${filename}`)
      this.results.skipped.push({ filename, reason: 'File not found' })
      return false
    }

    console.log(`   🔄 Executing: ${filename}`)
    
    try {
      const sqlContent = fs.readFileSync(filePath, 'utf8')
      const result = await this.executeSQL(sqlContent, filename)

      if (result.success) {
        console.log(`   ✅ ${filename} - ${result.message}`)
        this.results.successful.push({ filename, message: result.message })
        return true
      } else {
        console.log(`   ❌ ${filename} - ${result.message}`)
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            console.log(`      Error: ${error.substring(0, 150)}...`)
          })
        }
        this.results.failed.push({ filename, message: result.message, errors: result.errors })
        return false
      }
    } catch (error) {
      console.log(`   ❌ ${filename} - Failed to read/execute: ${error.message}`)
      this.results.failed.push({ filename, message: error.message })
      return false
    }
  }

  async runSetup() {
    console.log('🚀 Barkly Research Platform - Simple Database Setup')
    console.log('=' .repeat(70))
    console.log('Setting up essential database components...\n')

    const startTime = Date.now()

    // Test connection first
    const connected = await this.testConnection()
    if (!connected) {
      console.log('❌ Cannot proceed without database connection')
      process.exit(1)
    }

    console.log(`\n📋 Executing ${this.essentialFiles.length} essential setup files...\n`)

    // Execute each file
    for (let i = 0; i < this.essentialFiles.length; i++) {
      const filename = this.essentialFiles[i]
      console.log(`[${i + 1}/${this.essentialFiles.length}] ${filename}`)
      
      await this.executeFile(filename)
      
      // Brief pause between files
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const duration = Date.now() - startTime
    this.generateReport(duration)
  }

  generateReport(duration) {
    console.log('\n' + '='.repeat(70))
    console.log('📊 SETUP COMPLETION REPORT')
    console.log('='.repeat(70))

    console.log(`\n📈 Results:`)
    console.log(`   ✅ Successful: ${this.results.successful.length}`)
    console.log(`   ❌ Failed: ${this.results.failed.length}`)
    console.log(`   ⏸️  Skipped: ${this.results.skipped.length}`)
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(1)} seconds`)

    if (this.results.failed.length > 0) {
      console.log(`\n❌ Failed Files:`)
      this.results.failed.forEach(result => {
        console.log(`   • ${result.filename}: ${result.message}`)
      })
    }

    if (this.results.skipped.length > 0) {
      console.log(`\n⏸️  Skipped Files:`)
      this.results.skipped.forEach(result => {
        console.log(`   • ${result.filename}: ${result.reason}`)
      })
    }

    // Assessment
    const successRate = this.results.successful.length / this.essentialFiles.length
    console.log(`\n🎯 Setup Assessment:`)
    
    if (successRate >= 0.8) {
      console.log('   ✅ Setup mostly successful!')
      console.log('   ✅ Core database components should be working')
      console.log('   ✅ Ready to run tests and validate functionality')
    } else if (successRate >= 0.5) {
      console.log('   ⚠️  Partial setup completed')
      console.log('   🔧 Some components may not work correctly')
      console.log('   📋 Review failed files and try manual execution')
    } else {
      console.log('   ❌ Setup had significant issues')
      console.log('   🔧 Manual intervention likely required')
      console.log('   📋 Check Supabase dashboard for more details')
    }

    console.log(`\n📋 Next Steps:`)
    console.log('   1. Check your Supabase dashboard for any error details')
    console.log('   2. Run the environment test: npm run test:simple')
    console.log('   3. If tests pass, run full test suite: npm test')
    console.log('   4. Address any remaining issues before production')

    console.log('\n' + '='.repeat(70))
    console.log('🏁 Database setup completed!')
    console.log('='.repeat(70))
  }
}

// Run if executed directly
if (require.main === module) {
  const setup = new SimpleDatabaseSetup()
  setup.runSetup().catch(error => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })
}

module.exports = SimpleDatabaseSetup