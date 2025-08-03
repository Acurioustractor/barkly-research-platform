import { NextRequest, NextResponse } from 'next/server';
import { 
  requestIndividualConsent,
  revokeConsent,
  checkConsentValidity,
  getConsentStatistics
} from '@/lib/consent-management-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');
    const intendedUse = searchParams.get('intendedUse');
    const communityId = searchParams.get('communityId');
    const action = searchParams.get('action');

    // Check consent validity for specific content
    if (action === 'check' && contentId && contentType && intendedUse) {
      const validity = await checkConsentValidity(
        contentId,
        contentType,
        intendedUse as 'share' | 'modify' | 'republish' | 'research' | 'commercial'
      );

      return NextResponse.json({
        success: true,
        data: validity
      });
    }

    // Get consent statistics
    if (action === 'statistics') {
      const timeRange = {
        start: new Date(searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        end: new Date(searchParams.get('endDate') || new Date().toISOString())
      };

      const statistics = await getConsentStatistics(timeRange, communityId || undefined);

      return NextResponse.json({
        success: true,
        data: statistics
      });
    }

    // Default: return error for unsupported action
    return NextResponse.json({
      success: false,
      error: 'Unsupported action or missing required parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in consent records API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process consent request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentId,
      contentType,
      grantor,
      grantorRole,
      consentScope,
      permissions,
      restrictions = [],
      expiryDays,
      communityId
    } = body;

    // Validate required fields
    if (!contentId || !contentType || !grantor || !grantorRole || !consentScope || !permissions) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const consentId = await requestIndividualConsent(
      contentId,
      contentType,
      grantor,
      grantorRole,
      consentScope,
      permissions,
      restrictions,
      expiryDays,
      communityId
    );

    return NextResponse.json({
      success: true,
      data: { consentId }
    });

  } catch (error) {
    console.error('Error creating consent record:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create consent record'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consentId = searchParams.get('consentId');
    const revokedBy = searchParams.get('revokedBy');
    const reason = searchParams.get('reason');

    if (!consentId || !revokedBy || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: consentId, revokedBy, reason'
      }, { status: 400 });
    }

    await revokeConsent(consentId, revokedBy, reason);

    return NextResponse.json({
      success: true,
      message: 'Consent revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking consent:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to revoke consent'
    }, { status: 500 });
  }
}