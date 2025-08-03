import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'ANTHROPIC_API_KEY not found in environment',
        hasKey: false
      }, { status: 500 });
    }

    // Try to import and initialize Anthropic
    let anthropicModule;
    try {
      anthropicModule = await import('@anthropic-ai/sdk');
    } catch (importError) {
      return NextResponse.json({
        error: 'Failed to import Anthropic SDK',
        details: importError instanceof Error ? importError.message : 'Import error',
        hasKey: true
      }, { status: 500 });
    }

    // Initialize client
    let anthropic;
    try {
      anthropic = new anthropicModule.Anthropic({
        apiKey: apiKey,
      });
    } catch (initError) {
      return NextResponse.json({
        error: 'Failed to initialize Anthropic client',
        details: initError instanceof Error ? initError.message : 'Init error',
        hasKey: true,
        sdkImported: true
      }, { status: 500 });
    }

    // Test basic API call
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Respond with exactly: 'Anthropic client working!'"
          }
        ]
      });

      const responseText = message.content[0]?.type === 'text' ? message.content[0].text : 'No text response';

      return NextResponse.json({
        success: true,
        hasKey: true,
        sdkImported: true,
        clientInitialized: true,
        apiResponse: responseText,
        model: "claude-3-haiku-20240307",
        keyPrefix: apiKey.substring(0, 10) + "..."
      });

    } catch (apiError) {
      return NextResponse.json({
        error: 'API call failed',
        details: apiError instanceof Error ? apiError.message : 'API error',
        hasKey: true,
        sdkImported: true,
        clientInitialized: true
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}