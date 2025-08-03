import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // First check if document exists
    const { data: existing, error: fetchError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('id', id)
    
    if (fetchError || !existing || existing.length === 0) {
      return NextResponse.json({ error: `Document not found: ${fetchError?.message || 'No document with that ID'}` }, { status: 404 })
    }
    
    const documentTitle = existing[0]?.title || 'Unknown'
    
    // Delete the document
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully',
      id: id,
      title: documentTitle
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}