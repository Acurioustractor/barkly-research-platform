import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDocumentProcessor } from '@/utils/enhanced-document-processor';
import { prisma } from '@/lib/db/database';

export async function GET() {
  try {
    const collections = await prisma.documentCollection.findMany({
      include: {
        documents: {
          include: {
            collection: true
          }
        },
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const results = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      tags: collection.tags ? JSON.parse(collection.tags as string) : [],
      isPublic: collection.isPublic,
      documentCount: collection._count.documents
    }));

    return NextResponse.json({
      success: true,
      collections: results
    });

  } catch (error) {
    console.error('Get collections error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve collections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, tags, isPublic = false, documentIds = [] } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const processor = new EnhancedDocumentProcessor();
    
    // Create the collection
    const collection = await processor.createCollection(name, description, tags, isPublic);

    // Add documents if provided
    if (documentIds.length > 0) {
      await processor.addDocumentsToCollection(collection.id, documentIds);
    }

    // Get the complete collection data
    const completeCollection = await prisma.documentCollection.findUnique({
      where: { id: collection.id },
      include: {
        documents: {
          include: {
            collection: true
          }
        },
        _count: {
          select: {
            documents: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      collection: {
        id: completeCollection!.id,
        name: completeCollection!.name,
        description: completeCollection!.description,
        createdAt: completeCollection!.createdAt,
        updatedAt: completeCollection!.updatedAt,
        tags: completeCollection!.tags ? JSON.parse(completeCollection!.tags as string) : [],
        isPublic: completeCollection!.isPublic,
        documentCount: completeCollection!._count.documents
      }
    });

  } catch (error) {
    console.error('Create collection error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}