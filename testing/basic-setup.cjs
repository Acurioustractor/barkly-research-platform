// Basic Database Setup - Execute core SQL setup
require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function runBasicSetup() {
  console.log('🚀 Barkly Research Platform - Basic Database Setup')
  console.log('=' .repeat(60))
  
  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('📋 This will set up the core database tables and functions')
  console.log('⚠️  If this fails, you can copy the SQL and run it manually in Supabase SQL Editor\n')

  try {
    // Read the basic setup SQL file
    const sqlPath = path.resolve(__dirname, '../database-setup/00-basic-setup.sql')
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Setup SQL file not found:', sqlPath)
      process.exit(1)
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log('✅ SQL file loaded successfully')
    console.log(`📄 File size: ${(sqlContent.length / 1024).toFixed(1)}KB\n`)

    console.log('🔄 Executing database setup...')
    console.log('   This may take 30-60 seconds...\n')

    // Split SQL into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    let successCount = 0
    let errorCount = 0
    const errors = []

    console.log(`📊 Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim()) {
        try {
          // For Supabase, we need to use the SQL editor approach
          // Since we can't execute arbitrary SQL directly, we'll show instructions
          
          if (i === 0) {
            console.log('\n⚠️  Direct SQL execution may not work with Supabase client.')
            console.log('📋 Please follow these steps instead:\n')
            console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
            console.log('2. Select your project')
            console.log('3. Go to SQL Editor')
            console.log('4. Copy and paste the following SQL:\n')
            console.log('─'.repeat(60))
            console.log(sqlContent)
            console.log('─'.repeat(60))
            console.log('\n5. Click "Run" to execute the setup')
            console.log('6. Come back here and run: npm run test:simple')
            
            return
          }
        } catch (error) {
          errors.push(`Statement ${i + 1}: ${error.message}`)
          errorCount++
        }
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    
    // Provide manual instructions
    console.log('\n📋 Manual Setup Instructions:')
    console.log('1. Open your Supabase Dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Copy the contents of: database-setup/00-basic-setup.sql')
    console.log('4. Paste and run in SQL Editor')
    console.log('5. Run: npm run test:simple to validate')
    
    process.exit(1)
  }
}

// Run setup
runBasicSetup().catch(error => {
  console.error('💥 Setup script failed:', error)
  process.exit(1)
})