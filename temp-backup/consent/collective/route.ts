import { NextRequest, NextResponse } from 'next/server';
import { 
  requestCollectiveConsent,
  processCollectiveConsent
} from '@/lib/consent-management-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentId,
      contentType,
      collectiveType,
      collectiveName,
      authorizedRepresentatives,
      culturalProtocols,
      communityId
    } = body;

    // Validate required fields
    if (!contentId || !contentType || !collectiveType || !collectiveName || 
        !authorizedRepresentatives || !communityId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const consentId = await requestCollectiveConsent(
      contentId,
      contentType,
      collectiveType as 'family' | 'clan' | 'community' | 'language_group',
      collectiveName,
      authorizedRepresentatives,
      culturalProtocols || [],
      communityId
    );

    return NextResponse.json({
      success: true,
      data: { consentId }
    });

  } catch (error) {
    console.error('Error creating collective consent request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create collective consent request'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      consentId,
      decision,
      conditions = [],
      votingRecord,
      decidedBy = 'system'
    } = body;

    // Validate required fields
    if (!consentId || !decision) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: consentId, decision'
      }, { status: 400 });
    }

    if (!['granted', 'denied', 'conditional'].includes(decision)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid decision value. Must be: granted, denied, or conditional'
      }, { status: 400 });
    }

    await processCollectiveConsent(
      consentId,
      decision as 'granted' | 'denied' | 'conditional',
      conditions,
      votingRecord,
      decidedBy
    );

    return NextResponse.json({
      success: true,
      message: `Collective consent ${decision} successfully`
    });

  } catch (error) {
    console.error('Error processing collective consent:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process collective consent'
    }, { status: 500 });
  }
}