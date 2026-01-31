import { NextRequest, NextResponse } from 'next/server';
import { identifySuccessPatterns, createPatternTemplates, analyzeCrossCommunityPatterns } from '@/lib/community/success-pattern-service';

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'identify':
        const { documentContent, communityContext, documentTitle } = data;
        if (!documentContent) {
          return NextResponse.json(
            { error: 'Document content is required' },
            { status: 400 }
          );
        }

        const patterns = await identifySuccessPatterns(
          documentContent,
          communityContext,
          documentTitle
        );

        return NextResponse.json({ patterns });

      case 'createTemplates':
        const { successPatterns } = data;
        if (!successPatterns || !Array.isArray(successPatterns)) {
          return NextResponse.json(
            { error: 'Success patterns array is required' },
            { status: 400 }
          );
        }

        const templates = await createPatternTemplates(successPatterns);
        return NextResponse.json({ templates });

      case 'analyzeCrossCommunity':
        const { communityPatterns } = data;
        if (!communityPatterns || !Array.isArray(communityPatterns)) {
          return NextResponse.json(
            { error: 'Community patterns array is required' },
            { status: 400 }
          );
        }

        const analysis = await analyzeCrossCommunityPatterns(communityPatterns);
        return NextResponse.json({ analysis });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: identify, createTemplates, or analyzeCrossCommunity' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Success patterns API error:', error);
    return NextResponse.json(
      { error: 'Failed to process success patterns request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const communityId = searchParams.get('communityId');

    if (!documentId && !communityId) {
      return NextResponse.json(
        { error: 'Either documentId or communityId is required' },
        { status: 400 }
      );
    }

    // This would typically fetch from database
    // For now, return empty array as placeholder
    const patterns: any[] = [];

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('Success patterns GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch success patterns' },
      { status: 500 }
    );
  }
}