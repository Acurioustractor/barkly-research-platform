import { supabase } from './supabase';

export interface SuccessPatternDB {
  id: number;
  pattern_text: string;
  category: string;
  replicability: number;
  sustainability: number;
  scalability: string;
  cultural_safety: string;
  timeline: string;
  document_id?: number;
  community_id?: number;
  created_at: string;
  updated_at: string;
}

export interface PatternCommunity {
  id: number;
  pattern_id: number;
  community_name: string;
  effectiveness_score: number;
}

export interface PatternRequirement {
  id: number;
  pattern_id: number;
  requirement_text: string;
  requirement_type: string;
  priority: number;
}

export interface PatternEvidence {
  id: number;
  pattern_id: number;
  evidence_text: string;
  evidence_type: string;
  confidence_score: number;
  source_document_chunk?: string;
}

export interface PatternOutcome {
  id: number;
  pattern_id: number;
  outcome_text: string;
  outcome_type: string;
  measurable: boolean;
  timeframe?: string;
}

export interface PatternTemplate {
  id: number;
  pattern_id: number;
  template_name: string;
  template_description?: string;
  implementation_steps: any[];
  timeline_estimate?: string;
  adaptation_guidance: string[];
  measurable_outcomes: string[];
  risks: any[];
  mitigations: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Save a success pattern to the database
 */
export async function saveSuccessPattern(
  pattern: {
    pattern_text: string;
    category: string;
    replicability: number;
    sustainability: number;
    scalability: string;
    cultural_safety: string;
    timeline: string;
    document_id?: number;
    community_id?: number;
  },
  communities: string[],
  requirements: string[],
  evidence: Array<{ text: string; confidence: number; chunk?: string }>,
  outcomes: string[],
  successFactors: string[],
  challenges: Array<{ text: string; resolution?: string }>,
  resources: Array<{ text: string; type: string }>,
  stakeholders: Array<{ name: string; type: string; role?: string }>
): Promise<number> {
  try {
    // Insert the main pattern record
    const { data: patternData, error: patternError } = await supabase
      .from('success_patterns')
      .insert([pattern])
      .select('id')
      .single();

    if (patternError) {
      throw new Error(`Failed to save success pattern: ${patternError.message}`);
    }

    const patternId = patternData.id;

    // Insert related data in parallel
    const insertPromises = [];

    // Communities
    if (communities.length > 0) {
      const communityRecords = communities.map(community => ({
        pattern_id: patternId,
        community_name: community,
        effectiveness_score: 0.8 // Default score, could be calculated
      }));
      insertPromises.push(
        supabase.from('pattern_communities').insert(communityRecords)
      );
    }

    // Requirements
    if (requirements.length > 0) {
      const requirementRecords = requirements.map((req, index) => ({
        pattern_id: patternId,
        requirement_text: req,
        requirement_type: 'general',
        priority: Math.min(index + 1, 5)
      }));
      insertPromises.push(
        supabase.from('pattern_requirements').insert(requirementRecords)
      );
    }

    // Evidence
    if (evidence.length > 0) {
      const evidenceRecords = evidence.map(ev => ({
        pattern_id: patternId,
        evidence_text: ev.text,
        evidence_type: 'qualitative',
        confidence_score: ev.confidence,
        source_document_chunk: ev.chunk
      }));
      insertPromises.push(
        supabase.from('pattern_evidence').insert(evidenceRecords)
      );
    }

    // Outcomes
    if (outcomes.length > 0) {
      const outcomeRecords = outcomes.map(outcome => ({
        pattern_id: patternId,
        outcome_text: outcome,
        outcome_type: 'community_benefit',
        measurable: false // Could be determined by AI analysis
      }));
      insertPromises.push(
        supabase.from('pattern_outcomes').insert(outcomeRecords)
      );
    }

    // Success factors
    if (successFactors.length > 0) {
      const factorRecords = successFactors.map((factor, index) => ({
        pattern_id: patternId,
        factor_text: factor,
        factor_category: 'implementation',
        importance_score: Math.min(5 - index, 5)
      }));
      insertPromises.push(
        supabase.from('pattern_success_factors').insert(factorRecords)
      );
    }

    // Challenges
    if (challenges.length > 0) {
      const challengeRecords = challenges.map(challenge => ({
        pattern_id: patternId,
        challenge_text: challenge.text,
        challenge_type: 'implementation',
        resolution_approach: challenge.resolution
      }));
      insertPromises.push(
        supabase.from('pattern_challenges').insert(challengeRecords)
      );
    }

    // Resources
    if (resources.length > 0) {
      const resourceRecords = resources.map(resource => ({
        pattern_id: patternId,
        resource_text: resource.text,
        resource_type: resource.type,
        availability: 'unknown'
      }));
      insertPromises.push(
        supabase.from('pattern_resources').insert(resourceRecords)
      );
    }

    // Stakeholders
    if (stakeholders.length > 0) {
      const stakeholderRecords = stakeholders.map(stakeholder => ({
        pattern_id: patternId,
        stakeholder_name: stakeholder.name,
        stakeholder_type: stakeholder.type,
        role_description: stakeholder.role,
        engagement_level: 'medium'
      }));
      insertPromises.push(
        supabase.from('pattern_stakeholders').insert(stakeholderRecords)
      );
    }

    // Execute all inserts
    await Promise.all(insertPromises);

    return patternId;
  } catch (error) {
    console.error('Error saving success pattern:', error);
    throw error;
  }
}

/**
 * Get success patterns by document ID
 */
export async function getSuccessPatternsByDocument(documentId: number): Promise<SuccessPatternDB[]> {
  try {
    const { data, error } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('document_id', documentId)
      .order('replicability', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch success patterns: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching success patterns by document:', error);
    throw error;
  }
}

/**
 * Get success patterns by community ID
 */
export async function getSuccessPatternsByCommunity(communityId: number): Promise<SuccessPatternDB[]> {
  try {
    const { data, error } = await supabase
      .from('success_patterns')
      .select('*')
      .eq('community_id', communityId)
      .order('sustainability', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch success patterns: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching success patterns by community:', error);
    throw error;
  }
}

/**
 * Get detailed success pattern with all related data
 */
export async function getDetailedSuccessPattern(patternId: number): Promise<{
  pattern: SuccessPatternDB;
  communities: PatternCommunity[];
  requirements: PatternRequirement[];
  evidence: PatternEvidence[];
  outcomes: PatternOutcome[];
  successFactors: any[];
  challenges: any[];
  resources: any[];
  stakeholders: any[];
} | null> {
  try {
    // Fetch pattern and all related data in parallel
    const [
      patternResult,
      communitiesResult,
      requirementsResult,
      evidenceResult,
      outcomesResult,
      factorsResult,
      challengesResult,
      resourcesResult,
      stakeholdersResult
    ] = await Promise.all([
      supabase.from('success_patterns').select('*').eq('id', patternId).single(),
      supabase.from('pattern_communities').select('*').eq('pattern_id', patternId),
      supabase.from('pattern_requirements').select('*').eq('pattern_id', patternId).order('priority'),
      supabase.from('pattern_evidence').select('*').eq('pattern_id', patternId).order('confidence_score', { ascending: false }),
      supabase.from('pattern_outcomes').select('*').eq('pattern_id', patternId),
      supabase.from('pattern_success_factors').select('*').eq('pattern_id', patternId).order('importance_score', { ascending: false }),
      supabase.from('pattern_challenges').select('*').eq('pattern_id', patternId),
      supabase.from('pattern_resources').select('*').eq('pattern_id', patternId),
      supabase.from('pattern_stakeholders').select('*').eq('pattern_id', patternId)
    ]);

    if (patternResult.error) {
      throw new Error(`Failed to fetch pattern: ${patternResult.error.message}`);
    }

    if (!patternResult.data) {
      return null;
    }

    return {
      pattern: patternResult.data,
      communities: communitiesResult.data || [],
      requirements: requirementsResult.data || [],
      evidence: evidenceResult.data || [],
      outcomes: outcomesResult.data || [],
      successFactors: factorsResult.data || [],
      challenges: challengesResult.data || [],
      resources: resourcesResult.data || [],
      stakeholders: stakeholdersResult.data || []
    };
  } catch (error) {
    console.error('Error fetching detailed success pattern:', error);
    throw error;
  }
}

/**
 * Search success patterns by text
 */
export async function searchSuccessPatterns(
  query: string,
  category?: string,
  minReplicability?: number,
  minSustainability?: number
): Promise<SuccessPatternDB[]> {
  try {
    let queryBuilder = supabase
      .from('success_patterns')
      .select('*')
      .textSearch('search_vector', query);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (minReplicability !== undefined) {
      queryBuilder = queryBuilder.gte('replicability', minReplicability);
    }

    if (minSustainability !== undefined) {
      queryBuilder = queryBuilder.gte('sustainability', minSustainability);
    }

    const { data, error } = await queryBuilder
      .order('replicability', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to search success patterns: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error searching success patterns:', error);
    throw error;
  }
}

/**
 * Get replicable patterns (high replicability and sustainability)
 */
export async function getReplicablePatterns(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('replicable_patterns')
      .select('*')
      .order('replicability', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch replicable patterns: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching replicable patterns:', error);
    throw error;
  }
}

/**
 * Save a pattern template
 */
export async function savePatternTemplate(template: {
  pattern_id: number;
  template_name: string;
  template_description?: string;
  implementation_steps: any[];
  timeline_estimate?: string;
  adaptation_guidance: string[];
  measurable_outcomes: string[];
  risks: any[];
  mitigations: string[];
}): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('pattern_templates')
      .insert([template])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save pattern template: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error saving pattern template:', error);
    throw error;
  }
}

/**
 * Get pattern templates by pattern ID
 */
export async function getPatternTemplates(patternId: number): Promise<PatternTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('pattern_templates')
      .select('*')
      .eq('pattern_id', patternId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pattern templates: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching pattern templates:', error);
    throw error;
  }
}

/**
 * Save cross-community analysis results
 */
export async function saveCrossCommunityAnalysis(analysis: {
  analysis_name: string;
  communities_analyzed: any[];
  shared_patterns: any[];
  unique_approaches: any[];
  emerging_trends: any[];
  replication_opportunities: any[];
}): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cross_community_analysis')
      .insert([analysis])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save cross-community analysis: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error saving cross-community analysis:', error);
    throw error;
  }
}

/**
 * Get pattern effectiveness by community
 */
export async function getPatternCommunityEffectiveness(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('pattern_community_effectiveness')
      .select('*')
      .order('effectiveness_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pattern effectiveness: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching pattern effectiveness:', error);
    throw error;
  }
}