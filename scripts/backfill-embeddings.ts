#!/usr/bin/env tsx

/**
 * Script to backfill embeddings for existing documents
 * Processes documents without embeddings in batches
 */

import { prisma } from '../src/lib/database-safe';
import { Prisma } from '@prisma/client';
import { EnhancedEmbeddingsService } from '../src/lib/embeddings-service-enhanced';
import { ParallelProcessor } from '../src/utils/parallel-processor';

interface BackfillOptions {
  batchSize?: number;
  maxConcurrent?: number;
  documentIds?: string[];
  dryRun?: boolean;
  verbose?: boolean;
}

async function backfillEmbeddings(options: BackfillOptions = {}) {
  const {
    batchSize = 50,
    maxConcurrent = 3,
    documentIds,
    dryRun = false,
    verbose = true
  } = options;

  if (!prisma) {
    console.error('Database connection not available');
    process.exit(1);
  }

  console.log('Starting embedding backfill process...');
  console.log('Options:', { batchSize, maxConcurrent, dryRun, documentIds });

  const embeddingsService = new EnhancedEmbeddingsService();
  
  // Check service status
  const status = await embeddingsService.getStatus();
  console.log('Embeddings service status:', status);

  if (!status.available && !status.fallbackAvailable) {
    console.error('No embedding service available');
    process.exit(1);
  }

  try {
    // Get chunks without embeddings
    const whereClause = {
      embedding: { equals: Prisma.DbNull },
      ...(documentIds ? { documentId: { in: documentIds } } : {})
    };

    const totalCount = await prisma.documentChunk.count({ where: whereClause });
    console.log(`Found ${totalCount} chunks without embeddings`);

    if (totalCount === 0) {
      console.log('All chunks already have embeddings!');
      return;
    }

    if (dryRun) {
      console.log('DRY RUN - No changes will be made');
      
      // Show sample of chunks that would be processed
      const sampleChunks = await prisma.documentChunk.findMany({
        where: whereClause,
        take: 10,
        select: {
          id: true,
          documentId: true,
          text: true
        }
      });

      console.log('\nSample chunks that would be processed:');
      sampleChunks.forEach(chunk => {
        console.log(`- Chunk ${chunk.id} (Doc: ${chunk.documentId}, Length: ${chunk.text.length})`);
      });

      return;
    }

    // Process in batches
    let processed = 0;
    let failed = 0;
    const startTime = Date.now();

    const processor = new ParallelProcessor<{ id: string; documentId: string; text: string }, { success: boolean; error?: string }>({
      maxConcurrency: maxConcurrent,
      maxRequestsPerMinute: 60,
      enableMetrics: true
    });

    // Set up progress tracking
    processor.on('metrics', (metrics) => {
      if (verbose) {
        console.log(`Progress: ${processed}/${totalCount} (${failed} failed) - RPM: ${metrics.requestsPerMinute}`);
      }
    });

    // Process chunks in pages
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const chunks = await prisma.documentChunk.findMany({
        where: whereClause,
        take: batchSize,
        skip: page * batchSize,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          documentId: true,
          text: true
        }
      });

      if (chunks.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\nProcessing batch ${page + 1} (${chunks.length} chunks)...`);

      // Process batch in parallel
      const results = await processor.processBatch(
        chunks,
        async (chunk) => {
          try {
            await embeddingsService.storeEmbedding({
              documentId: chunk.documentId,
              chunkId: chunk.id,
              text: chunk.text
            });
            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        }
      );

      // Count results
      const batchProcessed = results.filter(r => r.success).length;
      const batchFailed = results.filter(r => !r.success).length;

      processed += batchProcessed;
      failed += batchFailed;

      if (batchFailed > 0 && verbose) {
        console.log(`Failed chunks in batch:`, 
          results.filter(r => !r.success).map((r, i) => ({
            chunkId: chunks[i]?.id || 'unknown',
            error: r.error
          }))
        );
      }

      page++;

      // Add delay between batches to avoid rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await processor.shutdown();

    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log('\n=== Backfill Complete ===');
    console.log(`Total processed: ${processed}`);
    console.log(`Total failed: ${failed}`);
    console.log(`Success rate: ${((processed / (processed + failed)) * 100).toFixed(2)}%`);
    console.log(`Duration: ${minutes}m ${seconds}s`);
    console.log(`Average time per chunk: ${(duration / (processed + failed)).toFixed(0)}ms`);

    // Show statistics
    if (status.pgVectorEnabled) {
      const stats = await prisma.$queryRaw`
        SELECT * FROM embedding_statistics()
      ` as any[];

      if (stats[0]) {
        console.log('\n=== Embedding Statistics ===');
        console.log(`Total chunks: ${stats[0].total_chunks}`);
        console.log(`Chunks with embeddings: ${stats[0].chunks_with_embeddings}`);
        console.log(`Coverage: ${stats[0].embedding_coverage_percent}%`);
        console.log(`Vector storage: ${stats[0].total_vector_storage_mb?.toFixed(2) || 0} MB`);
      }
    }

  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options: BackfillOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch-size':
        options.batchSize = parseInt(args[++i] || '100');
        break;
      case '--max-concurrent':
        options.maxConcurrent = parseInt(args[++i] || '3');
        break;
      case '--document-ids':
        options.documentIds = (args[++i] || '').split(',');
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--quiet':
        options.verbose = false;
        break;
      case '--help':
        console.log(`
Backfill Embeddings Script

Usage: tsx scripts/backfill-embeddings.ts [options]

Options:
  --batch-size <n>      Number of chunks per batch (default: 50)
  --max-concurrent <n>  Maximum concurrent operations (default: 3)
  --document-ids <ids>  Comma-separated document IDs to process
  --dry-run            Show what would be processed without making changes
  --quiet              Reduce output verbosity
  --help               Show this help message

Examples:
  # Process all chunks without embeddings
  tsx scripts/backfill-embeddings.ts

  # Dry run to see what would be processed
  tsx scripts/backfill-embeddings.ts --dry-run

  # Process specific documents
  tsx scripts/backfill-embeddings.ts --document-ids doc1,doc2,doc3

  # Process with custom settings
  tsx scripts/backfill-embeddings.ts --batch-size 100 --max-concurrent 5
        `);
        process.exit(0);
    }
  }

  await backfillEmbeddings(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { backfillEmbeddings };