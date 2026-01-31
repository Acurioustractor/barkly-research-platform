import { NextRequest, NextResponse } from 'next/server';
import {
  getEventRegistrations,
  markAttendance
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

    const registrations = await getEventRegistrations(eventId);

    return NextResponse.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
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
      case 'mark_attendance':
        const { registrationId, attended } = body;

        if (!registrationId) {
          return NextResponse.json(
            { success: false, error: 'Registration ID is required' },
            { status: 400 }
          );
        }

        await markAttendance(registrationId, attended !== false);

        return NextResponse.json({
          success: true,
          message: 'Attendance marked successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in registrations API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}