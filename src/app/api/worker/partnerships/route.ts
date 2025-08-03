import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const region = searchParams.get('region');
    const partnerType = searchParams.get('partnerType');
    const opportunityType = searchParams.get('opportunityType');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get partnership opportunities
    let query = supabase
      .from('partnership_opportunities')
      .select(`
        id,
        partner_name,
        partner_type,
        partner_organization,
        opportunity_type,
        description,
        potential_impact,
        feasibility_score,
        requirements,
        benefits,
        next_steps,
        contact_info,
        status,
        created_at,
        updated_at,
        communities(name, region)
      `)
      .eq('status', 'active')
      .order('potential_impact', { ascending: false });

    if (region) {
      query = query.eq('communities.region', region);
    }

    if (partnerType) {
      query = query.eq('partner_type', partnerType);
    }

    if (opportunityType) {
      query = query.eq('opportunity_type', opportunityType);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch partnerships' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const partnerships = data?.map(partnership => ({
      id: partnership.id,
      partnerName: partnership.partner_name,
      partnerType: partnership.partner_type,
      opportunityType: partnership.opportunity_type,
      description: partnership.description,
      potentialImpact: partnership.potential_impact || 5,
      feasibility: partnership.feasibility_score || 5,
      requirements: partnership.requirements || [],
      benefits: partnership.benefits || [],
      nextSteps: partnership.next_steps || [],
      contactInfo: partnership.contact_info,
      organization: partnership.partner_organization,
      community: partnership.communities?.name || 'Regional',
      region: partnership.communities?.region || 'Unknown'
    })) || [];

    return NextResponse.json({ partnerships });
  } catch (error) {
    console.error('Partnerships API error:', error);
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
      case 'createPartnership':
        const {
          partnerName,
          partnerType,
          partnerOrganization,
          opportunityType,
          description,
          potentialImpact,
          feasibilityScore,
          requirements,
          benefits,
          nextSteps,
          contactInfo,
          communityId
        } = data;

        if (!partnerName || !opportunityType || !description) {
          return NextResponse.json(
            { error: 'Partner name, opportunity type, and description are required' },
            { status: 400 }
          );
        }

        const { data: newPartnership, error: createError } = await supabase
          .from('partnership_opportunities')
          .insert([{
            partner_name: partnerName,
            partner_type: partnerType || 'other',
            partner_organization: partnerOrganization,
            opportunity_type: opportunityType,
            description,
            potential_impact: potentialImpact || 5,
            feasibility_score: feasibilityScore || 5,
            requirements: requirements || [],
            benefits: benefits || [],
            next_steps: nextSteps || [],
            contact_info: contactInfo,
            community_id: communityId,
            status: 'active'
          }])
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create partnership: ${createError.message}`);
        }

        return NextResponse.json({ 
          partnership: newPartnership,
          message: 'Partnership opportunity created successfully' 
        }, { status: 201 });

      case 'initiatePartnership':
        const { partnershipId, initiatedBy, message, proposedTimeline } = data;
        
        if (!partnershipId || !initiatedBy) {
          return NextResponse.json(
            { error: 'Partnership ID and initiator are required' },
            { status: 400 }
          );
        }

        // Create partnership initiation record
        const { error: initiationError } = await supabase
          .from('partnership_initiations')
          .insert([{
            partnership_id: partnershipId,
            initiated_by: initiatedBy,
            message: message || '',
            proposed_timeline: proposedTimeline,
            status: 'initiated',
            created_at: new Date().toISOString()
          }]);

        if (initiationError) {
          throw new Error(`Failed to initiate partnership: ${initiationError.message}`);
        }

        // Update partnership status
        const { error: updateError } = await supabase
          .from('partnership_opportunities')
          .update({
            status: 'in_discussion',
            updated_at: new Date().toISOString()
          })
          .eq('id', partnershipId);

        if (updateError) {
          console.error('Failed to update partnership status:', updateError);
        }

        return NextResponse.json({ 
          message: 'Partnership initiation successful' 
        });

      case 'findPartners':
        const { organizationId, serviceType, location, partnershipType } = data;
        
        const potentialPartners = await findPotentialPartners({
          organizationId,
          serviceType,
          location,
          partnershipType
        });

        return NextResponse.json({ partners: potentialPartners });

      case 'analyzeCollaboration':
        const { organizationIds, analysisType } = data;
        
        if (!organizationIds || !Array.isArray(organizationIds)) {
          return NextResponse.json(
            { error: 'Organization IDs array is required' },
            { status: 400 }
          );
        }

        const collaborationAnalysis = await analyzeCollaborationPotential(
          organizationIds,
          analysisType
        );

        return NextResponse.json({ analysis: collaborationAnalysis });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Partnerships POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function findPotentialPartners(params: {
  organizationId: string;
  serviceType?: string;
  location?: string;
  partnershipType?: string;
}): Promise<any[]> {
  try {
    // Get organizations that could be potential partners
    let query = supabase
      .from('organizations')
      .select(`
        id,
        name,
        organization_type,
        services_offered,
        location,
        contact_info,
        active_programs,
        expertise_areas,
        partnership_history,
        communities(name, region)
      `)
      .neq('id', params.organizationId) // Exclude requesting organization
      .eq('active', true);

    if (params.location) {
      query = query.eq('location', params.location);
    }

    const { data: organizations, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    // Score and rank potential partners
    const potentialPartners = organizations?.map(org => {
      const compatibilityScore = calculateCompatibilityScore(org, params);
      const collaborationPotential = assessCollaborationPotential(org, params);
      
      return {
        id: org.id,
        name: org.name,
        type: org.organization_type,
        services: org.services_offered || [],
        location: org.location,
        expertise: org.expertise_areas || [],
        compatibilityScore,
        collaborationPotential,
        partnershipHistory: org.partnership_history || 0,
        activePrograms: org.active_programs || 0,
        community: org.communities?.name || 'Regional',
        region: org.communities?.region || 'Unknown',
        contactInfo: org.contact_info
      };
    }).filter(partner => partner.compatibilityScore > 0.3) // Filter out low compatibility
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore) || [];

    return potentialPartners.slice(0, 10); // Return top 10 matches
  } catch (error) {
    console.error('Error finding potential partners:', error);
    return [];
  }
}

function calculateCompatibilityScore(organization: any, params: any): number {
  let score = 0;
  
  // Service type compatibility
  if (params.serviceType && organization.services_offered) {
    const hasCompatibleService = organization.services_offered.some((service: string) =>
      service.toLowerCase().includes(params.serviceType.toLowerCase()) ||
      params.serviceType.toLowerCase().includes(service.toLowerCase())
    );
    if (hasCompatibleService) score += 0.3;
  }
  
  // Location compatibility
  if (params.location && organization.location === params.location) {
    score += 0.2;
  }
  
  // Organization type compatibility
  const compatibleTypes = {
    'resource_sharing': ['ngo', 'community', 'government'],
    'joint_program': ['ngo', 'government', 'academic'],
    'knowledge_exchange': ['academic', 'ngo', 'government'],
    'funding': ['government', 'business', 'foundation']
  };
  
  if (params.partnershipType && compatibleTypes[params.partnershipType as keyof typeof compatibleTypes]) {
    const compatibleTypesList = compatibleTypes[params.partnershipType as keyof typeof compatibleTypes];
    if (compatibleTypesList.includes(organization.organization_type)) {
      score += 0.2;
    }
  }
  
  // Experience and capacity
  if (organization.active_programs > 0) score += 0.1;
  if (organization.partnership_history > 0) score += 0.1;
  if (organization.expertise_areas && organization.expertise_areas.length > 0) score += 0.1;
  
  return Math.min(score, 1.0);
}

function assessCollaborationPotential(organization: any, params: any): string {
  const score = calculateCompatibilityScore(organization, params);
  
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.4) return 'low';
  return 'very_low';
}

async function analyzeCollaborationPotential(
  organizationIds: string[],
  analysisType: string = 'general'
): Promise<any> {
  try {
    // Get organization data
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        organization_type,
        services_offered,
        expertise_areas,
        active_programs,
        budget_range,
        communities(name, region, population)
      `)
      .in('id', organizationIds);

    if (error || !organizations) {
      throw new Error(`Failed to fetch organizations: ${error?.message}`);
    }

    const analysis = {
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        type: org.organization_type,
        services: org.services_offered?.length || 0,
        expertise: org.expertise_areas?.length || 0,
        programs: org.active_programs || 0,
        community: org.communities?.name || 'Unknown'
      })),
      collaborationStrengths: identifyCollaborationStrengths(organizations),
      potentialSynergies: identifyPotentialSynergies(organizations),
      resourceComplementarity: analyzeResourceComplementarity(organizations),
      geographicCoverage: analyzeGeographicCoverage(organizations),
      recommendations: generateCollaborationRecommendations(organizations),
      riskFactors: identifyCollaborationRisks(organizations)
    };

    return analysis;
  } catch (error) {
    console.error('Error analyzing collaboration potential:', error);
    return {
      organizations: [],
      collaborationStrengths: [],
      potentialSynergies: [],
      resourceComplementarity: {},
      geographicCoverage: {},
      recommendations: [],
      riskFactors: []
    };
  }
}

