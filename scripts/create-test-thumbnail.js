const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const prisma = new PrismaClient();

async function createTestThumbnails() {
  try {
    // Get a document to test with
    const doc = await prisma.document.findFirst({
      select: { id: true, filename: true }
    });
    
    if (!doc) {
      console.log('❌ No documents found');
      return;
    }
    
    console.log('📄 Testing with document:', doc);
    
    // Create a test thumbnail file
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    const thumbnailFilename = `thumb-${doc.id}-1.png`;
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
    
    // Create a simple test file (would be PNG in reality)
    await fs.writeFile(thumbnailPath, 'TEST THUMBNAIL CONTENT FOR DOCUMENT');
    
    // Update database
    await prisma.document.update({
      where: { id: doc.id },
      data: { thumbnailPath: thumbnailFilename }
    });
    
    console.log(`✅ Created test thumbnail: ${thumbnailFilename}`);
    console.log('📁 File created at:', thumbnailPath);
    console.log('🔄 Refresh the documents page to see the thumbnail');
    
    // Test the API endpoint
    console.log(`🔗 Test URL: http://localhost:3000/api/documents/${doc.id}/thumbnail`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestThumbnails();