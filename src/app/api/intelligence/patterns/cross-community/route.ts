import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceDatabaseService } from '@/lib/intelligence-database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patternType = searchParams.get('patternType');
    const communityId = searchParams.get('communityId');
    const status = searchParams.get('status') || 'active';

    const patterns = await IntelligenceDatabaseService.getCrossCommunityPatterns(
      patternType || undefined,
      communityId || undefined,
      status
    );

    return NextResponse.json({
      success: true,
      data: patterns,
      count: patterns.length
    });
  } catch (error) {
    console.error('Error fetching cross-community patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cross-community patterns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['pattern_name', 'pattern_type', 'primary_community_id', 'pattern_strength', 'confidence_level'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate pattern_strength and confidence_level
    if (body.pattern_strength < 0 || body.pattern_strength > 1) {
      return NextResponse.json(
        { success: false, error: 'pattern_strength must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (body.confidence_level < 0 || body.confidence_level > 1) {
      return NextResponse.json(
        { success: false, error: 'confidence_level must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Validate geographic_scope if provided
    if (body.geographic_scope) {
      const validScopes = ['local', 'regional', 'provincial', 'national'];
      if (!validScopes.includes(body.geographic_scope)) {
        return NextResponse.json(
          { success: false, error: 'Invalid geographic_scope' },
          { status: 400 }
        );
      }
    }

    const pattern = await IntelligenceDatabaseService.createCrossCommunityPattern(body);

    // Record analytics event
    await IntelligenceDatabaseService.recordAnalyticsEvent({
      event_type: 'cross_community_pattern_detected',
      event_category: 'intelligence_generation',
      community_id: body.primary_community_id,
      event_data: {
        pattern_id: pattern.id,
        pattern_type: body.pattern_type,
        pattern_strength: body.pattern_strength,
        confidence_level: body.confidence_level,
        related_communities_count: body.related_community_ids?.length || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: pattern
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cross-community pattern:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create cross-community pattern' },
      { status: 500 }
    );
  }
}