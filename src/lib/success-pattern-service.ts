import { aiConfig } from './ai-config';
import { moonshotClient } from './moonshot-client';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients (reusing from ai-service pattern)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 120000,
      maxRetries: 2,
    })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 120000,
      maxRetries: 2,
    })
  : null;

// Helper function to determine which AI provider to use
function getAIProvider() {
  const modelConfig = aiConfig.getModelConfig();
  if (modelConfig.provider === 'moonshot' && moonshotClient) {
    return 'moonshot';
  }
  if (modelConfig.provider === 'anthropic' && anthropic) {
    return 'anthropic';
  }
  if (modelConfig.provider === 'openai' && openai) {
    return 'openai';
  }
  // Fallback to any available provider
  if (moonshotClient) return 'moonshot';
  if (anthropic) return 'anthropic';
  if (openai) return 'openai';
  return null;
}

// Helper function to extract JSON from AI response
function extractJSON(text: string): any {
  // First try direct parsing
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }
    
    // Try to find JSON object in the text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    
    throw new Error('No valid JSON found in response');
  }
}

export interface SuccessPattern {
  pattern: string;
  communities: string[];
  replicability: number; // 0-1
  requirements: string[];
  evidence: string[];
  outcomes: string[];
  category: 'youth_development' | 'cultural_strengthening' | 'service_delivery' | 'economic_development' | 'community_engagement' | 'education' | 'health_wellbeing';
  successFactors: string[];
  challenges: string[];
  timeline: string;
  resources: string[];
  stakeholders: string[];
  scalability: 'local' | 'regional' | 'territory_wide' | 'national';
  culturalSafety: 'high' | 'medium' | 'low';
  sustainability: number; // 0-1
}

export interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  pattern: SuccessPattern;
  implementationGuide: {
    steps: string[];
    timeline: string;
    resources: string[];
    risks: string[];
    mitigations: string[];
  };
  adaptationGuidance: string[];
  measurableOutcomes: string[];
}

export interface CrossCommunityAnalysis {
  sharedPatterns: SuccessPattern[];
  uniqueApproaches: Array<{
    community: string;
    approach: string;
    effectiveness: number;
    transferability: number;
  }>;
  emergingTrends: Array<{
    trend: string;
    communities: string[];
    strength: number;
    trajectory: 'emerging' | 'growing' | 'stable' | 'declining';
  }>;
  replicationOpportunities: Array<{
    sourcePattern: string;
    sourceCommunity: string;
    targetCommunities: string[];
    adaptationNeeds: string[];
    expectedOutcomes: string[];
  }>;
}

/**
 * Analyze document content to identify success patterns
 */
export async function identifySuccessPatterns(
  documentContent: string,
  communityContext?: string,
  documentTitle?: string
): Promise<SuccessPattern[]> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = `You are an expert in community development and program evaluation, specializing in identifying successful interventions and programs that have achieved positive outcomes in Aboriginal and Torres Strait Islander communities.

Your task is to analyze documents and identify success patterns - specific approaches, programs, or interventions that have demonstrated positive results and could potentially be replicated in other communities.

Focus on:
- Programs or initiatives that achieved their intended outcomes
- Approaches that overcame significant challenges
- Interventions that showed measurable community impact
- Strategies that engaged community members effectively
- Methods that respected cultural protocols and values
- Solutions that addressed specific community needs

Always consider cultural safety, community ownership, and the importance of local adaptation when identifying patterns.`;

  const userPrompt = `Analyze this document to identify success patterns - specific programs, approaches, or interventions that achieved positive outcomes and could potentially be replicated.

${communityContext ? `Community Context: ${communityContext}\n\n` : ''}
${documentTitle ? `Document: ${documentTitle}\n\n` : ''}

Document Content:
${documentContent}

For each success pattern identified, provide:

{
  "successPatterns": [
    {
      "pattern": "Clear, specific description of the successful approach/program",
      "communities": ["List of communities where this was successful"],
      "replicability": 0.0-1.0, // How easily this could be replicated elsewhere
      "requirements": ["Specific requirements needed to implement this pattern"],
      "evidence": ["Specific evidence from the document supporting this as a success"],
      "outcomes": ["Specific positive outcomes achieved"],
      "category": "youth_development|cultural_strengthening|service_delivery|economic_development|community_engagement|education|health_wellbeing",
      "successFactors": ["Key factors that made this successful"],
      "challenges": ["Challenges that were overcome"],
      "timeline": "How long it took to achieve results",
      "resources": ["Resources required (funding, staff, infrastructure, etc.)"],
      "stakeholders": ["Key stakeholders involved"],
      "scalability": "local|regional|territory_wide|national",
      "culturalSafety": "high|medium|low", // How well it respects cultural protocols
      "sustainability": 0.0-1.0 // How sustainable this approach appears to be
    }
  ]
}

Only identify patterns where there is clear evidence of success and positive outcomes. Be specific about what made each pattern successful and what would be needed to replicate it.

Respond with valid JSON only.`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    let response: string | null = null;

    if (provider === 'moonshot') {
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
    } else if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
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
      const completion = await openai!.chat.completions.create({
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
    }

    if (!response) {
      return [];
    }

    const parsed = extractJSON(response);
    return parsed.successPatterns || [];
  } catch (error) {
    console.error('Success pattern identification error:', error);
    return [];
  }
}

