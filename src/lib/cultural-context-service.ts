import { supabase } from './supabase';

export interface CulturalContext {
  id: string;
  communityId: string;
  languageGroup: string;
  traditionalName: string;
  culturalProtocols: string[];
  sacredSites: string[];
  culturalPractices: string[];
  storytellingProtocols: string[];
  knowledgeKeepers: string[];
  seasonalConsiderations: string[];
  genderProtocols: string[];
  ageGroupProtocols: string[];
  visualizationPreferences: {
    colorScheme: string;
    symbolism: string[];
    avoidedSymbols: string[];
    preferredLayouts: string[];
  };
  languagePreferences: {
    primaryLanguage: string;
    secondaryLanguages: string[];
    culturalTerms: Record<string, string>;
    avoidedTerms: string[];
  };
  accessRestrictions: {
    menOnly: string[];
    womenOnly: string[];
    eldersOnly: string[];
    initiatedOnly: string[];
    communityOnly: string[];
  };
}

export interface CulturalLens {
  id: string;
  name: string;
  description: string;
  communityId: string;
  filterCriteria: {
    contentTypes: string[];
    themes: string[];
    sensitivity: 'public' | 'community' | 'restricted' | 'sacred';
    requiredApprovals: string[];
  };
  transformationRules: {
    terminology: Record<string, string>;
    contextualFraming: string[];
    culturalNarrative: string;
    respectfulPresentation: string[];
  };
  visualizationRules: {
    colorMappings: Record<string, string>;
    symbolReplacements: Record<string, string>;
    layoutPreferences: string[];
    culturalElements: string[];
  };
  isActive: boolean;
}

export interface CulturallyContextualizedInsight {
  originalInsight: any;
  culturalContext: CulturalContext;
  appliedLenses: CulturalLens[];
  contextualizedContent: {
    title: string;
    description: string;
    culturalFraming: string;
    respectfulLanguage: string;
    traditionalPerspective?: string;
  };
  visualizationContext: {
    colorScheme: string;
    culturalSymbols: string[];
    layoutStyle: string;
    accessibilityNotes: string[];
  };
  accessControl: {
    visibility: 'public' | 'community' | 'restricted' | 'sacred';
    requiredPermissions: string[];
    culturalApprovals: string[];
  };
  traditionalKnowledgeFlags: {
    containsTraditionalKnowledge: boolean;
    knowledgeType: string[];
    protectionLevel: string;
    sharingProtocols: string[];
  };
}

/**
 * Get cultural context for a community
 */
export async function getCulturalContext(communityId: string): Promise<CulturalContext | null> {
  try {
    const { data, error } = await supabase
      .from('cultural_contexts')
      .select('*')
      .eq('community_id', communityId)
      .single();

    if (error) {
      console.error('Error fetching cultural context:', error);
      return null;
    }

    return {
      id: data.id,
      communityId: data.community_id,
      languageGroup: data.language_group,
      traditionalName: data.traditional_name,
      culturalProtocols: data.cultural_protocols || [],
      sacredSites: data.sacred_sites || [],
      culturalPractices: data.cultural_practices || [],
      storytellingProtocols: data.storytelling_protocols || [],
      knowledgeKeepers: data.knowledge_keepers || [],
      seasonalConsiderations: data.seasonal_considerations || [],
      genderProtocols: data.gender_protocols || [],
      ageGroupProtocols: data.age_group_protocols || [],
      visualizationPreferences: data.visualization_preferences || {
        colorScheme: 'earth-tones',
        symbolism: [],
        avoidedSymbols: [],
        preferredLayouts: []
      },
      languagePreferences: data.language_preferences || {
        primaryLanguage: 'English',
        secondaryLanguages: [],
        culturalTerms: {},
        avoidedTerms: []
      },
      accessRestrictions: data.access_restrictions || {
        menOnly: [],
        womenOnly: [],
        eldersOnly: [],
        initiatedOnly: [],
        communityOnly: []
      }
    };
  } catch (error) {
    console.error('Error in getCulturalContext:', error);
    return null;
  }
}

/**
 * Get active cultural lenses for a community
 */
export async function getCulturalLenses(communityId: string): Promise<CulturalLens[]> {
  try {
    const { data, error } = await supabase
      .from('cultural_lenses')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching cultural lenses:', error);
      return [];
    }

    return data?.map(lens => ({
      id: lens.id,
      name: lens.name,
      description: lens.description,
      communityId: lens.community_id,
      filterCriteria: lens.filter_criteria || {},
      transformationRules: lens.transformation_rules || {},
      visualizationRules: lens.visualization_rules || {},
      isActive: lens.is_active
    })) || [];
  } catch (error) {
    console.error('Error in getCulturalLenses:', error);
    return [];
  }
}

