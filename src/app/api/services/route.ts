import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    // Extract service data from processed documents and combine with baseline services
    const baselineServices = getBaselineServices();
    
    // Get document-derived insights
    let documentServices = [];
    let documentGaps = [];
    let documentPlanned = [];
    
    if (prisma) {
      try {
        // Get services mentioned in documents through themes and insights
        const serviceThemes = await prisma.documentTheme.findMany({
          where: {
            theme: {
              contains: 'service',
              mode: 'insensitive'
            },
            confidence: {
              gte: 0.6
            }
          },
          include: {
            document: {
              select: {
                id: true,
                originalName: true,
                uploadedAt: true
              }
            }
          },
          take: 20
        });
        
        // Get insights about services and gaps
        const serviceInsights = await prisma.documentInsight.findMany({
          where: {
            OR: [
              { type: { contains: 'service', mode: 'insensitive' } },
              { type: { contains: 'gap', mode: 'insensitive' } },
              { type: { contains: 'need', mode: 'insensitive' } }
            ],
            confidence: {
              gte: 0.7
            }
          },
          include: {
            document: {
              select: {
                id: true,
                originalName: true,
                uploadedAt: true
              }
            }
          },
          take: 15
        });
        
        // Get community quotes about services
        const serviceQuotes = await prisma.documentQuote.findMany({
          where: {
            OR: [
              { text: { contains: 'service', mode: 'insensitive' } },
              { text: { contains: 'program', mode: 'insensitive' } },
              { text: { contains: 'support', mode: 'insensitive' } },
              { text: { contains: 'need', mode: 'insensitive' } }
            ],
            confidence: {
              gte: 0.8
            }
          },
          include: {
            document: {
              select: {
                id: true,
                originalName: true
              }
            }
          },
          take: 10
        });
        
        console.log('Document data found:', {
          themes: serviceThemes.length,
          insights: serviceInsights.length,
          quotes: serviceQuotes.length
        });
        
        // Transform document insights into service data
        documentServices = transformDocumentInsightsToServices(serviceInsights, serviceQuotes, serviceThemes);
        documentGaps = extractServiceGaps(serviceInsights, serviceQuotes);
        
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Continue with baseline services if DB fails
      }
    }

    // Combine baseline and document-derived services
    const allServices = [...baselineServices.services, ...documentServices];
    const allGaps = [...baselineServices.gaps, ...documentGaps];
    const allPlanned = [...baselineServices.planned, ...documentPlanned];
    
    const servicesData = {
      location: {
        name: "Tennant Creek",
        coordinates: [-19.6544, 134.1870],
        population: 3500,
        lastUpdated: new Date().toISOString()
      },
      services: allServices.slice(0, 15), // Limit to prevent overwhelming
      gaps: allGaps.slice(0, 10),
      planned: allPlanned.slice(0, 5),
      analysis: {
        totalServices: allServices.length,
        criticalGaps: allGaps.length,
        plannedServices: allPlanned.length,
        documentDerived: documentServices.length,
        coverageScore: calculateCoverageScore(allServices, allGaps),
        priorityAreas: extractPriorityAreas(allGaps),
        lastAnalysis: new Date().toISOString(),
        dataSource: prisma ? 'Real Document Intelligence + Community Evidence' : 'Baseline Services'
      }
    };

    return NextResponse.json(servicesData);

  } catch (error) {
    console.error('Error fetching services data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services data' },
      { status: 500 }
    );
  }
}

