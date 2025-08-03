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
    
    // Get the document
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // For now, just mark it as processed since we can't re-extract from stored binary
    const updatedContent = `DOCX Document: ${doc.title} - Content available but not extracted in this version`
    
    const { error: updateError } = await supabase
      .from('documents')
      .update({ content: updatedContent })
      .eq('id', id)
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Document marked as processed',
      id: id,
      title: doc.title
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}