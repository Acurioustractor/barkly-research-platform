import { NextRequest, NextResponse } from 'next/server';
import {
  captureKnowledge,
  getEventKnowledgeCaptures
} from '@/lib/event-management-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const sessionId = searchParams.get('sessionId') || undefined;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const captures = await getEventKnowledgeCaptures(eventId, sessionId);

    return NextResponse.json({
      success: true,
      data: captures
    });
  } catch (error) {
    console.error('Error fetching knowledge captures:', error);
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
      sessionId,
      captureType,
      title,
      content,
      fileUrl,
      timestamp,
      capturedBy,
      tags,
      culturalSafety,
      requiresReview,
      metadata
    } = body;

    // Validate required fields
    if (!eventId || !captureType || !title) {
      return NextResponse.json(
        { success: false, error: 'Event ID, capture type, and title are required' },
        { status: 400 }
      );
    }

    const captureData = {
      eventId,
      sessionId,
      captureType,
      title,
      content,
      fileUrl,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      capturedBy: capturedBy || 'anonymous',
      tags: tags || [],
      culturalSafety: culturalSafety || 'public',
      requiresReview: requiresReview || false,
      metadata: metadata || {}
    };

    const captureId = await captureKnowledge(captureData);

    return NextResponse.json({
      success: true,
      data: { captureId }
    });
  } catch (error) {
    console.error('Error capturing knowledge:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}