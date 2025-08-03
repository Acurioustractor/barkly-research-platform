import { NextRequest, NextResponse } from 'next/server';
import { processExpiredConsents } from '@/lib/consent-management-service';

export async function POST(request: NextRequest) {
  try {
    const results = await processExpiredConsents();

    return NextResponse.json({
      success: true,
      data: {
        processed: results.processed,
        errors: results.errors,
        message: `Processed ${results.processed} expired consents${results.errors.length > 0 ? ` with ${results.errors.length} errors` : ''}`
      }
    });

  } catch (error) {
    console.error('Error processing expired consents:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process expired consents'
    }, { status: 500 });
  }
}