import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Check total count of themes
    const themeCount = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM document_themes
    `;

    // Get all themes without confidence filter
    const allThemes = await prisma.$queryRaw`
      SELECT dt.id, dt.document_id, dt.theme_name, dt.description, dt.confidence_score, dt.created_at,
             d.title as document_title
      FROM document_themes dt
      LEFT JOIN documents d ON dt.document_id = d.id
      ORDER BY dt.created_at DESC
      LIMIT 20
    `;

    // Check total count of quotes
    const quoteCount = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM document_quotes
    `;

    // Get all quotes
    const allQuotes = await prisma.$queryRaw`
      SELECT dq.id, dq.document_id, dq.quote_text, dq.knowledge_holder, dq.cultural_sensitivity,
             d.title as document_title
      FROM document_quotes dq
      LEFT JOIN documents d ON dq.document_id = d.id
      ORDER BY dq.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      success: true,
      counts: {
        themes: (themeCount as any[])[0]?.total || 0,
        quotes: (quoteCount as any[])[0]?.total || 0
      },
      sample: {
        themes: allThemes,
        quotes: allQuotes
      }
    });

  } catch (error) {
    console.error('Debug themes error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}