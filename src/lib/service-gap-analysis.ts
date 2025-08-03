import { getAIProvider, extractJSON } from './ai-service';
import { aiConfig } from './ai-config';
import { moonshotClient } from './moonshot-client';

// Service gap analysis types
export interface ServiceGap {
  service: string;
  serviceType: 'education' | 'health' | 'employment' | 'housing' | 'transport' | 'cultural' | 'recreation' | 'support' | 'justice' | 'emergency';
  location: string;
  impact: number; // 1-10 scale
  urgency: 'low' | 'medium' | 'high' | 'critical';
  gapType: 'missing' | 'inadequate' | 'inaccessible' | 'culturally_inappropriate' | 'under_resourced';
  evidence: string[];
  affectedPopulation: {
    groups: string[]; // e.g., ['youth', 'families', 'elders']
    estimatedSize: number;
    demographics: string[];
  };
  currentAlternatives: string[]; // What people use instead
  barriers: Array<{
    type: 'geographic' | 'financial' | 'cultural' | 'administrative' | 'capacity' | 'awareness';
    description: string;
    severity: number; // 1-10
  }>;
  recommendations: Array<{
    solution: string;
    priority: number; // 1-10
    timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    resourcesRequired: string[];
    stakeholders: string[];
    estimatedCost: 'low' | 'medium' | 'high' | 'very_high';
    feasibility: number; // 1-10
  }>;
  relatedNeeds: string[];
  culturalConsiderations: string[];
  successExamples: string[]; // Examples from other communities
  confidence: number; // 0-1
  geographicScope: 'local' | 'regional' | 'territory_wide';
  trends: {
    worsening: boolean;
    stable: boolean;
    improving: boolean;
    emerging: boolean;
  };
}

export interface ServiceGapAnalysisResult {
  gaps: ServiceGap[];
  gapsByType: {
    missing: ServiceGap[];
    inadequate: ServiceGap[];
    inaccessible: ServiceGap[];
    culturally_inappropriate: ServiceGap[];
    under_resourced: ServiceGap[];
  };
  gapsByUrgency: {
    critical: ServiceGap[];
    high: ServiceGap[];
    medium: ServiceGap[];
    low: ServiceGap[];
  };
  gapsByLocation: Record<string, ServiceGap[]>;
  systemicGaps: Array<{
    systemicIssue: string;
    affectedServices: string[];
    rootCause: string;
    systemicSolution: string;
    impactedCommunities: string[];
  }>;
  priorityRecommendations: Array<{
    recommendation: string;
    addressedGaps: string[];
    totalImpact: number;
    feasibilityScore: number;
    urgencyScore: number;
    overallPriority: number;
  }>;
  summary: {
    totalGaps: number;
    criticalGaps: number;
    mostAffectedLocations: string[];
    topServiceTypes: Array<{ type: string; count: number }>;
    averageImpact: number;
    urgentActionRequired: boolean;
  };
}

class ServiceGapAnalysisService {
  
