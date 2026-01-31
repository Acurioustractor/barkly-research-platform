import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fresh query with no caching
    const { data, error, count } = await supabase
      .from('documents')
      .select('id, title, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      total_count: count,
      documents: data?.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        created_at: doc.created_at
      })) || []
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}