import { prisma } from '@/lib/database-safe';
import { ProcessingResult } from './document-processor';

export class DatabaseSaver {
  
  /**
   * Save processing results to database
   */
  static async saveProcessingResults(
    documentId: string, 
    results: ProcessingResult
  ): Promise<void> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      console.log(`Saving processing results for document ${documentId}`);

      // Save themes
      for (const theme of results.themes) {
        try {
          await prisma.$queryRaw`
            INSERT INTO document_themes (
              id, document_id, theme_name, description, confidence_score, 
              cultural_significance, ai_model, created_at
            ) VALUES (
              gen_random_uuid(), 
              ${documentId}::uuid,
              ${theme.theme_name},
              ${theme.description},
              ${theme.confidence_score},
              ${theme.cultural_significance || 'public'},
              'gpt-4o-mini',
              NOW()
            )
          `;
        } catch (error) {
          console.error('Error saving theme:', error);
        }
      }

      // Save quotes
      for (const quote of results.quotes) {
        try {
          await prisma.$queryRaw`
            INSERT INTO document_quotes (
              id, document_id, quote_text, knowledge_holder, cultural_sensitivity,
              requires_attribution, start_position, end_position, created_at
            ) VALUES (
              gen_random_uuid(),
              ${documentId}::uuid,
              ${quote.quote_text},
              ${quote.knowledge_holder},
              ${quote.cultural_sensitivity},
              ${quote.requires_attribution},
              ${quote.start_position},
              ${quote.end_position},
              NOW()
            )
          `;
        } catch (error) {
          console.error('Error saving quote:', error);
        }
      }

      // Save insights
      for (const insight of results.insights) {
        try {
          await prisma.$queryRaw`
            INSERT INTO document_insights (
              id, document_id, insight, type, confidence, evidence, created_at
            ) VALUES (
              gen_random_uuid(),
              ${documentId}::uuid,
              ${insight.insight},
              ${insight.type},
              ${insight.confidence},
              ${JSON.stringify(insight.evidence)},
              NOW()
            )
          `;
        } catch (error) {
          console.error('Error saving insight:', error);
        }
      }

      // Save entities
      for (const entity of results.entities) {
        try {
          await prisma.$queryRaw`
            INSERT INTO document_entities (
              id, document_id, type, name, category, confidence, context, 
              validation_status, created_at
            ) VALUES (
              gen_random_uuid(),
              ${documentId}::uuid,
              ${entity.type},
              ${entity.name},
              ${entity.category},
              ${entity.confidence},
              ${entity.context},
              'pending',
              NOW()
            )
          `;
        } catch (error) {
          console.error('Error saving entity:', error);
        }
      }

      // Update document processing status
      const analysisJson = JSON.stringify({
        themes_found: results.themes.length,
        quotes_found: results.quotes.length,
        insights_found: results.insights.length,
        entities_found: results.entities.length,
        processed_at: new Date().toISOString(),
        ai_model: 'gpt-4o-mini'
      });

      await prisma.$queryRaw`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          processed_at = NOW(),
          ai_analysis = ${analysisJson}::jsonb
        WHERE id = ${documentId}::uuid
      `;

      console.log(`Successfully saved processing results for document ${documentId}`);

    } catch (error) {
      console.error(`Error saving processing results for document ${documentId}:`, error);
      
      // Update document status to failed
      try {
        await prisma.$queryRaw`
          UPDATE documents 
          SET processing_status = 'failed'
          WHERE id = ${documentId}::uuid
        `;
      } catch (updateError) {
        console.error('Error updating document status to failed:', updateError);
      }
      
      throw error;
    }
  }

  /**
   * Get processing statistics for a document
   */
  static async getProcessingStats(documentId: string): Promise<{
    themes: number;
    quotes: number;
    insights: number;
    entities: number;
  }> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      const stats = await prisma.$queryRaw<Array<any>>`
        SELECT 
          (SELECT COUNT(*) FROM document_themes WHERE document_id = ${documentId}::uuid) as themes,
          (SELECT COUNT(*) FROM document_quotes WHERE document_id = ${documentId}::uuid) as quotes,
          (SELECT COUNT(*) FROM document_insights WHERE document_id = ${documentId}::uuid) as insights,
          (SELECT COUNT(*) FROM document_entities WHERE document_id = ${documentId}::uuid) as entities
      `;

      return {
        themes: parseInt(stats[0]?.themes || '0'),
        quotes: parseInt(stats[0]?.quotes || '0'),
        insights: parseInt(stats[0]?.insights || '0'),
        entities: parseInt(stats[0]?.entities || '0')
      };

    } catch (error) {
      console.error(`Error getting processing stats for document ${documentId}:`, error);
      return { themes: 0, quotes: 0, insights: 0, entities: 0 };
    }
  }

  /**
   * Check if document has been processed
   */
  static async isDocumentProcessed(documentId: string): Promise<boolean> {
    if (!prisma) {
      return false;
    }

    try {
      const result = await prisma.$queryRaw<Array<any>>`
        SELECT processing_status 
        FROM documents 
        WHERE id = ${documentId}::uuid
      `;

      return result[0]?.processing_status === 'completed';

    } catch (error) {
      console.error(`Error checking if document ${documentId} is processed:`, error);
      return false;
    }
  }

  /**
   * Mark document as being processed
   */
  static async markDocumentProcessing(documentId: string): Promise<void> {
    if (!prisma) {
      throw new Error('Database not available');
    }

    try {
      await prisma.$queryRaw`
        UPDATE documents 
        SET processing_status = 'processing'
        WHERE id = ${documentId}::uuid
      `;

    } catch (error) {
      console.error(`Error marking document ${documentId} as processing:`, error);
      throw error;
    }
  }

  /**
   * Get all unprocessed documents
   */
  static async getUnprocessedDocuments(): Promise<Array<{
    id: string;
    title: string;
    file_type: string;
    created_at: string;
  }>> {
    if (!prisma) {
      return [];
    }

    try {
      const documents = await prisma.$queryRaw<Array<any>>`
        SELECT id, title, file_type, created_at
        FROM documents 
        WHERE processing_status IS NULL 
           OR processing_status = 'uploaded'
           OR processing_status = 'pending'
        ORDER BY created_at ASC
      `;

      return documents;

    } catch (error) {
      console.error('Error getting unprocessed documents:', error);
      return [];
    }
  }
}