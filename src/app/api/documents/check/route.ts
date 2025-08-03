import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available',
        status: 'disconnected'
      }, { status: 503 });
    }

    // Check documents using Prisma ORM
    const documents = await prisma.document.findMany({
      take: 5,
      select: {
        id: true,
        filename: true,
        originalName: true,
        status: true,
        uploadedAt: true,
        processedAt: true,
        wordCount: true,
        pageCount: true,
        source: true,
        category: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    // Check themes
    const themes = await prisma.documentTheme.findMany({
      take: 5,
      select: {
        id: true,
        theme: true,
        confidence: true,
        document: {
          select: {
            originalName: true
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      }
    });

    // Check quotes
    const quotes = await prisma.documentQuote.findMany({
      take: 5,
      select: {
        id: true,
        text: true,
        speaker: true,
        confidence: true,
        document: {
          select: {
            originalName: true
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      }
    });

    // Check insights
    const insights = await prisma.documentInsight.findMany({
      take: 5,
      select: {
        id: true,
        insight: true,
        type: true,
        confidence: true,
        document: {
          select: {
            originalName: true
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      }
    });

    // Check system entities for services
    const systemEntities = await prisma.systemEntity.findMany({
      where: {
        type: 'SERVICE'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        description: true,
        confidence: true,
        document: {
          select: {
            originalName: true
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalDocuments: documents.length,
        totalThemes: themes.length,
        totalQuotes: quotes.length,
        totalInsights: insights.length,
        totalServiceEntities: systemEntities.length
      },
      sample: {
        documents,
        themes,
        quotes,
        insights,
        systemEntities
      },
      status: 'connected'
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      error: 'Database check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 });
  }
}