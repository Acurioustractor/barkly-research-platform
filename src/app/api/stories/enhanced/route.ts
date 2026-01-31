import { NextRequest, NextResponse } from 'next/server';
import { 
  submitStory,
  getStoryCategories,
  getCommunityThemes,
  getModerationQueue,
  moderateStory
} from '@/lib/community/enhanced-story-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json({
        success: false,
        error: 'communityId parameter is required'
      }, { status: 400 });
    }

    switch (action) {
      case 'categories':
        const categories = await getStoryCategories(communityId);
        return NextResponse.json({
          success: true,
          data: categories
        });

      case 'themes':
        const themes = await getCommunityThemes(communityId);
        return NextResponse.json({
          success: true,
          data: themes
        });

      case 'moderation-queue':
        const moderatorType = searchParams.get('moderatorType');
        const priority = searchParams.get('priority');
        const queue = await getModerationQueue(moderatorType || undefined, priority || undefined);
        return NextResponse.json({
          success: true,
          data: queue
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in enhanced stories API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...storyData } = body;

    if (action === 'submit') {
      // Validate required fields
      if (!storyData.title || !storyData.content || !storyData.communityId) {
        return NextResponse.json({
          success: false,
          error: 'Title, content, and community ID are required'
        }, { status: 400 });
      }

      const storyId = await submitStory(storyData);

      return NextResponse.json({
        success: true,
        data: { storyId },
        message: 'Story submitted successfully. It will be reviewed before publication.'
      });
    }

    if (action === 'moderate') {
      const { storyId, decision, moderatorId, notes } = storyData;

      if (!storyId || !decision || !moderatorId) {
        return NextResponse.json({
          success: false,
          error: 'Story ID, decision, and moderator ID are required'
        }, { status: 400 });
      }

      if (!['approved', 'rejected', 'needs_revision'].includes(decision)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid decision. Must be: approved, rejected, or needs_revision'
        }, { status: 400 });
      }

      await moderateStory(storyId, decision, moderatorId, notes);

      return NextResponse.json({
        success: true,
        message: `Story ${decision} successfully`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in enhanced stories POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process story submission'
    }, { status: 500 });
  }
}