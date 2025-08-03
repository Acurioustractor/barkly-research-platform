// Two-Step Database Setup Guide
require('dotenv').config({ path: '../.env' })
const fs = require('fs')
const path = require('path')

function showSetupInstructions() {
  console.log('🚀 Barkly Research Platform - Two-Step Database Setup')
  console.log('=' .repeat(70))
  console.log('The previous error occurred because RLS policies were created before')
  console.log('tables were fully committed. We\'ll fix this with a 2-step approach.\n')

  console.log('📋 STEP 1: Create Tables First')
  console.log('─'.repeat(40))
  
  try {
    const step1SQL = fs.readFileSync(path.resolve(__dirname, '../database-setup/01-tables-only.sql'), 'utf8')
    console.log('Copy and paste this SQL in Supabase SQL Editor:\n')
    console.log('```sql')
    console.log(step1SQL)
    console.log('```\n')
    
    console.log('✅ After running Step 1, you should see: "STEP 1 COMPLETE: Tables created successfully!"\n')
    
    console.log('📋 STEP 2: Create RLS Policies')
    console.log('─'.repeat(40))
    
    const step2SQL = fs.readFileSync(path.resolve(__dirname, '../database-setup/02-policies-only.sql'), 'utf8')
    console.log('Then copy and paste this SQL in a NEW query:\n')
    console.log('```sql')
    console.log(step2SQL)
    console.log('```\n')
    
    console.log('✅ After running Step 2, you should see: "STEP 2 COMPLETE: RLS policies created successfully!"\n')
    
    console.log('🎯 FINAL STEP: Test Your Setup')
    console.log('─'.repeat(40))
    console.log('After both steps complete successfully, run:')
    console.log('npm run test:simple')
    console.log('\nThis should now show all tables found instead of the warning!')
    
  } catch (error) {
    console.error('❌ Error reading setup files:', error.message)
    console.log('\n📋 Manual Instructions:')
    console.log('1. Go to: https://supabase.com/dashboard/project/gkwzdnzwpfpkvgpcbeeq/sql')
    console.log('2. Run the files in this order:')
    console.log('   - database-setup/01-tables-only.sql')
    console.log('   - database-setup/02-policies-only.sql')
    console.log('3. Then run: npm run test:simple')
  }
}

showSetupInstructions()