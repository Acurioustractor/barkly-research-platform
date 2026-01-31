/**
 * Entity Relationships Migration API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Create document_entity_relationships table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS document_entity_relationships (
        id TEXT PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "fromEntityId" TEXT NOT NULL,
        "toEntityId" TEXT NOT NULL,
        type TEXT NOT NULL,
        relationship TEXT NOT NULL,
        strength DOUBLE PRECISION NOT NULL,
        description TEXT,
        confidence DOUBLE PRECISION NOT NULL,
        evidence TEXT,
        context TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        
        FOREIGN KEY ("documentId") REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY ("fromEntityId") REFERENCES document_entities(id) ON DELETE CASCADE,
        FOREIGN KEY ("toEntityId") REFERENCES document_entities(id) ON DELETE CASCADE
      )
    `;

    // Create indexes for better query performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_document_entity_relationships_document_id 
      ON document_entity_relationships("documentId")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_document_entity_relationships_entities 
      ON document_entity_relationships("fromEntityId", "toEntityId")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_document_entity_relationships_type 
      ON document_entity_relationships(type)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_document_entity_relationships_relationship 
      ON document_entity_relationships(relationship)
    `;

    // Create unique constraint
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_document_entity_relationships_unique 
      ON document_entity_relationships("fromEntityId", "toEntityId", relationship)
    `;

    logger.info('Entity relationships table migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Document entity relationships table created successfully'
    });

  } catch (error) {
    logger.error('Error running entity relationships migration', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 