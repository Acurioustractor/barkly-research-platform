require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDatabase() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('   Auth connection:', authError ? '❌ FAILED' : '✅ SUCCESS');
    
    // Test 2: Try to query documents table
    console.log('\n2. Testing documents table...');
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .limit(5);
    
    if (docsError) {
      console.log('   Documents table:', '❌ FAILED');
      console.log('   Error:', docsError.message);
      
      if (docsError.message.includes('relation "documents" does not exist')) {
        console.log('\n📋 SOLUTION: You need to create the documents table');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Open the SQL Editor');
        console.log('   3. Run the SQL in setup-basic-tables.sql');
      }
    } else {
      console.log('   Documents table: ✅ SUCCESS');
      console.log('   Found', docs?.length || 0, 'documents');
      if (docs && docs.length > 0) {
        docs.forEach(doc => {
          console.log('   -', doc.title || `Document ${doc.id}`);
        });
      }
    }
    
    // Test 3: Try to query auth.users (should work)
    console.log('\n3. Testing auth system...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    console.log('   Auth users:', usersError ? '❌ FAILED' : '✅ SUCCESS');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testDatabase();