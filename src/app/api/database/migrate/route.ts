import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    console.log('Starting database migration for AI processing...');

    // Add processing columns to documents table
    await prisma.$executeRaw`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS ai_analysis JSONB
    `;

    console.log('Added processing columns to documents table');

    // Ensure document_insights table exists with correct structure
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS document_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        insight TEXT NOT NULL,
        type TEXT NOT NULL,
        confidence NUMERIC NOT NULL,
        evidence JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    console.log('Ensured document_insights table exists');

    // Create index on document_insights if not exists
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_document_insights_document_id ON document_insights(document_id)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_document_insights_type ON document_insights(type)
    `;

    console.log('Created indexes on document_insights');

    // Update existing documents to have pending status
    await prisma.$executeRaw`
      UPDATE documents 
      SET processing_status = 'pending' 
      WHERE processing_status IS NULL
    `;

    console.log('Updated existing documents to pending status');

    // Get current state
    const documentCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM documents
    `;

    const pendingCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM documents WHERE processing_status = 'pending'
    `;

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      stats: {
        totalDocuments: Number(documentCount[0]?.count || 0),
        pendingProcessing: Number(pendingCount[0]?.count || 0)
      }
    });

  } catch (error) {
    console.error('Database migration error:', error);
    return NextResponse.json({
      error: 'Failed to migrate database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}