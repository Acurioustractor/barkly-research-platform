/**
 * Generate real document previews using system tools and PDF content extraction
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Try to extract first page of PDF using different methods
async function extractPDFFirstPage(pdfPath, outputPath) {
  const methods = [
    // Method 1: Use macOS built-in qlmanage (Quick Look)
    async () => {
      console.log('🔄 Trying qlmanage...');
      const { stdout, stderr } = await execAsync(`qlmanage -t -s 400 -o "${path.dirname(outputPath)}" "${pdfPath}"`);
      
      // qlmanage creates files with .png extension and different naming
      const baseName = path.basename(pdfPath, '.pdf');
      const qlOutputPath = path.join(path.dirname(outputPath), `${baseName}.png`);
      
      try {
        await fs.access(qlOutputPath);
        await fs.rename(qlOutputPath, outputPath);
        return true;
      } catch {
        return false;
      }
    },
    
    // Method 2: Use sips (macOS built-in)
    async () => {
      console.log('🔄 Trying sips...');
      await execAsync(`sips -s format png -Z 400 "${pdfPath}" --out "${outputPath}"`);
      
      try {
        await fs.access(outputPath);
        return true;
      } catch {
        return false;
      }
    },
    
    // Method 3: Use ImageMagick if available
    async () => {
      console.log('🔄 Trying ImageMagick convert...');
      await execAsync(`convert -density 150 "${pdfPath}[0]" -quality 90 -resize 400x "${outputPath}"`);
      
      try {
        await fs.access(outputPath);
        return true;
      } catch {
        return false;
      }
    }
  ];
  
  for (const method of methods) {
    try {
      const success = await method();
      if (success) {
        console.log('✅ PDF extraction successful!');
        return true;
      }
    } catch (error) {
      console.log(`❌ Method failed: ${error.message}`);
    }
  }
  
  return false;
}

// Find document files in common locations
async function findDocumentFile(title) {
  const searchPaths = [
    path.join(process.cwd(), 'docs'),
    path.join(process.cwd(), 'test-documents'),
    process.cwd()
  ];
  
  const cleanTitle = title.replace(/[^\w\s\-\.]/g, '').trim();
  
  for (const searchPath of searchPaths) {
    try {
      const files = await fs.readdir(searchPath);
      
      // Look for exact or partial matches
      for (const file of files) {
        const fileName = file.toLowerCase();
        const titleLower = cleanTitle.toLowerCase();
        
        // Check for exact match or if title words are in filename
        const titleWords = titleLower.split(' ').filter(w => w.length > 3);
        const hasMatchingWords = titleWords.some(word => fileName.includes(word));
        
        if (fileName === titleLower || hasMatchingWords) {
          const fullPath = path.join(searchPath, file);
          const stats = await fs.stat(fullPath);
          
          if (stats.isFile() && (file.endsWith('.pdf') || file.endsWith('.docx'))) {
            console.log(`📄 Found document: ${fullPath}`);
            return { path: fullPath, type: path.extname(file).toLowerCase() };
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  return null;
}

// Create a simple text-based preview for DOCX files (we'll enhance this later)
async function createDocxPreview(docxPath, outputPath) {
  try {
    console.log('📝 Creating DOCX preview...');
    
    // For now, create a styled preview indicating it's a DOCX file
    // In production, you'd use mammoth.js or similar to extract content
    const fileName = path.basename(docxPath, '.docx');
    
    // Create an HTML canvas-like preview
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background: white; width: 400px; height: 500px; }
        .header { background: #2563eb; color: white; padding: 10px; margin: -20px -20px 20px -20px; font-size: 14px; font-weight: bold; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1e40af; }
        .line { height: 8px; background: #e5e7eb; margin: 6px 0; border-radius: 2px; }
        .line.highlight { background: #3b82f6; width: 70%; }
        .line.short { width: 60%; }
        .line.medium { width: 85%; }
      </style>
    </head>
    <body>
      <div class="header">Microsoft Word Document</div>
      <div class="title">${fileName}</div>
      <div class="line"></div>
      <div class="line short"></div>
      <div class="line"></div>
      <div class="line medium"></div>
      <div class="line highlight"></div>
      <div class="line"></div>
      <div class="line short"></div>
      <div class="line"></div>
      <div class="line medium"></div>
      <div class="line short"></div>
    </body>
    </html>`;
    
    // Save HTML and try to convert to image
    const htmlPath = outputPath.replace('.png', '.html');
    await fs.writeFile(htmlPath, htmlContent);
    
    // Try to convert HTML to PNG using various methods
    try {
      // Method 1: Use webkit2png if available (macOS)
      await execAsync(`webkit2png -F -W 400 -H 500 --filename="${outputPath.replace('.png', '')}" "${htmlPath}"`);
      
      // Clean up
      await fs.unlink(htmlPath);
      
      try {
        await fs.access(outputPath);
        return true;
      } catch {
        return false;
      }
    } catch {
      // Clean up HTML file
      await fs.unlink(htmlPath);
      return false;
    }
    
  } catch (error) {
    console.error('❌ DOCX preview failed:', error.message);
    return false;
  }
}

// Generate real document previews
async function generateRealPreviews() {
  try {
    console.log('🚀 Generating real document previews...');
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    // Get documents from database
    const documents = await prisma.$queryRaw`
      SELECT id, title, "thumbnailPath"
      FROM documents 
      WHERE processing_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    console.log(`📚 Processing ${documents.length} documents for real previews...`);
    
    let realPreviews = 0;
    let failed = 0;
    
    for (const doc of documents) {
      try {
        console.log(`\n📖 Processing: ${doc.title}`);
        
        // Find the actual document file
        const docFile = await findDocumentFile(doc.title);
        
        if (!docFile) {
          console.log(`⚠️ Document file not found: ${doc.title}`);
          failed++;
          continue;
        }
        
        const previewFilename = `real-preview-${doc.id}.png`;
        const previewPath = path.join(thumbnailsDir, previewFilename);
        
        // Check if preview already exists
        try {
          await fs.access(previewPath);
          console.log(`✅ Real preview already exists: ${previewFilename}`);
          continue;
        } catch {
          // Doesn't exist, create it
        }
        
        let success = false;
        
        if (docFile.type === '.pdf') {
          success = await extractPDFFirstPage(docFile.path, previewPath);
        } else if (docFile.type === '.docx') {
          success = await createDocxPreview(docFile.path, previewPath);
        }
        
        if (success) {
          // Update database to point to real preview
          await prisma.$executeRaw`
            UPDATE documents 
            SET "thumbnailPath" = ${previewFilename}
            WHERE id = ${doc.id}::uuid
          `;
          
          realPreviews++;
          console.log(`✅ Real preview created: ${previewFilename}`);
        } else {
          failed++;
          console.log(`❌ Failed to create preview for: ${doc.title}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${doc.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n🎉 Real preview generation complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Real previews created: ${realPreviews}`);
    console.log(`   • Failed: ${failed}`);
    console.log(`   • Total processed: ${documents.length}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test with a specific file
async function testPreviewGeneration() {
  try {
    console.log('🧪 Testing real preview generation...');
    
    const testPDF = path.join(process.cwd(), 'docs', 'Report on the Second TC Youth Roundtable April 16 2025.pdf');
    const outputPath = path.join(process.cwd(), 'public', 'thumbnails', 'test-real-preview.png');
    
    try {
      await fs.access(testPDF);
      console.log(`✅ Test PDF found: ${testPDF}`);
      
      const success = await extractPDFFirstPage(testPDF, outputPath);
      
      if (success) {
        console.log(`✅ Test preview generated successfully!`);
        console.log(`📁 Check: ${outputPath}`);
      } else {
        console.log(`❌ Test preview generation failed`);
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
    testPreviewGeneration();
  } else {
    generateRealPreviews();
  }
}

module.exports = {
  generateRealPreviews,
  testPreviewGeneration,
  extractPDFFirstPage,
  findDocumentFile
};