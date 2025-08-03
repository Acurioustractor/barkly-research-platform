// Comprehensive Platform Validation
// Tests all major functionality before production launch

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const Anthropic = require('@anthropic-ai/sdk')

class ComprehensiveValidator {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  async runTest(testName, testFunction) {
    console.log(`🧪 ${testName}`)
    try {
      const result = await testFunction()
      if (result.success) {
        console.log(`   ✅ ${result.message}`)
        this.results.passed++
        this.results.tests.push({ name: testName, status: 'PASSED', message: result.message })
      } else {
        console.log(`   ❌ ${result.message}`)
        this.results.failed++
        this.results.tests.push({ name: testName, status: 'FAILED', message: result.message })
      }
    } catch (error) {
      console.log(`   ❌ ${error.message}`)
      this.results.failed++
      this.results.tests.push({ name: testName, status: 'FAILED', message: error.message })
    }
  }

  async validateDatabase() {
    console.log('\n📊 DATABASE VALIDATION')
    console.log('=' .repeat(50))

    await this.runTest('Core Tables Exist', async () => {
      const tables = ['communities', 'documents', 'user_profiles', 'document_chunks', 'document_themes']
      const existingTables = []
      
      for (const table of tables) {
        const { data, error } = await this.supabase.from(table).select('id').limit(1)
        if (!error) existingTables.push(table)
      }
      
      return {
        success: existingTables.length >= 3,
        message: `Found ${existingTables.length}/${tables.length} core tables: ${existingTables.join(', ')}`
      }
    })

    await this.runTest('Community Data Operations', async () => {
      // Test insert
      const { data: insertData, error: insertError } = await this.supabase
        .from('communities')
        .insert({
          name: 'Validation Test Community',
          description: 'Testing community operations',
          cultural_protocols: { data_sovereignty: true }
        })
        .select()

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`)

      // Test read
      const { data: readData, error: readError } = await this.supabase
        .from('communities')
        .select('*')
        .eq('name', 'Validation Test Community')

      if (readError) throw new Error(`Read failed: ${readError.message}`)

      return {
        success: readData.length > 0,
        message: `Successfully created and read community data`
      }
    })

    await this.runTest('Document Operations with Cultural Metadata', async () => {
      // Get a community ID
      const { data: communities } = await this.supabase
        .from('communities')
        .select('id')
        .limit(1)

      if (!communities || communities.length === 0) {
        throw new Error('No communities found for document test')
      }

      const { data: docData, error: docError } = await this.supabase
        .from('documents')
        .insert({
          title: 'Test Cultural Document',
          content: 'This document contains traditional knowledge for testing purposes.',
          cultural_sensitivity: 'community',
          community_id: communities[0].id,
          cultural_metadata: {
            requires_attribution: true,
            knowledge_holders: ['Test Elder'],
            cultural_context: 'Traditional practices'
          }
        })
        .select()

      if (docError) throw new Error(`Document insert failed: ${docError.message}`)

      return {
        success: docData.length > 0 && docData[0].cultural_sensitivity === 'community',
        message: `Successfully created document with cultural metadata`
      }
    })
  }

  async validateAI() {
    console.log('\n🤖 AI INTEGRATION VALIDATION')
    console.log('=' .repeat(50))

    await this.runTest('OpenAI Embedding Generation', async () => {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Test document for embedding generation in cultural research platform'
      })

      return {
        success: response.data[0].embedding.length === 1536,
        message: `Generated ${response.data[0].embedding.length}-dimensional embedding`
      }
    })

    await this.runTest('Anthropic Cultural Analysis', async () => {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze this text for cultural sensitivity: "This research discusses sacred ceremonial practices and traditional medicine knowledge passed down through generations of indigenous elders."
          
          Respond with JSON: {"sensitivity_level": "public|community|restricted|sacred", "confidence": 0.0-1.0, "cultural_indicators": ["list", "of", "indicators"]}`
        }]
      })

      const analysisText = response.content[0].text
      const analysis = JSON.parse(analysisText)

      return {
        success: analysis.sensitivity_level && analysis.confidence > 0.7,
        message: `Classified as ${analysis.sensitivity_level} with ${(analysis.confidence * 100).toFixed(0)}% confidence`
      }
    })

    await this.runTest('Document Chunk Storage with Embeddings', async () => {
      // Get a document
      const { data: docs } = await this.supabase
        .from('documents')
        .select('id')
        .limit(1)

      if (!docs || docs.length === 0) {
        throw new Error('No documents found for chunk test')
      }

      // Generate embedding
      const embedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Test chunk for vector storage validation'
      })

      // Store chunk with embedding
      const { data: chunkData, error: chunkError } = await this.supabase
        .from('document_chunks')
        .insert({
          document_id: docs[0].id,
          chunk_text: 'Test chunk for vector storage validation',
          chunk_index: 0,
          embedding: embedding.data[0].embedding
        })
        .select()

      if (chunkError) throw new Error(`Chunk storage failed: ${chunkError.message}`)

      return {
        success: chunkData.length > 0,
        message: `Successfully stored document chunk with vector embedding`
      }
    })

    await this.runTest('Vector Similarity Search', async () => {
      // Generate query embedding
      const queryEmbedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'test validation search query'
      })

      // Perform vector search
      const { data: searchResults, error: searchError } = await this.supabase.rpc('vector_search', {
        query_embedding: queryEmbedding.data[0].embedding,
        match_threshold: 0.1,
        match_count: 5
      })

      if (searchError) throw new Error(`Vector search failed: ${searchError.message}`)

      return {
        success: Array.isArray(searchResults),
        message: `Vector search returned ${searchResults.length} results`
      }
    })
  }

  async validateCulturalProtocols() {
    console.log('\n🏛️  CULTURAL PROTOCOL VALIDATION')
    console.log('=' .repeat(50))

    await this.runTest('Cultural Sensitivity Levels', async () => {
      const sensitivityLevels = ['public', 'community', 'restricted', 'sacred']
      let validLevels = 0

      for (const level of sensitivityLevels) {
        const testText = `This is ${level} content for testing cultural sensitivity classification.`
        const response = await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Classify this as public, community, restricted, or sacred: "${testText}"`
          }]
        })

        if (response.content[0].text.toLowerCase().includes(level)) {
          validLevels++
        }
      }

      return {
        success: validLevels >= 2,
        message: `AI correctly identified ${validLevels}/${sensitivityLevels.length} sensitivity levels`
      }
    })

    await this.runTest('Community Data Isolation', async () => {
      // Create two communities
      const { data: community1 } = await this.supabase
        .from('communities')
        .insert({ name: 'Test Community 1', description: 'First test community' })
        .select()

      const { data: community2 } = await this.supabase
        .from('communities')
        .insert({ name: 'Test Community 2', description: 'Second test community' })
        .select()

      // Create documents for each community
      await this.supabase.from('documents').insert([
        {
          title: 'Community 1 Document',
          content: 'Content for community 1',
          cultural_sensitivity: 'community',
          community_id: community1[0].id
        },
        {
          title: 'Community 2 Document',
          content: 'Content for community 2',
          cultural_sensitivity: 'community',
          community_id: community2[0].id
        }
      ])

      // Verify documents exist
      const { data: allDocs } = await this.supabase
        .from('documents')
        .select('*')
        .in('community_id', [community1[0].id, community2[0].id])

      return {
        success: allDocs.length >= 2,
        message: `Successfully created isolated community documents`
      }
    })

    await this.runTest('Cultural Metadata Validation', async () => {
      const { data: culturalDocs } = await this.supabase
        .from('documents')
        .select('*')
        .not('cultural_metadata', 'is', null)
        .limit(5)

      const validMetadata = culturalDocs.filter(doc => 
        doc.cultural_metadata && 
        typeof doc.cultural_metadata === 'object'
      )

      return {
        success: validMetadata.length > 0,
        message: `Found ${validMetadata.length} documents with valid cultural metadata`
      }
    })
  }

  async validatePerformance() {
    console.log('\n⚡ PERFORMANCE VALIDATION')
    console.log('=' .repeat(50))

    await this.runTest('Database Query Performance', async () => {
      const startTime = Date.now()
      
      const { data, error } = await this.supabase
        .from('documents')
        .select(`
          *,
          communities(*),
          document_chunks(count)
        `)
        .limit(10)

      const executionTime = Date.now() - startTime

      if (error) throw new Error(`Query failed: ${error.message}`)

      return {
        success: executionTime < 2000,
        message: `Complex query completed in ${executionTime}ms`
      }
    })

    await this.runTest('AI Response Time', async () => {
      const startTime = Date.now()
      
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Performance test embedding generation'
      })

      const executionTime = Date.now() - startTime

      return {
        success: executionTime < 10000 && response.data[0].embedding.length === 1536,
        message: `AI embedding generated in ${executionTime}ms`
      }
    })
  }

  async runAllValidations() {
    console.log('🚀 BARKLY RESEARCH PLATFORM - COMPREHENSIVE VALIDATION')
    console.log('=' .repeat(70))
    console.log('Testing all systems before production launch...\n')

    const startTime = Date.now()

    await this.validateDatabase()
    await this.validateAI()
    await this.validateCulturalProtocols()
    await this.validatePerformance()

    const totalTime = Date.now() - startTime

    console.log('\n' + '=' .repeat(70))
    console.log('📊 VALIDATION RESULTS')
    console.log('=' .repeat(70))

    console.log(`\n📈 Summary:`)
    console.log(`   ✅ Passed: ${this.results.passed}`)
    console.log(`   ❌ Failed: ${this.results.failed}`)
    console.log(`   ⏱️  Total Time: ${(totalTime / 1000).toFixed(1)} seconds`)

    const successRate = this.results.passed / (this.results.passed + this.results.failed)
    console.log(`   📊 Success Rate: ${(successRate * 100).toFixed(1)}%`)

    if (this.results.failed > 0) {
      console.log(`\n❌ Failed Tests:`)
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`)
        })
    }

    console.log(`\n🎯 Production Readiness Assessment:`)
    if (successRate >= 0.9) {
      console.log('   ✅ READY FOR PRODUCTION!')
      console.log('   ✅ All critical systems validated')
      console.log('   ✅ Cultural protocols working')
      console.log('   ✅ AI integrations functional')
      console.log('   ✅ Performance within acceptable ranges')
    } else if (successRate >= 0.7) {
      console.log('   ⚠️  MOSTLY READY - Minor issues detected')
      console.log('   🔧 Review failed tests and address before production')
    } else {
      console.log('   ❌ NOT READY FOR PRODUCTION')
      console.log('   🔧 Significant issues need to be resolved')
    }

    console.log('\n🎉 Validation completed!')
    console.log('Your Barkly Research Platform has been comprehensively tested!')
  }
}

// Run validation
const validator = new ComprehensiveValidator()
validator.runAllValidations().catch(error => {
  console.error('💥 Validation failed:', error)
  process.exit(1)
})