function identifyCollaborationStrengths(organizations: any[]): string[] {
  const strengths = [];
  
  // Diverse organization types
  const types = [...new Set(organizations.map(org => org.organization_type))];
  if (types.length >= 3) {
    strengths.push('Diverse organizational perspectives and capabilities');
  }
  
  // Complementary expertise
  const allExpertise = organizations.flatMap(org => org.expertise_areas || []);
  const uniqueExpertise = [...new Set(allExpertise)];
  if (uniqueExpertise.length >= 5) {
    strengths.push('Broad range of complementary expertise areas');
  }
  
  // Strong program experience
  const totalPrograms = organizations.reduce((sum, org) => sum + (org.active_programs || 0), 0);
  if (totalPrograms >= 10) {
    strengths.push('Extensive collective program implementation experience');
  }
  
  // Geographic coverage
  const communities = [...new Set(organizations.map(org => org.communities?.name).filter(Boolean))];
  if (communities.length >= 3) {
    strengths.push('Good geographic coverage across multiple communities');
  }
  
  return strengths;
}

function identifyPotentialSynergies(organizations: any[]): string[] {
  const synergies = [];
  
  // Service complementarity
  const allServices = organizations.flatMap(org => org.services_offered || []);
  const serviceCategories = categorizeServices(allServices);
  
  if (serviceCategories.length >= 3) {
    synergies.push('Complementary service offerings enable comprehensive program delivery');
  }
  
  // NGO + Government collaboration
  const hasNGO = organizations.some(org => org.organization_type === 'ngo');
  const hasGovernment = organizations.some(org => org.organization_type === 'government');
  if (hasNGO && hasGovernment) {
    synergies.push('NGO-Government partnership enables policy influence and grassroots implementation');
  }
  
  // Academic + Practice collaboration
  const hasAcademic = organizations.some(org => org.organization_type === 'academic');
  const hasPractitioner = organizations.some(org => ['ngo', 'community'].includes(org.organization_type));
  if (hasAcademic && hasPractitioner) {
    synergies.push('Academic-Practitioner collaboration enables evidence-based program development');
  }
  
  return synergies;
}

