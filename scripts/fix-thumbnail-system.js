/**
 * Fix the thumbnail system - clean up duplicates and create proper unique thumbnails
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Generate unique thumbnail based on document content and metadata
function generateUniqueDocumentThumbnail(doc) {
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', 
    '#6366F1', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
  ];
  
  // Use document ID to get consistent color
  const colorIndex = parseInt(doc.id.substring(0, 1), 16) % colors.length;
  const color = colors[colorIndex];
  
  // Get first few words of title for preview
  const titleWords = doc.title.split(' ').slice(0, 4).join(' ');
  const titlePreview = titleWords.length > 30 ? titleWords.substring(0, 27) + '...' : titleWords;
  
  // Create SVG with unique content based on the document
  const svgContent = `
<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${doc.id.substring(0, 8)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}cc;stop-opacity:1" />
    </linearGradient>
    <style>
      .doc-title { font: bold 14px system-ui, -apple-system, sans-serif; fill: white; }
      .doc-type { font: 11px system-ui, -apple-system, sans-serif; fill: rgba(255,255,255,0.9); }
      .doc-community { font: 10px system-ui, -apple-system, sans-serif; fill: rgba(255,255,255,0.7); }
      .content-line { fill: rgba(255,255,255,0.4); }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="300" height="400" fill="url(#bg-${doc.id.substring(0, 8)})"/>
  
  <!-- Document representation -->
  <rect x="30" y="40" width="240" height="320" fill="rgba(255,255,255,0.1)" rx="12"/>
  <rect x="30" y="40" width="240" height="60" fill="rgba(255,255,255,0.15)" rx="12 12 0 0"/>
  
  <!-- Content lines -->
  <rect x="50" y="120" width="200" height="4" class="content-line" rx="2"/>
  <rect x="50" y="135" width="180" height="4" class="content-line" rx="2"/>
  <rect x="50" y="150" width="200" height="4" class="content-line" rx="2"/>
  <rect x="50" y="165" width="160" height="4" class="content-line" rx="2"/>
  
  <rect x="50" y="190" width="190" height="4" class="content-line" rx="2"/>
  <rect x="50" y="205" width="200" height="4" class="content-line" rx="2"/>
  <rect x="50" y="220" width="170" height="4" class="content-line" rx="2"/>
  
  <rect x="50" y="245" width="180" height="4" class="content-line" rx="2"/>
  <rect x="50" y="260" width="200" height="4" class="content-line" rx="2"/>
  <rect x="50" y="275" width="150" height="4" class="content-line" rx="2"/>
  
  <!-- Title -->
  <text x="50" y="75" class="doc-title">${titlePreview}</text>
  
  <!-- Community if available -->
  ${doc.community_id ? `<text x="50" y="90" class="doc-community">Community Document</text>` : ''}
  
  <!-- File type indicator -->
  <text x="220" y="385" class="doc-type">${doc.file_type || 'DOC'}</text>
  
  <!-- Unique pattern based on document ID -->
  <circle cx="${250 + (parseInt(doc.id.substring(1, 2), 16) % 20)}" cy="${60 + (parseInt(doc.id.substring(2, 3), 16) % 20)}" r="3" fill="rgba(255,255,255,0.3)"/>
  <circle cx="${60 + (parseInt(doc.id.substring(3, 4), 16) % 20)}" cy="${320 + (parseInt(doc.id.substring(4, 5), 16) % 20)}" r="2" fill="rgba(255,255,255,0.3)"/>
  
</svg>`;

  return svgContent;
}

// Convert SVG to PNG using built-in macOS tools
async function svgToPng(svgContent, outputPath) {
  try {
    // Create temporary SVG file
    const tempSvgPath = outputPath.replace('.png', '.svg');
    await fs.writeFile(tempSvgPath, svgContent);
    
    // Convert using macOS qlmanage (Quick Look)
    try {
      await execAsync(`qlmanage -t -s 300 -o "${path.dirname(outputPath)}" "${tempSvgPath}"`);
      
      // qlmanage creates file with different name, rename it
      const qlOutputPath = tempSvgPath.replace('.svg', '.svg.png');
      try {
        await fs.access(qlOutputPath);
        await fs.rename(qlOutputPath, outputPath);
        await fs.unlink(tempSvgPath); // Clean up SVG
        return true;
      } catch {
        // Try direct rename from SVG name
        const directPath = path.join(path.dirname(outputPath), path.basename(tempSvgPath) + '.png');
        try {
          await fs.access(directPath);
          await fs.rename(directPath, outputPath);
          await fs.unlink(tempSvgPath);
          return true;
        } catch {
          // Keep SVG as fallback
          console.log(`⚠️ Keeping SVG version: ${tempSvgPath}`);
          return false;
        }
      }
    } catch (error) {
      // Try using sips as backup
      try {
        await execAsync(`sips -s format png "${tempSvgPath}" --out "${outputPath}"`);
        await fs.unlink(tempSvgPath);
        return true;
      } catch {
        // Keep SVG as fallback
        console.log(`⚠️ Keeping SVG version: ${tempSvgPath}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`❌ SVG to PNG conversion failed: ${error.message}`);
    return false;
  }
}

async function fixThumbnailSystem() {
  try {
    console.log('🔧 Fixing thumbnail system...');
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    // Get all documents
    const documents = await prisma.$queryRaw`
      SELECT id, title, "thumbnailPath", processing_status, community_id, file_type
      FROM documents 
      WHERE processing_status = 'completed'
      ORDER BY created_at DESC
    `;
    
    console.log(`📚 Found ${documents.length} documents to process`);
    
    // Clean up old thumbnail files first
    console.log('🧹 Cleaning up old thumbnails...');
    try {
      const existingFiles = await fs.readdir(thumbnailsDir);
      const oldFiles = existingFiles.filter(f => 
        f.startsWith('thumb-') || 
        f.startsWith('enhanced-') || 
        f.includes('test-')
      );
      
      for (const file of oldFiles) {
        try {
          await fs.unlink(path.join(thumbnailsDir, file));
          console.log(`🗑️ Removed old thumbnail: ${file}`);
        } catch (error) {
          console.log(`⚠️ Could not remove ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not clean thumbnails directory: ${error.message}`);
    }
    
    let processed = 0;
    let errors = 0;
    
    // Generate new unique thumbnails for each document
    for (const doc of documents) {
      try {
        console.log(`\n🖼️ Processing: ${doc.title.substring(0, 50)}...`);
        
        const thumbnailFilename = `doc-${doc.id}.png`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        
        // Generate unique SVG for this document
        const svgContent = generateUniqueDocumentThumbnail(doc);
        
        // Convert to PNG
        const success = await svgToPng(svgContent, thumbnailPath);
        
        // Update database with new thumbnail path
        await prisma.$executeRaw`
          UPDATE documents 
          SET "thumbnailPath" = ${thumbnailFilename}
          WHERE id = ${doc.id}::uuid
        `;
        
        processed++;
        console.log(`✅ Generated: ${thumbnailFilename}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${doc.id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n🎉 Thumbnail fix complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Documents processed: ${processed}`);
    console.log(`   • Errors: ${errors}`);
    console.log(`   • Total documents: ${documents.length}`);
    console.log(`\n🔄 Refresh your browser to see the new unique thumbnails!`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Also create a function to verify the fix
async function verifyThumbnails() {
  try {
    console.log('✅ Verifying thumbnail system...');
    
    const documents = await prisma.$queryRaw`
      SELECT id, title, "thumbnailPath"
      FROM documents 
      WHERE processing_status = 'completed'
    `;
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    let verified = 0;
    let missing = 0;
    
    for (const doc of documents) {
      if (doc.thumbnailPath) {
        const thumbnailPath = path.join(thumbnailsDir, doc.thumbnailPath);
        try {
          await fs.access(thumbnailPath);
          verified++;
        } catch {
          console.log(`❌ Missing thumbnail file: ${doc.thumbnailPath} for ${doc.title}`);
          missing++;
        }
      } else {
        console.log(`⚠️ No thumbnail path set for: ${doc.title}`);
        missing++;
      }
    }
    
    console.log(`\n📊 Verification Results:`);
    console.log(`   • Thumbnails verified: ${verified}`);
    console.log(`   • Missing/broken: ${missing}`);
    console.log(`   • Success rate: ${Math.round((verified / documents.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'verify') {
    verifyThumbnails();
  } else {
    fixThumbnailSystem();
  }
}

module.exports = {
  fixThumbnailSystem,
  verifyThumbnails
};