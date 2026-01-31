import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkshopSession,
  getWorkshopSessions
} from '@/lib/community/event-management-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const sessions = await getWorkshopSessions(eventId);

    return NextResponse.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching workshop sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      sessionTitle,
      sessionDescription,
      facilitator,
      startTime,
      endTime,
      location,
      materials,
      objectives,
      notes,
      recordings,
      photos,
      documents,
      attendees,
      keyInsights,
      actionItems,
      culturalNotes
    } = body;

    // Validate required fields
    if (!eventId || !sessionTitle || !startTime) {
      return NextResponse.json(
        { success: false, error: 'Event ID, session title, and start time are required' },
        { status: 400 }
      );
    }

    const sessionData = {
      eventId,
      sessionTitle,
      sessionDescription,
      facilitator,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : new Date(startTime),
      location,
      materials: materials || [],
      objectives: objectives || [],
      notes,
      recordings: recordings || [],
      photos: photos || [],
      documents: documents || [],
      attendees: attendees || [],
      keyInsights: keyInsights || [],
      actionItems: actionItems || [],
      culturalNotes: culturalNotes || []
    };

    const sessionId = await createWorkshopSession(sessionData);

    return NextResponse.json({
      success: true,
      data: { sessionId }
    });
  } catch (error) {
    console.error('Error creating workshop session:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}