function categorizeServices(services: string[]): string[] {
  const categories = new Set();
  
  services.forEach(service => {
    const lowerService = service.toLowerCase();
    if (lowerService.includes('health') || lowerService.includes('medical')) {
      categories.add('health');
    } else if (lowerService.includes('education') || lowerService.includes('training')) {
      categories.add('education');
    } else if (lowerService.includes('employment') || lowerService.includes('job')) {
      categories.add('employment');
    } else if (lowerService.includes('housing') || lowerService.includes('accommodation')) {
      categories.add('housing');
    } else if (lowerService.includes('cultural') || lowerService.includes('traditional')) {
      categories.add('cultural');
    } else {
      categories.add('other');
    }
  });
  
  return Array.from(categories);
}

function analyzeResourceComplementarity(organizations: any[]): any {
  const analysis = {
    budgetDiversity: analyzeBudgetDiversity(organizations),
    expertiseGaps: identifyExpertiseGaps(organizations),
    resourceSharing: identifyResourceSharingOpportunities(organizations)
  };
  
  return analysis;
}

function analyzeBudgetDiversity(organizations: any[]): any {
  const budgetRanges = organizations.map(org => org.budget_range).filter(Boolean);
  const uniqueRanges = [...new Set(budgetRanges)];
  
  return {
    diversity: uniqueRanges.length,
    ranges: uniqueRanges,
    analysis: uniqueRanges.length >= 3 ? 'Good budget diversity enables flexible resource allocation' : 'Limited budget diversity may constrain collaboration options'
  };
}

