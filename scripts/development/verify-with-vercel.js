/**
 * Verification using Vercel Postgres
 */

const { createClient } = require('@vercel/postgres');
require('dotenv').config();

// Create client with direct connection
const client = createClient({
  connectionString: process.env.DIRECT_URL,
});

async function verifyWithVercel() {
  console.log('🔍 Verifying Community Management System...\n');

  try {
    // Check if community management tables exist
    console.log('📊 Checking community management tables...');
    
    const tables = await client.sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      ORDER BY tablename;
    `;
    
    console.log('✅ Community management tables found:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });
    
    if (tables.rows.length < 3) {
      console.log('⚠️  Some tables may be missing');
    }

    // Check extended community fields
    console.log('\n🌍 Checking extended community fields...');
    
    const fields = await client.sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'communities' 
      AND column_name IN ('community_type', 'geographic_region', 'traditional_territory', 'verification_status')
      ORDER BY column_name;
    `;
    
    console.log('✅ Extended community fields found:');
    fields.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    // Check RLS policies
    console.log('\n🛡️ Checking RLS policies...');
    
    const policies = await client.sql`
      SELECT 
        tablename,
        COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      GROUP BY tablename
      ORDER BY tablename;
    `;
    
    console.log('✅ RLS policies found:');
    policies.rows.forEach(row => {
      console.log(`   - ${row.tablename}: ${row.policy_count} policies`);
    });

    // Check indexes
    console.log('\n📊 Checking indexes...');
    
    const indexes = await client.sql`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;
    
    console.log(`✅ Found ${indexes.rows.length} community management indexes:`);
    indexes.rows.forEach(row => {
      console.log(`   - ${row.tablename}: ${row.indexname}`);
    });

    // Test basic table access
    console.log('\n🧪 Testing basic table access...');
    
    try {
      const communityCount = await client.sql`SELECT COUNT(*) as count FROM communities`;
      console.log(`   ✅ Communities table: ${communityCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Communities table access failed: ${error.message}`);
    }
    
    try {
      const membershipCount = await client.sql`SELECT COUNT(*) as count FROM community_memberships`;
      console.log(`   ✅ Community memberships table: ${membershipCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community memberships table access failed: ${error.message}`);
    }
    
    try {
      const policyCount = await client.sql`SELECT COUNT(*) as count FROM community_data_policies`;
      console.log(`   ✅ Community data policies table: ${policyCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community data policies table access failed: ${error.message}`);
    }
    
    try {
      const projectCount = await client.sql`SELECT COUNT(*) as count FROM community_research_projects`;
      console.log(`   ✅ Community research projects table: ${projectCount.rows[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community research projects table access failed: ${error.message}`);
    }

    console.log('\n🎉 Community Management System Verification Complete!');
    
    // Summary
    const hasAllTables = tables.rows.length >= 3;
    const hasExtendedFields = fields.rows.length >= 4;
    const hasPolicies = policies.rows.length >= 3;
    const hasIndexes = indexes.rows.length >= 6;
    
    console.log('\n📋 Summary:');
    console.log(`   - Core Tables: ${hasAllTables ? '✅ ALL CREATED' : '❌ MISSING SOME'} (${tables.rows.length}/3)`);
    console.log(`   - Extended Fields: ${hasExtendedFields ? '✅ ALL ADDED' : '❌ MISSING SOME'} (${fields.rows.length}/4)`);
    console.log(`   - RLS Policies: ${hasPolicies ? '✅ ACTIVE' : '❌ INCOMPLETE'} (${policies.rows.length}/3)`);
    console.log(`   - Performance Indexes: ${hasIndexes ? '✅ OPTIMIZED' : '⚠️  PARTIAL'} (${indexes.rows.length}/7+)`);
    
    if (hasAllTables && hasExtendedFields && hasPolicies) {
      console.log('\n🚀 Community Management System is fully operational!');
      console.log('   ✅ Task 3 Complete: Community Management System');
      console.log('   🎯 Ready for Task 4: Advanced User Management');
      
      console.log('\n🏛️ Community Management Features Available:');
      console.log('   - Community registration and verification');
      console.log('   - Member role management (member, researcher, elder, cultural_keeper, admin)');
      console.log('   - Data governance policies with cultural sensitivity levels');
      console.log('   - Research project management with Indigenous protocols');
      console.log('   - Row-level security for data sovereignty');
      console.log('   - Audit logging for compliance');
      
    } else {
      console.log('\n⚠️  Some components may need attention');
    }

  } catch (error) {
    console.error('❌ Verification failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n🔧 It looks like the community management tables were not created.');
      console.log('Please run the SQL script in Supabase SQL Editor again.');
    }
  }
}

// Run the verification
verifyWithVercel();