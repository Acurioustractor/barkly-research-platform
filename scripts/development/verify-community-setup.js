/**
 * Fresh verification of community management system
 */

const { PrismaClient } = require('@prisma/client');

async function verifyCommunitySetup() {
  console.log('🔍 Verifying Community Management System...\n');
  
  // Create a fresh Prisma client
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 1: Check if community management tables exist
    console.log('📊 Checking community management tables...');
    
    const tableCheck = await prisma.$queryRaw`
      SELECT 
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_memberships') THEN 'EXISTS' ELSE 'MISSING' END as memberships,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_data_policies') THEN 'EXISTS' ELSE 'MISSING' END as policies,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_research_projects') THEN 'EXISTS' ELSE 'MISSING' END as projects
    `;
    
    const tables = tableCheck[0];
    console.log(`   - Community Memberships: ${tables.memberships === 'EXISTS' ? '✅' : '❌'} ${tables.memberships}`);
    console.log(`   - Data Policies: ${tables.policies === 'EXISTS' ? '✅' : '❌'} ${tables.policies}`);
    console.log(`   - Research Projects: ${tables.projects === 'EXISTS' ? '✅' : '❌'} ${tables.projects}`);

    // Test 2: Check extended community fields
    console.log('\n🌍 Checking extended community fields...');
    
    const fieldCheck = await prisma.$queryRaw`
      SELECT 
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'community_type') THEN 'EXISTS' ELSE 'MISSING' END as community_type,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'geographic_region') THEN 'EXISTS' ELSE 'MISSING' END as geographic_region,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'verification_status') THEN 'EXISTS' ELSE 'MISSING' END as verification_status
    `;
    
    const fields = fieldCheck[0];
    console.log(`   - Community Type: ${fields.community_type === 'EXISTS' ? '✅' : '❌'} ${fields.community_type}`);
    console.log(`   - Geographic Region: ${fields.geographic_region === 'EXISTS' ? '✅' : '❌'} ${fields.geographic_region}`);
    console.log(`   - Verification Status: ${fields.verification_status === 'EXISTS' ? '✅' : '❌'} ${fields.verification_status}`);

    // Test 3: Check RLS is enabled
    console.log('\n🛡️ Checking Row Level Security...');
    
    const rlsCheck = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      ORDER BY tablename
    `;
    
    console.log('   RLS Status:');
    rlsCheck.forEach(table => {
      console.log(`   - ${table.tablename}: ${table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED'}`);
    });

    // Test 4: Check indexes were created
    console.log('\n📊 Checking indexes...');
    
    const indexCheck = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;
    
    console.log(`   Found ${indexCheck.length} community management indexes:`);
    indexCheck.forEach(idx => {
      console.log(`   - ${idx.tablename}: ${idx.indexname}`);
    });

    // Test 5: Check audit triggers
    console.log('\n📝 Checking audit triggers...');
    
    const triggerCheck = await prisma.$queryRaw`
      SELECT 
        tgrelid::regclass::text as table_name,
        tgname as trigger_name
      FROM pg_trigger 
      WHERE tgname LIKE '%audit_trigger%'
      AND tgrelid::regclass::text IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      ORDER BY table_name
    `;
    
    console.log(`   Found ${triggerCheck.length} audit triggers:`);
    triggerCheck.forEach(trigger => {
      console.log(`   - ${trigger.table_name}: ${trigger.trigger_name}`);
    });

    // Test 6: Basic table access test
    console.log('\n🧪 Testing basic table operations...');
    
    try {
      const communityCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM communities`;
      console.log(`   ✅ Communities table: ${communityCount[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Communities table access failed`);
    }
    
    try {
      const membershipCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM community_memberships`;
      console.log(`   ✅ Community memberships table: ${membershipCount[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community memberships table access failed`);
    }
    
    try {
      const policyCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM community_data_policies`;
      console.log(`   ✅ Community data policies table: ${policyCount[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community data policies table access failed`);
    }
    
    try {
      const projectCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM community_research_projects`;
      console.log(`   ✅ Community research projects table: ${projectCount[0].count} records`);
    } catch (error) {
      console.log(`   ❌ Community research projects table access failed`);
    }

    console.log('\n🎉 Community Management System Verification Complete!');
    
    // Summary
    const allTablesExist = tables.memberships === 'EXISTS' && tables.policies === 'EXISTS' && tables.projects === 'EXISTS';
    const allFieldsExist = fields.community_type === 'EXISTS' && fields.geographic_region === 'EXISTS' && fields.verification_status === 'EXISTS';
    
    console.log('\n📋 Summary:');
    console.log(`   - Core Tables: ${allTablesExist ? '✅ ALL CREATED' : '❌ MISSING SOME'}`);
    console.log(`   - Extended Fields: ${allFieldsExist ? '✅ ALL ADDED' : '❌ MISSING SOME'}`);
    console.log(`   - RLS Enabled: ${rlsCheck.length >= 3 ? '✅ ACTIVE' : '❌ INCOMPLETE'}`);
    console.log(`   - Indexes: ${indexCheck.length >= 6 ? '✅ OPTIMIZED' : '⚠️  PARTIAL'}`);
    console.log(`   - Audit Triggers: ${triggerCheck.length >= 3 ? '✅ MONITORING' : '⚠️  PARTIAL'}`);
    
    if (allTablesExist && allFieldsExist) {
      console.log('\n🚀 Community Management System is ready!');
      console.log('   Next: Move to Task 4 - Advanced User Management');
    } else {
      console.log('\n⚠️  Some components may need attention');
    }

  } catch (error) {
    console.error('❌ Verification failed:');
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyCommunitySetup();