import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Get theme distribution
    const themes = await prisma.documentTheme.groupBy({
      by: ['theme'],
      _count: {
        theme: true
      },
      _avg: {
        confidence: true
      },
      orderBy: {
        _count: {
          theme: 'desc'
        }
      },
      take: 10
    });

    // Get insights
    const insightsQuery = theme
      ? { type: theme }
      : {};

    const insights = await prisma.documentInsight.findMany({
      where: insightsQuery,
      orderBy: {
        confidence: 'desc'
      },
      take: limit,
      include: {
        document: {
          select: {
            id: true,
            originalName: true
          }
        }
      }
    });

    // Get top quotes
    const quotes = await prisma.documentQuote.findMany({
      where: {
        confidence: {
          gte: 0.7
        }
      },
      orderBy: {
        confidence: 'desc'
      },
      take: 20,
      include: {
        document: {
          select: {
            id: true,
            originalName: true
          }
        }
      }
    });

    // Get keyword cloud data
    const keywords = await prisma.documentKeyword.groupBy({
      by: ['keyword', 'category'],
      _sum: {
        frequency: true
      },
      _avg: {
        relevance: true
      },
      orderBy: {
        _sum: {
          frequency: 'desc'
        }
      },
      take: 50
    });

    // Get processing statistics
    const [totalDocs, completedDocs, totalChunks] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { status: 'COMPLETED' } }),
      prisma.documentChunk.count()
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalDocuments: totalDocs,
        completedDocuments: completedDocs,
        totalChunks: totalChunks,
        successRate: totalDocs > 0 ? (completedDocs / totalDocs * 100).toFixed(1) : 0
      },
      themes: themes.map(t => ({
        name: t.theme,
        count: t._count.theme,
        avgConfidence: t._avg.confidence || 0
      })),
      insights: insights.map(i => ({
        id: i.id,
        text: i.insight,
        type: i.type,
        confidence: i.confidence,
        documentId: i.document.id,
        documentName: i.document.originalName
      })),
      quotes: quotes.map(q => ({
        id: q.id,
        text: q.text,
        context: q.context,
        speaker: q.speaker,
        confidence: q.confidence,
        documentId: q.document.id,
        documentName: q.document.originalName
      })),
      keywords: keywords.map(k => ({
        term: k.keyword,
        category: k.category,
        frequency: k._sum.frequency || 0,
        relevance: k._avg.relevance || 0
      }))
    });

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}