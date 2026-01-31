/**
 * Update database thumbnail paths to use the new unique thumbnails
 */
const fs = require('fs').promises;
const path = require('path');

async function updateThumbnailPaths() {
  try {
    console.log('🔄 Updating database thumbnail paths...');
    
    // Database connection without Prisma to avoid connection issues
    const { Client } = require('pg');
    const client = new Client(process.env.DATABASE_URL);
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get all documents
    const result = await client.query(`
      SELECT id, title, "thumbnailPath" 
      FROM documents 
      WHERE processing_status = 'completed'
      ORDER BY created_at DESC
    `);
    
    console.log(`📚 Found ${result.rows.length} documents to update`);
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    // Check what thumbnail files we have
    const thumbnailFiles = await fs.readdir(thumbnailsDir);
    console.log('🖼️ Available thumbnail files:', thumbnailFiles.filter(f => f.startsWith('unique-') || f.startsWith('preview-')));
    
    let updated = 0;
    
    for (const doc of result.rows) {
      try {
        // Look for matching unique thumbnail
        const uniqueThumbFile = `unique-${doc.id}.png`;
        const previewThumbFile = `preview-${doc.id.substring(0, 8)}.png`;
        const uniqueThumbPath = path.join(thumbnailsDir, uniqueThumbFile);
        const previewThumbPath = path.join(thumbnailsDir, previewThumbFile);
        
        let thumbnailToUse = null;
        
        // Check if unique thumbnail exists
        try {
          await fs.access(uniqueThumbPath);
          thumbnailToUse = uniqueThumbFile;
          console.log(`✅ Found unique thumbnail for ${doc.title.substring(0, 30)}...`);
        } catch {
          // Check for preview thumbnail
          try {
            await fs.access(previewThumbPath);
            thumbnailToUse = previewThumbFile;
            console.log(`✅ Found preview thumbnail for ${doc.title.substring(0, 30)}...`);
          } catch {
            // Check for real preview with full ID
            const realPreviewFile = `real-preview-${doc.id}.png`;
            const realPreviewPath = path.join(thumbnailsDir, realPreviewFile);
            try {
              await fs.access(realPreviewPath);
              thumbnailToUse = realPreviewFile;
              console.log(`✅ Found real preview for ${doc.title.substring(0, 30)}...`);
            } catch {
              console.log(`⚠️ No thumbnail found for ${doc.title.substring(0, 30)}...`);
              continue;
            }
          }
        }
        
        if (thumbnailToUse) {
          // Update database
          await client.query(`
            UPDATE documents 
            SET "thumbnailPath" = $1
            WHERE id = $2
          `, [thumbnailToUse, doc.id]);
          
          updated++;
          console.log(`📝 Updated ${doc.id} -> ${thumbnailToUse}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${doc.id}:`, error.message);
      }
    }
    
    console.log(`\\n🎉 Database update complete!`);
    console.log(`📊 Results:`);
    console.log(`   • Documents updated: ${updated}`);
    console.log(`   • Total documents: ${result.rows.length}`);
    console.log(`   • Success rate: ${Math.round((updated / result.rows.length) * 100)}%`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  }
}

// Also add a function to create fallback thumbnails for documents without any
async function createFallbackThumbnails() {
  try {
    console.log('🎨 Creating fallback thumbnails for documents without previews...');
    
    const { Client } = require('pg');
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();
    
    // Get documents without thumbnails
    const result = await client.query(`
      SELECT id, title
      FROM documents 
      WHERE ("thumbnailPath" IS NULL OR "thumbnailPath" = '')
      AND processing_status = 'completed'
      ORDER BY created_at DESC
    `);
    
    console.log(`🖼️ Found ${result.rows.length} documents needing fallback thumbnails`);
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    for (let i = 0; i < result.rows.length; i++) {
      const doc = result.rows[i];
      
      try {
        console.log(`Creating fallback for: ${doc.title.substring(0, 40)}...`);
        
        const fallbackFilename = `fallback-${doc.id}.svg`;
        const fallbackPath = path.join(thumbnailsDir, fallbackFilename);
        
        // Create a simple SVG fallback
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
        const color = colors[i % colors.length];
        
        const svgContent = `
<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="280" fill="${color}" rx="8"/>
  <rect x="20" y="40" width="160" height="200" fill="rgba(255,255,255,0.1)" rx="6"/>
  <rect x="30" y="60" width="140" height="3" fill="rgba(255,255,255,0.4)" rx="1"/>
  <rect x="30" y="70" width="120" height="3" fill="rgba(255,255,255,0.4)" rx="1"/>
  <rect x="30" y="80" width="140" height="3" fill="rgba(255,255,255,0.4)" rx="1"/>
  <rect x="30" y="90" width="100" height="3" fill="rgba(255,255,255,0.4)" rx="1"/>
  <text x="30" y="250" style="font: bold 12px sans-serif; fill: white;">${doc.title.substring(0, 20)}${doc.title.length > 20 ? '...' : ''}</text>
  <text x="30" y="265" style="font: 10px sans-serif; fill: rgba(255,255,255,0.7);">DOCUMENT</text>
</svg>`;
        
        await fs.writeFile(fallbackPath, svgContent);
        
        // Update database
        await client.query(`
          UPDATE documents 
          SET "thumbnailPath" = $1
          WHERE id = $2
        `, [fallbackFilename, doc.id]);
        
        console.log(`✅ Created fallback: ${fallbackFilename}`);
        
      } catch (error) {
        console.error(`❌ Error creating fallback for ${doc.id}:`, error.message);
      }
    }
    
    await client.end();
    console.log('🎉 Fallback thumbnail creation complete!');
    
  } catch (error) {
    console.error('❌ Fallback creation failed:', error);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'fallbacks') {
    createFallbackThumbnails();
  } else {
    updateThumbnailPaths();
  }
}

module.exports = {
  updateThumbnailPaths,
  createFallbackThumbnails
};