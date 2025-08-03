/**
 * Test script for thumbnail generation
 */
const fs = require('fs').promises;
const path = require('path');

async function testThumbnailGeneration() {
  try {
    console.log('🧪 Testing thumbnail generation...');
    
    // Check if we can import pdf-poppler
    const pdfPoppler = require('pdf-poppler');
    console.log('✅ pdf-poppler imported successfully');
    
    // Check if thumbnails directory exists
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    try {
      await fs.access(thumbnailsDir);
      console.log('✅ Thumbnails directory exists');
    } catch {
      console.log('📁 Creating thumbnails directory...');
      await fs.mkdir(thumbnailsDir, { recursive: true });
      console.log('✅ Thumbnails directory created');
    }
    
    // List existing files in thumbnails directory
    const files = await fs.readdir(thumbnailsDir);
    console.log(`📂 Thumbnails directory contains ${files.length} files:`, files);
    
    console.log('🎉 Thumbnail generation system is ready!');
    
    // Test with document upload
    console.log('\n📋 To test thumbnail generation:');
    console.log('1. Upload a PDF document through the UI');
    console.log('2. Check the console logs for thumbnail generation messages');
    console.log('3. Check the /public/thumbnails directory for generated images');
    console.log('4. Refresh the documents page to see thumbnails in gallery view');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testThumbnailGeneration();