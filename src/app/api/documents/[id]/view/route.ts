import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the same API that the review page uses to get document data
    const reviewResponse = await fetch(`${request.nextUrl.origin}/api/documents/review/${params.id}`);
    
    if (!reviewResponse.ok) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    const reviewData = await reviewResponse.json();
    
    if (!reviewData.success || !reviewData.document) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    const document = reviewData.document;

    // If we have content preview, use that
    if (document.content_preview?.text) {
      const filename = `${document.title.replace(/[^a-zA-Z0-9.-]/g, '_')}.txt`;
      
      const headers = new Headers();
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      
      return new NextResponse(document.content_preview.text, {
        status: 200,
        headers
      });
    }

    // If we have regular content, use that
    if (document.content) {
      const filename = `${document.title.replace(/[^a-zA-Z0-9.-]/g, '_')}.txt`;
      
      const headers = new Headers();
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      
      return new NextResponse(document.content, {
        status: 200,
        headers
      });
    }

    return NextResponse.json({
      error: 'Document content not available for viewing'
    }, { status: 404 });

  } catch (error) {
    console.error('View error:', error);
    return NextResponse.json({
      error: 'Failed to view document'
    }, { status: 500 });
  }
}