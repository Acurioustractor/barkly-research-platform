import { NextRequest, NextResponse } from 'next/server';
import { CulturalIntelligenceService } from '@/lib/cultural-intelligence-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('insightId');

    if (!insightId) {
      return NextResponse.json(
        { success: false, error: 'Missing insight ID' },
        { status: 400 }
      );
    }

    const context = await CulturalIntelligenceService.getCulturalContext(insightId);

    return NextResponse.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error fetching cultural context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cultural context' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.insight_id || !body.community_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: insight_id and community_id' },
        { status: 400 }
      );
    }

    // Validate cultural_significance_level
    const validSignificanceLevels = ['low', 'medium', 'high', 'sacred', 'restricted'];
    if (body.cultural_significance_level && !validSignificanceLevels.includes(body.cultural_significance_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cultural_significance_level' },
        { status: 400 }
      );
    }

    const context = await CulturalIntelligenceService.createCulturalContext(body);

    return NextResponse.json({
      success: true,
      data: context
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cultural context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create cultural context' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing context ID' },
        { status: 400 }
      );
    }

    const context = await CulturalIntelligenceService.updateCulturalContext(id, updates);

    return NextResponse.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error updating cultural context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cultural context' },
      { status: 500 }
    );
  }
}