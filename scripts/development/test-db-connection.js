/**
 * Test database connection directly
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    console.log('📡 Attempting to connect to database...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    console.log('📊 Testing document count query...');
    const count = await prisma.document.count();
    console.log(`✅ Found ${count} documents in database`);
    
    // Test creating a simple record
    console.log('📝 Testing document creation...');
    const testDoc = await prisma.document.create({
      data: {
        filename: 'test_connection.pdf',
        originalName: 'test_connection.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        source: 'test',
        category: 'test',
        status: 'COMPLETED'
      }
    });
    console.log(`✅ Created test document: ${testDoc.id}`);
    
    // Clean up test document
    await prisma.document.delete({
      where: { id: testDoc.id }
    });
    console.log('🧹 Cleaned up test document');
    
    console.log('\n🎉 Database is working perfectly!');
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Connection issue - possible fixes:');
      console.log('1. Check if Supabase project is paused');
      console.log('2. Verify DATABASE_URL in .env.local');
      console.log('3. Check if IP is whitelisted in Supabase');
    } else if (error.code === 'P2002') {
      console.log('\n🔧 Unique constraint violation - database schema might need updating');
    } else {
      console.log('\n🔧 Other database error - check Supabase dashboard');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();