import OpenAI from 'openai';
import { prisma } from '@/lib/database-safe';

// Initialize OpenAI client for embeddings
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface VectorSearchResult {
  documentId: string;
  chunkId: string;
  text: string;
  similarity: number;
  metadata?: any;
}

export class EmbeddingsService {
  private embeddingModel: string;
  // private embeddingDimension: number; // Not currently used

  constructor() {
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    // this.embeddingDimension = this.embeddingModel === 'text-embedding-3-large' ? 3072 : 1536;
  }

  /**
   * Generate embedding for a text chunk
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured for embeddings');
    }

    try {
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data returned');
      }
      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('Invalid embedding response');
      }
      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured for embeddings');
    }

    try {
      // OpenAI allows batch embedding requests
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }

  /**
   * Store embeddings for document chunks
   */
  async storeChunkEmbeddings(
    _documentId: string, 
    chunks: Array<{ id: string; text: string }>
  ): Promise<void> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    // Process in batches to avoid rate limits
    const batchSize = 10;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map(chunk => chunk.text);
      
      try {
        const embeddings = await this.generateBatchEmbeddings(texts);
        
        // Store embeddings in database
        // Note: This assumes we add an embedding column to DocumentChunk table
        await Promise.all(
          batch.map(async (chunk, index) => {
            await prisma!.$executeRaw`
              UPDATE document_chunks 
              SET embedding = ${embeddings[index]}::vector(1536)
              WHERE id = ${chunk.id}
            `;
          })
        );
      } catch (error) {
        console.error(`Failed to process embedding batch ${i/batchSize + 1}:`, error);
      }
    }
  }

  /**
   * Search for similar documents using vector similarity
   */
  async semanticSearch(
    query: string, 
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<VectorSearchResult[]> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Perform vector similarity search
      // Note: This uses pgvector extension for PostgreSQL
      const results = await prisma.$queryRaw`
        SELECT 
          dc.id as "chunkId",
          dc."documentId",
          dc.text,
          dc.metadata,
          1 - (dc.embedding <=> ${queryEmbedding}::vector(1536)) as similarity
        FROM document_chunks dc
        WHERE dc.embedding IS NOT NULL
          AND 1 - (dc.embedding <=> ${queryEmbedding}::vector(1536)) > ${threshold}
        ORDER BY dc.embedding <=> ${queryEmbedding}::vector(1536)
        LIMIT ${limit}
      ` as VectorSearchResult[];

      return results;
    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  /**
   * Find similar documents to a given document
   */
  async findSimilarDocuments(
    documentId: string,
    limit: number = 5
  ): Promise<Array<{ documentId: string; similarity: number; title: string }>> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      // Get embeddings for the source document
      const sourceChunks = await prisma.documentChunk.findMany({
        where: { documentId },
        select: { id: true, text: true }
      });

      if (sourceChunks.length === 0) {
        return [];
      }

      // Calculate document-level embedding (average of chunk embeddings)
      const chunkEmbeddings = await this.generateBatchEmbeddings(
        sourceChunks.map(c => c.text)
      );

      const docEmbedding = this.averageEmbeddings(chunkEmbeddings);

      // Find similar documents
      const results = await prisma.$queryRaw`
        WITH doc_embeddings AS (
          SELECT 
            d.id as "documentId",
            d."originalName" as title,
            AVG(dc.embedding) as avg_embedding
          FROM documents d
          JOIN document_chunks dc ON d.id = dc."documentId"
          WHERE d.id != ${documentId}
            AND dc.embedding IS NOT NULL
          GROUP BY d.id, d."originalName"
        )
        SELECT 
          "documentId",
          title,
          1 - (avg_embedding <=> ${docEmbedding}::vector(1536)) as similarity
        FROM doc_embeddings
        ORDER BY avg_embedding <=> ${docEmbedding}::vector(1536)
        LIMIT ${limit}
      ` as Array<{ documentId: string; similarity: number; title: string }>;

      return results;
    } catch (error) {
      console.error('Find similar documents error:', error);
      throw new Error('Failed to find similar documents');
    }
  }

  /**
   * Calculate average of multiple embeddings
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    
    const firstEmbedding = embeddings[0];
    if (!firstEmbedding) return [];
    
    const dimension = firstEmbedding.length;
    const avg = new Array(dimension).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        avg[i] += embedding[i] || 0;
      }
    }
    
    return avg.map(val => val / embeddings.length);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}