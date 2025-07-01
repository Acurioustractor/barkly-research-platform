/**
 * Enhanced embeddings service with robust pgvector support
 * Handles vector storage, search, and dimension mismatches gracefully
 */

import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { prisma } from '@/lib/database-safe';
import { 
  ErrorHandler, 
  ErrorType,
  DocumentProcessingError,
  RetryHandler 
} from '@/utils/error-handler';

export interface EmbeddingProvider {
  type: 'openai' | 'anthropic' | 'local';
  model: string;
  dimension: number;
}

export interface VectorSearchResult {
  documentId: string;
  chunkId: string;
  text: string;
  similarity: number;
  metadata?: any;
}

export interface EmbeddingOptions {
  provider?: 'openai' | 'anthropic' | 'local';
  model?: string;
  batchSize?: number;
  maxRetries?: number;
  normalizeEmbeddings?: boolean;
}

export class EnhancedEmbeddingsService {
  private openai: OpenAI | null;
  private anthropic: Anthropic | null;
  private providers: Map<string, EmbeddingProvider>;
  private pgVectorEnabled: boolean = false;
  private dimension: number;

  constructor(options: EmbeddingOptions = {}) {
    // Initialize providers
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;

    // Set up provider configurations
    this.providers = new Map([
      ['openai-small', { type: 'openai', model: 'text-embedding-3-small', dimension: 1536 }],
      ['openai-large', { type: 'openai', model: 'text-embedding-3-large', dimension: 3072 }],
      ['openai-ada', { type: 'openai', model: 'text-embedding-ada-002', dimension: 1536 }]
    ]);

    // Set default provider
    const defaultProvider = options.provider || 'openai';
    const defaultModel = options.model || 'text-embedding-3-small';
    const providerKey = `${defaultProvider}-${defaultModel.split('-').pop()}`;
    
    const provider = this.providers.get(providerKey) || this.providers.get('openai-small')!;
    this.dimension = provider.dimension;

    // Check pgvector availability
    this.checkPgVectorSupport();
  }

  /**
   * Check if pgvector extension is available
   */
  private async checkPgVectorSupport(): Promise<void> {
    if (!prisma) return;

    try {
      const result = await prisma!.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as has_vector
      ` as Array<{ has_vector: boolean }>;

      this.pgVectorEnabled = result[0]?.has_vector || false;

      if (!this.pgVectorEnabled) {
        console.warn('pgvector extension not found. Vector search will be limited.');
      } else {
        // Verify vector column exists
        await this.ensureVectorColumns();
      }
    } catch (error) {
      console.error('Failed to check pgvector support:', error);
      this.pgVectorEnabled = false;
    }
  }

  /**
   * Ensure vector columns exist in the database
   */
  private async ensureVectorColumns(): Promise<void> {
    try {
      // Check if embedding column exists
      const columnExists = await prisma!.$queryRaw`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'chunks' 
          AND column_name = 'embedding'
        ) as exists
      ` as Array<{ exists: boolean }>;

      if (!columnExists[0]?.exists) {
        // Add embedding column
        await prisma!.$executeRawUnsafe(`
          ALTER TABLE chunks 
          ADD COLUMN IF NOT EXISTS embedding vector(${this.dimension})
        `);

        // Create index for vector similarity search
        await prisma!.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS chunks_embedding_idx 
          ON chunks 
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `);

