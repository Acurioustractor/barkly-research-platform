import { supabase } from '@/lib/db/supabase';
import { analyzeDocument } from '@/lib/ai-service';
import {
  getEventKnowledgeCaptures,
  getWorkshopSessions,
  type KnowledgeCapture,
  type WorkshopSession
} from './event-management-service';

export interface WorkshopInsight {
  id: string;
  eventId: string;
  sessionId?: string;
  insightType: 'community_need' | 'service_gap' | 'success_pattern' | 'cultural_knowledge' | 'action_item';
  title: string;
  description: string;
  evidence: string[];
  themes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  stakeholders: string[];
  location?: string;
  timeframe?: string;
  resources?: string[];
  outcomes?: string[];
  followUpRequired: boolean;
  relatedDocuments: string[];
  extractedAt: Date;
  confidence: number;
  metadata: any;
}

export interface WorkshopIntelligenceReport {
  eventId: string;
  eventTitle: string;
  sessionCount: number;
  totalCaptures: number;
  processedInsights: number;
  communityNeeds: WorkshopInsight[];
  serviceGaps: WorkshopInsight[];
  successPatterns: WorkshopInsight[];
  culturalKnowledge: WorkshopInsight[];
  actionItems: WorkshopInsight[];
  keyThemes: { theme: string; frequency: number; priority: string }[];
  stakeholderMap: { stakeholder: string; involvement: string[]; priority: string }[];
  followUpActions: { action: string; assignee?: string; dueDate?: Date; priority: string }[];
  culturalConsiderations: string[];
  recommendedNextSteps: string[];
  generatedAt: Date;
}

/**
 * Process workshop knowledge captures and extract intelligence insights
 */
