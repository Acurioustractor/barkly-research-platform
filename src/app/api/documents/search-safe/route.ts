import { NextRequest, NextResponse } from 'next/server';

// Simple safe endpoint that always returns valid JSON
export async function GET(request: NextRequest) {
  try {
    // For now, just return empty results until database is connected
    return NextResponse.json({
      success: true,
      query: {},
      total: 0,
      results: [],
      message: 'Database not connected - returning empty results'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Search endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}