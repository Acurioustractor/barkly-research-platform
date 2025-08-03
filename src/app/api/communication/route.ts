import { NextRequest, NextResponse } from 'next/server';
import { twoWayCommunicationService } from '../../../lib/two-way-communication-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const communityId = searchParams.get('communityId');
    const workingGroupId = searchParams.get('workingGroupId');
    const feedbackId = searchParams.get('feedbackId');
    const summaryId = searchParams.get('summaryId');
    const consultationId = searchParams.get('consultationId');
    const status = searchParams.get('status');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'month';
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (action) {
      case 'get_feedback':
        if (!feedbackId) {
          return NextResponse.json(
            { error: 'Feedback ID is required' },
            { status: 400 }
          );
        }
        
        const feedback = await twoWayCommunicationService.getFeedback(feedbackId);
        if (!feedback) {
          return NextResponse.json(
            { error: 'Feedback not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ feedback });

      case 'get_feedback_by_working_group':
        if (!workingGroupId) {
          return NextResponse.json(
            { error: 'Working group ID is required' },
            { status: 400 }
          );
        }
        
        const workingGroupFeedback = await twoWayCommunicationService.getFeedbackByWorkingGroup(
          workingGroupId,
          status as any
        );
        return NextResponse.json({ feedback: workingGroupFeedback });

      case 'get_meeting_summary':
        if (!summaryId) {
          return NextResponse.json(
            { error: 'Meeting summary ID is required' },
            { status: 400 }
          );
        }
        
        const meetingSummary = await twoWayCommunicationService.getMeetingSummary(summaryId);
        if (!meetingSummary) {
          return NextResponse.json(
            { error: 'Meeting summary not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ meetingSummary });

      case 'get_published_meetings':
        const publishedMeetings = await twoWayCommunicationService.getPublishedMeetingSummaries(
          workingGroupId || undefined,
          limit
        );
        return NextResponse.json({ meetingSummaries: publishedMeetings });

      case 'get_consultation':
        if (!consultationId) {
          return NextResponse.json(
            { error: 'Consultation ID is required' },
            { status: 400 }
          );
        }
        
        const consultation = await twoWayCommunicationService.getConsultationSession(consultationId);
        if (!consultation) {
          return NextResponse.json(
            { error: 'Consultation not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ consultation });

      case 'get_upcoming_consultations':
        const upcomingConsultations = await twoWayCommunicationService.getUpcomingConsultations(
          communityId || undefined,
          limit
        );
        return NextResponse.json({ consultations: upcomingConsultations });

      case 'get_metrics':
        const metrics = await twoWayCommunicationService.getCommunicationMetrics(timeframe);
        return NextResponse.json({ metrics });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in communication API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, 
      feedbackData, 
      feedbackId, 
      response, 
      summaryData, 
      summaryId, 
      publishedBy,
      sessionData,
      consultationId,
      participant,
      outcomes
    } = body;

    switch (action) {
      case 'submit_feedback':
        if (!feedbackData) {
          return NextResponse.json(
            { error: 'Feedback data is required' },
            { status: 400 }
          );
        }
        
        const newFeedback = await twoWayCommunicationService.submitFeedback(feedbackData);
        return NextResponse.json({ 
          success: true, 
          feedback: newFeedback,
          message: 'Feedback submitted successfully' 
        });

      case 'respond_to_feedback':
        if (!feedbackId || !response) {
          return NextResponse.json(
            { error: 'Feedback ID and response are required' },
            { status: 400 }
          );
        }
        
        await twoWayCommunicationService.respondToFeedback(feedbackId, response);
        return NextResponse.json({ 
          success: true, 
          message: 'Response added successfully' 
        });

      case 'create_meeting_summary':
        if (!summaryData) {
          return NextResponse.json(
            { error: 'Meeting summary data is required' },
            { status: 400 }
          );
        }
        
        const newSummary = await twoWayCommunicationService.createMeetingSummary(summaryData);
        return NextResponse.json({ 
          success: true, 
          meetingSummary: newSummary,
          message: 'Meeting summary created successfully' 
        });

      case 'publish_meeting_summary':
        if (!summaryId || !publishedBy) {
          return NextResponse.json(
            { error: 'Meeting summary ID and publisher are required' },
            { status: 400 }
          );
        }
        
        await twoWayCommunicationService.publishMeetingSummary(summaryId, publishedBy);
        return NextResponse.json({ 
          success: true, 
          message: 'Meeting summary published successfully' 
        });

      case 'create_consultation':
        if (!sessionData) {
          return NextResponse.json(
            { error: 'Consultation session data is required' },
            { status: 400 }
          );
        }
        
        const newConsultation = await twoWayCommunicationService.createConsultationSession(sessionData);
        return NextResponse.json({ 
          success: true, 
          consultation: newConsultation,
          message: 'Consultation session created successfully' 
        });

      case 'register_for_consultation':
        if (!consultationId || !participant) {
          return NextResponse.json(
            { error: 'Consultation ID and participant data are required' },
            { status: 400 }
          );
        }
        
        await twoWayCommunicationService.registerForConsultation(consultationId, participant);
        return NextResponse.json({ 
          success: true, 
          message: 'Registration successful' 
        });

      case 'update_consultation_outcomes':
        if (!consultationId || !outcomes) {
          return NextResponse.json(
            { error: 'Consultation ID and outcomes are required' },
            { status: 400 }
          );
        }
        
        await twoWayCommunicationService.updateConsultationOutcomes(consultationId, outcomes);
        return NextResponse.json({ 
          success: true, 
          message: 'Consultation outcomes updated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in communication POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process communication request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackId, summaryId, consultationId, updates } = body;

    if (feedbackId) {
      // Update feedback status or other properties
      return NextResponse.json({ 
        success: true, 
        message: 'Feedback update functionality not yet implemented' 
      });
    } else if (summaryId) {
      // Update meeting summary
      return NextResponse.json({ 
        success: true, 
        message: 'Meeting summary update functionality not yet implemented' 
      });
    } else if (consultationId) {
      // Update consultation session
      return NextResponse.json({ 
        success: true, 
        message: 'Consultation update functionality not yet implemented' 
      });
    } else {
      return NextResponse.json(
        { error: 'No valid ID provided for update' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in communication PUT API:', error);
    return NextResponse.json(
      { error: 'Failed to update communication data' },
      { status: 500 }
    );
  }
}