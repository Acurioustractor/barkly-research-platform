import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get document thumbnail path using raw SQL to match the main API
    const result = await prisma.$queryRaw<Array<any>>`
      SELECT "thumbnailPath", title 
      FROM documents 
      WHERE id = ${id}::uuid
    `;
    
    const document = result[0];

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.thumbnailPath) {
      return NextResponse.json({ error: 'Thumbnail not available' }, { status: 404 });
    }

    // Read thumbnail file
    const thumbnailPath = join(process.cwd(), 'public', 'thumbnails', document.thumbnailPath);
    
    try {
      const imageBuffer = await readFile(thumbnailPath);
      
      // Determine content type based on file extension
      const ext = document.thumbnailPath.split('.').pop()?.toLowerCase();
      const contentType = ext === 'png' ? 'image/png' : 
                         ext === 'svg' ? 'image/svg+xml' : 
                         ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
          'Content-Disposition': `inline; filename="${document.title}-thumbnail.${ext}"`
        }
      });
    } catch (fileError) {
      console.error('Error reading thumbnail file:', fileError);
      return NextResponse.json({ error: 'Thumbnail file not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return NextResponse.json({ error: 'Failed to serve thumbnail' }, { status: 500 });
  }
}