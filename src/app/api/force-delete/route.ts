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

    console.log('Attempting to delete document with ID:', id)

    // Force delete with raw SQL if needed
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .select()

    console.log('Delete result:', { data, error })

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verify it's actually gone
    const { data: checkData, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)

    console.log('Verification check:', { checkData, checkError })

    return NextResponse.json({
      success: true,
      message: `Deleted ${data?.length || 0} document(s)`,
      deleted: data,
      stillExists: (checkData?.length || 0) > 0
    })

  } catch (error: any) {
    console.error('Force delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}