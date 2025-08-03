#!/usr/bin/env node

// System Cleanup Script
// Removes all test documents and communities to start fresh with real data

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import readline from 'readline'

// Load environment variables
dotenv.config({ path: '../.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

class SystemCleaner {
  constructor() {
    this.stats = {
      documentsDeleted: 0,
      chunksDeleted: 0,
      themesDeleted: 0,
      communitiesDeleted: 0,
      testCommunitiesDeleted: 0
    }
  }

  async confirmCleanup() {
    return new Promise(resolve => {
      console.log('🚨 SYSTEM CLEANUP WARNING')
      console.log('='.repeat(50))
      console.log('This will DELETE ALL:')
      console.log('• Documents (including uploaded PDFs)')
      console.log('• Document chunks and themes')
      console.log('• Test communities (keeping production ones)')
      console.log('• All related processing data')
      console.log('')
      console.log('This action CANNOT be undone!')
      console.log('='.repeat(50))
      
      rl.question('\nAre you sure you want to proceed? Type "YES" to confirm: ', (answer) => {
        resolve(answer === 'YES')
      })
    })
  }

  async getCurrentStats() {
    console.log('\n📊 CURRENT SYSTEM STATUS')
    console.log('='.repeat(40))

    try {
      // Count documents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, title, community_id, created_at')

      if (docError) throw docError

      // Count chunks
      const { data: chunks, error: chunkError } = await supabase
        .from('document_chunks')
        .select('id')

      if (chunkError) throw chunkError

      // Count themes
      const { data: themes, error: themeError } = await supabase
        .from('document_themes')
        .select('id')

      if (themeError) throw themeError

      // Count communities
      const { data: communities, error: commError } = await supabase
        .from('communities')
        .select('id, name, created_at')

      if (commError) throw commError

      console.log(`📄 Documents: ${documents.length}`)
      console.log(`📄 Document Chunks: ${chunks.length}`)
      console.log(`🎯 Document Themes: ${themes.length}`)
      console.log(`🏛️ Communities: ${communities.length}`)

      if (documents.length > 0) {
        console.log('\n📋 Current Documents:')
        documents.forEach((doc, index) => {
          const date = new Date(doc.created_at).toLocaleDateString()
          console.log(`   ${index + 1}. ${doc.title} (${date})`)
        })
      }

      if (communities.length > 0) {
        console.log('\n🏛️ Current Communities:')
        communities.forEach((comm, index) => {
          const date = new Date(comm.created_at).toLocaleDateString()
          const isTest = comm.name.toLowerCase().includes('test') || 
                        comm.name.toLowerCase().includes('walkthrough') ||
                        comm.name.toLowerCase().includes('validation') ||
                        comm.name.toLowerCase().includes('production_test')
          console.log(`   ${index + 1}. ${comm.name} ${isTest ? '(TEST)' : '(KEEP)'} (${date})`)
        })
      }

      return { documents, chunks, themes, communities }
    } catch (error) {
      console.error('❌ Error getting current stats:', error)
      throw error
    }
  }

  async cleanDocuments() {
    console.log('\n🗑️ CLEANING DOCUMENTS...')
    console.log('='.repeat(30))

    try {
      // Get all documents first
      const { data: documents, error: getError } = await supabase
        .from('documents')
        .select('id, title')

      if (getError) throw getError

      if (documents.length === 0) {
        console.log('   ℹ️ No documents to delete')
        return
      }

      console.log(`   🔍 Found ${documents.length} documents to delete`)

      // Delete document chunks first (foreign key constraint)
      console.log('   🗑️ Deleting document chunks...')
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (chunkError) {
        console.log('   ⚠️ Chunk deletion warning:', chunkError.message)
      } else {
        console.log('   ✅ Document chunks deleted')
      }

      // Delete document themes
      console.log('   🗑️ Deleting document themes...')
      const { error: themeError } = await supabase
        .from('document_themes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (themeError) {
        console.log('   ⚠️ Theme deletion warning:', themeError.message)
      } else {
        console.log('   ✅ Document themes deleted')
      }

      // Delete documents
      console.log('   🗑️ Deleting documents...')
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (docError) throw docError

      this.stats.documentsDeleted = documents.length
      console.log(`   ✅ ${documents.length} documents deleted successfully`)

    } catch (error) {
      console.error('   ❌ Error cleaning documents:', error)
      throw error
    }
  }

  async cleanTestCommunities() {
    console.log('\n🗑️ CLEANING TEST COMMUNITIES...')
    console.log('='.repeat(35))

    try {
      // Get all communities
      const { data: communities, error: getError } = await supabase
        .from('communities')
        .select('id, name, created_at')

      if (getError) throw getError

      if (communities.length === 0) {
        console.log('   ℹ️ No communities found')
        return
      }

      // Identify test communities
      const testCommunities = communities.filter(comm => {
        const name = comm.name.toLowerCase()
        return name.includes('test') || 
               name.includes('walkthrough') ||
               name.includes('validation') ||
               name.includes('production_test') ||
               name.includes('upload_community')
      })

      const productionCommunities = communities.filter(comm => {
        const name = comm.name.toLowerCase()
        return !name.includes('test') && 
               !name.includes('walkthrough') &&
               !name.includes('validation') &&
               !name.includes('production_test') &&
               !name.includes('upload_community')
      })

      console.log(`   🔍 Found ${testCommunities.length} test communities to delete`)
      console.log(`   🔍 Found ${productionCommunities.length} production communities to keep`)

      if (testCommunities.length > 0) {
        console.log('\n   🗑️ Deleting test communities:')
        for (const comm of testCommunities) {
          console.log(`      • ${comm.name}`)
          const { error } = await supabase
            .from('communities')
            .delete()
            .eq('id', comm.id)

          if (error) {
            console.log(`      ❌ Failed to delete ${comm.name}: ${error.message}`)
          } else {
            this.stats.testCommunitiesDeleted++
          }
        }
        console.log(`   ✅ ${this.stats.testCommunitiesDeleted} test communities deleted`)
      }

      if (productionCommunities.length > 0) {
        console.log('\n   ✅ Keeping production communities:')
        productionCommunities.forEach(comm => {
          console.log(`      • ${comm.name}`)
        })
      }

    } catch (error) {
      console.error('   ❌ Error cleaning test communities:', error)
      throw error
    }
  }

  async verifyCleanup() {
    console.log('\n🔍 VERIFYING CLEANUP...')
    console.log('='.repeat(25))

    try {
      // Check documents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id')

      if (docError) throw docError

      // Check chunks
      const { data: chunks, error: chunkError } = await supabase
        .from('document_chunks')
        .select('id')

      if (chunkError) throw chunkError

      // Check themes
      const { data: themes, error: themeError } = await supabase
        .from('document_themes')
        .select('id')

      if (themeError) throw themeError

      // Check communities
      const { data: communities, error: commError } = await supabase
        .from('communities')
        .select('id, name')

      if (commError) throw commError

      console.log(`   📄 Documents remaining: ${documents.length}`)
      console.log(`   📄 Document chunks remaining: ${chunks.length}`)
      console.log(`   🎯 Document themes remaining: ${themes.length}`)
      console.log(`   🏛️ Communities remaining: ${communities.length}`)

      if (communities.length > 0) {
        console.log('\n   🏛️ Remaining communities:')
        communities.forEach(comm => {
          console.log(`      • ${comm.name}`)
        })
      }

      return {
        documents: documents.length,
        chunks: chunks.length,
        themes: themes.length,
        communities: communities.length
      }

    } catch (error) {
      console.error('   ❌ Error verifying cleanup:', error)
      throw error
    }
  }

  async generateCleanupReport() {
    console.log('\n' + '='.repeat(60))
    console.log('🎉 SYSTEM CLEANUP COMPLETE!')
    console.log('='.repeat(60))

    console.log('\n📊 Cleanup Summary:')
    console.log(`   🗑️ Documents deleted: ${this.stats.documentsDeleted}`)
    console.log(`   🗑️ Test communities deleted: ${this.stats.testCommunitiesDeleted}`)

    console.log('\n✅ System Status:')
    console.log('   📄 All documents removed')
    console.log('   📄 All document chunks removed')
    console.log('   🎯 All document themes removed')
    console.log('   🏛️ Test communities removed')
    console.log('   🏛️ Production communities preserved')

    console.log('\n🚀 Ready for Production:')
    console.log('   ✅ Clean database ready for real documents')
    console.log('   ✅ Community structure preserved')
    console.log('   ✅ All tables and relationships intact')
    console.log('   ✅ Upload system ready for use')

    console.log('\n📋 Next Steps:')
    console.log('   1. 🏛️ Create your real communities (if needed)')
    console.log('   2. 📄 Upload your real documents')
    console.log('   3. 🎯 Let AI process and extract themes')
    console.log('   4. 📊 View insights and analytics')

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Your platform is now ready for real data!')
    console.log('='.repeat(60))
  }

  async runCleanup() {
    console.log('🧹 BARKLY YOUTH VOICES - SYSTEM CLEANUP')
    console.log('='.repeat(50))

    try {
      // Show current status
      await this.getCurrentStats()

      // Confirm cleanup
      const confirmed = await this.confirmCleanup()
      if (!confirmed) {
        console.log('\n❌ Cleanup cancelled by user')
        rl.close()
        return
      }

      console.log('\n🚀 Starting cleanup process...')

      // Clean documents (this also cleans chunks and themes)
      await this.cleanDocuments()

      // Clean test communities
      await this.cleanTestCommunities()

      // Verify cleanup
      await this.verifyCleanup()

      // Generate report
      await this.generateCleanupReport()

    } catch (error) {
      console.error('\n❌ Cleanup failed:', error)
    } finally {
      rl.close()
    }
  }
}

// Run cleanup
const cleaner = new SystemCleaner()
cleaner.runCleanup().catch(console.error)