import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envStatus = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      database_url: !!process.env.DATABASE_URL,
      openai_key: !!process.env.OPENAI_API_KEY,
      anthropic_key: !!process.env.ANTHROPIC_API_KEY,
    }

    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      variables: envStatus
    })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}