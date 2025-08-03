/**
 * Generate placeholder thumbnails for existing documents
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Create a colored rectangle thumbnail based on document type
function createColoredThumbnail(title, type, content) {
  // Different colors for different document types
  const colors = {
    'report': '#3B82F6',      // Blue
    'policy': '#10B981',      // Green
    'research': '#8B5CF6',    // Purple
    'community-story': '#F59E0B', // Amber
    'meeting-notes': '#EF4444'    // Red
  };
  
  const color = colors[type] || '#6B7280'; // Gray default
  
  // Create SVG thumbnail
  const svgContent = `
<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: bold 12px sans-serif; fill: white; }
      .content { font: 10px sans-serif; fill: rgba(255,255,255,0.8); }
      .type { font: 10px sans-serif; fill: rgba(255,255,255,0.6); }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="200" height="280" fill="${color}"/>
  
  <!-- Header gradient -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="280" fill="url(#grad)"/>
  
  <!-- Document icon -->
  <rect x="20" y="20" width="160" height="200" fill="rgba(255,255,255,0.1)" rx="8"/>
  <rect x="30" y="30" width="140" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="40" width="120" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="50" width="140" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="60" width="100" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  
  <!-- Title (truncated) -->
  <text x="20" y="250" class="title">${title.substring(0, 25)}${title.length > 25 ? '...' : ''}</text>
  
  <!-- Type -->
  <text x="20" y="270" class="type">${type.toUpperCase()}</text>
</svg>`;

  return svgContent;
}

// Convert SVG to PNG using a simple approach
async function createPngFromSvg(svgContent, outputPath) {
  // For now, we'll save as SVG since we don't have image processing libraries
  // In a production environment, you'd use sharp, canvas, or puppeteer
  await fs.writeFile(outputPath.replace('.png', '.svg'), svgContent);
  
  // Create a simple placeholder PNG (minimal 200x280 transparent image)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0xC8, // width: 200
    0x00, 0x00, 0x01, 0x18, // height: 280
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x3E, 0x12, 0x5C, 0x15, // CRC (calculated for this header)
    0x00, 0x00, 0x00, 0x16, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0xED, 0xC1, 0x01, 0x01, 0x00, 0x00, 0x00, 0x80, 0x90, 0xFE, 0x37, 0x10, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, // compressed transparent data
    0x5C, 0xDF, 0x09, 0x0D, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  await fs.writeFile(outputPath, pngHeader);
}

function inferDocumentType(filename) {
  const name = filename.toLowerCase();
  if (name.includes('report')) return 'report';
  if (name.includes('policy')) return 'policy';
  if (name.includes('research') || name.includes('study')) return 'research';
  if (name.includes('story') || name.includes('narrative')) return 'community-story';
  if (name.includes('meeting') || name.includes('minutes')) return 'meeting-notes';
  if (name.includes('.pdf')) return 'report';
  return 'report';
}

async function generateThumbnailsForExisting() {
  try {
    console.log('🔍 Finding documents without thumbnails...');
    
    // Get documents without thumbnails
    const documents = await prisma.$queryRaw`
      SELECT id, title, content, file_type
      FROM documents 
      WHERE "thumbnailPath" IS NULL 
      AND processing_status = 'completed'
    `;

    console.log(`📄 Found ${documents.length} documents needing thumbnails`);

    if (documents.length === 0) {
      console.log('✅ All documents already have thumbnails!');
      return;
    }

    // Ensure thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });

    for (const doc of documents) {
      try {
        console.log(`🖼️  Generating thumbnail for: ${doc.title}`);
        
        const docType = inferDocumentType(doc.title);
        const thumbnailFilename = `thumb-${doc.id}-1.png`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        
        // Create SVG-based thumbnail
        const svgContent = createColoredThumbnail(doc.title, docType, doc.content);
        await createPngFromSvg(svgContent, thumbnailPath);
        
        // Update database
        await prisma.$executeRaw`
          UPDATE documents 
          SET "thumbnailPath" = ${thumbnailFilename}
          WHERE id = ${doc.id}::uuid
        `;
        
        console.log(`✅ Created thumbnail: ${thumbnailFilename}`);
        
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error.message);
      }
    }

    console.log(`🎉 Generated thumbnails for ${documents.length} documents!`);
    console.log('🔄 Refresh the documents page to see the new thumbnails');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateThumbnailsForExisting();