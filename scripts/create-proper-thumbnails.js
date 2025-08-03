/**
 * Create proper placeholder thumbnails for existing documents
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Create a simple colored square thumbnail (as data URL that can be converted to PNG)
function createColoredThumbnailData(title, type) {
  // Different colors for different document types
  const colors = {
    'report': '59, 130, 246',      // Blue
    'policy': '16, 185, 129',      // Green  
    'research': '139, 92, 246',    // Purple
    'community-story': '245, 158, 11', // Amber
    'meeting-notes': '239, 68, 68'     // Red
  };
  
  const color = colors[type] || '107, 114, 128'; // Gray default
  
  // Create a simple 200x280 colored rectangle with white text
  // This creates a data URL that browsers can display
  const canvas = `
<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="280" fill="rgb(${color})"/>
  <rect x="10" y="10" width="180" height="220" fill="rgba(255,255,255,0.1)" rx="8"/>
  
  <!-- Document icon -->
  <rect x="20" y="30" width="160" height="180" fill="rgba(255,255,255,0.05)" rx="4"/>
  <rect x="30" y="50" width="140" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>
  <rect x="30" y="70" width="120" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>
  <rect x="30" y="90" width="140" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>
  <rect x="30" y="110" width="100" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>
  <rect x="30" y="130" width="130" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>
  <rect x="30" y="150" width="110" height="8" fill="rgba(255,255,255,0.2)" rx="4"/>
  
  <!-- Title -->
  <text x="20" y="250" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">
    ${title.length > 22 ? title.substring(0, 22) + '...' : title}
  </text>
  
  <!-- Type badge -->
  <rect x="20" y="260" width="${type.length * 7 + 8}" height="16" fill="rgba(255,255,255,0.2)" rx="8"/>
  <text x="24" y="271" font-family="Arial, sans-serif" font-size="10" fill="white">
    ${type.toUpperCase()}
  </text>
</svg>`;

  return canvas;
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

async function createProperThumbnails() {
  try {
    console.log('🎨 Creating proper SVG thumbnails for existing documents...');
    
    // Get documents with broken thumbnails (the ones we created before)
    const documents = await prisma.$queryRaw`
      SELECT id, title, "thumbnailPath"
      FROM documents 
      WHERE "thumbnailPath" LIKE 'thumb-%'
      AND processing_status = 'completed'
    `;

    console.log(`🖼️ Found ${documents.length} documents needing proper thumbnails`);

    if (documents.length === 0) {
      console.log('✅ No documents need thumbnail fixes!');
      return;
    }

    // Ensure thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });

    for (const doc of documents) {
      try {
        console.log(`🎨 Creating proper thumbnail for: ${doc.title}`);
        
        const docType = inferDocumentType(doc.title);
        const svgContent = createColoredThumbnailData(doc.title, docType);
        
        // Save as SVG file (browsers can display SVG directly)
        const svgFilename = doc.thumbnailPath.replace('.png', '.svg');
        const svgPath = path.join(thumbnailsDir, svgFilename);
        await fs.writeFile(svgPath, svgContent);
        
        // Update database to point to SVG file
        await prisma.$executeRaw`
          UPDATE documents 
          SET "thumbnailPath" = ${svgFilename}
          WHERE id = ${doc.id}::uuid
        `;
        
        console.log(`✅ Created SVG thumbnail: ${svgFilename}`);
        
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error.message);
      }
    }

    console.log(`🎉 Created proper SVG thumbnails for ${documents.length} documents!`);
    console.log('🔄 Refresh the documents page to see the new thumbnails');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createProperThumbnails();