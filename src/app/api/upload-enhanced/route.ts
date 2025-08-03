import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const community_id = formData.get('community_id') as string
    const cultural_sensitivity = formData.get('cultural_sensitivity') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content safely based on file type
    let content = ''
    try {
      if (file.type === 'application/pdf') {
        // For PDFs, store metadata instead of trying to read content as text
        content = `PDF Document: ${file.name} (${file.size} bytes)`
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.toLowerCase().endsWith('.docx')) {
        // Handle DOCX files
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const result = await mammoth.extractRawText({ buffer: buffer })
          content = result.value || ''
          console.log('DOCX text extracted:', content.length, 'characters')
          if (content.length === 0) {
            content = `DOCX Document: ${file.name} (${file.size} bytes) - No text content found`
          }
        } catch (docxError) {
          console.error('DOCX processing error:', docxError)
          content = `DOCX Document: ${file.name} (${file.size} bytes) - Text extraction failed: ${docxError.message}`
        }
      } else if (file.type === 'application/msword' || file.name.toLowerCase().endsWith('.doc')) {
        // Handle older DOC files - mammoth can handle these too
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const result = await mammoth.extractRawText({ buffer: buffer })
          content = result.value || ''
          console.log('DOC text extracted:', content.length, 'characters')
          if (content.length === 0) {
            content = `DOC Document: ${file.name} (${file.size} bytes) - No text content found`
          }
        } catch (docError) {
          console.error('DOC processing error:', docError)
          content = `DOC Document: ${file.name} (${file.size} bytes) - Text extraction failed: ${docError.message}`
        }
      } else {
        // Handle text files, markdown, etc.
        content = await file.text()
      }
    } catch (error) {
      console.error('Error processing file:', error)
      // Fallback for files that can't be processed
      content = `Binary file: ${file.name} (${file.size} bytes) - Processing failed: ${error.message}`
    }
    
    // Save to database with enhanced metadata
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const documentData: any = {
      title: file.name,
      content: content,
      cultural_sensitivity: cultural_sensitivity || 'public'
    }
    
    // Add community if selected
    if (community_id && community_id !== '') {
      documentData.community_id = community_id
    }
    
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Simple success - no complex analysis for now
    console.log('Document uploaded successfully:', data?.[0]?.id)
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      document: data?.[0]
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}