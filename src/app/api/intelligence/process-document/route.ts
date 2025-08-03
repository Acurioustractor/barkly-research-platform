import { NextRequest, NextResponse } from 'next/server';
import { processDocumentWithIntelligence } from '@/lib/ai-service';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { documentId, documentContent, documentTitle, communityContext } = await request.json();

    if (!documentContent) {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    // Process the document with community intelligence
    const analysis = await processDocumentWithIntelligence(
      documentContent,
      documentTitle,
      communityContext
    );

    // If documentId is provided, save the analysis to the database
    if (documentId) {
      try {
        // Update the document with analysis results
        await prisma.document.update({
          where: { id: documentId },
          data: {
            ai_analysis: {
              basic: analysis.basicAnalysis,
              intelligence: analysis.communityIntelligence,
              summary: analysis.summary,
              processed_at: new Date().toISOString(),
              version: '1.0'
            },
            processing_status: 'analyzed'
          }
        });

        // Store intelligence insights as separate records for querying
        const insights = [
          ...analysis.communityIntelligence.communityNeeds.map(need => ({
            document_id: documentId,
            type: 'community_need' as const,
            title: need.need,
            description: need.need,
            urgency: need.urgency,
            confidence: need.confidence,
            evidence: need.evidence,
            metadata: {
              category: need.category,
              community: need.community
            }
          })),
          ...analysis.communityIntelligence.serviceGaps.map(gap => ({
            document_id: documentId,
            type: 'service_gap' as const,
            title: gap.service,
            description: `${gap.service} gap in ${gap.location}`,
            urgency: gap.urgency,
            confidence: 0.8, // Default confidence for service gaps
            evidence: gap.evidence,
            metadata: {
              location: gap.location,
              impact: gap.impact,
              recommendations: gap.recommendations
            }
          })),
          ...analysis.communityIntelligence.opportunities.map(opp => ({
            document_id: documentId,
            type: 'opportunity' as const,
            title: opp.opportunity,
            description: opp.opportunity,
            urgency: 'medium' as const, // Default urgency for opportunities
            confidence: opp.potential / 10, // Convert 1-10 scale to 0-1
            evidence: opp.evidence,
            metadata: {
              potential: opp.potential,
              requirements: opp.requirements,
              timeline: opp.timeline,
              communities: opp.communities
            }
          }))
        ];

        // Store insights in the database (assuming we have an insights table)
        if (insights.length > 0) {
          try {
            // Note: This assumes an insights table exists - we'll create it if needed
            await prisma.$executeRaw`
              INSERT INTO intelligence_insights (document_id, type, title, description, urgency, confidence, evidence, metadata, created_at)
              VALUES ${insights.map(insight => 
                `(${insight.document_id}, '${insight.type}', '${insight.title}', '${insight.description}', '${insight.urgency}', ${insight.confidence}, '${JSON.stringify(insight.evidence)}', '${JSON.stringify(insight.metadata)}', NOW())`
              ).join(', ')}
              ON CONFLICT (document_id, type, title) DO UPDATE SET
                description = EXCLUDED.description,
                urgency = EXCLUDED.urgency,
                confidence = EXCLUDED.confidence,
                evidence = EXCLUDED.evidence,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
            `;
          } catch (dbError) {
            console.warn('Could not store insights in database (table may not exist yet):', dbError);
            // Continue without failing - insights are still returned in response
          }
        }

      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Continue and return analysis even if DB update fails
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        basic: analysis.basicAnalysis,
        intelligence: analysis.communityIntelligence,
        summary: analysis.summary
      },
      insights_count: {
        community_needs: analysis.communityIntelligence.communityNeeds.length,
        service_gaps: analysis.communityIntelligence.serviceGaps.length,
        success_patterns: analysis.communityIntelligence.successPatterns.length,
        opportunities: analysis.communityIntelligence.opportunities.length,
        risk_factors: analysis.communityIntelligence.riskFactors.length,
        assets: analysis.communityIntelligence.assets.length
      }
    });

  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process document with community intelligence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Document Processing API',
    endpoints: {
      POST: '/api/intelligence/process-document',
      description: 'Process documents with comprehensive community intelligence analysis'
    },
    features: [
      'Basic document analysis (themes, quotes, insights)',
      'Community intelligence (needs, gaps, opportunities)',
      'Success pattern recognition',
      'Risk factor identification',
      'Community asset mapping',
      'Database integration for insights storage'
    ]
  });
}