/**
 * Apply cultural context to an insight
 */
export async function applyCulturalContext(
  insight: any,
  communityId: string,
  userRole?: string
): Promise<CulturallyContextualizedInsight> {
  try {
    // Get cultural context and lenses
    const [culturalContext, culturalLenses] = await Promise.all([
      getCulturalContext(communityId),
      getCulturalLenses(communityId)
    ]);

    if (!culturalContext) {
      throw new Error('Cultural context not found for community');
    }

    // Apply relevant cultural lenses
    const applicableLenses = culturalLenses.filter(lens => 
      isLensApplicable(lens, insight, userRole)
    );

    // Transform content through cultural lenses
    const contextualizedContent = await transformContentThroughLenses(
      insight,
      culturalContext,
      applicableLenses
    );

    // Apply visualization context
    const visualizationContext = applyVisualizationContext(
      culturalContext,
      applicableLenses
    );

    // Determine access control
    const accessControl = determineAccessControl(
      insight,
      culturalContext,
      applicableLenses,
      userRole
    );

    // Check for traditional knowledge
    const traditionalKnowledgeFlags = checkTraditionalKnowledge(
      insight,
      culturalContext
    );

    return {
      originalInsight: insight,
      culturalContext,
      appliedLenses: applicableLenses,
      contextualizedContent,
      visualizationContext,
      accessControl,
      traditionalKnowledgeFlags
    };
  } catch (error) {
    console.error('Error applying cultural context:', error);
    throw error;
  }
}

/**
 * Check if a cultural lens is applicable to an insight
 */
function isLensApplicable(
  lens: CulturalLens,
  insight: any,
  userRole?: string
): boolean {
  const { filterCriteria } = lens;

  // Check content type
  if (filterCriteria.contentTypes?.length > 0) {
    if (!filterCriteria.contentTypes.includes(insight.type)) {
      return false;
    }
  }

  // Check themes
  if (filterCriteria.themes?.length > 0) {
    const insightThemes = insight.themes || [];
    const hasMatchingTheme = filterCriteria.themes.some(theme =>
      insightThemes.includes(theme)
    );
    if (!hasMatchingTheme) {
      return false;
    }
  }

  // Check sensitivity level and user permissions
  if (filterCriteria.sensitivity && filterCriteria.requiredApprovals?.length > 0) {
    // This would integrate with user permission system
    // For now, assume basic role-based access
    const hasRequiredRole = userRole && ['elder', 'cultural_authority', 'admin'].includes(userRole);
    if (filterCriteria.sensitivity === 'sacred' && !hasRequiredRole) {
      return false;
    }
  }

  return true;
}

/**
 * Transform content through cultural lenses
 */
async function transformContentThroughLenses(
  insight: any,
  culturalContext: CulturalContext,
  lenses: CulturalLens[]
): Promise<any> {
  let transformedContent = {
    title: insight.title || '',
    description: insight.description || '',
    culturalFraming: '',
    respectfulLanguage: insight.description || '',
    traditionalPerspective: undefined as string | undefined
  };

  // Apply terminology transformations
  for (const lens of lenses) {
    const { terminology, contextualFraming, culturalNarrative } = lens.transformationRules;

    // Replace terminology
    if (terminology) {
      Object.entries(terminology).forEach(([original, replacement]) => {
        transformedContent.title = transformedContent.title.replace(
          new RegExp(original, 'gi'),
          replacement
        );
        transformedContent.description = transformedContent.description.replace(
          new RegExp(original, 'gi'),
          replacement
        );
        transformedContent.respectfulLanguage = transformedContent.respectfulLanguage.replace(
          new RegExp(original, 'gi'),
          replacement
        );
      });
    }

    // Add cultural framing
    if (contextualFraming?.length > 0) {
      transformedContent.culturalFraming = contextualFraming.join(' ');
    }

    // Add cultural narrative
    if (culturalNarrative) {
      transformedContent.traditionalPerspective = culturalNarrative;
    }
  }

  // Apply language preferences
  const { culturalTerms, avoidedTerms } = culturalContext.languagePreferences;
  
  // Replace with cultural terms
  Object.entries(culturalTerms).forEach(([standard, cultural]) => {
    transformedContent.title = transformedContent.title.replace(
      new RegExp(standard, 'gi'),
      cultural
    );
    transformedContent.respectfulLanguage = transformedContent.respectfulLanguage.replace(
      new RegExp(standard, 'gi'),
      cultural
    );
  });

  // Flag avoided terms (would typically trigger review)
  avoidedTerms.forEach(term => {
    if (transformedContent.respectfulLanguage.toLowerCase().includes(term.toLowerCase())) {
      console.warn(`Content contains avoided term: ${term}`);
      // In production, this would trigger cultural review
    }
  });

  return transformedContent;
}

