import { NextRequest, NextResponse } from 'next/server';
import { 
  processStoryMedia,
  getStoryProcessingStatus
} from '@/lib/multimedia-processing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    const action = searchParams.get('action');

    if (!storyId) {
      return NextResponse.json({
        success: false,
        error: 'storyId parameter is required'
      }, { status: 400 });
    }

    if (action === 'status') {
      const status = await getStoryProcessingStatus(storyId);
      return NextResponse.json({
        success: true,
        data: status
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in multimedia processing API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, mediaFiles } = body;

    if (!storyId || !mediaFiles || !Array.isArray(mediaFiles)) {
      return NextResponse.json({
        success: false,
        error: 'storyId and mediaFiles array are required'
      }, { status: 400 });
    }

    const jobIds = await processStoryMedia(storyId, mediaFiles);

    return NextResponse.json({
      success: true,
      data: { jobIds },
      message: 'Media processing jobs created successfully'
    });

  } catch (error) {
    console.error('Error creating processing jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create processing jobs'
    }, { status: 500 });
  }
}