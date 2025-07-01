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

    // Get all documents in date range
    const documentsInRange = await prisma.document.findMany({
      where: {
        uploadedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        uploadedAt: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });
    
    // Group by date manually
    const dateGroups = new Map<string, number>();
    documentsInRange.forEach(doc => {
      const dateStr = doc.uploadedAt.toISOString().split('T')[0];
      dateGroups.set(dateStr, (dateGroups.get(dateStr) || 0) + 1);
    });
    
    // Convert to array format
    const dailyMetrics = Array.from(dateGroups.entries())
      .map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

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
      
      const dayMetrics = dailyMetrics.find(m => 
        m.date.toISOString().split('T')[0] === dateStr
      );
      
      dailyData.unshift({
        date: dateStr,
        documents: dayMetrics?.count || 0
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
    
    // Provide more detailed error information for debugging
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      // Include stack trace in development only
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    } : { message: 'Unknown error' };
    
    // Check for specific Prisma errors
    if (error instanceof Error && error.message.includes('P2010')) {
      return NextResponse.json(
        { 
          error: 'Database query failed',
          details: 'Raw query error - possibly invalid SQL syntax',
          debug: errorDetails
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}