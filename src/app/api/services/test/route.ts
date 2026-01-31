import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to simulate document-derived services
export async function GET(request: NextRequest) {
  try {
    // Simulate document insights that would come from processed documents
    const mockDocumentInsights = [
      {
        id: 'insight-1',
        insight: 'The community urgently needs a Youth Mental Health Support Centre to address rising mental health concerns among young people.',
        type: 'service-gap',
        confidence: 0.92,
        document: {
          id: 'doc-1',
          originalName: 'Community Health Needs Assessment 2024.pdf',
          uploadedAt: new Date('2024-03-15')
        }
      },
      {
        id: 'insight-2',
        insight: 'Cultural Learning Program has been highly successful, with 89% of participants reporting improved cultural connection.',
        type: 'service-success',
        confidence: 0.87,
        document: {
          id: 'doc-2',
          originalName: 'Cultural Programs Evaluation 2024.pdf',
          uploadedAt: new Date('2024-02-20')
        }
      },
      {
        id: 'insight-3',
        insight: 'Community members identified a critical gap in after-hours childcare services for working parents.',
        type: 'service-gap',
        confidence: 0.84,
        document: {
          id: 'doc-3',
          originalName: 'Parent Support Survey Results 2024.pdf',
          uploadedAt: new Date('2024-01-10')
        }
      },
      {
        id: 'insight-4',
        insight: 'The Mobile Health Service has reached 156 community members in remote areas, exceeding targets.',
        type: 'service-available',
        confidence: 0.91,
        document: {
          id: 'doc-4',
          originalName: 'Mobile Health Service Report Q1 2024.pdf',
          uploadedAt: new Date('2024-04-01')
        }
      }
    ];

    const mockQuotes = [
      {
        id: 'quote-1',
        text: 'We need support for our young people who are struggling with mental health. The nearest service is hours away.',
        speaker: 'Community Elder Mary',
        context: 'Community consultation meeting',
        confidence: 0.95,
        document: {
          id: 'doc-1',
          originalName: 'Community Health Needs Assessment 2024.pdf'
        }
      },
      {
        id: 'quote-2',
        text: 'The cultural program has helped our kids understand who they are and where they come from. It\'s been amazing.',
        speaker: 'Parent participant',
        context: 'Program evaluation interview',
        confidence: 0.88,
        document: {
          id: 'doc-2',
          originalName: 'Cultural Programs Evaluation 2024.pdf'
        }
      }
    ];

    // Transform mock data using the same logic as the real API
    const documentServices = transformMockInsightsToServices(mockDocumentInsights, mockQuotes);
    const documentGaps = extractMockServiceGaps(mockDocumentInsights, mockQuotes);

    // Baseline services
    const baselineServices = [
      {
        id: 'tc-hospital',
        name: 'Tennant Creek Hospital',
        type: 'available',
        category: 'healthcare',
        coordinates: [-19.6500, 134.1850],
        description: 'Main hospital providing emergency and general medical services',
        sourceType: 'baseline'
      }
    ];

    const allServices = [...baselineServices, ...documentServices];
    const allGaps = [...documentGaps];

    return NextResponse.json({
      success: true,
      message: 'Test data showing document integration',
      location: {
        name: "Tennant Creek",
        coordinates: [-19.6544, 134.1870],
        population: 3500,
        lastUpdated: new Date().toISOString()
      },
      services: allServices,
      gaps: allGaps,
      analysis: {
        totalServices: allServices.length,
        criticalGaps: allGaps.length,
        documentDerived: documentServices.length,
        coverageScore: Math.round((allServices.length / (allServices.length + allGaps.length)) * 100),
        priorityAreas: ['Youth Mental Health', 'Childcare', 'Cultural Programs'],
        lastAnalysis: new Date().toISOString(),
        dataSource: 'Simulated Document Intelligence + Real Community Voices'
      },
      documentEvidence: {
        totalInsights: mockDocumentInsights.length,
        totalQuotes: mockQuotes.length,
        documentsProcessed: 4,
        avgConfidence: 0.89
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Transform mock insights into services
function transformMockInsightsToServices(insights: any[], quotes: any[]) {
  const services = [];

  for (const insight of insights) {
    if (insight.type === 'service-available' || insight.type === 'service-success') {
      const service = {
        id: `doc-service-${insight.id}`,
        name: extractServiceName(insight.insight) || 'Community Program',
        type: 'available',
        category: categorizeInsight(insight.insight),
        coordinates: generateTennantCreekCoordinates(),
        description: insight.insight,
        status: 'Documented in Community Research',
        confidence: Math.round(insight.confidence * 100),
        lastUpdated: insight.document.uploadedAt,
        documentSource: insight.document.originalName,
        sourceType: 'document-derived',
        documentId: insight.document.id,
        supportingQuotes: quotes.filter((q: any) => q.document.id === insight.document.id)
      };

      services.push(service);
    }
  }

  return services;
}

// Extract service gaps from mock insights
function extractMockServiceGaps(insights: any[], quotes: any[]) {
  const gaps = [];

  for (const insight of insights) {
    if (insight.type === 'service-gap') {
      const gap = {
        id: `doc-gap-${insight.id}`,
        name: extractServiceName(insight.insight) || 'Community Need',
        type: 'gap',
        category: categorizeInsight(insight.insight),
        coordinates: generateTennantCreekCoordinates(),
        description: insight.insight,
        priority: Math.round(insight.confidence * 100),
        status: 'Identified in Community Research',
        lastUpdated: insight.document.uploadedAt,
        documentSource: insight.document.originalName,
        sourceType: 'document-derived',
        documentId: insight.document.id,
        supportingQuotes: quotes.filter((q: any) => q.document.id === insight.document.id)
      };

      gaps.push(gap);
    }
  }

  return gaps;
}

// Helper functions (copied from main route)
function extractServiceName(text: string): string | null {
  const patterns = [
    /([A-Z][a-z]+\\s+(?:Centre|Center|Service|Program|Hub|Support))/,
    /(Youth\\s+[A-Z][a-z]+)/,
    /(Mental\\s+Health\\s+[A-Z][a-z]+)/,
    /(Cultural\\s+[A-Z][a-z]+)/,
    /(Mobile\\s+Health\\s+Service)/i,
    /(Childcare\\s+Service)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function categorizeInsight(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('youth') || lower.includes('young')) return 'youth';
  if (lower.includes('health') || lower.includes('medical')) return 'healthcare';
  if (lower.includes('cultural') || lower.includes('traditional')) return 'cultural';
  if (lower.includes('childcare') || lower.includes('child')) return 'childcare';
  if (lower.includes('education') || lower.includes('learning')) return 'education';

  return 'community';
}

function generateTennantCreekCoordinates(): [number, number] {
  const baseLat = -19.6544;
  const baseLng = 134.1870;
  const radius = 0.01;

  const lat = baseLat + (Math.random() - 0.5) * radius;
  const lng = baseLng + (Math.random() - 0.5) * radius;

  return [lat, lng];
}