import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not connected',
        hasPrisma: false
      });
    }

    // Get document count and recent documents
    const count = await prisma.document.count();
    const recentDocs = await prisma.document.findMany({
      take: 10,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        status: true,
        uploadedAt: true,
        size: true,
        fullText: true
      }
    });

    return NextResponse.json({
      success: true,
      totalDocuments: count,
      recentDocuments: recentDocs,
      databaseConnected: true
    });
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      error: 'Database query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasPrisma: Boolean(prisma)
    }, { status: 500 });
  }
}