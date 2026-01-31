import { NextRequest, NextResponse } from 'next/server';
import { CulturalIntelligenceService } from '@/lib/community/cultural-intelligence-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('insightId');
    const communityId = searchParams.get('communityId');
    const protocolCategory = searchParams.get('protocolCategory');
    const complianceStatus = searchParams.get('complianceStatus');

    const compliance = await CulturalIntelligenceService.getProtocolCompliance(
      insightId || undefined,
      communityId || undefined,
      protocolCategory || undefined,
      complianceStatus || undefined
    );

    return NextResponse.json({
      success: true,
      data: compliance,
      count: compliance.length
    });
  } catch (error) {
    console.error('Error fetching protocol compliance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch protocol compliance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['insight_id', 'community_id', 'protocol_name', 'protocol_category', 'protocol_requirements'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate protocol_category
    const validCategories = ['data_sovereignty', 'traditional_knowledge', 'ceremonial', 'territorial', 'language', 'representation', 'consultation', 'consent'];
    if (!validCategories.includes(body.protocol_category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid protocol_category' },
        { status: 400 }
      );
    }

    // Validate compliance_status if provided
    if (body.compliance_status) {
      const validStatuses = ['compliant', 'non_compliant', 'partially_compliant', 'under_review', 'not_applicable'];
      if (!validStatuses.includes(body.compliance_status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid compliance_status' },
          { status: 400 }
        );
      }
    }

    // Validate compliance_score if provided
    if (body.compliance_score !== undefined && (body.compliance_score < 0 || body.compliance_score > 1)) {
      return NextResponse.json(
        { success: false, error: 'compliance_score must be between 0 and 1' },
        { status: 400 }
      );
    }

    const compliance = await CulturalIntelligenceService.createProtocolCompliance(body);

    return NextResponse.json({
      success: true,
      data: compliance
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating protocol compliance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create protocol compliance' },
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
        { success: false, error: 'Missing compliance ID' },
        { status: 400 }
      );
    }

    const compliance = await CulturalIntelligenceService.updateProtocolCompliance(id, updates);

    return NextResponse.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    console.error('Error updating protocol compliance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update protocol compliance' },
      { status: 500 }
    );
  }
}