import { NextRequest, NextResponse } from 'next/server';
import { analyzeCommunityIntelligence } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { text, documentContext, communityContext } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Analyze the text for community intelligence
    const intelligence = await analyzeCommunityIntelligence(
      text,
      documentContext,
      communityContext
    );

    return NextResponse.json({
      success: true,
      intelligence
    });

  } catch (error) {
    console.error('Community intelligence analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze community intelligence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Community Intelligence Analysis API',
    endpoints: {
      POST: '/api/intelligence/analyze',
      description: 'Analyze text for community intelligence including needs, gaps, opportunities, and success patterns'
    }
  });
}