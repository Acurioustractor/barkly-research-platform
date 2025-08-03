import { NextRequest, NextResponse } from 'next/server';
import { needsAnalysisService } from '@/lib/needs-analysis-service';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { documentText, documentContext, communityContext, documentIds } = await request.json();

    let result;

    if (documentIds && Array.isArray(documentIds)) {
      // Analyze multiple documents
      const documents = await getDocumentsContent(documentIds);
      result = await needsAnalysisService.analyzeMultipleDocuments(documents);
    } else if (documentText) {
      // Analyze single document text
      result = await needsAnalysisService.analyzeDocumentForNeeds(
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
    console.error('Needs analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze community needs',
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
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get documents for analysis
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
          needs: [],
          needsHierarchy: { critical: [], high: [], medium: [], low: [] },
          crossCuttingThemes: [],
          systemicIssues: [],
          emergingNeeds: [],
          summary: {
            totalNeeds: 0,
            criticalNeeds: 0,
            mostAffectedCommunities: [],
            topCategories: [],
            urgentActionRequired: false
          }
        }
      });
    }

    // Prepare documents for analysis
    const documentsForAnalysis = await Promise.all(
      (documents as any[]).map(async (doc) => {
        let communityContext = '';
        if (doc.community_id) {
          try {
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

    // Analyze all documents
    const result = await needsAnalysisService.analyzeMultipleDocuments(documentsForAnalysis);

    // Filter results if specific filters are requested
    let filteredResult = result;
    
    if (category || urgency) {
      const filteredNeeds = result.needs.filter(need => {
        if (category && need.category !== category) return false;
        if (urgency && need.urgency !== urgency) return false;
        return true;
      });

      filteredResult = {
        ...result,
        needs: filteredNeeds,
        needsHierarchy: {
          critical: filteredNeeds.filter(n => n.urgency === 'critical'),
          high: filteredNeeds.filter(n => n.urgency === 'high'),
          medium: filteredNeeds.filter(n => n.urgency === 'medium'),
          low: filteredNeeds.filter(n => n.urgency === 'low')
        },
        summary: {
          ...result.summary,
          totalNeeds: filteredNeeds.length,
          criticalNeeds: filteredNeeds.filter(n => n.urgency === 'critical').length
        }
      };
    }

    return NextResponse.json({
      success: true,
      analysis: filteredResult,
      filters: { communityId, category, urgency, limit },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Needs analysis GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get needs analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getDocumentsContent(documentIds: string[]) {
  try {
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
      documents.map(async (doc) => {
        let communityContext = '';
        if (doc.community_id) {
          try {
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
          content: doc.content,
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