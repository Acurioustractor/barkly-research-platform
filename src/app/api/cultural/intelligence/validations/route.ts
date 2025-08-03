import { NextRequest, NextResponse } from 'next/server';
import { CulturalIntelligenceService } from '@/lib/cultural-intelligence-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('insightId');
    const communityId = searchParams.get('communityId');
    const authorityId = searchParams.get('authorityId');
    const status = searchParams.get('status');

    const validations = await CulturalIntelligenceService.getCulturalValidations(
      insightId || undefined,
      communityId || undefined,
      authorityId || undefined,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      data: validations,
      count: validations.length
    });
  } catch (error) {
    console.error('Error fetching cultural validations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cultural validations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['insight_id', 'community_id', 'cultural_authority_id', 'authority_role', 'validation_type', 'validation_decision'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate validation_type
    const validTypes = ['cultural_accuracy', 'protocol_compliance', 'sharing_appropriateness', 'traditional_knowledge_review', 'community_impact_assessment'];
    if (!validTypes.includes(body.validation_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid validation_type' },
        { status: 400 }
      );
    }

    // Validate validation_status if provided
    if (body.validation_status) {
      const validStatuses = ['pending', 'approved', 'approved_with_conditions', 'requires_modification', 'rejected'];
      if (!validStatuses.includes(body.validation_status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid validation_status' },
          { status: 400 }
        );
      }
    }

    // Validate confidence level if provided
    if (body.validation_confidence_level !== undefined && (body.validation_confidence_level < 0 || body.validation_confidence_level > 1)) {
      return NextResponse.json(
        { success: false, error: 'validation_confidence_level must be between 0 and 1' },
        { status: 400 }
      );
    }

    const validation = await CulturalIntelligenceService.createCulturalValidation(body);

    return NextResponse.json({
      success: true,
      data: validation
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cultural validation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create cultural validation' },
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
        { success: false, error: 'Missing validation ID' },
        { status: 400 }
      );
    }

    const validation = await CulturalIntelligenceService.updateCulturalValidation(id, updates);

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error updating cultural validation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cultural validation' },
      { status: 500 }
    );
  }
}