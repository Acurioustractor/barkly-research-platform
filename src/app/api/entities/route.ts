import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const documentId = searchParams.get('documentId');
    const entityType = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minConfidence = searchParams.get('minConfidence');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'confidence';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Build where clause
    const where: any = {};
    
    if (documentId) {
      where.documentId = documentId;
    }
    
    if (entityType) {
      where.type = entityType;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { context: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (minConfidence) {
      where.confidence = { gte: parseFloat(minConfidence) };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'confidence') {
      orderBy.confidence = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    }

    // Get entities with pagination
    const entities = await prisma.documentEntity.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            uploadedAt: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.documentEntity.count({ where });

    // Get entity type distribution
    const typeDistribution = await prisma.documentEntity.groupBy({
      by: ['type'],
      where: documentId ? { documentId } : {},
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });

    // Get confidence distribution
    const confidenceStats = await prisma.documentEntity.aggregate({
      where,
      _avg: { confidence: true },
      _max: { confidence: true },
      _min: { confidence: true }
    });

    logger.info('Entity query completed', {
      filters: { documentId, entityType, category, search, minConfidence },
      results: entities.length,
      total
    });

    return NextResponse.json({
      entities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + entities.length < total
      },
      stats: {
        typeDistribution: typeDistribution.map(t => ({
          type: t.type,
          count: t._count.type
        })),
        confidence: {
          avg: confidenceStats._avg.confidence,
          max: confidenceStats._max.confidence,
          min: confidenceStats._min.confidence
        }
      }
    });

  } catch (error) {
    logger.error('Entity query error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, type, name, category, confidence, context } = body;

    if (!documentId || !type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, type, name' },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Create the entity
    const entity = await prisma.documentEntity.create({
      data: {
        documentId,
        type,
        name,
        category: category || null,
        confidence: confidence || 0.5,
        context: context || null,
        validationStatus: 'validated',
        validatedBy: 'manual-creation',
        validatedAt: new Date()
      },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            uploadedAt: true
          }
        }
      }
    });

    logger.info('Entity created', {
      entityId: entity.id,
      documentId,
      type,
      name
    });

    return NextResponse.json({
      success: true,
      entity
    });

  } catch (error) {
    logger.error('Entity creation error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}