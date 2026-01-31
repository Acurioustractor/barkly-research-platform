import { NextRequest, NextResponse } from 'next/server';
import { communityHealthService } from '@/lib/community/community-health-service';
import { prisma } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'communities', 'services', 'stories', 'all'
    const communityId = searchParams.get('communityId');

    let data;

    switch (type) {
      case 'communities':
        data = await getCommunityMapData(communityId);
        break;
      case 'services':
        data = await getServiceMapData(communityId);
        break;
      case 'stories':
        data = await getStoryMapData(communityId);
        break;
      case 'all':
      default:
        data = await getAllMapData(communityId);
    }

    return NextResponse.json({
      success: true,
      data,
      type: type || 'all',
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Map data error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get map data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getCommunityMapData(communityId?: string | null) {
  try {
    // Get community health data
    const healthData = communityId
      ? [await communityHealthService.calculateCommunityHealth(communityId)]
      : await communityHealthService.calculateAllCommunityHealth();

    // Add coordinates to communities
    const communitiesWithCoords = await Promise.all(
      healthData.map(async (community) => {
        const coords = await getCommunityCoordinates(community.communityId);
        return {
          ...community,
          coordinates: coords,
          // Add map-specific data
          mapData: {
            needIntensity: calculateNeedIntensity(community),
            serviceGaps: community.insights?.criticalGaps || [],
            opportunities: community.insights?.opportunities || [],
            recentActivity: community.metrics?.recentDocuments || 0
          }
        };
      })
    );

    return {
      communities: communitiesWithCoords,
      summary: {
        total: communitiesWithCoords.length,
        thriving: communitiesWithCoords.filter(c => c.status === 'thriving').length,
        developing: communitiesWithCoords.filter(c => c.status === 'developing').length,
        struggling: communitiesWithCoords.filter(c => c.status === 'struggling').length,
        improving: communitiesWithCoords.filter(c => c.status === 'improving').length,
        averageHealth: Math.round(
          communitiesWithCoords.reduce((sum, c) => sum + c.healthScore, 0) / communitiesWithCoords.length
        )
      }
    };

  } catch (error) {
    console.error('Error getting community map data:', error);
    throw error;
  }
}

async function getServiceMapData(communityId?: string | null) {
  try {
    // Get services from database or generate mock data
    const services = await generateServicePoints(communityId);

    return {
      services,
      summary: {
        total: services.length,
        active: services.filter(s => s.status === 'active').length,
        limited: services.filter(s => s.status === 'limited').length,
        closed: services.filter(s => s.status === 'closed').length,
        byType: services.reduce((acc: Record<string, number>, service: any) => {
          acc[service.service_type] = (acc[service.service_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) as Record<string, number>
      }
    };

  } catch (error) {
    console.error('Error getting service map data:', error);
    return { services: [], summary: { total: 0, active: 0, limited: 0, closed: 0, byType: {} } };
  }
}

async function getStoryMapData(communityId?: string | null) {
  try {
    // Get stories from database or generate mock data
    const stories = await generateStoryMarkers(communityId);

    return {
      stories,
      summary: {
        total: stories.length,
        success: stories.filter(s => s.type === 'success').length,
        challenge: stories.filter(s => s.type === 'challenge').length,
        opportunity: stories.filter(s => s.type === 'opportunity').length,
        voice: stories.filter(s => s.type === 'voice').length,
        highImpact: stories.filter(s => s.impact === 'high').length
      }
    };

  } catch (error) {
    console.error('Error getting story map data:', error);
    return { stories: [], summary: { total: 0, success: 0, challenge: 0, opportunity: 0, voice: 0, highImpact: 0 } };
  }
}

async function getAllMapData(communityId?: string | null) {
  try {
    const [communities, services, stories] = await Promise.all([
      getCommunityMapData(communityId),
      getServiceMapData(communityId),
      getStoryMapData(communityId)
    ]);

    return {
      ...communities,
      ...services,
      ...stories,
      overview: {
        communities: communities.summary,
        services: services.summary,
        stories: stories.summary,
        lastUpdated: new Date()
      }
    };

  } catch (error) {
    console.error('Error getting all map data:', error);
    throw error;
  }
}

async function getCommunityCoordinates(communityId: string): Promise<[number, number]> {
  try {
    // Try to get coordinates from database
    const community = await prisma.$queryRaw<Array<{
      coordinates: any;
      name: string;
    }>>`
      SELECT coordinates, name FROM communities WHERE id = ${communityId}::uuid
    `;

    if (community[0]?.coordinates) {
      return community[0].coordinates;
    }

    // Fallback to mock coordinates based on community name/id
    return getMockCoordinates(communityId, community[0]?.name);

  } catch (error) {
    console.warn('Could not get coordinates from database, using mock:', error);
    return getMockCoordinates(communityId);
  }
}

function getMockCoordinates(communityId: string, communityName?: string): [number, number] {
  // Mock coordinates for Barkly region communities
  const mockCoords: Record<string, [number, number]> = {
    'tennant-creek': [-19.6530, 134.1805],
    'elliott': [-17.5500, 133.5400],
    'ali-curung': [-20.0300, 134.3200],
    'alpurrurulam': [-20.2000, 135.8800],
    'ampilatwatja': [-21.9000, 135.5000],
    'canteen-creek': [-19.9500, 135.2000],
    'epenarra': [-18.6000, 133.8500],
    'neutral-junction': [-19.8000, 134.5000],
    'rockhampton-downs': [-19.2000, 134.8000],
    'wutunugurra': [-20.1000, 134.1000]
  };

  // Try to match by ID or name
  const key = Object.keys(mockCoords).find(k =>
    k === communityId.toLowerCase() ||
    (communityName && k.includes(communityName.toLowerCase().replace(/\s+/g, '-')))
  );

  if (key) {
    return mockCoords[key];
  }

  // Generate coordinates around Tennant Creek for unknown communities
  const baseCoords: [number, number] = [-19.6530, 134.1805];
  const hash = communityId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const latOffset = ((hash % 200) - 100) / 1000; // ±0.1 degrees
  const lngOffset = (((hash * 7) % 200) - 100) / 1000; // ±0.1 degrees

  return [baseCoords[0] + latOffset, baseCoords[1] + lngOffset];
}

function calculateNeedIntensity(community: any): 'low' | 'medium' | 'high' | 'critical' {
  const criticalNeeds = community.insights?.topNeeds?.filter((n: any) => n.urgency === 'critical').length || 0;
  const highNeeds = community.insights?.topNeeds?.filter((n: any) => n.urgency === 'high').length || 0;

  if (criticalNeeds > 0) return 'critical';
  if (highNeeds > 1) return 'high';
  if (community.healthScore < 50) return 'medium';
  return 'low';
}

async function generateServicePoints(communityId?: string | null) {
  // Mock service data - would come from database in production
  const allServices = [
    {
      id: 'tc-youth-center',
      name: 'Tennant Creek Youth Centre',
      type: 'recreation',
      coordinates: [-19.6490, 134.1890] as [number, number],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 85,
      youthServed: 120,
      capacity: 150,
      description: 'Drop-in centre with recreational facilities and programs',
      programs: ['After School Programs', 'Holiday Activities', 'Mentoring'],
      operatingHours: 'Mon-Fri 3-9pm, Weekends 10am-6pm',
      contact: 'youth@tennantcreek.nt.gov.au'
    },
    {
      id: 'barkly-health',
      name: 'Barkly Regional Health Service',
      type: 'health',
      coordinates: [-19.6520, 134.1850] as [number, number],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 78,
      youthServed: 200,
      capacity: 300,
      description: 'Primary health care including youth mental health services',
      programs: ['Mental Health', 'Sexual Health', 'Drug & Alcohol Support'],
      operatingHours: '24/7 Emergency, Clinics Mon-Fri 8am-5pm',
      contact: '08 8962 4444'
    },
    {
      id: 'tc-high-school',
      name: 'Tennant Creek High School',
      type: 'education',
      coordinates: [-19.6480, 134.1870] as [number, number],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 82,
      youthServed: 450,
      capacity: 500,
      description: 'Secondary education with VET programs',
      programs: ['Secondary Education', 'VET Programs', 'Student Support'],
      operatingHours: 'School hours Mon-Fri 8:30am-3:30pm',
      contact: 'admin@tchs.nt.edu.au'
    },
    {
      id: 'batchelor-institute',
      name: 'Batchelor Institute',
      type: 'training',
      coordinates: [-19.6460, 134.1900] as [number, number],
      communityId: 'tennant-creek',
      status: 'limited',
      effectiveness: 65,
      youthServed: 85,
      capacity: 120,
      description: 'Vocational education and training',
      programs: ['Trade Training', 'Certificate Courses', 'Adult Education'],
      operatingHours: 'Mon-Fri 9am-4pm',
      contact: 'tennantcreek@batchelor.edu.au'
    },
    {
      id: 'julalikari-council',
      name: 'Julalikari Council',
      type: 'cultural',
      coordinates: [-19.6550, 134.1820] as [number, number],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 90,
      youthServed: 180,
      description: 'Aboriginal corporation providing cultural programs',
      programs: ['Cultural Programs', 'Night Patrol', 'Community Support'],
      operatingHours: 'Mon-Fri 9am-5pm',
      contact: 'info@julalikari.com.au'
    },
    {
      id: 'elliott-school',
      name: 'Elliott School',
      type: 'education',
      coordinates: [-17.5500, 133.5400] as [number, number],
      communityId: 'elliott',
      status: 'active',
      effectiveness: 75,
      youthServed: 45,
      capacity: 60,
      description: 'Primary and secondary education for Elliott community',
      programs: ['Primary Education', 'Secondary Education', 'Community Programs'],
      operatingHours: 'School hours Mon-Fri 8:30am-3:30pm',
      contact: 'elliott.school@education.nt.gov.au'
    }
  ];

  // Filter by community if specified
  if (communityId) {
    return allServices.filter(service => service.communityId === communityId);
  }

  return allServices;
}

async function generateStoryMarkers(communityId?: string | null) {
  // Mock story data - would come from database in production
  const allStories = [
    {
      id: 'basketball-success',
      title: 'Basketball Program Success',
      coordinates: [-19.6520, 134.1880] as [number, number],
      communityId: 'tennant-creek',
      type: 'success',
      impact: 'high',
      date: new Date('2024-01-15'),
      summary: '90% retention rate in youth basketball mentorship program',
      culturalSensitivity: 'public',
      details: 'The basketball mentorship program has achieved remarkable success with 90% of participants completing the full program and 15 youth gaining employment through program connections.',
      outcomes: ['Improved fitness', 'Leadership skills', 'Employment pathways', 'Community connection']
    },
    {
      id: 'transport-challenge',
      title: 'Transport Barriers',
      coordinates: [-19.6600, 134.1750] as [number, number],
      communityId: 'south-residential',
      type: 'challenge',
      impact: 'medium',
      date: new Date('2024-01-10'),
      summary: 'Youth struggling to access town center services due to transport',
      culturalSensitivity: 'community',
      details: 'Many young people in residential areas cannot access services in town center due to lack of reliable transport options.',
      impacts: ['Reduced service access', 'Social isolation', 'Missed opportunities', 'Health impacts']
    },
    {
      id: 'cultural-arts-opportunity',
      title: 'Cultural Arts Workshop Opportunity',
      coordinates: [-19.6470, 134.1830] as [number, number],
      communityId: 'tennant-creek',
      type: 'opportunity',
      impact: 'high',
      date: new Date('2024-01-20'),
      summary: 'Funding available for expanding successful cultural arts program',
      culturalSensitivity: 'public',
      details: '$50,000 funding opportunity to expand the cultural arts workshop that has shown strong community engagement and cultural connection outcomes.',
      potential: ['Program expansion', 'More youth engagement', 'Cultural preservation', 'Skills development']
    },
    {
      id: 'youth-voice-mental-health',
      title: 'Youth Mental Health Concerns',
      coordinates: [-19.6500, 134.1860] as [number, number],
      communityId: 'tennant-creek',
      type: 'voice',
      impact: 'high',
      date: new Date('2024-01-18'),
      summary: 'Young people calling for more accessible mental health services',
      culturalSensitivity: 'community',
      details: 'Youth consultation revealed significant concerns about mental health service accessibility and cultural appropriateness.',
      themes: ['Mental health', 'Service access', 'Cultural safety', 'Youth voice']
    }
  ];

  // Filter by community if specified
  if (communityId) {
    return allStories.filter(story => story.communityId === communityId);
  }

  return allStories;
}

// POST endpoint to update map data
export async function POST(request: NextRequest) {
  try {
    const { action, communityId } = await request.json();

    let result;

    switch (action) {
      case 'refresh-communities':
        result = await getCommunityMapData(communityId);
        break;

      case 'refresh-services':
        result = await getServiceMapData(communityId);
        break;

      case 'refresh-all':
        result = await getAllMapData(communityId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Map data POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update map data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}