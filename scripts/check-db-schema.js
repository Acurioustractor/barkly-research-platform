const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Try to get just the basic info
    const doc = await prisma.document.findFirst({
      select: { id: true }
    });
    
    if (doc) {
      console.log('✅ Basic query works. Document ID:', doc.id);
      
      // Now test different field combinations
      const fields = ['id', 'filename', 'originalName', 'title', 'name', 'document_name', 'thumbnailPath'];
      
      for (const field of fields) {
        try {
          const query = { select: { id: true, [field]: true } };
          await prisma.document.findFirst(query);
          console.log(`✅ Field exists: ${field}`);
        } catch (error) {
          console.log(`❌ Field missing: ${field}`);
        }
      }
    } else {
      console.log('❌ No documents in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();