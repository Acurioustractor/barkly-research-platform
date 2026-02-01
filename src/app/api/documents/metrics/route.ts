import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const supabase = await createClient()

    // Get basic document metrics
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, created_at, status')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const metrics = {
      totalDocuments: documents?.length || 0,
      totalThemes: 0, // Placeholder - would need themes table
      totalQuotes: 0, // Placeholder - would need quotes table
      statusDistribution: {
        completed: documents?.filter((d: any) => d.status === 'completed').length || 0,
        processing: documents?.filter((d: any) => d.status === 'processing').length || 0,
        failed: documents?.filter((d: any) => d.status === 'failed').length || 0,
      }
    }

    return NextResponse.json(metrics)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}