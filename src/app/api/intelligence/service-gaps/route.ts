import { NextRequest, NextResponse } from 'next/server';
import { serviceGapAnalysisService } from '@/lib/community/service-gap-analysis';
import { prisma } from '@/lib/database-safe';

export async function POST(request: NextRequest) {
  try {
    const { documentText, documentContext, communityContext, documentIds } = await request.json();

    let result;

    if (documentIds && Array.isArray(documentIds)) {
      // Analyze multiple documents
      const documents = await getDocumentsContent(documentIds);
      result = await serviceGapAnalysisService.analyzeMultipleDocuments(documents);
    } else if (documentText) {
      // Analyze single document text
      result = await serviceGapAnalysisService.analyzeDocumentForServiceGaps(
        documentText,
        documentContext,
        communityContext
      );
    } else {
      return NextResponse.json(
        { error: 'Either documentText or documentIds must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Service gap analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze service gaps',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const serviceType = searchParams.get('serviceType');
    const urgency = searchParams.get('urgency');
    const gapType = searchParams.get('gapType');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get documents for analysis
    if (!prisma) {
      throw new Error('Database service unavailable');
    }
    let whereClause = 'ai_analysis IS NOT NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (communityId) {
      whereClause += ` AND community_id = $${paramIndex}::uuid`;
      params.push(communityId);
      paramIndex++;
    }

    const documents = await prisma.$queryRawUnsafe(`
      SELECT id, title, content, community_id, ai_analysis, created_at
      FROM documents 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex}
    `, ...params, limit);

    if (!documents || (documents as any[]).length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          gaps: [],
          gapsByType: { missing: [], inadequate: [], inaccessible: [], culturally_inappropriate: [], under_resourced: [] },
          gapsByUrgency: { critical: [], high: [], medium: [], low: [] },
          gapsByLocation: {},
          systemicGaps: [],
          priorityRecommendations: [],
          summary: {
            totalGaps: 0,
            criticalGaps: 0,
            mostAffectedLocations: [],
            topServiceTypes: [],
            averageImpact: 0,
            urgentActionRequired: false
          }
        }
      });
    }

    // Prepare documents for analysis
    let documentsForAnalysis: { content: string; context: string; communityContext: string }[] = [];
    if (documents && (documents as any[]).length > 0) {
      documentsForAnalysis = await Promise.all(
        (documents as any[]).map(async (doc: any) => {
          let communityContext = '';
          if (doc.community_id) {
            try {
              if (!prisma) throw new Error('Database service unavailable');
              const community = await prisma.$queryRaw<Array<{ name: string; description?: string }>>`
                SELECT name, description FROM communities WHERE id = ${doc.community_id}::uuid
              `;
              if (community[0]) {
                communityContext = `Community: ${community[0].name}. ${community[0].description || ''}`;
              }
            } catch (error) {
              console.warn('Could not get community context:', error);
            }
          }

          return {
            content: doc.content || '',
            context: doc.title || 'Document analysis',
            communityContext
          };
        })
      );
    }

    // Analyze all documents
    const result = await serviceGapAnalysisService.analyzeMultipleDocuments(documentsForAnalysis);

    // Filter results if specific filters are requested
    let filteredResult = result;

    if (serviceType || urgency || gapType || location) {
      const filteredGaps = result.gaps.filter((gap: any) => {
        if (serviceType && gap.serviceType !== serviceType) return false;
        if (urgency && gap.urgency !== urgency) return false;
        if (gapType && gap.gapType !== gapType) return false;
        if (location && gap.location !== location) return false;
        return true;
      });

      filteredResult = {
        ...result,
        gaps: filteredGaps,
        gapsByType: {
          missing: filteredGaps.filter((g: any) => g.gapType === 'missing'),
          inadequate: filteredGaps.filter((g: any) => g.gapType === 'inadequate'),
          inaccessible: filteredGaps.filter((g: any) => g.gapType === 'inaccessible'),
          culturally_inappropriate: filteredGaps.filter((g: any) => g.gapType === 'culturally_inappropriate'),
          under_resourced: filteredGaps.filter((g: any) => g.gapType === 'under_resourced')
        },
        gapsByUrgency: {
          critical: filteredGaps.filter((g: any) => g.urgency === 'critical'),
          high: filteredGaps.filter((g: any) => g.urgency === 'high'),
          medium: filteredGaps.filter((g: any) => g.urgency === 'medium'),
          low: filteredGaps.filter((g: any) => g.urgency === 'low')
        },
        summary: {
          ...result.summary,
          totalGaps: filteredGaps.length,
          criticalGaps: filteredGaps.filter((g: any) => g.urgency === 'critical').length
        }
      };
    }

    return NextResponse.json({
      success: true,
      analysis: filteredResult,
      filters: { communityId, serviceType, urgency, gapType, location, limit },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Service gap analysis GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get service gap analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getDocumentsContent(documentIds: string[]) {
  try {
    if (!prisma) {
      throw new Error('Database service unavailable');
    }
    const documents = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      content: string;
      community_id: string;
    }>>`
      SELECT id, title, content, community_id
      FROM documents 
      WHERE id = ANY(${documentIds}::uuid[])
      AND content IS NOT NULL
    `;

    return Promise.all(
      documents.map(async (doc: any) => {
        let communityContext = '';
        if (doc.community_id) {
          try {
            const community = await prisma!.$queryRaw<Array<{ name: string; description?: string }>>`
              SELECT name, description FROM communities WHERE id = ${doc.community_id}::uuid
            `;
            if (community[0]) {
              communityContext = `Community: ${community[0].name}. ${community[0].description || ''}`;
            }
          } catch (error) {
            console.warn('Could not get community context:', error);
          }
        }

        return {
          content: doc.content || '',
          context: doc.title || 'Document analysis',
          communityContext
        };
      })
    );
  } catch (error) {
    console.error('Error getting documents content:', error);
    throw error;
  }
}