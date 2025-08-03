// AI Integration Tests
// Tests OpenAI, Anthropic, and vector search functionality

import { 
  openai,
  anthropic,
  supabase,
  supabaseAdmin,
  AITestHelpers,
  TestDataFactory,
  TestCleanup
} from './test-environment-setup.js'

describe('AI Integration Tests', () => {
  let testCommunity
  let testUsers
  let testDocuments

  beforeAll(async () => {
    await TestCleanup.cleanupTestData()
    testCommunity = await TestDataFactory.createTestCommunity()
    testUsers = await TestDataFactory.createTestUsers(testCommunity.id)
    testDocuments = await TestDataFactory.createTestDocuments(testCommunity.id, testUsers[0].id)
  })

  afterAll(async () => {
    await TestCleanup.cleanupTestData()
  })

  describe('OpenAI Integration', () => {
    test('should connect to OpenAI API', async () => {
      const testText = 'This is a test document for embedding generation.'
      const result = await AITestHelpers.testOpenAIEmbedding(testText)

      expect(result.success).toBe(true)
      expect(result.embedding).toBeDefined()
      expect(result.dimensions).toBe(1536) // text-embedding-3-small dimensions
      expect(Array.isArray(result.embedding)).toBe(true)
    })

    test('should generate consistent embeddings', async () => {
      const testText = 'Consistent embedding test text'
      
      const result1 = await AITestHelpers.testOpenAIEmbedding(testText)
      const result2 = await AITestHelpers.testOpenAIEmbedding(testText)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      // Embeddings should be very similar (cosine similarity > 0.99)
      const similarity = cosineSimilarity(result1.embedding, result2.embedding)
      expect(similarity).toBeGreaterThan(0.99)
    })

    test('should handle different text lengths', async () => {
      const texts = [
        'Short text.',
        'This is a medium length text that contains more information and should still generate proper embeddings.',
        'This is a very long text that contains extensive information about various topics including traditional knowledge, cultural practices, research methodologies, and community engagement strategies. It should test the embedding generation capability with longer content that might be typical of research documents uploaded to the platform.'
      ]

      for (const text of texts) {
        const result = await AITestHelpers.testOpenAIEmbedding(text)
        expect(result.success).toBe(true)
        expect(result.embedding).toBeDefined()
        expect(result.dimensions).toBe(1536)
      }
    })

    test('should handle special characters and unicode', async () => {
      const textWithUnicode = 'Traditional knowledge includes symbols like ∞, ♦, and cultural terms like Māori, Inuktitut ᐃᓄᒃᑎᑐᑦ'
      const result = await AITestHelpers.testOpenAIEmbedding(textWithUnicode)

      expect(result.success).toBe(true)
      expect(result.embedding).toBeDefined()
    })
  })

  describe('Anthropic Claude Integration', () => {
    test('should connect to Anthropic API', async () => {
      const testText = 'This is a public research document about general scientific topics.'
      const result = await AITestHelpers.testCulturalSensitivityAnalysis(testText)

      expect(result.success).toBe(true)
      expect(result.analysis).toBeDefined()
      expect(result.analysis.sensitivity_level).toBeDefined()
      expect(['public', 'community', 'restricted', 'sacred']).toContain(result.analysis.sensitivity_level)
    })

    test('should correctly identify public content', async () => {
      const publicText = 'This research discusses general scientific methods and publicly available data analysis techniques.'
      const result = await AITestHelpers.testCulturalSensitivityAnalysis(publicText)

      expect(result.success).toBe(true)
      expect(result.analysis.sensitivity_level).toBe('public')
      expect(result.analysis.requires_special_handling).toBe(false)
    })

    test('should identify community-sensitive content', async () => {
      const communityText = 'This document discusses traditional ecological knowledge specific to the local indigenous community and their land management practices.'
      const result = await AITestHelpers.testCulturalSensitivityAnalysis(communityText)

      expect(result.success).toBe(true)
      expect(['community', 'restricted']).toContain(result.analysis.sensitivity_level)
      expect(result.analysis.requires_special_handling).toBe(true)
    })

    test('should identify sacred content', async () => {
      const sacredText = 'This document contains sacred ceremonial knowledge, traditional songs, and spiritual practices that are restricted to initiated community members.'
      const result = await AITestHelpers.testCulturalSensitivityAnalysis(sacredText)

      expect(result.success).toBe(true)
      expect(['restricted', 'sacred']).toContain(result.analysis.sensitivity_level)
      expect(result.analysis.requires_special_handling).toBe(true)
      expect(result.analysis.confidence_score).toBeGreaterThan(0.7)
    })

    test('should provide cultural indicators', async () => {
      const culturalText = 'This research involves traditional medicine, ancestral knowledge, and ceremonial practices of the indigenous community.'
      const result = await AITestHelpers.testCulturalSensitivityAnalysis(culturalText)

      expect(result.success).toBe(true)
      expect(result.analysis.cultural_indicators).toBeDefined()
      expect(Array.isArray(result.analysis.cultural_indicators)).toBe(true)
      expect(result.analysis.cultural_indicators.length).toBeGreaterThan(0)
    })
  })

  describe('Document Processing Pipeline', () => {
    test('should process document through complete AI pipeline', async () => {
      const documentText = 'This research document discusses traditional ecological knowledge and community-based natural resource management practices.'
      
      const results = await AITestHelpers.testDocumentProcessing(documentText)

      expect(results.embedding.success).toBe(true)
      expect(results.culturalAnalysis.success).toBe(true)
      expect(results.embedding.embedding).toBeDefined()
      expect(results.culturalAnalysis.analysis).toBeDefined()
    })

    test('should create document chunks with embeddings', async () => {
      const longDocument = `
        This is a comprehensive research document about traditional knowledge systems.
        
        Traditional ecological knowledge represents generations of accumulated wisdom about the natural world.
        Indigenous communities have developed sophisticated understanding of local ecosystems.
        
        This knowledge includes seasonal patterns, animal behavior, plant properties, and sustainable harvesting practices.
        Community elders serve as knowledge keepers, passing down information through oral traditions.
        
        Modern research increasingly recognizes the value of traditional knowledge for conservation efforts.
        Collaborative approaches that respect indigenous sovereignty are essential for ethical research.
      `

      // Process document and create chunks
      const chunks = chunkDocument(longDocument, 200) // 200 character chunks
      expect(chunks.length).toBeGreaterThan(1)

      // Generate embeddings for each chunk
      const chunksWithEmbeddings = []
      for (let i = 0; i < chunks.length; i++) {
        const embeddingResult = await AITestHelpers.testOpenAIEmbedding(chunks[i])
        expect(embeddingResult.success).toBe(true)
        
        chunksWithEmbeddings.push({
          chunk_text: chunks[i],
          chunk_index: i,
          embedding: embeddingResult.embedding
        })
      }

      expect(chunksWithEmbeddings.length).toBe(chunks.length)
    })

    test('should store document chunks in database', async () => {
      const testDoc = testDocuments[0]
      const documentText = testDoc.content
      
      // Generate embedding
      const embeddingResult = await AITestHelpers.testOpenAIEmbedding(documentText)
      expect(embeddingResult.success).toBe(true)

      // Store chunk in database
      const { data: chunk, error } = await supabaseAdmin
        .from('document_chunks')
        .insert({
          document_id: testDoc.id,
          chunk_text: documentText,
          chunk_index: 0,
          embedding: embeddingResult.embedding
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(chunk.document_id).toBe(testDoc.id)
      expect(chunk.embedding).toBeDefined()
    })
  })

  describe('Vector Search Functionality', () => {
    let searchableChunks

    beforeAll(async () => {
      // Create searchable content with embeddings
      const searchTexts = [
        'Traditional ecological knowledge and sustainable practices',
        'Community-based natural resource management',
        'Indigenous research methodologies and protocols',
        'Cultural preservation and language documentation',
        'Sacred sites and ceremonial practices'
      ]

      searchableChunks = []
      for (let i = 0; i < searchTexts.length; i++) {
        const embeddingResult = await AITestHelpers.testOpenAIEmbedding(searchTexts[i])
        
        const { data: chunk, error } = await supabaseAdmin
          .from('document_chunks')
          .insert({
            document_id: testDocuments[0].id,
            chunk_text: searchTexts[i],
            chunk_index: i,
            embedding: embeddingResult.embedding
          })
          .select()
          .single()

        expect(error).toBeNull()
        searchableChunks.push(chunk)
      }
    })

    test('should perform vector similarity search', async () => {
      const queryText = 'sustainable environmental practices'
      const queryEmbedding = await AITestHelpers.testOpenAIEmbedding(queryText)
      
      expect(queryEmbedding.success).toBe(true)

      // Perform vector search
      const { data: results, error } = await supabase.rpc('vector_search', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: 0.7,
        match_count: 5
      })

      expect(error).toBeNull()
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })

    test('should rank results by similarity', async () => {
      const queryText = 'traditional knowledge'
      const queryEmbedding = await AITestHelpers.testOpenAIEmbedding(queryText)
      
      const { data: results, error } = await supabase.rpc('vector_search', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: 0.5,
        match_count: 10
      })

      expect(error).toBeNull()
      expect(results.length).toBeGreaterThan(1)
      
      // Results should be ordered by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].similarity).toBeGreaterThanOrEqual(results[i].similarity)
      }
    })

    test('should respect cultural access controls in vector search', async () => {
      // Create a restricted document chunk
      const restrictedEmbedding = await AITestHelpers.testOpenAIEmbedding('Sacred ceremonial knowledge')
      
      const { data: restrictedChunk } = await supabaseAdmin
        .from('document_chunks')
        .insert({
          document_id: testDocuments.find(d => d.cultural_sensitivity === 'sacred').id,
          chunk_text: 'Sacred ceremonial knowledge',
          chunk_index: 0,
          embedding: restrictedEmbedding.embedding
        })
        .select()
        .single()

      // Search as external researcher (should not see restricted content)
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')
      
      // Set user context for RLS
      await supabase.auth.signInWithPassword({
        email: 'researcher@test.com',
        password: 'TestPassword123!'
      })

      const queryEmbedding = await AITestHelpers.testOpenAIEmbedding('ceremonial practices')
      
      const { data: results, error } = await supabase.rpc('vector_search', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: 0.5,
        match_count: 10
      })

      expect(error).toBeNull()
      
      // Should not include the restricted chunk
      const restrictedResults = results.filter(r => r.chunk_text.includes('Sacred ceremonial'))
      expect(restrictedResults).toHaveLength(0)
    })
  })

  describe('AI Analysis Results Storage', () => {
    test('should store document themes', async () => {
      const testDoc = testDocuments[0]
      
      const { data: theme, error } = await supabaseAdmin
        .from('document_themes')
        .insert({
          document_id: testDoc.id,
          theme_name: 'Traditional Knowledge',
          description: 'Content related to traditional ecological knowledge',
          confidence_score: 0.85,
          ai_model: 'claude-3-sonnet',
          cultural_significance: 'high'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(theme.theme_name).toBe('Traditional Knowledge')
      expect(theme.confidence_score).toBe(0.85)
    })

    test('should store document quotes with cultural context', async () => {
      const testDoc = testDocuments[0]
      
      const { data: quote, error } = await supabaseAdmin
        .from('document_quotes')
        .insert({
          document_id: testDoc.id,
          quote_text: 'Traditional knowledge represents generations of wisdom',
          start_position: 0,
          end_position: 50,
          cultural_sensitivity: 'community',
          requires_attribution: true,
          knowledge_holder: 'Community Elder'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(quote.quote_text).toContain('Traditional knowledge')
      expect(quote.requires_attribution).toBe(true)
    })

    test('should link themes and quotes', async () => {
      const testDoc = testDocuments[0]
      
      // Create theme and quote
      const { data: theme } = await supabaseAdmin
        .from('document_themes')
        .insert({
          document_id: testDoc.id,
          theme_name: 'Cultural Practices',
          confidence_score: 0.9,
          ai_model: 'claude-3-sonnet'
        })
        .select()
        .single()

      const { data: quote } = await supabaseAdmin
        .from('document_quotes')
        .insert({
          document_id: testDoc.id,
          quote_text: 'Cultural practices are central to community identity',
          start_position: 100,
          end_position: 150,
          theme_id: theme.id
        })
        .select()
        .single()

      expect(quote.theme_id).toBe(theme.id)
    })
  })

  describe('AI Performance and Reliability', () => {
    test('should handle API rate limits gracefully', async () => {
      const requests = Array.from({ length: 5 }, () => 
        AITestHelpers.testOpenAIEmbedding('Rate limit test text')
      )

      const results = await Promise.all(requests)
      
      // All requests should either succeed or fail gracefully
      results.forEach(result => {
        expect(result).toHaveProperty('success')
        if (!result.success) {
          expect(result.error).toBeDefined()
        }
      })
    })

    test('should handle network errors', async () => {
      // Mock network failure
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const result = await AITestHelpers.testOpenAIEmbedding('Network test')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')

      // Restore original fetch
      global.fetch = originalFetch
    })

    test('should validate AI response formats', async () => {
      const result = await AITestHelpers.testCulturalSensitivityAnalysis('Test content')
      
      if (result.success) {
        expect(result.analysis).toHaveProperty('sensitivity_level')
        expect(result.analysis).toHaveProperty('cultural_indicators')
        expect(result.analysis).toHaveProperty('requires_special_handling')
        expect(result.analysis).toHaveProperty('confidence_score')
        
        expect(typeof result.analysis.requires_special_handling).toBe('boolean')
        expect(typeof result.analysis.confidence_score).toBe('number')
        expect(result.analysis.confidence_score).toBeGreaterThanOrEqual(0)
        expect(result.analysis.confidence_score).toBeLessThanOrEqual(1)
      }
    })
  })
})

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Helper function for document chunking
function chunkDocument(text, chunkSize) {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks.filter(chunk => chunk.trim().length > 0)
}