/**
 * Create reusable pattern templates from identified success patterns
 */
export async function createPatternTemplates(
  successPatterns: SuccessPattern[]
): Promise<PatternTemplate[]> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = `You are an expert in program design and community development, specializing in creating reusable templates and implementation guides from successful community programs.

Your task is to transform identified success patterns into practical, step-by-step templates that other communities can adapt and implement.

Focus on:
- Clear, actionable implementation steps
- Realistic timelines and resource requirements
- Potential risks and mitigation strategies
- Adaptation guidance for different community contexts
- Measurable outcomes and success indicators
- Cultural safety considerations`;

  const userPrompt = `Transform these success patterns into reusable implementation templates:

${JSON.stringify(successPatterns, null, 2)}

For each pattern, create a comprehensive template:

{
  "templates": [
    {
      "id": "unique-template-id",
      "name": "Template name",
      "description": "Clear description of what this template helps achieve",
      "pattern": {original pattern object},
      "implementationGuide": {
        "steps": ["Step-by-step implementation instructions"],
        "timeline": "Realistic timeline for implementation",
        "resources": ["Detailed resource requirements"],
        "risks": ["Potential implementation risks"],
        "mitigations": ["Risk mitigation strategies"]
      },
      "adaptationGuidance": ["How to adapt this for different community contexts"],
      "measurableOutcomes": ["Specific, measurable outcomes to track success"]
    }
  ]
}

Make the templates practical and actionable. Include enough detail that a community could realistically implement the pattern using this template.

Respond with valid JSON only.`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    let response: string | null = null;

    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });
      response = completion.choices[0]?.message?.content;
    } else if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 4000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      const content = completion.content[0];
      if (content && content.type === 'text') {
        response = content.text;
      }
    } else if (provider === 'openai') {
      const completion = await openai!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      response = completion.choices[0]?.message?.content;
    }

    if (!response) {
      return [];
    }

    const parsed = extractJSON(response);
    return parsed.templates || [];
  } catch (error) {
    console.error('Pattern template creation error:', error);
    return [];
  }
}

/**
 * Analyze success patterns across multiple communities to identify cross-community trends
 */
export async function analyzeCrossCommunityPatterns(
  communityPatterns: Array<{
    communityId: string;
    communityName: string;
    patterns: SuccessPattern[];
  }>
): Promise<CrossCommunityAnalysis> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = `You are an expert in comparative community development analysis, specializing in identifying patterns, trends, and replication opportunities across multiple Aboriginal and Torres Strait Islander communities.

Your task is to analyze success patterns from multiple communities to identify:
- Shared patterns that work across different communities
- Unique approaches that might be transferable
- Emerging trends in community development
- Opportunities for pattern replication

Consider cultural diversity, community contexts, and the importance of local adaptation while identifying transferable elements.`;

  const userPrompt = `Analyze these success patterns from multiple communities to identify cross-community insights:

${JSON.stringify(communityPatterns, null, 2)}

Provide analysis in this format:

{
  "sharedPatterns": [
    {success patterns that appear across multiple communities}
  ],
  "uniqueApproaches": [
    {
      "community": "community name",
      "approach": "unique approach description",
      "effectiveness": 0.0-1.0,
      "transferability": 0.0-1.0
    }
  ],
  "emergingTrends": [
    {
      "trend": "trend description",
      "communities": ["communities showing this trend"],
      "strength": 0.0-1.0,
      "trajectory": "emerging|growing|stable|declining"
    }
  ],
  "replicationOpportunities": [
    {
      "sourcePattern": "pattern description",
      "sourceCommunity": "where it's working",
      "targetCommunities": ["communities that could benefit"],
      "adaptationNeeds": ["what would need to be adapted"],
      "expectedOutcomes": ["likely outcomes if replicated"]
    }
  ]
}

Focus on practical insights that could inform community development strategies and policy decisions.

Respond with valid JSON only.`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    let response: string | null = null;

    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });
      response = completion.choices[0]?.message?.content;
    } else if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      const content = completion.content[0];
      if (content && content.type === 'text') {
        response = content.text;
      }
    } else if (provider === 'openai') {
      const completion = await openai!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      response = completion.choices[0]?.message?.content;
    }

    if (!response) {
      return {
        sharedPatterns: [],
        uniqueApproaches: [],
        emergingTrends: [],
        replicationOpportunities: []
      };
    }

    const parsed = extractJSON(response);
    return {
      sharedPatterns: parsed.sharedPatterns || [],
      uniqueApproaches: parsed.uniqueApproaches || [],
      emergingTrends: parsed.emergingTrends || [],
      replicationOpportunities: parsed.replicationOpportunities || []
    };
  } catch (error) {
    console.error('Cross-community pattern analysis error:', error);
    return {
      sharedPatterns: [],
      uniqueApproaches: [],
      emergingTrends: [],
      replicationOpportunities: []
    };
  }
}

