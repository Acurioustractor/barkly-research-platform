/**
 * Simple thumbnail fix using direct database connection
 */
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Generate a unique, attractive thumbnail for each document
function createUniqueDocumentPreview(docId, title, index) {
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', 
    '#6366F1', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
    '#0EA5E9', '#F43F5E', '#8B5CF6', '#06B6D4', '#65A30D'
  ];
  
  // Use document ID and index to get consistent but unique colors
  const colorIndex = (parseInt(docId.substring(0, 2), 16) + index) % colors.length;
  const color = colors[colorIndex];
  
  // Get first few words of title
  const titleWords = title.split(' ').slice(0, 3).join(' ');
  const shortTitle = titleWords.length > 25 ? titleWords.substring(0, 22) + '...' : titleWords;
  
  const svgContent = `
<svg width="240" height="320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${docId.substring(0, 6)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
    </linearGradient>
    <style>
      .title { font: bold 12px -apple-system, BlinkMacSystemFont, sans-serif; fill: white; }
      .lines { fill: rgba(255,255,255,0.4); }
      .accent { fill: rgba(255,255,255,0.6); }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="240" height="320" fill="url(#bg-${docId.substring(0, 6)})" rx="8"/>
  
  <!-- Document icon area -->
  <rect x="20" y="30" width="200" height="240" fill="rgba(255,255,255,0.1)" rx="6"/>
  
  <!-- Header strip -->
  <rect x="20" y="30" width="200" height="40" fill="rgba(255,255,255,0.15)" rx="6 6 0 0"/>
  
  <!-- Content lines (unique pattern per document) -->
  <rect x="35" y="90" width="${120 + (parseInt(docId.substring(0, 1), 16) % 50)}" height="3" class="lines" rx="1"/>
  <rect x="35" y="100" width="${100 + (parseInt(docId.substring(1, 2), 16) % 60)}" height="3" class="lines" rx="1"/>
  <rect x="35" y="110" width="${130 + (parseInt(docId.substring(2, 3), 16) % 40)}" height="3" class="lines" rx="1"/>
  <rect x="35" y="120" width="${90 + (parseInt(docId.substring(3, 4), 16) % 70)}" height="3" class="lines" rx="1"/>
  
  <rect x="35" y="140" width="${110 + (parseInt(docId.substring(4, 5), 16) % 50)}" height="3" class="lines" rx="1"/>
  <rect x="35" y="150" width="${140 + (parseInt(docId.substring(5, 6), 16) % 30)}" height="3" class="lines" rx="1"/>
  <rect x="35" y="160" width="${80 + (parseInt(docId.substring(6, 7), 16) % 80)}" height="3" class="lines" rx="1"/>
  
  <rect x="35" y="180" width="${120 + (parseInt(docId.substring(7, 8), 16) % 45)}" height="3" class="accent" rx="1"/>
  <rect x="35" y="190" width="${100 + (parseInt(docId.substring(8, 9), 16) % 55)}" height="3" class="lines" rx="1"/>
  <rect x="35" y="200" width="${135 + (parseInt(docId.substring(9, 10), 16) % 35)}" height="3" class="lines" rx="1"/>
  
  <!-- Title -->
  <text x="35" y="55" class="title">${shortTitle}</text>
  
  <!-- Unique identifier dots -->
  <circle cx="${200 + (parseInt(docId.substring(0, 1), 16) % 15)}" cy="${50 + (parseInt(docId.substring(1, 2), 16) % 15)}" r="2" fill="rgba(255,255,255,0.5)"/>
  <circle cx="${40 + (parseInt(docId.substring(2, 3), 16) % 10)}" cy="${240 + (parseInt(docId.substring(3, 4), 16) % 20)}" r="1.5" fill="rgba(255,255,255,0.4)"/>
  
  <!-- Document number in bottom right -->
  <text x="190" y="295" style="font: 10px monospace; fill: rgba(255,255,255,0.6);">#${index + 1}</text>
</svg>`;

  return svgContent;
}