  /**
   * Analyze document for service gaps
   */
  async analyzeDocumentForServiceGaps(
    documentText: string,
    documentContext?: string,
    communityContext?: string
  ): Promise<ServiceGapAnalysisResult> {
    try {
      const provider = getAIProvider();
      if (!provider) {
        throw new Error('AI service not configured');
      }

      const systemPrompt = `You are an expert service gap analyst specializing in Aboriginal communities and remote service delivery. 
Your role is to identify missing, inadequate, or inaccessible services from community documents with deep understanding of:
- Remote community service delivery challenges
- Cultural appropriateness of services for Aboriginal communities
- Geographic and transport barriers in the Barkly region
- Service integration and coordination issues
- Community capacity and resource constraints
- The five Barkly Regional Deal priorities: youth safety, learning, employment pathways, cultural strengthening, service delivery

Always maintain cultural sensitivity and understand the unique challenges of remote Aboriginal communities.
Respond in JSON format only.`;

      const userPrompt = `Analyze this document for comprehensive service gap identification:
${documentContext ? `Document Context: ${documentContext}\n\n` : ''}
${communityContext ? `Community Context: ${communityContext}\n\n` : ''}

Document Text: ${documentText}

Identify and analyze service gaps with the following structure:
{
  "gaps": [
    {
      "service": "specific service that is missing or inadequate",
      "serviceType": "education|health|employment|housing|transport|cultural|recreation|support|justice|emergency",
      "location": "specific location or community where gap exists",
      "impact": 1-10,
      "urgency": "low|medium|high|critical",
      "gapType": "missing|inadequate|inaccessible|culturally_inappropriate|under_resourced",
      "evidence": ["direct quotes or evidence from text"],
      "affectedPopulation": {
        "groups": ["youth", "families", "elders", "women", "men", "children"],
        "estimatedSize": 50,
        "demographics": ["specific demographic details"]
      },
      "currentAlternatives": ["what people currently use instead"],
      "barriers": [
        {
          "type": "geographic|financial|cultural|administrative|capacity|awareness",
          "description": "specific barrier description",
          "severity": 1-10
        }
      ],
      "recommendations": [
        {
          "solution": "specific recommended solution",
          "priority": 1-10,
          "timeframe": "immediate|short_term|medium_term|long_term",
          "resourcesRequired": ["what would be needed"],
          "stakeholders": ["who should be involved"],
          "estimatedCost": "low|medium|high|very_high",
          "feasibility": 1-10
        }
      ],
      "relatedNeeds": ["connected community needs"],
      "culturalConsiderations": ["cultural aspects to consider"],
      "successExamples": ["examples from other communities if mentioned"],
      "confidence": 0.0-1.0,
      "geographicScope": "local|regional|territory_wide",
      "trends": {
        "worsening": true/false,
        "stable": true/false,
        "improving": true/false,
        "emerging": true/false
      }
    }
  ],
  "systemicGaps": [
    {
      "systemicIssue": "underlying system problem affecting multiple services",
      "affectedServices": ["list of affected services"],
      "rootCause": "fundamental cause of the systemic gap",
      "systemicSolution": "system-level solution needed",
      "impactedCommunities": ["communities affected by this systemic issue"]
    }
  ]
}

Focus on:
1. Identifying both explicit service gaps and implicit needs for services
2. Understanding barriers to service access (geographic, cultural, financial, etc.)
3. Recognizing culturally inappropriate or inadequate services
4. Identifying systemic issues affecting multiple services
5. Considering the unique challenges of remote Aboriginal communities
6. Providing actionable recommendations with feasibility assessment

Extract 3-8 key service gaps with comprehensive analysis for each.`;

      const modelConfig = aiConfig.getModelConfig();
      let response: string | null = null;

      if (provider === 'anthropic') {
        const completion = await (global as any).anthropic.messages.create({
          model: modelConfig.model,
          max_tokens: 3500,
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
          max_tokens: 3500,
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
          max_tokens: 3500
        });

        response = completion.choices[0]?.message?.content;
      }

      if (!response) {
        throw new Error('No response from AI service');
      }

      const parsedResult = extractJSON(response);
      return this.processServiceGapAnalysis(parsedResult);

    } catch (error) {
      console.error('Service gap analysis error:', error);
      // Return basic structure if analysis fails
      return this.getEmptyAnalysisResult();
    }
  }

  /**
   * Analyze multiple documents for service gaps
   */
  async analyzeMultipleDocuments(
    documents: Array<{ content: string; context?: string; communityContext?: string }>
  ): Promise<ServiceGapAnalysisResult> {
    try {
      const allAnalyses = await Promise.all(
        documents.map(doc => 
          this.analyzeDocumentForServiceGaps(doc.content, doc.context, doc.communityContext)
        )
      );

      return this.combineServiceGapAnalyses(allAnalyses);
    } catch (error) {
      console.error('Error analyzing multiple documents for service gaps:', error);
      throw error;
    }
  }

