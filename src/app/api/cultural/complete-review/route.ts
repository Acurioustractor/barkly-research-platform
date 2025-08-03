import { NextRequest, NextResponse } from 'next/server';
import { completeCulturalReview } from '@/lib/cultural-safety-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reviewId, 
      decision, 
      reviewNotes, 
      reviewedBy, 
      culturalSafetyLevel 
    } = body;

    if (!reviewId || !decision || !reviewNotes || !reviewedBy) {
      return NextResponse.json(
        { error: 'Review ID, decision, notes, and reviewer are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'needs_revision'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be approve, reject, or needs_revision' },
        { status: 400 }
      );
    }

    await completeCulturalReview(
      reviewId,
      decision,
      reviewNotes,
      reviewedBy,
      culturalSafetyLevel
    );

    return NextResponse.json({ 
      message: 'Cultural safety review completed successfully' 
    });
  } catch (error) {
    console.error('Complete review API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}