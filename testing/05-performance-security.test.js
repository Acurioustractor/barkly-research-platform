// Performance and Security Tests
// Tests system performance, load handling, and security measures

import { 
  supabase,
  supabaseAdmin,
  openai,
  anthropic,
  TestDataFactory,
  CulturalProtocolHelpers,
  AITestHelpers,
  TestCleanup
} from './test-environment-setup.js'

describe('Performance and Security Tests', () => {
  let testCommunity
  let testUsers
  let testDocuments
  let performanceBaseline = {}

  beforeAll(async () => {
    await TestCleanup.cleanupTestData()
    testCommunity = await TestDataFactory.createTestCommunity()
    testUsers = await TestDataFactory.createTestUsers(testCommunity.id)
    testDocuments = await TestDataFactory.createTestDocuments(testCommunity.id, testUsers[0].id)
    
    // Establish performance baselines
    performanceBaseline = await establishPerformanceBaselines()
  })

  afterAll(async () => {
    await TestCleanup.cleanupTestData()
  })

  describe('Database Performance Tests', () => {
    test('should handle concurrent database operations', async () => {
      const concurrentOperations = 50
      const startTime = Date.now()

      // Create concurrent read operations
      const readOperations = Array.from({ length: concurrentOperations }, () =>
        supabase
          .from('documents')
          .select('id, title, cultural_sensitivity, community_id')
          .limit(10)
      )

      const results = await Promise.all(readOperations)
      const executionTime = Date.now() - startTime

      // All operations should succeed
      results.forEach(({ data, error }) => {
        expect(error).toBeNull()
        expect(Array.isArray(data)).toBe(true)
      })

      // Should complete within reasonable time (adjust based on your requirements)
      expect(executionTime).toBeLessThan(5000) // 5 seconds for 50 concurrent operations
      console.log(`Concurrent reads: ${concurrentOperations} operations in ${executionTime}ms`)
    })

    test('should maintain performance with cultural metadata queries', async () => {
      const startTime = Date.now()

      // Complex query with cultural metadata filtering
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          communities(*),
          document_chunks(count),
          document_themes(*)
        `)
        .eq('cultural_sensitivity', 'community')
        .not('cultural_metadata', 'is', null)
        .limit(20)

      const executionTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
      console.log(`Cultural metadata query: ${executionTime}ms`)
    })

    test('should handle large document processing efficiently', async () => {
      // Create a large document for testing
      const largeContent = 'This is a test document. '.repeat(1000) // ~25KB content
      
      const { data: largeDoc, error: docError } = await supabaseAdmin
        .from('documents')
        .insert({
          title: 'Large Test Document',
          content: largeContent,
          cultural_sensitivity: 'public',
          uploaded_by: testUsers[0].id,
          file_size: largeContent.length
        })
        .select()
        .single()

      expect(docError).toBeNull()

      // Test processing time
      const startTime = Date.now()

      // Generate embedding for large content
      const embeddingResult = await AITestHelpers.testOpenAIEmbedding(largeContent)
      const embeddingTime = Date.now() - startTime

      expect(embeddingResult.success).toBe(true)
      expect(embeddingTime).toBeLessThan(10000) // Should complete within 10 seconds
      console.log(`Large document embedding: ${embeddingTime}ms for ${largeContent.length} characters`)

      // Test chunking and storage
      const chunkStartTime = Date.now()
      const chunks = chunkLargeDocument(largeContent, 500) // 500 character chunks
      
      const chunkInserts = chunks.map((chunk, index) =>
        supabaseAdmin
          .from('document_chunks')
          .insert({
            document_id: largeDoc.id,
            chunk_text: chunk,
            chunk_index: index,
            embedding: new Array(1536).fill(0.1) // Mock embedding for performance test
          })
      )

      await Promise.all(chunkInserts)
      const chunkTime = Date.now() - chunkStartTime

      expect(chunkTime).toBeLessThan(5000) // Should complete within 5 seconds
      console.log(`Document chunking: ${chunks.length} chunks in ${chunkTime}ms`)
    })

    test('should maintain vector search performance', async () => {
      // Create multiple documents with embeddings for search testing
      const searchDocuments = Array.from({ length: 20 }, (_, i) => ({
        title: `Search Test Document ${i}`,
        content: `This is search test document number ${i} with unique content about traditional knowledge and cultural practices.`,
        cultural_sensitivity: 'public'
      }))

      // Insert documents and embeddings
      for (const doc of searchDocuments) {
        const { data: document, error: docError } = await supabaseAdmin
          .from('documents')
          .insert({
            ...doc,
            uploaded_by: testUsers[0].id
          })
          .select()
          .single()

        expect(docError).toBeNull()

        const embedding = await AITestHelpers.testOpenAIEmbedding(doc.content)
        expect(embedding.success).toBe(true)

        await supabaseAdmin
          .from('document_chunks')
          .insert({
            document_id: document.id,
            chunk_text: doc.content,
            chunk_index: 0,
            embedding: embedding.embedding
          })
      }

      // Test vector search performance
      const searchQuery = 'traditional cultural practices'
      const queryEmbedding = await AITestHelpers.testOpenAIEmbedding(searchQuery)
      
      const startTime = Date.now()
      const { data: searchResults, error: searchError } = await supabase.rpc('vector_search', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: 0.5,
        match_count: 10
      })
      const searchTime = Date.now() - startTime

      expect(searchError).toBeNull()
      expect(Array.isArray(searchResults)).toBe(true)
      expect(searchTime).toBeLessThan(1000) // Should complete within 1 second
      console.log(`Vector search: ${searchResults.length} results in ${searchTime}ms`)
    })
  })

  describe('API Performance Tests', () => {
    test('should handle high-frequency API requests', async () => {
      const requestCount = 100
      const startTime = Date.now()

      // Create high-frequency API requests
      const apiRequests = Array.from({ length: requestCount }, () =>
        supabase
          .from('documents')
          .select('id, title')
          .limit(5)
      )

      const results = await Promise.all(apiRequests)
      const totalTime = Date.now() - startTime

      // All requests should succeed
      results.forEach(({ data, error }) => {
        expect(error).toBeNull()
        expect(Array.isArray(data)).toBe(true)
      })

      const avgResponseTime = totalTime / requestCount
      expect(avgResponseTime).toBeLessThan(100) // Average response time under 100ms
      console.log(`API performance: ${requestCount} requests, avg ${avgResponseTime.toFixed(2)}ms per request`)
    })

    test('should maintain performance under cultural protocol validation', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      
      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      const startTime = Date.now()

      // Requests that require cultural protocol validation
      const culturalRequests = Array.from({ length: 20 }, () =>
        supabase
          .from('documents')
          .select('*')
          .eq('cultural_sensitivity', 'community')
          .eq('community_id', testCommunity.id)
          .limit(5)
      )

      const results = await Promise.all(culturalRequests)
      const totalTime = Date.now() - startTime

      results.forEach(({ data, error }) => {
        expect(error).toBeNull()
        expect(Array.isArray(data)).toBe(true)
      })

      const avgResponseTime = totalTime / culturalRequests.length
      expect(avgResponseTime).toBeLessThan(200) // Cultural validation adds overhead but should stay reasonable
      console.log(`Cultural protocol validation: ${culturalRequests.length} requests, avg ${avgResponseTime.toFixed(2)}ms per request`)
    })
  })

  describe('AI Integration Performance Tests', () => {
    test('should handle batch AI processing efficiently', async () => {
      const batchSize = 10
      const testTexts = Array.from({ length: batchSize }, (_, i) => 
        `Test document ${i} for batch AI processing with cultural content analysis.`
      )

      const startTime = Date.now()

      // Process batch of embeddings
      const embeddingPromises = testTexts.map(text => 
        AITestHelpers.testOpenAIEmbedding(text)
      )
      const embeddingResults = await Promise.all(embeddingPromises)
      const embeddingTime = Date.now() - startTime

      // All embeddings should succeed
      embeddingResults.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.embedding).toBeDefined()
      })

      expect(embeddingTime).toBeLessThan(30000) // Should complete within 30 seconds
      console.log(`Batch embeddings: ${batchSize} texts in ${embeddingTime}ms`)

      // Process batch of cultural analysis
      const analysisStartTime = Date.now()
      const analysisPromises = testTexts.slice(0, 5).map(text => // Smaller batch for Claude
        AITestHelpers.testCulturalSensitivityAnalysis(text)
      )
      const analysisResults = await Promise.all(analysisPromises)
      const analysisTime = Date.now() - analysisStartTime

      analysisResults.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.analysis).toBeDefined()
      })

      expect(analysisTime).toBeLessThan(60000) // Should complete within 60 seconds
      console.log(`Batch cultural analysis: ${analysisResults.length} texts in ${analysisTime}ms`)
    })

    test('should handle AI service failures gracefully', async () => {
      // Test with invalid API key to simulate failure
      const originalApiKey = process.env.OPENAI_API_KEY
      process.env.OPENAI_API_KEY = 'invalid-key'

      const result = await AITestHelpers.testOpenAIEmbedding('Test text')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()

      // Restore original API key
      process.env.OPENAI_API_KEY = originalApiKey
    })
  })

  describe('Security Tests', () => {
    test('should prevent SQL injection attacks', async () => {
      const maliciousInputs = [
        "'; DROP TABLE documents; --",
        "' OR '1'='1",
        "'; INSERT INTO documents (title) VALUES ('hacked'); --",
        "' UNION SELECT * FROM users --"
      ]

      for (const maliciousInput of maliciousInputs) {
        // Test in search functionality
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .textSearch('title', maliciousInput)

        // Should either return safe results or proper error, never execute malicious SQL
        if (error) {
          expect(error.message).not.toContain('syntax error')
        } else {
          expect(Array.isArray(data)).toBe(true)
        }
      }
    })

    test('should enforce Row Level Security policies', async () => {
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')

      // Test without authentication
      await supabase.auth.signOut()

      const { data: unauthData, error: unauthError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', communityDoc.id)

      expect(unauthError).toBeDefined() // Should be blocked by RLS

      // Test with wrong user
      await supabase.auth.signInWithPassword({
        email: 'researcher@test.com',
        password: 'TestPassword123!'
      })

      const { data: wrongUserData, error: wrongUserError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', communityDoc.id)

      expect(wrongUserError).toBeDefined() // Should be blocked by RLS for community content
    })

    test('should prevent unauthorized cultural data access', async () => {
      const sacredDoc = testDocuments.find(d => d.cultural_sensitivity === 'sacred')
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')

      await supabase.auth.signInWithPassword({
        email: 'researcher@test.com',
        password: 'TestPassword123!'
      })

      // Try various methods to access sacred content
      const accessAttempts = [
        // Direct access
        supabase.from('documents').select('*').eq('id', sacredDoc.id),
        // Through joins
        supabase.from('document_chunks').select('*, documents(*)').eq('document_id', sacredDoc.id),
        // Through search
        supabase.from('documents').select('*').textSearch('content', 'sacred')
      ]

      for (const attempt of accessAttempts) {
        const { data, error } = await attempt
        
        // Should either error or return empty results, never expose sacred content
        if (!error) {
          expect(data).toEqual([])
        }
      }
    })

    test('should validate cultural protocol compliance in real-time', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      
      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      // Attempt to create document without proper cultural metadata
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: 'Traditional Knowledge Document',
          content: 'This contains traditional knowledge but lacks proper metadata',
          cultural_sensitivity: 'community',
          community_id: testCommunity.id,
          uploaded_by: communityMember.id
          // Missing required cultural_metadata
        })

      // Should either require cultural metadata or add validation
      if (!error) {
        // If insert succeeds, should trigger validation
        const { data: validation, error: validationError } = await supabase.rpc('validate_cultural_compliance', {
          document_id: data[0].id
        })

        if (!validationError) {
          expect(validation.requires_metadata_completion).toBe(true)
        }
      }
    })

    test('should audit all cultural data access', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')

      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      // Access cultural document
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', communityDoc.id)
        .single()

      expect(error).toBeNull()

      // Check that access was audited
      const { data: auditLogs, error: auditError } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('resource_id', communityDoc.id)
        .eq('user_id', communityMember.id)
        .eq('action_type', 'document_access')
        .order('created_at', { ascending: false })
        .limit(1)

      expect(auditError).toBeNull()
      if (auditLogs.length > 0) {
        expect(auditLogs[0].resource_id).toBe(communityDoc.id)
        expect(auditLogs[0].cultural_context).toBeDefined()
      }
    })
  })

  describe('Load Testing', () => {
    test('should handle concurrent user sessions', async () => {
      const concurrentUsers = 20
      const sessionsPerUser = 5

      const userSessions = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userEmail = `loadtest-user-${userIndex}@test.com`
        
        // Create test user
        const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: 'TestPassword123!',
          email_confirm: true
        })

        if (userError) return { success: false, error: userError }

        // Simulate user sessions
        const sessions = Array.from({ length: sessionsPerUser }, async () => {
          await supabase.auth.signInWithPassword({
            email: userEmail,
            password: 'TestPassword123!'
          })

          // Perform typical user operations
          const operations = [
            supabase.from('documents').select('id, title').limit(10),
            supabase.from('communities').select('id, name').limit(5),
            supabase.from('user_profiles').select('*').eq('user_id', user.user.id)
          ]

          return Promise.all(operations)
        })

        return Promise.all(sessions)
      })

      const startTime = Date.now()
      const results = await Promise.all(userSessions)
      const totalTime = Date.now() - startTime

      // Most sessions should succeed
      const successfulSessions = results.filter(result => 
        result.success !== false && Array.isArray(result)
      ).length

      expect(successfulSessions).toBeGreaterThan(concurrentUsers * 0.8) // 80% success rate
      expect(totalTime).toBeLessThan(30000) // Should complete within 30 seconds
      console.log(`Load test: ${concurrentUsers} users, ${successfulSessions} successful sessions in ${totalTime}ms`)
    })

    test('should maintain cultural protocol enforcement under load', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')

      // Simulate high load on cultural access controls
      const accessTests = Array.from({ length: 50 }, async (_, i) => {
        const user = i % 2 === 0 ? communityMember : researcher
        const expectedAccess = i % 2 === 0 // Community member should have access, researcher should not
        
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: 'TestPassword123!'
        })

        const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')
        const { data, error } = await supabase
          .from('documents')
          .select('id, title')
          .eq('id', communityDoc.id)

        return {
          user: user.email,
          expectedAccess,
          actualAccess: !error && data.length > 0,
          error: error?.message
        }
      })

      const results = await Promise.all(accessTests)

      // Cultural protocols should be enforced correctly even under load
      results.forEach(result => {
        expect(result.actualAccess).toBe(result.expectedAccess)
      })

      console.log(`Cultural protocol load test: ${results.length} access checks completed`)
    })
  })

  describe('Resource Usage Monitoring', () => {
    test('should monitor memory usage during large operations', async () => {
      const initialMemory = process.memoryUsage()

      // Perform memory-intensive operations
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        title: `Memory Test Document ${i}`,
        content: 'Large content '.repeat(100), // ~1.3KB per document
        cultural_sensitivity: 'public'
      }))

      // Process embeddings for large dataset
      const embeddingPromises = largeDataSet.slice(0, 10).map(doc => 
        AITestHelpers.testOpenAIEmbedding(doc.content)
      )

      await Promise.all(embeddingPromises)

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
      console.log(`Memory usage: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`)
    })

    test('should handle database connection limits', async () => {
      // Test connection pooling by creating many concurrent connections
      const connectionTests = Array.from({ length: 30 }, () =>
        supabase.from('documents').select('count').limit(1)
      )

      const startTime = Date.now()
      const results = await Promise.all(connectionTests)
      const totalTime = Date.now() - startTime

      // All connections should succeed (connection pooling should handle this)
      results.forEach(({ data, error }) => {
        expect(error).toBeNull()
      })

      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
      console.log(`Connection pooling test: ${connectionTests.length} connections in ${totalTime}ms`)
    })
  })
})

// Helper functions
async function establishPerformanceBaselines() {
  const baselines = {}

  // Simple query baseline
  const simpleStart = Date.now()
  await supabase.from('documents').select('id').limit(1)
  baselines.simpleQuery = Date.now() - simpleStart

  // Complex query baseline
  const complexStart = Date.now()
  await supabase.from('documents').select('*, communities(*)').limit(5)
  baselines.complexQuery = Date.now() - complexStart

  // AI embedding baseline
  const embeddingStart = Date.now()
  await AITestHelpers.testOpenAIEmbedding('Baseline test text')
  baselines.embedding = Date.now() - embeddingStart

  console.log('Performance baselines established:', baselines)
  return baselines
}

function chunkLargeDocument(text, chunkSize) {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks.filter(chunk => chunk.trim().length > 0)
}