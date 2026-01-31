import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get all documents with correct processing stats (fix Cartesian product issue)
    const documents = await prisma.$queryRaw<Array<any>>`
      SELECT 
        d.id,
        d.title,
        d.content,
        d.cultural_sensitivity,
        d.file_type,
        d.processing_status,
        d.processed_at,
        d.created_at,
        d.ai_analysis,
        d."thumbnailPath",
        CAST(LENGTH(d.content) AS INTEGER) as content_length,
        CAST(COALESCE(theme_stats.themes_count, 0) AS INTEGER) as themes_count,
        CAST(COALESCE(quote_stats.quotes_count, 0) AS INTEGER) as quotes_count,
        CAST(COALESCE(theme_stats.ai_models_used, 0) AS INTEGER) as ai_models_used,
        CAST(COALESCE(theme_stats.avg_confidence, 0) AS DECIMAL) as avg_confidence,
        CAST(COALESCE(theme_stats.high_confidence_themes, 0) AS INTEGER) as high_confidence_themes
      FROM documents d
      LEFT JOIN (
        SELECT 
          document_id,
          CAST(COUNT(*) AS INTEGER) as themes_count,
          CAST(COUNT(DISTINCT ai_model) AS INTEGER) as ai_models_used,
          CAST(AVG(confidence_score) AS DECIMAL) as avg_confidence,
          CAST(COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) AS INTEGER) as high_confidence_themes
        FROM document_themes 
        GROUP BY document_id
      ) theme_stats ON d.id = theme_stats.document_id
      LEFT JOIN (
        SELECT 
          document_id,
          CAST(COUNT(*) AS INTEGER) as quotes_count
        FROM document_quotes 
        GROUP BY document_id
      ) quote_stats ON d.id = quote_stats.document_id
      ORDER BY d.created_at DESC
    `;

    // Debug: Log first document to see if thumbnailPath is included
    if (documents.length > 0) {
      console.log('First document from DB:', JSON.stringify(documents[0], null, 2));
    }

    // Get category breakdown for each document
    const categoryBreakdown = await prisma.$queryRaw<Array<any>>`
      SELECT 
        dt.document_id,
        CASE 
          WHEN dt.theme_name ILIKE '%initiative%' THEN 'initiative'
          WHEN dt.theme_name ILIKE '%program%' THEN 'program'
          WHEN dt.theme_name ILIKE '%service%' THEN 'service'
          WHEN dt.theme_name ILIKE '%centre%' OR dt.theme_name ILIKE '%center%' THEN 'facility'
          WHEN dt.theme_name ILIKE '%hub%' THEN 'facility'
          WHEN dt.theme_name ILIKE '%support%' THEN 'support'
          WHEN dt.theme_name ILIKE '%development%' THEN 'development'
          WHEN dt.theme_name ILIKE '%education%' THEN 'education'
          WHEN dt.theme_name ILIKE '%youth%' THEN 'youth'
          WHEN dt.theme_name ILIKE '%health%' THEN 'health'
          WHEN dt.theme_name ILIKE '%housing%' THEN 'housing'
          WHEN dt.theme_name ILIKE '%training%' THEN 'training'
          WHEN dt.theme_name ILIKE '%employment%' THEN 'employment'
          ELSE 'general'
        END as category,
        COUNT(*) as count
      FROM document_themes dt
      GROUP BY dt.document_id, category
    `;

    // Create category lookup
    const categoryLookup = categoryBreakdown.reduce((acc: any, item: any) => {
      if (!acc[item.document_id]) acc[item.document_id] = {};
      acc[item.document_id][item.category] = parseInt(item.count);
      return acc;
    }, {});

    // Enhance documents with category data
    const enhancedDocuments = documents.map((doc: any) => {
      const categories = categoryLookup[doc.id] || {};

      // Generate document summary
      const summary = generateDocumentSummary(doc);

      return {
        id: doc.id,
        title: doc.title,
        file_type: doc.file_type,
        cultural_sensitivity: doc.cultural_sensitivity,
        processing_status: doc.processing_status,
        processed_at: doc.processed_at,
        created_at: doc.created_at,
        content_length: parseInt(doc.content_length || 0),
        extraction_stats: {
          themes_extracted: parseInt(doc.themes_count || 0),
          quotes_extracted: parseInt(doc.quotes_count || 0),
          ai_models_used: parseInt(doc.ai_models_used || 0),
          average_confidence: Math.round((doc.avg_confidence || 0) * 100) / 100,
          high_confidence_themes: parseInt(doc.high_confidence_themes || 0)
        },
        categories: categories,
        top_categories: Object.entries(categories)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([cat, count]) => ({ category: cat, count })),
        ai_analysis: doc.ai_analysis,
        summary: summary,
        quality_score: calculateDocumentQuality(doc, categories),
        thumbnailPath: doc.thumbnailPath
      };
    });

    // Overall statistics
    const totalStats = {
      total_documents: documents.length,
      processed_documents: documents.filter((d: any) => d.processing_status === 'completed').length,
      total_themes: documents.reduce((sum: number, d: any) => sum + parseInt(d.themes_count || 0), 0),
      total_quotes: documents.reduce((sum: number, d: any) => sum + parseInt(d.quotes_count || 0), 0),
      average_confidence: documents.length > 0 ?
        documents.reduce((sum: number, d: any) => sum + (d.avg_confidence || 0), 0) / documents.length : 0
    };

    return NextResponse.json({
      success: true,
      documents: enhancedDocuments,
      stats: totalStats
    });

  } catch (error) {
    console.error('Documents overview error:', error);
    return NextResponse.json({
      error: 'Failed to get documents overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateDocumentSummary(doc: any): string {
  const themesCount = parseInt(doc.themes_count || 0);
  const quotesCount = parseInt(doc.quotes_count || 0);
  const contentLength = parseInt(doc.content_length || 0);
  const confidence = doc.avg_confidence || 0;

  if (doc.processing_status === 'processing') {
    return `Document is currently being processed for community intelligence extraction.`;
  }

  if (doc.processing_status === 'failed') {
    return `Processing failed for this document. Manual review may be required.`;
  }

  if (themesCount === 0 && quotesCount === 0) {
    return `Document processed but no significant themes or quotes extracted. May contain limited relevant content.`;
  }

  const sizeDesc = contentLength > 500000 ? 'large' :
    contentLength > 100000 ? 'substantial' :
      contentLength > 10000 ? 'medium-sized' : 'small';

  const qualityDesc = confidence >= 0.8 ? 'high-quality' :
    confidence >= 0.6 ? 'good-quality' :
      confidence >= 0.4 ? 'moderate-quality' : 'low-quality';

  return `This ${sizeDesc} document has been processed with ${qualityDesc} extraction results. ` +
    `Found ${themesCount} community themes/services and ${quotesCount} quotes. ` +
    `Average confidence: ${Math.round(confidence * 100)}%. ` +
    `Contains valuable community intelligence data for the Barkly region.`;
}

function calculateDocumentQuality(doc: any, categories: any): number {
  const themesCount = parseInt(doc.themes_count || 0);
  const confidence = doc.avg_confidence || 0;
  const highConfidence = parseInt(doc.high_confidence_themes || 0);
  const categoryCount = Object.keys(categories).length;

  let score = 0;

  // Theme count (30 points)
  score += Math.min(themesCount / 20 * 30, 30);

  // Confidence (40 points)
  score += confidence * 40;

  // High confidence ratio (20 points)
  if (themesCount > 0) {
    score += (highConfidence / themesCount) * 20;
  }

  // Category diversity (10 points)
  score += Math.min(categoryCount / 5 * 10, 10);

  return Math.min(Math.round(score), 100);
}