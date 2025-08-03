import { NextRequest, NextResponse } from 'next/server';
import { earlyWarningSystemService } from '../../../../lib/early-warning-system';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const action = searchParams.get('action');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'month';

    switch (action) {
      case 'alerts':
        const alerts = await earlyWarningSystemService.getActiveAlerts(communityId || undefined);
        return NextResponse.json({ alerts });

      case 'statistics':
        const statistics = await earlyWarningSystemService.getAlertStatistics(
          communityId || undefined,
          timeframe
        );
        return NextResponse.json({ statistics });

      default:
        // Default: return both alerts and statistics
        const [alertsData, statisticsData] = await Promise.all([
          earlyWarningSystemService.getActiveAlerts(communityId || undefined),
          earlyWarningSystemService.getAlertStatistics(communityId || undefined, timeframe)
        ]);

        return NextResponse.json({
          alerts: alertsData,
          statistics: statisticsData
        });
    }
  } catch (error) {
    console.error('Error in early warning API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch early warning data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, communityId, acknowledgedBy, resolvedBy, resolution, notes } = body;

    switch (action) {
      case 'acknowledge':
        if (!alertId || !acknowledgedBy) {
          return NextResponse.json(
            { error: 'Alert ID and acknowledgedBy are required' },
            { status: 400 }
          );
        }
        
        await earlyWarningSystemService.acknowledgeAlert(alertId, acknowledgedBy, notes);
        return NextResponse.json({ success: true, message: 'Alert acknowledged successfully' });

      case 'resolve':
        if (!alertId || !resolvedBy || !resolution) {
          return NextResponse.json(
            { error: 'Alert ID, resolvedBy, and resolution are required' },
            { status: 400 }
          );
        }
        
        await earlyWarningSystemService.resolveAlert(alertId, resolvedBy, resolution);
        return NextResponse.json({ success: true, message: 'Alert resolved successfully' });

      case 'generate_predictions':
        if (!communityId) {
          return NextResponse.json(
            { error: 'Community ID is required for generating predictions' },
            { status: 400 }
          );
        }
        
        const { resourceTypes, timeHorizon } = body;
        const predictions = await earlyWarningSystemService.generateResourcePredictions(
          communityId,
          resourceTypes,
          timeHorizon
        );
        return NextResponse.json({ predictions });

      case 'start_monitoring':
        earlyWarningSystemService.startMonitoring();
        return NextResponse.json({ success: true, message: 'Monitoring started' });

      case 'stop_monitoring':
        earlyWarningSystemService.stopMonitoring();
        return NextResponse.json({ success: true, message: 'Monitoring stopped' });

      case 'manual_check':
        // Trigger manual monitoring checks
        await Promise.all([
          earlyWarningSystemService.monitorEmergingIssues(),
          earlyWarningSystemService.monitorServiceStrain(),
          earlyWarningSystemService.monitorOpportunities()
        ]);
        return NextResponse.json({ success: true, message: 'Manual monitoring check completed' });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in early warning POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process early warning request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, updates } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // This would typically update alert details
    // For now, we'll just acknowledge the request
    return NextResponse.json({ 
      success: true, 
      message: 'Alert update functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Error in early warning PUT API:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}