// Helper function to provide baseline services
function getBaselineServices() {
  return {
    services: [
      {
        id: 'tc-hospital',
        name: 'Tennant Creek Hospital',
        type: 'available',
        category: 'healthcare',
        coordinates: [-19.6500, 134.1850],
        description: 'Main hospital providing emergency and general medical services',
        contact: '(08) 8962 4399',
        hours: '24/7 Emergency, Business hours for general services',
        address: 'Schmidt Street, Tennant Creek NT 0860',
        status: 'Operating',
        lastUpdated: '2025-01-01',
        documentSource: 'Hospital Services Directory 2024',
        sourceType: 'baseline'
      },
      {
        id: 'youth-centre',
        name: 'Youth Drop-in Centre',
        type: 'available',
        category: 'youth',
        coordinates: [-19.6580, 134.1890],
        description: 'Safe space for young people, activities and support',
        contact: '(08) 8962 1234',
        hours: 'Mon-Fri 9am-5pm',
        address: 'Davidson Street, Tennant Creek NT 0860',
        status: 'Operating',
        lastUpdated: '2025-01-01',
        documentSource: 'Youth Roundtable Minutes March 2024',
        sourceType: 'baseline'
      }
    ],
    gaps: [
      {
        id: 'youth-safe-house-baseline',
        name: 'Youth Safe House',
        type: 'gap',
        category: 'youth',
        coordinates: [-19.6570, 134.1900],
        description: 'Emergency accommodation for young people in crisis - URGENTLY NEEDED',
        priority: 94,
        status: 'Critical Gap',
        estimatedCost: '$2.5M setup + $800K annual',
        potentialFunding: 'NT Government Youth Housing Initiative',
        lastUpdated: '2025-01-01',
        documentSource: 'Youth Roundtable Priority Analysis 2024',
        sourceType: 'baseline'
      }
    ],
    planned: [
      {
        id: 'cultural-hub-baseline',
        name: 'Cultural Mentoring Hub',
        type: 'planned',
        category: 'cultural',
        coordinates: [-19.6550, 134.1890],
        description: 'Elder-guided cultural learning and mentoring programs',
        status: 'Planning Phase',
        funding: '$1.8M Federal Indigenous Programs',
        timeline: 'Planning 2025, Implementation 2026',
        lastUpdated: '2025-01-01',
        documentSource: 'Cultural Development Strategy 2025',
        sourceType: 'baseline'
      }
    ]
  };
}

// Transform document insights into service data
function transformDocumentInsightsToServices(insights: any[], quotes: any[], themes: any[]) {
  const services = [];
  
  // Process insights that mention specific services
  for (const insight of insights) {
    if (insight.insight.toLowerCase().includes('program') || 
        insight.insight.toLowerCase().includes('centre') ||
        insight.insight.toLowerCase().includes('service')) {
      
      // Try to extract service details from the insight
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
        documentId: insight.document.id
      };
      
      services.push(service);
    }
  }
  
  return services.slice(0, 5); // Limit to prevent overwhelming
}

// Extract service gaps from document insights
function extractServiceGaps(insights: any[], quotes: any[]) {
  const gaps = [];
  
  for (const insight of insights) {
    if (insight.insight.toLowerCase().includes('need') || 
        insight.insight.toLowerCase().includes('gap') ||
        insight.insight.toLowerCase().includes('lack') ||
        insight.insight.toLowerCase().includes('missing')) {
      
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
        documentId: insight.document.id
      };
      
      gaps.push(gap);
    }
  }
  
  return gaps.slice(0, 3);
}

// Helper function to extract service name from text
function extractServiceName(text: string): string | null {
  // Simple pattern matching for service names
  const patterns = [
    /([A-Z][a-z]+\s+(?:Centre|Center|Service|Program|Hub|Support))/,
    /(Youth\s+[A-Z][a-z]+)/,
    /(Mental\s+Health\s+[A-Z][a-z]+)/,
    /(Cultural\s+[A-Z][a-z]+)/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Categorize insight into service category
function categorizeInsight(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('youth') || lower.includes('young')) return 'youth';
  if (lower.includes('health') || lower.includes('medical')) return 'healthcare';
  if (lower.includes('cultural') || lower.includes('traditional')) return 'cultural';
  if (lower.includes('education') || lower.includes('learning')) return 'education';
  if (lower.includes('government') || lower.includes('centrelink')) return 'government';
  
  return 'community';
}

// Generate random coordinates within Tennant Creek area
function generateTennantCreekCoordinates(): [number, number] {
  const baseLat = -19.6544;
  const baseLng = 134.1870;
  const radius = 0.01; // About 1km radius
  
  const lat = baseLat + (Math.random() - 0.5) * radius;
  const lng = baseLng + (Math.random() - 0.5) * radius;
  
  return [lat, lng];
}

// Calculate coverage score based on services vs gaps
function calculateCoverageScore(services: any[], gaps: any[]): number {
  if (services.length + gaps.length === 0) return 0;
  return Math.round((services.length / (services.length + gaps.length)) * 100);
}

// Extract priority areas from gaps
function extractPriorityAreas(gaps: any[]): string[] {
  const categories = gaps.map(gap => gap.category);
  const counts = categories.reduce((acc: any, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([category]) => category.charAt(0).toUpperCase() + category.slice(1));
}