/**
 * Apply visualization context based on cultural preferences
 */
function applyVisualizationContext(
  culturalContext: CulturalContext,
  lenses: CulturalLens[]
): any {
  const { visualizationPreferences } = culturalContext;
  
  let visualizationContext = {
    colorScheme: visualizationPreferences.colorScheme || 'earth-tones',
    culturalSymbols: visualizationPreferences.symbolism || [],
    layoutStyle: visualizationPreferences.preferredLayouts?.[0] || 'traditional',
    accessibilityNotes: [] as string[]
  };

  // Apply lens-specific visualization rules
  lenses.forEach(lens => {
    const { colorMappings, symbolReplacements, layoutPreferences, culturalElements } = lens.visualizationRules;

    if (colorMappings) {
      // Apply color mappings (would be used by visualization components)
      visualizationContext.colorScheme = Object.values(colorMappings)[0] || visualizationContext.colorScheme;
    }

    if (culturalElements?.length > 0) {
      visualizationContext.culturalSymbols = [
        ...visualizationContext.culturalSymbols,
        ...culturalElements
      ];
    }

    if (layoutPreferences?.length > 0) {
      visualizationContext.layoutStyle = layoutPreferences[0];
    }
  });

  // Add accessibility notes based on cultural protocols
  if (culturalContext.genderProtocols?.length > 0) {
    visualizationContext.accessibilityNotes.push('Gender-specific viewing protocols apply');
  }

  if (culturalContext.ageGroupProtocols?.length > 0) {
    visualizationContext.accessibilityNotes.push('Age-appropriate content considerations');
  }

  return visualizationContext;
}

/**
 * Determine access control based on cultural context
 */
function determineAccessControl(
  insight: any,
  culturalContext: CulturalContext,
  lenses: CulturalLens[],
  userRole?: string
): any {
  let accessControl = {
    visibility: 'public' as 'public' | 'community' | 'restricted' | 'sacred',
    requiredPermissions: [] as string[],
    culturalApprovals: [] as string[]
  };

  // Check if insight contains restricted content
  const { accessRestrictions } = culturalContext;
  const insightContent = (insight.description || '').toLowerCase();

  // Check for gender-restricted content
  if (accessRestrictions.menOnly?.some(term => insightContent.includes(term.toLowerCase()))) {
    accessControl.visibility = 'restricted';
    accessControl.requiredPermissions.push('male_access');
  }

  if (accessRestrictions.womenOnly?.some(term => insightContent.includes(term.toLowerCase()))) {
    accessControl.visibility = 'restricted';
    accessControl.requiredPermissions.push('female_access');
  }

  // Check for elder-only content
  if (accessRestrictions.eldersOnly?.some(term => insightContent.includes(term.toLowerCase()))) {
    accessControl.visibility = 'restricted';
    accessControl.requiredPermissions.push('elder_access');
  }

  // Check for sacred content
  if (accessRestrictions.initiatedOnly?.some(term => insightContent.includes(term.toLowerCase()))) {
    accessControl.visibility = 'sacred';
    accessControl.requiredPermissions.push('initiated_access');
    accessControl.culturalApprovals.push('elder_approval');
  }

  // Apply lens-specific access controls
  lenses.forEach(lens => {
    if (lens.filterCriteria.sensitivity) {
      if (lens.filterCriteria.sensitivity === 'sacred' && accessControl.visibility !== 'sacred') {
        accessControl.visibility = 'restricted';
      }
    }

    if (lens.filterCriteria.requiredApprovals?.length > 0) {
      accessControl.culturalApprovals = [
        ...accessControl.culturalApprovals,
        ...lens.filterCriteria.requiredApprovals
      ];
    }
  });

  return accessControl;
}

/**
 * Check for traditional knowledge in insight
 */
