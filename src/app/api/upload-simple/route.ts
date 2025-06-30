import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files' }, { status: 400 });
    }

    // Just return success - no processing, no database, nothing
    return NextResponse.json({
      success: true,
      message: `Received ${files.length} files`,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}