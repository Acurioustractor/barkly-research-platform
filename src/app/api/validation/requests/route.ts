import { NextRequest, NextResponse } from 'next/server';
import { intelligenceValidationService } from '@/lib/ai/intelligence-validation-service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const requests = await intelligenceValidationService.getValidationRequests(
      session.user.id,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length
    });

  } catch (error) {
    console.error('Error fetching validation requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['request_id', 'accuracy_score', 'relevance_score', 'completeness_score', 'cultural_appropriateness_score', 'overall_rating', 'recommendation', 'confidence_level'];
    const missingFields = requiredFields.filter(field => body[field] === undefined);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate score ranges
    const scoreFields = ['accuracy_score', 'relevance_score', 'completeness_score', 'cultural_appropriateness_score', 'overall_rating'];
    for (const field of scoreFields) {
      const value = body[field];
      if (typeof value !== 'number' || value < 1 || value > 5) {
        return NextResponse.json(
          { error: `${field} must be a number between 1 and 5` },
          { status: 400 }
        );
      }
    }

    // Validate confidence level
    if (typeof body.confidence_level !== 'number' || body.confidence_level < 0 || body.confidence_level > 1) {
      return NextResponse.json(
        { error: 'confidence_level must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Validate recommendation
    const validRecommendations = ['approve', 'approve_with_changes', 'reject', 'needs_more_review'];
    if (!validRecommendations.includes(body.recommendation)) {
      return NextResponse.json(
        { error: 'Invalid recommendation value' },
        { status: 400 }
      );
    }

    // Verify user is assigned to this validation request
    const { data: request_data } = await supabase
      .from('validation_requests')
      .select('validator_id, status')
      .eq('id', body.request_id)
      .single();

    if (!request_data) {
      return NextResponse.json({ error: 'Validation request not found' }, { status: 404 });
    }

    if (request_data.validator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this validation request' },
        { status: 403 }
      );
    }

    if (request_data.status === 'completed') {
      return NextResponse.json(
        { error: 'This validation request has already been completed' },
        { status: 400 }
      );
    }

    const responseData = {
      request_id: body.request_id,
      validator_id: session.user.id,
      accuracy_score: body.accuracy_score,
      relevance_score: body.relevance_score,
      completeness_score: body.completeness_score,
      cultural_appropriateness_score: body.cultural_appropriateness_score,
      overall_rating: body.overall_rating,
      feedback_comments: body.feedback_comments || '',
      suggested_improvements: body.suggested_improvements || [],
      cultural_concerns: body.cultural_concerns || [],
      factual_corrections: body.factual_corrections || [],
      source_verification: body.source_verification || {
        sources_accurate: true,
        missing_sources: [],
        additional_sources: []
      },
      recommendation: body.recommendation,
      confidence_level: body.confidence_level
    };

    const newResponse = await intelligenceValidationService.submitValidationResponse(responseData);

    return NextResponse.json({
      success: true,
      data: newResponse,
      message: 'Validation response submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting validation response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit validation response' },
      { status: 500 }
    );
  }
}