function checkTraditionalKnowledge(
  insight: any,
  culturalContext: CulturalContext
): any {
  const traditionalKnowledgeFlags = {
    containsTraditionalKnowledge: false,
    knowledgeType: [] as string[],
    protectionLevel: 'none',
    sharingProtocols: [] as string[]
  };

  const insightContent = (insight.description || '').toLowerCase();
  const { culturalPractices, storytellingProtocols, sacredSites } = culturalContext;

  // Check for cultural practices
  if (culturalPractices?.some(practice => insightContent.includes(practice.toLowerCase()))) {
    traditionalKnowledgeFlags.containsTraditionalKnowledge = true;
    traditionalKnowledgeFlags.knowledgeType.push('cultural_practices');
    traditionalKnowledgeFlags.protectionLevel = 'community';
  }

  // Check for sacred sites
  if (sacredSites?.some(site => insightContent.includes(site.toLowerCase()))) {
    traditionalKnowledgeFlags.containsTraditionalKnowledge = true;
    traditionalKnowledgeFlags.knowledgeType.push('sacred_sites');
    traditionalKnowledgeFlags.protectionLevel = 'sacred';
  }

  // Apply storytelling protocols
  if (traditionalKnowledgeFlags.containsTraditionalKnowledge) {
    traditionalKnowledgeFlags.sharingProtocols = storytellingProtocols || [];
  }

  return traditionalKnowledgeFlags;
}

/**
 * Get culturally appropriate color scheme
 */
export function getCulturalColorScheme(culturalContext: CulturalContext): Record<string, string> {
  const { colorScheme } = culturalContext.visualizationPreferences;

  const colorSchemes: Record<string, Record<string, string>> = {
    'earth-tones': {
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#CD853F',
      background: '#F5E6D3',
      text: '#3E2723'
    },
    'ochre-red': {
      primary: '#CC5500',
      secondary: '#FF6600',
      accent: '#FF8C42',
      background: '#FFF8DC',
      text: '#8B0000'
    },
    'desert-sand': {
      primary: '#C19A6B',
      secondary: '#DEB887',
      accent: '#F4A460',
      background: '#FDF5E6',
      text: '#8B4513'
    },
    'river-blue': {
      primary: '#4682B4',
      secondary: '#87CEEB',
      accent: '#B0E0E6',
      background: '#F0F8FF',
      text: '#191970'
    }
  };

  return colorSchemes[colorScheme] || colorSchemes['earth-tones'];
}

/**
 * Apply cultural context to multiple insights
 */
export async function applyCulturalContextToInsights(
  insights: any[],
  communityId: string,
  userRole?: string
): Promise<CulturallyContextualizedInsight[]> {
  try {
    const contextualizedInsights = await Promise.all(
      insights.map(insight => applyCulturalContext(insight, communityId, userRole))
    );

    return contextualizedInsights;
  } catch (error) {
    console.error('Error applying cultural context to insights:', error);
    return [];
  }
}

/**
 * Create or update cultural context for a community
 */
export async function updateCulturalContext(
  communityId: string,
  contextData: Partial<CulturalContext>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('cultural_contexts')
      .upsert({
        community_id: communityId,
        language_group: contextData.languageGroup,
        traditional_name: contextData.traditionalName,
        cultural_protocols: contextData.culturalProtocols,
        sacred_sites: contextData.sacredSites,
        cultural_practices: contextData.culturalPractices,
        storytelling_protocols: contextData.storytellingProtocols,
        knowledge_keepers: contextData.knowledgeKeepers,
        seasonal_considerations: contextData.seasonalConsiderations,
        gender_protocols: contextData.genderProtocols,
        age_group_protocols: contextData.ageGroupProtocols,
        visualization_preferences: contextData.visualizationPreferences,
        language_preferences: contextData.languagePreferences,
        access_restrictions: contextData.accessRestrictions,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update cultural context: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating cultural context:', error);
    throw error;
  }
}

/**
 * Create or update cultural lens
 */
export async function updateCulturalLens(
  lensData: Partial<CulturalLens> & { communityId: string }
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('cultural_lenses')
      .upsert({
        id: lensData.id,
        name: lensData.name,
        description: lensData.description,
        community_id: lensData.communityId,
        filter_criteria: lensData.filterCriteria,
        transformation_rules: lensData.transformationRules,
        visualization_rules: lensData.visualizationRules,
        is_active: lensData.isActive ?? true,
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to update cultural lens: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error updating cultural lens:', error);
    throw error;
  }
}