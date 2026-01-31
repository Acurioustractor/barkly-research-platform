import { NextRequest, NextResponse } from 'next/server';
import {
  createEvent,
  getCommunityEvents,
  registerForEvent,
  getEventStatistics,
  updateEventStatus
} from '@/lib/community/event-management-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json(
        { success: false, error: 'Community ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'list':
        const eventType = searchParams.get('eventType') || undefined;
        const status = searchParams.get('status') || undefined;
        const culturalSafety = searchParams.get('culturalSafety') || undefined;
        const startDate = searchParams.get('startDate') 
          ? new Date(searchParams.get('startDate')!) 
          : undefined;
        const endDate = searchParams.get('endDate') 
          ? new Date(searchParams.get('endDate')!) 
          : undefined;

        const events = await getCommunityEvents(communityId, {
          eventType,
          status,
          culturalSafety,
          startDate,
          endDate
        });

        return NextResponse.json({
          success: true,
          data: events
        });

      case 'statistics':
        const statsStartDate = searchParams.get('startDate') 
          ? new Date(searchParams.get('startDate')!) 
          : undefined;
        const statsEndDate = searchParams.get('endDate') 
          ? new Date(searchParams.get('endDate')!) 
          : undefined;

        const timeRange = statsStartDate && statsEndDate 
          ? { start: statsStartDate, end: statsEndDate }
          : undefined;

        const statistics = await getEventStatistics(communityId, timeRange);

        return NextResponse.json({
          success: true,
          data: statistics
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        const {
          title,
          description,
          eventType,
          startDate,
          endDate,
          location,
          isVirtual,
          virtualLink,
          maxAttendees,
          communityId,
          organizerId,
          organizerName,
          culturalSafety,
          requiresElderPresence,
          culturalProtocols,
          traditionalElements,
          facilitators,
          materials,
          learningObjectives,
          prerequisites,
          requiresRegistration,
          registrationDeadline,
          registrationQuestions,
          knowledgeCaptureEnabled,
          captureSettings,
          tags,
          relatedDocuments,
          relatedStories
        } = body;

        // Validate required fields
        if (!title || !startDate || !communityId) {
          return NextResponse.json(
            { success: false, error: 'Title, start date, and community ID are required' },
            { status: 400 }
          );
        }

        const eventData = {
          title,
          description,
          eventType: eventType || 'workshop',
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : new Date(startDate),
          location,
          isVirtual: isVirtual || false,
          virtualLink,
          maxAttendees,
          communityId,
          organizerId: organizerId || 'system',
          organizerName: organizerName || 'System',
          culturalSafety: culturalSafety || 'public',
          requiresElderPresence: requiresElderPresence || false,
          culturalProtocols: culturalProtocols || [],
          traditionalElements: traditionalElements || [],
          facilitators: facilitators || [],
          materials: materials || [],
          learningObjectives: learningObjectives || [],
          prerequisites: prerequisites || [],
          requiresRegistration: requiresRegistration || false,
          registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
          registrationQuestions: registrationQuestions || [],
          knowledgeCaptureEnabled: knowledgeCaptureEnabled || false,
          captureSettings: captureSettings || {
            allowRecording: false,
            allowPhotos: false,
            allowNotes: true,
            requiresConsent: true
          },
          tags: tags || [],
          relatedDocuments: relatedDocuments || [],
          relatedStories: relatedStories || []
        };

        const eventId = await createEvent(eventData);

        return NextResponse.json({
          success: true,
          data: { eventId }
        });

      case 'register':
        const {
          eventId: registerEventId,
          userId,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          communityRole,
          responses,
          culturalConsiderations
        } = body;

        if (!registerEventId || !attendeeName || !attendeeEmail) {
          return NextResponse.json(
            { success: false, error: 'Event ID, attendee name, and email are required' },
            { status: 400 }
          );
        }

        const registrationId = await registerForEvent(registerEventId, {
          userId,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          communityRole,
          responses: responses || {},
          culturalConsiderations: culturalConsiderations || []
        });

        return NextResponse.json({
          success: true,
          data: { registrationId }
        });

      case 'update_status':
        const { eventId: updateEventId, status: newStatus } = body;

        if (!updateEventId || !newStatus) {
          return NextResponse.json(
            { success: false, error: 'Event ID and status are required' },
            { status: 400 }
          );
        }

        await updateEventStatus(updateEventId, newStatus);

        return NextResponse.json({
          success: true,
          message: 'Event status updated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in events POST API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}