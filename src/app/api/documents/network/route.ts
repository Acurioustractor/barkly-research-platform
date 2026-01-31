import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get all documents with their themes
    const documents = await prisma.document.findMany({
      where: {
        status: 'COMPLETED'
      },
      select: {
        id: true,
        originalName: true,
        themes: {
          select: {
            theme: true,
            confidence: true
          }
        }
      },
      take: 50 // Limit for performance
    });

    // Transform documents to nodes
    const nodes = documents.map((doc: any) => ({
      id: doc.id,
      title: doc.originalName,
      themes: doc.themes.map((t: any) => t.theme)
    }));

    // Calculate links based on shared themes
    const links: Array<{ source: string; target: string; strength: number }> = [];

    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i];
        const doc2 = documents[j];

        if (!doc1 || !doc2) continue;

        // Find shared themes
        const themes1 = new Set(doc1.themes.map((t: any) => t.theme));
        const themes2 = new Set(doc2.themes.map((t: any) => t.theme));
        const sharedThemes = [...themes1].filter((t: any) => themes2.has(t));

        if (sharedThemes.length > 0) {
          // Calculate strength based on number of shared themes and confidence
          const avgConfidence1 = doc1.themes.reduce((sum: number, t: any) => sum + t.confidence, 0) / doc1.themes.length;
          const avgConfidence2 = doc2.themes.reduce((sum: number, t: any) => sum + t.confidence, 0) / doc2.themes.length;
          const strength = (sharedThemes.length / Math.max(themes1.size, themes2.size)) *
            ((avgConfidence1 + avgConfidence2) / 2);

          if (strength > 0.3) { // Only include meaningful connections
            links.push({
              source: doc1.id,
              target: doc2.id,
              strength: Math.min(strength, 1)
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      nodes,
      links
    });

  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch network data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}