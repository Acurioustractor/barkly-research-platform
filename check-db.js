const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    // Try to count documents
    const count = await prisma.document.count();
    console.log(`✅ Database connected! Found ${count} documents.`);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('\n📊 Database tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check for pgvector extension
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    
    if (extensions.length > 0) {
      console.log('\n✅ pgvector extension is installed');
    } else {
      console.log('\n⚠️  pgvector extension is NOT installed');
      console.log('   Run this in Supabase SQL editor: CREATE EXTENSION IF NOT EXISTS vector;');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\nPossible issues:');
    console.log('1. Check your DATABASE_URL in .env.local');
    console.log('2. Make sure the password is correct');
    console.log('3. Run migrations: npx prisma migrate deploy');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();