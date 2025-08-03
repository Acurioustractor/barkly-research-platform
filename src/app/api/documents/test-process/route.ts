import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    console.log(`Testing processing for document: ${documentId}`);

    // Get document content
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    
    const document = await prisma.$queryRaw<Array<any>>`
      SELECT id, title, content, cultural_sensitivity, file_type
      FROM documents 
      WHERE id = ${documentId}::uuid
    `;

    if (!document || document.length === 0) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    const doc = document[0];
    const content = doc.content || '';

    if (!content || content.length < 50) {
      return NextResponse.json({
        error: 'Document has insufficient content for processing'
      }, { status: 400 });
    }

    // Process just a small sample for testing
    const sampleContent = content.substring(0, 2000);
    console.log(`Processing sample content (${sampleContent.length} chars)`);

    const systemPrompt = `You are an AI assistant analyzing community documents for the Barkly region in Australia. Extract key themes, quotes, and insights focusing on community services, youth programs, and Indigenous cultural protocols.

Extract in JSON format:
{
  "themes": [{"name": "theme", "description": "desc", "confidence": 0.8}],
  "quotes": [{"text": "quote", "cultural_sensitivity": "public", "attribution_needed": false}],
  "insights": [{"insight": "finding", "type": "service_gap", "confidence": 0.7}]
}`;

    const userPrompt = `Analyze this excerpt from "${doc.title}":

${sampleContent}

Focus on community services, youth programs, cultural protocols, and development initiatives.`;

    console.log('Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('OpenAI response received');

    const parsed = JSON.parse(response);

    // Save one theme to test database
    if (parsed.themes && parsed.themes.length > 0) {
      const theme = parsed.themes[0];
      if (prisma) {
        await prisma.$queryRaw`
          INSERT INTO document_themes (
            id, document_id, theme_name, description, confidence_score, 
            ai_model, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${documentId}::uuid,
            ${theme.name || 'Test Theme'},
            ${theme.description || 'Test description'},
            ${theme.confidence || 0.8},
            'gpt-4o-mini',
            NOW()
          )
        `;
      }
      console.log('Saved test theme to database');
    }

    // Update document status
    if (prisma) {
      await prisma.$queryRaw`
        UPDATE documents 
        SET 
          processing_status = 'completed',
          processed_at = NOW(),
          ai_analysis = ${JSON.stringify({
            test_run: true,
            themes_found: parsed.themes?.length || 0,
            quotes_found: parsed.quotes?.length || 0,
            insights_found: parsed.insights?.length || 0,
            sample_processed: sampleContent.length,
            total_content: content.length
          })}
        WHERE id = ${documentId}::uuid
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Test processing completed',
      documentId,
      sampleProcessed: sampleContent.length,
      totalContent: content.length,
      results: {
        themes: parsed.themes?.length || 0,
        quotes: parsed.quotes?.length || 0,
        insights: parsed.insights?.length || 0
      },
      parsed
    });

  } catch (error) {
    console.error('Test processing error:', error);
    
    // Mark document as failed
    if (request.body && prisma) {
      const { documentId } = await request.json();
      await prisma.$queryRaw`
        UPDATE documents 
        SET processing_status = 'failed'
        WHERE id = ${documentId}::uuid
      `;
    }

    return NextResponse.json({
      error: 'Test processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}