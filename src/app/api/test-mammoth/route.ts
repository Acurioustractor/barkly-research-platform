import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('Testing mammoth with file:', file.name, file.type, file.size)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      console.log('ArrayBuffer size:', arrayBuffer.byteLength)
      
      const uint8Array = new Uint8Array(arrayBuffer)
      console.log('Uint8Array size:', uint8Array.length)
      
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      console.log('Mammoth result:', result)
      
      return NextResponse.json({
        success: true,
        textLength: result.value?.length || 0,
        preview: result.value?.substring(0, 500) || 'No text extracted',
        messages: result.messages || [],
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      })
      
    } catch (mammothError) {
      console.error('Mammoth error:', mammothError)
      return NextResponse.json({
        success: false,
        error: mammothError.message,
        stack: mammothError.stack
      })
    }
    
  } catch (error: any) {
    console.error('General error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}