/**
 * Enhanced thumbnail generation with multiple fallback strategies
 * Uses different approaches based on file type and availability
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

// Enhanced SVG thumbnail generator with better visual design
function createEnhancedThumbnail(title, type, metadata = {}) {
  const typeColors = {
    'pdf': { bg: '220, 38, 38', accent: '239, 68, 68' },      // Red gradient
    'docx': { bg: '37, 99, 235', accent: '59, 130, 246' },    // Blue gradient
    'report': { bg: '59, 130, 246', accent: '147, 197, 253' }, // Blue
    'policy': { bg: '16, 185, 129', accent: '52, 211, 153' },  // Green
    'research': { bg: '139, 92, 246', accent: '167, 139, 250' }, // Purple
    'community-story': { bg: '245, 158, 11', accent: '251, 191, 36' }, // Amber
    'meeting-notes': { bg: '239, 68, 68', accent: '248, 113, 113' }, // Red
    'default': { bg: '107, 114, 128', accent: '156, 163, 175' }  // Gray
  };
  
  const colors = typeColors[type] || typeColors['default'];
  const truncatedTitle = title.length > 18 ? title.substring(0, 18) + '...' : title;
  
  // Add visual elements based on content type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'report': return '📊';
      case 'policy': return '📋';
      case 'research': return '🔬';
      case 'community-story': return '📖';
      case 'meeting-notes': return '🗒️';
      default: return '📄';
    }
  };
  
  return `<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: bold 10px system-ui, sans-serif; fill: white; }
      .subtitle { font: 8px system-ui, sans-serif; fill: rgba(255,255,255,0.8); }
      .type { font: bold 9px system-ui, sans-serif; fill: rgba(255,255,255,0.9); }
      .icon { font: 16px system-ui, sans-serif; }
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(${colors.bg});stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(${colors.accent});stop-opacity:1" />
    </linearGradient>
    <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background with gradient -->
  <rect width="200" height="280" fill="url(#bgGrad)" rx="8"/>
  <rect width="200" height="280" fill="url(#overlayGrad)" rx="8"/>
  
  <!-- Document representation -->
  <rect x="15" y="20" width="170" height="210" fill="rgba(255,255,255,0.12)" rx="6" filter="url(#shadow)"/>
  
  <!-- Document header bar -->
  <rect x="20" y="25" width="160" height="20" fill="rgba(255,255,255,0.08)" rx="3"/>
  <circle cx="30" cy="35" r="3" fill="rgba(255,255,255,0.3)"/>
  <circle cx="40" cy="35" r="3" fill="rgba(255,255,255,0.3)"/>
  <circle cx="50" cy="35" r="3" fill="rgba(255,255,255,0.3)"/>
  
  <!-- Document content lines -->
  <rect x="25" y="55" width="150" height="3" fill="rgba(255,255,255,0.25)" rx="1.5"/>
  <rect x="25" y="65" width="130" height="3" fill="rgba(255,255,255,0.25)" rx="1.5"/>
  <rect x="25" y="75" width="145" height="3" fill="rgba(255,255,255,0.25)" rx="1.5"/>
  <rect x="25" y="85" width="110" height="3" fill="rgba(255,255,255,0.25)" rx="1.5"/>
  <rect x="25" y="95" width="140" height="3" fill="rgba(255,255,255,0.25)" rx="1.5"/>
  <rect x="25" y="105" width="125" height="3" fill="rgba(255,255,255,0.25)" rx="1.5"/>
  
  <!-- Key content highlight -->
  <rect x="25" y="120" width="120" height="3" fill="rgba(255,255,255,0.4)" rx="1.5"/>
  <rect x="25" y="130" width="135" height="3" fill="rgba(255,255,255,0.3)" rx="1.5"/>
  
  <!-- Type icon -->
  <text x="155" y="205" class="icon" text-anchor="middle">${getTypeIcon(type)}</text>
  
  <!-- Title and metadata -->
  <text x="15" y="250" class="title">${truncatedTitle}</text>
  <text x="15" y="265" class="subtitle">${new Date().toLocaleDateString()}</text>
  <text x="15" y="275" class="type">${type.toUpperCase()}</text>
  
  <!-- Status indicator -->
  <circle cx="185" cy="250" r="4" fill="rgba(34, 197, 94, 0.8)"/>
</svg>`;
}

// Try to use system tools for PDF thumbnail generation
async function trySystemPDFConversion(pdfPath, outputPath) {
  return new Promise((resolve) => {
    // Try different system commands
    const commands = [
      // macOS Preview
      ['qlmanage', ['-t', '-s', '400', '-o', path.dirname(outputPath), pdfPath]],
      // ImageMagick (if available)
      ['convert', ['-density', '150', `${pdfPath}[0]`, '-quality', '90', '-resize', '200x280', outputPath]],
      // sips (macOS built-in)
      ['sips', ['-s', 'format', 'png', '-Z', '280', pdfPath, '--out', outputPath]]
    ];
    
    let commandIndex = 0;
    
    function tryNextCommand() {
      if (commandIndex >= commands.length) {
        console.log(`⚠️ All PDF conversion methods failed for: ${path.basename(pdfPath)}`);
        resolve(false);
        return;
      }
      
      const [cmd, args] = commands[commandIndex];
      console.log(`🔄 Trying: ${cmd} ${args.join(' ')}`);
      
      const proc = spawn(cmd, args, { stdio: 'pipe' });
      
      proc.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ PDF conversion successful with: ${cmd}`);
          resolve(true);
        } else {
          console.log(`❌ ${cmd} failed with code: ${code}`);
          commandIndex++;
          tryNextCommand();
        }
      });
      
      proc.on('error', (err) => {
        console.log(`❌ ${cmd} not available: ${err.message}`);
        commandIndex++;
        tryNextCommand();
      });
    }
    
    tryNextCommand();
  });
}

async function findDocumentFile(documentId, title) {
  const searchPaths = [
    path.join(process.cwd(), 'test-documents'),
    path.join(process.cwd(), 'docs'),
    process.cwd(),
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'public', 'uploads')
  ];
  
  const cleanTitle = title.replace(/[^\w\s\-\.]/g, '').trim();
  const extensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
  
  for (const searchPath of searchPaths) {
    try {
      const files = await fs.readdir(searchPath);
      
      // Look for exact matches
      for (const ext of extensions) {
        const exactFile = files.find(file => 
          file.toLowerCase() === title.toLowerCase() ||
          file.toLowerCase() === cleanTitle.toLowerCase() ||
          file.toLowerCase() === (cleanTitle + ext).toLowerCase()
        );
        
        if (exactFile) {
          const fullPath = path.join(searchPath, exactFile);
          const stats = await fs.stat(fullPath);
          if (stats.isFile()) {
            console.log(`📄 Found document: ${fullPath}`);
            return { path: fullPath, type: path.extname(exactFile).slice(1) };
          }
        }
      }
      
      // Look for partial matches
      const titleWords = cleanTitle.toLowerCase().split(' ').filter(w => w.length > 2);
      const partialMatch = files.find(file => {
        const fileName = file.toLowerCase();
        return extensions.some(ext => fileName.endsWith(ext)) &&
               titleWords.some(word => fileName.includes(word));
      });
      
      if (partialMatch) {
        const fullPath = path.join(searchPath, partialMatch);
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          console.log(`📄 Found document (partial): ${fullPath}`);
          return { path: fullPath, type: path.extname(partialMatch).slice(1) };
        }
      }
      
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  return null;
}

function inferDocumentType(filename) {
  const name = filename.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  if (name.includes('report')) return 'report';
  if (name.includes('policy')) return 'policy';
  if (name.includes('research') || name.includes('study')) return 'research';
  if (name.includes('story') || name.includes('narrative')) return 'community-story';
  if (name.includes('meeting') || name.includes('minutes')) return 'meeting-notes';
  return 'document';
}

async function generateEnhancedThumbnails() {
  try {
    console.log('🚀 Starting enhanced thumbnail generation...');
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    // Get all completed documents
    const documents = await prisma.$queryRaw`
      SELECT id, title, "thumbnailPath", processing_status, created_at
      FROM documents 
      WHERE processing_status = 'completed'
      ORDER BY created_at DESC
    `;

    console.log(`📚 Found ${documents.length} completed documents`);

    let realThumbnails = 0;
    let enhancedSVGs = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        console.log(`\n📖 Processing: ${doc.title}`);
        
        const docType = inferDocumentType(doc.title);
        const thumbnailFilename = `enhanced-${doc.id}.png`;
        const svgFilename = `enhanced-${doc.id}.svg`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        const svgPath = path.join(thumbnailsDir, svgFilename);
        
        // Check if enhanced thumbnail already exists
        try {
          await fs.access(thumbnailPath);
          console.log(`✅ Enhanced thumbnail exists: ${thumbnailFilename}`);
          continue;
        } catch {
          // Doesn't exist, create it
        }
        
        // Try to find the actual document file
        const docFile = await findDocumentFile(doc.id, doc.title);
        
        if (docFile && docFile.type === 'pdf') {
          console.log(`🎨 Attempting PDF thumbnail generation...`);
          const success = await trySystemPDFConversion(docFile.path, thumbnailPath);
          
          if (success) {
            // Update database to point to real thumbnail
            await prisma.$executeRaw`
              UPDATE documents 
              SET "thumbnailPath" = ${thumbnailFilename}
              WHERE id = ${doc.id}::uuid
            `;
            
            realThumbnails++;
            console.log(`✅ Real PDF thumbnail created: ${thumbnailFilename}`);
            continue;
          }
        }
        
        // Generate enhanced SVG thumbnail
        console.log(`🎨 Generating enhanced SVG thumbnail...`);
        const svgContent = createEnhancedThumbnail(doc.title, docType, {
          hasFile: !!docFile,
          fileType: docFile?.type || 'unknown'
        });
        
        await fs.writeFile(svgPath, svgContent);
        
        // Update database to point to enhanced SVG thumbnail
        await prisma.$executeRaw`
          UPDATE documents 
          SET "thumbnailPath" = ${svgFilename}
          WHERE id = ${doc.id}::uuid
        `;
        
        enhancedSVGs++;
        console.log(`✅ Enhanced SVG thumbnail created: ${svgFilename}`);
        
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n🎉 Enhanced thumbnail generation complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Real PDF thumbnails: ${realThumbnails}`);
    console.log(`   • Enhanced SVG thumbnails: ${enhancedSVGs}`);
    console.log(`   • Errors: ${errors}`);
    console.log(`   • Total processed: ${documents.length}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test function
async function testThumbnailGeneration() {
  try {
    console.log('🧪 Testing enhanced thumbnail generation...');
    
    const testPDF = path.join(process.cwd(), 'test-documents', 'simple-test.pdf');
    const outputPath = path.join(process.cwd(), 'public', 'thumbnails', 'test-enhanced.png');
    
    try {
      await fs.access(testPDF);
      console.log(`✅ Test PDF found: ${testPDF}`);
      
      const success = await trySystemPDFConversion(testPDF, outputPath);
      
      if (success) {
        console.log(`✅ Test PDF conversion successful!`);
      } else {
        console.log(`⚠️ PDF conversion failed, testing SVG generation...`);
        
        const svgPath = path.join(process.cwd(), 'public', 'thumbnails', 'test-enhanced.svg');
        const svgContent = createEnhancedThumbnail('Test Document', 'pdf');
        await fs.writeFile(svgPath, svgContent);
        
        console.log(`✅ Test SVG generated: ${svgPath}`);
      }
      
    } catch (error) {
      console.log(`⚠️ Test PDF not found, testing SVG only...`);
      
      const svgPath = path.join(process.cwd(), 'public', 'thumbnails', 'test-enhanced.svg');
      const svgContent = createEnhancedThumbnail('Sample Document Title', 'report');
      await fs.writeFile(svgPath, svgContent);
      
      console.log(`✅ Test SVG generated: ${svgPath}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'test') {
    testThumbnailGeneration();
  } else {
    generateEnhancedThumbnails();
  }
}

module.exports = {
  generateEnhancedThumbnails,
  testThumbnailGeneration,
  createEnhancedThumbnail,
  trySystemPDFConversion
};