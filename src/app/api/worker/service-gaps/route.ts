import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const region = searchParams.get('region');
    const gapType = searchParams.get('gapType');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get service gaps with enhanced analysis
    let query = supabase
      .from('service_gaps')
      .select(`
        id,
        service_type,
        gap_type,
        location,
        severity_score,
        impact_score,
        affected_population,
        recommendations,
        evidence_summary,
        priority_level,
        created_at,
        updated_at,
        communities(name, region)
      `)
      .order('severity_score', { ascending: false });

    if (region) {
      query = query.eq('communities.region', region);
    }

    if (gapType) {
      query = query.eq('gap_type', gapType);
    }

    if (priority) {
      query = query.eq('priority_level', priority);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service gaps' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const gaps = data?.map((gap: any) => ({
      id: gap.id,
      service: gap.service_type || 'Unknown Service',
      location: gap.location || (Array.isArray(gap.communities) ? (gap.communities as any)[0]?.name : (gap.communities as any)?.name) || 'Unknown Location',
      gapType: gap.gap_type || 'capacity',
      severity: gap.severity_score || 0,
      impact: gap.impact_score || 0,
      affectedPopulation: gap.affected_population || 0,
      recommendations: gap.recommendations || [],
      evidence: gap.evidence_summary ? [gap.evidence_summary] : [],
      priority: gap.priority_level || 'medium'
    })) || [];

    return NextResponse.json({ gaps });
  } catch (error) {
    console.error('Service gaps API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'analyzeGaps':
        const { organizationId, region, serviceTypes } = data;

        // Trigger comprehensive gap analysis
        const analysisResults = await performGapAnalysis({
          organizationId,
          region,
          serviceTypes
        });

        return NextResponse.json({
          analysis: analysisResults,
          message: 'Gap analysis completed successfully'
        });

      case 'addressGap':
        const { gapId, interventionPlan, assignedTo, timeline } = data;

        if (!gapId || !interventionPlan) {
          return NextResponse.json(
            { error: 'Gap ID and intervention plan are required' },
            { status: 400 }
          );
        }

        // Create gap intervention record
        const { error: interventionError } = await supabase
          .from('gap_interventions')
          .insert([{
            gap_id: gapId,
            intervention_plan: interventionPlan,
            assigned_to: assignedTo,
            timeline: timeline,
            status: 'planned',
            created_at: new Date().toISOString()
          }]);

        if (interventionError) {
          throw new Error(`Failed to create intervention: ${interventionError.message}`);
        }

        // Update gap status
        const { error: updateError } = await supabase
          .from('service_gaps')
          .update({
            status: 'being_addressed',
            updated_at: new Date().toISOString()
          })
          .eq('id', gapId);

        if (updateError) {
          console.error('Failed to update gap status:', updateError);
        }

        return NextResponse.json({
          message: 'Gap intervention plan created successfully'
        });

      case 'updateGapPriority':
        const { gapId: updateGapId, newPriority, reason } = data;

        const { error: priorityError } = await supabase
          .from('service_gaps')
          .update({
            priority_level: newPriority,
            priority_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', updateGapId);

        if (priorityError) {
          throw new Error(`Failed to update gap priority: ${priorityError.message}`);
        }

        return NextResponse.json({
          message: 'Gap priority updated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Service gaps POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performGapAnalysis(params: {
  organizationId: string;
  region?: string;
  serviceTypes?: string[];
}): Promise<any> {
  try {
    // Get existing service data
    let servicesQuery = supabase
      .from('community_services')
      .select(`
        id,
        name,
        category,
        location,
        availability,
        communities(name, region, population)
      `)
      .eq('active', true);

    if (params.region) {
      servicesQuery = servicesQuery.eq('communities.region', params.region);
    }

    const { data: services, error: servicesError } = await servicesQuery;

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    // Get community needs data
    let needsQuery = supabase
      .from('community_needs')
      .select(`
        id,
        need_category,
        need_description,
        urgency_score,
        impact_score,
        communities(name, region, population)
      `);

    if (params.region) {
      needsQuery = needsQuery.eq('communities.region', params.region);
    }

    const { data: needs, error: needsError } = await needsQuery;

    if (needsError) {
      throw new Error(`Failed to fetch needs: ${needsError.message}`);
    }

    // Analyze gaps
    const analysis = {
      totalServices: services?.length || 0,
      totalNeeds: needs?.length || 0,
      gapsByType: analyzeGapsByType(services || [], needs || []),
      gapsByLocation: analyzeGapsByLocation(services || [], needs || []),
      priorityGaps: identifyPriorityGaps(services || [], needs || []),
      recommendations: generateGapRecommendations(services || [], needs || [])
    };

    return analysis;
  } catch (error) {
    console.error('Error performing gap analysis:', error);
    return {
      totalServices: 0,
      totalNeeds: 0,
      gapsByType: {},
      gapsByLocation: {},
      priorityGaps: [],
      recommendations: []
    };
  }
}

function analyzeGapsByType(services: any[], needs: any[]): Record<string, any> {
  const servicesByType = services.reduce((acc: Record<string, number>, service: any) => {
    const type = service.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const needsByType = needs.reduce((acc: Record<string, any>, need: any) => {
    const type = need.need_category || 'other'; // Changed 'need_type' to 'need_category' to match existing data structure
    if (!acc[type]) acc[type] = [];
    acc[type].push(need);
    return acc;
  }, {} as Record<string, any[]>);

  const gaps: Record<string, any> = {};

  // Identify categories with high needs but low services
  Object.keys(needsByType).forEach((category: string) => {
    const needsInCategory = needsByType[category];
    const needCount = needsInCategory.length; // Count needs from the array
    const serviceCount = servicesByType[category] || 0;
    const gapRatio = serviceCount > 0 ? needCount / serviceCount : needCount;

    if (gapRatio > 1.5) { // Threshold for significant gap
      gaps[category] = {
        needCount,
        serviceCount,
        gapRatio,
        severity: Math.min(Math.round(gapRatio * 2), 10)
      };
    }
  });

  return gaps;
}

function analyzeGapsByLocation(services: any[], needs: any[]): Record<string, any> {
  const servicesByLocation = services.reduce((acc: Record<string, any>, service: any) => {
    const location = service.communities?.name || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, any>);

  const needsByLocation = needs.reduce((acc: Record<string, any[]>, need: any) => {
    const location = need.communities?.name || 'Unknown';
    if (!acc[location]) acc[location] = [];
    acc[location].push(need);
    return acc;
  }, {} as Record<string, any[]>);

  const gaps: Record<string, any> = {};

  Object.keys(needsByLocation).forEach((location: string) => {
    const needsInLocation = needsByLocation[location];
    const needCount = needsInLocation.length;
    const serviceCount = servicesByLocation[location] || 0;
    const population = needsInLocation.find((n: any) => n.communities?.name === location)?.communities?.population || 1000;

    gaps[location] = {
      needCount,
      serviceCount,
      population,
      serviceRatio: serviceCount / population * 1000, // Services per 1000 people
      needRatio: needCount / population * 1000 // Needs per 1000 people
    };
  });

  return gaps;
}

function identifyPriorityGaps(services: any[], needs: any[]): any[] {
  const priorityGaps: any[] = [];

  // High-urgency needs with no corresponding services
  const highUrgencyNeeds = needs.filter((need: any) => need.urgency_score >= 8);

  highUrgencyNeeds.forEach((need: any) => {
    const matchingServices = services.filter((service: any) =>
      service.category === need.need_category &&
      service.communities?.name === need.communities?.name
    );

    if (matchingServices.length === 0) {
      priorityGaps.push({
        type: 'critical_service_gap',
        category: need.need_category,
        location: need.communities?.name,
        urgency: need.urgency_score,
        impact: need.impact_score,
        description: need.need_description
      });
    }
  });

  return priorityGaps.sort((a: any, b: any) => (b.urgency + b.impact) - (a.urgency + a.impact));
}

function generateGapRecommendations(services: any[], needs: any[]): string[] {
  const recommendations = [];

  // Generic recommendations based on analysis
  if (services.length === 0) {
    recommendations.push('Establish basic service infrastructure in the region');
  }

  if (needs.length > services.length * 2) {
    recommendations.push('Significant service expansion needed to meet community needs');
  }

  // Category-specific recommendations
  const healthNeeds = needs.filter((n: any) => n.need_category === 'health').length;
  const healthServices = services.filter((s: any) => s.category === 'health').length;

  if (healthNeeds > healthServices * 2) {
    recommendations.push('Prioritize expansion of health services and facilities');
  }

  const educationNeeds = needs.filter((n: any) => n.need_category === 'education').length;
  const educationServices = services.filter((s: any) => s.category === 'education').length;

  if (educationNeeds > educationServices * 2) {
    recommendations.push('Develop additional educational programs and resources');
  }

  return recommendations;
}