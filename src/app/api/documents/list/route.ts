import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const communityId = searchParams.get('communityId');
    const processedSince = searchParams.get('processed_since');
    const status = searchParams.get('status');

    // Build where clause
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (communityId) {
      whereClause += `community_id = $${paramIndex}::uuid`;
      params.push(communityId);
      paramIndex++;
    }

    if (processedSince) {
      if (whereClause) whereClause += ' AND ';
      whereClause += `(processed_at > $${paramIndex} OR created_at > $${paramIndex})`;
      params.push(processedSince);
      paramIndex++;
    }

    if (status) {
      if (whereClause) whereClause += ' AND ';
      whereClause += `processing_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add WHERE clause if we have conditions
    const whereSQL = whereClause ? `WHERE ${whereClause}` : '';

    // Get documents
    const documents = await prisma.$queryRawUnsafe(`
      SELECT
        id, title, content, cultural_sensitivity, community_id, uploaded_by,
        cultural_metadata, file_type, file_size, created_at, updated_at,
        processing_status, processed_at, ai_analysis, "thumbnailPath"
      FROM documents
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params, limit, offset);

    // Get total count
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM documents ${whereSQL}
    `, ...params.slice(0, paramIndex - 2)); // Remove limit/offset params

    const total = Array.isArray(countResult) && countResult[0] ? 
      parseInt(countResult[0].total) : 0;

    // Return documents as-is since they already match the expected format
    const documentsWithCommunities = documents as any[];

    return NextResponse.json({
      success: true,
      documents: documentsWithCommunities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        communityId,
        processedSince,
        status
      }
    });

  } catch (error) {
    console.error('Documents list error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}