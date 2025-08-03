/**
 * Automatic thumbnail generator for new document uploads
 * This can be called from the document upload process
 */
const fs = require('fs').promises;
const path = require('path');

// Enhanced SVG thumbnail generator
function createDocumentThumbnail(title, documentType, options = {}) {
  const typeConfigs = {
    'pdf': { 
      bg: '220, 38, 38', 
      accent: '239, 68, 68', 
      icon: '📄',
      name: 'PDF'
    },
    'docx': { 
      bg: '37, 99, 235', 
      accent: '59, 130, 246', 
      icon: '📝',
      name: 'DOCX'
    },
    'report': { 
      bg: '59, 130, 246', 
      accent: '147, 197, 253', 
      icon: '📊',
      name: 'REPORT'
    },
    'policy': { 
      bg: '16, 185, 129', 
      accent: '52, 211, 153', 
      icon: '📋',
      name: 'POLICY'
    },
    'research': { 
      bg: '139, 92, 246', 
      accent: '167, 139, 250', 
      icon: '🔬',
      name: 'RESEARCH'
    },
    'community-story': { 
      bg: '245, 158, 11', 
      accent: '251, 191, 36', 
      icon: '📖',
      name: 'STORY'
    },
    'meeting-notes': { 
      bg: '239, 68, 68', 
      accent: '248, 113, 113', 
      icon: '🗒️',
      name: 'NOTES'
    }
  };
  
  const config = typeConfigs[documentType] || typeConfigs['report'];
  const truncatedTitle = title.length > 17 ? title.substring(0, 17) + '...' : title;
  const currentDate = new Date().toLocaleDateString('en-AU', { 
    day: 'numeric', 
    month: 'short' 
  });
  
  return `<svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: bold 10px system-ui, -apple-system, sans-serif; fill: white; }
      .subtitle { font: 8px system-ui, -apple-system, sans-serif; fill: rgba(255,255,255,0.7); }
      .type { font: bold 8px system-ui, -apple-system, sans-serif; fill: rgba(255,255,255,0.9); letter-spacing: 0.5px; }
      .icon { font: 14px system-ui, -apple-system, sans-serif; }
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(${config.bg});stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(${config.accent});stop-opacity:0.8" />
    </linearGradient>
    <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.15);stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Background with gradient -->
  <rect width="200" height="280" fill="url(#bgGrad)" rx="8"/>
  <rect width="200" height="280" fill="url(#overlayGrad)" rx="8"/>
  
  <!-- Document container -->
  <rect x="15" y="20" width="170" height="210" fill="rgba(255,255,255,0.12)" rx="6" filter="url(#shadow)"/>
  
  <!-- Document header -->
  <rect x="20" y="25" width="160" height="18" fill="rgba(255,255,255,0.08)" rx="3"/>
  <circle cx="28" cy="34" r="2.5" fill="rgba(255,255,255,0.3)"/>
  <circle cx="38" cy="34" r="2.5" fill="rgba(255,255,255,0.3)"/>
  <circle cx="48" cy="34" r="2.5" fill="rgba(255,255,255,0.3)"/>
  
  <!-- Document content lines -->
  <rect x="25" y="53" width="145" height="2.5" fill="rgba(255,255,255,0.25)" rx="1.25"/>
  <rect x="25" y="61" width="125" height="2.5" fill="rgba(255,255,255,0.25)" rx="1.25"/>
  <rect x="25" y="69" width="140" height="2.5" fill="rgba(255,255,255,0.25)" rx="1.25"/>
  <rect x="25" y="77" width="105" height="2.5" fill="rgba(255,255,255,0.25)" rx="1.25"/>
  <rect x="25" y="85" width="135" height="2.5" fill="rgba(255,255,255,0.25)" rx="1.25"/>
  <rect x="25" y="93" width="120" height="2.5" fill="rgba(255,255,255,0.25)" rx="1.25"/>
  
  <!-- Highlighted content section -->
  <rect x="25" y="108" width="115" height="2.5" fill="rgba(255,255,255,0.4)" rx="1.25"/>
  <rect x="25" y="116" width="130" height="2.5" fill="rgba(255,255,255,0.35)" rx="1.25"/>
  <rect x="25" y="124" width="110" height="2.5" fill="rgba(255,255,255,0.3)" rx="1.25"/>
  
  <!-- More content lines -->
  <rect x="25" y="139" width="140" height="2.5" fill="rgba(255,255,255,0.2)" rx="1.25"/>
  <rect x="25" y="147" width="95" height="2.5" fill="rgba(255,255,255,0.2)" rx="1.25"/>
  <rect x="25" y="155" width="125" height="2.5" fill="rgba(255,255,255,0.2)" rx="1.25"/>
  
  <!-- Type icon -->
  <text x="160" y="205" class="icon" text-anchor="middle">${config.icon}</text>
  
  <!-- Document info -->
  <text x="15" y="248" class="title">${truncatedTitle}</text>
  <text x="15" y="262" class="subtitle">${currentDate} • AI Processed</text>
  <text x="15" y="275" class="type">${config.name}</text>
  
  <!-- Status indicator -->
  <circle cx="185" cy="248" r="3" fill="rgba(34, 197, 94, 0.9)"/>
  
  <!-- Corner decoration -->
  <path d="M 190 15 L 195 15 Q 200 15 200 20 L 200 25" stroke="rgba(255,255,255,0.1)" stroke-width="1" fill="none"/>
</svg>`;
}