  /**
   * Process and enhance the raw service gap analysis
   */
  private processServiceGapAnalysis(rawResult: any): ServiceGapAnalysisResult {
    const gaps: ServiceGap[] = (rawResult.gaps || []).map((gap: any) => ({
      service: gap.service || '',
      serviceType: gap.serviceType || 'support',
      location: gap.location || 'regional',
      impact: gap.impact || 5,
      urgency: gap.urgency || 'medium',
      gapType: gap.gapType || 'missing',
      evidence: gap.evidence || [],
      affectedPopulation: {
        groups: gap.affectedPopulation?.groups || [],
        estimatedSize: gap.affectedPopulation?.estimatedSize || 0,
        demographics: gap.affectedPopulation?.demographics || []
      },
      currentAlternatives: gap.currentAlternatives || [],
      barriers: (gap.barriers || []).map((barrier: any) => ({
        type: barrier.type || 'geographic',
        description: barrier.description || '',
        severity: barrier.severity || 5
      })),
      recommendations: (gap.recommendations || []).map((rec: any) => ({
        solution: rec.solution || '',
        priority: rec.priority || 5,
        timeframe: rec.timeframe || 'medium_term',
        resourcesRequired: rec.resourcesRequired || [],
        stakeholders: rec.stakeholders || [],
        estimatedCost: rec.estimatedCost || 'medium',
        feasibility: rec.feasibility || 5
      })),
      relatedNeeds: gap.relatedNeeds || [],
      culturalConsiderations: gap.culturalConsiderations || [],
      successExamples: gap.successExamples || [],
      confidence: gap.confidence || 0.5,
      geographicScope: gap.geographicScope || 'local',
      trends: {
        worsening: gap.trends?.worsening || false,
        stable: gap.trends?.stable || true,
        improving: gap.trends?.improving || false,
        emerging: gap.trends?.emerging || false
      }
    }));

    // Create gaps by type
    const gapsByType = {
      missing: gaps.filter(g => g.gapType === 'missing'),
      inadequate: gaps.filter(g => g.gapType === 'inadequate'),
      inaccessible: gaps.filter(g => g.gapType === 'inaccessible'),
      culturally_inappropriate: gaps.filter(g => g.gapType === 'culturally_inappropriate'),
      under_resourced: gaps.filter(g => g.gapType === 'under_resourced')
    };

    // Create gaps by urgency
    const gapsByUrgency = {
      critical: gaps.filter(g => g.urgency === 'critical'),
      high: gaps.filter(g => g.urgency === 'high'),
      medium: gaps.filter(g => g.urgency === 'medium'),
      low: gaps.filter(g => g.urgency === 'low')
    };

    // Create gaps by location
    const gapsByLocation = gaps.reduce((acc, gap) => {
      if (!acc[gap.location]) {
        acc[gap.location] = [];
      }
      acc[gap.location].push(gap);
      return acc;
    }, {} as Record<string, ServiceGap[]>);

    // Process systemic gaps
    const systemicGaps = (rawResult.systemicGaps || []).map((gap: any) => ({
      systemicIssue: gap.systemicIssue || '',
      affectedServices: gap.affectedServices || [],
      rootCause: gap.rootCause || '',
      systemicSolution: gap.systemicSolution || '',
      impactedCommunities: gap.impactedCommunities || []
    }));

    // Generate priority recommendations
    const priorityRecommendations = this.generatePriorityRecommendations(gaps);

    // Generate summary
    const serviceTypeCount = gaps.reduce((acc, gap) => {
      acc[gap.serviceType] = (acc[gap.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServiceTypes = Object.entries(serviceTypeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const locationCount = gaps.reduce((acc, gap) => {
      acc[gap.location] = (acc[gap.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostAffectedLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location]) => location);

    const averageImpact = gaps.length > 0 
      ? gaps.reduce((sum, gap) => sum + gap.impact, 0) / gaps.length 
      : 0;

    const summary = {
      totalGaps: gaps.length,
      criticalGaps: gapsByUrgency.critical.length,
      mostAffectedLocations,
      topServiceTypes,
      averageImpact: Math.round(averageImpact * 10) / 10,
      urgentActionRequired: gapsByUrgency.critical.length > 0 || gapsByUrgency.high.length > 2
    };

    return {
      gaps,
      gapsByType,
      gapsByUrgency,
      gapsByLocation,
      systemicGaps,
      priorityRecommendations,
      summary
    };
  }

  /**
   * Generate priority recommendations based on gaps
   */
  private generatePriorityRecommendations(gaps: ServiceGap[]) {
    const allRecommendations = gaps.flatMap(gap => 
      gap.recommendations.map(rec => ({
        ...rec,
        gapService: gap.service,
        gapImpact: gap.impact,
        gapUrgency: gap.urgency
      }))
    );

    // Group similar recommendations
    const groupedRecs = new Map<string, any[]>();
    allRecommendations.forEach(rec => {
      const key = rec.solution.toLowerCase();
      if (!groupedRecs.has(key)) {
        groupedRecs.set(key, []);
      }
      groupedRecs.get(key)!.push(rec);
    });

    // Calculate priority scores
    const priorityRecommendations = Array.from(groupedRecs.entries()).map(([solution, recs]) => {
      const totalImpact = recs.reduce((sum, rec) => sum + rec.gapImpact, 0);
      const averageFeasibility = recs.reduce((sum, rec) => sum + rec.feasibility, 0) / recs.length;
      const averagePriority = recs.reduce((sum, rec) => sum + rec.priority, 0) / recs.length;
      
      const urgencyScore = recs.reduce((sum, rec) => {
        const urgencyValues = { low: 1, medium: 2, high: 3, critical: 4 };
        return sum + (urgencyValues[rec.gapUrgency as keyof typeof urgencyValues] || 2);
      }, 0) / recs.length;

      const overallPriority = (totalImpact * 0.3) + (averageFeasibility * 0.2) + 
                             (averagePriority * 0.3) + (urgencyScore * 0.2);

      return {
        recommendation: solution,
        addressedGaps: recs.map(rec => rec.gapService),
        totalImpact,
        feasibilityScore: Math.round(averageFeasibility * 10) / 10,
        urgencyScore: Math.round(urgencyScore * 10) / 10,
        overallPriority: Math.round(overallPriority * 10) / 10
      };
    });

    return priorityRecommendations
      .sort((a, b) => b.overallPriority - a.overallPriority)
      .slice(0, 10); // Top 10 recommendations
  }

  /**
   * Combine multiple service gap analyses
   */
  private combineServiceGapAnalyses(analyses: ServiceGapAnalysisResult[]): ServiceGapAnalysisResult {
    if (analyses.length === 0) {
      return this.getEmptyAnalysisResult();
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Combine and deduplicate gaps
    const allGaps = analyses.flatMap(a => a.gaps);
    const uniqueGaps = this.deduplicateServiceGaps(allGaps);

    // Combine systemic gaps
    const allSystemicGaps = analyses.flatMap(a => a.systemicGaps);
    const uniqueSystemicGaps = this.deduplicateSystemicGaps(allSystemicGaps);

    // Recreate categorizations
    const gapsByType = {
      missing: uniqueGaps.filter(g => g.gapType === 'missing'),
      inadequate: uniqueGaps.filter(g => g.gapType === 'inadequate'),
      inaccessible: uniqueGaps.filter(g => g.gapType === 'inaccessible'),
      culturally_inappropriate: uniqueGaps.filter(g => g.gapType === 'culturally_inappropriate'),
      under_resourced: uniqueGaps.filter(g => g.gapType === 'under_resourced')
    };

    const gapsByUrgency = {
      critical: uniqueGaps.filter(g => g.urgency === 'critical'),
      high: uniqueGaps.filter(g => g.urgency === 'high'),
      medium: uniqueGaps.filter(g => g.urgency === 'medium'),
      low: uniqueGaps.filter(g => g.urgency === 'low')
    };

    const gapsByLocation = uniqueGaps.reduce((acc, gap) => {
      if (!acc[gap.location]) {
        acc[gap.location] = [];
      }
      acc[gap.location].push(gap);
      return acc;
    }, {} as Record<string, ServiceGap[]>);

    // Generate combined recommendations
    const priorityRecommendations = this.generatePriorityRecommendations(uniqueGaps);

    // Generate combined summary
    const serviceTypeCount = uniqueGaps.reduce((acc, gap) => {
      acc[gap.serviceType] = (acc[gap.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServiceTypes = Object.entries(serviceTypeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const locationCount = uniqueGaps.reduce((acc, gap) => {
      acc[gap.location] = (acc[gap.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostAffectedLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location]) => location);

    const averageImpact = uniqueGaps.length > 0 
      ? uniqueGaps.reduce((sum, gap) => sum + gap.impact, 0) / uniqueGaps.length 
      : 0;

    const summary = {
      totalGaps: uniqueGaps.length,
      criticalGaps: gapsByUrgency.critical.length,
      mostAffectedLocations,
      topServiceTypes,
      averageImpact: Math.round(averageImpact * 10) / 10,
      urgentActionRequired: gapsByUrgency.critical.length > 0 || gapsByUrgency.high.length > 2
    };

    return {
      gaps: uniqueGaps,
      gapsByType,
      gapsByUrgency,
      gapsByLocation,
      systemicGaps: uniqueSystemicGaps,
      priorityRecommendations,
      summary
    };
  }

  /**
   * Deduplicate service gaps based on similarity
   */
  private deduplicateServiceGaps(gaps: ServiceGap[]): ServiceGap[] {
    const uniqueGaps: ServiceGap[] = [];
    const seenGaps = new Set<string>();

    for (const gap of gaps) {
      const key = `${gap.service.toLowerCase()}_${gap.serviceType}_${gap.location}`;
      
      if (!seenGaps.has(key)) {
        seenGaps.add(key);
        uniqueGaps.push(gap);
      } else {
        // Merge with existing gap
        const existingIndex = uniqueGaps.findIndex(g => 
          g.service.toLowerCase() === gap.service.toLowerCase() && 
          g.serviceType === gap.serviceType && 
          g.location === gap.location
        );
        
        if (existingIndex >= 0) {
          const existing = uniqueGaps[existingIndex];
          // Merge evidence and other arrays
          existing.evidence = [...new Set([...existing.evidence, ...gap.evidence])];
          existing.currentAlternatives = [...new Set([...existing.currentAlternatives, ...gap.currentAlternatives])];
          existing.relatedNeeds = [...new Set([...existing.relatedNeeds, ...gap.relatedNeeds])];
          existing.culturalConsiderations = [...new Set([...existing.culturalConsiderations, ...gap.culturalConsiderations])];
          
          // Take higher impact and urgency
          if (this.getUrgencyLevel(gap.urgency) > this.getUrgencyLevel(existing.urgency)) {
            existing.urgency = gap.urgency;
          }
          existing.impact = Math.max(existing.impact, gap.impact);
          existing.confidence = Math.max(existing.confidence, gap.confidence);
          
          // Merge affected population
          existing.affectedPopulation.groups = [...new Set([...existing.affectedPopulation.groups, ...gap.affectedPopulation.groups])];
          existing.affectedPopulation.estimatedSize = Math.max(existing.affectedPopulation.estimatedSize, gap.affectedPopulation.estimatedSize);
        }
      }
    }

    return uniqueGaps;
  }

  private deduplicateSystemicGaps(gaps: Array<{ systemicIssue: string; affectedServices: string[]; rootCause: string; systemicSolution: string; impactedCommunities: string[] }>): Array<{ systemicIssue: string; affectedServices: string[]; rootCause: string; systemicSolution: string; impactedCommunities: string[] }> {
    const uniqueGaps: Array<{ systemicIssue: string; affectedServices: string[]; rootCause: string; systemicSolution: string; impactedCommunities: string[] }> = [];
    const seenGaps = new Set<string>();

    for (const gap of gaps) {
      const key = gap.systemicIssue.toLowerCase();
      
      if (!seenGaps.has(key)) {
        seenGaps.add(key);
        uniqueGaps.push(gap);
      } else {
        // Merge with existing gap
        const existingIndex = uniqueGaps.findIndex(g => g.systemicIssue.toLowerCase() === key);
        if (existingIndex >= 0) {
          const existing = uniqueGaps[existingIndex];
          existing.affectedServices = [...new Set([...existing.affectedServices, ...gap.affectedServices])];
          existing.impactedCommunities = [...new Set([...existing.impactedCommunities, ...gap.impactedCommunities])];
        }
      }
    }

    return uniqueGaps;
  }

  private getUrgencyLevel(urgency: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[urgency as keyof typeof levels] || 2;
  }

  private getEmptyAnalysisResult(): ServiceGapAnalysisResult {
    return {
      gaps: [],
      gapsByType: { missing: [], inadequate: [], inaccessible: [], culturally_inappropriate: [], under_resourced: [] },
      gapsByUrgency: { critical: [], high: [], medium: [], low: [] },
      gapsByLocation: {},
      systemicGaps: [],
      priorityRecommendations: [],
      summary: {
        totalGaps: 0,
        criticalGaps: 0,
        mostAffectedLocations: [],
        topServiceTypes: [],
        averageImpact: 0,
        urgentActionRequired: false
      }
    };
  }
}

// Export singleton instance
export const serviceGapAnalysisService = new ServiceGapAnalysisService();