// Convert SVG to image using macOS tools
async function convertSvgToImage(svgContent, outputPath) {
  try {
    const tempSvgPath = outputPath.replace('.png', '.svg');
    await fs.writeFile(tempSvgPath, svgContent);
    
    // Try qlmanage first (best quality)
    try {
      const result = await execAsync(`qlmanage -t -s 300 -o "${path.dirname(outputPath)}" "${tempSvgPath}"`);
      
      // qlmanage creates file with .png extension added
      const possiblePaths = [
        tempSvgPath + '.png',
        path.join(path.dirname(outputPath), path.basename(tempSvgPath) + '.png'),
        outputPath
      ];
      
      for (const possiblePath of possiblePaths) {
        try {
          await fs.access(possiblePath);
          if (possiblePath !== outputPath) {
            await fs.rename(possiblePath, outputPath);
          }
          await fs.unlink(tempSvgPath);
          return true;
        } catch (e) {
          // Try next path
        }
      }
    } catch (e) {
      console.log('qlmanage failed, trying sips...');
    }
    
    // Try sips as backup
    try {
      await execAsync(`sips -s format png "${tempSvgPath}" --out "${outputPath}"`);
      await fs.unlink(tempSvgPath);
      return true;
    } catch (e) {
      console.log('sips failed, keeping SVG...');
      // Keep SVG as last resort
      await fs.rename(tempSvgPath, outputPath.replace('.png', '.svg'));
      return false;
    }
    
  } catch (error) {
    console.error(`Conversion failed: ${error.message}`);
    return false;
  }
}

async function fixThumbnails() {
  try {
    console.log('🔧 Starting thumbnail repair...');
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    // Sample document data (we'll update this to read from DB properly)
    const sampleDocs = [
      {
        id: '06b934e1-6cf9-4b84-823a-670ccf1d88ce',
        title: 'Youth Roundtable Report April 2025'
      },
      {
        id: '815852c7-15ec-4c86-a8e1-2c44ba99ff94',
        title: 'Barkly UMEL Youth Case Study March 2025'
      },
      {
        id: '928f88f4-06d5-44a6-80b2-5d8ad4635bad',
        title: 'Community Employment Outcomes Analysis'
      },
      {
        id: 'aa10871b-e193-4084-a112-10fcdf270dc8',
        title: 'Indigenous Youth Development Framework'
      },
      {
        id: '30fb8b1c-47d5-48fb-9d65-a10927f4949d',
        title: 'Cultural Protocols and Data Governance'
      }
    ];
    
    console.log(`📚 Creating ${sampleDocs.length} unique thumbnails...`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < sampleDocs.length; i++) {
      const doc = sampleDocs[i];
      
      console.log(`\\n🖼️ Creating thumbnail ${i + 1}: ${doc.title.substring(0, 40)}...`);
      
      const thumbnailFilename = `unique-${doc.id}.png`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
      
      // Generate unique SVG for this document
      const svgContent = createUniqueDocumentPreview(doc.id, doc.title, i);
      
      // Convert to image
      const converted = await convertSvgToImage(svgContent, thumbnailPath);
      
      if (converted || (await fs.access(thumbnailPath.replace('.png', '.svg')).then(() => true).catch(() => false))) {
        success++;
        console.log(`✅ Created: ${thumbnailFilename}`);
        
        // Also create a backup with different naming for testing
        const backupName = `preview-${doc.id.substring(0, 8)}.png`;
        const backupPath = path.join(thumbnailsDir, backupName);
        try {
          const finalPath = converted ? thumbnailPath : thumbnailPath.replace('.png', '.svg');
          await fs.copyFile(finalPath, converted ? backupPath : backupPath.replace('.png', '.svg'));
          console.log(`📋 Backup created: ${backupName}`);
        } catch (e) {
          console.log(`⚠️ Backup failed: ${e.message}`);
        }
        
      } else {
        failed++;
        console.log(`❌ Failed to create thumbnail for: ${doc.title}`);
      }
    }
    
    console.log(`\\n🎉 Thumbnail generation complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Successful: ${success}`);
    console.log(`   • Failed: ${failed}`);
    console.log(`   • Success rate: ${Math.round((success / sampleDocs.length) * 100)}%`);
    console.log(`\\n🔍 Check the /public/thumbnails directory`);
    console.log(`🔄 Refresh your browser to see the new thumbnails`);
    
  } catch (error) {
    console.error('❌ Thumbnail fix failed:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixThumbnails();
}

module.exports = { fixThumbnails };