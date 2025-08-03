import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      })
    }
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Creating Supabase client...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('Testing simple query...')
    
    // Simple test query
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, created_at, cultural_sensitivity')
      .limit(3)
    
    console.log('Query result:', { data, error })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        supabaseUrl: supabaseUrl
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      documents: data?.length || 0,
      sample: data,
      supabaseUrl: supabaseUrl
    })
    
  } catch (error: any) {
    console.error('Connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}