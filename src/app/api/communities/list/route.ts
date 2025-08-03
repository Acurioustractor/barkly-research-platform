import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Get all communities with document counts
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        id,
        name,
        description,
        created_at,
        documents (count)
      `)
      .order('name', { ascending: true })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Transform the data to include document counts
    const communitiesWithCounts = communities?.map(community => ({
      ...community,
      document_count: community.documents?.[0]?.count || 0
    })) || []
    
    return NextResponse.json({
      success: true,
      communities: communitiesWithCounts
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}