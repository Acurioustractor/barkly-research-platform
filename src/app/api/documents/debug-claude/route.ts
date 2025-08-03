import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { prisma } from '@/lib/database-safe';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    // Get document content
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
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
    const title = doc.title || '';

    // Test with just a small sample
    const sample = content.substring(0, 2000);

    console.log(`Testing Claude with sample content (${sample.length} chars)`);

    const systemPrompt = `You are analyzing community documents for the Barkly region. Extract themes, quotes, and insights in JSON format:

{
  "themes": [{"name": "theme name", "description": "description", "confidence": 0.8}],
  "quotes": [{"text": "quote text", "cultural_sensitivity": "public"}],
  "insights": [{"insight": "finding", "type": "service_gap", "confidence": 0.7}]
}

Return only valid JSON.`;

    const userPrompt = `Analyze this excerpt from "${title}":

${sample}`;

    console.log('Calling Claude API...');
    console.log('System prompt:', systemPrompt.substring(0, 200) + '...');
    console.log('User prompt:', userPrompt.substring(0, 300) + '...');

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    
    console.log('Claude raw response:', responseText);

    let parsed = null;
    let parseError = null;

    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      parseError = error instanceof Error ? error.message : 'Parse error';
    }

    return NextResponse.json({
      success: true,
      documentId,
      sampleLength: sample.length,
      totalLength: content.length,
      claudeResponse: {
        raw: responseText,
        parsed,
        parseError
      },
      metadata: {
        model: "claude-3-haiku-20240307",
        maxTokens: 1500,
        temperature: 0.1
      }
    });

  } catch (error) {
    console.error('Debug Claude error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}