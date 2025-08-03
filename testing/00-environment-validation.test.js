// Environment Validation Test
// Quick test to validate environment setup before running full suite

import { describe, test, expect, beforeAll } from '@jest/globals'

describe('Environment Validation', () => {
  beforeAll(() => {
    console.log('🔍 Validating test environment setup...')
  })

  test('should have all required environment variables', () => {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY'
    ]

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing)
    } else {
      console.log('✅ All environment variables present')
    }

    expect(missing).toHaveLength(0)
  })

  test('should be able to import Supabase client', async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      )
      
      expect(supabase).toBeDefined()
      console.log('✅ Supabase client created successfully')
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error.message)
      throw error
    }
  })

  test('should be able to import OpenAI client', async () => {
    try {
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      
      expect(openai).toBeDefined()
      console.log('✅ OpenAI client created successfully')
    } catch (error) {
      console.error('❌ Failed to create OpenAI client:', error.message)
      throw error
    }
  })

  test('should be able to import Anthropic client', async () => {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
      
      expect(anthropic).toBeDefined()
      console.log('✅ Anthropic client created successfully')
    } catch (error) {
      console.error('❌ Failed to create Anthropic client:', error.message)
      throw error
    }
  })

  test('should be able to connect to Supabase', async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      )

      // Try a simple query
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)

      if (error) {
        console.error('❌ Supabase connection error:', error.message)
        throw error
      }

      expect(error).toBeNull()
      console.log('✅ Supabase database connection successful')
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error.message)
      throw error
    }
  })

  test('should be able to connect to OpenAI API', async () => {
    try {
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })

      // Try to list models (lightweight API call)
      const models = await openai.models.list()
      
      expect(models).toBeDefined()
      expect(models.data).toBeDefined()
      console.log('✅ OpenAI API connection successful')
    } catch (error) {
      console.error('❌ Failed to connect to OpenAI API:', error.message)
      throw error
    }
  }, 30000) // 30 second timeout for API calls

  test('should be able to connect to Anthropic API', async () => {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })

      // Try a simple API call
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
      
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      console.log('✅ Anthropic API connection successful')
    } catch (error) {
      console.error('❌ Failed to connect to Anthropic API:', error.message)
      throw error
    }
  }, 30000) // 30 second timeout for API calls
})