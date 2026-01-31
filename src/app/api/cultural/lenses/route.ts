import { NextRequest, NextResponse } from 'next/server';
import { 
  getCulturalLenses,
  updateCulturalLens
} from '@/lib/community/cultural-context-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json({
        success: false,
        error: 'communityId parameter is required'
      }, { status: 400 });
    }

    const culturalLenses = await getCulturalLenses(communityId);

    return NextResponse.json({
      success: true,
      data: culturalLenses
    });

  } catch (error) {
    console.error('Error fetching cultural lenses:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cultural lenses'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lensData = body;

    if (!lensData.communityId) {
      return NextResponse.json({
        success: false,
        error: 'communityId is required'
      }, { status: 400 });
    }

    const lensId = await updateCulturalLens(lensData);

    return NextResponse.json({
      success: true,
      data: { lensId },
      message: 'Cultural lens created successfully'
    });

  } catch (error) {
    console.error('Error creating cultural lens:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create cultural lens'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const lensData = body;

    if (!lensData.id || !lensData.communityId) {
      return NextResponse.json({
        success: false,
        error: 'id and communityId are required'
      }, { status: 400 });
    }

    const lensId = await updateCulturalLens(lensData);

    return NextResponse.json({
      success: true,
      data: { lensId },
      message: 'Cultural lens updated successfully'
    });

  } catch (error) {
    console.error('Error updating cultural lens:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update cultural lens'
    }, { status: 500 });
  }
}