export async function processWorkshopIntelligence(eventId: string): Promise<WorkshopIntelligenceReport> {
  try {
    // Get workshop sessions and knowledge captures
    const [sessions, captures] = await Promise.all([
      getWorkshopSessions(eventId),
      getEventKnowledgeCaptures(eventId)
    ]);

    if (captures.length === 0) {
      throw new Error('No knowledge captures found for this workshop');
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('community_events')
      .select('title, description, cultural_safety, community_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Process each capture through AI analysis
    const processedInsights: WorkshopInsight[] = [];
    const allThemes: string[] = [];
    const allStakeholders: string[] = [];
    const followUpActions: any[] = [];
    const culturalConsiderations: string[] = [];

    for (const capture of captures) {
      const insights = await extractInsightsFromCapture(capture, eventId, event.community_id);
      processedInsights.push(...insights);

      // Collect themes and stakeholders
      insights.forEach((insight: WorkshopInsight) => {
        allThemes.push(...insight.themes);
        allStakeholders.push(...insight.stakeholders);

        if (insight.insightType === 'action_item') {
          followUpActions.push({
            action: insight.title,
            assignee: insight.stakeholders[0],
            priority: insight.priority
          });
        }

        if (insight.culturalSafety !== 'public') {
          culturalConsiderations.push(`${insight.title}: Requires ${insight.culturalSafety} level access`);
        }
      });
    }

    // Categorize insights by type
    const communityNeeds = processedInsights.filter((i: WorkshopInsight) => i.insightType === 'community_need');
    const serviceGaps = processedInsights.filter((i: WorkshopInsight) => i.insightType === 'service_gap');
    const successPatterns = processedInsights.filter((i: WorkshopInsight) => i.insightType === 'success_pattern');
    const culturalKnowledge = processedInsights.filter((i: WorkshopInsight) => i.insightType === 'cultural_knowledge');
    const actionItems = processedInsights.filter((i: WorkshopInsight) => i.insightType === 'action_item');

    // Generate theme frequency analysis
    const themeFrequency = allThemes.reduce((acc: Record<string, number>, theme: string) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const keyThemes = Object.entries(themeFrequency)
      .map(([theme, frequency]) => ({
        theme,
        frequency,
        priority: frequency > 3 ? 'high' : frequency > 1 ? 'medium' : 'low'
      }))
      .sort((a: any, b: any) => b.frequency - a.frequency)
      .slice(0, 10);

    // Generate stakeholder map
    const stakeholderFrequency = allStakeholders.reduce((acc: Record<string, number>, stakeholder: string) => {
      acc[stakeholder] = (acc[stakeholder] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stakeholderMap = Object.entries(stakeholderFrequency)
      .map(([stakeholder, count]) => ({
        stakeholder,
        involvement: processedInsights
          .filter((i: WorkshopInsight) => i.stakeholders.includes(stakeholder))
          .map((i: WorkshopInsight) => i.insightType),
        priority: count > 3 ? 'high' : count > 1 ? 'medium' : 'low'
      }))
      .sort((a, b) => stakeholderFrequency[b.stakeholder] - stakeholderFrequency[a.stakeholder]);

    // Generate recommended next steps
    const recommendedNextSteps = await generateRecommendedNextSteps(
      processedInsights,
      keyThemes,
      event.community_id
    );

    // Save insights to database
    await saveWorkshopInsights(processedInsights);

    // Create intelligence report
    const report: WorkshopIntelligenceReport = {
      eventId,
      eventTitle: event.title,
      sessionCount: sessions.length,
      totalCaptures: captures.length,
      processedInsights: processedInsights.length,
      communityNeeds,
      serviceGaps,
      successPatterns,
      culturalKnowledge,
      actionItems,
      keyThemes,
      stakeholderMap,
      followUpActions,
      culturalConsiderations,
      recommendedNextSteps,
      generatedAt: new Date()
    };

    // Save report to database
    await saveIntelligenceReport(report);

    return report;
  } catch (error) {
    console.error('Error processing workshop intelligence:', error);
    throw error;
  }
}

/**
 * Extract insights from a single knowledge capture using AI analysis
 */
async function extractInsightsFromCapture(
  capture: KnowledgeCapture,
  eventId: string,
  communityId: string
): Promise<WorkshopInsight[]> {
  try {
    const analysisPrompt = `
Analyze this workshop knowledge capture and extract actionable intelligence insights:

Title: ${capture.title}
Type: ${capture.captureType}
Content: ${capture.content || 'No content provided'}
Cultural Safety: ${capture.culturalSafety}
Tags: ${capture.tags.join(', ')}

Extract insights in the following categories:
1. Community Needs - What needs or challenges were identified?
2. Service Gaps - What services or resources are missing or inadequate?
3. Success Patterns - What successful approaches or solutions were discussed?
4. Cultural Knowledge - What cultural practices, wisdom, or protocols were shared?
5. Action Items - What specific actions or follow-ups were identified?

For each insight, provide:
- Clear title and description
- Evidence from the content
- Relevant themes/topics
- Priority level (low/medium/high/critical)
- Stakeholders involved
- Cultural safety considerations
- Confidence level (0-1)

Format as JSON array of insights.
`;

    const analysis = await analyzeDocument<any>(analysisPrompt, 'workshop_intelligence');

    // Parse AI response and create WorkshopInsight objects
    let aiInsights: any[] = [];
    try {
      // Handle different possible AI response structures
      if (Array.isArray(analysis)) {
        aiInsights = analysis;
      } else if (analysis.insights && Array.isArray(analysis.insights)) {
        aiInsights = analysis.insights;
      } else if (analysis.analysis) {
        aiInsights = typeof analysis.analysis === 'string' ? JSON.parse(analysis.analysis) : analysis.analysis;
      } else {
        // Fallback: look for any array in the object
        aiInsights = Object.values(analysis).find(v => Array.isArray(v)) as any[] || [];
      }
    } catch (parseError) {
      console.warn('Failed to parse AI insights, using fallback extraction');
      aiInsights = await fallbackInsightExtraction(capture);
    }

    const insights: WorkshopInsight[] = aiInsights.map((aiInsight: any, index: number) => ({
      id: `${capture.id}-insight-${index}`,
      eventId,
      sessionId: capture.sessionId,
      insightType: mapInsightType(aiInsight.category || aiInsight.type),
      title: aiInsight.title || `Insight from ${capture.title}`,
      description: aiInsight.description || aiInsight.content || capture.content?.substring(0, 200) || '',
      evidence: aiInsight.evidence || [capture.content || ''],
      themes: aiInsight.themes || capture.tags || [],
      priority: aiInsight.priority || 'medium',
      culturalSafety: capture.culturalSafety,
      stakeholders: aiInsight.stakeholders || ['Community'],
      location: aiInsight.location,
      timeframe: aiInsight.timeframe,
      resources: aiInsight.resources || [],
      outcomes: aiInsight.outcomes || [],
      followUpRequired: aiInsight.followUpRequired || false,
      relatedDocuments: [capture.id],
      extractedAt: new Date(),
      confidence: aiInsight.confidence || 0.7,
      metadata: {
        originalCaptureType: capture.captureType,
        capturedBy: capture.capturedBy,
        captureTimestamp: capture.timestamp,
        aiAnalysis: true
      }
    }));

    return insights;
  } catch (error) {
    console.error('Error extracting insights from capture:', error);
    // Return basic insight as fallback
    return [{
      id: `${capture.id}-basic-insight`,
      eventId,
      sessionId: capture.sessionId,
      insightType: 'community_need',
      title: capture.title,
      description: capture.content || 'Workshop insight captured',
      evidence: [capture.content || ''],
      themes: capture.tags,
      priority: 'medium',
      culturalSafety: capture.culturalSafety,
      stakeholders: ['Community'],
      followUpRequired: false,
      relatedDocuments: [capture.id],
      extractedAt: new Date(),
      confidence: 0.5,
      metadata: {
        originalCaptureType: capture.captureType,
        capturedBy: capture.capturedBy,
        fallback: true
      }
    }];
  }
}

/**
 * Fallback insight extraction when AI parsing fails
 */
async function fallbackInsightExtraction(capture: KnowledgeCapture): Promise<any[]> {
  const insights = [];

  // Basic insight based on capture type
  const baseInsight = {
    title: capture.title,
    description: capture.content || 'Workshop insight',
    evidence: [capture.content || ''],
    themes: capture.tags,
    priority: 'medium',
    stakeholders: ['Community'],
    confidence: 0.5
  };

  switch (capture.captureType) {
    case 'notes':
      insights.push({ ...baseInsight, category: 'community_need' });
      break;
    case 'insight':
      insights.push({ ...baseInsight, category: 'success_pattern' });
      break;
    case 'recording':
      insights.push({ ...baseInsight, category: 'cultural_knowledge' });
      break;
    default:
      insights.push({ ...baseInsight, category: 'community_need' });
  }

  return insights;
}

/**
 * Map AI insight categories to our insight types
 */
function mapInsightType(category: string): WorkshopInsight['insightType'] {
  const mapping: Record<string, WorkshopInsight['insightType']> = {
    'community_need': 'community_need',
    'community need': 'community_need',
    'need': 'community_need',
    'service_gap': 'service_gap',
    'service gap': 'service_gap',
    'gap': 'service_gap',
    'success_pattern': 'success_pattern',
    'success pattern': 'success_pattern',
    'success': 'success_pattern',
    'cultural_knowledge': 'cultural_knowledge',
    'cultural knowledge': 'cultural_knowledge',
    'cultural': 'cultural_knowledge',
    'action_item': 'action_item',
    'action item': 'action_item',
    'action': 'action_item'
  };

  return mapping[category.toLowerCase()] || 'community_need';
}

/**
 * Generate recommended next steps based on insights
 */
async function generateRecommendedNextSteps(
  insights: WorkshopInsight[],
  themes: { theme: string; frequency: number }[],
  communityId: string
): Promise<string[]> {
  try {
    const highPriorityInsights = insights.filter((i: WorkshopInsight) => i.priority === 'high' || i.priority === 'critical');
    const topThemes = themes.slice(0, 5).map((t: any) => t.theme);

    const prompt = `
Based on these workshop insights and themes, recommend 5-7 specific next steps for the community:

High Priority Insights:
${highPriorityInsights.map((i: WorkshopInsight) => `- ${i.title}: ${i.description}`).join('\n')}

Top Themes:
${topThemes.join(', ')}

Provide actionable, culturally appropriate recommendations that:
1. Address the most critical needs identified
2. Build on successful patterns mentioned
3. Are realistic and achievable
4. Respect cultural protocols
5. Engage relevant stakeholders

Format as a simple array of recommendation strings.
`;

    const analysis = await analyzeDocument<any>(prompt, 'workshop_recommendations');

    try {
      const recommendations = Array.isArray(analysis) ? analysis : (analysis.recommendations || analysis.analysis || analysis.summary || []);
      return Array.isArray(recommendations) ? recommendations : [typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations)];
    } catch {
      // Fallback to basic recommendations
      return [
        'Follow up on high-priority action items identified in the workshop',
        'Engage with key stakeholders mentioned in discussions',
        'Address the most frequently mentioned community needs',
        'Document and preserve cultural knowledge shared',
        'Plan follow-up workshops to continue important conversations'
      ];
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return ['Review workshop outcomes and plan appropriate follow-up actions'];
  }
}

/**
 * Save workshop insights to the database
 */
async function saveWorkshopInsights(insights: WorkshopInsight[]): Promise<void> {
  try {
    const insightRecords = insights.map((insight: WorkshopInsight) => ({
      id: insight.id,
      event_id: insight.eventId,
      session_id: insight.sessionId,
      insight_type: insight.insightType,
      title: insight.title,
      description: insight.description,
      evidence: insight.evidence,
      themes: insight.themes,
      priority: insight.priority,
      cultural_safety: insight.culturalSafety,
      stakeholders: insight.stakeholders,
      location: insight.location,
      timeframe: insight.timeframe,
      resources: insight.resources || [],
      outcomes: insight.outcomes || [],
      follow_up_required: insight.followUpRequired,
      related_documents: insight.relatedDocuments,
      extracted_at: insight.extractedAt.toISOString(),
      confidence: insight.confidence,
      metadata: insight.metadata,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('workshop_insights')
      .upsert(insightRecords, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save workshop insights: ${error.message}`);
    }

    // Also integrate with existing intelligence systems
    await integrateWithIntelligenceSystems(insights);
  } catch (error) {
    console.error('Error saving workshop insights:', error);
    throw error;
  }
}

/**
 * Integrate workshop insights with existing intelligence systems
 */
async function integrateWithIntelligenceSystems(insights: WorkshopInsight[]): Promise<void> {
  try {
    // Integrate community needs with needs analysis system
    const communityNeeds = insights.filter((i: WorkshopInsight) => i.insightType === 'community_need');
    for (const need of communityNeeds) {
      await integrateWithNeedsAnalysis(need);
    }

    // Integrate service gaps with gap analysis system
    const serviceGaps = insights.filter((i: WorkshopInsight) => i.insightType === 'service_gap');
    for (const gap of serviceGaps) {
      await integrateWithServiceGapAnalysis(gap);
    }

    // Integrate success patterns with pattern recognition system
    const successPatterns = insights.filter((i: WorkshopInsight) => i.insightType === 'success_pattern');
    for (const pattern of successPatterns) {
      await integrateWithSuccessPatterns(pattern);
    }

    console.log(`Integrated ${insights.length} workshop insights with intelligence systems`);
  } catch (error) {
    console.error('Error integrating with intelligence systems:', error);
    // Don't throw - this is supplementary integration
  }
}

/**
 * Integrate community need with needs analysis system
 */
async function integrateWithNeedsAnalysis(need: WorkshopInsight): Promise<void> {
  try {
    const needRecord = {
      id: `workshop-need-${need.id}`,
      need_category: need.themes[0] || 'general',
      need_description: need.description,
      urgency_level: need.priority,
      affected_demographics: need.stakeholders,
      evidence_sources: need.evidence,
      location: need.location,
      identified_date: need.extractedAt.toISOString(),
      source_type: 'workshop',
      source_id: need.eventId,
      cultural_considerations: need.culturalSafety !== 'public' ? [need.culturalSafety] : [],
      confidence_score: need.confidence,
      metadata: {
        ...need.metadata,
        workshop_integration: true
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('community_needs')
      .upsert([needRecord], { onConflict: 'id' });

    if (error) {
      console.warn('Failed to integrate need with needs analysis:', error.message);
    }
  } catch (error) {
    console.warn('Error integrating with needs analysis:', error);
  }
}

/**
 * Integrate service gap with gap analysis system
 */
async function integrateWithServiceGapAnalysis(gap: WorkshopInsight): Promise<void> {
  try {
    const gapRecord = {
      id: `workshop-gap-${gap.id}`,
      gap_type: gap.themes[0] || 'service_delivery',
      gap_description: gap.description,
      severity: gap.priority,
      affected_population: gap.stakeholders.join(', '),
      evidence: gap.evidence,
      location: gap.location,
      identified_date: gap.extractedAt.toISOString(),
      source_type: 'workshop',
      source_id: gap.eventId,
      recommendations: gap.outcomes || [],
      confidence_score: gap.confidence,
      metadata: {
        ...gap.metadata,
        workshop_integration: true
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('service_gaps')
      .upsert([gapRecord], { onConflict: 'id' });

    if (error) {
      console.warn('Failed to integrate gap with gap analysis:', error.message);
    }
  } catch (error) {
    console.warn('Error integrating with gap analysis:', error);
  }
}

/**
 * Integrate success pattern with pattern recognition system
 */
async function integrateWithSuccessPatterns(pattern: WorkshopInsight): Promise<void> {
  try {
    const patternRecord = {
      id: `workshop-pattern-${pattern.id}`,
      pattern_name: pattern.title,
      pattern_description: pattern.description,
      pattern_type: pattern.themes[0] || 'community_initiative',
      success_factors: pattern.evidence,
      outcomes_achieved: pattern.outcomes || [],
      stakeholders_involved: pattern.stakeholders,
      resources_required: pattern.resources || [],
      timeframe: pattern.timeframe,
      replicability_score: pattern.confidence,
      evidence_strength: pattern.priority === 'high' ? 'strong' : pattern.priority === 'medium' ? 'moderate' : 'weak',
      source_type: 'workshop',
      source_id: pattern.eventId,
      identified_date: pattern.extractedAt.toISOString(),
      cultural_considerations: pattern.culturalSafety !== 'public' ? [pattern.culturalSafety] : [],
      metadata: {
        ...pattern.metadata,
        workshop_integration: true
      },
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('success_patterns')
      .upsert([patternRecord], { onConflict: 'id' });

    if (error) {
      console.warn('Failed to integrate pattern with success patterns:', error.message);
    }
  } catch (error) {
    console.warn('Error integrating with success patterns:', error);
  }
}

/**
 * Save intelligence report to database
 */
async function saveIntelligenceReport(report: WorkshopIntelligenceReport): Promise<void> {
  try {
    const reportRecord = {
      id: `workshop-report-${report.eventId}`,
      event_id: report.eventId,
      event_title: report.eventTitle,
      session_count: report.sessionCount,
      total_captures: report.totalCaptures,
      processed_insights: report.processedInsights,
      community_needs_count: report.communityNeeds.length,
      service_gaps_count: report.serviceGaps.length,
      success_patterns_count: report.successPatterns.length,
      cultural_knowledge_count: report.culturalKnowledge.length,
      action_items_count: report.actionItems.length,
      key_themes: report.keyThemes,
      stakeholder_map: report.stakeholderMap,
      follow_up_actions: report.followUpActions,
      cultural_considerations: report.culturalConsiderations,
      recommended_next_steps: report.recommendedNextSteps,
      generated_at: report.generatedAt.toISOString(),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('workshop_intelligence_reports')
      .upsert([reportRecord], { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save intelligence report: ${error.message}`);
    }
  } catch (error) {
    console.error('Error saving intelligence report:', error);
    throw error;
  }
}

/**
 * Get workshop intelligence report
 */
export async function getWorkshopIntelligenceReport(eventId: string): Promise<WorkshopIntelligenceReport | null> {
  try {
    const { data, error } = await supabase
      .from('workshop_intelligence_reports')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      eventId: data.event_id,
      eventTitle: data.event_title,
      sessionCount: data.session_count,
      totalCaptures: data.total_captures,
      processedInsights: data.processed_insights,
      communityNeeds: [], // Would need to fetch from workshop_insights table
      serviceGaps: [],
      successPatterns: [],
      culturalKnowledge: [],
      actionItems: [],
      keyThemes: data.key_themes || [],
      stakeholderMap: data.stakeholder_map || [],
      followUpActions: data.follow_up_actions || [],
      culturalConsiderations: data.cultural_considerations || [],
      recommendedNextSteps: data.recommended_next_steps || [],
      generatedAt: new Date(data.generated_at)
    };
  } catch (error) {
    console.error('Error fetching workshop intelligence report:', error);
    return null;
  }
}

/**
 * Get workshop insights by type
 */
export async function getWorkshopInsights(
  eventId: string,
  insightType?: WorkshopInsight['insightType']
): Promise<WorkshopInsight[]> {
  try {
    let query = supabase
      .from('workshop_insights')
      .select('*')
      .eq('event_id', eventId)
      .order('priority', { ascending: false })
      .order('confidence', { ascending: false });

    if (insightType) {
      query = query.eq('insight_type', insightType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch workshop insights: ${error.message}`);
    }

    return (data || []).map(record => ({
      id: record.id,
      eventId: record.event_id,
      sessionId: record.session_id,
      insightType: record.insight_type,
      title: record.title,
      description: record.description,
      evidence: record.evidence || [],
      themes: record.themes || [],
      priority: record.priority,
      culturalSafety: record.cultural_safety,
      stakeholders: record.stakeholders || [],
      location: record.location,
      timeframe: record.timeframe,
      resources: record.resources || [],
      outcomes: record.outcomes || [],
      followUpRequired: record.follow_up_required,
      relatedDocuments: record.related_documents || [],
      extractedAt: new Date(record.extracted_at),
      confidence: record.confidence,
      metadata: record.metadata || {}
    }));
  } catch (error) {
    console.error('Error fetching workshop insights:', error);
    return [];
  }
}

/**
 * Update community intelligence based on workshop insights
 */
export async function updateCommunityIntelligenceFromWorkshop(eventId: string): Promise<void> {
  try {
    const insights = await getWorkshopInsights(eventId);

    // Update community health indicators based on insights
    await updateCommunityHealthFromInsights(insights);

    // Update community status based on workshop outcomes
    await updateCommunityStatusFromWorkshop(eventId, insights);

    console.log(`Updated community intelligence with ${insights.length} workshop insights`);
  } catch (error) {
    console.error('Error updating community intelligence from workshop:', error);
    throw error;
  }
}

/**
 * Update community health indicators based on workshop insights
 */
async function updateCommunityHealthFromInsights(insights: WorkshopInsight[]): Promise<void> {
  try {
    // Analyze insights to determine health impact
    const positiveInsights = insights.filter((i: WorkshopInsight) =>
      i.insightType === 'success_pattern' ||
      (i.insightType === 'action_item' && i.priority !== 'critical')
    );

    const negativeInsights = insights.filter((i: WorkshopInsight) =>
      i.insightType === 'service_gap' ||
      (i.insightType === 'community_need' && i.priority === 'critical')
    );

    const healthImpact = positiveInsights.length - negativeInsights.length;
    const engagementScore = Math.min(insights.length / 10, 1); // Max 1.0 for 10+ insights

    // This would integrate with the community health service
    console.log(`Health impact from workshop: ${healthImpact}, Engagement: ${engagementScore}`);
  } catch (error) {
    console.error('Error updating community health from insights:', error);
  }
}

/**
 * Update community status based on workshop outcomes
 */
async function updateCommunityStatusFromWorkshop(eventId: string, insights: WorkshopInsight[]): Promise<void> {
  try {
    const { data: event } = await supabase
      .from('community_events')
      .select('community_id, title')
      .eq('id', eventId)
      .single();

    if (!event) return;

    const statusUpdate = {
      community_id: event.community_id,
      status_type: 'workshop_completion',
      status_value: 'completed',
      details: {
        workshop_title: event.title,
        insights_generated: insights.length,
        high_priority_items: insights.filter((i: WorkshopInsight) => i.priority === 'high' || i.priority === 'critical').length,
        cultural_knowledge_captured: insights.filter((i: WorkshopInsight) => i.insightType === 'cultural_knowledge').length
      },
      recorded_at: new Date().toISOString(),
      source: 'workshop_intelligence'
    };

    const { error } = await supabase
      .from('community_status_updates')
      .insert([statusUpdate]);

    if (error) {
      console.warn('Failed to update community status:', error.message);
    }
  } catch (error) {
    console.error('Error updating community status from workshop:', error);
  }
}