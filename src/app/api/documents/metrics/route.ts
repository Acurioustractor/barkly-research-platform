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
    const days = parseInt(searchParams.get('days') || '7');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily processing metrics
    const dailyMetrics = await prisma.document.groupBy({
      by: ['uploadedAt'],
      where: {
        uploadedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get processing status distribution
    const statusDistribution = await prisma.document.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Get category distribution
    const categoryDistribution = await prisma.document.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        category: {
          not: null
        }
      }
    });

    // Get source distribution
    const sourceDistribution = await prisma.document.groupBy({
      by: ['source'],
      _count: {
        id: true
      },
      where: {
        source: {
          not: null
        }
      }
    });

    // Calculate average metrics
    const completedDocs = await prisma.document.findMany({
      where: {
        status: 'COMPLETED',
        processedAt: {
          not: null
        },
        uploadedAt: {
          gte: startDate
        }
      },
      select: {
        uploadedAt: true,
        processedAt: true,
        wordCount: true,
        pageCount: true
      }
    });

    // Calculate processing times
    const processingTimes = completedDocs.map(doc => {
      if (doc.processedAt && doc.uploadedAt) {
        return (doc.processedAt.getTime() - doc.uploadedAt.getTime()) / 1000; // seconds
      }
      return 0;
    }).filter(time => time > 0);

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    // Get total counts
    const [totalDocuments, totalChunks, totalThemes, totalQuotes, totalInsights] = await Promise.all([
      prisma.document.count(),
      prisma.documentChunk.count(),
      prisma.documentTheme.count(),
      prisma.documentQuote.count(),
      prisma.documentInsight.count()
    ]);

    // Format daily metrics for chart
    const dailyData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMetrics = dailyMetrics.filter(m => 
        m.uploadedAt.toISOString().split('T')[0] === dateStr
      );
      
      dailyData.unshift({
        date: dateStr,
        documents: dayMetrics.reduce((sum, m) => sum + m._count.id, 0)
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalDocuments,
        totalChunks,
        totalThemes,
        totalQuotes,
        totalInsights,
        avgProcessingTime: Math.round(avgProcessingTime),
        successRate: statusDistribution.find(s => s.status === 'COMPLETED')?._count.id 
          ? (statusDistribution.find(s => s.status === 'COMPLETED')!._count.id / totalDocuments * 100).toFixed(1)
          : 0
      },
      daily: dailyData,
      distributions: {
        status: statusDistribution.map(s => ({
          status: s.status,
          count: s._count.id
        })),
        category: categoryDistribution.map(c => ({
          category: c.category || 'Uncategorized',
          count: c._count.id
        })),
        source: sourceDistribution.map(s => ({
          source: s.source || 'Unknown',
          count: s._count.id
        }))
      }
    });

  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}