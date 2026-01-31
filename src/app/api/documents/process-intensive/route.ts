import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { prisma } from '@/lib/database-safe';
import { OptimizedChunkingService } from '@/lib/ai/processing/optimized-chunking-service';
import { extractTextFromPDFImproved } from '@/utils/pdf-extractor-improved';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  let documentId: string | null = null;

  try {
    const body = await request.json();
    documentId = body.documentId;

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get document content
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
    let content = doc.content || '';

    console.log(`Intensive processing of: ${doc.title} (${content.length} chars, type: ${doc.file_type})`);

    // For now, just use existing content since file_data column doesn't exist yet

    console.log(`Final content length: ${content.length} chars`);

    // Mark as processing
    await prisma.$queryRaw`
      UPDATE documents 
      SET processing_status = 'processing'
      WHERE id = ${documentId}::uuid
    `;

    // Improved prompt for reliable JSON extraction
    const systemPrompt = `You are a specialized service extraction AI. Your job is to analyze government documents and return ONLY valid JSON.

CRITICAL: You MUST return valid JSON format. No explanatory text, no markdown, no additional commentary.

Extract specific services, programs, and initiatives. Use this EXACT JSON structure:

{
  "services": [
    {
      "name": "Service Name",
      "description": "Brief description with details",
      "category": "youth",
      "funding": "amount or null", 
      "responsible_org": "organization or null",
      "status": "operating",
      "cultural_significance": "public",
      "confidence": 0.9
    }
  ],
  "themes": [
    {
      "name": "Theme Name",
      "description": "Theme description", 
      "confidence": 0.8,
      "cultural_significance": "public"
    }
  ],
  "quotes": [
    {
      "text": "Exact quote text",
      "speaker": null,
      "cultural_sensitivity": "public",
      "requires_attribution": false
    }
  ],
  "insights": [
    {
      "insight": "Specific insight about services or gaps",
      "type": "service_gap", 
      "confidence": 0.7,
      "evidence": ["supporting text"]
    }
  ]
}

CRITICAL RULES:
1. Return ONLY the JSON object
2. No text before or after the JSON
3. Use exactly the field names shown above
4. If no items found for a category, use empty array []
5. All strings must be properly quoted
6. Confidence values between 0.0 and 1.0

Categories: youth, education, health, economic, housing, justice, infrastructure, cultural, community
Types: service_gap, community_need, success_story, barrier, opportunity
Status: completed, operating, planned, in_progress
Cultural significance: public, restricted, sacred, confidential`;

    // For very large documents (>500KB), use simple chunking to avoid memory issues
    let chunks;
    if (content.length > 500000) {
      console.log('Large document detected, using memory-efficient chunking...');

      // Simple overlap chunking for large documents
      const chunkSize = 4000;
      const overlap = 200;
      chunks = [];

      for (let i = 0; i < content.length; i += chunkSize - overlap) {
        const chunkText = content.slice(i, i + chunkSize);
        const wordCount = chunkText.split(/\s+/).length;

        chunks.push({
          text: chunkText,
          startChar: i,
          endChar: i + chunkText.length,
          wordCount: wordCount,
          index: chunks.length
        });

        // Limit chunks for very large documents to prevent timeout
        if (chunks.length >= 100) {
          console.log(`Limited to ${chunks.length} chunks to prevent timeout`);
          break;
        }
      }

      console.log(`Created ${chunks.length} simple chunks for large document (${content.length} chars)`);

    } else {
      // Use optimized chunking for smaller documents
      const chunkingService = new OptimizedChunkingService();

      let documentType: 'academic' | 'conversational' | 'technical' | 'general' = 'general';
      if (doc.title.toLowerCase().includes('deal') || doc.title.toLowerCase().includes('agreement')) {
        documentType = 'academic';
      }

      console.log('Using optimized chunking for comprehensive extraction...');

      const chunkingResult = await chunkingService.chunkDocument(content, {
        processingType: 'deep', // Use deep instead of world-class to avoid memory issues
        documentType: documentType,
        enableCaching: false, // Disable caching to save memory
        maxChunkSize: 1500,
        targetEmbeddingSize: 400
      });

      chunks = chunkingResult.chunks;
      console.log(`Created ${chunks.length} optimized chunks using ${chunkingResult.metadata.strategy} strategy`);
    }

    // Process each chunk with Claude API
    const allResults = [];
    let totalExtracted = 0;

    console.log('Processing chunks with Claude API...');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const userPrompt = `Extract services from this Barkly Regional Deal section. Return ONLY valid JSON:

SECTION (Chunk ${i + 1}/${chunks.length}):
${chunk.text.slice(0, 3000)}${chunk.text.length > 3000 ? '...' : ''}

Focus on services, programs, initiatives, facilities. Return JSON only.`;

      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.wordCount} words)`);

        const result = await processChunkWithRetry(chunk.text, systemPrompt, userPrompt, anthropic, i + 1);

        if (result) {
          allResults.push(result);
          const chunkExtracted = (result.services?.length || 0) + (result.themes?.length || 0);
          totalExtracted += chunkExtracted;
          console.log(`Chunk ${i + 1} extracted: ${chunkExtracted} items`);
        }

        // Rate limiting between requests
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }

    console.log(`Total items extracted from all chunks: ${totalExtracted}`);

    // Merge and deduplicate results
    const parsed = mergeChunkResults(allResults);

    console.log(`Merged results: ${parsed.services?.length || 0} services, ${parsed.themes?.length || 0} themes`);

    // Save services as themes for now (we can create a services table later)
    let savedCount = 0;

    // Save services as individual themes with chunk tracking
    if (parsed.services) {
      for (const service of parsed.services) {
        // Enhanced description with source tracking
        const enhancedDescription = `${service.description || service.name || 'Service description'} [Source: chunks 1-${chunks.length}, AI: claude-3-haiku-intensive, Confidence: ${service.confidence || 0.8}]`;

        await prisma.$queryRaw`
          INSERT INTO document_themes (
            id, document_id, theme_name, description, confidence_score, 
            cultural_significance, ai_model, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${documentId}::uuid,
            ${service.name || 'Unnamed Service'},
            ${enhancedDescription},
            ${Math.min(Math.max(service.confidence || 0.8, 0), 1)},
            ${service.cultural_significance || 'public'},
            'claude-3-haiku-intensive-chunked',
            NOW()
          )
        `;
        savedCount++;
      }
    }

    // Save themes
    if (parsed.themes) {
      for (const theme of parsed.themes) {
        await prisma.$queryRaw`
          INSERT INTO document_themes (
            id, document_id, theme_name, description, confidence_score, 
            cultural_significance, ai_model, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${documentId}::uuid,
            ${theme.name || 'Unnamed Theme'},
            ${theme.description || ''},
            ${Math.min(Math.max(theme.confidence || 0.8, 0), 1)},
            ${theme.cultural_significance || 'public'},
            'claude-3-haiku-intensive',
            NOW()
          )
        `;
        savedCount++;
      }
    }

    // Save quotes
    let quotesCount = 0;
    if (parsed.quotes) {
      for (const quote of parsed.quotes) {
        await prisma.$queryRaw`
          INSERT INTO document_quotes (
            id, document_id, quote_text, knowledge_holder, cultural_sensitivity,
            requires_attribution, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${quote.text || ''},
            ${quote.speaker},
            ${quote.cultural_sensitivity || 'public'},
            ${quote.requires_attribution || false},
            NOW()
          )
        `;
        quotesCount++;
      }
    }

    // Save insights
    let insightsCount = 0;
    if (parsed.insights) {
      for (const insight of parsed.insights) {
        const evidenceJson = JSON.stringify(insight.evidence || []);
        await prisma.$queryRaw`
          INSERT INTO document_insights (
            id, document_id, insight, type, confidence, evidence, created_at
          ) VALUES (
            gen_random_uuid(),
            ${documentId}::uuid,
            ${insight.insight || ''},
            ${insight.type || 'community_need'},
            ${Math.min(Math.max(insight.confidence || 0.7, 0), 1)},
            ${evidenceJson}::jsonb,
            NOW()
          )
        `;
        insightsCount++;
      }
    }

    // Update document processing status
    const analysisJson = JSON.stringify({
      services_found: parsed.services?.length || 0,
      themes_found: parsed.themes?.length || 0,
      quotes_found: quotesCount,
      insights_found: insightsCount,
      total_saved: savedCount,
      processed_at: new Date().toISOString(),
      ai_model: 'claude-3-haiku-intensive'
    });

    await prisma.$queryRaw`
      UPDATE documents 
      SET 
        processing_status = 'completed',
        processed_at = NOW(),
        ai_analysis = ${analysisJson}::jsonb
      WHERE id = ${documentId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: 'Intensive document processing completed',
      documentId,
      extracted: {
        services: parsed.services?.length || 0,
        themes: parsed.themes?.length || 0,
        quotes: quotesCount,
        insights: insightsCount,
        totalSaved: savedCount
      },
      sample: {
        services: parsed.services?.slice(0, 5) || [],
        themes: parsed.themes?.slice(0, 3) || [],
        quotes: parsed.quotes?.slice(0, 2) || []
      }
    });

  } catch (error) {
    console.error('Intensive processing error:', error);

    // Mark as failed
    // Mark as failed
    if (prisma && documentId) {
      await prisma.$queryRaw`
        UPDATE documents 
        SET processing_status = 'failed'
        WHERE id = ${documentId}::uuid
      `;
    }

    return NextResponse.json({
      error: 'Intensive processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Merge and deduplicate results from multiple chunks
 */
function mergeChunkResults(results: any[]): any {
  const merged = {
    services: [] as any[],
    themes: [] as any[],
    quotes: [] as any[],
    insights: [] as any[]
  };

  // Combine all results
  for (const result of results) {
    if (result.services) merged.services.push(...result.services);
    if (result.themes) merged.themes.push(...result.themes);
    if (result.quotes) merged.quotes.push(...result.quotes);
    if (result.insights) merged.insights.push(...result.insights);
  }

  // Deduplicate by name/text similarity
  merged.services = deduplicateByName(merged.services);
  merged.themes = deduplicateByName(merged.themes);
  merged.quotes = deduplicateByText(merged.quotes);
  merged.insights = deduplicateByText(merged.insights, 'insight');

  console.log(`After deduplication: ${merged.services.length} services, ${merged.themes.length} themes, ${merged.quotes.length} quotes, ${merged.insights.length} insights`);

  return merged;
}

function deduplicateByName(items: any[]): any[] {
  const unique = [];
  const seen = new Set();

  for (const item of items) {
    const name = (item.name || '').toLowerCase().trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      unique.push(item);
    }
  }

  return unique;
}

function deduplicateByText(items: any[], textField: string = 'text'): any[] {
  const unique = [];
  const seen = new Set();

  for (const item of items) {
    const text = (item[textField] || '').toLowerCase().trim();
    if (text && text.length > 10 && !seen.has(text)) {
      seen.add(text);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Process chunk with retry logic and JSON validation
 */
async function processChunkWithRetry(
  chunkText: string,
  systemPrompt: string,
  userPrompt: string,
  anthropic: any,
  chunkNumber: number,
  maxRetries: number = 3
): Promise<any | null> {

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Chunk ${chunkNumber}, attempt ${attempt}/${maxRetries}`);

      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 3000,
        temperature: 0.0, // Zero temperature for consistent JSON
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      });

      const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';

      if (!responseText) {
        console.log(`Chunk ${chunkNumber}, attempt ${attempt}: Empty response`);
        continue;
      }

      // Clean response text - remove markdown formatting if present
      let cleanedResponse = responseText.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON object in response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      // Validate and parse JSON
      try {
        const parsed = JSON.parse(cleanedResponse);

        // Validate structure
        if (typeof parsed === 'object' && parsed !== null) {
          // Ensure required arrays exist
          if (!parsed.services) parsed.services = [];
          if (!parsed.themes) parsed.themes = [];
          if (!parsed.quotes) parsed.quotes = [];
          if (!parsed.insights) parsed.insights = [];

          console.log(`Chunk ${chunkNumber}: SUCCESS - ${parsed.services.length} services, ${parsed.themes.length} themes`);
          return parsed;
        }
      } catch (parseError) {
        console.log(`Chunk ${chunkNumber}, attempt ${attempt}: JSON parse failed - ${parseError instanceof Error ? parseError.message.slice(0, 100) : 'Unknown error'}`);
        console.log(`Response preview: ${cleanedResponse.slice(0, 200)}...`);
      }

      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.log(`Chunk ${chunkNumber}, attempt ${attempt}: API error - ${error instanceof Error ? error.message : 'Unknown error'}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log(`Chunk ${chunkNumber}: FAILED after ${maxRetries} attempts`);
  return null;
}