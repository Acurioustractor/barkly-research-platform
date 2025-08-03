// Test Both Supabase Keys
require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

async function testBothKeys() {
  console.log('🔍 Testing Both Supabase Keys\n')

  // Test with anon key
  console.log('📋 Testing with ANON key...')
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('communities')
      .select('*')
      .limit(1)

    if (anonError) {
      console.log('❌ Anon key failed:', anonError.message)
    } else {
      console.log('✅ Anon key works:', anonData.length, 'records')
    }
  } catch (e) {
    console.log('❌ Anon key exception:', e.message)
  }

  // Test with service role key
  console.log('\n📋 Testing with SERVICE ROLE key...')
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('communities')
      .select('*')
      .limit(1)

    if (serviceError) {
      console.log('❌ Service key failed:', serviceError.message)
    } else {
      console.log('✅ Service key works:', serviceData.length, 'records')
    }
  } catch (e) {
    console.log('❌ Service key exception:', e.message)
  }

  // Test system table access with service role
  console.log('\n📋 Testing system table access with SERVICE ROLE...')
  try {
    const { data: systemData, error: systemError } = await supabaseService
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)

    if (systemError) {
      console.log('❌ System table access failed:', systemError.message)
    } else {
      console.log('✅ System table access works:', systemData.length, 'tables found')
      systemData.forEach(table => console.log(`   - ${table.table_name}`))
    }
  } catch (e) {
    console.log('❌ System table exception:', e.message)
  }

  // Test a simple RPC call
  console.log('\n📋 Testing RPC call...')
  try {
    const { data: rpcData, error: rpcError } = await supabaseService
      .rpc('vector_search', {
        query_embedding: new Array(1536).fill(0.1),
        match_threshold: 0.5,
        match_count: 1
      })

    if (rpcError) {
      console.log('❌ RPC call failed:', rpcError.message)
    } else {
      console.log('✅ RPC call works:', rpcData.length, 'results')
    }
  } catch (e) {
    console.log('❌ RPC exception:', e.message)
  }
}

testBothKeys()