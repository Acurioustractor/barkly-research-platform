import { NextRequest, NextResponse } from 'next/server';
import { getConsentTemplates } from '@/lib/consent-management-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const communityId = searchParams.get('communityId');

    if (!contentType) {
      return NextResponse.json({
        success: false,
        error: 'contentType parameter is required'
      }, { status: 400 });
    }

    const templates = await getConsentTemplates(
      contentType,
      communityId || undefined
    );

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error fetching consent templates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch consent templates'
    }, { status: 500 });
  }
}