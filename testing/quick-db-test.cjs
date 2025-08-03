// Quick Database Test - Check if tables exist
require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

async function quickTest() {
  console.log('🔍 Quick Database Test\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Test 1: Check if we can query system tables
    console.log('📊 Checking system tables...')
    const { data: systemTables, error: systemError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['communities', 'documents', 'user_profiles'])

    if (systemError) {
      console.log('❌ System table query failed:', systemError.message)
    } else {
      console.log('✅ Found tables in system catalog:', systemTables.map(t => t.table_name))
    }

    // Test 2: Try to insert test data
    console.log('\n📝 Testing data insertion...')
    const { data: insertData, error: insertError } = await supabase
      .from('communities')
      .insert({
        name: 'Quick Test Community',
        description: 'Testing database connectivity'
      })
      .select()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
    } else {
      console.log('✅ Successfully inserted test data:', insertData)
    }

    // Test 3: Try to read data
    console.log('\n📖 Testing data reading...')
    const { data: readData, error: readError } = await supabase
      .from('communities')
      .select('*')
      .limit(5)

    if (readError) {
      console.log('❌ Read failed:', readError.message)
    } else {
      console.log('✅ Successfully read data:', readData.length, 'records')
      readData.forEach(record => {
        console.log(`   - ${record.name}: ${record.description}`)
      })
    }

    // Test 4: Check vector extension
    console.log('\n🔢 Testing vector extension...')
    const { data: vectorTest, error: vectorError } = await supabase.rpc('vector_search', {
      query_embedding: new Array(1536).fill(0.1),
      match_threshold: 0.5,
      match_count: 1
    })

    if (vectorError) {
      console.log('❌ Vector search failed:', vectorError.message)
    } else {
      console.log('✅ Vector search working:', vectorTest.length, 'results')
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }

  console.log('\n🎯 Summary:')
  console.log('If you see ✅ marks above, your database is working!')
  console.log('If you see ❌ marks, there may be RLS policy issues.')
}

quickTest()