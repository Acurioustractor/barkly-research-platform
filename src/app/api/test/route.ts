import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if pdf-lib is available
    let pdfLibAvailable = false;
    try {
      await import('pdf-lib');
      pdfLibAvailable = true;
    } catch (e) {
      console.error('pdf-lib import error:', e);
    }

    // Test if we can create a simple PDF
    let canCreatePDF = false;
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      canCreatePDF = true;
    } catch (e) {
      console.error('PDF creation error:', e);
    }

    return NextResponse.json({
      status: 'ok',
      tests: {
        pdfLibAvailable,
        canCreatePDF,
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}