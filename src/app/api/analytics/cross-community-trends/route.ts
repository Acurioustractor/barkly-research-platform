import { NextRequest, NextResponse } from 'next/server';
import { 
  crossCommunityTrendAnalysisService,
  TrendAnalysis
} from '@/lib/community/cross-community-trend-analysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const analysisId = searchParams.get('analysisId');
    const analysisType = searchParams.get('analysisType') as TrendAnalysis['analysisType'];
    const timeframe = searchParams.get('timeframe') as TrendAnalysis['timeframe'];
    const communityIds = searchParams.get('communityIds')?.split(',').filter(Boolean);
    const serviceType = searchParams.get('serviceType');
    const patternType = searchParams.get('patternType');
    const lookbackPeriod = parseInt(searchParams.get('lookbackPeriod') || '12');

    switch (action) {
      case 'get-analysis':
        if (!analysisId) {
          return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
        }
        const analysis = await crossCommunityTrendAnalysisService.getTrendAnalysis(analysisId);
        if (!analysis) {
          return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
        }
        return NextResponse.json({ analysis });

      case 'get-recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        const recentAnalyses = await crossCommunityTrendAnalysisService.getRecentTrendAnalyses(limit);
        return NextResponse.json({ analyses: recentAnalyses });

      case 'service-effectiveness':
        if (!serviceType) {
          return NextResponse.json({ error: 'Service type required' }, { status: 400 });
        }
        const effectiveness = await crossCommunityTrendAnalysisService.analyzeServiceEffectiveness(
          serviceType,
          timeframe || 'quarterly'
        );
        return NextResponse.json({ effectiveness });

      case 'emerging-needs':
        const emergingNeeds = await crossCommunityTrendAnalysisService.detectEmergingNeeds(
          timeframe || 'monthly'
        );
        return NextResponse.json({ emergingNeeds });

      case 'recognize-patterns':
        if (!patternType) {
          return NextResponse.json({ error: 'Pattern type required' }, { status: 400 });
        }
        const patterns = await crossCommunityTrendAnalysisService.recognizePatterns(
          patternType as any,
          lookbackPeriod
        );
        return NextResponse.json({ patterns });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in cross-community trends API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, analysisType, timeframe, communityIds } = body;

    switch (action) {
      case 'perform-analysis':
        if (!analysisType || !timeframe) {
          return NextResponse.json(
            { error: 'Analysis type and timeframe required' },
            { status: 400 }
          );
        }

        const analysis = await crossCommunityTrendAnalysisService.performTrendAnalysis(
          analysisType,
          timeframe,
          communityIds
        );

        return NextResponse.json({ analysis });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in cross-community trends API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}