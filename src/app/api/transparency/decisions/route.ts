import { NextRequest, NextResponse } from 'next/server';
import { decisionTransparencyService } from '@/lib/community/decision-transparency-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const communityId = searchParams.get('communityId');
    const decisionId = searchParams.get('decisionId');
    const status = searchParams.get('status');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'get_decision':
        if (!decisionId) {
          return NextResponse.json(
            { error: 'Decision ID is required' },
            { status: 400 }
          );
        }
        
        const decision = await decisionTransparencyService.getDecision(decisionId);
        if (!decision) {
          return NextResponse.json(
            { error: 'Decision not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ decision });

      case 'get_by_community':
        if (!communityId) {
          return NextResponse.json(
            { error: 'Community ID is required' },
            { status: 400 }
          );
        }
        
        const communityDecisions = await decisionTransparencyService.getDecisionsByCommunity(
          communityId,
          status as any
        );
        return NextResponse.json({ decisions: communityDecisions });

      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Search query is required' },
            { status: 400 }
          );
        }
        
        const filters = {
          decisionType: searchParams.get('decisionType') || undefined,
          status: searchParams.get('status') || undefined,
          communityId: searchParams.get('communityId') || undefined,
          dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
          dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
        };
        
        const searchResults = await decisionTransparencyService.searchDecisions(query, filters);
        return NextResponse.json({ decisions: searchResults });

      case 'public':
      default:
        const publicDecisions = await decisionTransparencyService.getPublicDecisions(limit, offset);
        return NextResponse.json({ decisions: publicDecisions });
    }
  } catch (error) {
    console.error('Error in decisions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decisions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, decisionData, createdBy, decisionId, feedback, progress, policyData } = body;

    switch (action) {
      case 'create_decision':
        if (!decisionData || !createdBy) {
          return NextResponse.json(
            { error: 'Decision data and creator are required' },
            { status: 400 }
          );
        }
        
        const newDecision = await decisionTransparencyService.createDecision(
          decisionData,
          createdBy
        );
        return NextResponse.json({ 
          success: true, 
          decision: newDecision,
          message: 'Decision created successfully' 
        });

      case 'submit_for_review':
        if (!decisionId) {
          return NextResponse.json(
            { error: 'Decision ID is required' },
            { status: 400 }
          );
        }
        
        await decisionTransparencyService.submitForCulturalReview(decisionId);
        return NextResponse.json({ 
          success: true, 
          message: 'Decision submitted for cultural review' 
        });

      case 'publish_decision':
        if (!decisionId || !body.publishedBy) {
          return NextResponse.json(
            { error: 'Decision ID and publisher are required' },
            { status: 400 }
          );
        }
        
        await decisionTransparencyService.publishDecision(decisionId, body.publishedBy);
        return NextResponse.json({ 
          success: true, 
          message: 'Decision published successfully' 
        });

      case 'add_feedback':
        if (!decisionId || !feedback) {
          return NextResponse.json(
            { error: 'Decision ID and feedback are required' },
            { status: 400 }
          );
        }
        
        await decisionTransparencyService.addCommunityFeedback(decisionId, feedback);
        return NextResponse.json({ 
          success: true, 
          message: 'Feedback added successfully' 
        });

      case 'update_progress':
        if (!decisionId || !progress) {
          return NextResponse.json(
            { error: 'Decision ID and progress data are required' },
            { status: 400 }
          );
        }
        
        await decisionTransparencyService.updateImplementationProgress(decisionId, progress);
        return NextResponse.json({ 
          success: true, 
          message: 'Implementation progress updated' 
        });

      case 'track_resource_allocation':
        if (!decisionId || !body.allocationId || !body.status) {
          return NextResponse.json(
            { error: 'Decision ID, allocation ID, and status are required' },
            { status: 400 }
          );
        }
        
        await decisionTransparencyService.trackResourceAllocation(
          decisionId,
          body.allocationId,
          body.status,
          body.notes
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Resource allocation updated' 
        });

      case 'create_policy_change':
        if (!policyData) {
          return NextResponse.json(
            { error: 'Policy data is required' },
            { status: 400 }
          );
        }
        
        const policyChange = await decisionTransparencyService.createPolicyChange(policyData);
        return NextResponse.json({ 
          success: true, 
          policyChange,
          message: 'Policy change created successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in decisions POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { decisionId, updates, updatedBy } = body;

    if (!decisionId) {
      return NextResponse.json(
        { error: 'Decision ID is required' },
        { status: 400 }
      );
    }

    // This would typically update decision details
    // For now, we'll just acknowledge the request
    return NextResponse.json({ 
      success: true, 
      message: 'Decision update functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Error in decisions PUT API:', error);
    return NextResponse.json(
      { error: 'Failed to update decision' },
      { status: 500 }
    );
  }
}