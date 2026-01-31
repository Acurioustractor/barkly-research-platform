import { getAIProvider, extractJSON } from '@/lib/ai/utils';
import { aiConfig } from '@/lib/ai/config';
import { supabase } from '@/lib/db/supabase';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { moonshotClient } from '@/lib/ai/moonshot-client';

// Enhanced community needs analysis types
export interface CommunityNeed {
  need: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'housing' | 'youth_development' | 'health' | 'employment' | 'culture' | 'justice' | 'environment' | 'education' | 'transport' | 'social_services';
  subcategory?: string;
  community: string;
  evidence: string[];
  confidence: number; // 0-1
  affectedGroups: string[]; // e.g., ['youth', 'families', 'elders']
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  estimatedImpact: number; // 1-10 scale
  relatedNeeds: string[]; // Connected needs
  potentialSolutions: string[];
  resourcesRequired: string[];
  stakeholders: string[]; // Who should be involved
  culturalConsiderations: string[];
  geographicScope: 'local' | 'regional' | 'territory_wide';
  trends: {
    increasing: boolean;
    stable: boolean;
    decreasing: boolean;
    emerging: boolean;
  };
}

export interface NeedsAnalysisResult {
  needs: CommunityNeed[];
  needsHierarchy: {
    critical: CommunityNeed[];
    high: CommunityNeed[];
    medium: CommunityNeed[];
    low: CommunityNeed[];
  };
  crossCuttingThemes: Array<{
    theme: string;
    relatedNeeds: string[];
    priority: number;
  }>;
  systemicIssues: Array<{
    issue: string;
    rootCauses: string[];
    affectedNeeds: string[];
    systemicSolutions: string[];
  }>;
  emergingNeeds: CommunityNeed[];
  summary: {
    totalNeeds: number;
    criticalNeeds: number;
    mostAffectedCommunities: string[];
    topCategories: Array<{ category: string; count: number }>;
    urgentActionRequired: boolean;
  };
}

class NeedsAnalysisService {

