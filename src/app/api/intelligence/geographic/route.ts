import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  try {
    const { documentId, focusArea = 'tennant-creek' } = await request.json()

    // Get document content
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, content, community_id, communities(name)')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Enhanced AI analysis for geographic intelligence
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyze this document for geographic and service intelligence focused on ${focusArea} youth services.

Document: ${document.content}

Extract and provide:

1. GEOGRAPHIC REFERENCES
   - Specific locations mentioned (streets, areas, districts)
   - Service locations and addresses
   - Areas where youth gather or live
   - Transport routes and accessibility

2. SERVICE MAPPING
   - Youth services mentioned (name, type, location)
   - Service gaps identified
   - Service effectiveness indicators
   - Operating hours and accessibility

3. YOUTH NEEDS BY AREA
   - Specific needs mentioned for different areas
   - Geographic concentration of issues
   - Areas with high youth population
   - Areas lacking services

4. COMMUNITY ASSETS BY LOCATION
   - Existing strengths in different areas
   - Successful programs and their locations
   - Community resources and facilities
   - Cultural and recreational spaces

5. OPPORTUNITIES AND RECOMMENDATIONS
   - Areas ready for new services
   - Underutilized spaces or resources
   - Service expansion opportunities
   - Geographic priorities for investment

6. INTELLIGENCE INSIGHTS
   - Patterns across different areas
   - Service coordination opportunities
   - Transport and accessibility barriers
   - Community connection strengths/weaknesses

Format as JSON with clear geographic categorization and actionable intelligence.`
      }]
    })

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }
    const analysisText = content.text;

    // Try to parse as JSON, fallback to structured extraction
    let intelligence
    try {
      intelligence = JSON.parse(analysisText)
    } catch {
      // Extract structured intelligence from text
      intelligence = {
        geographic_references: extractSection(analysisText, 'GEOGRAPHIC REFERENCES'),
        service_mapping: extractSection(analysisText, 'SERVICE MAPPING'),
        youth_needs_by_area: extractSection(analysisText, 'YOUTH NEEDS BY AREA'),
        community_assets: extractSection(analysisText, 'COMMUNITY ASSETS BY LOCATION'),
        opportunities: extractSection(analysisText, 'OPPORTUNITIES AND RECOMMENDATIONS'),
        insights: extractSection(analysisText, 'INTELLIGENCE INSIGHTS'),
        raw_analysis: analysisText
      }
    }

    // Store the geographic intelligence
    const { data: storedIntelligence, error: storeError } = await supabase
      .from('document_themes')
      .insert({
        document_id: documentId,
        theme_name: 'Geographic Intelligence',
        description: `AI-extracted geographic and service intelligence for ${focusArea}`,
        confidence_score: 0.85,
        ai_model: 'claude-3-haiku-20240307',
        cultural_significance: 'community'
      })
      .select()
      .single()

    if (storeError) {
      console.error('Error storing intelligence:', storeError)
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        community: document.community_id || 'Unknown'
      },
      intelligence,
      focus_area: focusArea,
      analysis_date: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Geographic intelligence error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze geographic intelligence', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to extract sections from text
function extractSection(text: string, sectionName: string): string[] {
  const lines = text.split('\n')
  const sectionStart = lines.findIndex(line => 
    line.toUpperCase().includes(sectionName.toUpperCase())
  )
  
  if (sectionStart === -1) return []
  
  const sectionLines = []
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.match(/^\d+\./)) break // Next numbered section
    if (line.startsWith('- ') || line.startsWith('• ')) {
      sectionLines.push(line.substring(2))
    } else if (line.length > 0 && !line.match(/^[A-Z\s]+$/)) {
      sectionLines.push(line)
    }
  }
  
  return sectionLines.filter(line => line.length > 0)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const focusArea = url.searchParams.get('focusArea') || 'tennant-creek'
    
    // Get all documents with geographic intelligence
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        community_id,
        communities(name),
        document_themes!inner(
          theme_name,
          description,
          confidence_score
        )
      `)
      .eq('document_themes.theme_name', 'Geographic Intelligence')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      focus_area: focusArea,
      documents_with_intelligence: documents?.length || 0,
      documents: documents || []
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch geographic intelligence', details: error.message },
      { status: 500 }
    )
  }
}