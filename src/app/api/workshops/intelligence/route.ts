import { NextRequest, NextResponse } from 'next/server';
import {
  processWorkshopIntelligence,
  getWorkshopIntelligenceReport,
  getWorkshopInsights,
  updateCommunityIntelligenceFromWorkshop
} from '@/lib/workshop-intelligence-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'report':
        const report = await getWorkshopIntelligenceReport(eventId);
        
        if (!report) {
          return NextResponse.json(
            { success: false, error: 'Intelligence report not found. Process workshop first.' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: report
        });

      case 'insights':
        const insightType = searchParams.get('type') as any;
        const insights = await getWorkshopInsights(eventId, insightType);

        return NextResponse.json({
          success: true,
          data: insights
        });

      case 'summary':
        // Get basic summary without full processing
        const existingReport = await getWorkshopIntelligenceReport(eventId);
        const allInsights = await getWorkshopInsights(eventId);

        const summary = {
          hasReport: !!existingReport,
          totalInsights: allInsights.length,
          insightsByType: {
            community_need: allInsights.filter(i => i.insightType === 'community_need').length,
            service_gap: allInsights.filter(i => i.insightType === 'service_gap').length,
            success_pattern: allInsights.filter(i => i.insightType === 'success_pattern').length,
            cultural_knowledge: allInsights.filter(i => i.insightType === 'cultural_knowledge').length,
            action_item: allInsights.filter(i => i.insightType === 'action_item').length
          },
          highPriorityInsights: allInsights.filter(i => i.priority === 'high' || i.priority === 'critical').length,
          lastProcessed: existingReport?.generatedAt || null
        };

        return NextResponse.json({
          success: true,
          data: summary
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in workshop intelligence GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'process':
        // Process workshop knowledge captures and generate intelligence
        const report = await processWorkshopIntelligence(eventId);

        return NextResponse.json({
          success: true,
          data: report,
          message: 'Workshop intelligence processed successfully'
        });

      case 'update_community_intelligence':
        // Update community intelligence systems with workshop insights
        await updateCommunityIntelligenceFromWorkshop(eventId);

        return NextResponse.json({
          success: true,
          message: 'Community intelligence updated with workshop insights'
        });

      case 'reprocess':
        // Reprocess workshop intelligence (useful if AI models improve)
        const reprocessedReport = await processWorkshopIntelligence(eventId);

        return NextResponse.json({
          success: true,
          data: reprocessedReport,
          message: 'Workshop intelligence reprocessed successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in workshop intelligence POST API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}