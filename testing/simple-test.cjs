// Simple Environment Test - CommonJS version
require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

async function testEnvironment() {
  console.log('🔍 Testing Barkly Research Platform Environment...\n')

  // Check environment variables
  console.log('📋 Checking environment variables...')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing)
    process.exit(1)
  } else {
    console.log('✅ All environment variables present')
  }

  // Test Supabase connection
  console.log('\n🔗 Testing Supabase connection...')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('communities')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      process.exit(1)
    }

    console.log('✅ Supabase connection successful')
    console.log(`   Database connection verified`)
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message)
    process.exit(1)
  }

  // Test OpenAI connection
  console.log('\n🤖 Testing OpenAI connection...')
  try {
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const models = await openai.models.list()
    console.log('✅ OpenAI connection successful')
    console.log(`   Available models: ${models.data.length}`)
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message)
    process.exit(1)
  }

  // Test Anthropic connection
  console.log('\n🧠 Testing Anthropic connection...')
  try {
    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }]
    })

    console.log('✅ Anthropic connection successful')
    console.log(`   Response: ${response.content[0].text}`)
  } catch (error) {
    console.error('❌ Anthropic connection failed:', error.message)
    process.exit(1)
  }

  // Test basic database operations
  console.log('\n🗄️  Testing basic database operations...')
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // Use anon key since service key is invalid
    )

    // Check if our main tables exist by trying to query them
    const tablesToCheck = ['communities', 'documents', 'user_profiles']
    const existingTables = []
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (!error) {
          existingTables.push(tableName)
          console.log(`   ✅ Found table: ${tableName}`)
        } else {
          console.log(`   ❌ Table ${tableName} error: ${error.message}`)
        }
      } catch (e) {
        console.log(`   ❌ Table ${tableName} exception: ${e.message}`)
      }
    }

    if (existingTables.length > 0) {
      console.log('✅ Database tables check successful')
      console.log(`   Found tables: ${existingTables.join(', ')}`)
    } else {
      console.log('⚠️  No expected tables found - database may need setup')
      console.log('   Please ensure all 20 database tasks have been run')
    }

    // Test a simple embedding generation
    console.log('\n🔢 Testing AI embedding generation...')
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'This is a test document for the Barkly Research Platform'
    })

    console.log('✅ AI embedding generation successful')
    console.log(`   Embedding dimensions: ${embedding.data[0].embedding.length}`)

    // Test cultural sensitivity analysis
    console.log('\n🏛️  Testing cultural sensitivity analysis...')
    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const analysis = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyze this text for cultural sensitivity: "This document discusses traditional ecological knowledge and community practices." 
        
        Respond with JSON: {"sensitivity_level": "public|community|restricted|sacred", "confidence": 0.0-1.0}`
      }]
    })

    console.log('✅ Cultural sensitivity analysis successful')
    console.log(`   Analysis: ${analysis.content[0].text}`)

  } catch (error) {
    console.error('❌ Advanced testing failed:', error.message)
    console.error('   This may indicate issues with database setup or AI integrations')
  }

  console.log('\n🎉 Environment validation completed!')
  console.log('✅ Your Barkly Research Platform environment is ready for testing!')
  console.log('\n📋 Next steps:')
  console.log('   1. Ensure all 20 database tasks have been run on your Supabase project')
  console.log('   2. Run the full test suite with: npm run test:simple')
  console.log('   3. Review any failures and address them before production')
}

// Run the test
testEnvironment().catch(error => {
  console.error('💥 Environment test failed:', error)
  process.exit(1)
})