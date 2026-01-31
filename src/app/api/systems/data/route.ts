import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

interface SystemNode {
  id: string;
  label: string;
  type: 'service' | 'theme' | 'outcome' | 'factor';
  confidence: number;
  documentIds: string[];
  evidence: string[];
}

interface SystemConnection {
  id: string;
  from: string;
  to: string;
  type: 'supports' | 'blocks' | 'enables' | 'influences' | 'requires';
  strength: 'weak' | 'medium' | 'strong';
  confidence: number;
  description: string;
  documentIds: string[];
}

interface DocumentReference {
  id: string;
  title: string;
  originalName: string;
  uploadedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.5');

    // Check if prisma is available
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get basic document count first
    let documentsWithSystems: any[] = [];
    try {
      const documentCount = await prisma.document.count();
      console.log('Document count:', documentCount);

      if (documentCount > 0) {
        documentsWithSystems = await prisma.document.findMany({
          select: {
            id: true,
            originalName: true,
            uploadedAt: true
          },
          take: 5
        });
      }
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: String(dbError) },
        { status: 500 }
      );
    }

    if (documentsWithSystems.length === 0) {
      return NextResponse.json({
        nodes: [],
        connections: [],
        documents: [],
        metadata: {
          totalDocuments: 0,
          totalNodes: 0,
          totalConnections: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Create document references
    const documentRefs: DocumentReference[] = documentsWithSystems.map((doc: any) => ({
      id: doc.id,
      title: doc.originalName,
      originalName: doc.originalName,
      uploadedAt: doc.uploadedAt.toISOString()
    }));

    // Since there's no systems data yet, return empty arrays
    const nodes: SystemNode[] = [];
    const connections: SystemConnection[] = [];

    return NextResponse.json({
      nodes,
      connections,
      documents: documentRefs,
      metadata: {
        totalDocuments: documentsWithSystems.length,
        totalNodes: nodes.length,
        totalConnections: connections.length,
        minConfidence,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching systems data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch systems data' },
      { status: 500 }
    );
  }
}

function findNodeId(label: string, nodeMap: Map<string, SystemNode>): string | null {
  const cleanLabel = label.toLowerCase().replace(/\s+/g, '-');

  // Try exact matches first
  for (const [id, node] of nodeMap) {
    if (id.includes(cleanLabel) || node.label.toLowerCase().includes(label.toLowerCase())) {
      return id;
    }
  }

  return null;
}