import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Check document counts
    const documentCount = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as count FROM documents
    `;

    const themeCount = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as count FROM document_themes
    `;

    const quoteCount = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as count FROM document_quotes
    `;

    // Check for duplicates in themes
    const duplicateThemes = await prisma.$queryRaw<Array<any>>`
      SELECT document_id, theme_name, COUNT(*) as count
      FROM document_themes
      GROUP BY document_id, theme_name
      HAVING COUNT(*) > 1
      LIMIT 5
    `;

    // Check specific problematic document
    const barklyDocThemes = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as count
      FROM document_themes dt
      JOIN documents d ON dt.document_id = d.id
      WHERE d.title ILIKE '%barkly%' OR d.title ILIKE '%deal%'
    `;

    const barklyDocQuotes = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as count
      FROM document_quotes dq
      JOIN documents d ON dq.document_id = d.id
      WHERE d.title ILIKE '%barkly%' OR d.title ILIKE '%deal%'
    `;

    return NextResponse.json({
      success: true,
      counts: {
        total_documents: parseInt(documentCount[0]?.count || 0),
        total_themes: parseInt(themeCount[0]?.count || 0),
        total_quotes: parseInt(quoteCount[0]?.count || 0),
        barkly_doc_themes: parseInt(barklyDocThemes[0]?.count || 0),
        barkly_doc_quotes: parseInt(barklyDocQuotes[0]?.count || 0)
      },
      duplicate_examples: duplicateThemes.map((d: any) => ({
        document_id: d.document_id,
        theme_name: d.theme_name,
        duplicate_count: parseInt(d.count)
      }))
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: 'Failed to get debug info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}