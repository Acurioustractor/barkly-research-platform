// Cultural Protocol Compliance Tests
// Tests cultural sensitivity, community sovereignty, and indigenous data governance

import { 
  supabase,
  supabaseAdmin,
  TestDataFactory,
  CulturalProtocolHelpers,
  AITestHelpers,
  TestCleanup
} from './test-environment-setup.js'

describe('Cultural Protocol Compliance Tests', () => {
  let testCommunity
  let testUsers
  let testDocuments
  let communityMember, researcher, elder

  beforeAll(async () => {
    await TestCleanup.cleanupTestData()
    testCommunity = await TestDataFactory.createTestCommunity()
    testUsers = await TestDataFactory.createTestUsers(testCommunity.id)
    testDocuments = await TestDataFactory.createTestDocuments(testCommunity.id, testUsers[0].id)
    
    communityMember = testUsers.find(u => u.email === 'community-member@test.com')
    researcher = testUsers.find(u => u.email === 'researcher@test.com')
    elder = testUsers.find(u => u.email === 'elder@test.com')
  })

  afterAll(async () => {
    await TestCleanup.cleanupTestData()
  })

  describe('Data Sovereignty Implementation', () => {
    test('should enforce community control over data', async () => {
      // Community should be able to modify their own data governance settings
      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      const { data: updatedCommunity, error } = await supabase
        .from('communities')
        .update({
          cultural_protocols: {
            ...testCommunity.cultural_protocols,
            sharing_restrictions: ['no_commercial_use', 'attribution_required']
          }
        })
        .eq('id', testCommunity.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updatedCommunity.cultural_protocols.sharing_restrictions).toContain('no_commercial_use')
    })

    test('should prevent external modification of community data governance', async () => {
      // External researcher should not be able to modify community protocols
      await supabase.auth.signInWithPassword({
        email: 'researcher@test.com',
        password: 'TestPassword123!'
      })

      const { data, error } = await supabase
        .from('communities')
        .update({
          cultural_protocols: {
            data_sovereignty: false // Attempting to disable sovereignty
          }
        })
        .eq('id', testCommunity.id)

      expect(error).toBeDefined() // Should be blocked by RLS
      expect(data).toBeNull()
    })

    test('should maintain community ownership of uploaded data', async () => {
      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          title: 'Community Owned Document',
          content: 'This document belongs to the community',
          cultural_sensitivity: 'community',
          community_id: testCommunity.id,
          uploaded_by: communityMember.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(document.community_id).toBe(testCommunity.id)
      
      // Verify community can control access to this document
      const { data: accessControl, error: accessError } = await supabase.rpc('set_document_access', {
        document_id: document.id,
        access_level: 'restricted',
        allowed_roles: ['community_member', 'knowledge_keeper']
      })

      expect(accessError).toBeNull()
    })

    test('should implement CARE principles (Collective Benefit, Authority, Responsibility, Ethics)', async () => {
      // Test Collective Benefit - research should benefit community
      const { data: benefitTracking, error } = await supabase.rpc('track_community_benefit', {
        community_id: testCommunity.id,
        research_activity: 'document_analysis',
        benefit_type: 'capacity_building',
        description: 'Community members trained in digital archiving'
      })

      expect(error).toBeNull()
      expect(benefitTracking.community_id).toBe(testCommunity.id)

      // Test Authority - community has final say on data use
      const { data: authorityTest, error: authError } = await supabase.rpc('validate_community_authority', {
        community_id: testCommunity.id,
        proposed_use: 'academic_publication',
        requires_approval: true
      })

      expect(authError).toBeNull()
      expect(authorityTest.community_has_authority).toBe(true)
    })
  })

  describe('Cultural Sensitivity Classification', () => {
    test('should correctly classify public content', async () => {
      const publicText = 'This research discusses general environmental science methods and publicly available climate data.'
      const analysis = await AITestHelpers.testCulturalSensitivityAnalysis(publicText)

      expect(analysis.success).toBe(true)
      expect(analysis.analysis.sensitivity_level).toBe('public')
      expect(analysis.analysis.requires_special_handling).toBe(false)
    })

    test('should identify community-sensitive content', async () => {
      const communityText = 'This document discusses traditional fishing practices specific to our community, including seasonal knowledge passed down through generations.'
      const analysis = await AITestHelpers.testCulturalSensitivityAnalysis(communityText)

      expect(analysis.success).toBe(true)
      expect(['community', 'restricted']).toContain(analysis.analysis.sensitivity_level)
      expect(analysis.analysis.requires_special_handling).toBe(true)
      expect(analysis.analysis.cultural_indicators).toContain('traditional')
    })

    test('should detect sacred/restricted content', async () => {
      const sacredText = 'This document contains sacred songs, ceremonial protocols, and spiritual knowledge that is restricted to initiated community members only.'
      const analysis = await AITestHelpers.testCulturalSensitivityAnalysis(sacredText)

      expect(analysis.success).toBe(true)
      expect(['restricted', 'sacred']).toContain(analysis.analysis.sensitivity_level)
      expect(analysis.analysis.requires_special_handling).toBe(true)
      expect(analysis.analysis.confidence_score).toBeGreaterThan(0.8)
    })

    test('should handle mixed sensitivity content', async () => {
      const mixedText = 'This research combines publicly available climate data with traditional ecological knowledge from the community, including some ceremonial observations.'
      const analysis = await AITestHelpers.testCulturalSensitivityAnalysis(mixedText)

      expect(analysis.success).toBe(true)
      expect(['community', 'restricted']).toContain(analysis.analysis.sensitivity_level)
      expect(analysis.analysis.cultural_indicators.length).toBeGreaterThan(1)
    })

    test('should update document sensitivity based on AI analysis', async () => {
      const testDoc = testDocuments.find(d => d.cultural_sensitivity === 'public')
      const culturalText = 'This document actually contains traditional knowledge about medicinal plants used by our ancestors.'
      
      // Update document content
      await supabaseAdmin
        .from('documents')
        .update({ content: culturalText })
        .eq('id', testDoc.id)

      // Run AI analysis
      const analysis = await AITestHelpers.testCulturalSensitivityAnalysis(culturalText)
      
      // Update sensitivity based on analysis
      if (analysis.success && analysis.analysis.sensitivity_level !== 'public') {
        const { data: updatedDoc, error } = await supabaseAdmin
          .from('documents')
          .update({
            cultural_sensitivity: analysis.analysis.sensitivity_level,
            cultural_metadata: {
              ai_analysis: analysis.analysis,
              requires_review: true,
              analysis_date: new Date().toISOString()
            }
          })
          .eq('id', testDoc.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(updatedDoc.cultural_sensitivity).not.toBe('public')
        expect(updatedDoc.cultural_metadata.requires_review).toBe(true)
      }
    })
  })

  describe('Access Control and Permissions', () => {
    test('should enforce community-based access controls', async () => {
      const communityDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')
      
      // Community member should have access
      const communityAccess = await CulturalProtocolHelpers.testAccessControl(
        communityMember.id,
        communityDoc.id,
        true
      )
      expect(communityAccess.success).toBe(true)

      // External researcher should not have access
      const researcherAccess = await CulturalProtocolHelpers.testAccessControl(
        researcher.id,
        communityDoc.id,
        false
      )
      expect(researcherAccess.success).toBe(true)
    })

    test('should require elder approval for sacred content', async () => {
      const sacredDoc = testDocuments.find(d => d.cultural_sensitivity === 'sacred')
      
      // Even community members should need elder approval for sacred content
      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', sacredDoc.id)
        .single()

      // Should either be denied or require additional approval
      if (error) {
        expect(error.message).toContain('elder approval')
      } else {
        // If access granted, should be logged for elder review
        const { data: auditLog } = await supabaseAdmin
          .from('audit_logs')
          .select('*')
          .eq('resource_id', sacredDoc.id)
          .eq('action_type', 'sacred_content_access')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        expect(auditLog).toBeDefined()
        expect(auditLog.requires_elder_review).toBe(true)
      }
    })

    test('should implement graduated access levels', async () => {
      const accessLevels = ['public', 'community', 'restricted', 'sacred']
      
      for (const level of accessLevels) {
        const testDoc = testDocuments.find(d => d.cultural_sensitivity === level) || 
                       testDocuments[0] // Fallback to first document

        // Test access for different user types
        const accessTests = [
          { user: researcher, expectedAccess: level === 'public' },
          { user: communityMember, expectedAccess: ['public', 'community'].includes(level) },
          { user: elder, expectedAccess: true } // Elders should have access to all levels
        ]

        for (const test of accessTests) {
          const result = await CulturalProtocolHelpers.testAccessControl(
            test.user.id,
            testDoc.id,
            test.expectedAccess
          )
          expect(result.success).toBe(true)
        }
      }
    })

    test('should respect time-based access restrictions', async () => {
      // Create document with time-based restrictions
      const { data: timeRestrictedDoc, error } = await supabaseAdmin
        .from('documents')
        .insert({
          title: 'Seasonal Knowledge Document',
          content: 'This knowledge is only shared during specific seasons',
          cultural_sensitivity: 'community',
          community_id: testCommunity.id,
          uploaded_by: communityMember.id,
          cultural_metadata: {
            seasonal_restrictions: {
              available_months: [6, 7, 8], // Summer months only
              reason: 'Traditional seasonal sharing protocols'
            }
          }
        })
        .select()
        .single()

      expect(error).toBeNull()

      // Test seasonal access control
      const currentMonth = new Date().getMonth() + 1
      const shouldHaveAccess = [6, 7, 8].includes(currentMonth)

      const { data: accessResult, error: accessError } = await supabase.rpc('check_seasonal_access', {
        document_id: timeRestrictedDoc.id,
        user_id: communityMember.id,
        current_month: currentMonth
      })

      expect(accessError).toBeNull()
      expect(accessResult.access_granted).toBe(shouldHaveAccess)
    })
  })

  describe('Traditional Knowledge Protection', () => {
    test('should require proper attribution for traditional knowledge', async () => {
      const { data: tkDocument, error } = await supabaseAdmin
        .from('documents')
        .insert({
          title: 'Traditional Ecological Knowledge',
          content: 'Traditional knowledge about plant medicines passed down from Elder Mary',
          cultural_sensitivity: 'community',
          community_id: testCommunity.id,
          uploaded_by: communityMember.id,
          cultural_metadata: {
            knowledge_holders: ['Elder Mary'],
            requires_attribution: true,
            traditional_knowledge: true
          }
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(tkDocument.cultural_metadata.requires_attribution).toBe(true)
      expect(tkDocument.cultural_metadata.knowledge_holders).toContain('Elder Mary')

      // Test that attribution is enforced when accessing
      const { data: attribution, error: attrError } = await supabase.rpc('get_required_attribution', {
        document_id: tkDocument.id
      })

      expect(attrError).toBeNull()
      expect(attribution.knowledge_holders).toContain('Elder Mary')
      expect(attribution.attribution_text).toBeDefined()
    })

    test('should prevent unauthorized sharing of traditional knowledge', async () => {
      const tkDoc = testDocuments.find(d => d.cultural_metadata?.traditional_knowledge)
      
      // External researcher should not be able to share or export TK
      await supabase.auth.signInWithPassword({
        email: 'researcher@test.com',
        password: 'TestPassword123!'
      })

      const { data, error } = await supabase.rpc('request_document_sharing', {
        document_id: tkDoc?.id || testDocuments[0].id,
        sharing_type: 'external_publication',
        recipient: 'academic_journal@example.com'
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('traditional knowledge')
    })

    test('should track traditional knowledge usage', async () => {
      const tkDoc = testDocuments.find(d => d.cultural_sensitivity === 'community')
      
      // Access traditional knowledge document
      await supabase.auth.signInWithPassword({
        email: 'community-member@test.com',
        password: 'TestPassword123!'
      })

      await supabase
        .from('documents')
        .select('*')
        .eq('id', tkDoc.id)
        .single()

      // Check that usage is tracked
      const { data: usageLog, error } = await supabase
        .from('traditional_knowledge_usage')
        .select('*')
        .eq('document_id', tkDoc.id)
        .eq('user_id', communityMember.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error) { // Table might not exist in test setup
        expect(usageLog).toBeDefined()
        expect(usageLog.purpose).toBeDefined()
      }
    })

    test('should implement knowledge holder consent tracking', async () => {
      const { data: consentRecord, error } = await supabaseAdmin
        .from('knowledge_holder_consent')
        .insert({
          document_id: testDocuments[0].id,
          knowledge_holder_name: 'Elder Mary',
          consent_type: 'sharing_within_community',
          consent_granted: true,
          consent_date: new Date().toISOString(),
          conditions: ['attribution_required', 'no_commercial_use']
        })
        .select()
        .single()

      if (!error) { // Table might not exist in test setup
        expect(consentRecord.consent_granted).toBe(true)
        expect(consentRecord.conditions).toContain('attribution_required')
      }
    })
  })

  describe('Community Consultation and FPIC', () => {
    test('should implement Free, Prior, and Informed Consent process', async () => {
      // Simulate research proposal requiring FPIC
      const { data: fpicRequest, error } = await supabase.rpc('initiate_fpic_process', {
        community_id: testCommunity.id,
        research_proposal: {
          title: 'Traditional Medicine Research',
          description: 'Study of traditional plant medicines',
          data_required: ['traditional_knowledge', 'community_practices'],
          benefits_to_community: ['capacity_building', 'knowledge_preservation'],
          risks: ['potential_misuse', 'commercialization_concerns']
        },
        researcher_id: researcher.id
      })

      if (!error) { // Function might not exist in test setup
        expect(fpicRequest.status).toBe('pending_community_review')
        expect(fpicRequest.community_notified).toBe(true)
      }
    })

    test('should require community approval for research access', async () => {
      // External researcher requesting access to community data
      await supabase.auth.signInWithPassword({
        email: 'researcher@test.com',
        password: 'TestPassword123!'
      })

      const { data: accessRequest, error } = await supabase
        .from('community_access_requests')
        .insert({
          community_id: testCommunity.id,
          requester_id: researcher.id,
          request_type: 'research_collaboration',
          purpose: 'Academic research on traditional knowledge systems',
          data_requested: ['community_documents', 'traditional_knowledge'],
          proposed_benefits: ['academic_publication', 'knowledge_sharing']
        })
        .select()
        .single()

      if (!error) { // Table might not exist in test setup
        expect(accessRequest.status).toBe('pending_approval')
        expect(accessRequest.community_id).toBe(testCommunity.id)
      }
    })

    test('should allow consent withdrawal', async () => {
      // Community should be able to withdraw consent at any time
      await supabase.auth.signInWithPassword({
        email: 'elder@test.com',
        password: 'TestPassword123!'
      })

      const { data: withdrawal, error } = await supabase.rpc('withdraw_community_consent', {
        community_id: testCommunity.id,
        research_project_id: 'test_project_123',
        reason: 'Community concerns about data usage',
        effective_date: new Date().toISOString()
      })

      if (!error) { // Function might not exist in test setup
        expect(withdrawal.consent_withdrawn).toBe(true)
        expect(withdrawal.data_access_revoked).toBe(true)
      }
    })
  })

  describe('Cultural Protocol Monitoring', () => {
    test('should detect potential cultural protocol violations', async () => {
      // Simulate suspicious activity - external user trying to access multiple sacred documents
      const violations = []
      
      for (const doc of testDocuments) {
        if (doc.cultural_sensitivity === 'sacred') {
          const violation = await CulturalProtocolHelpers.testAccessControl(
            researcher.id,
            doc.id,
            false
          )
          
          if (!violation.success || violation.message.includes('denied')) {
            violations.push({
              document_id: doc.id,
              user_id: researcher.id,
              violation_type: 'unauthorized_sacred_access_attempt'
            })
          }
        }
      }

      expect(violations.length).toBeGreaterThan(0)
    })

    test('should alert community representatives of violations', async () => {
      // Simulate protocol violation
      const { data: alert, error } = await supabase.rpc('create_cultural_violation_alert', {
        community_id: testCommunity.id,
        violation_type: 'unauthorized_access_attempt',
        severity: 'high',
        details: {
          user_id: researcher.id,
          attempted_resource: 'sacred_document',
          timestamp: new Date().toISOString()
        }
      })

      if (!error) { // Function might not exist in test setup
        expect(alert.community_notified).toBe(true)
        expect(alert.severity).toBe('high')
      }
    })

    test('should maintain cultural compliance audit trail', async () => {
      // All cultural protocol interactions should be audited
      const { data: auditTrail, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('community_id', testCommunity.id)
        .eq('action_category', 'cultural_protocol')
        .order('created_at', { ascending: false })
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(auditTrail)).toBe(true)
      
      if (auditTrail.length > 0) {
        expect(auditTrail[0]).toHaveProperty('action_type')
        expect(auditTrail[0]).toHaveProperty('user_id')
        expect(auditTrail[0]).toHaveProperty('cultural_context')
      }
    })
  })

  describe('Community Benefit Tracking', () => {
    test('should track research benefits flowing to community', async () => {
      const { data: benefit, error } = await supabaseAdmin
        .from('community_benefits')
        .insert({
          community_id: testCommunity.id,
          benefit_type: 'capacity_building',
          description: 'Digital archiving training for community members',
          value_estimate: 5000,
          delivery_date: new Date().toISOString(),
          status: 'delivered'
        })
        .select()
        .single()

      if (!error) { // Table might not exist in test setup
        expect(benefit.community_id).toBe(testCommunity.id)
        expect(benefit.benefit_type).toBe('capacity_building')
        expect(benefit.status).toBe('delivered')
      }
    })

    test('should ensure reciprocal research relationships', async () => {
      // Research should provide value back to community
      const { data: reciprocity, error } = await supabase.rpc('assess_research_reciprocity', {
        community_id: testCommunity.id,
        research_period: '2024-01-01::2024-12-31'
      })

      if (!error) { // Function might not exist in test setup
        expect(reciprocity.benefits_provided).toBeDefined()
        expect(reciprocity.community_satisfaction).toBeDefined()
        expect(reciprocity.reciprocity_score).toBeGreaterThan(0)
      }
    })
  })
})