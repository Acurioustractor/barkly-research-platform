import { NextRequest, NextResponse } from 'next/server';
import { communityHealthService } from '@/lib/community/community-health-service';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (communityId) {
      // Get health for specific community
      const health = await getCommunityHealthById(communityId);
      return NextResponse.json({ success: true, health });
    } else {
      // Get health for all communities
      const allHealth = await getAllCommunityHealth();
      return NextResponse.json({ success: true, communities: allHealth });
    }

  } catch (error: any) {
    console.error('Community health calculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate community health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getCommunityHealthById(communityId: string) {
  try {
    const health = await communityHealthService.calculateCommunityHealth(communityId);

    // Store the calculated health in the database
    await communityHealthService.storeCommunityHealth(health);

    return health;

  } catch (error) {
    console.error(`Error calculating health for community ${communityId}:`, error);
    throw error;
  }
}

async function getAllCommunityHealth() {
  try {
    const allHealth = await communityHealthService.calculateAllCommunityHealth();

    // Store all calculated health data
    await Promise.all(
      allHealth.map((health: any) => communityHealthService.storeCommunityHealth(health))
    );

    return allHealth;

  } catch (error) {
    console.error('Error calculating health for all communities:', error);
    throw error;
  }
}

// POST endpoint to recalculate health for a specific community
export async function POST(request: NextRequest) {
  try {
    const { communityId } = await request.json();

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    const health = await getCommunityHealthById(communityId);

    return NextResponse.json({
      success: true,
      health,
      message: 'Community health recalculated successfully'
    });

  } catch (error) {
    console.error('Community health recalculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to recalculate community health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}