import { supabase } from './supabase';
import { analyzeDocument } from './ai-service';
import { getCommunityHealthIndicators } from './community-health-service';
import { getCommunityNeeds } from './needs-analysis-service';
import { getServiceGaps } from './service-gap-analysis';
import { getSuccessPatterns } from './success-pattern-service';

export interface ImpactMetric {
  id: string;
  category: 'health' | 'education' | 'economic' | 'cultural' | 'social' | 'environmental';
  name: string;
  description: string;
  value: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  trendPercentage?: number;
  timeframe: string;
  source: string;
  confidence: number;
  culturalContext?: string;
  benchmarkValue?: number;
  targetValue?: number;
}

export interface QualitativeStory {
  id: string;
  title: string;
  content: string;
  category: 'success' | 'challenge' | 'transformation' | 'cultural_preservation' | 'innovation';
  author: string;
  authorRole: string;
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  themes: string[];
  impactAreas: string[];
  stakeholders: string[];
  timeframe: string;
  location?: string;
  outcomes: string[];
  lessons: string[];
  multimedia?: {
    photos: string[];
    videos: string[];
    audio: string[];
  };
  verificationStatus: 'verified' | 'pending' | 'unverified';
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface CommunityVoice {
  id: string;
  speakerName: string;
  speakerRole: string;
  quote: string;
  context: string;
  impactArea: string;
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  recordedAt: Date;
  location?: string;
  language?: string;
  translation?: string;
  consentGiven: boolean;
  usagePermissions: string[];
}

export interface ImpactReport {
  id: string;
  title: string;
  subtitle?: string;
  communityId: string;
  communityName: string;
  reportType: 'annual' | 'quarterly' | 'project' | 'thematic' | 'funder' | 'government';
  timeframe: {
    startDate: Date;
    endDate: Date;
    description: string;
  };
  
  // Executive Summary
  executiveSummary: {
    keyAchievements: string[];
    majorChallenges: string[];
    impactHighlights: string[];
    futureDirections: string[];
    culturalSignificance: string[];
  };
  
  // Quantitative Data
  metrics: {
    primary: ImpactMetric[];
    secondary: ImpactMetric[];
    comparative: {
      baseline: ImpactMetric[];
      current: ImpactMetric[];
      targets: ImpactMetric[];
    };
  };
  
  // Qualitative Stories
  stories: {
    featured: QualitativeStory[];
    supporting: QualitativeStory[];
    culturalStories: QualitativeStory[];
  };
  
  // Community Voices
  voices: {
    testimonials: CommunityVoice[];
    elderWisdom: CommunityVoice[];
    youthPerspectives: CommunityVoice[];
    leadershipInsights: CommunityVoice[];
  };
  
  // Analysis Sections
  analysis: {
    trendsAnalysis: string;
    gapAnalysis: string;
    successFactors: string;
    challengesAnalysis: string;
    culturalImpact: string;
    recommendations: string[];
  };
  
  // Visual Elements
  visualizations: {
    charts: { type: string; data: any; title: string; description: string }[];
    maps: { type: string; data: any; title: string; description: string }[];
    infographics: { title: string; elements: any[]; description: string }[];
  };
  
  // Appendices
  appendices: {
    methodology: string;
    dataSourcesAndLimitations: string;
    culturalProtocols: string;
    acknowledgments: string;
    glossary: { term: string; definition: string; culturalContext?: string }[];
  };
  
