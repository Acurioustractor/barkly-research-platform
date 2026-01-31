import { NextRequest, NextResponse } from 'next/server';
import { CulturalIntelligenceService } from '@/lib/community/cultural-intelligence-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const summaryType = searchParams.get('type') || 'overview';

    switch (summaryType) {
      case 'overview':
        const summary = await CulturalIntelligenceService.getCulturalIntelligenceSummary(
          communityId || undefined
        );
        return NextResponse.json({
          success: true,
          data: summary
        });

      case 'workload':
        const authorityId = searchParams.get('authorityId');
        const workload = await CulturalIntelligenceService.getCulturalReviewWorkload(
          authorityId || undefined
        );
        return NextResponse.json({
          success: true,
          data: workload
        });

      case 'compliance':
        const compliance = await CulturalIntelligenceService.getCulturalComplianceDashboard(
          communityId || undefined
        );
        return NextResponse.json({
          success: true,
          data: compliance
        });

      case 'metrics':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const metrics = await CulturalIntelligenceService.getCulturalComplianceMetrics(
          communityId || undefined,
          startDate || undefined,
          endDate || undefined
        );
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'dashboard':
        // Comprehensive dashboard data
        const [
          overviewData,
          complianceData,
          metricsData
        ] = await Promise.all([
          CulturalIntelligenceService.getCulturalIntelligenceSummary(communityId || undefined),
          CulturalIntelligenceService.getCulturalComplianceDashboard(communityId || undefined),
          CulturalIntelligenceService.getCulturalComplianceMetrics(
            communityId || undefined,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
            new Date().toISOString().split('T')[0] // today
          )
        ]);

        return NextResponse.json({
          success: true,
          data: {
            overview: overviewData,
            compliance: complianceData,
            metrics: metricsData
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid summary type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching cultural intelligence summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cultural intelligence summary' },
      { status: 500 }
    );
  }
}