        console.log('Vector columns and indexes created successfully');
      }
    } catch (error) {
      console.error('Failed to ensure vector columns:', error);
      throw new DocumentProcessingError({
        type: ErrorType.DATABASE,
        message: 'Failed to set up vector storage',
        originalError: error as Error,
        recoverable: false,
        retryable: false,
        suggestions: [
          'Ensure pgvector extension is installed',
          'Check database permissions',
          'Run: CREATE EXTENSION IF NOT EXISTS vector;'
        ]
      });
    }
  }

  /**
   * Generate embedding for a text with fallback support
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<{ embedding: number[]; model: string; dimension: number }> {
    const provider = options.provider || 'openai';
    
    try {
      let embedding: number[];
      let model: string;

      if (provider === 'openai' && this.openai) {
        const result = await RetryHandler.withRetry(
          async () => {
            const response = await this.openai!.embeddings.create({
              model: options.model || 'text-embedding-3-small',
              input: text,
            });
            return response.data[0]?.embedding || [];
          },
          { maxRetries: options.maxRetries || 3 }
        );
        
        embedding = result;
        model = options.model || 'text-embedding-3-small';
      } else {
        // Fallback to a simple hash-based embedding for testing
        embedding = this.generateLocalEmbedding(text, this.dimension);
        model = 'local-hash';
      }

      // Normalize if requested
      if (options.normalizeEmbeddings) {
        embedding = this.normalizeVector(embedding);
      }

      return {
        embedding,
        model,
        dimension: embedding.length
      };
    } catch (error) {
      throw ErrorHandler.handleAIError(
        error as Error,
        ErrorHandler.createContext(undefined, undefined, 'embedding-generation')
      );
    }
  }

  /**
   * Generate embeddings for multiple texts efficiently
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<Array<{ embedding: number[]; model: string; dimension: number }>> {
    const batchSize = options.batchSize || 20; // OpenAI max is 2048 inputs
    const results: Array<{ embedding: number[]; model: string; dimension: number }> = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        if (this.openai && options.provider !== 'local') {
          const response = await RetryHandler.withRetry(
            async () => this.openai!.embeddings.create({
              model: options.model || 'text-embedding-3-small',
              input: batch,
            }),
            { maxRetries: options.maxRetries || 3 }
          );

          const model = options.model || 'text-embedding-3-small';
          const embeddings = response.data.map(item => ({
            embedding: options.normalizeEmbeddings 
              ? this.normalizeVector(item.embedding)
              : item.embedding,
            model,
            dimension: item.embedding.length
          }));

          results.push(...embeddings);
        } else {
          // Fallback to local embeddings
          const localEmbeddings = batch.map(text => ({
            embedding: this.generateLocalEmbedding(text, this.dimension),
            model: 'local-hash',
            dimension: this.dimension
          }));
          results.push(...localEmbeddings);
        }
      } catch (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error);
        
        // Process individually as fallback
        for (const text of batch) {
          try {
            const result = await this.generateEmbedding(text, options);
            results.push(result);
          } catch (individualError) {
            // Use local embedding as last resort
            results.push({
              embedding: this.generateLocalEmbedding(text, this.dimension),
              model: 'local-hash-fallback',
              dimension: this.dimension
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Store embedding with automatic dimension handling
   */
  async storeEmbedding(params: {
    documentId: string;
    chunkId: string;
    text: string;
    embedding?: number[];
  }): Promise<void> {
    if (!prisma || !this.pgVectorEnabled) {
      console.warn('Embedding storage skipped - pgvector not available');
      return;
    }

    try {
      // Generate embedding if not provided
      const embedding = params.embedding || 
        (await this.generateEmbedding(params.text)).embedding;

      // Ensure correct dimension
      const paddedEmbedding = this.ensureDimension(embedding, this.dimension);

      // Store in database
      await prisma!.$executeRaw`
        UPDATE chunks 
        SET embedding = ${paddedEmbedding}::vector(${this.dimension}),
            embedding_model = ${`openai-${this.dimension}`},
            embedding_updated_at = NOW()
        WHERE id = ${params.chunkId}
      `;
    } catch (error) {
      throw ErrorHandler.handleEmbeddingError(
        error as Error,
        ErrorHandler.createContext(params.documentId, undefined, 'embedding-storage')
      );
    }
  }

  /**
   * Perform semantic search with fallback to keyword search
   */
  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      documentIds?: string[];
      fallbackToKeyword?: boolean;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const { 
      limit = 10, 
      threshold = 0.7, 
      documentIds,
      fallbackToKeyword = true 
    } = options;

    try {
      if (!this.pgVectorEnabled) {
        throw new Error('pgvector not available');
      }

      // Generate query embedding
      const { embedding: queryEmbedding } = await this.generateEmbedding(query);
      const paddedEmbedding = this.ensureDimension(queryEmbedding, this.dimension);

      // Build query with optional document filter
      let whereClause = 'WHERE c.embedding IS NOT NULL';
      if (documentIds && documentIds.length > 0) {
        whereClause += ` AND c."documentId" IN (${documentIds.map(id => `'${id}'`).join(',')})`;
      }

      const results = await prisma!.$queryRaw`
        SELECT 
          c.id as "chunkId",
          c."documentId",
          c.text as text,
          1 - (c.embedding <=> ${paddedEmbedding}::vector(${this.dimension})) as similarity
        FROM document_chunks c
        ${whereClause}
        AND 1 - (c.embedding <=> ${paddedEmbedding}::vector(${this.dimension})) > ${threshold}
        ORDER BY c.embedding <=> ${paddedEmbedding}::vector(${this.dimension})
        LIMIT ${limit}
      ` as VectorSearchResult[];

      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      
      if (fallbackToKeyword) {
        // Fallback to keyword search
        return this.keywordSearch(query, { limit, documentIds });
      }
      
      throw ErrorHandler.handleEmbeddingError(
        error as Error,
        ErrorHandler.createContext(undefined, undefined, 'semantic-search')
      );
    }
  }

  /**
   * Keyword-based search fallback
   */
  private async keywordSearch(
    query: string,
    options: {
      limit?: number;
      documentIds?: string[];
    } = {}
  ): Promise<VectorSearchResult[]> {
    if (!prisma) return [];

    const { limit = 10, documentIds } = options;
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    try {
      const chunks = await prisma!.documentChunk.findMany({
        where: {
          AND: [
            documentIds ? { documentId: { in: documentIds } } : {},
            {
              OR: keywords.map(keyword => ({
                text: { contains: keyword, mode: 'insensitive' }
              }))
            }
          ]
        },
        select: {
          id: true,
          documentId: true,
          text: true
        },
        take: limit * 2 // Get more results to rank
      });

      // Calculate relevance score
      const scored = chunks.map(chunk => {
        const text = chunk.text.toLowerCase();
        const score = keywords.reduce((sum, keyword) => {
          const occurrences = (text.match(new RegExp(keyword, 'g')) || []).length;
          return sum + occurrences;
        }, 0) / keywords.length;

        return {
          chunkId: chunk.id,
          documentId: chunk.documentId,
          text: chunk.text,
          similarity: Math.min(score / 10, 1), // Normalize to 0-1
          metadata: undefined
        };
      });

      // Sort by score and limit
      return scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Keyword search failed:', error);
      return [];
    }
  }

  /**
   * Find similar chunks across documents
   */
  async findSimilarChunks(
    chunkId: string,
    options: {
      limit?: number;
      threshold?: number;
      excludeSameDocument?: boolean;
    } = {}
  ): Promise<VectorSearchResult[]> {
    if (!prisma || !this.pgVectorEnabled) return [];

    const { limit = 5, threshold = 0.8, excludeSameDocument = true } = options;

    try {
      // Get the source chunk
      const sourceChunk = await prisma!.documentChunk.findUnique({
        where: { id: chunkId },
        select: { 
          documentId: true,
          text: true
        }
      });

      if (!sourceChunk) return [];

      // Get embedding from database or generate new one
      const embeddingResult = await prisma!.$queryRaw`
        SELECT embedding 
        FROM chunks 
        WHERE id = ${chunkId} 
        AND embedding IS NOT NULL
      ` as Array<{ embedding: any }>;

      let embedding: number[];
      
      if (embeddingResult[0]?.embedding) {
        embedding = embeddingResult[0].embedding;
      } else {
        // Generate and store embedding
        const { embedding: newEmbedding } = await this.generateEmbedding(sourceChunk.text);
        await this.storeEmbedding({
          documentId: sourceChunk.documentId,
          chunkId,
          text: sourceChunk.text,
          embedding: newEmbedding
        });
        embedding = newEmbedding;
      }

      // Find similar chunks
      let whereClause = `WHERE c.id != ${chunkId} AND c.embedding IS NOT NULL`;
      if (excludeSameDocument) {
        whereClause += ` AND c."documentId" != '${sourceChunk.documentId}'`;
      }

      const results = await prisma!.$queryRaw`
        SELECT 
          c.id as "chunkId",
          c."documentId",
          c.text as text,
          1 - (c.embedding <=> ${embedding}::vector(${this.dimension})) as similarity
        FROM document_chunks c
        ${whereClause}
        AND 1 - (c.embedding <=> ${embedding}::vector(${this.dimension})) > ${threshold}
        ORDER BY c.embedding <=> ${embedding}::vector(${this.dimension})
        LIMIT ${limit}
      ` as VectorSearchResult[];

      return results;
    } catch (error) {
      console.error('Find similar chunks failed:', error);
      return [];
    }
  }

  /**
   * Generate local embedding using hashing (for testing/fallback)
   */
  private generateLocalEmbedding(text: string, dimension: number): number[] {
    // Simple hash-based embedding for testing
    const embedding = new Array(dimension).fill(0);
    
    // Use character codes to generate deterministic values
    for (let i = 0; i < text.length; i++) {
      const idx = i % dimension;
      embedding[idx] += text.charCodeAt(i) / 1000;
    }
    
    // Add some variation based on word count
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const idx = (i * 7) % dimension;
      embedding[idx] += (words[i]?.length || 0) / 10;
    }
    
    // Normalize
    return this.normalizeVector(embedding);
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    
    if (magnitude === 0) return vector;
    
    return vector.map(val => val / magnitude);
  }

  /**
   * Ensure embedding has correct dimension (pad or truncate)
   */
  private ensureDimension(embedding: number[], targetDimension: number): number[] {
    if (embedding.length === targetDimension) {
      return embedding;
    }
    
    if (embedding.length < targetDimension) {
      // Pad with zeros
      return [...embedding, ...new Array(targetDimension - embedding.length).fill(0)];
    }
    
    // Truncate
    return embedding.slice(0, targetDimension);
  }

  /**
   * Get service status and capabilities
   */
  async getStatus(): Promise<{
    available: boolean;
    provider: string;
    model: string;
    dimension: number;
    pgVectorEnabled: boolean;
    fallbackAvailable: boolean;
  }> {
    return {
      available: !!(this.openai || this.anthropic),
      provider: this.openai ? 'openai' : this.anthropic ? 'anthropic' : 'local',
      model: this.openai ? 'text-embedding-3-small' : 'local-hash',
      dimension: this.dimension,
      pgVectorEnabled: this.pgVectorEnabled,
      fallbackAvailable: true
    };
  }

  /**
   * Generate and store embeddings for a document
   */
  async generateAndStoreEmbedding(params: {
    documentId: string;
    chunkId: string;
    text: string;
  }): Promise<void> {
    try {
      await this.storeEmbedding(params);
    } catch (error) {
      console.error('Failed to store embedding:', error);
      // Continue processing even if embedding storage fails
    }
  }
}