  /**
   * Enhanced community needs analysis
   */
  async analyzeDocumentForNeeds(
    documentText: string,
    documentContext?: string,
    communityContext?: string
  ): Promise<NeedsAnalysisResult> {
    try {
      const provider = getAIProvider();
      if (!provider) {
        throw new Error('AI service not configured');
      }

      const systemPrompt = `You are an expert community needs analyst specializing in Aboriginal communities and the Barkly Regional Deal. 
Your role is to identify, categorize, and prioritize community needs from documents with deep understanding of:
- The five Barkly Regional Deal priorities: youth safety, learning, employment pathways, cultural strengthening, service delivery
- Aboriginal community structures and cultural considerations
- Systemic issues affecting remote communities
- Interconnected nature of community challenges

Always maintain cultural sensitivity and recognize the complexity of community needs.
Respond in JSON format only.`;

      const userPrompt = `Analyze this document for comprehensive community needs identification:
${documentContext ? `Document Context: ${documentContext}\n\n` : ''}
${communityContext ? `Community Context: ${communityContext}\n\n` : ''}

Document Text: ${documentText}

Identify and analyze community needs with the following structure:
{
  "needs": [
    {
      "need": "specific, clearly defined need",
      "urgency": "low|medium|high|critical",
      "category": "housing|youth_development|health|employment|culture|justice|environment|education|transport|social_services",
      "subcategory": "more specific classification",
      "community": "specific community or 'regional'",
      "evidence": ["direct quotes or evidence from text"],
      "confidence": 0.0-1.0,
      "affectedGroups": ["youth", "families", "elders", "women", "men", "children"],
      "timeframe": "immediate|short_term|medium_term|long_term",
      "estimatedImpact": 1-10,
      "relatedNeeds": ["other connected needs"],
      "potentialSolutions": ["possible solutions mentioned or implied"],
      "resourcesRequired": ["what would be needed to address this"],
      "stakeholders": ["who should be involved"],
      "culturalConsiderations": ["cultural aspects to consider"],
      "geographicScope": "local|regional|territory_wide",
      "trends": {
        "increasing": true/false,
        "stable": true/false,
        "decreasing": true/false,
        "emerging": true/false
      }
    }
  ],
  "crossCuttingThemes": [
    {
      "theme": "theme that affects multiple needs",
      "relatedNeeds": ["list of related needs"],
      "priority": 1-10
    }
  ],
  "systemicIssues": [
    {
      "issue": "underlying systemic problem",
      "rootCauses": ["fundamental causes"],
      "affectedNeeds": ["needs impacted by this issue"],
      "systemicSolutions": ["system-level solutions needed"]
    }
  ],
  "emergingNeeds": [
    "needs that are just beginning to appear or are anticipated"
  ]
}

Focus on:
1. Identifying both explicit and implicit needs
2. Understanding the interconnected nature of needs
3. Recognizing cultural and community-specific contexts
4. Identifying systemic vs. immediate needs
5. Considering the five Barkly Regional Deal priorities
6. Being sensitive to Aboriginal community structures and values

Extract 3-8 key needs with comprehensive analysis for each.`;

      const modelConfig = aiConfig.getModelConfig();
      let response: string | null = null;

      if (provider === 'anthropic') {
        const completion = await (global as any).anthropic.messages.create({
          model: modelConfig.model,
          max_tokens: 3000,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        });

        const content = completion.content[0];
        if (content && content.type === 'text') {
          response = content.text;
        }
      } else if (provider === 'openai') {
        const completion = await (global as any).openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        });

        response = completion.choices[0]?.message?.content;
      } else if (provider === 'moonshot') {
        const completion = await moonshotClient!.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 3000
        });

        response = completion.choices[0]?.message?.content;
      }

      if (!response) {
        throw new Error('No response from AI service');
      }

      const parsedResult = extractJSON(response);
      return this.processNeedsAnalysis(parsedResult);

    } catch (error) {
      console.error('Enhanced needs analysis error:', error);
      // Return basic structure if analysis fails
      return {
        needs: [],
        needsHierarchy: { critical: [], high: [], medium: [], low: [] },
        crossCuttingThemes: [],
        systemicIssues: [],
        emergingNeeds: [],
        summary: {
          totalNeeds: 0,
          criticalNeeds: 0,
          mostAffectedCommunities: [],
          topCategories: [],
          urgentActionRequired: false
        }
      };
    }
  }

  /**
   * Process and enhance the raw needs analysis
   */
  private processNeedsAnalysis(rawResult: any): NeedsAnalysisResult {
    const needs: CommunityNeed[] = (rawResult.needs || []).map((need: any) => ({
      need: need.need || '',
      urgency: need.urgency || 'medium',
      category: need.category || 'social_services',
      subcategory: need.subcategory,
      community: need.community || 'regional',
      evidence: need.evidence || [],
      confidence: need.confidence || 0.5,
      affectedGroups: need.affectedGroups || [],
      timeframe: need.timeframe || 'medium_term',
      estimatedImpact: need.estimatedImpact || 5,
      relatedNeeds: need.relatedNeeds || [],
      potentialSolutions: need.potentialSolutions || [],
      resourcesRequired: need.resourcesRequired || [],
      stakeholders: need.stakeholders || [],
      culturalConsiderations: need.culturalConsiderations || [],
      geographicScope: need.geographicScope || 'local',
      trends: {
        increasing: need.trends?.increasing || false,
        stable: need.trends?.stable || true,
        decreasing: need.trends?.decreasing || false,
        emerging: need.trends?.emerging || false
      }
    }));

    // Create needs hierarchy
    const needsHierarchy = {
      critical: needs.filter(n => n.urgency === 'critical'),
      high: needs.filter(n => n.urgency === 'high'),
      medium: needs.filter(n => n.urgency === 'medium'),
      low: needs.filter(n => n.urgency === 'low')
    };

    // Process cross-cutting themes
    const crossCuttingThemes = (rawResult.crossCuttingThemes || []).map((theme: any) => ({
      theme: theme.theme || '',
      relatedNeeds: theme.relatedNeeds || [],
      priority: theme.priority || 5
    }));

    // Process systemic issues
    const systemicIssues = (rawResult.systemicIssues || []).map((issue: any) => ({
      issue: issue.issue || '',
      rootCauses: issue.rootCauses || [],
      affectedNeeds: issue.affectedNeeds || [],
      systemicSolutions: issue.systemicSolutions || []
    }));

    // Identify emerging needs
    const emergingNeeds = needs.filter(n => n.trends.emerging);

    // Generate summary
    const categoryCount = needs.reduce((acc, need) => {
      acc[need.category] = (acc[need.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const communityCount = needs.reduce((acc, need) => {
      acc[need.community] = (acc[need.community] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostAffectedCommunities = Object.entries(communityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([community]) => community);

    const summary = {
      totalNeeds: needs.length,
      criticalNeeds: needsHierarchy.critical.length,
      mostAffectedCommunities,
      topCategories,
      urgentActionRequired: needsHierarchy.critical.length > 0 || needsHierarchy.high.length > 2
    };

    return {
      needs,
      needsHierarchy,
      crossCuttingThemes,
      systemicIssues,
      emergingNeeds,
      summary
    };
  }

  /**
   * Analyze needs across multiple documents
   */
  async analyzeMultipleDocuments(
    documents: Array<{ content: string; context?: string; communityContext?: string }>
  ): Promise<NeedsAnalysisResult> {
    try {
      const allAnalyses = await Promise.all(
        documents.map(doc =>
          this.analyzeDocumentForNeeds(doc.content, doc.context, doc.communityContext)
        )
      );

      return this.combineNeedsAnalyses(allAnalyses);
    } catch (error) {
      console.error('Error analyzing multiple documents for needs:', error);
      throw error;
    }
  }

  /**
   * Combine multiple needs analyses
   */
  private combineNeedsAnalyses(analyses: NeedsAnalysisResult[]): NeedsAnalysisResult {
    if (analyses.length === 0) {
      return {
        needs: [],
        needsHierarchy: { critical: [], high: [], medium: [], low: [] },
        crossCuttingThemes: [],
        systemicIssues: [],
        emergingNeeds: [],
        summary: {
          totalNeeds: 0,
          criticalNeeds: 0,
          mostAffectedCommunities: [],
          topCategories: [],
          urgentActionRequired: false
        }
      };
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Combine and deduplicate needs
    const allNeeds = analyses.flatMap(a => a.needs);
    const uniqueNeeds = this.deduplicateNeeds(allNeeds);

    // Combine cross-cutting themes
    const allThemes = analyses.flatMap(a => a.crossCuttingThemes);
    const uniqueThemes = this.deduplicateThemes(allThemes);

    // Combine systemic issues
    const allIssues = analyses.flatMap(a => a.systemicIssues);
    const uniqueIssues = this.deduplicateSystemicIssues(allIssues);

    // Combine emerging needs
    const allEmergingNeeds = analyses.flatMap(a => a.emergingNeeds);
    const uniqueEmergingNeeds = this.deduplicateNeeds(allEmergingNeeds);

    // Recreate hierarchy
    const needsHierarchy = {
      critical: uniqueNeeds.filter(n => n.urgency === 'critical'),
      high: uniqueNeeds.filter(n => n.urgency === 'high'),
      medium: uniqueNeeds.filter(n => n.urgency === 'medium'),
      low: uniqueNeeds.filter(n => n.urgency === 'low')
    };

    // Generate combined summary
    const categoryCount = uniqueNeeds.reduce((acc, need) => {
      acc[need.category] = (acc[need.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const communityCount = uniqueNeeds.reduce((acc, need) => {
      acc[need.community] = (acc[need.community] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostAffectedCommunities = Object.entries(communityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([community]) => community);

    const summary = {
      totalNeeds: uniqueNeeds.length,
      criticalNeeds: needsHierarchy.critical.length,
      mostAffectedCommunities,
      topCategories,
      urgentActionRequired: needsHierarchy.critical.length > 0 || needsHierarchy.high.length > 2
    };

    return {
      needs: uniqueNeeds,
      needsHierarchy,
      crossCuttingThemes: uniqueThemes,
      systemicIssues: uniqueIssues,
      emergingNeeds: uniqueEmergingNeeds,
      summary
    };
  }

  /**
   * Deduplicate needs based on similarity
   */
  private deduplicateNeeds(needs: CommunityNeed[]): CommunityNeed[] {
    const uniqueNeeds: CommunityNeed[] = [];
    const seenNeeds = new Set<string>();

    for (const need of needs) {
      const key = `${need.need.toLowerCase()}_${need.category}_${need.community}`;

      if (!seenNeeds.has(key)) {
        seenNeeds.add(key);
        uniqueNeeds.push(need);
      } else {
        // Merge with existing need
        const existingIndex = uniqueNeeds.findIndex(n =>
          n.need.toLowerCase() === need.need.toLowerCase() &&
          n.category === need.category &&
          n.community === need.community
        );

        if (existingIndex >= 0) {
          const existing = uniqueNeeds[existingIndex];
          // Merge evidence and other arrays
          existing.evidence = [...new Set([...existing.evidence, ...need.evidence])];
          existing.affectedGroups = [...new Set([...existing.affectedGroups, ...need.affectedGroups])];
          existing.potentialSolutions = [...new Set([...existing.potentialSolutions, ...need.potentialSolutions])];
          existing.stakeholders = [...new Set([...existing.stakeholders, ...need.stakeholders])];

          // Take higher urgency and impact
          if (this.getUrgencyLevel(need.urgency) > this.getUrgencyLevel(existing.urgency)) {
            existing.urgency = need.urgency;
          }
          existing.estimatedImpact = Math.max(existing.estimatedImpact, need.estimatedImpact);
          existing.confidence = Math.max(existing.confidence, need.confidence);
        }
      }
    }

    return uniqueNeeds;
  }

  private deduplicateThemes(themes: Array<{ theme: string; relatedNeeds: string[]; priority: number }>): Array<{ theme: string; relatedNeeds: string[]; priority: number }> {
    const uniqueThemes: Array<{ theme: string; relatedNeeds: string[]; priority: number }> = [];
    const seenThemes = new Set<string>();

    for (const theme of themes) {
      const key = theme.theme.toLowerCase();

      if (!seenThemes.has(key)) {
        seenThemes.add(key);
        uniqueThemes.push(theme);
      } else {
        // Merge with existing theme
        const existingIndex = uniqueThemes.findIndex(t => t.theme.toLowerCase() === key);
        if (existingIndex >= 0) {
          const existing = uniqueThemes[existingIndex];
          existing.relatedNeeds = [...new Set([...existing.relatedNeeds, ...theme.relatedNeeds])];
          existing.priority = Math.max(existing.priority, theme.priority);
        }
      }
    }

    return uniqueThemes;
  }

  private deduplicateSystemicIssues(issues: Array<{ issue: string; rootCauses: string[]; affectedNeeds: string[]; systemicSolutions: string[] }>): Array<{ issue: string; rootCauses: string[]; affectedNeeds: string[]; systemicSolutions: string[] }> {
    const uniqueIssues: Array<{ issue: string; rootCauses: string[]; affectedNeeds: string[]; systemicSolutions: string[] }> = [];
    const seenIssues = new Set<string>();

    for (const issue of issues) {
      const key = issue.issue.toLowerCase();

      if (!seenIssues.has(key)) {
        seenIssues.add(key);
        uniqueIssues.push(issue);
      } else {
        // Merge with existing issue
        const existingIndex = uniqueIssues.findIndex(i => i.issue.toLowerCase() === key);
        if (existingIndex >= 0) {
          const existing = uniqueIssues[existingIndex];
          existing.rootCauses = [...new Set([...existing.rootCauses, ...issue.rootCauses])];
          existing.affectedNeeds = [...new Set([...existing.affectedNeeds, ...issue.affectedNeeds])];
          existing.systemicSolutions = [...new Set([...existing.systemicSolutions, ...issue.systemicSolutions])];
        }
      }
    }

    return uniqueIssues;
  }

  private getUrgencyLevel(urgency: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[urgency as keyof typeof levels] || 2;
  }
}

// Export singleton instance
export const needsAnalysisService = new NeedsAnalysisService();

/**
 * Get community needs from database
 */
export async function getCommunityNeeds(communityId: string): Promise<CommunityNeed[]> {
  try {
    // Assuming a 'community_needs' table exists or returning empty array for now
    const { data, error } = await supabase
      .from('community_needs')
      .select('*')
      .eq('community_id', communityId);

    if (error) {
      console.warn('Error fetching community needs:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      need: item.need,
      urgency: item.urgency,
      category: item.category,
      community: communityId,
      evidence: item.evidence || [],
      confidence: item.confidence || 0,
      affectedGroups: item.affected_groups || [],
      timeframe: item.timeframe || 'medium_term',
      estimatedImpact: item.estimated_impact || 0,
      relatedNeeds: item.related_needs || [],
      potentialSolutions: item.potential_solutions || [],
      resourcesRequired: item.resources_required || [],
      stakeholders: item.stakeholders || [],
      culturalConsiderations: item.cultural_considerations || [],
      geographicScope: item.geographic_scope || 'local',
      trends: item.trends || { increasing: false, stable: true, decreasing: false, emerging: false }
    }));
  } catch (error) {
    console.warn('Error in getCommunityNeeds:', error);
    return [];
  }
}