import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

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

    // Get document details with full content
    const document = await prisma.$queryRaw<Array<any>>`
      SELECT 
        id, title, content, cultural_sensitivity, file_type,
        processing_status, processed_at, created_at, ai_analysis,
        LENGTH(content) as content_length
      FROM documents 
      WHERE id = ${documentId}::uuid
    `;

    if (!document || document.length === 0) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    const doc = document[0];

    // Get all extracted themes/services with enhanced details
    const themes = await prisma.$queryRaw<Array<any>>`
      SELECT 
        id, theme_name, description, confidence_score, 
        cultural_significance, ai_model, created_at,
        CASE 
          WHEN theme_name ILIKE '%initiative%' THEN 'initiative'
          WHEN theme_name ILIKE '%program%' THEN 'program'
          WHEN theme_name ILIKE '%service%' THEN 'service'
          WHEN theme_name ILIKE '%centre%' OR theme_name ILIKE '%center%' THEN 'facility'
          WHEN theme_name ILIKE '%hub%' THEN 'facility'
          WHEN theme_name ILIKE '%support%' THEN 'support'
          WHEN theme_name ILIKE '%development%' THEN 'development'
          WHEN theme_name ILIKE '%education%' THEN 'education'
          WHEN theme_name ILIKE '%youth%' THEN 'youth'
          WHEN theme_name ILIKE '%health%' THEN 'health'
          WHEN theme_name ILIKE '%housing%' THEN 'housing'
          WHEN theme_name ILIKE '%training%' THEN 'training'
          WHEN theme_name ILIKE '%employment%' THEN 'employment'
          ELSE 'general'
        END as category,
        CASE 
          WHEN confidence_score >= 0.9 THEN 'excellent'
          WHEN confidence_score >= 0.8 THEN 'high'
          WHEN confidence_score >= 0.6 THEN 'medium'
          WHEN confidence_score >= 0.4 THEN 'low'
          ELSE 'very_low'
        END as confidence_level
      FROM document_themes 
      WHERE document_id = ${documentId}::uuid
      ORDER BY confidence_score DESC, created_at DESC
    `;

    // Get all quotes with cultural context
    const quotes = await prisma.$queryRaw<Array<any>>`
      SELECT 
        id, quote_text, knowledge_holder, cultural_sensitivity,
        requires_attribution, created_at,
        LENGTH(quote_text) as quote_length
      FROM document_quotes 
      WHERE document_id = ${documentId}::uuid
      ORDER BY created_at DESC
    `;

    // Get insights with evidence
    const insights = await prisma.$queryRaw<Array<any>>`
      SELECT 
        id, insight, type, confidence, evidence, created_at
      FROM document_insights 
      WHERE document_id = ${documentId}::uuid
      ORDER BY confidence DESC, created_at DESC
    `;

    // Group themes by category for better visualization
    const themesByCategory = themes.reduce((acc: any, theme: any) => {
      const category = theme.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push({
        id: theme.id,
        name: theme.theme_name,
        description: theme.description,
        confidence: theme.confidence_score,
        confidence_level: theme.confidence_level,
        cultural_significance: theme.cultural_significance,
        ai_model: theme.ai_model,
        created_at: theme.created_at,
        // Extract source tracking from description if available
        source_info: extractSourceInfo(theme.description)
      });
      return acc;
    }, {});

    // Group quotes by cultural sensitivity
    const quotesBySensitivity = quotes.reduce((acc: any, quote: any) => {
      const sensitivity = quote.cultural_sensitivity || 'public';
      if (!acc[sensitivity]) acc[sensitivity] = [];
      acc[sensitivity].push({
        id: quote.id,
        text: quote.quote_text,
        speaker: quote.knowledge_holder,
        requires_attribution: quote.requires_attribution,
        created_at: quote.created_at,
        length: parseInt(quote.quote_length || 0)
      });
      return acc;
    }, {});

    // Calculate comprehensive statistics
    const stats = {
      total_themes: themes.length,
      total_quotes: quotes.length,
      total_insights: insights.length,
      content_length: parseInt(doc.content_length || 0),
      average_confidence: themes.length > 0 ? 
        themes.reduce((sum: number, t: any) => sum + (t.confidence_score || 0), 0) / themes.length : 0,
      confidence_distribution: {
        excellent: themes.filter((t: any) => t.confidence_score >= 0.9).length,
        high: themes.filter((t: any) => t.confidence_score >= 0.8 && t.confidence_score < 0.9).length,
        medium: themes.filter((t: any) => t.confidence_score >= 0.6 && t.confidence_score < 0.8).length,
        low: themes.filter((t: any) => t.confidence_score >= 0.4 && t.confidence_score < 0.6).length,
        very_low: themes.filter((t: any) => t.confidence_score < 0.4).length
      },
      categories_found: Object.keys(themesByCategory).length,
      ai_models_used: [...new Set(themes.map((t: any) => t.ai_model))],
      cultural_sensitivities: [...new Set(quotes.map((q: any) => q.cultural_sensitivity || 'public'))],
      processing_date: doc.processed_at,
      file_info: {
        type: doc.file_type,
        size_category: categorizeSize(parseInt(doc.content_length || 0)),
        estimated_pages: Math.ceil(parseInt(doc.content_length || 0) / 2000) // Rough estimate
      }
    };

    // Generate content preview with highlights
    const contentPreview = generateContentPreview(doc.content, themes.slice(0, 5));

    // Create comprehensive extraction summary
    const extractionSummary = generateDetailedSummary(stats, themesByCategory, doc);

    // Generate recommendations for this document
    const recommendations = generateDocumentRecommendations(stats, themes, quotes, insights);

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        file_type: doc.file_type,
        cultural_sensitivity: doc.cultural_sensitivity,
        processing_status: doc.processing_status,
        processed_at: doc.processed_at,
        created_at: doc.created_at,
        content_preview: contentPreview,
        ai_analysis: doc.ai_analysis
      },
      extraction: {
        summary: extractionSummary,
        statistics: stats,
        themes_by_category: themesByCategory,
        quotes_by_sensitivity: quotesBySensitivity,
        category_counts: Object.keys(themesByCategory).reduce((acc: any, cat) => {
          acc[cat] = themesByCategory[cat].length;
          return acc;
        }, {}),
        all_themes: themes.map((t: any) => ({
          id: t.id,
          name: t.theme_name,
          description: t.description,
          confidence: t.confidence_score,
          confidence_level: t.confidence_level,
          category: t.category,
          ai_model: t.ai_model,
          created_at: t.created_at
        })),
        insights: insights.map((i: any) => ({
          id: i.id,
          insight: i.insight,
          type: i.type,
          confidence: i.confidence,
          evidence: i.evidence,
          created_at: i.created_at
        })),
        recommendations: recommendations
      },
      navigation: {
        has_original_content: !!doc.content && doc.content.length > 0,
        content_length: parseInt(doc.content_length || 0),
        can_download_original: true,
        can_reprocess: doc.processing_status !== 'processing',
        verification_link: `/api/documents/verify-extraction?documentId=${documentId}`,
        dashboard_link: `/api/admin/extraction-dashboard`
      },
      access: {
        original_document: {
          available: true,
          content_type: doc.file_type || 'text/plain',
          content_length: parseInt(doc.content_length || 0),
          preview_available: true
        },
        full_text_search: true,
        export_options: ['json', 'csv', 'pdf_report']
      }
    });

  } catch (error) {
    console.error('Document review error:', error);
    return NextResponse.json({
      error: 'Failed to get document review',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function extractSourceInfo(description: string): any {
  // Extract source tracking info from description if available
  const sourceMatch = description.match(/\[Source: ([^\]]+)\]/);
  if (sourceMatch) {
    const sourceInfo = sourceMatch[1];
    const chunkMatch = sourceInfo.match(/chunks? ([^,]+)/);
    const aiMatch = sourceInfo.match(/AI: ([^,]+)/);
    const confidenceMatch = sourceInfo.match(/Confidence: ([^,\]]+)/);
    
    return {
      chunks: chunkMatch ? chunkMatch[1] : null,
      ai_model: aiMatch ? aiMatch[1] : null,
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : null
    };
  }
  return null;
}

function categorizeSize(contentLength: number): string {
  if (contentLength > 500000) return 'very_large';
  if (contentLength > 100000) return 'large';
  if (contentLength > 50000) return 'medium';
  if (contentLength > 10000) return 'small';
  return 'very_small';
}

function generateContentPreview(content: string, topThemes: any[]): any {
  if (!content) return { text: 'No content available', highlights: [] };

  const preview = content.substring(0, 1000);
  const highlights = [];

  // Find mentions of top themes in the preview
  for (const theme of topThemes) {
    const themeName = theme.theme_name.toLowerCase();
    const words = themeName.split(' ');
    
    for (const word of words) {
      if (word.length > 3) { // Only highlight meaningful words
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = [...preview.matchAll(regex)];
        
        for (const match of matches) {
          highlights.push({
            start: match.index,
            end: match.index! + word.length,
            word: word,
            theme: theme.theme_name,
            confidence: theme.confidence_score
          });
        }
      }
    }
  }

  return {
    text: preview + (content.length > 1000 ? '...' : ''),
    highlights: highlights.slice(0, 20), // Limit highlights
    total_length: content.length
  };
}

function generateDetailedSummary(stats: any, themesByCategory: any, doc: any): string {
  const { total_themes, total_quotes, total_insights, average_confidence, categories_found } = stats;
  
  if (total_themes === 0) {
    return `This document has been processed but no significant community intelligence themes were extracted. This may indicate limited relevant content for the Barkly Regional Deal analysis, or the document may require different processing approaches.`;
  }

  const topCategories = Object.entries(themesByCategory)
    .sort(([,a], [,b]) => (b as any[]).length - (a as any[]).length)
    .slice(0, 3)
    .map(([cat, items]) => `${cat} (${(items as any[]).length})`);

  const confidenceDesc = average_confidence >= 0.8 ? 'high' :
                         average_confidence >= 0.6 ? 'good' :
                         average_confidence >= 0.4 ? 'moderate' : 'low';

  const sizeCategory = stats.file_info.size_category;
  const aiModels = stats.ai_models_used.join(', ');

  const summary = [
    `This ${sizeCategory} document "${doc.title}" has been comprehensively processed for community intelligence extraction.`,
    `Successfully extracted ${total_themes} themes and services with ${confidenceDesc} confidence (average: ${Math.round(average_confidence * 100)}%).`,
    `Analysis identified ${categories_found} distinct service categories across the Barkly Regional Deal framework.`,
    topCategories.length > 0 ? `Primary focus areas: ${topCategories.join(', ')}.` : '',
    total_quotes > 0 ? `Captured ${total_quotes} community quotes with appropriate cultural sensitivity classifications.` : '',
    total_insights > 0 ? `Generated ${total_insights} strategic insights about community needs and service gaps.` : '',
    `Processing utilized ${aiModels} for analysis, ensuring cultural protocols and CARE+ principles.`,
    `This document contributes valuable evidence to the community intelligence system for Tennant Creek and the broader Barkly region.`
  ].filter(Boolean).join(' ');

  return summary;
}

function generateDocumentRecommendations(stats: any, themes: any[], quotes: any[], insights: any[]): string[] {
  const recommendations = [];
  
  // Quality recommendations
  if (stats.average_confidence < 0.6) {
    recommendations.push('🔍 Consider manual review - average confidence below 60%');
  }
  
  if (stats.confidence_distribution.very_low > 0) {
    recommendations.push('⚠️ Some extractions have very low confidence - review for accuracy');
  }
  
  // Coverage recommendations
  if (stats.categories_found < 3) {
    recommendations.push('📊 Limited category diversity - document may have narrow scope');
  }
  
  // Cultural recommendations
  const culturalSensitivities = stats.cultural_sensitivities;
  if (culturalSensitivities.includes('restricted') || culturalSensitivities.includes('sacred')) {
    recommendations.push('🔒 Contains culturally sensitive content - ensure proper protocols');
  }
  
  // Content recommendations
  if (stats.total_themes > 50) {
    recommendations.push('📈 High theme count - consider grouping similar services');
  }
  
  if (stats.total_quotes === 0) {
    recommendations.push('💬 No community quotes found - may benefit from quote-focused reprocessing');
  }
  
  // Barkly-specific recommendations
  const barklyKeywords = ['youth centre', 'business hub', 'student boarding', 'training', 'community development'];
  const foundBarkly = themes.some((t: any) => 
    barklyKeywords.some(keyword => 
      t.theme_name.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  if (!foundBarkly && stats.total_themes > 5) {
    recommendations.push('🎯 May be missing key Barkly Regional Deal initiatives - verify coverage');
  }
  
  if (stats.total_themes > 20) {
    recommendations.push('✅ Excellent extraction coverage - ready for community review');
  }
  
  return recommendations;
}