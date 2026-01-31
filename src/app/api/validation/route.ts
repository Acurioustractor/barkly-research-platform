import { NextRequest, NextResponse } from 'next/server';
import { communityValidationService } from '@/lib/community/community-validation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const requestId = searchParams.get('requestId');
    const status = searchParams.get('status');
    const communityId = searchParams.get('communityId');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'month';

    switch (action) {
      case 'get_request':
        if (!requestId) {
          return NextResponse.json(
            { error: 'Request ID is required' },
            { status: 400 }
          );
        }
        
        const request = await communityValidationService.getValidationRequest(requestId);
        if (!request) {
          return NextResponse.json(
            { error: 'Validation request not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ request });

      case 'get_requests_by_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required' },
            { status: 400 }
          );
        }
        
        const requests = await communityValidationService.getValidationRequestsByStatus(
          status as any,
          communityId || undefined
        );
        return NextResponse.json({ requests });

      case 'get_metrics':
        const metrics = await communityValidationService.getValidationMetrics(
          timeframe,
          communityId || undefined
        );
        return NextResponse.json({ metrics });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in validation API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, 
      contentData, 
      requestId, 
      validation, 
      feedback,
      revision
    } = body;

    switch (action) {
      case 'submit_for_validation':
        if (!contentData) {
          return NextResponse.json(
            { error: 'Content data is required' },
            { status: 400 }
          );
        }
        
        const newRequest = await communityValidationService.submitForValidation(contentData);
        return NextResponse.json({ 
          success: true, 
          request: newRequest,
          message: 'Content submitted for validation successfully' 
        });

      case 'submit_validation':
        if (!requestId || !validation) {
          return NextResponse.json(
            { error: 'Request ID and validation data are required' },
            { status: 400 }
          );
        }
        
        await communityValidationService.submitValidation(requestId, validation);
        return NextResponse.json({ 
          success: true, 
          message: 'Validation submitted successfully' 
        });

      case 'add_feedback':
        if (!requestId || !feedback) {
          return NextResponse.json(
            { error: 'Request ID and feedback are required' },
            { status: 400 }
          );
        }
        
        await communityValidationService.addValidationFeedback(requestId, feedback);
        return NextResponse.json({ 
          success: true, 
          message: 'Feedback added successfully' 
        });

      case 'revise_content':
        if (!requestId || !revision) {
          return NextResponse.json(
            { error: 'Request ID and revision data are required' },
            { status: 400 }
          );
        }
        
        await communityValidationService.reviseContent(requestId, revision);
        return NextResponse.json({ 
          success: true, 
          message: 'Content revised successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in validation POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process validation request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, updates } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // This would typically update validation request details
    // For now, we'll just acknowledge the request
    return NextResponse.json({ 
      success: true, 
      message: 'Validation request update functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Error in validation PUT API:', error);
    return NextResponse.json(
      { error: 'Failed to update validation request' },
      { status: 500 }
    );
  }
}