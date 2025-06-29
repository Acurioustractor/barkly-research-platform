import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDocumentProcessor } from '@/utils/enhanced-document-processor';
import { isDatabaseAvailable } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    // Check database availability FIRST
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: 'Database not configured yet. Please set up Supabase integration.' },
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const query = {
      text: searchParams.get('text') || undefined,
      theme: searchParams.get('theme') || undefined,
      category: searchParams.get('category') || undefined,
      source: searchParams.get('source') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      status: searchParams.get('status') as any || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const processor = new EnhancedDocumentProcessor();
    const documents = await processor.searchDocuments(query);

    // Transform results for API response
    const results = documents.map(doc => ({
      id: doc.id,
      filename: doc.originalName,
      uploadedAt: doc.uploadedAt,
      processedAt: doc.processedAt,
      status: doc.status,
      source: doc.source,
      category: doc.category,
      tags: doc.tags ? JSON.parse(doc.tags as string) : [],
      pageCount: doc.pageCount,
      wordCount: doc.wordCount,
      themes: doc.themes.map(t => t.theme),
      counts: doc._count,
      summary: doc.summary
    }));

    return NextResponse.json({
      success: true,
      query,
      total: results.length,
      results
    });

  } catch (error) {
    console.error('Document search error:', error);
    
    // Check if this is a database connection error
    if (error instanceof Error && error.message.includes('Database not available')) {
      return NextResponse.json(
        { error: 'Database not configured yet. Please set up Supabase integration.' },
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to search documents',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: 'Database not configured yet. Please set up Supabase integration.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      text, 
      themes = [], 
      categories = [], 
      sources = [], 
      status,
      limit = 50,
      offset = 0
    } = body;

    const processor = new EnhancedDocumentProcessor();
    
    // Build complex search query
    const searchQuery: any = {
      limit,
      offset
    };

    if (text) searchQuery.text = text;
    if (status) searchQuery.status = status;
    
    // Handle multiple categories, sources, etc.
    if (categories.length > 0) searchQuery.category = categories[0]; // Simplified for now
    if (sources.length > 0) searchQuery.source = sources[0];
    if (themes.length > 0) searchQuery.theme = themes[0];

    const documents = await processor.searchDocuments(searchQuery);

    const results = documents.map(doc => ({
      id: doc.id,
      filename: doc.originalName,
      uploadedAt: doc.uploadedAt,
      processedAt: doc.processedAt,
      status: doc.status,
      source: doc.source,
      category: doc.category,
      tags: doc.tags ? JSON.parse(doc.tags as string) : [],
      pageCount: doc.pageCount,
      wordCount: doc.wordCount,
      themes: doc.themes.map(t => ({ name: t.theme, confidence: t.confidence })),
      counts: doc._count,
      summary: doc.summary
    }));

    return NextResponse.json({
      success: true,
      query: body,
      total: results.length,
      results
    });

  } catch (error) {
    console.error('Advanced document search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform advanced search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}