/**
 * Generate recommendations for implementing a success pattern in a new community
 */
export async function generateImplementationRecommendations(
  pattern: SuccessPattern,
  targetCommunityContext: string
): Promise<{
  feasibility: number; // 0-1
  adaptations: string[];
  timeline: string;
  resources: string[];
  risks: string[];
  successProbability: number; // 0-1
  keyStakeholders: string[];
  firstSteps: string[];
}> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = `You are an expert in community program implementation and adaptation, specializing in helping communities successfully implement proven approaches while respecting local contexts and cultural protocols.

Your task is to analyze a success pattern and provide specific recommendations for implementing it in a new community context.

Consider:
- Local community context and capacity
- Cultural appropriateness and safety
- Resource availability and constraints
- Stakeholder engagement requirements
- Risk factors and mitigation strategies
- Realistic timelines and expectations`;

  const userPrompt = `Analyze this success pattern and provide implementation recommendations for the target community:

Success Pattern:
${JSON.stringify(pattern, null, 2)}

Target Community Context:
${targetCommunityContext}

Provide recommendations in this format:

{
  "feasibility": 0.0-1.0, // How feasible this implementation would be
  "adaptations": ["Specific adaptations needed for this community"],
  "timeline": "Realistic implementation timeline",
  "resources": ["Specific resources needed"],
  "risks": ["Implementation risks to consider"],
  "successProbability": 0.0-1.0, // Likelihood of success
  "keyStakeholders": ["Key stakeholders to engage"],
  "firstSteps": ["Immediate first steps to begin implementation"]
}

Be realistic about challenges and requirements. Focus on actionable recommendations.

Respond with valid JSON only.`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    let response: string | null = null;

    if (provider === 'moonshot') {
      const completion = await moonshotClient!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });
      response = completion.choices[0]?.message?.content;
    } else if (provider === 'anthropic') {
      const completion = await anthropic!.messages.create({
        model: modelConfig.model,
        max_tokens: 2000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      const content = completion.content[0];
      if (content && content.type === 'text') {
        response = content.text;
      }
    } else if (provider === 'openai') {
      const completion = await openai!.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      response = completion.choices[0]?.message?.content;
    }

    if (!response) {
      return {
        feasibility: 0,
        adaptations: [],
        timeline: '',
        resources: [],
        risks: [],
        successProbability: 0,
        keyStakeholders: [],
        firstSteps: []
      };
    }

    const parsed = extractJSON(response);
    return {
      feasibility: parsed.feasibility || 0,
      adaptations: parsed.adaptations || [],
      timeline: parsed.timeline || '',
      resources: parsed.resources || [],
      risks: parsed.risks || [],
      successProbability: parsed.successProbability || 0,
      keyStakeholders: parsed.keyStakeholders || [],
      firstSteps: parsed.firstSteps || []
    };
  } catch (error) {
    console.error('Implementation recommendation error:', error);
    return {
      feasibility: 0,
      adaptations: [],
      timeline: '',
      resources: [],
      risks: [],
      successProbability: 0,
      keyStakeholders: [],
      firstSteps: []
    };
  }
}