import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { submitForElderReview } from '@/lib/community/cultural-safety-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const communityId = searchParams.get('communityId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get elder reviews
    let query = supabase
      .from('elder_reviews')
      .select(`
        id,
        content_id,
        content_type,
        cultural_concerns,
        recommendations,
        protocol_violations,
        review_decision,
        review_date,
        status,
        urgency,
        created_at,
        elders(name, role, community_id),
        communities(name)
      `)
      .order('created_at', { ascending: false });

    // Filter by elder if user is an elder
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!roleError && userRole?.role === 'elder') {
      query = query.eq('elder_id', userId);
    }

    if (communityId) {
      query = query.eq('elders.community_id', communityId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch elder reviews' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const reviews = data?.map(review => ({
      id: review.id,
      contentId: review.content_id,
      elderName: Array.isArray(review.elders) ? review.elders[0]?.name : (review.elders as any)?.name || 'Unknown Elder',
      elderRole: Array.isArray(review.elders) ? review.elders[0]?.role : (review.elders as any)?.role || 'Elder',
      reviewDecision: review.review_decision,
      culturalConcerns: review.cultural_concerns || [],
      recommendations: review.recommendations || [],
      protocolViolations: review.protocol_violations || [],
      reviewDate: new Date(review.review_date || review.created_at),
      status: review.status,
      urgency: review.urgency,
      community: Array.isArray(review.communities) ? review.communities[0]?.name : (review.communities as any)?.name || 'Unknown'
    })) || [];

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Elder reviews API error:', error);
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
      case 'submitForElderReview':
        const { contentId, contentType, elderIds, culturalConcerns, urgency } = data;

        if (!contentId || !contentType || !elderIds || !Array.isArray(elderIds)) {
          return NextResponse.json(
            { error: 'Content ID, type, and elder IDs array are required' },
            { status: 400 }
          );
        }

        const reviewIds = await submitForElderReview(
          contentId,
          contentType,
          elderIds,
          culturalConcerns || [],
          urgency || 'medium'
        );

        return NextResponse.json({
          reviewIds,
          message: `Content submitted to ${reviewIds.length} elders for review`
        });

      case 'completeElderReview':
        const {
          reviewId,
          elderDecision,
          culturalConcerns: concerns,
          recommendations,
          protocolViolations,
          reviewNotes
        } = data;

        if (!reviewId || !elderDecision) {
          return NextResponse.json(
            { error: 'Review ID and elder decision are required' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('elder_reviews')
          .update({
            review_decision: elderDecision,
            cultural_concerns: concerns || [],
            recommendations: recommendations || [],
            protocol_violations: protocolViolations || [],
            review_notes: reviewNotes,
            review_date: new Date().toISOString(),
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (updateError) {
          throw new Error(`Failed to complete elder review: ${updateError.message}`);
        }

        return NextResponse.json({
          message: 'Elder review completed successfully'
        });

      case 'escalateReview':
        const { reviewId: escalateId, escalationReason, escalateTo } = data;

        if (!escalateId || !escalationReason) {
          return NextResponse.json(
            { error: 'Review ID and escalation reason are required' },
            { status: 400 }
          );
        }

        // Create escalation record
        const { error: escalationError } = await supabase
          .from('cultural_escalations')
          .insert([{
            review_id: escalateId,
            escalation_reason: escalationReason,
            escalated_to: escalateTo,
            status: 'pending',
            created_at: new Date().toISOString()
          }]);

        if (escalationError) {
          throw new Error(`Failed to escalate review: ${escalationError.message}`);
        }

        // Update review status
        const { error: reviewUpdateError } = await supabase
          .from('elder_reviews')
          .update({
            status: 'escalated',
            updated_at: new Date().toISOString()
          })
          .eq('id', escalateId);

        if (reviewUpdateError) {
          console.error('Failed to update review status:', reviewUpdateError);
        }

        return NextResponse.json({
          message: 'Review escalated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Elder reviews POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}