/**
 * Create mock thumbnails for existing documents to test the gallery view
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Simple function to create a colored rectangle as PNG (mock thumbnail)
function createMockThumbnailBuffer(text, color = '#3B82F6') {
  // This is a very basic PNG creation - in reality you'd use a library like sharp or canvas
  // For now, we'll just create a simple text-based "thumbnail"
  return Buffer.from(`Mock thumbnail for: ${text}`);
}

async function createMockThumbnails() {
  try {
    console.log('🎨 Creating mock thumbnails for existing documents...');
    
    // Ensure thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    // Get documents without thumbnails
    const documents = await prisma.document.findMany({
      where: {
        thumbnailPath: null,
        status: 'COMPLETED'
      },
      select: {
        id: true,
        originalName: true,
        filename: true
      }
    });

    console.log(`📄 Found ${documents.length} documents needing mock thumbnails`);

    for (const doc of documents) {
      try {
        const thumbnailFilename = `thumb-${doc.id}-1.png`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        
        // Create a simple text file as mock thumbnail (in reality this would be a PNG)
        const mockContent = `Mock Thumbnail\n\nDocument: ${doc.originalName || doc.filename}\nID: ${doc.id}\n\nThis is a placeholder thumbnail.\nReal thumbnails will be generated from PDF first pages.`;
        
        await fs.writeFile(thumbnailPath, mockContent);
        
        // Update database
        await prisma.document.update({
          where: { id: doc.id },
          data: { thumbnailPath: thumbnailFilename }
        });
        
        console.log(`✅ Created mock thumbnail for: ${doc.originalName || doc.filename}`);
        
      } catch (error) {
        console.error(`❌ Error creating mock thumbnail for ${doc.id}:`, error.message);
      }
    }

    console.log('🎉 Mock thumbnails created! Refresh the documents page to see them.');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMockThumbnails();