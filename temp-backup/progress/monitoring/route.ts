import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeProgressMonitoring,
  updateProgressIndicators,
  generateProgressReport,
  getCurrentProgressIndicators,
  getRecentAlerts,
  getProgressReports,
  acknowledgeAlert,
  runAutomatedMonitoring
} from '@/lib/automated-progress-monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const communityId = searchParams.get('communityId');

    switch (action) {
      case 'indicators':
        if (!communityId) {
          return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }
        const indicators = await getCurrentProgressIndicators(communityId);
        return NextResponse.json({ indicators });

      case 'alerts':
        if (!communityId) {
          return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }
        const days = parseInt(searchParams.get('days') || '30');
        const alerts = await getRecentAlerts(communityId, days);
        return NextResponse.json({ alerts });

      case 'reports':
        if (!communityId) {
          return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }
        const limit = parseInt(searchParams.get('limit') || '10');
        const reports = await getProgressReports(communityId, limit);
        return NextResponse.json({ reports });

      case 'run-monitoring':
        await runAutomatedMonitoring();
        return NextResponse.json({ message: 'Automated monitoring completed' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in progress monitoring API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, communityId } = body;

    switch (action) {
      case 'initialize':
        const { configuration } = body;
        await initializeProgressMonitoring(communityId, configuration);
        return NextResponse.json({ message: 'Progress monitoring initialized' });

      case 'update-indicators':
        if (!communityId) {
          return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }
        const indicators = await updateProgressIndicators(communityId);
        return NextResponse.json({ indicators });

      case 'generate-report':
        if (!communityId) {
          return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }
        const report = await generateProgressReport(communityId);
        return NextResponse.json({ report });

      case 'acknowledge-alert':
        const { alertId, acknowledgedBy, notes } = body;
        if (!alertId || !acknowledgedBy) {
          return NextResponse.json({ error: 'Alert ID and acknowledgedBy required' }, { status: 400 });
        }
        await acknowledgeAlert(alertId, acknowledgedBy, notes);
        return NextResponse.json({ message: 'Alert acknowledged' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in progress monitoring API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}