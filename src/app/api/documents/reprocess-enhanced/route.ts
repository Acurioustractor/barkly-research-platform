import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { processAnyDocument } from '@/utils/unified-document-processor';
import { AnthropicProcessor } from '@/lib/ai-processing/anthropic-processor';

export async function POST(request: NextRequest) {
  try {
    const { documentId, forceVision } = await request.json();

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    console.log(`[EnhancedReprocess] Starting enhanced reprocessing for document: ${documentId}`);

    // Get document details
    const document = await prisma.$queryRaw<Array<any>>`
      SELECT id, title, content, file_type, processing_status
      FROM documents 
      WHERE id = ${documentId}::uuid
    `;

    if (!document || document.length === 0) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    const doc = document[0];
    console.log(`[EnhancedReprocess] Processing document: ${doc.title}`);

    // Mark as processing
    await prisma.$queryRaw`
      UPDATE documents 
      SET processing_status = 'processing',
          processed_at = NULL,
          ai_analysis = NULL
      WHERE id = ${documentId}::uuid
    `;

    // Clear existing extractions
    await prisma.$queryRaw`DELETE FROM document_themes WHERE document_id = ${documentId}::uuid`;
    await prisma.$queryRaw`DELETE FROM document_quotes WHERE document_id = ${documentId}::uuid`;
    await prisma.$queryRaw`DELETE FROM document_insights WHERE document_id = ${documentId}::uuid`;

    let processingResult;
    let extractedContent = '';
    let processingMethod = 'unknown';

    // Check if we have content in the database
    if (doc.content && doc.content.length > 100) {
      console.log(`[EnhancedReprocess] Using existing content from database (${doc.content.length} chars)`);
      extractedContent = doc.content;
      processingMethod = 'database-content';
      
      // Process with Anthropic
      try {
        const anthropicResult = await AnthropicProcessor.processWithClaude(extractedContent, doc.title);
        processingResult = {
          text: extractedContent,
          method: 'database-content-anthropic',
          confidence: 0.85,
          warnings: ['Used existing database content'],
          services: anthropicResult.themes || [],
          quotes: anthropicResult.quotes || [],
          insights: anthropicResult.insights || []
        };
      } catch (anthropicError) {
        console.error(`[EnhancedReprocess] Anthropic processing failed:`, anthropicError);
        processingResult = {
          text: extractedContent,
          method: 'database-content-only',
          confidence: 0.6,
          warnings: ['Used database content, AI processing failed'],
          services: [],
          quotes: [],
          insights: []
        };
      }
    } else {
      // Need to re-extract content - but we don't have the original file
      console.log(`[EnhancedReprocess] No usable content in database, cannot reprocess without original file`);
      
      // Mark as failed and provide helpful error
      const errorAnalysis = JSON.stringify({
        error: "Cannot reprocess without original file content", 
        suggestion: "Re-upload the document for enhanced processing"
      });
      
      await prisma.$queryRaw`
        UPDATE documents 
        SET processing_status = 'failed',
            ai_analysis = ${errorAnalysis}::jsonb
        WHERE id = ${documentId}::uuid
      `;

      return NextResponse.json({
        success: false,
        error: 'Cannot reprocess without original file',
        message: 'This document cannot be reprocessed because the original file content is not available.',
        suggestion: 'Please re-upload the document to use the enhanced processing capabilities.',
        documentId,
        currentStatus: 'failed'
      });
    }

    // Save results to database
    let savedCount = 0;

    // Save services/themes
    if (processingResult.services && processingResult.services.length > 0) {
      for (const service of processingResult.services) {
        const description = service.description || service.name || 'Service extracted from reprocessing';
        
        await prisma.$queryRaw`
          INSERT INTO document_themes (
            id, document_id, theme_name, description, confidence_score, 
            cultural_significance, ai_model, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${documentId}::uuid,
            ${service.name || 'Reprocessed Service'},
            ${description},
            ${Math.min(Math.max(service.confidence || 0.8, 0), 1)},
            ${service.cultural_significance || 'public'},
            'enhanced-reprocessing',
            NOW()
          )
        `;
        savedCount++;
      }
    }

    // Save quotes
    let quotesCount = 0;
    if (processingResult.quotes && processingResult.quotes.length > 0) {
      for (const quote of processingResult.quotes) {
        await prisma.$queryRaw`
          INSERT INTO document_quotes (
            id, document_id, quote_text, knowledge_holder, cultural_sensitivity,
            requires_attribution, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${quote.text || ''},
            ${quote.speaker},
            ${quote.cultural_sensitivity || 'public'},
            ${quote.requires_attribution || false},
            NOW()
          )
        `;
        quotesCount++;
      }
    }

    // Save insights
    let insightsCount = 0;
    if (processingResult.insights && processingResult.insights.length > 0) {
      for (const insight of processingResult.insights) {
        const evidenceJson = JSON.stringify(insight.evidence || []);
        await prisma.$queryRaw`
          INSERT INTO document_insights (
            id, document_id, insight, type, confidence, evidence, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${insight.insight || ''},
            ${insight.type || 'community_need'},
            ${Math.min(Math.max(insight.confidence || 0.7, 0), 1)},
            ${evidenceJson}::jsonb,
            NOW()
          )
        `;
        insightsCount++;
      }
    }

    // Update document status
    const analysisJson = JSON.stringify({
      reprocessing_method: processingMethod,
      original_processing_method: processingResult.method,
      themes_found: savedCount,
      quotes_found: quotesCount,
      insights_found: insightsCount,
      confidence: processingResult.confidence,
      warnings: processingResult.warnings || [],
      processed_at: new Date().toISOString(),
      enhancement_notes: 'Enhanced reprocessing with improved extraction methods'
    });

    await prisma.$queryRaw`
      UPDATE documents 
      SET 
        processing_status = 'completed',
        processed_at = NOW(),
        ai_analysis = ${analysisJson}::jsonb
      WHERE id = ${documentId}::uuid
    `;

    console.log(`[EnhancedReprocess] Successfully reprocessed ${doc.title}: ${savedCount} themes, ${quotesCount} quotes, ${insightsCount} insights`);

    return NextResponse.json({
      success: true,
      message: 'Document successfully reprocessed with enhanced methods',
      documentId,
      results: {
        method: processingMethod,
        themes_extracted: savedCount,
        quotes_extracted: quotesCount,
        insights_extracted: insightsCount,
        confidence: processingResult.confidence,
        warnings: processingResult.warnings || []
      },
      navigation: {
        review_url: `/api/documents/review/${documentId}`,
        verification_url: `/api/documents/verify-extraction?documentId=${documentId}`
      }
    });

  } catch (error) {
    console.error('Enhanced reprocessing error:', error);
    
    // Mark as failed
    if (prisma && request.body) {
      const { documentId } = await request.json();
      if (documentId) {
        const failedAnalysis = JSON.stringify({
          error: "Enhanced reprocessing failed", 
          details: "See server logs for details"
        });
        
        await prisma.$queryRaw`
          UPDATE documents 
          SET processing_status = 'failed',
              ai_analysis = ${failedAnalysis}::jsonb
          WHERE id = ${documentId}::uuid
        `;
      }
    }

    return NextResponse.json({
      error: 'Enhanced reprocessing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    if (action === 'failed_documents') {
      // Get all failed documents
      const failedDocs = await prisma.$queryRaw<Array<any>>`
        SELECT 
          id, title, file_type,
          processing_status, created_at, ai_analysis,
          LENGTH(content) as current_content_length
        FROM documents 
        WHERE processing_status = 'failed' OR 
              (processing_status = 'completed' AND (
                NOT EXISTS (SELECT 1 FROM document_themes WHERE document_id = documents.id) AND
                NOT EXISTS (SELECT 1 FROM document_quotes WHERE document_id = documents.id)
              ))
        ORDER BY created_at DESC
      `;

      return NextResponse.json({
        success: true,
        failed_documents: failedDocs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          file_type: doc.file_type,
          processing_status: doc.processing_status,
          created_at: doc.created_at,
          current_content_length: parseInt(doc.current_content_length || 0),
          can_reprocess: doc.current_content_length > 100,
          ai_analysis: doc.ai_analysis
        }))
      });
    }

    if (action === 'processing_summary') {
      // Get processing summary statistics
      const stats = await prisma.$queryRaw<Array<any>>`
        SELECT 
          processing_status,
          COUNT(*) as count,
          AVG(LENGTH(content)) as avg_content_length
        FROM documents 
        GROUP BY processing_status
      `;

      const failedWithoutExtractions = await prisma.$queryRaw<Array<any>>`
        SELECT COUNT(*) as count
        FROM documents 
        WHERE processing_status = 'completed' AND 
              NOT EXISTS (SELECT 1 FROM document_themes WHERE document_id = documents.id) AND
              NOT EXISTS (SELECT 1 FROM document_quotes WHERE document_id = documents.id)
      `;

      return NextResponse.json({
        success: true,
        processing_summary: {
          by_status: stats.map((s: any) => ({
            status: s.processing_status,
            count: parseInt(s.count),
            avg_content_length: Math.round(s.avg_content_length || 0)
          })),
          failed_extractions: parseInt(failedWithoutExtractions[0]?.count || 0)
        }
      });
    }

    return NextResponse.json({
      error: 'Invalid action parameter'
    }, { status: 400 });

  } catch (error) {
    console.error('Enhanced reprocessing GET error:', error);
    return NextResponse.json({
      error: 'Failed to get reprocessing information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}