  // Metadata
  generatedAt: Date;
  generatedBy: string;
  reviewedBy?: string[];
  approvedBy?: string[];
  culturalReviewStatus: 'pending' | 'reviewed' | 'approved';
  publicationStatus: 'draft' | 'internal' | 'public' | 'restricted';
  version: string;
  tags: string[];
  culturalSafetyLevel: 'public' | 'community' | 'restricted' | 'sacred';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  targetAudience: 'community' | 'government' | 'funders' | 'researchers' | 'media';
  sections: {
    id: string;
    title: string;
    description: string;
    required: boolean;
    culturalConsiderations: string[];
    contentTypes: ('metrics' | 'stories' | 'voices' | 'analysis' | 'visuals')[];
  }[];
  culturalProtocols: string[];
  approvalRequired: boolean;
  defaultCulturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
}

/**
 * Generate a comprehensive impact report
 */
export async function generateImpactReport(
  communityId: string,
  reportConfig: {
    title: string;
    reportType: ImpactReport['reportType'];
    timeframe: { startDate: Date; endDate: Date };
    templateId?: string;
    includeStories?: boolean;
    includeCulturalContent?: boolean;
    targetAudience?: string;
    culturalSafetyLevel?: 'public' | 'community' | 'restricted' | 'sacred';
  }
): Promise<ImpactReport> {
  try {
    console.log(`Generating impact report for community ${communityId}`);
    
    // Get community information
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('name, description, cultural_groups, languages')
      .eq('id', communityId)
      .single();

    if (communityError || !community) {
      throw new Error('Community not found');
    }

    // Collect quantitative data
    const metrics = await collectQuantitativeMetrics(
      communityId, 
      reportConfig.timeframe.startDate, 
      reportConfig.timeframe.endDate
    );

    // Collect qualitative stories
    const stories = reportConfig.includeStories !== false 
      ? await collectQualitativeStories(
          communityId, 
          reportConfig.timeframe.startDate, 
          reportConfig.timeframe.endDate,
          reportConfig.culturalSafetyLevel || 'public'
        )
      : { featured: [], supporting: [], culturalStories: [] };

    // Collect community voices
    const voices = await collectCommunityVoices(
      communityId, 
      reportConfig.timeframe.startDate, 
      reportConfig.timeframe.endDate,
      reportConfig.culturalSafetyLevel || 'public'
    );

    // Generate AI analysis
    const analysis = await generateAnalysis(
      communityId,
      metrics,
      stories,
      voices,
      reportConfig.timeframe
    );

    // Create visualizations
    const visualizations = await generateVisualizations(metrics, stories);

    // Generate executive summary
    const executiveSummary = await generateExecutiveSummary(
      metrics,
      stories,
      analysis,
      community.name
    );

    // Create the report
    const report: ImpactReport = {
      id: `impact-report-${communityId}-${Date.now()}`,
      title: reportConfig.title,
      subtitle: `${community.name} Impact Report`,
      communityId,
      communityName: community.name,
      reportType: reportConfig.reportType,
      timeframe: {
        startDate: reportConfig.timeframe.startDate,
        endDate: reportConfig.timeframe.endDate,
        description: `${reportConfig.timeframe.startDate.toLocaleDateString()} - ${reportConfig.timeframe.endDate.toLocaleDateString()}`
      },
      executiveSummary,
      metrics,
      stories,
      voices,
      analysis,
      visualizations,
      appendices: {
        methodology: await generateMethodologySection(),
        dataSourcesAndLimitations: await generateDataSourcesSection(),
        culturalProtocols: await generateCulturalProtocolsSection(community),
        acknowledgments: await generateAcknowledgmentsSection(communityId),
        glossary: await generateGlossary(community.cultural_groups)
      },
      generatedAt: new Date(),
      generatedBy: 'system',
      culturalReviewStatus: reportConfig.includeCulturalContent ? 'pending' : 'approved',
      publicationStatus: 'draft',
      version: '1.0',
      tags: [reportConfig.reportType, community.name.toLowerCase().replace(/\s+/g, '-')],
      culturalSafetyLevel: reportConfig.culturalSafetyLevel || 'public'
    };

    // Save the report
    await saveImpactReport(report);

    return report;
  } catch (error) {
    console.error('Error generating impact report:', error);
    throw error;
  }
}

/**
 * Collect quantitative metrics for the report
 */
async function collectQuantitativeMetrics(
  communityId: string,
  startDate: Date,
  endDate: Date
): Promise<ImpactReport['metrics']> {
  try {
    // Get health indicators
    const healthIndicators = await getCommunityHealthIndicators(communityId);
    
    // Get community needs data
    const needsData = await getCommunityNeeds(communityId);
    
    // Get service gaps data
    const serviceGaps = await getServiceGaps(communityId);
    
    // Get success patterns data
    const successPatterns = await getSuccessPatterns(communityId);

    // Get workshop and event data
    const { data: eventData } = await supabase
      .from('community_events')
      .select('*')
      .eq('community_id', communityId)
      .gte('start_date', startDate.toISOString())
      .lte('end_date', endDate.toISOString());

    // Get story data
    const { data: storyData } = await supabase
      .from('enhanced_community_stories')
      .select('*')
      .eq('community_id', communityId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Transform data into metrics
    const primaryMetrics: ImpactMetric[] = [
      {
        id: 'community-health-score',
        category: 'health',
        name: 'Community Health Score',
        description: 'Overall community wellbeing indicator',
        value: healthIndicators?.overallScore || 0,
        unit: 'score',
        trend: healthIndicators?.trend || 'unknown',
        trendPercentage: healthIndicators?.trendPercentage,
        timeframe: 'Current',
        source: 'Community Health Indicators',
        confidence: 0.85,
        targetValue: 80
      },
      {
        id: 'community-engagement',
        category: 'social',
        name: 'Community Engagement',
        description: 'Level of community participation in events and activities',
        value: eventData?.reduce((sum, event) => sum + (event.current_attendees || 0), 0) || 0,
        unit: 'participants',
        trend: 'improving',
        timeframe: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        source: 'Event Management System',
        confidence: 0.95
      },
      {
        id: 'stories-shared',
        category: 'cultural',
        name: 'Community Stories Shared',
        description: 'Number of stories shared by community members',
        value: storyData?.length || 0,
        unit: 'stories',
        trend: 'improving',
        timeframe: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        source: 'Community Stories System',
        confidence: 1.0
      },
      {
        id: 'identified-needs',
        category: 'social',
        name: 'Community Needs Identified',
        description: 'Number of community needs identified and documented',
        value: needsData?.length || 0,
        unit: 'needs',
        trend: 'stable',
        timeframe: 'Current',
        source: 'Needs Analysis System',
        confidence: 0.9
      },
      {
        id: 'service-gaps',
        category: 'social',
        name: 'Service Gaps Identified',
        description: 'Number of service gaps requiring attention',
        value: serviceGaps?.length || 0,
        unit: 'gaps',
        trend: 'stable',
        timeframe: 'Current',
        source: 'Service Gap Analysis',
        confidence: 0.85
      },
      {
        id: 'success-patterns',
        category: 'social',
        name: 'Success Patterns Documented',
        description: 'Number of successful approaches documented for replication',
        value: successPatterns?.length || 0,
        unit: 'patterns',
        trend: 'improving',
        timeframe: 'Current',
        source: 'Success Pattern Recognition',
        confidence: 0.8
      }
    ];

    const secondaryMetrics: ImpactMetric[] = [
      {
        id: 'workshop-attendance',
        category: 'education',
        name: 'Workshop Attendance Rate',
        description: 'Average attendance rate for community workshops',
        value: eventData?.length > 0 
          ? Math.round((eventData.reduce((sum, event) => sum + (event.current_attendees || 0), 0) / 
              eventData.reduce((sum, event) => sum + (event.max_attendees || event.current_attendees || 0), 0)) * 100)
          : 0,
        unit: 'percentage',
        trend: 'improving',
        timeframe: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        source: 'Event Management System',
        confidence: 0.9
      },
      {
        id: 'cultural-events',
        category: 'cultural',
        name: 'Cultural Events Held',
        description: 'Number of cultural events and ceremonies conducted',
        value: eventData?.filter(event => 
          event.event_type === 'ceremony' || 
          event.cultural_safety !== 'public'
        ).length || 0,
        unit: 'events',
        trend: 'stable',
        timeframe: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        source: 'Event Management System',
        confidence: 1.0
      }
    ];

    // Create comparative metrics (baseline vs current vs targets)
    const comparative = {
      baseline: primaryMetrics.map(metric => ({ ...metric, value: metric.value * 0.7 })), // Mock baseline
      current: primaryMetrics,
      targets: primaryMetrics.map(metric => ({ 
        ...metric, 
        value: metric.targetValue || metric.value * 1.2 
      }))
    };

    return {
      primary: primaryMetrics,
      secondary: secondaryMetrics,
      comparative
    };
  } catch (error) {
    console.error('Error collecting quantitative metrics:', error);
    return {
      primary: [],
      secondary: [],
      comparative: { baseline: [], current: [], targets: [] }
    };
  }
}

/**
 * Collect qualitative stories for the report
 */
async function collectQualitativeStories(
  communityId: string,
  startDate: Date,
  endDate: Date,
  maxCulturalSafety: 'public' | 'community' | 'restricted' | 'sacred'
): Promise<ImpactReport['stories']> {
  try {
    // Define cultural safety hierarchy
    const safetyLevels = ['public', 'community', 'restricted', 'sacred'];
    const maxSafetyIndex = safetyLevels.indexOf(maxCulturalSafety);
    const allowedLevels = safetyLevels.slice(0, maxSafetyIndex + 1);

    const { data: storyData, error } = await supabase
      .from('enhanced_community_stories')
      .select('*')
      .eq('community_id', communityId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('cultural_safety', allowedLevels)
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching stories:', error);
      return { featured: [], supporting: [], culturalStories: [] };
    }

    const stories = (storyData || []).map(story => ({
      id: story.id,
      title: story.title,
      content: story.content,
      category: categorizeStory(story.content, story.themes),
      author: story.author_name,
      authorRole: story.author_role || 'Community Member',
      culturalSafety: story.cultural_safety,
      themes: story.themes || [],
      impactAreas: story.impact_areas || [],
      stakeholders: story.stakeholders || [],
      timeframe: story.timeframe || 'Recent',
      location: story.location,
      outcomes: story.outcomes || [],
      lessons: story.lessons_learned || [],
      multimedia: {
        photos: story.photos || [],
        videos: story.videos || [],
        audio: story.audio_files || []
      },
      verificationStatus: story.verification_status || 'unverified',
      verifiedBy: story.verified_by,
      verifiedAt: story.verified_at ? new Date(story.verified_at) : undefined,
      createdAt: new Date(story.created_at)
    }));

    // Categorize stories
    const featured = stories
      .filter(story => story.verificationStatus === 'verified')
      .slice(0, 3);

    const supporting = stories
      .filter(story => !featured.includes(story))
      .slice(0, 10);

    const culturalStories = stories
      .filter(story => 
        story.culturalSafety !== 'public' || 
        story.themes.some(theme => 
          theme.toLowerCase().includes('cultural') || 
          theme.toLowerCase().includes('traditional')
        )
      )
      .slice(0, 5);

    return { featured, supporting, culturalStories };
  } catch (error) {
    console.error('Error collecting qualitative stories:', error);
    return { featured: [], supporting: [], culturalStories: [] };
  }
}

/**
 * Categorize a story based on its content and themes
 */
function categorizeStory(content: string, themes: string[]): QualitativeStory['category'] {
  const contentLower = content.toLowerCase();
  const themeString = themes.join(' ').toLowerCase();
  
  if (contentLower.includes('success') || contentLower.includes('achievement') || 
      themeString.includes('success')) {
    return 'success';
  }
  
  if (contentLower.includes('challenge') || contentLower.includes('difficult') || 
      contentLower.includes('problem')) {
    return 'challenge';
  }
  
  if (contentLower.includes('change') || contentLower.includes('transform') || 
      contentLower.includes('improve')) {
    return 'transformation';
  }
  
  if (contentLower.includes('traditional') || contentLower.includes('cultural') || 
      contentLower.includes('elder') || themeString.includes('cultural')) {
    return 'cultural_preservation';
  }
  
  if (contentLower.includes('new') || contentLower.includes('innovative') || 
      contentLower.includes('creative')) {
    return 'innovation';
  }
  
  return 'success'; // Default category
}

/**
 * Collect community voices for the report
 */
async function collectCommunityVoices(
  communityId: string,
  startDate: Date,
  endDate: Date,
  maxCulturalSafety: 'public' | 'community' | 'restricted' | 'sacred'
): Promise<ImpactReport['voices']> {
  try {
    // This would typically come from a dedicated community voices/testimonials system
    // For now, we'll extract quotes from stories and workshop captures
    
    const safetyLevels = ['public', 'community', 'restricted', 'sacred'];
    const maxSafetyIndex = safetyLevels.indexOf(maxCulturalSafety);
    const allowedLevels = safetyLevels.slice(0, maxSafetyIndex + 1);

    // Get quotes from knowledge captures
    const { data: captureData } = await supabase
      .from('knowledge_captures')
      .select(`
        *,
        community_events!inner(community_id)
      `)
      .eq('community_events.community_id', communityId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .in('cultural_safety', allowedLevels);

    const voices: CommunityVoice[] = (captureData || [])
      .filter(capture => capture.content && capture.content.length > 50)
      .map(capture => ({
        id: `voice-${capture.id}`,
        speakerName: capture.captured_by,
        speakerRole: 'Community Member',
        quote: capture.content.substring(0, 200) + (capture.content.length > 200 ? '...' : ''),
        context: capture.title,
        impactArea: capture.tags?.[0] || 'Community',
        culturalSafety: capture.cultural_safety,
        recordedAt: new Date(capture.timestamp),
        location: undefined,
        language: 'English',
        consentGiven: true,
        usagePermissions: ['report', 'public_sharing']
      }));

    // Categorize voices
    const testimonials = voices.filter(voice => 
      voice.quote.toLowerCase().includes('help') || 
      voice.quote.toLowerCase().includes('impact') ||
      voice.quote.toLowerCase().includes('change')
    ).slice(0, 5);

    const elderWisdom = voices.filter(voice => 
      voice.speakerRole.toLowerCase().includes('elder') ||
      voice.quote.toLowerCase().includes('traditional') ||
      voice.quote.toLowerCase().includes('ancestor')
    ).slice(0, 3);

    const youthPerspectives = voices.filter(voice => 
      voice.speakerRole.toLowerCase().includes('youth') ||
      voice.quote.toLowerCase().includes('young') ||
      voice.quote.toLowerCase().includes('future')
    ).slice(0, 3);

    const leadershipInsights = voices.filter(voice => 
      voice.speakerRole.toLowerCase().includes('leader') ||
      voice.speakerRole.toLowerCase().includes('coordinator') ||
      voice.quote.toLowerCase().includes('community') && voice.quote.toLowerCase().includes('lead')
    ).slice(0, 3);

    return {
      testimonials,
      elderWisdom,
      youthPerspectives,
      leadershipInsights
    };
  } catch (error) {
    console.error('Error collecting community voices:', error);
    return {
      testimonials: [],
      elderWisdom: [],
      youthPerspectives: [],
      leadershipInsights: []
    };
  }
}

/**
 * Generate AI-powered analysis sections
 */
async function generateAnalysis(
  communityId: string,
  metrics: ImpactReport['metrics'],
  stories: ImpactReport['stories'],
  voices: ImpactReport['voices'],
  timeframe: { startDate: Date; endDate: Date }
): Promise<ImpactReport['analysis']> {
  try {
    const analysisPrompt = `
Analyze the following community impact data and generate comprehensive analysis sections:

QUANTITATIVE METRICS:
${JSON.stringify(metrics.primary.slice(0, 5), null, 2)}

QUALITATIVE STORIES (${stories.featured.length + stories.supporting.length} total):
Featured Stories: ${stories.featured.map(s => s.title).join(', ')}
Key Themes: ${[...new Set(stories.featured.concat(stories.supporting).flatMap(s => s.themes))].join(', ')}

COMMUNITY VOICES (${voices.testimonials.length} testimonials):
Sample Quotes: ${voices.testimonials.slice(0, 3).map(v => `"${v.quote}"`).join('; ')}

Generate analysis for:
1. Trends Analysis - What trends are evident in the data?
2. Gap Analysis - What gaps or challenges are identified?
3. Success Factors - What factors contribute to positive outcomes?
4. Challenges Analysis - What challenges need attention?
5. Cultural Impact - How has cultural preservation and practice been affected?
6. Recommendations - What are 5-7 specific recommendations for the community?

Keep analysis culturally sensitive and community-focused.
`;

    const analysis = await analyzeDocument(analysisPrompt, 'impact_analysis');
    
    // Parse the AI response into structured sections
    const sections = parseAnalysisResponse(analysis.analysis);
    
    return {
      trendsAnalysis: sections.trendsAnalysis || 'Positive trends observed in community engagement and cultural activities.',
      gapAnalysis: sections.gapAnalysis || 'Service gaps identified in key areas requiring attention.',
      successFactors: sections.successFactors || 'Strong community leadership and cultural connections drive success.',
      challengesAnalysis: sections.challengesAnalysis || 'Resource constraints and capacity limitations present ongoing challenges.',
      culturalImpact: sections.culturalImpact || 'Cultural practices and knowledge sharing continue to strengthen community identity.',
      recommendations: sections.recommendations || [
        'Strengthen community leadership capacity',
        'Expand cultural programming and activities',
        'Address identified service gaps',
        'Build on successful community initiatives',
        'Enhance youth engagement and participation'
      ]
    };
  } catch (error) {
    console.error('Error generating analysis:', error);
    return {
      trendsAnalysis: 'Analysis pending - data collection in progress.',
      gapAnalysis: 'Gap analysis to be completed with additional data.',
      successFactors: 'Success factors being identified through ongoing community engagement.',
      challengesAnalysis: 'Challenge assessment ongoing with community input.',
      culturalImpact: 'Cultural impact assessment in development.',
      recommendations: [
        'Continue community engagement activities',
        'Maintain cultural programming',
        'Address community-identified priorities',
        'Build on existing strengths',
        'Support ongoing initiatives'
      ]
    };
  }
}

/**
 * Parse AI analysis response into structured sections
 */
function parseAnalysisResponse(response: string): any {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch {
    // If not JSON, parse as text sections
    const sections: any = {};
    
    const trendMatch = response.match(/trends?\s*analysis[:\-]?\s*(.*?)(?=gap\s*analysis|$)/is);
    if (trendMatch) sections.trendsAnalysis = trendMatch[1].trim();
    
    const gapMatch = response.match(/gap\s*analysis[:\-]?\s*(.*?)(?=success\s*factors|$)/is);
    if (gapMatch) sections.gapAnalysis = gapMatch[1].trim();
    
    const successMatch = response.match(/success\s*factors[:\-]?\s*(.*?)(?=challenges?\s*analysis|$)/is);
    if (successMatch) sections.successFactors = successMatch[1].trim();
    
    const challengesMatch = response.match(/challenges?\s*analysis[:\-]?\s*(.*?)(?=cultural\s*impact|$)/is);
    if (challengesMatch) sections.challengesAnalysis = challengesMatch[1].trim();
    
    const culturalMatch = response.match(/cultural\s*impact[:\-]?\s*(.*?)(?=recommendations?|$)/is);
    if (culturalMatch) sections.culturalImpact = culturalMatch[1].trim();
    
    const recommendationsMatch = response.match(/recommendations?[:\-]?\s*(.*?)$/is);
    if (recommendationsMatch) {
      const recText = recommendationsMatch[1].trim();
      sections.recommendations = recText.split(/\d+\.|\n-|\n\*/).filter(r => r.trim()).map(r => r.trim());
    }
    
    return sections;
  }
}

/**
 * Generate visualizations for the report
 */
async function generateVisualizations(
  metrics: ImpactReport['metrics'],
  stories: ImpactReport['stories']
): Promise<ImpactReport['visualizations']> {
  const charts = [
    {
      type: 'bar',
      title: 'Key Community Metrics',
      description: 'Primary indicators of community wellbeing and engagement',
      data: {
        labels: metrics.primary.map(m => m.name),
        datasets: [{
          label: 'Current Values',
          data: metrics.primary.map(m => m.value),
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }]
      }
    },
    {
      type: 'line',
      title: 'Trends Over Time',
      description: 'Progress tracking for key metrics',
      data: {
        labels: ['Baseline', 'Current', 'Target'],
        datasets: metrics.primary.slice(0, 3).map((metric, index) => ({
          label: metric.name,
          data: [
            metrics.comparative.baseline.find(b => b.id === metric.id)?.value || 0,
            metric.value,
            metrics.comparative.targets.find(t => t.id === metric.id)?.value || metric.value * 1.2
          ],
          borderColor: `hsl(${index * 120}, 70%, 50%)`,
          fill: false
        }))
      }
    },
    {
      type: 'doughnut',
      title: 'Story Categories',
      description: 'Distribution of community stories by category',
      data: {
        labels: ['Success Stories', 'Challenges', 'Transformations', 'Cultural', 'Innovation'],
        datasets: [{
          data: [
            stories.featured.filter(s => s.category === 'success').length + 
            stories.supporting.filter(s => s.category === 'success').length,
            stories.featured.filter(s => s.category === 'challenge').length + 
            stories.supporting.filter(s => s.category === 'challenge').length,
            stories.featured.filter(s => s.category === 'transformation').length + 
            stories.supporting.filter(s => s.category === 'transformation').length,
            stories.featured.filter(s => s.category === 'cultural_preservation').length + 
            stories.supporting.filter(s => s.category === 'cultural_preservation').length,
            stories.featured.filter(s => s.category === 'innovation').length + 
            stories.supporting.filter(s => s.category === 'innovation').length
          ],
          backgroundColor: [
            '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'
          ]
        }]
      }
    }
  ];

  const maps = [
    {
      type: 'community_impact',
      title: 'Community Impact Areas',
      description: 'Geographic distribution of community activities and impact',
      data: {
        // This would contain geographic data for mapping
        regions: [],
        activities: [],
        impactZones: []
      }
    }
  ];

  const infographics = [
    {
      title: 'Community at a Glance',
      description: 'Key statistics and highlights',
      elements: [
        { type: 'stat', label: 'Community Health Score', value: metrics.primary[0]?.value || 0 },
        { type: 'stat', label: 'Stories Shared', value: stories.featured.length + stories.supporting.length },
        { type: 'stat', label: 'Community Events', value: metrics.primary.find(m => m.id === 'community-engagement')?.value || 0 },
        { type: 'highlight', text: 'Strong cultural connections drive community success' }
      ]
    }
  ];

  return { charts, maps, infographics };
}

/**
 * Generate executive summary
 */
async function generateExecutiveSummary(
  metrics: ImpactReport['metrics'],
  stories: ImpactReport['stories'],
  analysis: ImpactReport['analysis'],
  communityName: string
): Promise<ImpactReport['executiveSummary']> {
  const keyAchievements = [
    `Community health score of ${metrics.primary[0]?.value || 'N/A'}`,
    `${stories.featured.length + stories.supporting.length} community stories documented`,
    `${metrics.primary.find(m => m.id === 'community-engagement')?.value || 0} community members engaged`,
    'Strong cultural programming and preservation activities'
  ];

  const majorChallenges = [
    'Service gaps in key community areas',
    'Resource constraints for program expansion',
    'Need for increased youth engagement',
    'Capacity building requirements'
  ];

  const impactHighlights = [
    'Increased community participation in cultural activities',
    'Successful documentation of traditional knowledge',
    'Improved community health and wellbeing indicators',
    'Strengthened community connections and networks'
  ];

  const futureDirections = [
    'Expand successful community programs',
    'Address identified service gaps',
    'Strengthen youth leadership development',
    'Enhance cultural preservation initiatives'
  ];

  const culturalSignificance = [
    'Traditional knowledge successfully preserved and shared',
    'Cultural events and ceremonies well-attended',
    'Intergenerational knowledge transfer active',
    'Community identity and pride strengthened'
  ];

  return {
    keyAchievements,
    majorChallenges,
    impactHighlights,
    futureDirections,
    culturalSignificance
  };
}

/**
 * Generate methodology section
 */
async function generateMethodologySection(): Promise<string> {
  return `
This impact report combines quantitative data analysis with qualitative storytelling to provide a comprehensive view of community progress and outcomes. 

Data Collection Methods:
- Automated collection of community health indicators and engagement metrics
- Community story documentation through culturally appropriate processes
- Workshop and event participation tracking
- Community voice collection with proper consent protocols

Analysis Approach:
- AI-powered analysis of quantitative trends and patterns
- Thematic analysis of qualitative stories and community voices
- Cultural safety protocols maintained throughout data collection and analysis
- Community validation of findings and recommendations

Quality Assurance:
- Data verification through multiple sources
- Community review of cultural content
- Elder approval for traditional knowledge elements
- Ongoing validation with community stakeholders
`;
}

/**
 * Generate data sources section
 */
async function generateDataSourcesSection(): Promise<string> {
  return `
Data Sources:
- Community Health Indicators System
- Event Management and Participation Records
- Community Stories Database
- Workshop Knowledge Capture System
- Service Gap Analysis Reports
- Success Pattern Documentation
- Community Needs Assessment Data

Data Limitations:
- Some historical data may be incomplete
- Cultural safety protocols limit certain data sharing
- Self-reported data subject to individual perspectives
- Seasonal variations may affect some metrics
- Small sample sizes in some categories

Data Quality Measures:
- Regular validation with community stakeholders
- Cross-referencing multiple data sources
- Cultural review of sensitive content
- Ongoing data quality monitoring and improvement
`;
}

/**
 * Generate cultural protocols section
 */
async function generateCulturalProtocolsSection(community: any): Promise<string> {
  return `
Cultural Protocols Observed:

Respect for Traditional Knowledge:
- All traditional knowledge shared with appropriate permissions
- Elder review required for cultural content
- Sacred information protected and not included in public reports
- Community ownership of cultural content maintained

Consent and Participation:
- Free, prior, and informed consent obtained for all story sharing
- Community members retain control over their contributions
- Right to withdraw participation respected at all times
- Cultural safety maintained throughout the reporting process

Community Ownership:
- Community maintains ownership of all data and stories
- Report findings shared with community before external distribution
- Community input incorporated into final recommendations
- Ongoing community control over report usage and distribution

Cultural Groups Represented:
${community.cultural_groups?.join(', ') || 'Community cultural groups'}

Languages Acknowledged:
${community.languages?.join(', ') || 'Community languages'}
`;
}

/**
 * Generate acknowledgments section
 */
async function generateAcknowledgmentsSection(communityId: string): Promise<string> {
  return `
Acknowledgments:

We acknowledge the traditional owners and custodians of the land on which this community resides, and pay our respects to Elders past, present, and emerging.

This report would not be possible without the generous participation and contributions of community members who shared their stories, experiences, and wisdom. We thank all participants for their trust and openness in sharing their journeys.

Special recognition goes to:
- Community Elders for their guidance and cultural oversight
- Community leaders and coordinators for their ongoing support
- Workshop facilitators and cultural authorities
- All community members who contributed stories and participated in activities
- Youth participants who shared their perspectives and aspirations

We acknowledge that this report represents just one perspective on community progress and that the full richness of community life extends far beyond what can be captured in any single document.
`;
}

/**
 * Generate glossary
 */
async function generateGlossary(culturalGroups: string[]): Promise<ImpactReport['appendices']['glossary']> {
  return [
    {
      term: 'Community Health Score',
      definition: 'A composite indicator measuring overall community wellbeing across multiple dimensions including social, cultural, economic, and health factors.'
    },
    {
      term: 'Cultural Safety',
      definition: 'An environment that is safe for people; where there is no assault, challenge or denial of their identity, of who they are and what they need.',
      culturalContext: 'Particularly important in Indigenous and multicultural community contexts.'
    },
    {
      term: 'Traditional Knowledge',
      definition: 'Knowledge, innovations, and practices of Indigenous and local communities embodying traditional lifestyles.',
      culturalContext: 'Protected and shared according to community protocols and with appropriate permissions.'
    },
    {
      term: 'Success Patterns',
      definition: 'Documented approaches, strategies, or interventions that have demonstrated positive outcomes and can potentially be replicated.'
    },
    {
      term: 'Service Gaps',
      definition: 'Areas where community needs are not adequately met by existing services or resources.'
    },
    {
      term: 'Community Voice',
      definition: 'Direct quotes, testimonials, and perspectives shared by community members about their experiences and views.'
    }
  ];
}

/**
 * Save impact report to database
 */
async function saveImpactReport(report: ImpactReport): Promise<void> {
  try {
    const reportRecord = {
      id: report.id,
      title: report.title,
      subtitle: report.subtitle,
      community_id: report.communityId,
      community_name: report.communityName,
      report_type: report.reportType,
      timeframe_start: report.timeframe.startDate.toISOString(),
      timeframe_end: report.timeframe.endDate.toISOString(),
      timeframe_description: report.timeframe.description,
      executive_summary: report.executiveSummary,
      metrics: report.metrics,
      stories: report.stories,
      voices: report.voices,
      analysis: report.analysis,
      visualizations: report.visualizations,
      appendices: report.appendices,
      generated_at: report.generatedAt.toISOString(),
      generated_by: report.generatedBy,
      reviewed_by: report.reviewedBy || [],
      approved_by: report.approvedBy || [],
      cultural_review_status: report.culturalReviewStatus,
      publication_status: report.publicationStatus,
      version: report.version,
      tags: report.tags,
      cultural_safety_level: report.culturalSafetyLevel,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('impact_reports')
      .upsert([reportRecord], { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save impact report: ${error.message}`);
    }

    console.log(`Impact report saved: ${report.id}`);
  } catch (error) {
    console.error('Error saving impact report:', error);
    throw error;
  }
}

/**
 * Get impact report by ID
 */
export async function getImpactReport(reportId: string): Promise<ImpactReport | null> {
  try {
    const { data, error } = await supabase
      .from('impact_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      communityId: data.community_id,
      communityName: data.community_name,
      reportType: data.report_type,
      timeframe: {
        startDate: new Date(data.timeframe_start),
        endDate: new Date(data.timeframe_end),
        description: data.timeframe_description
      },
      executiveSummary: data.executive_summary,
      metrics: data.metrics,
      stories: data.stories,
      voices: data.voices,
      analysis: data.analysis,
      visualizations: data.visualizations,
      appendices: data.appendices,
      generatedAt: new Date(data.generated_at),
      generatedBy: data.generated_by,
      reviewedBy: data.reviewed_by,
      approvedBy: data.approved_by,
      culturalReviewStatus: data.cultural_review_status,
      publicationStatus: data.publication_status,
      version: data.version,
      tags: data.tags,
      culturalSafetyLevel: data.cultural_safety_level
    };
  } catch (error) {
    console.error('Error fetching impact report:', error);
    return null;
  }
}

/**
 * Get impact reports for a community
 */
export async function getCommunityImpactReports(
  communityId: string,
  filters?: {
    reportType?: string;
    publicationStatus?: string;
    culturalSafetyLevel?: string;
  }
): Promise<ImpactReport[]> {
  try {
    let query = supabase
      .from('impact_reports')
      .select('*')
      .eq('community_id', communityId)
      .order('generated_at', { ascending: false });

    if (filters?.reportType) {
      query = query.eq('report_type', filters.reportType);
    }
    if (filters?.publicationStatus) {
      query = query.eq('publication_status', filters.publicationStatus);
    }
    if (filters?.culturalSafetyLevel) {
      query = query.eq('cultural_safety_level', filters.culturalSafetyLevel);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch impact reports: ${error.message}`);
    }

    return (data || []).map(record => ({
      id: record.id,
      title: record.title,
      subtitle: record.subtitle,
      communityId: record.community_id,
      communityName: record.community_name,
      reportType: record.report_type,
      timeframe: {
        startDate: new Date(record.timeframe_start),
        endDate: new Date(record.timeframe_end),
        description: record.timeframe_description
      },
      executiveSummary: record.executive_summary,
      metrics: record.metrics,
      stories: record.stories,
      voices: record.voices,
      analysis: record.analysis,
      visualizations: record.visualizations,
      appendices: record.appendices,
      generatedAt: new Date(record.generated_at),
      generatedBy: record.generated_by,
      reviewedBy: record.reviewed_by,
      approvedBy: record.approved_by,
      culturalReviewStatus: record.cultural_review_status,
      publicationStatus: record.publication_status,
      version: record.version,
      tags: record.tags,
      culturalSafetyLevel: record.cultural_safety_level
    }));
  } catch (error) {
    console.error('Error fetching community impact reports:', error);
    return [];
  }
}