function identifyExpertiseGaps(organizations: any[]): string[] {
  const allExpertise = organizations.flatMap(org => org.expertise_areas || []);
  const commonExpertiseAreas = [
    'community_engagement', 'program_management', 'cultural_safety',
    'youth_development', 'health_services', 'education', 'employment',
    'housing', 'mental_health', 'substance_abuse'
  ];
  
  const gaps = commonExpertiseAreas.filter(area => 
    !allExpertise.some(expertise => 
      expertise.toLowerCase().includes(area.replace('_', ' '))
    )
  );
  
  return gaps;
}

function identifyResourceSharingOpportunities(organizations: any[]): string[] {
  const opportunities = [];
  
  // Infrastructure sharing
  const hasInfrastructure = organizations.some(org => 
    org.services_offered?.some((service: string) => 
      service.toLowerCase().includes('facility') || service.toLowerCase().includes('space')
    )
  );
  
  if (hasInfrastructure) {
    opportunities.push('Shared use of facilities and infrastructure');
  }
  
  // Staff and expertise sharing
  opportunities.push('Cross-organization staff secondments and expertise sharing');
  
  // Equipment and technology sharing
  opportunities.push('Shared procurement and use of specialized equipment');
  
  // Training and capacity building
  opportunities.push('Joint training programs and capacity building initiatives');
  
  return opportunities;
}

function analyzeGeographicCoverage(organizations: any[]): any {
  const communities = organizations.map(org => org.communities?.name).filter(Boolean);
  const regions = organizations.map(org => org.communities?.region).filter(Boolean);
  
  return {
    communities: [...new Set(communities)],
    regions: [...new Set(regions)],
    coverage: communities.length,
    analysis: communities.length >= 3 ? 'Good geographic coverage' : 'Limited geographic reach'
  };
}

function generateCollaborationRecommendations(organizations: any[]): string[] {
  const recommendations = [];
  
  // Based on organization types
  const types = [...new Set(organizations.map(org => org.organization_type))];
  if (types.includes('government') && types.includes('ngo')) {
    recommendations.push('Leverage government policy influence and NGO community connections');
  }
  
  if (types.includes('academic')) {
    recommendations.push('Incorporate research and evaluation components into collaborative programs');
  }
  
  // Based on expertise
  const allExpertise = organizations.flatMap(org => org.expertise_areas || []);
  if (allExpertise.length >= 5) {
    recommendations.push('Create cross-functional teams utilizing diverse expertise areas');
  }
  
  // General recommendations
  recommendations.push('Establish clear governance structure and communication protocols');
  recommendations.push('Develop shared measurement and evaluation framework');
  recommendations.push('Create resource sharing agreements and protocols');
  
  return recommendations;
}

function identifyCollaborationRisks(organizations: any[]): string[] {
  const risks = [];
  
  // Size imbalance
  const programCounts = organizations.map(org => org.active_programs || 0);
  const maxPrograms = Math.max(...programCounts);
  const minPrograms = Math.min(...programCounts);
  
  if (maxPrograms > minPrograms * 3) {
    risks.push('Significant capacity imbalance between organizations');
  }
  
  // Geographic dispersion
  const regions = [...new Set(organizations.map(org => org.communities?.region).filter(Boolean))];
  if (regions.length > 2) {
    risks.push('Geographic dispersion may complicate coordination');
  }
  
  // Organizational culture differences
  const types = [...new Set(organizations.map(org => org.organization_type))];
  if (types.length >= 3) {
    risks.push('Different organizational cultures may create coordination challenges');
  }
  
  // General risks
  risks.push('Potential for mission drift or conflicting priorities');
  risks.push('Resource allocation disputes');
  risks.push('Communication and coordination overhead');
  
  return risks;
}