import { supabase } from '@/lib/db/supabase';
import { analyzeDocumentChunk } from '@/lib/ai-service';

export interface StoryNode {
  id: string;
  storyId: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  perspective: 'individual' | 'family' | 'community' | 'organizational' | 'systemic';
  themes: string[];
  outcomes: string[];
  connections: StoryConnection[];
  timeframe: string;
  location?: string;
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  multimedia?: {
    images: string[];
    audio: string[];
    video: string[];
  };
  metadata: {
    impactLevel: 'low' | 'medium' | 'high';
    verificationStatus: 'verified' | 'pending' | 'unverified';
    engagementScore: number;
    viewCount: number;
    shareCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryConnection {
  id: string;
  fromStoryId: string;
  toStoryId: string;
  connectionType: 'causal' | 'temporal' | 'thematic' | 'geographic' | 'stakeholder';
  strength: number; // 0-1
  description: string;
  evidence: string[];
  verified: boolean;
}

export interface OutcomePathway {
  id: string;
  title: string;
  description: string;
  startingStories: string[];
  pathwaySteps: PathwayStep[];
  outcomes: PathwayOutcome[];
  stakeholders: string[];
  timespan: {
    start: Date;
    end: Date;
    duration: string;
  };
  impactMetrics: {
    reach: number;
    depth: number;
    sustainability: number;
  };
  culturalSignificance: string;
  lessonsLearned: string[];
  replicationPotential: 'low' | 'medium' | 'high';
}

export interface PathwayStep {
  id: string;
  order: number;
  title: string;
  description: string;
  relatedStories: string[];
  keyActions: string[];
  stakeholdersInvolved: string[];
  challenges: string[];
  enablers: string[];
  timeframe: string;
  evidence: string[];
}

export interface PathwayOutcome {
  id: string;
  title: string;
  description: string;
  outcomeType: 'individual' | 'community' | 'systemic' | 'policy' | 'cultural';
  measurableIndicators: string[];
  evidenceStories: string[];
  impactLevel: 'low' | 'medium' | 'high';
  sustainability: 'temporary' | 'ongoing' | 'permanent';
  unintendedConsequences: string[];
}

export interface StoryExploration {
  id: string;
  title: string;
  description: string;
  centralTheme: string;
  storyNodes: StoryNode[];
  connections: StoryConnection[];
  pathways: OutcomePathway[];
  perspectives: {
    individual: StoryNode[];
    family: StoryNode[];
    community: StoryNode[];
    organizational: StoryNode[];
    systemic: StoryNode[];
  };
  timeline: {
    events: TimelineEvent[];
    milestones: Milestone[];
  };
  geographicDistribution: {
    locations: LocationData[];
    clusters: GeographicCluster[];
  };
  culturalContext: {
    traditionalKnowledge: string[];
    culturalPractices: string[];
    languageElements: string[];
    sacredAspects: string[];
  };
  interactiveElements: {
    filters: FilterOption[];
    visualizations: VisualizationConfig[];
    narrativeFlows: NarrativeFlow[];
  };
}

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  relatedStories: string[];
  eventType: 'milestone' | 'challenge' | 'breakthrough' | 'setback' | 'celebration';
  impact: 'low' | 'medium' | 'high';
}

export interface Milestone {
  id: string;
  date: Date;
  title: string;
  description: string;
  achievementType: 'individual' | 'community' | 'systemic';
  relatedStories: string[];
  metrics: { name: string; value: number; unit: string }[];
}

export interface LocationData {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  storyCount: number;
  relatedStories: string[];
  significance: string;
}

export interface GeographicCluster {
  id: string;
  centerPoint: { lat: number; lng: number };
  radius: number;
  storyCount: number;
  dominantThemes: string[];
  clusterType: 'urban' | 'rural' | 'remote' | 'traditional';
}

export interface FilterOption {
  id: string;
  name: string;
  type: 'theme' | 'perspective' | 'timeframe' | 'location' | 'outcome' | 'cultural_safety';
  options: { value: string; label: string; count: number }[];
}

export interface VisualizationConfig {
  id: string;
  type: 'network' | 'timeline' | 'map' | 'flow' | 'tree' | 'matrix';
  title: string;
  description: string;
  dataSource: string;
  interactiveFeatures: string[];
}

export interface NarrativeFlow {
  id: string;
  title: string;
  description: string;
  startingPoint: string;
  flowSteps: FlowStep[];
  branchingPoints: BranchingPoint[];
  endings: FlowEnding[];
}

export interface FlowStep {
  id: string;
  order: number;
  storyId: string;
  transitionText: string;
  choices?: { text: string; nextStepId: string }[];
}

export interface BranchingPoint {
  id: string;
  stepId: string;
  question: string;
  options: { text: string; nextFlowId: string; description: string }[];
}

export interface FlowEnding {
  id: string;
  title: string;
  summary: string;
  keyLearnings: string[];
  relatedPathways: string[];
  callToAction?: string;
}/**
 * C
reate a dynamic story exploration from existing stories
 */
export async function createStoryExploration(
  communityId: string,
  config: {
    centralTheme?: string;
    timeRange?: { start: Date; end: Date };
    culturalSafetyLevel?: 'public' | 'community' | 'restricted' | 'sacred';
    includeMultimedia?: boolean;
    maxStories?: number;
  }
): Promise<StoryExploration> {
  try {
    // Get stories from the database
    const stories = await getStoriesForExploration(communityId, config);
    
    // Convert stories to story nodes
    const storyNodes = await Promise.all(
      stories.map(story => convertToStoryNode(story))
    );

    // Analyze connections between stories
    const connections = await analyzeStoryConnections(storyNodes);

    // Generate outcome pathways
    const pathways = await generateOutcomePathways(storyNodes, connections);

    // Organize by perspectives
    const perspectives = organizeByPerspectives(storyNodes);

    // Create timeline
    const timeline = await createTimeline(storyNodes);

    // Analyze geographic distribution
    const geographicDistribution = await analyzeGeographicDistribution(storyNodes);

    // Extract cultural context
    const culturalContext = await extractCulturalContext(storyNodes);

    // Generate interactive elements
    const interactiveElements = await generateInteractiveElements(
      storyNodes, 
      connections, 
      pathways
    );

    const exploration: StoryExploration = {
      id: `exploration-${communityId}-${Date.now()}`,
      title: config.centralTheme 
        ? `Stories of ${config.centralTheme}` 
        : 'Community Story Exploration',
      description: `Interactive exploration of ${storyNodes.length} community stories`,
      centralTheme: config.centralTheme || 'Community Journey',
      storyNodes,
      connections,
      pathways,
      perspectives,
      timeline,
      geographicDistribution,
      culturalContext,
      interactiveElements
    };

    // Save exploration to database
    await saveStoryExploration(exploration);

    return exploration;
  } catch (error) {
    console.error('Error creating story exploration:', error);
    throw error;
  }
}

/**
 * Get stories suitable for exploration
 */
async function getStoriesForExploration(
  communityId: string,
  config: any
): Promise<any[]> {
  try {
    const safetyLevels = ['public', 'community', 'restricted', 'sacred'];
    const maxSafetyIndex = safetyLevels.indexOf(config.culturalSafetyLevel || 'public');
    const allowedLevels = safetyLevels.slice(0, maxSafetyIndex + 1);

    let query = supabase
      .from('enhanced_community_stories')
      .select('*')
      .eq('community_id', communityId)
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .in('cultural_safety', allowedLevels)
      .order('created_at', { ascending: false });

    if (config.timeRange) {
      query = query
        .gte('created_at', config.timeRange.start.toISOString())
        .lte('created_at', config.timeRange.end.toISOString());
    }

    if (config.maxStories) {
      query = query.limit(config.maxStories);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching stories for exploration:', error);
    return [];
  }
}

/**
 * Convert database story to story node
 */
async function convertToStoryNode(story: any): Promise<StoryNode> {
  return {
    id: story.id,
    storyId: story.id,
    title: story.title,
    content: story.content,
    author: story.author_name,
    authorRole: story.author_role || 'Community Member',
    perspective: determinePerspective(story.content, story.themes),
    themes: story.themes || [],
    outcomes: story.outcomes || [],
    connections: [], // Will be populated later
    timeframe: story.timeframe || 'Recent',
    location: story.location,
    culturalSafety: story.cultural_safety,
    multimedia: {
      images: story.photos || [],
      audio: story.audio_files || [],
      video: story.videos || []
    },
    metadata: {
      impactLevel: determineImpactLevel(story.content, story.themes),
      verificationStatus: story.verification_status || 'unverified',
      engagementScore: calculateEngagementScore(story),
      viewCount: story.view_count || 0,
      shareCount: story.share_count || 0
    },
    createdAt: new Date(story.created_at),
    updatedAt: new Date(story.updated_at || story.created_at)
  };
}

/**
 * Determine story perspective based on content and themes
 */
function determinePerspective(content: string, themes: string[]): StoryNode['perspective'] {
  const contentLower = content.toLowerCase();
  const themeString = themes.join(' ').toLowerCase();
  
  if (contentLower.includes('policy') || contentLower.includes('government') || 
      contentLower.includes('system') || themeString.includes('systemic')) {
    return 'systemic';
  }
  
  if (contentLower.includes('organization') || contentLower.includes('service') || 
      contentLower.includes('program') || themeString.includes('organizational')) {
    return 'organizational';
  }
  
  if (contentLower.includes('community') || contentLower.includes('together') || 
      contentLower.includes('collective') || themeString.includes('community')) {
    return 'community';
  }
  
  if (contentLower.includes('family') || contentLower.includes('children') || 
      contentLower.includes('parent') || themeString.includes('family')) {
    return 'family';
  }
  
  return 'individual';
}

/**
 * Determine impact level based on content analysis
 */
function determineImpactLevel(content: string, themes: string[]): 'low' | 'medium' | 'high' {
  const contentLower = content.toLowerCase();
  const themeString = themes.join(' ').toLowerCase();
  
  const highImpactKeywords = [
    'transformed', 'revolutionary', 'breakthrough', 'significant change',
    'major improvement', 'life-changing', 'community-wide', 'systemic change'
  ];
  
  const mediumImpactKeywords = [
    'improved', 'better', 'positive change', 'progress', 'development',
    'growth', 'enhancement', 'advancement'
  ];
  
  if (highImpactKeywords.some(keyword => 
    contentLower.includes(keyword) || themeString.includes(keyword)
  )) {
    return 'high';
  }
  
  if (mediumImpactKeywords.some(keyword => 
    contentLower.includes(keyword) || themeString.includes(keyword)
  )) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Calculate engagement score based on story metrics
 */
function calculateEngagementScore(story: any): number {
  const views = story.view_count || 0;
  const shares = story.share_count || 0;
  const comments = story.comment_count || 0;
  const likes = story.like_count || 0;
  
  // Weighted engagement score
  return Math.min(
    (views * 0.1 + shares * 2 + comments * 3 + likes * 1) / 10,
    10
  );
}

/**
 * Analyze connections between stories using AI
 */
async function analyzeStoryConnections(storyNodes: StoryNode[]): Promise<StoryConnection[]> {
  try {
    const connections: StoryConnection[] = [];
    
    // Analyze each pair of stories for potential connections
    for (let i = 0; i < storyNodes.length; i++) {
      for (let j = i + 1; j < storyNodes.length; j++) {
        const story1 = storyNodes[i];
        const story2 = storyNodes[j];
        
        const connection = await analyzeStoryPair(story1, story2);
        if (connection) {
          connections.push(connection);
        }
      }
    }
    
    return connections;
  } catch (error) {
    console.error('Error analyzing story connections:', error);
    return [];
  }
}

/**
 * Analyze a pair of stories for connections
 */
async function analyzeStoryPair(
  story1: StoryNode, 
  story2: StoryNode
): Promise<StoryConnection | null> {
  try {
    // Quick filters to avoid unnecessary AI calls
    const hasCommonThemes = story1.themes.some(theme => story2.themes.includes(theme));
    const hasCommonOutcomes = story1.outcomes.some(outcome => story2.outcomes.includes(outcome));
    const sameLocation = story1.location && story2.location && 
                        story1.location === story2.location;
    const sameAuthor = story1.author === story2.author;
    
    if (!hasCommonThemes && !hasCommonOutcomes && !sameLocation && !sameAuthor) {
      return null;
    }

    const analysisPrompt = `
Analyze these two community stories for connections:

Story 1: "${story1.title}"
Content: ${story1.content.substring(0, 300)}
Themes: ${story1.themes.join(', ')}
Author: ${story1.author} (${story1.authorRole})
Outcomes: ${story1.outcomes.join(', ')}

Story 2: "${story2.title}"
Content: ${story2.content.substring(0, 300)}
Themes: ${story2.themes.join(', ')}
Author: ${story2.author} (${story2.authorRole})
Outcomes: ${story2.outcomes.join(', ')}

Determine if there's a meaningful connection and classify it:
- causal: One story led to or influenced the other
- temporal: Stories are part of a sequence over time
- thematic: Stories share important themes or topics
- geographic: Stories are connected by location
- stakeholder: Stories involve the same people or organizations

Return JSON with: {
  "hasConnection": boolean,
  "connectionType": string,
  "strength": number (0-1),
  "description": string,
  "evidence": [string array]
}
`;

    const analysis = await analyzeDocumentChunk(analysisPrompt, 'story_connection');
    
    try {
      const result = JSON.parse(analysis.analysis);
      
      if (result.hasConnection && result.strength > 0.3) {
        return {
          id: `connection-${story1.id}-${story2.id}`,
          fromStoryId: story1.id,
          toStoryId: story2.id,
          connectionType: result.connectionType,
          strength: result.strength,
          description: result.description,
          evidence: result.evidence || [],
          verified: false
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse connection analysis:', parseError);
    }
    
    return null;
  } catch (error) {
    console.error('Error analyzing story pair:', error);
    return null;
  }
}

/**
 * Generate outcome pathways from connected stories
 */
async function generateOutcomePathways(
  storyNodes: StoryNode[],
  connections: StoryConnection[]
): Promise<OutcomePathway[]> {
  try {
    // Group connected stories into potential pathways
    const pathwayGroups = identifyPathwayGroups(storyNodes, connections);
    
    const pathways: OutcomePathway[] = [];
    
    for (const group of pathwayGroups) {
      const pathway = await createPathwayFromGroup(group, storyNodes, connections);
      if (pathway) {
        pathways.push(pathway);
      }
    }
    
    return pathways;
  } catch (error) {
    console.error('Error generating outcome pathways:', error);
    return [];
  }
}

/**
 * Identify groups of connected stories that form pathways
 */
function identifyPathwayGroups(
  storyNodes: StoryNode[],
  connections: StoryConnection[]
): string[][] {
  const groups: string[][] = [];
  const visited = new Set<string>();
  
  // Use depth-first search to find connected components
  for (const node of storyNodes) {
    if (!visited.has(node.id)) {
      const group = exploreConnectedStories(node.id, connections, visited);
      if (group.length >= 2) { // Only consider groups with multiple stories
        groups.push(group);
      }
    }
  }
  
  return groups;
}

/**
 * Explore connected stories using DFS
 */
function exploreConnectedStories(
  startId: string,
  connections: StoryConnection[],
  visited: Set<string>
): string[] {
  const group: string[] = [];
  const stack = [startId];
  
  while (stack.length > 0) {
    const currentId = stack.pop()!;
    
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    group.push(currentId);
    
    // Find connected stories
    const connectedIds = connections
      .filter(conn => 
        (conn.fromStoryId === currentId || conn.toStoryId === currentId) &&
        conn.strength > 0.5 // Only strong connections
      )
      .map(conn => 
        conn.fromStoryId === currentId ? conn.toStoryId : conn.fromStoryId
      )
      .filter(id => !visited.has(id));
    
    stack.push(...connectedIds);
  }
  
  return group;
}

/**
 * Create pathway from a group of connected stories
 */
async function createPathwayFromGroup(
  storyIds: string[],
  storyNodes: StoryNode[],
  connections: StoryConnection[]
): Promise<OutcomePathway | null> {
  try {
    const groupStories = storyNodes.filter(node => storyIds.includes(node.id));
    const groupConnections = connections.filter(conn => 
      storyIds.includes(conn.fromStoryId) && storyIds.includes(conn.toStoryId)
    );
    
    if (groupStories.length < 2) return null;
    
    // Analyze the pathway using AI
    const pathwayPrompt = `
Analyze this group of connected community stories to create an outcome pathway:

Stories:
${groupStories.map(story => `
- "${story.title}" by ${story.author}
  Content: ${story.content.substring(0, 200)}
  Themes: ${story.themes.join(', ')}
  Outcomes: ${story.outcomes.join(', ')}
`).join('\n')}

Connections:
${groupConnections.map(conn => `
- ${conn.connectionType}: ${conn.description} (strength: ${conn.strength})
`).join('\n')}

Create an outcome pathway that shows:
1. The overall journey or transformation
2. Key steps in chronological order
3. Final outcomes achieved
4. Stakeholders involved
5. Lessons learned

Return JSON format with pathway structure.
`;

    const analysis = await analyzeDocumentChunk(pathwayPrompt, 'pathway_generation');
    
    // Create pathway structure (simplified for now)
    const pathway: OutcomePathway = {
      id: `pathway-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Journey of ${groupStories[0].themes[0] || 'Community Change'}`,
      description: `Pathway showing the journey through ${groupStories.length} connected stories`,
      startingStories: [groupStories[0].id],
      pathwaySteps: await generatePathwaySteps(groupStories, groupConnections),
      outcomes: await generatePathwayOutcomes(groupStories),
      stakeholders: [...new Set(groupStories.map(story => story.author))],
      timespan: {
        start: new Date(Math.min(...groupStories.map(s => s.createdAt.getTime()))),
        end: new Date(Math.max(...groupStories.map(s => s.createdAt.getTime()))),
        duration: calculateDuration(groupStories)
      },
      impactMetrics: {
        reach: groupStories.length,
        depth: Math.max(...groupStories.map(s => s.metadata.impactLevel === 'high' ? 3 : s.metadata.impactLevel === 'medium' ? 2 : 1)),
        sustainability: calculateSustainability(groupStories)
      },
      culturalSignificance: extractCulturalSignificance(groupStories),
      lessonsLearned: extractLessonsLearned(groupStories),
      replicationPotential: assessReplicationPotential(groupStories)
    };
    
    return pathway;
  } catch (error) {
    console.error('Error creating pathway from group:', error);
    return null;
  }
}

/**
 * Generate pathway steps from stories and connections
 */
async function generatePathwaySteps(
  stories: StoryNode[],
  connections: StoryConnection[]
): Promise<PathwayStep[]> {
  // Sort stories chronologically
  const sortedStories = stories.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  return sortedStories.map((story, index) => ({
    id: `step-${story.id}`,
    order: index + 1,
    title: story.title,
    description: story.content.substring(0, 200) + '...',
    relatedStories: [story.id],
    keyActions: extractKeyActions(story.content),
    stakeholdersInvolved: [story.author],
    challenges: extractChallenges(story.content),
    enablers: extractEnablers(story.content),
    timeframe: story.timeframe,
    evidence: [story.content]
  }));
}

/**
 * Generate pathway outcomes from stories
 */
async function generatePathwayOutcomes(stories: StoryNode[]): Promise<PathwayOutcome[]> {
  const allOutcomes = stories.flatMap(story => story.outcomes);
  const uniqueOutcomes = [...new Set(allOutcomes)];
  
  return uniqueOutcomes.map((outcome, index) => ({
    id: `outcome-${index}`,
    title: outcome,
    description: `Outcome achieved through the community journey`,
    outcomeType: determineOutcomeType(outcome),
    measurableIndicators: extractMeasurableIndicators(outcome),
    evidenceStories: stories
      .filter(story => story.outcomes.includes(outcome))
      .map(story => story.id),
    impactLevel: 'medium' as const,
    sustainability: 'ongoing' as const,
    unintendedConsequences: []
  }));
}

// Helper functions for pathway generation
function calculateDuration(stories: StoryNode[]): string {
  const start = Math.min(...stories.map(s => s.createdAt.getTime()));
  const end = Math.max(...stories.map(s => s.createdAt.getTime()));
  const diffMonths = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
  
  if (diffMonths < 1) return 'Less than a month';
  if (diffMonths < 12) return `${diffMonths} months`;
  return `${Math.round(diffMonths / 12)} years`;
}

function calculateSustainability(stories: StoryNode[]): number {
  // Simple heuristic based on story themes and outcomes
  const sustainabilityKeywords = ['ongoing', 'permanent', 'lasting', 'continued', 'established'];
  const sustainabilityScore = stories.reduce((score, story) => {
    const content = (story.content + ' ' + story.outcomes.join(' ')).toLowerCase();
    const matches = sustainabilityKeywords.filter(keyword => content.includes(keyword)).length;
    return score + matches;
  }, 0);
  
  return Math.min(sustainabilityScore / stories.length, 1);
}

function extractCulturalSignificance(stories: StoryNode[]): string {
  const culturalKeywords = stories.flatMap(story => 
    story.themes.filter(theme => 
      theme.toLowerCase().includes('cultural') || 
      theme.toLowerCase().includes('traditional') ||
      theme.toLowerCase().includes('indigenous')
    )
  );
  
  return culturalKeywords.length > 0 
    ? `Significant cultural elements: ${[...new Set(culturalKeywords)].join(', ')}`
    : 'Community-driven initiative with local significance';
}

function extractLessonsLearned(stories: StoryNode[]): string[] {
  // Extract lessons from story content (simplified)
  const lessons: string[] = [];
  
  stories.forEach(story => {
    const content = story.content.toLowerCase();
    if (content.includes('learned') || content.includes('lesson')) {
      lessons.push(`From ${story.title}: Key learning about community engagement`);
    }
  });
  
  return lessons.length > 0 ? lessons : [
    'Community collaboration is essential for success',
    'Cultural sensitivity improves program effectiveness',
    'Local leadership drives sustainable change'
  ];
}

function assessReplicationPotential(stories: StoryNode[]): 'low' | 'medium' | 'high' {
  const replicationKeywords = ['model', 'template', 'approach', 'method', 'framework'];
  const score = stories.reduce((total, story) => {
    const content = story.content.toLowerCase();
    return total + replicationKeywords.filter(keyword => content.includes(keyword)).length;
  }, 0);
  
  if (score >= stories.length) return 'high';
  if (score >= stories.length / 2) return 'medium';
  return 'low';
}

function determineOutcomeType(outcome: string): PathwayOutcome['outcomeType'] {
  const outcomeLower = outcome.toLowerCase();
  
  if (outcomeLower.includes('policy') || outcomeLower.includes('law')) return 'policy';
  if (outcomeLower.includes('cultural') || outcomeLower.includes('traditional')) return 'cultural';
  if (outcomeLower.includes('system') || outcomeLower.includes('institutional')) return 'systemic';
  if (outcomeLower.includes('community') || outcomeLower.includes('collective')) return 'community';
  return 'individual';
}

function extractMeasurableIndicators(outcome: string): string[] {
  // Simple extraction of potential metrics
  const indicators: string[] = [];
  
  if (outcome.toLowerCase().includes('increase')) {
    indicators.push('Percentage increase measured');
  }
  if (outcome.toLowerCase().includes('improve')) {
    indicators.push('Improvement score tracked');
  }
  if (outcome.toLowerCase().includes('reduce')) {
    indicators.push('Reduction percentage documented');
  }
  
  return indicators.length > 0 ? indicators : ['Qualitative assessment completed'];
}

function extractKeyActions(content: string): string[] {
  // Simple extraction of action words
  const actionWords = ['implemented', 'created', 'established', 'developed', 'organized'];
  const actions: string[] = [];
  
  actionWords.forEach(action => {
    if (content.toLowerCase().includes(action)) {
      actions.push(`${action.charAt(0).toUpperCase() + action.slice(1)} key initiative`);
    }
  });
  
  return actions.length > 0 ? actions : ['Community action taken'];
}

function extractChallenges(content: string): string[] {
  const challengeWords = ['challenge', 'difficult', 'problem', 'obstacle', 'barrier'];
  const challenges: string[] = [];
  
  challengeWords.forEach(challenge => {
    if (content.toLowerCase().includes(challenge)) {
      challenges.push(`${challenge.charAt(0).toUpperCase() + challenge.slice(1)} encountered`);
    }
  });
  
  return challenges.length > 0 ? challenges : ['Standard implementation challenges'];
}

function extractEnablers(content: string): string[] {
  const enablerWords = ['support', 'help', 'assistance', 'collaboration', 'partnership'];
  const enablers: string[] = [];
  
  enablerWords.forEach(enabler => {
    if (content.toLowerCase().includes(enabler)) {
      enablers.push(`${enabler.charAt(0).toUpperCase() + enabler.slice(1)} provided`);
    }
  });
  
  return enablers.length > 0 ? enablers : ['Community support available'];
}/**
 *
 Organize stories by perspectives
 */
function organizeByPerspectives(storyNodes: StoryNode[]): StoryExploration['perspectives'] {
  return {
    individual: storyNodes.filter(node => node.perspective === 'individual'),
    family: storyNodes.filter(node => node.perspective === 'family'),
    community: storyNodes.filter(node => node.perspective === 'community'),
    organizational: storyNodes.filter(node => node.perspective === 'organizational'),
    systemic: storyNodes.filter(node => node.perspective === 'systemic')
  };
}

/**
 * Create timeline from stories
 */
async function createTimeline(storyNodes: StoryNode[]): Promise<StoryExploration['timeline']> {
  const events: TimelineEvent[] = storyNodes.map(story => ({
    id: `event-${story.id}`,
    date: story.createdAt,
    title: story.title,
    description: story.content.substring(0, 150) + '...',
    relatedStories: [story.id],
    eventType: determineEventType(story.content),
    impact: story.metadata.impactLevel
  }));

  const milestones: Milestone[] = storyNodes
    .filter(story => story.metadata.impactLevel === 'high')
    .map(story => ({
      id: `milestone-${story.id}`,
      date: story.createdAt,
      title: `Milestone: ${story.title}`,
      description: story.content.substring(0, 200),
      achievementType: story.perspective === 'individual' ? 'individual' : 
                     story.perspective === 'systemic' ? 'systemic' : 'community',
      relatedStories: [story.id],
      metrics: [
        { name: 'Impact Level', value: 3, unit: 'score' },
        { name: 'Engagement', value: story.metadata.engagementScore, unit: 'score' }
      ]
    }));

  return { events, milestones };
}

function determineEventType(content: string): TimelineEvent['eventType'] {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('celebrate') || contentLower.includes('success')) return 'celebration';
  if (contentLower.includes('breakthrough') || contentLower.includes('achievement')) return 'breakthrough';
  if (contentLower.includes('challenge') || contentLower.includes('difficult')) return 'challenge';
  if (contentLower.includes('setback') || contentLower.includes('problem')) return 'setback';
  return 'milestone';
}

/**
 * Analyze geographic distribution of stories
 */
async function analyzeGeographicDistribution(
  storyNodes: StoryNode[]
): Promise<StoryExploration['geographicDistribution']> {
  const locations: LocationData[] = [];
  const locationCounts: { [key: string]: { stories: string[], count: number } } = {};

  // Count stories by location
  storyNodes.forEach(story => {
    if (story.location) {
      if (!locationCounts[story.location]) {
        locationCounts[story.location] = { stories: [], count: 0 };
      }
      locationCounts[story.location].stories.push(story.id);
      locationCounts[story.location].count++;
    }
  });

  // Convert to location data (with mock coordinates)
  Object.entries(locationCounts).forEach(([location, data], index) => {
    locations.push({
      id: `location-${index}`,
      name: location,
      coordinates: { lat: -19.2590 + (index * 0.1), lng: 146.8169 + (index * 0.1) }, // Mock coordinates
      storyCount: data.count,
      relatedStories: data.stories,
      significance: data.count > 3 ? 'High activity area' : 'Community location'
    });
  });

  // Simple clustering (mock implementation)
  const clusters: GeographicCluster[] = locations.length > 0 ? [{
    id: 'cluster-1',
    centerPoint: { lat: -19.2590, lng: 146.8169 },
    radius: 50,
    storyCount: storyNodes.length,
    dominantThemes: [...new Set(storyNodes.flatMap(s => s.themes))].slice(0, 3),
    clusterType: 'rural'
  }] : [];

  return { locations, clusters };
}

/**
 * Extract cultural context from stories
 */
async function extractCulturalContext(
  storyNodes: StoryNode[]
): Promise<StoryExploration['culturalContext']> {
  const traditionalKnowledge: string[] = [];
  const culturalPractices: string[] = [];
  const languageElements: string[] = [];
  const sacredAspects: string[] = [];

  storyNodes.forEach(story => {
    const content = story.content.toLowerCase();
    
    // Extract traditional knowledge references
    if (content.includes('traditional') || content.includes('ancestor') || content.includes('elder')) {
      traditionalKnowledge.push(`Traditional knowledge from: ${story.title}`);
    }
    
    // Extract cultural practices
    if (content.includes('ceremony') || content.includes('ritual') || content.includes('custom')) {
      culturalPractices.push(`Cultural practice mentioned in: ${story.title}`);
    }
    
    // Extract language elements
    if (content.includes('language') || story.themes.some(theme => theme.toLowerCase().includes('language'))) {
      languageElements.push(`Language element in: ${story.title}`);
    }
    
    // Extract sacred aspects
    if (story.culturalSafety === 'sacred' || content.includes('sacred') || content.includes('spiritual')) {
      sacredAspects.push(`Sacred aspect in: ${story.title}`);
    }
  });

  return {
    traditionalKnowledge: [...new Set(traditionalKnowledge)],
    culturalPractices: [...new Set(culturalPractices)],
    languageElements: [...new Set(languageElements)],
    sacredAspects: [...new Set(sacredAspects)]
  };
}

/**
 * Generate interactive elements for the exploration
 */
async function generateInteractiveElements(
  storyNodes: StoryNode[],
  connections: StoryConnection[],
  pathways: OutcomePathway[]
): Promise<StoryExploration['interactiveElements']> {
  // Generate filters
  const filters: FilterOption[] = [
    {
      id: 'theme-filter',
      name: 'Themes',
      type: 'theme',
      options: generateFilterOptions(storyNodes.flatMap(s => s.themes))
    },
    {
      id: 'perspective-filter',
      name: 'Perspectives',
      type: 'perspective',
      options: generateFilterOptions(storyNodes.map(s => s.perspective))
    },
    {
      id: 'cultural-safety-filter',
      name: 'Cultural Safety',
      type: 'cultural_safety',
      options: generateFilterOptions(storyNodes.map(s => s.culturalSafety))
    }
  ];

  // Generate visualizations
  const visualizations: VisualizationConfig[] = [
    {
      id: 'network-viz',
      type: 'network',
      title: 'Story Connections Network',
      description: 'Interactive network showing how stories connect to each other',
      dataSource: 'connections',
      interactiveFeatures: ['zoom', 'pan', 'node_selection', 'filtering']
    },
    {
      id: 'timeline-viz',
      type: 'timeline',
      title: 'Story Timeline',
      description: 'Chronological view of stories and milestones',
      dataSource: 'timeline',
      interactiveFeatures: ['zoom', 'filtering', 'detail_view']
    },
    {
      id: 'pathway-flow',
      type: 'flow',
      title: 'Outcome Pathways',
      description: 'Visual representation of how stories lead to outcomes',
      dataSource: 'pathways',
      interactiveFeatures: ['step_navigation', 'branching', 'outcome_tracking']
    }
  ];

  // Generate narrative flows
  const narrativeFlows: NarrativeFlow[] = await generateNarrativeFlows(storyNodes, pathways);

  return { filters, visualizations, narrativeFlows };
}

function generateFilterOptions(values: string[]): FilterOption['options'] {
  const counts: { [key: string]: number } = {};
  
  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      count
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate narrative flows for guided story exploration
 */
async function generateNarrativeFlows(
  storyNodes: StoryNode[],
  pathways: OutcomePathway[]
): Promise<NarrativeFlow[]> {
  const flows: NarrativeFlow[] = [];

  // Create a flow for each major pathway
  for (const pathway of pathways.slice(0, 3)) { // Limit to top 3 pathways
    const flow = await createNarrativeFlow(pathway, storyNodes);
    if (flow) {
      flows.push(flow);
    }
  }

  return flows;
}

async function createNarrativeFlow(
  pathway: OutcomePathway,
  storyNodes: StoryNode[]
): Promise<NarrativeFlow | null> {
  try {
    const pathwayStories = storyNodes.filter(story => 
      pathway.pathwaySteps.some(step => step.relatedStories.includes(story.id))
    );

    if (pathwayStories.length < 2) return null;

    const flowSteps: FlowStep[] = pathwayStories.map((story, index) => ({
      id: `flow-step-${story.id}`,
      order: index + 1,
      storyId: story.id,
      transitionText: index === 0 
        ? "Let's begin this journey..." 
        : `This led to the next chapter of the story...`,
      choices: index < pathwayStories.length - 1 ? [
        { text: 'Continue the journey', nextStepId: `flow-step-${pathwayStories[index + 1].id}` },
        { text: 'Explore related stories', nextStepId: 'branch-point-1' }
      ] : undefined
    }));

    const branchingPoints: BranchingPoint[] = [{
      id: 'branch-point-1',
      stepId: flowSteps[Math.floor(flowSteps.length / 2)].id,
      question: 'What aspect interests you most?',
      options: [
        { text: 'Individual experiences', nextFlowId: 'individual-flow', description: 'Focus on personal stories' },
        { text: 'Community impact', nextFlowId: 'community-flow', description: 'Explore community-wide effects' },
        { text: 'Cultural significance', nextFlowId: 'cultural-flow', description: 'Understand cultural aspects' }
      ]
    }];

    const endings: FlowEnding[] = [{
      id: 'main-ending',
      title: 'Journey Complete',
      summary: `You've explored the pathway of ${pathway.title}`,
      keyLearnings: pathway.lessonsLearned,
      relatedPathways: [], // Would link to other pathways
      callToAction: 'Explore more community stories or share your own experience'
    }];

    return {
      id: `flow-${pathway.id}`,
      title: `Journey: ${pathway.title}`,
      description: pathway.description,
      startingPoint: flowSteps[0].id,
      flowSteps,
      branchingPoints,
      endings
    };
  } catch (error) {
    console.error('Error creating narrative flow:', error);
    return null;
  }
}

/**
 * Save story exploration to database
 */
async function saveStoryExploration(exploration: StoryExploration): Promise<void> {
  try {
    const explorationRecord = {
      id: exploration.id,
      title: exploration.title,
      description: exploration.description,
      central_theme: exploration.centralTheme,
      story_nodes: exploration.storyNodes,
      connections: exploration.connections,
      pathways: exploration.pathways,
      perspectives: exploration.perspectives,
      timeline: exploration.timeline,
      geographic_distribution: exploration.geographicDistribution,
      cultural_context: exploration.culturalContext,
      interactive_elements: exploration.interactiveElements,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('story_explorations')
      .upsert([explorationRecord], { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save story exploration: ${error.message}`);
    }

    console.log(`Story exploration saved: ${exploration.id}`);
  } catch (error) {
    console.error('Error saving story exploration:', error);
    throw error;
  }
}

/**
 * Get story exploration by ID
 */
export async function getStoryExploration(explorationId: string): Promise<StoryExploration | null> {
  try {
    const { data, error } = await supabase
      .from('story_explorations')
      .select('*')
      .eq('id', explorationId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      centralTheme: data.central_theme,
      storyNodes: data.story_nodes,
      connections: data.connections,
      pathways: data.pathways,
      perspectives: data.perspectives,
      timeline: data.timeline,
      geographicDistribution: data.geographic_distribution,
      culturalContext: data.cultural_context,
      interactiveElements: data.interactive_elements
    };
  } catch (error) {
    console.error('Error fetching story exploration:', error);
    return null;
  }
}

/**
 * Get story explorations for a community
 */
export async function getCommunityStoryExplorations(communityId: string): Promise<StoryExploration[]> {
  try {
    const { data, error } = await supabase
      .from('story_explorations')
      .select('*')
      .like('id', `%${communityId}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch story explorations: ${error.message}`);
    }

    return (data || []).map(record => ({
      id: record.id,
      title: record.title,
      description: record.description,
      centralTheme: record.central_theme,
      storyNodes: record.story_nodes,
      connections: record.connections,
      pathways: record.pathways,
      perspectives: record.perspectives,
      timeline: record.timeline,
      geographicDistribution: record.geographic_distribution,
      culturalContext: record.cultural_context,
      interactiveElements: record.interactive_elements
    }));
  } catch (error) {
    console.error('Error fetching community story explorations:', error);
    return [];
  }
}

/**
 * Update story exploration engagement metrics
 */
export async function updateExplorationEngagement(
  explorationId: string,
  engagementData: {
    viewCount?: number;
    interactionCount?: number;
    shareCount?: number;
    completionRate?: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('story_exploration_analytics')
      .upsert([{
        exploration_id: explorationId,
        view_count: engagementData.viewCount || 0,
        interaction_count: engagementData.interactionCount || 0,
        share_count: engagementData.shareCount || 0,
        completion_rate: engagementData.completionRate || 0,
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { onConflict: 'exploration_id' });

    if (error) {
      throw new Error(`Failed to update engagement metrics: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating exploration engagement:', error);
    throw error;
  }
}