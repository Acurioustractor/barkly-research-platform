import { NextRequest, NextResponse } from 'next/server';
import { 
  getCulturalContext,
  updateCulturalContext,
  applyCulturalContext,
  getCulturalColorScheme
} from '@/lib/community/cultural-context-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const action = searchParams.get('action');

    if (!communityId) {
      return NextResponse.json({
        success: false,
        error: 'communityId parameter is required'
      }, { status: 400 });
    }

    if (action === 'colorScheme') {
      // Get cultural color scheme
      const culturalContext = await getCulturalContext(communityId);
      if (!culturalContext) {
        return NextResponse.json({
          success: false,
          error: 'Cultural context not found'
        }, { status: 404 });
      }

      const colorScheme = getCulturalColorScheme(culturalContext);
      return NextResponse.json({
        success: true,
        data: colorScheme
      });
    }

    // Default: get cultural context
    const culturalContext = await getCulturalContext(communityId);
    
    if (!culturalContext) {
      return NextResponse.json({
        success: false,
        error: 'Cultural context not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: culturalContext
    });

  } catch (error) {
    console.error('Error in cultural context API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cultural context'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { communityId, ...contextData } = body;

    if (!communityId) {
      return NextResponse.json({
        success: false,
        error: 'communityId is required'
      }, { status: 400 });
    }

    await updateCulturalContext(communityId, contextData);

    return NextResponse.json({
      success: true,
      message: 'Cultural context updated successfully'
    });

  } catch (error) {
    console.error('Error updating cultural context:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update cultural context'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insight, communityId, userRole } = body;

    if (!insight || !communityId) {
      return NextResponse.json({
        success: false,
        error: 'insight and communityId are required'
      }, { status: 400 });
    }

    const contextualizedInsight = await applyCulturalContext(
      insight,
      communityId,
      userRole
    );

    return NextResponse.json({
      success: true,
      data: contextualizedInsight
    });

  } catch (error) {
    console.error('Error applying cultural context:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to apply cultural context'
    }, { status: 500 });
  }
}