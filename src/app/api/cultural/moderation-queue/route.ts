import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPendingReviews, submitForCulturalReview } from '@/lib/cultural-safety-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moderatorId = searchParams.get('moderatorId');
    const communityId = searchParams.get('communityId');
    const reviewType = searchParams.get('reviewType');
    const status = searchParams.get('status');

    if (!moderatorId) {
      return NextResponse.json(
        { error: 'Moderator ID is required' },
        { status: 400 }
      );
    }

    // Get pending reviews using the service
    const queue = await getPendingReviews(moderatorId, reviewType);

    // Filter by community if specified
    let filteredQueue = queue;
    if (communityId) {
      // This would need to be implemented in the service to filter by community
      filteredQueue = queue; // For now, return all
    }

    // Filter by status if specified
    if (status) {
      filteredQueue = filteredQueue.filter(item => item.status === status);
    }

    return NextResponse.json({ queue: filteredQueue });
  } catch (error) {
    console.error('Moderation queue API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'submitForReview':
        const { contentId, contentType, content, submittedBy, communityContext } = data;
        
        if (!contentId || !contentType || !content || !submittedBy) {
          return NextResponse.json(
            { error: 'Content ID, type, content, and submitter are required' },
            { status: 400 }
          );
        }

        const queueId = await submitForCulturalReview(
          contentId,
          contentType,
          content,
          submittedBy,
          communityContext
        );

        return NextResponse.json({ 
          queueId,
          message: 'Content submitted for cultural safety review' 
        });

      case 'assignModerator':
        const { queueId: assignQueueId, moderatorId } = data;
        
        if (!assignQueueId || !moderatorId) {
          return NextResponse.json(
            { error: 'Queue ID and moderator ID are required' },
            { status: 400 }
          );
        }

        const { error: assignError } = await supabase
          .from('cultural_moderation_queue')
          .update({
            assigned_moderator: moderatorId,
            status: 'in_review',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignQueueId);

        if (assignError) {
          throw new Error(`Failed to assign moderator: ${assignError.message}`);
        }

        return NextResponse.json({ 
          message: 'Moderator assigned successfully' 
        });

      case 'updatePriority':
        const { queueId: priorityQueueId, newPriority } = data;
        
        if (!priorityQueueId || !newPriority) {
          return NextResponse.json(
            { error: 'Queue ID and new priority are required' },
            { status: 400 }
          );
        }

        const { error: priorityError } = await supabase
          .from('cultural_moderation_queue')
          .update({
            priority: newPriority,
            updated_at: new Date().toISOString()
          })
          .eq('id', priorityQueueId);

        if (priorityError) {
          throw new Error(`Failed to update priority: ${priorityError.message}`);
        }

        return NextResponse.json({ 
          message: 'Priority updated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Moderation queue POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}