// Infer document type from filename and content
function inferDocumentType(filename, content = '') {
  const name = filename.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // File extension based detection
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  
  // Content and filename analysis
  if (name.includes('report') || contentLower.includes('executive summary')) return 'report';
  if (name.includes('policy') || contentLower.includes('policy framework')) return 'policy';
  if (name.includes('research') || name.includes('study') || contentLower.includes('methodology')) return 'research';
  if (name.includes('story') || name.includes('narrative') || contentLower.includes('community voice')) return 'community-story';
  if (name.includes('meeting') || name.includes('minutes') || contentLower.includes('agenda')) return 'meeting-notes';
  
  // Default based on common patterns
  if (name.includes('youth') || name.includes('training') || name.includes('outcome')) return 'report';
  
  return 'report'; // Safe default
}

// Generate thumbnail for a document
async function generateThumbnail(documentId, title, options = {}) {
  try {
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });
    
    const documentType = options.type || inferDocumentType(title, options.content || '');
    const filename = `thumb-${documentId}.svg`;
    const filePath = path.join(thumbnailsDir, filename);
    
    // Check if thumbnail already exists
    try {
      await fs.access(filePath);
      console.log(`✅ Thumbnail already exists: ${filename}`);
      return filename;
    } catch {
      // Doesn't exist, create it
    }
    
    console.log(`🎨 Generating thumbnail for: ${title} (${documentType})`);
    
    const svgContent = createDocumentThumbnail(title, documentType, options);
    await fs.writeFile(filePath, svgContent);
    
    console.log(`✅ Thumbnail generated: ${filename}`);
    return filename;
    
  } catch (error) {
    console.error(`❌ Failed to generate thumbnail for ${documentId}:`, error.message);
    throw error;
  }
}

// Batch generate thumbnails for multiple documents
async function batchGenerateThumbnails(documents) {
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  console.log(`🚀 Batch generating thumbnails for ${documents.length} documents...`);
  
  for (const doc of documents) {
    try {
      const filename = await generateThumbnail(doc.id, doc.title, {
        type: doc.type,
        content: doc.content
      });
      
      results.success.push({ id: doc.id, filename, title: doc.title });
      
    } catch (error) {
      results.failed.push({ id: doc.id, title: doc.title, error: error.message });
    }
  }
  
  console.log(`📊 Batch generation complete:`);
  console.log(`   • Success: ${results.success.length}`);
  console.log(`   • Failed: ${results.failed.length}`);
  console.log(`   • Skipped: ${results.skipped.length}`);
  
  return results;
}

// Clean up old thumbnails
async function cleanupOldThumbnails(keepPatterns = ['thumb-', 'enhanced-']) {
  try {
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    const files = await fs.readdir(thumbnailsDir);
    
    const oldFiles = files.filter(file => {
      return !keepPatterns.some(pattern => file.startsWith(pattern)) &&
             (file.endsWith('.png') || file.endsWith('.svg') || file.endsWith('.jpg'));
    });
    
    console.log(`🧹 Cleaning up ${oldFiles.length} old thumbnail files...`);
    
    for (const file of oldFiles) {
      const filePath = path.join(thumbnailsDir, file);
      await fs.unlink(filePath);
      console.log(`🗑️ Removed: ${file}`);
    }
    
    console.log(`✅ Cleanup complete`);
    
  } catch (error) {
    console.error(`❌ Cleanup failed:`, error.message);
  }
}

module.exports = {
  generateThumbnail,
  batchGenerateThumbnails,
  createDocumentThumbnail,
  inferDocumentType,
  cleanupOldThumbnails
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  if (command === 'test') {
    generateThumbnail('test-123', arg || 'Sample Document Title', { type: 'report' })
      .then(filename => console.log(`Test thumbnail: ${filename}`))
      .catch(console.error);
  } else if (command === 'cleanup') {
    cleanupOldThumbnails();
  } else {
    console.log('Usage:');
    console.log('  node auto-thumbnail-generator.js test [title]');
    console.log('  node auto-thumbnail-generator.js cleanup');
  }
}