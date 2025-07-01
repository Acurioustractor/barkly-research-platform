#!/usr/bin/env tsx

/**
 * Comprehensive test script for document processing system
 * Tests all major components and features
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ImprovedPDFExtractor } from './src/utils/pdf-extractor-improved';
import { AdaptiveChunker } from './src/utils/adaptive-chunker';
import { DocumentChunker } from './src/utils/document-chunker';
import { ParallelDocumentProcessor } from './src/utils/parallel-document-processor';
import { EnhancedEmbeddingsService } from './src/lib/embeddings-service-enhanced';
import { 
  ErrorHandler, 
  DocumentProcessingError,
  RetryHandler,
  CircuitBreaker 
} from './src/utils/error-handler';
import { GracefulDegradation, FallbackStrategies } from './src/utils/graceful-degradation';

// Test configuration
const TEST_CONFIG = {
  testPdfPath: './test-documents/sample-youth-research.pdf',
  testText: `
    Youth Voice and Community Research

    This document explores the importance of listening to young people in community development.
    
    Key Findings:
    - Young people want to be heard and involved in decision-making
    - Traditional approaches often exclude youth perspectives
    - Community programs benefit from youth participation
    
    "We need adults to actually listen to us, not just pretend to care" - Youth participant, age 16
    
    The research shows that when young people are genuinely engaged in community planning,
    outcomes improve significantly. This includes better program attendance, increased
    satisfaction, and more sustainable initiatives.
    
    Recommendations:
    1. Create dedicated youth advisory boards
    2. Implement regular feedback mechanisms
    3. Provide training for youth leadership
    4. Ensure representation in decision-making bodies
  `,
  verbose: true
};

// Test results tracker
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

// Test runner
async function runTest(
  name: string, 
  testFn: () => Promise<any>
): Promise<void> {
  console.log(`\n🧪 Running test: ${name}`);
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    testResults.push({
      name,
      status: 'passed',
      duration,
      details: result
    });
    
    console.log(`✅ Passed (${duration}ms)`);
    if (TEST_CONFIG.verbose && result) {
      console.log('Details:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.push({
      name,
      status: 'failed',
      duration,
      error: error instanceof Error ? error.message : String(error)
    });
    
    console.log(`❌ Failed (${duration}ms)`);
    console.error('Error:', error);
  }
}

// Test 1: PDF Extraction
async function testPDFExtraction() {
  // Test with real PDF if available
  if (existsSync(TEST_CONFIG.testPdfPath)) {
    const buffer = readFileSync(TEST_CONFIG.testPdfPath);
    const extractor = new ImprovedPDFExtractor(buffer);
    
    const result = await extractor.extractText();
    const metadata = await extractor.getDetailedMetadata();
    
    if (result.text.length < 50) {
      throw new Error('Insufficient text extracted');
    }
    
    return {
      method: result.method,
      confidence: result.confidence,
      textLength: result.text.length,
      pageCount: result.pageCount,
      warnings: result.warnings,
      metadata: metadata.advanced
    };
  } else {
    // Test with dummy buffer
    const buffer = Buffer.from('%PDF-1.4\n' + TEST_CONFIG.testText);
    const extractor = new ImprovedPDFExtractor(buffer);
    
    const result = await extractor.extractText();
    return {
      method: result.method,
      textLength: result.text.length,
      warnings: result.warnings
    };
  }
}

// Test 2: Adaptive Chunking
async function testAdaptiveChunking() {
  const chunker = new AdaptiveChunker({
    minChunkSize: 50,
    maxChunkSize: 300,
    targetChunkSize: 150,
    strategy: 'hybrid'
  });
  
  const chunks = await chunker.chunkDocument(TEST_CONFIG.testText);
  
  // Validate chunks
  if (chunks.length === 0) {
    throw new Error('No chunks created');
  }
  
  const avgChunkSize = chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length;
  
  return {
    chunkCount: chunks.length,
    avgChunkSize: Math.round(avgChunkSize),
    firstChunk: chunks[0].text.substring(0, 100),
    metadata: chunks[0].metadata
  };
}

// Test 3: Document Analysis
async function testDocumentAnalysis() {
  const chunker = new DocumentChunker();
  const result = await chunker.analyzeAndChunk(TEST_CONFIG.testText);
  
  return {
    recommendedStrategy: result.recommendedStrategy,
    chunkCount: result.chunks.length,
    analysis: result.analysis
  };
}

// Test 4: Error Handling
async function testErrorHandling() {
  const results: any = {};
  
  // Test PDF error handling
  try {
    const badBuffer = Buffer.from('not a pdf');
    const extractor = new ImprovedPDFExtractor(badBuffer);
    await extractor.extractText();
  } catch (error) {
    const handled = ErrorHandler.handlePDFError(error as Error);
    results.pdfError = {
      type: handled.type,
      recoverable: handled.recoverable,
      retryable: handled.retryable
    };
  }
  
  // Test retry handler
  let attempts = 0;
  const retryResult = await RetryHandler.withRetry(
    async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    },
    { maxRetries: 5, initialDelay: 100 }
  );
  
  results.retryHandler = {
    attempts,
    result: retryResult
  };
  
  // Test circuit breaker
  const breaker = new CircuitBreaker(3, 1000);
  let circuitOpened = false;
  
  // Trigger failures
  for (let i = 0; i < 4; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Service failure');
      });
    } catch (error) {
      if (error instanceof DocumentProcessingError && error.type === 'RATE_LIMIT') {
        circuitOpened = true;
      }
    }
  }
  
  results.circuitBreaker = {
    opened: circuitOpened
  };
  
  return results;
}

// Test 5: Graceful Degradation
async function testGracefulDegradation() {
  const degradation = new GracefulDegradation({
    allowPartialSuccess: true,
    minimumSuccessRate: 0.5
  });
  
  // Simulate failures
  degradation.recordFailure('aiAnalysis', new DocumentProcessingError({
    type: 'AI_ANALYSIS',
    message: 'AI service unavailable',
    recoverable: true,
    retryable: true
  }));
  
  const shouldContinue = degradation.shouldContinue();
  const fallback = degradation.getFallback('aiAnalysis');
  const message = degradation.getDegradationMessage();
  
  // Test fallback strategies
  const basicAnalysis = await FallbackStrategies.basicAnalysis(TEST_CONFIG.testText);
  
  return {
    shouldContinue,
    fallback,
    message,
    basicAnalysis: {
      themes: basicAnalysis.themes.length,
      keywords: basicAnalysis.keywords.slice(0, 5),
      insights: basicAnalysis.insights.length
    }
  };
}

// Test 6: Embeddings Service
async function testEmbeddingsService() {
  const service = new EnhancedEmbeddingsService();
  const status = await service.getStatus();
  
  if (!status.available && !status.fallbackAvailable) {
    return {
      status,
      skipped: 'No embedding service available'
    };
  }
  
  // Test single embedding
  const text = "Youth participation in community development";
  const embedding = await service.generateEmbedding(text);
  
  // Test batch embeddings
  const texts = [
    "Young people need to be heard",
    "Community programs benefit from youth input",
    "Traditional approaches exclude youth"
  ];
  const batchEmbeddings = await service.generateBatchEmbeddings(texts);
  
  return {
    status,
    singleEmbedding: {
      model: embedding.model,
      dimension: embedding.dimension,
      sample: embedding.embedding.slice(0, 5)
    },
    batchEmbeddings: {
      count: batchEmbeddings.length,
      dimensions: batchEmbeddings[0].dimension
    }
  };
}

// Test 7: Parallel Processing
async function testParallelProcessing() {
  const processor = new ParallelDocumentProcessor({
    maxConcurrentChunks: 3,
    enableBatching: true,
    batchSize: 2
  });
  
  // Create test documents
  const testDocs = [
    {
      buffer: Buffer.from(TEST_CONFIG.testText),
      filename: 'test1.pdf',
      originalName: 'Test Document 1'
    },
    {
      buffer: Buffer.from(TEST_CONFIG.testText.replace('Youth', 'Young People')),
      filename: 'test2.pdf',
      originalName: 'Test Document 2'
    }
  ];
  
  let progressUpdates = 0;
  
  const results = await processor.processDocuments(testDocs, {
    generateEmbeddings: false, // Skip embeddings for speed
    generateSummary: false,
    onProgress: () => {
      progressUpdates++;
    }
  });
  
  await processor.shutdown();
  
  return {
    processedCount: results.filter(r => r.success).length,
    failedCount: results.filter(r => !r.success).length,
    progressUpdates,
    metrics: processor.getProcessingMetrics()
  };
}

// Test 8: Full Integration Test
async function testFullIntegration() {
  if (!existsSync(TEST_CONFIG.testPdfPath)) {
    return { skipped: 'No test PDF available' };
  }
  
  const buffer = readFileSync(TEST_CONFIG.testPdfPath);
  
  // Step 1: Extract text
  const extractor = new ImprovedPDFExtractor(buffer);
  const extraction = await extractor.extractText();
  
  // Step 2: Adaptive chunking
  const chunker = new DocumentChunker();
  const chunkResult = await chunker.analyzeAndChunk(extraction.text);
  
  // Step 3: Process chunks (without AI)
  const chunks = chunkResult.chunks.slice(0, 3); // Process first 3 chunks only
  const processedChunks = [];
  
  for (const chunk of chunks) {
    const analysis = await FallbackStrategies.basicAnalysis(chunk.text);
    processedChunks.push({
      chunkId: chunk.index,
      themes: analysis.themes,
      keywords: analysis.keywords.slice(0, 5)
    });
  }
  
  return {
    extraction: {
      method: extraction.method,
      confidence: extraction.confidence,
      textLength: extraction.text.length
    },
    chunking: {
      strategy: chunkResult.recommendedStrategy,
      chunkCount: chunkResult.chunks.length
    },
    processing: {
      processedChunks: processedChunks.length,
      sampleThemes: processedChunks[0]?.themes || []
    }
  };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Document Processing Tests\n');
  console.log('Configuration:', {
    testPdfPath: TEST_CONFIG.testPdfPath,
    pdfExists: existsSync(TEST_CONFIG.testPdfPath)
  });
  
  // Run all tests
  await runTest('PDF Extraction', testPDFExtraction);
  await runTest('Adaptive Chunking', testAdaptiveChunking);
  await runTest('Document Analysis', testDocumentAnalysis);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Graceful Degradation', testGracefulDegradation);
  await runTest('Embeddings Service', testEmbeddingsService);
  await runTest('Parallel Processing', testParallelProcessing);
  await runTest('Full Integration', testFullIntegration);
  
  // Summary
  console.log('\n📊 Test Summary\n');
  
  const passed = testResults.filter(r => r.status === 'passed').length;
  const failed = testResults.filter(r => r.status === 'failed').length;
  const skipped = testResults.filter(r => r.status === 'skipped').length;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`⏱️  Total duration: ${totalDuration}ms`);
  
  // Failed test details
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }
  
  // Performance analysis
  console.log('\n⚡ Performance:');
  const sortedByDuration = [...testResults]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 3);
  
  sortedByDuration.forEach(r => {
    console.log(`  - ${r.name}: ${r.duration}ms`);
  });
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
  });
}

export { runAllTests };