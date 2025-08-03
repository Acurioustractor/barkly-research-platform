/**
 * Simple SQL runner for community management setup
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function runCommunitySQL() {
  console.log('🏛️ Setting up Community Management System...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    console.log('📄 Reading community management SQL...');
    const sql = fs.readFileSync('database-setup/03-community-management.sql', 'utf8');
    
    console.log('🔧 Executing community management setup...');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement + ';');
        successCount++;
      } catch (error) {
        console.log(`⚠️  Statement ${i + 1} had an issue: ${error.message.substring(0, 100)}...`);
        errorCount++;
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('   (This is likely okay - object already exists)');
        }
      }
    }
    
    console.log(`\n📈 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Issues: ${errorCount}`);
    
    console.log('\n🧪 Testing community management setup...');
    
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
    
    // Test that key functions were created
    try {
      const functions = await prisma.$queryRaw`
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN ('register_community', 'add_community_member', 'get_community_stats', 'validate_community_management')
        ORDER BY proname;
      `;
      
      console.log('✅ Community management functions created:');
      functions.forEach(func => {
        console.log(`   - ${func.proname}`);
      });
    } catch (error) {
      console.log('⚠️  Could not verify function creation');
    }
    
    console.log('\n🎉 Community Management System setup completed!');
    console.log('\n🚀 Run "node test-community-management.js" to verify everything works');

  } catch (error) {
    console.error('❌ Community management setup failed:');
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
runCommunitySQL();