import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { titles } = body
    
    if (!titles || !Array.isArray(titles)) {
      return NextResponse.json({ error: 'Array of titles required' }, { status: 400 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('NUKING DOCUMENTS:', titles)
    
    const results = []
    
    for (const title of titles) {
      try {
        console.log(`Attempting to delete: ${title}`)
        
        // First, find all documents with this title
        const { data: docs, error: findError } = await supabase
          .from('documents')
          .select('id, title')
          .eq('title', title)
        
        console.log(`Found ${docs?.length || 0} documents with title: ${title}`)
        
        if (docs && docs.length > 0) {
          // Delete each one by ID
          for (const doc of docs) {
            const { error: deleteError } = await supabase
              .from('documents')
              .delete()
              .eq('id', doc.id)
            
            if (deleteError) {
              console.error(`Failed to delete ${doc.id}:`, deleteError)
              results.push({ title, id: doc.id, success: false, error: deleteError.message })
            } else {
              console.log(`Successfully deleted ${doc.id}`)
              results.push({ title, id: doc.id, success: true })
            }
          }
        } else {
          results.push({ title, success: false, error: 'Not found' })
        }
        
      } catch (error: any) {
        console.error(`Error processing ${title}:`, error)
        results.push({ title, success: false, error: error.message })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${titles.length} delete requests`,
      results: results
    })
    
  } catch (error: any) {
    console.error('Nuke docs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}