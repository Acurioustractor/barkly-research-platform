// Test Environment Setup - Barkly Research Platform
// Comprehensive testing framework with API and AI integrations

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import pkg from '@jest/globals'
const { jest } = pkg

// Environment Configuration
const TEST_CONFIG = {
  supabase: {
    url: process.env.SUPABASE_URL || 'your-supabase-url',
    anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-key'
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key'
  },
  testing: {
    timeout: 30000,
    retries: 3,
    parallel: false // Set to false for cultural protocol testing
  }
}

// Initialize API Clients
export const supabase = createClient(
  TEST_CONFIG.supabase.url,
  TEST_CONFIG.supabase.anonKey
)

export const supabaseAdmin = createClient(
  TEST_CONFIG.supabase.url,
  TEST_CONFIG.supabase.serviceKey
)

export const openai = new OpenAI({
  apiKey: TEST_CONFIG.openai.apiKey
})

export const anthropic = new Anthropic({
  apiKey: TEST_CONFIG.anthropic.apiKey
})

// Test Data Factory
export class TestDataFactory {
  static async createTestCommunity() {
    const { data, error } = await supabaseAdmin
      .from('communities')
      .insert({
        name: 'Test Indigenous Community',
        description: 'Test community for platform validation',
        cultural_protocols: {
          data_sovereignty: true,
          elder_approval_required: true,
          attribution_required: true,
          sharing_restrictions: ['no_commercial_use']
        },
        contact_info: {
          primary_contact: 'test-elder@community.test',
          cultural_liaison: 'test-liaison@community.test'
        }
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create test community: ${error.message}`)
    return data
  }

  static async createTestUsers(communityId) {
    const users = [
      {
        email: 'community-member@test.com',
        role: 'community_member',
        community_id: communityId,
        cultural_affiliation: 'verified',
        permissions: ['read_community_data', 'contribute_knowledge']
      },
      {
        email: 'researcher@test.com',
        role: 'external_researcher',
        community_id: null,
        cultural_affiliation: 'none',
        permissions: ['read_public_data', 'request_access']
      },
      {
        email: 'elder@test.com',
        role: 'knowledge_keeper',
        community_id: communityId,
        cultural_affiliation: 'elder',
        permissions: ['read_all_community_data', 'approve_sacred_access', 'cultural_oversight']
      }
    ]

    const createdUsers = []
    for (const user of users) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          role: user.role,
          community_id: user.community_id,
          cultural_affiliation: user.cultural_affiliation,
          permissions: user.permissions
        }
      })

      if (error) throw new Error(`Failed to create test user: ${error.message}`)
      createdUsers.push(data.user)
    }

    return createdUsers
  }

  static async createTestDocuments(communityId, userId) {
    const documents = [
      {
        title: 'Public Research Document',
        content: 'This is a public research document that can be shared openly.',
        cultural_sensitivity: 'public',
        community_id: null,
        uploaded_by: userId,
        file_type: 'text/plain',
        file_size: 1024
      },
      {
        title: 'Community Knowledge Document',
        content: 'This document contains community-specific knowledge and cultural information.',
        cultural_sensitivity: 'community',
        community_id: communityId,
        uploaded_by: userId,
        file_type: 'text/plain',
        file_size: 2048,
        cultural_metadata: {
          requires_attribution: true,
          knowledge_holders: ['Elder Name'],
          cultural_context: 'Traditional practices'
        }
      },
      {
        title: 'Sacred Knowledge Document',
        content: 'This document contains sacred knowledge that requires elder approval.',
        cultural_sensitivity: 'sacred',
        community_id: communityId,
        uploaded_by: userId,
        file_type: 'text/plain',
        file_size: 1536,
        cultural_metadata: {
          requires_elder_approval: true,
          access_restrictions: ['community_only', 'elder_supervised'],
          sacred_content: true
        }
      }
    ]

    const createdDocuments = []
    for (const doc of documents) {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert(doc)
        .select()
        .single()

      if (error) throw new Error(`Failed to create test document: ${error.message}`)
      createdDocuments.push(data)
    }

    return createdDocuments
  }
}

// AI Integration Test Helpers
export class AITestHelpers {
  static async testOpenAIEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      })
      return {
        success: true,
        embedding: response.data[0].embedding,
        dimensions: response.data[0].embedding.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async testCulturalSensitivityAnalysis(text) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this text for cultural sensitivity and classify it as: public, community, restricted, or sacred. 
          
          Text: "${text}"
          
          Provide your analysis in JSON format:
          {
            "sensitivity_level": "public|community|restricted|sacred",
            "cultural_indicators": ["list", "of", "indicators"],
            "requires_special_handling": boolean,
            "recommended_access_level": "description",
            "confidence_score": 0.0-1.0
          }`
        }]
      })

      const analysis = JSON.parse(response.content[0].text)
      return {
        success: true,
        analysis
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async testDocumentProcessing(documentText) {
    // Test the complete AI pipeline
    const results = {
      embedding: await this.testOpenAIEmbedding(documentText),
      culturalAnalysis: await this.testCulturalSensitivityAnalysis(documentText)
    }

    return results
  }
}

// Cultural Protocol Test Helpers
export class CulturalProtocolHelpers {
  static async testAccessControl(userId, documentId, expectedAccess) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (expectedAccess && error) {
        return {
          success: false,
          message: 'Expected access but was denied',
          error: error.message
        }
      }

      if (!expectedAccess && !error) {
        return {
          success: false,
          message: 'Expected access denial but was granted',
          data
        }
      }

      return {
        success: true,
        message: expectedAccess ? 'Access granted as expected' : 'Access denied as expected',
        data: expectedAccess ? data : null
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async testCommunityVerification(userId, communityId) {
    try {
      const { data, error } = await supabase.rpc('verify_community_membership', {
        user_id: userId,
        community_id: communityId
      })

      return {
        success: !error,
        verified: data,
        error: error?.message
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static async testElderApprovalProcess(documentId, elderId) {
    try {
      const { data, error } = await supabase.rpc('request_elder_approval', {
        document_id: documentId,
        elder_id: elderId
      })

      return {
        success: !error,
        approvalRequest: data,
        error: error?.message
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Test Cleanup Helpers
export class TestCleanup {
  static async cleanupTestData() {
    try {
      // Clean up in reverse order of dependencies
      await supabaseAdmin.from('document_chunks').delete().neq('id', 0)
      await supabaseAdmin.from('documents').delete().like('title', 'Test%')
      await supabaseAdmin.from('communities').delete().like('name', 'Test%')
      
      // Clean up test users
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      for (const user of users.users) {
        if (user.email?.includes('@test.com')) {
          await supabaseAdmin.auth.admin.deleteUser(user.id)
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Jest Configuration
export const jestConfig = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/testing/setup.js'],
  testTimeout: TEST_CONFIG.testing.timeout,
  maxWorkers: TEST_CONFIG.testing.parallel ? undefined : 1,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
}

export default {
  TEST_CONFIG,
  supabase,
  supabaseAdmin,
  openai,
  anthropic,
  TestDataFactory,
  AITestHelpers,
  CulturalProtocolHelpers,
  TestCleanup
}