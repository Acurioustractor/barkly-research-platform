import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available',
        count: 0
      });
    }

    const count = await prisma.document.count();
    const documents = await prisma.document.findMany({
      take: 5,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        status: true,
        uploadedAt: true,
        size: true
      }
    });

    return NextResponse.json({
      count,
      recentDocuments: documents
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to count documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}