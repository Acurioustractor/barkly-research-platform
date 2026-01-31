import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { generateSystemsMapData } from '@/lib/ai/processing/systems-extraction-service';
// Define SystemEntityType locally because Prisma export is problematic in some build environments
type SystemEntityType = 'SERVICE' | 'THEME' | 'OUTCOME' | 'FACTOR';

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

    // Get document IDs from query params
    const documentIdsParam = searchParams.get('documentIds');
    const documentIds = documentIdsParam ? documentIdsParam.split(',') : [];

    // Get filters
    const entityTypesParam = searchParams.get('entityTypes');
    const entityTypes = entityTypesParam
      ? entityTypesParam.split(',') as SystemEntityType[]
      : undefined;

    const minConfidence = searchParams.get('minConfidence');
    const confidenceThreshold = minConfidence ? parseFloat(minConfidence) : undefined;

    // If no document IDs provided, get all documents with system data
    let targetDocumentIds = documentIds;
    if (targetDocumentIds.length === 0) {
      const documentsWithSystems = await prisma.systemEntity.findMany({
        select: { documentId: true },
        distinct: ['documentId']
      });
      targetDocumentIds = documentsWithSystems.map((d: { documentId: string }) => d.documentId);
    }

    if (targetDocumentIds.length === 0) {
      return NextResponse.json({
        nodes: [],
        connections: [],
        message: 'No documents with systems data found'
      });
    }

    // Generate systems map data
    const { nodes, connections } = await generateSystemsMapData(
      targetDocumentIds,
      {
        entityTypes,
        minConfidence: confidenceThreshold
      }
    );

    // Get document metadata
    const documents = await prisma.document.findMany({
      where: { id: { in: targetDocumentIds } },
      select: {
        id: true,
        originalName: true,
        uploadedAt: true,
        category: true,
        tags: true
      }
    });

    return NextResponse.json({
      nodes,
      connections,
      documents,
      filters: {
        entityTypes: entityTypes || ['SERVICE', 'THEME', 'OUTCOME', 'FACTOR'],
        minConfidence: confidenceThreshold || 0
      }
    });

  } catch (error) {
    console.error('Systems map generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate systems map', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { name, description, documentIds, filters, layout } = await request.json();

    if (!name || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Name and document IDs are required' },
        { status: 400 }
      );
    }

    // Save the systems map configuration
    const systemMap = await prisma.systemMap.create({
      data: {
        name,
        description,
        documentIds: JSON.stringify(documentIds),
        filters: filters ? JSON.stringify(filters) : undefined,
        layout: layout ? JSON.stringify(layout) : undefined
      }
    });

    return NextResponse.json({
      id: systemMap.id,
      name: systemMap.name,
      description: systemMap.description,
      createdAt: systemMap.createdAt
    });

  } catch (error) {
    console.error('Systems map save error:', error);
    return NextResponse.json(
      { error: 'Failed to save systems map', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}