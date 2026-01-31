import { NextRequest, NextResponse } from 'next/server';
import { CulturalIntelligenceService } from '@/lib/community/cultural-intelligence-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('insightId');
    const communityId = searchParams.get('communityId');
    const workflowStatus = searchParams.get('workflowStatus');
    const authorityId = searchParams.get('authorityId');

    const workflows = await CulturalIntelligenceService.getCulturalReviewWorkflows(
      insightId || undefined,
      communityId || undefined,
      workflowStatus || undefined,
      authorityId || undefined
    );

    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error fetching cultural review workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cultural review workflows' },
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

    // Validate workflow_type if provided
    if (body.workflow_type) {
      const validTypes = ['standard_review', 'expedited_review', 'ceremonial_review', 'consensus_review'];
      if (!validTypes.includes(body.workflow_type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid workflow_type' },
          { status: 400 }
        );
      }
    }

    // Validate priority_level if provided
    if (body.priority_level) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(body.priority_level)) {
        return NextResponse.json(
          { success: false, error: 'Invalid priority_level' },
          { status: 400 }
        );
      }
    }

    const workflow = await CulturalIntelligenceService.initiateCulturalReviewWorkflow(
      body.insight_id,
      body.community_id,
      body.workflow_type || 'standard_review',
      body.assigned_authorities || [],
      body.priority_level || 'medium',
      body.workflow_coordinator
    );

    return NextResponse.json({
      success: true,
      data: workflow
    }, { status: 201 });
  } catch (error) {
    console.error('Error initiating cultural review workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate cultural review workflow' },
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
        { success: false, error: 'Missing workflow ID' },
        { status: 400 }
      );
    }

    // Validate workflow_status if provided
    if (updates.workflow_status) {
      const validStatuses = ['initiated', 'in_progress', 'awaiting_authority', 'under_review', 'completed', 'escalated', 'suspended'];
      if (!validStatuses.includes(updates.workflow_status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid workflow_status' },
          { status: 400 }
        );
      }
    }

    const workflow = await CulturalIntelligenceService.updateCulturalReviewWorkflow(id, updates);

    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error updating cultural review workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cultural review workflow' },
      { status: 500 }
    );
  }
}