import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get all themes with document info
    const themes = await prisma.$queryRaw<Array<any>>`
      SELECT 
        dt.id, dt.theme_name, dt.description, dt.confidence_score, 
        dt.cultural_significance, dt.ai_model, dt.created_at,
        d.title as document_title
      FROM document_themes dt
      LEFT JOIN documents d ON dt.document_id = d.id
      ORDER BY dt.confidence_score DESC, dt.created_at DESC
    `;

    // Get all quotes
    const quotes = await prisma.$queryRaw<Array<any>>`
      SELECT 
        dq.id, dq.quote_text, dq.knowledge_holder, dq.cultural_sensitivity,
        dq.requires_attribution, dq.created_at,
        d.title as document_title
      FROM document_quotes dq
      LEFT JOIN documents d ON dq.document_id = d.id
      ORDER BY dq.created_at DESC
    `;

    // Get all insights
    const insights = await prisma.$queryRaw<Array<any>>`
      SELECT 
        di.id, di.insight, di.type, di.confidence, di.created_at,
        d.title as document_title
      FROM document_insights di
      LEFT JOIN documents d ON di.document_id = d.id
      ORDER BY di.confidence DESC, di.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      summary: {
        totalThemes: themes.length,
        totalQuotes: quotes.length,
        totalInsights: insights.length
      },
      themes: themes.map((theme: any) => ({
        id: theme.id,
        name: theme.theme_name,
        description: theme.description,
        confidence: Number(theme.confidence_score),
        culturalSignificance: theme.cultural_significance,
        aiModel: theme.ai_model,
        documentTitle: theme.document_title,
        createdAt: theme.created_at
      })),
      quotes: quotes.map((quote: any) => ({
        id: quote.id,
        text: quote.quote_text,
        knowledgeHolder: quote.knowledge_holder,
        culturalSensitivity: quote.cultural_sensitivity,
        requiresAttribution: quote.requires_attribution,
        documentTitle: quote.document_title,
        createdAt: quote.created_at
      })),
      insights: insights.map((insight: any) => ({
        id: insight.id,
        insight: insight.insight,
        type: insight.type,
        confidence: Number(insight.confidence),
        documentTitle: insight.document_title,
        createdAt: insight.created_at
      }))
    });

  } catch (error) {
    console.error('Error getting themes:', error);
    return NextResponse.json({
      error: 'Failed to get themes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}