/**
 * Create simple, unique PNG thumbnails for each document
 */
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Create a simple, unique thumbnail for each document
function createSimpleDocumentThumbnail(doc, index) {
  const colors = [
    '#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c',
    '#0891b2', '#be185d', '#9333ea', '#c2410c', '#0f766e'
  ];
  
  // Use index for consistent color
  const color = colors[index % colors.length];
  const lightColor = color + '20'; // Add transparency
  
  // Truncate title
  const title = doc.title.length > 25 ? doc.title.substring(0, 22) + '...' : doc.title;
  
  // Create unique visual elements based on document ID
  const idNum = parseInt(doc.id.substring(0, 8), 16);
  const pattern1 = idNum % 100;
  const pattern2 = (idNum >> 8) % 80;
  const pattern3 = (idNum >> 16) % 60;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 300px;
      height: 400px;
      background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      position: relative;
      overflow: hidden;
    }
    
    .document-frame {
      position: absolute;
      top: 30px;
      left: 30px;
      right: 30px;
      bottom: 80px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    
    .doc-header {
      height: 30px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      margin-bottom: 15px;
      position: relative;
      display: flex;
      align-items: center;
      padding: 0 10px;
    }
    
    .doc-dots {
      display: flex;
      gap: 4px;
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }  
    .dot.green { background: #10b981; }
    
    .content-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 10px;
    }
    
    .line {
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
    
    .line.highlight {
      background: ${color}66;
    }
    
    .title {
      position: absolute;
      bottom: 20px;
      left: 30px;
      right: 30px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      line-height: 1.2;
    }
    
    .doc-type {
      position: absolute;
      top: 20px;
      right: 30px;
      color: white;
      font-size: 24px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }
    
    .unique-pattern {
      position: absolute;
      top: ${pattern1}px;
      right: ${pattern2}px;
      width: 6px;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
    }
    
    .unique-pattern2 {
      position: absolute;
      bottom: ${pattern3}px;
      left: ${pattern1 % 50 + 20}px;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div class="document-frame">
    <div class="doc-header">
      <div class="doc-dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
    </div>
    
    <div class="content-lines">
      <div class="line" style="width: ${70 + (pattern1 % 25)}%;"></div>
      <div class="line" style="width: ${60 + (pattern2 % 30)}%;"></div>
      <div class="line highlight" style="width: ${80 + (pattern3 % 15)}%;"></div>
      <div class="line" style="width: ${50 + (pattern1 % 40)}%;"></div>
      <div class="line" style="width: ${85 + (pattern2 % 10)}%;"></div>
      <div class="line" style="width: ${45 + (pattern3 % 35)}%;"></div>
      <div class="line" style="width: ${75 + (pattern1 % 20)}%;"></div>
      <div class="line highlight" style="width: ${55 + (pattern2 % 25)}%;"></div>
      <div class="line" style="width: ${90 + (pattern3 % 5)}%;"></div>
    </div>
  </div>
  
  <div class="title">${title}</div>
  
  <div class="doc-type">
    ${doc.title.includes('.pdf') ? '📄' : 
      doc.title.includes('.docx') ? '📝' : 
      doc.title.includes('.md') ? '📋' : '📄'}
  </div>
  
  <div class="unique-pattern"></div>
  <div class="unique-pattern2"></div>
</body>
</html>`;

  return htmlContent;
}

// Convert HTML to PNG using system tools
async function htmlToPng(htmlContent, outputPath, docTitle) {
  try {
    const tempHtmlPath = outputPath.replace('.png', '.html');
    await fs.writeFile(tempHtmlPath, htmlContent);
    
    console.log(`🔄 Converting ${docTitle}...`);
    
    // Try different conversion methods
    const methods = [
      // Method 1: webkit2png (if available)
      async () => {
        try {
          await execAsync(`webkit2png -F -W 300 -H 400 --delay=1 --filename="${outputPath.replace('.png', '')}" "${tempHtmlPath}"`);
          return true;
        } catch (e) {
          return false;
        }
      },
      
      // Method 2: wkhtmltoimage (if available)
      async () => {
        try {
          await execAsync(`wkhtmltoimage --width 300 --height 400 "${tempHtmlPath}" "${outputPath}"`);
          return true;
        } catch (e) {
          return false;
        }
      },
      
      // Method 3: Use Chrome headless (if available)
      async () => {
        try {
          await execAsync(`google-chrome --headless --disable-gpu --screenshot="${outputPath}" --window-size=300,400 --virtual-time-budget=1000 "${tempHtmlPath}"`);
          return true;
        } catch (e) {
          return false;
        }
      }
    ];
    
    for (const method of methods) {
      try {
        const success = await method();
        if (success) {
          // Check if file was created
          try {
            await fs.access(outputPath);
            await fs.unlink(tempHtmlPath); // Clean up HTML
            return true;
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    // If all methods fail, keep the HTML as reference and create a simple fallback
    console.log(`⚠️ Conversion failed for ${docTitle}, creating SVG fallback...`);
    
    // Create SVG fallback
    const svgContent = createSvgFallback(docTitle, outputPath);
    await fs.writeFile(outputPath.replace('.png', '.svg'), svgContent);
    await fs.unlink(tempHtmlPath);
    
    return false;
    
  } catch (error) {
    console.error(`❌ HTML to PNG conversion failed for ${docTitle}:`, error.message);
    return false;
  }
}

function createSvgFallback(title, outputPath) {
  const colors = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c'];
  const colorIndex = title.length % colors.length;
  const color = colors[colorIndex];
  
  const shortTitle = title.length > 20 ? title.substring(0, 17) + '...' : title;
  
  return `
<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="300" height="400" fill="url(#bg)" rx="8"/>
  
  <rect x="30" y="30" width="240" height="280" fill="rgba(255,255,255,0.95)" rx="8"/>
  
  <rect x="40" y="50" width="220" height="20" fill="rgba(0,0,0,0.05)" rx="4"/>
  <circle cx="50" cy="60" r="3" fill="#ef4444"/>
  <circle cx="62" cy="60" r="3" fill="#f59e0b"/>
  <circle cx="74" cy="60" r="3" fill="#10b981"/>
  
  <rect x="50" y="90" width="180" height="3" fill="rgba(0,0,0,0.1)" rx="1"/>
  <rect x="50" y="100" width="160" height="3" fill="rgba(0,0,0,0.1)" rx="1"/>
  <rect x="50" y="110" width="200" height="3" fill="${color}66" rx="1"/>
  <rect x="50" y="120" width="140" height="3" fill="rgba(0,0,0,0.1)" rx="1"/>
  <rect x="50" y="130" width="190" height="3" fill="rgba(0,0,0,0.1)" rx="1"/>
  
  <text x="30" y="360" style="font: bold 14px sans-serif; fill: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">${shortTitle}</text>
  <text x="250" y="55" style="font: 20px sans-serif; fill: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">📄</text>
</svg>`;
}

async function createUniqueDocumentThumbnails() {
  try {
    console.log('🎨 Creating simple, unique document thumbnails...');
    
    // Get documents from API
    const response = await fetch('http://localhost:3000/api/documents/overview');
    const data = await response.json();
    const documents = data.documents || [];
    
    console.log(`📚 Found ${documents.length} documents to process`);
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    let created = 0;
    let failed = 0;
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      try {
        console.log(`\\n🖼️ Processing ${i + 1}/${documents.length}: ${doc.title.substring(0, 40)}...`);
        
        const thumbnailFilename = `simple-${doc.id}.png`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        
        // Check if already exists
        try {
          await fs.access(thumbnailPath);
          console.log(`✅ Already exists: ${thumbnailFilename}`);
          continue;
        } catch (e) {
          // Doesn't exist, create it
        }
        
        // Create HTML content
        const htmlContent = createSimpleDocumentThumbnail(doc, i);
        
        // Convert to PNG
        const success = await htmlToPng(htmlContent, thumbnailPath, doc.title);
        
        if (success) {
          created++;
          console.log(`✅ Created PNG: ${thumbnailFilename}`);
        } else {
          // Check if SVG fallback was created
          const svgPath = thumbnailPath.replace('.png', '.svg');
          try {
            await fs.access(svgPath);
            console.log(`✅ Created SVG fallback: ${path.basename(svgPath)}`);
            created++;
          } catch (e) {
            failed++;
            console.log(`❌ Failed completely: ${doc.title}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${doc.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\\n🎉 Thumbnail creation complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Created: ${created}`);
    console.log(`   • Failed: ${failed}`);
    console.log(`   • Success rate: ${Math.round((created / documents.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

if (require.main === module) {
  createUniqueDocumentThumbnails();
}

module.exports = { createUniqueDocumentThumbnails };