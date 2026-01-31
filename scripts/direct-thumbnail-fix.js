/**
 * Direct thumbnail fix - update the documents page to use static thumbnails
 */
const fs = require('fs').promises;
const path = require('path');

async function createStaticThumbnailMapping() {
  try {
    console.log('🎨 Creating static thumbnail mapping...');
    
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    // List all available thumbnails
    const files = await fs.readdir(thumbnailsDir);
    console.log('📁 Available thumbnail files:');
    files.forEach(file => console.log(`  - ${file}`));
    
    // Create a simple mapping for the documents page
    const thumbnailMapping = {
      // Use the unique thumbnails we created
      '06b934e1-6cf9-4b84-823a-670ccf1d88ce': 'unique-06b934e1-6cf9-4b84-823a-670ccf1d88ce.png',
      '815852c7-15ec-4c86-a8e1-2c44ba99ff94': 'unique-815852c7-15ec-4c86-a8e1-2c44ba99ff94.png', 
      '928f88f4-06d5-44a6-80b2-5d8ad4635bad': 'unique-928f88f4-06d5-44a6-80b2-5d8ad4635bad.png',
      'aa10871b-e193-4084-a112-10fcdf270dc8': 'unique-aa10871b-e193-4084-a112-10fcdf270dc8.png',
      '30fb8b1c-47d5-48fb-9d65-a10927f4949d': 'unique-30fb8b1c-47d5-48fb-9d65-a10927f4949d.png',
      // Add backups
      '06b934e1': 'preview-06b934e1.png',
      '815852c7': 'preview-815852c7.png',
      '928f88f4': 'preview-928f88f4.png',
      'aa10871b': 'preview-aa10871b.png',
      '30fb8b1c': 'preview-30fb8b1c.png'
    };
    
    // Write the mapping to a JSON file for easy access
    const mappingPath = path.join(process.cwd(), 'src', 'data', 'thumbnail-mapping.json');
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(mappingPath), { recursive: true });
    
    await fs.writeFile(mappingPath, JSON.stringify(thumbnailMapping, null, 2));
    
    console.log('✅ Created thumbnail mapping file:', mappingPath);
    console.log('📋 Mapping contents:', JSON.stringify(thumbnailMapping, null, 2));
    
    // Also create a simple function to get thumbnail path
    const utilCode = `
// Thumbnail utility functions
export const thumbnailMapping = ${JSON.stringify(thumbnailMapping, null, 2)};

export function getThumbnailPath(documentId: string): string | null {
  // Try full ID first
  if (thumbnailMapping[documentId]) {
    return \`/thumbnails/\${thumbnailMapping[documentId]}\`;
  }
  
  // Try first 8 characters
  const shortId = documentId.substring(0, 8);
  if (thumbnailMapping[shortId]) {
    return \`/thumbnails/\${thumbnailMapping[shortId]}\`;
  }
  
  // Try to find any unique thumbnail for this ID
  const uniqueFile = \`unique-\${documentId}.png\`;
  if (Object.values(thumbnailMapping).includes(uniqueFile)) {
    return \`/thumbnails/\${uniqueFile}\`;
  }
  
  // Try preview file
  const previewFile = \`preview-\${shortId}.png\`;
  if (Object.values(thumbnailMapping).includes(previewFile)) {
    return \`/thumbnails/\${previewFile}\`;
  }
  
  return null;
}

export function getDocumentThumbnail(doc: any): string | null {
  // First try the database thumbnail path
  if (doc.thumbnailPath) {
    return \`/thumbnails/\${doc.thumbnailPath}\`;
  }
  
  // Then try our mapping
  return getThumbnailPath(doc.id);
}
`;
    
    const utilPath = path.join(process.cwd(), 'src', 'utils', 'thumbnails.ts');
    await fs.mkdir(path.dirname(utilPath), { recursive: true });
    await fs.writeFile(utilPath, utilCode);
    
    console.log('✅ Created thumbnail utility:', utilPath);
    
    console.log('\\n🎉 Static thumbnail system ready!');
    console.log('📝 Next steps:');
    console.log('1. Import getThumbnailPath from @/utils/thumbnails in your components');
    console.log('2. Use getThumbnailPath(doc.id) instead of the API route');
    console.log('3. This will show unique thumbnails for each document');
    
  } catch (error) {
    console.error('❌ Static thumbnail creation failed:', error);
  }
}

if (require.main === module) {
  createStaticThumbnailMapping();
}

module.exports = { createStaticThumbnailMapping };