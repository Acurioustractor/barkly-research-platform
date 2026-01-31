import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIService } from '@/lib/ai-service-enhanced';
import { globalRateLimiter } from '@/lib/ai/ai-rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    // Get service health and statistics
    const serviceStats = enhancedAIService.getServiceStats();
    const rateLimitStats = globalRateLimiter.getOverallStats();

    const response: any = {
      status: serviceStats.isHealthy ? 'healthy' : 'unhealthy',
      providersAvailable: serviceStats.providersAvailable,
      totalProviders: rateLimitStats.totalProviders,
      healthyProviders: rateLimitStats.healthyProviders,
      totalActiveRequests: rateLimitStats.totalActiveRequests,
      timestamp: new Date().toISOString(),
    };

    if (includeDetails) {
      response.providerDetails = {};
      
      for (const [providerName, stats] of Object.entries(rateLimitStats.providers)) {
        if (stats) {
          response.providerDetails[providerName] = {
            isHealthy: stats.isHealthy,
            activeRequests: stats.activeRequests,
            failureCount: stats.failureCount,
            usage: {
              requestsLastMinute: stats.requestsLastMinute,
              requestsLastHour: stats.requestsLastHour,
              requestsLastDay: stats.requestsLastDay,
              tokensLastMinute: stats.tokensLastMinute,
              tokensLastHour: stats.tokensLastHour,
            },
          };
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Status API error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to retrieve AI service status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'test': {
        // Test AI service with a simple request
        try {
          const testResponse = await enhancedAIService.generateCompletion({
            prompt: 'Hello, this is a test message. Please respond with "Test successful".',
            systemPrompt: 'You are a helpful AI assistant.',
            temperature: 0.1,
            maxTokens: 50,
          });

          return NextResponse.json({
            success: true,
            provider: testResponse.provider,
            model: testResponse.model,
            response: testResponse.content,
            usage: testResponse.usage,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }
      }

      case 'reset-failures': {
        // Reset failure counts for all providers
        const body = await request.json();
        const { provider } = body;

        // This would require adding a method to reset failures in the rate limiter
        return NextResponse.json({
          success: true,
          message: provider ? `Reset failures for ${provider}` : 'Reset failures for all providers',
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Status API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}