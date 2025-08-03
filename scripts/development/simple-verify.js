/**
 * Simple verification using direct database connection
 */

const { Client } = require('pg');
require('dotenv').config();

async function simpleVerify() {
  console.log('🔍 Simple Community Management Verification...\n');
  
  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    return;
  }
  
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful\n');

    // Check if community management tables exist
    console.log('📊 Checking community management tables...');
    
    const tableQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      ORDER BY tablename;
    `;
    
    const tableResult = await client.query(tableQuery);
    
    console.log('✅ Community management tables found:');
    tableResult.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });
    
    if (tableResult.rows.length < 3) {
      console.log('⚠️  Some tables may be missing');
    }

    // Check extended community fields
    console.log('\n🌍 Checking extended community fields...');
    
    const fieldQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'communities' 
      AND column_name IN ('community_type', 'geographic_region', 'traditional_territory', 'verification_status')
      ORDER BY column_name;
    `;
    
    const fieldResult = await client.query(fieldQuery);
    
    console.log('✅ Extended community fields found:');
    fieldResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    // Check RLS policies
    console.log('\n🛡️ Checking RLS policies...');
    
    const policyQuery = `
      SELECT 
        tablename,
        COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      GROUP BY tablename
      ORDER BY tablename;
    `;
    
    const policyResult = await client.query(policyQuery);
    
    console.log('✅ RLS policies found:');
    policyResult.rows.forEach(row => {
      console.log(`   - ${row.tablename}: ${row.policy_count} policies`);
    });

    // Test basic table access
    console.log('\n🧪 Testing basic table access...');
    
    try {
      const communityResult = await client.query('SELECT COUNT(*) as count FROM communities');
      console.log(`   ✅ Communities table: ${communityResult.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Communities table access failed: ${error.message}`);
    }
    
    try {
      const membershipResult = await client.query('SELECT COUNT(*) as count FROM community_memberships');
      console.log(`   ✅ Community memberships table: ${membershipResult.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community memberships table access failed: ${error.message}`);
    }
    
    try {
      const policyTableResult = await client.query('SELECT COUNT(*) as count FROM community_data_policies');
      console.log(`   ✅ Community data policies table: ${policyTableResult.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community data policies table access failed: ${error.message}`);
    }
    
    try {
      const projectResult = await client.query('SELECT COUNT(*) as count FROM community_research_projects');
      console.log(`   ✅ Community research projects table: ${projectResult.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community research projects table access failed: ${error.message}`);
    }

    console.log('\n🎉 Community Management System Verification Complete!');
    
    // Summary
    const hasAllTables = tableResult.rows.length >= 3;
    const hasExtendedFields = fieldResult.rows.length >= 4;
    const hasPolicies = policyResult.rows.length >= 3;
    
    console.log('\n📋 Summary:');
    console.log(`   - Core Tables: ${hasAllTables ? '✅ ALL CREATED' : '❌ MISSING SOME'} (${tableResult.rows.length}/3)`);
    console.log(`   - Extended Fields: ${hasExtendedFields ? '✅ ALL ADDED' : '❌ MISSING SOME'} (${fieldResult.rows.length}/4)`);
    console.log(`   - RLS Policies: ${hasPolicies ? '✅ ACTIVE' : '❌ INCOMPLETE'} (${policyResult.rows.length}/3)`);
    
    if (hasAllTables && hasExtendedFields && hasPolicies) {
      console.log('\n🚀 Community Management System is fully operational!');
      console.log('   ✅ Task 3 Complete: Community Management System');
      console.log('   🎯 Ready for Task 4: Advanced User Management');
    } else {
      console.log('\n⚠️  Some components may need attention');
    }

  } catch (error) {
    console.error('❌ Verification failed:');
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

// Run the verification
simpleVerify();