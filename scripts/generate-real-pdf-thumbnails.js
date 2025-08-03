/**
 * Generate real PDF preview thumbnails using pdf-poppler
 * This script creates actual first-page previews for PDF documents
 */
const { PrismaClient } = require('@prisma/client');
const pdfPoppler = require('pdf-poppler');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Configuration for thumbnail generation
const THUMBNAIL_CONFIG = {
  format: 'png',
  out_dir: path.join(process.cwd(), 'public', 'thumbnails'),
  out_prefix: 'pdf-preview',
  page: 1, // Only first page
  scale: 1024, // Good quality
  single_file: true
};

// Fallback SVG generator for non-PDF files or when PDF processing fails
function createFallbackThumbnail(title, type) {
  const colors = {
    'report': '59, 130, 246',      // Blue
    'policy': '16, 185, 129',      // Green  
    'research': '139, 92, 246',    // Purple
    'community-story': '245, 158, 11', // Amber
    'meeting-notes': '239, 68, 68',    // Red
    'pdf': '220, 38, 38',              // Red for PDFs
    'docx': '37, 99, 235',             // Blue for Word docs
    'default': '107, 114, 128'         // Gray default
  };
  
  const color = colors[type] || colors['default'];
  
  return `<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: bold 11px sans-serif; fill: white; }
      .type { font: 10px sans-serif; fill: rgba(255,255,255,0.8); }
    </style>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="200" height="280" fill="rgb(${color})"/>
  <rect width="200" height="280" fill="url(#grad)"/>
  
  <!-- Document icon -->
  <rect x="20" y="20" width="160" height="200" fill="rgba(255,255,255,0.1)" rx="8"/>
  <rect x="30" y="35" width="140" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="45" width="120" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="55" width="140" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="65" width="100" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="80" width="130" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <rect x="30" y="90" width="110" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  
  <!-- File type icon -->
  <circle cx="160" cy="40" r="15" fill="rgba(255,255,255,0.2)"/>
  <text x="160" y="45" text-anchor="middle" font-size="12" fill="white">${type.toUpperCase().substring(0,3)}</text>
  
  <!-- Title (truncated) -->
  <text x="20" y="250" class="title">${title.length > 20 ? title.substring(0, 20) + '...' : title}</text>
  
  <!-- Type -->
  <text x="20" y="270" class="type">${type.toUpperCase()}</text>
</svg>`;
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

async function findPDFFile(documentId, title) {
  // Common locations where PDFs might be stored
  const possiblePaths = [
    // Test documents
    path.join(process.cwd(), 'test-documents'),
    // Docs folder
    path.join(process.cwd(), 'docs'),
    // Root directory
    process.cwd(),
    // Potential uploads directory
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'public', 'uploads')
  ];
  
  // Clean title for filename matching
  const cleanTitle = title.replace(/[^\w\s-\.]/g, '').trim();
  
  for (const dir of possiblePaths) {
    try {
      const files = await fs.readdir(dir);
      
      // Look for exact match first
      const exactMatch = files.find(file => 
        file.toLowerCase() === title.toLowerCase() ||
        file.toLowerCase() === cleanTitle.toLowerCase()
      );
      
      if (exactMatch && exactMatch.toLowerCase().endsWith('.pdf')) {
        const fullPath = path.join(dir, exactMatch);
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          console.log(`📄 Found PDF: ${fullPath}`);
          return fullPath;
        }
      }
      
      // Look for partial matches
      const partialMatch = files.find(file => {
        const fileName = file.toLowerCase();
        const titleWords = cleanTitle.toLowerCase().split(' ').filter(w => w.length > 2);
        return fileName.endsWith('.pdf') && 
               titleWords.some(word => fileName.includes(word));
      });
      
      if (partialMatch) {
        const fullPath = path.join(dir, partialMatch);
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          console.log(`📄 Found PDF (partial match): ${fullPath}`);
          return fullPath;
        }
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  return null;
}

async function generatePDFThumbnail(pdfPath, outputPath) {
  try {
    console.log(`🎨 Generating PDF thumbnail: ${path.basename(pdfPath)}`);
    
    const options = {
      ...THUMBNAIL_CONFIG,
      out_dir: path.dirname(outputPath),
      out_prefix: path.basename(outputPath, '.png')
    };
    
    // Generate thumbnail using pdf-poppler
    await pdfPoppler.convert(pdfPath, options);
    
    // pdf-poppler creates files with suffix -1.png, rename to our desired name
    const generatedFile = path.join(path.dirname(outputPath), `${options.out_prefix}-1.png`);
    
    try {
      await fs.access(generatedFile);
      await fs.rename(generatedFile, outputPath);
      console.log(`✅ PDF thumbnail generated: ${path.basename(outputPath)}`);
      return true;
    } catch (renameError) {
      console.warn(`⚠️ Generated file not found, trying alternative: ${generatedFile}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ PDF thumbnail generation failed: ${error.message}`);
    return false;
  }
}

async function generateRealThumbnails() {
  try {
    console.log('🚀 Starting real PDF thumbnail generation...');
    
    // Ensure thumbnails directory exists
    await fs.mkdir(THUMBNAIL_CONFIG.out_dir, { recursive: true });
    
    // Get all documents, prioritizing PDFs
    const documents = await prisma.$queryRaw`
      SELECT id, title, "thumbnailPath", processing_status
      FROM documents 
      WHERE processing_status = 'completed'
      ORDER BY 
        CASE WHEN LOWER(title) LIKE '%.pdf' THEN 1 ELSE 2 END,
        created_at DESC
    `;

    console.log(`📚 Found ${documents.length} completed documents`);

    let pdfProcessed = 0;
    let fallbackGenerated = 0;
    let skipped = 0;

    for (const doc of documents) {
      try {
        console.log(`\n📖 Processing: ${doc.title}`);
        
        const docType = inferDocumentType(doc.title);
        const thumbnailFilename = `thumb-${doc.id}-real.png`;
        const thumbnailPath = path.join(THUMBNAIL_CONFIG.out_dir, thumbnailFilename);
        
        // Check if real thumbnail already exists
        try {
          await fs.access(thumbnailPath);
          console.log(`✅ Real thumbnail already exists: ${thumbnailFilename}`);
          
          // Update database to point to real thumbnail
          await prisma.$executeRaw`
            UPDATE documents 
            SET "thumbnailPath" = ${thumbnailFilename}
            WHERE id = ${doc.id}::uuid
          `;
          
          skipped++;
          continue;
        } catch {
          // Thumbnail doesn't exist, generate it
        }
        
        if (docType === 'pdf') {
          // Try to find and process PDF file
          const pdfPath = await findPDFFile(doc.id, doc.title);
          
          if (pdfPath) {
            const success = await generatePDFThumbnail(pdfPath, thumbnailPath);
            
            if (success) {
              // Update database to point to real PDF thumbnail
              await prisma.$executeRaw`
                UPDATE documents 
                SET "thumbnailPath" = ${thumbnailFilename}
                WHERE id = ${doc.id}::uuid
              `;
              
              pdfProcessed++;
              console.log(`✅ Real PDF thumbnail created: ${thumbnailFilename}`);
              continue;
            }
          }
        }
        
        // Generate fallback SVG thumbnail
        console.log(`🎨 Generating fallback thumbnail for: ${doc.title}`);
        const svgContent = createFallbackThumbnail(doc.title, docType);
        const fallbackFilename = `thumb-${doc.id}-fallback.svg`;
        const fallbackPath = path.join(THUMBNAIL_CONFIG.out_dir, fallbackFilename);
        
        await fs.writeFile(fallbackPath, svgContent);
        
        // Update database to point to fallback thumbnail
        await prisma.$executeRaw`
          UPDATE documents 
          SET "thumbnailPath" = ${fallbackFilename}
          WHERE id = ${doc.id}::uuid
        `;
        
        fallbackGenerated++;
        console.log(`✅ Fallback thumbnail created: ${fallbackFilename}`);
        
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error.message);
      }
    }

    console.log(`\n🎉 Thumbnail generation complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Real PDF thumbnails: ${pdfProcessed}`);
    console.log(`   • Fallback thumbnails: ${fallbackGenerated}`);
    console.log(`   • Already existed: ${skipped}`);
    console.log(`   • Total processed: ${documents.length}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test with a specific PDF first
async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF thumbnail generation...');
    
    const testPDF = path.join(process.cwd(), 'test-documents', 'simple-test.pdf');
    const outputPath = path.join(THUMBNAIL_CONFIG.out_dir, 'test-pdf-thumb.png');
    
    try {
      await fs.access(testPDF);
      console.log(`✅ Test PDF found: ${testPDF}`);
      
      const success = await generatePDFThumbnail(testPDF, outputPath);
      
      if (success) {
        console.log(`✅ Test thumbnail generated successfully!`);
        console.log(`📁 Check: ${outputPath}`);
      } else {
        console.log(`❌ Test thumbnail generation failed`);
      }
      
    } catch (error) {
      console.log(`⚠️ Test PDF not found: ${testPDF}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'test') {
    testPDFGeneration();
  } else {
    generateRealThumbnails();
  }
}

module.exports = {
  generateRealThumbnails,
  testPDFGeneration,
  generatePDFThumbnail,
  createFallbackThumbnail
};