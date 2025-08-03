import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    // Check documents table structure if it exists
    let documentsColumns = [];
    try {
      documentsColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'documents'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
    } catch (e) {
      console.log('Documents table does not exist or is not accessible');
    }

    // Check document_themes table structure if it exists
    let themesColumns = [];
    try {
      themesColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'document_themes'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
    } catch (e) {
      console.log('Document themes table does not exist or is not accessible');
    }

    // Check document_quotes table structure if it exists
    let quotesColumns = [];
    try {
      quotesColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'document_quotes'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
    } catch (e) {
      console.log('Document quotes table does not exist or is not accessible');
    }

    // Try to get any data from documents table if it exists
    let sampleDocuments = [];
    try {
      sampleDocuments = await prisma.$queryRaw`
        SELECT * FROM documents LIMIT 3;
      `;
    } catch (e) {
      console.log('Cannot query documents table:', e);
    }

    return NextResponse.json({
      success: true,
      database: {
        tables: tables,
        documentsTableStructure: documentsColumns,
        themesTableStructure: themesColumns,
        quotesTableStructure: quotesColumns,
        sampleDocuments: sampleDocuments
      }
    });

  } catch (error) {
    console.error('Database inspection error:', error);
    return NextResponse.json({
      error: 'Database inspection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}