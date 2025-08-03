import { NextRequest, NextResponse } from 'next/server';
import {
  createStoryExploration,
  getStoryExploration,
  getCommunityStoryExplorations,
  updateExplorationEngagement
} from '@/lib/dynamic-storytelling-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const explorationId = searchParams.get('explorationId');
    const communityId = searchParams.get('communityId');

    switch (action) {
      case 'get':
        if (!explorationId) {
          return NextResponse.json(
            { success: false, error: 'Exploration ID is required' },
            { status: 400 }
          );
        }

        const exploration = await getStoryExploration(explorationId);
        
        if (!exploration) {
          return NextResponse.json(
            { success: false, error: 'Story exploration not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: exploration
        });

      case 'list':
        if (!communityId) {
          return NextResponse.json(
            { success: false, error: 'Community ID is required' },
            { status: 400 }
          );
        }

        const explorations = await getCommunityStoryExplorations(communityId);

        return NextResponse.json({
          success: true,
          data: explorations
        });

      case 'analytics':
        if (!explorationId) {
          return NextResponse.json(
            { success: false, error: 'Exploration ID is required' },
            { status: 400 }
          );
        }

        // Get analytics data from database
        const { supabase } = await import('@/lib/supabase');
        const { data: analytics, error: analyticsError } = await supabase
          .from('story_exploration_analytics')
          .select('*')
          .eq('exploration_id', explorationId)
          .single();

        if (analyticsError && analyticsError.code !== 'PGRST116') {
          throw new Error(`Failed to fetch analytics: ${analyticsError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: analytics || {
            view_count: 0,
            unique_viewers: 0,
            interaction_count: 0,
            share_count: 0,
            completion_rate: 0,
            average_time_spent: 0
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in story explorations GET API:', error);
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
      case 'create':
        const {
          communityId,
          centralTheme,
          timeRange,
          culturalSafetyLevel,
          includeMultimedia,
          maxStories
        } = body;

        if (!communityId) {
          return NextResponse.json(
            { success: false, error: 'Community ID is required' },
            { status: 400 }
          );
        }

        const config = {
          centralTheme,
          timeRange: timeRange ? {
            start: new Date(timeRange.start),
            end: new Date(timeRange.end)
          } : undefined,
          culturalSafetyLevel: culturalSafetyLevel || 'public',
          includeMultimedia: includeMultimedia !== false,
          maxStories: maxStories || 50
        };

        const newExploration = await createStoryExploration(communityId, config);

        return NextResponse.json({
          success: true,
          data: newExploration,
          message: 'Story exploration created successfully'
        });

      case 'update_engagement':
        const {
          explorationId,
          viewCount,
          interactionCount,
          shareCount,
          completionRate
        } = body;

        if (!explorationId) {
          return NextResponse.json(
            { success: false, error: 'Exploration ID is required' },
            { status: 400 }
          );
        }

        await updateExplorationEngagement(explorationId, {
          viewCount,
          interactionCount,
          shareCount,
          completionRate
        });

        return NextResponse.json({
          success: true,
          message: 'Engagement metrics updated successfully'
        });

      case 'track_session':
        const {
          explorationId: sessionExplorationId,
          sessionToken,
          userType,
          storiesViewed,
          pathwaysExplored,
          filtersUsed,
          sessionDuration,
          completionStatus
        } = body;

        if (!sessionExplorationId || !sessionToken) {
          return NextResponse.json(
            { success: false, error: 'Exploration ID and session token are required' },
            { status: 400 }
          );
        }

        const { supabase } = await import('@/lib/supabase');
        const sessionData = {
          exploration_id: sessionExplorationId,
          session_token: sessionToken,
          user_type: userType || 'anonymous',
          stories_viewed: storiesViewed || [],
          pathways_explored: pathwaysExplored || [],
          filters_used: filtersUsed || {},
          total_time_spent: sessionDuration || 0,
          completion_status: completionStatus || 'in_progress',
          session_end: completionStatus === 'completed' || completionStatus === 'abandoned' 
            ? new Date().toISOString() 
            : null
        };

        const { error: sessionError } = await supabase
          .from('interactive_story_sessions')
          .upsert([sessionData], { onConflict: 'session_token' });

        if (sessionError) {
          throw new Error(`Failed to track session: ${sessionError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Session tracked successfully'
        });

      case 'get_related_stories':
        const { storyId, maxResults, minStrength } = body;

        if (!storyId) {
          return NextResponse.json(
            { success: false, error: 'Story ID is required' },
            { status: 400 }
          );
        }

        const { supabase: relatedSupabase } = await import('@/lib/supabase');
        const { data: relatedStories, error: relatedError } = await relatedSupabase
          .rpc('find_related_stories', {
            p_story_id: storyId,
            p_max_results: maxResults || 5,
            p_min_strength: minStrength || 0.5
          });

        if (relatedError) {
          throw new Error(`Failed to find related stories: ${relatedError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: relatedStories || []
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in story explorations POST API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}