#!/usr/bin/env node

// AI Provider Configuration Checker
// Quick test to see which AI providers are working

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '../.env' })

class AIProviderChecker {
  constructor() {
    this.providers = {
      anthropic: {
        name: 'Anthropic Claude',
        key: process.env.ANTHROPIC_API_KEY,
        status: 'unknown',
        client: null
      },
      openai: {
        name: 'OpenAI GPT',
        key: process.env.OPENAI_API_KEY,
        status: 'unknown',
        client: null
      },
      moonshot: {
        name: 'Moonshot AI',
        key: process.env.MOONSHOT_API_KEY,
        status: 'unknown',
        endpoint: 'https://api.moonshot.cn/v1/chat/completions'
      },
      qwen: {
        name: 'QWEN (Alibaba)',
        key: process.env.QWEN_API_KEY,
        status: 'unknown',
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
      }
    }
  }

  async checkProvider(providerName, testFn) {
    const provider = this.providers[providerName]
    console.log(`\n🧪 Testing ${provider.name}...`)
    
    if (!provider.key) {
      console.log(`   ❌ No API key configured`)
      provider.status = 'no_key'
      return false
    }

    try {
      const result = await testFn()
      console.log(`   ✅ Working! ${result}`)
      provider.status = 'working'
      return true
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`)
      provider.status = 'failed'
      provider.error = error.message
      return false
    }
  }

  async checkAnthropic() {
    return await this.checkProvider('anthropic', async () => {
      const anthropic = new Anthropic({
        apiKey: this.providers.anthropic.key
      })

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Respond with just: "Anthropic working"'
        }]
      })

      return `Response: ${response.content[0].text.trim()}`
    })
  }

  async checkOpenAI() {
    return await this.checkProvider('openai', async () => {
      const openai = new OpenAI({
        apiKey: this.providers.openai.key
      })

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: 'Respond with just: "OpenAI working"'
        }],
        max_tokens: 10
      })

      return `Response: ${response.choices[0].message.content.trim()}`
    })
  }

  async checkMoonshot() {
    return await this.checkProvider('moonshot', async () => {
      const response = await fetch(this.providers.moonshot.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.providers.moonshot.key}`
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [{
            role: 'user',
            content: 'Respond with just: "Moonshot working"'
          }],
          max_tokens: 10
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return `Response: ${data.choices[0].message.content.trim()}`
    })
  }

  async checkQWEN() {
    return await this.checkProvider('qwen', async () => {
      const response = await fetch(this.providers.qwen.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.providers.qwen.key}`
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: [{
              role: 'user',
              content: 'Respond with just: "QWEN working"'
            }]
          },
          parameters: {
            max_tokens: 10
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.output?.text || data.output?.choices?.[0]?.message?.content || 'Response received'
      return `Response: ${content.trim()}`
    })
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 AI PROVIDER STATUS REPORT')
    console.log('='.repeat(60))

    const working = []
    const failed = []
    const noKey = []

    Object.entries(this.providers).forEach(([key, provider]) => {
      console.log(`\n🤖 ${provider.name}:`)
      console.log(`   API Key: ${provider.key ? '✅ Configured' : '❌ Missing'}`)
      
      switch (provider.status) {
        case 'working':
          console.log(`   Status: ✅ WORKING`)
          working.push(provider.name)
          break
        case 'failed':
          console.log(`   Status: ❌ FAILED (${provider.error})`)
          failed.push(provider.name)
          break
        case 'no_key':
          console.log(`   Status: ⚠️  NO API KEY`)
          noKey.push(provider.name)
          break
        default:
          console.log(`   Status: ❓ NOT TESTED`)
      }
    })

    console.log('\n' + '='.repeat(60))
    console.log('📈 SUMMARY')
    console.log('='.repeat(60))

    console.log(`\n✅ Working Providers (${working.length}):`)
    working.forEach(name => console.log(`   • ${name}`))

    if (failed.length > 0) {
      console.log(`\n❌ Failed Providers (${failed.length}):`)
      failed.forEach(name => console.log(`   • ${name}`))
    }

    if (noKey.length > 0) {
      console.log(`\n⚠️  Missing API Keys (${noKey.length}):`)
      noKey.forEach(name => console.log(`   • ${name}`))
    }

    console.log('\n🎯 RECOMMENDATIONS:')
    
    if (working.length >= 2) {
      console.log('   ✅ Excellent! Multiple AI providers working')
      console.log('   ✅ You have good redundancy for AI operations')
      console.log(`   💡 Primary recommendation: Use ${working[0]} as main provider`)
    } else if (working.length === 1) {
      console.log(`   ⚠️  Only ${working[0]} is working`)
      console.log('   💡 Consider configuring backup providers')
      console.log('   💡 Check failed providers and fix API keys/quotas')
    } else {
      console.log('   ❌ No AI providers are working!')
      console.log('   🔧 Check API keys and account status')
      console.log('   💳 Verify billing and quota limits')
    }

    if (failed.some(name => name.includes('OpenAI'))) {
      console.log('\n💡 OpenAI Issues:')
      console.log('   • Check quota limits and billing')
      console.log('   • Consider upgrading plan if needed')
      console.log('   • Use alternative providers while resolving')
    }

    console.log('\n🔧 NEXT STEPS:')
    if (working.length > 0) {
      console.log('   1. ✅ Run the full upload and AI test')
      console.log('   2. 🔧 Configure platform to use working providers')
      console.log('   3. 🚀 Proceed with platform testing')
    } else {
      console.log('   1. 🔑 Check and update API keys')
      console.log('   2. 💳 Verify account status and billing')
      console.log('   3. 🔄 Re-run this test')
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 AI Provider check completed!')
    console.log('='.repeat(60))
  }

  async runAllChecks() {
    console.log('🚀 AI PROVIDER CONFIGURATION CHECK')
    console.log('='.repeat(60))
    console.log('Testing all configured AI providers...')

    await this.checkAnthropic()
    await this.checkOpenAI()
    await this.checkMoonshot()
    await this.checkQWEN()

    await this.generateReport()
  }
}

// Run the checks
const checker = new AIProviderChecker()
checker.runAllChecks().catch(console.error)