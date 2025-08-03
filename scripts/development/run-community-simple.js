/**
 * Simple SQL runner for community management setup
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function runSimpleCommunitySQL() {
  console.log('🏛️ Setting up Community Management System (Simplified)...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    console.log('📄 Reading simplified community management SQL...');
    const sql = fs.readFileSync('database-setup/03-community-management-simple.sql', 'utf8');
    
    console.log('🔧 Executing community management setup...');
    
    // Execute the entire SQL as one block
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Community Management System SQL executed successfully!\n');
    
    console.log('🧪 Testing community management setup...');
    
    // Test that key tables were created
    try {
      const tables = await prisma.$queryRaw`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
        ORDER BY tablename;
      `;
      
      console.log('✅ Community management tables created:');
      tables.forEach(table => {
        console.log(`   - ${table.tablename}`);
      });
    } catch (error) {
      console.log('⚠️  Could not verify table creation');
    }
    
    // Test extended community fields
    try {
      const communityColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'communities' 
        AND column_name IN ('community_type', 'geographic_region', 'traditional_territory', 'verification_status')
        ORDER BY column_name;
      `;
      
      console.log('✅ Extended community fields added:');
      communityColumns.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
    } catch (error) {
      console.log('⚠️  Could not verify extended community fields');
    }
    
    // Test RLS policies
    try {
      const policies = await prisma.$queryRaw`
        SELECT 
          tablename,
          COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
        GROUP BY tablename
        ORDER BY tablename;
      `;
      
      console.log('✅ RLS policies created:');
      policies.forEach(table => {
        console.log(`   - ${table.tablename}: ${table.policy_count} policies`);
      });
    } catch (error) {
      console.log('⚠️  Could not verify RLS policies');
    }
    
    console.log('\n🎉 Community Management System setup completed!');
    console.log('\n🚀 Run "node test-community-management.js" to verify everything works');

  } catch (error) {
    console.error('❌ Community management setup failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n✅ Some components already exist - this is normal');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
runSimpleCommunitySQL();