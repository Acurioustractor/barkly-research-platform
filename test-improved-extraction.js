// Test script for improved PDF extraction
const fs = require('fs');
const path = require('path');

// We need to compile TypeScript first
async function testImprovedExtraction() {
  try {
    // Import the compiled extractor
    const { ImprovedPDFExtractor } = await import('./dist/utils/pdf-extractor-improved.js');
    
    // Test with a sample PDF if available
    const testPdfPath = path.join(__dirname, 'test-documents', 'sample-youth-research.pdf');
    
    if (fs.existsSync(testPdfPath)) {
      console.log('Testing with:', testPdfPath);
      const buffer = fs.readFileSync(testPdfPath);
      
      const extractor = new ImprovedPDFExtractor(buffer);
      
      console.log('\n=== Testing extraction ===');
      const result = await extractor.extractText();
      
      console.log('\nExtraction Result:');
      console.log('- Method:', result.method);
      console.log('- Confidence:', result.confidence);
      console.log('- Page Count:', result.pageCount);
      console.log('- Text Length:', result.text.length);
      console.log('- Warnings:', result.warnings);
      console.log('\nFirst 500 chars:', result.text.substring(0, 500));
      
      console.log('\n=== Testing detailed metadata ===');
      const detailed = await extractor.getDetailedMetadata();
      console.log('Advanced metadata:', detailed.advanced);
      
    } else {
      console.log('No test PDF found. Creating a test with buffer...');
      
      // Create a simple test buffer
      const testBuffer = Buffer.from('Test PDF content');
      const extractor = new ImprovedPDFExtractor(testBuffer);
      const result = await extractor.extractText();
      
      console.log('Test extraction result:', result);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testImprovedExtraction();