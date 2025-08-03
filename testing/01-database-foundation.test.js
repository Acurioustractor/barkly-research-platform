// Database Foundation Tests
// Tests core database functionality, migrations, and basic operations

import { 
  supabase, 
  supabaseAdmin, 
  TestDataFactory, 
  CulturalProtocolHelpers,
  TestCleanup 
} from './test-environment-setup.js'

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'

describe('Database Foundation Tests', () => {
  let testCommunity
  let testUsers
  let testDocuments

  beforeAll(async () => {
    // Clean up any existing test data
    await TestCleanup.cleanupTestData()
    
    // Create test data
    testCommunity = await TestDataFactory.createTestCommunity()
    testUsers = await TestDataFactory.createTestUsers(testCommunity.id)
    testDocuments = await TestDataFactory.createTestDocuments(testCommunity.id, testUsers[0].id)
  })

  afterAll(async () => {
    await TestCleanup.cleanupTestData()
  })

  describe('Database Schema Validation', () => {
    test('should have all required tables', async () => {
      const { data: tables, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      expect(error).toBeNull()
      
      const requiredTables = [
        'communities',
        'user_profiles',
        'documents',
        'document_chunks',
        'document_themes',
        'document_quotes',
        'document_collections',
        'collection_documents',
        'collaboration_sessions',
        'search_analytics',
        'audit_logs'
      ]

      const tableNames = tables.map(t => t.table_name)
      requiredTables.forEach(table => {
        expect(tableNames).toContain(table)
      })
    })

    test('should have proper indexes for performance', async () => {
      const { data: indexes, error } = await supabaseAdmin
        .from('pg_indexes')
        .select('indexname, tablename')
        .eq('schemaname', 'public')

      expect(error).toBeNull()
      expect(indexes.length).toBeGreaterThan(20) // Should have comprehensive indexing
    })

    test('should have RLS enabled on all tables', async () => {
      const { data: tables, error } = await supabaseAdmin.rpc('check_rls_enabled')
      
      expect(error).toBeNull()
      expect(tables.every(table => table.row_security === 'on')).toBe(true)
    })
  })

  describe('Community Management', () => {
    test('should create community with cultural protocols', async () => {
      expect(testCommunity).toBeDefined()
      expect(testCommunity.name).toBe('Test Indigenous Community')
      expect(testCommunity.cultural_protocols).toHaveProperty('data_sovereignty', true)
      expect(testCommunity.cultural_protocols).toHaveProperty('elder_approval_required', true)
    })

    test('should enforce community data isolation', async () => {
      // Create second community
      const { data: community2 } = await supabaseAdmin
        .from('communities')
        .insert({
          name: 'Test Community 2',
          description: 'Second test community',
          cultural_protocols: { data_sovereignty: true }
        })
        .select()
        .single()

      // Test that communities cannot access each other's data
      const { data: communityData, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', community2.id)

      // Should be restricted by RLS
      expect(data).toBeNull()
      expect(error).toBeDefined()
    })

    test('should validate cultural protocol configuration', async () => {
      const { data, error } = await supabase.rpc('validate_cultural_protocols', {
        community_id: testCommunity.id
      })

      expect(error).toBeNull()
      expect(data.valid).toBe(true)
      expect(data.protocols_configured).toContain('data_sovereignty')
      expect(data.protocols_configured).toContain('elder_approval_required')
    })
  })

  describe('User Management and Authentication', () => {
    test('should create users with proper roles and permissions', async () => {
      expect(testUsers).toHaveLength(3)
      
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')
      const elder = testUsers.find(u => u.email === 'elder@test.com')

      expect(communityMember.user_metadata.role).toBe('community_member')
      expect(researcher.user_metadata.role).toBe('external_researcher')
      expect(elder.user_metadata.role).toBe('knowledge_keeper')
    })

    test('should verify community membership correctly', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      
      const verification = await CulturalProtocolHelpers.testCommunityVerification(
        communityMember.id,
        testCommunity.id
      )

      expect(verification.success).toBe(true)
      expect(verification.verified).toBe(true)
    })

    test('should reject non-community member verification', async () => {
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')
      
      const verification = await CulturalProtocolHelpers.testCommunityVerification(
        researcher.id,
        testCommunity.id
      )

      expect(verification.success).toBe(true)
      expect(verification.verified).toBe(false)
    })

    test('should handle user profile creation and updates', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: communityMember.id,
          display_name: 'Test Community Member',
          community_id: testCommunity.id,
          cultural_affiliation: 'verified',
          research_interests: ['traditional_knowledge', 'cultural_preservation']
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(profile.display_name).toBe('Test Community Member')
      expect(profile.cultural_affiliation).toBe('verified')
    })
  })

  describe('Document Management', () => {
    test('should create documents with proper cultural metadata', async () => {
      expect(testDocuments).toHaveLength(3)
      
      const publicDoc = testDocuments.find(d => d.cultural_sensitivity === 'public')
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')
      const sacredDoc = testDocuments.find(d => d.cultural_sensitivity === 'sacred')

      expect(publicDoc).toBeDefined()
      expect(communityDoc).toBeDefined()
      expect(sacredDoc).toBeDefined()
      expect(sacredDoc.cultural_metadata.requires_elder_approval).toBe(true)
    })

    test('should enforce document access controls', async () => {
      const researcher = testUsers.find(u => u.email === 'researcher@test.com')
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')

      // Researcher should not access community document
      const accessTest = await CulturalProtocolHelpers.testAccessControl(
        researcher.id,
        communityDoc.id,
        false // Expected: no access
      )

      expect(accessTest.success).toBe(true)
      expect(accessTest.message).toContain('denied as expected')
    })

    test('should allow appropriate document access', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')

      // Community member should access community document
      const accessTest = await CulturalProtocolHelpers.testAccessControl(
        communityMember.id,
        communityDoc.id,
        true // Expected: access granted
      )

      expect(accessTest.success).toBe(true)
      expect(accessTest.message).toContain('granted as expected')
    })

    test('should handle document versioning', async () => {
      const publicDoc = testDocuments.find(d => d.cultural_sensitivity === 'public')
      
      // Create a new version
      const { data: newVersion, error } = await supabaseAdmin
        .from('documents')
        .insert({
          ...publicDoc,
          id: undefined, // Let it generate new ID
          version: 2,
          parent_document_id: publicDoc.id,
          content: 'Updated content for version 2'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(newVersion.version).toBe(2)
      expect(newVersion.parent_document_id).toBe(publicDoc.id)
    })
  })

  describe('Cultural Protocol Enforcement', () => {
    test('should require elder approval for sacred documents', async () => {
      const elder = testUsers.find(u => u.email === 'elder@test.com')
      const sacredDoc = testDocuments.find(d => d.cultural_sensitivity === 'sacred')

      const approvalTest = await CulturalProtocolHelpers.testElderApprovalProcess(
        sacredDoc.id,
        elder.id
      )

      expect(approvalTest.success).toBe(true)
      expect(approvalTest.approvalRequest).toBeDefined()
    })

    test('should log all cultural data access', async () => {
      const communityMember = testUsers.find(u => u.email === 'community-member@test.com')
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')

      // Access the document to trigger audit logging
      await supabase
        .from('documents')
        .select('*')
        .eq('id', communityDoc.id)
        .single()

      // Check audit log
      const { data: auditLogs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('resource_id', communityDoc.id)
        .eq('action_type', 'document_access')

      expect(error).toBeNull()
      expect(auditLogs.length).toBeGreaterThan(0)
    })

    test('should validate cultural metadata completeness', async () => {
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')

      const { data: validation, error } = await supabase.rpc('validate_cultural_metadata', {
        document_id: communityDoc.id
      })

      expect(error).toBeNull()
      expect(validation.valid).toBe(true)
      expect(validation.required_fields_present).toBe(true)
    })
  })

  describe('Database Performance', () => {
    test('should execute queries within performance targets', async () => {
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          communities(*),
          document_chunks(count)
        `)
        .limit(100)

      const executionTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should handle concurrent operations', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) =>
        supabase
          .from('documents')
          .select('id, title, cultural_sensitivity')
          .limit(10)
      )

      const results = await Promise.all(concurrentOperations)
      
      results.forEach(({ data, error }) => {
        expect(error).toBeNull()
        expect(data).toBeDefined()
      })
    })
  })

  describe('Data Integrity', () => {
    test('should enforce foreign key constraints', async () => {
      // Try to create document with invalid community_id
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          title: 'Invalid Document',
          content: 'Test content',
          community_id: 99999, // Non-existent community
          uploaded_by: testUsers[0].id,
          cultural_sensitivity: 'public'
        })

      expect(error).toBeDefined()
      expect(error.message).toContain('foreign key')
    })

    test('should validate required fields', async () => {
      // Try to create document without required fields
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          content: 'Test content'
          // Missing required fields: title, uploaded_by, cultural_sensitivity
        })

      expect(error).toBeDefined()
    })

    test('should maintain referential integrity on deletion', async () => {
      // Create a document chunk
      const { data: chunk, error: chunkError } = await supabaseAdmin
        .from('document_chunks')
        .insert({
          document_id: testDocuments[0].id,
          chunk_text: 'Test chunk',
          chunk_index: 1,
          embedding: new Array(1536).fill(0.1) // Mock embedding
        })
        .select()
        .single()

      expect(chunkError).toBeNull()

      // Try to delete the document (should handle cascading properly)
      const { error: deleteError } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', testDocuments[0].id)

      // Should either cascade delete or prevent deletion
      if (deleteError) {
        expect(deleteError.message).toContain('foreign key')
      } else {
        // If deletion succeeded, chunks should be deleted too
        const { data: remainingChunks } = await supabaseAdmin
          .from('document_chunks')
          .select('*')
          .eq('document_id', testDocuments[0].id)

        expect(remainingChunks).toHaveLength(0)
      }
    })
  })
})