import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      message: 'Basic API endpoint is working'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}