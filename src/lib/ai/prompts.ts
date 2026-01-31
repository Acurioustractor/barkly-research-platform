export const ANALYSIS_SYSTEM_PROMPT = `You are a document analyst specializing in community research and youth development. 
Extract key themes, significant quotes, and actionable insights from the text.
Focus on clarity and relevance. Respond in JSON format only.`;

export const ANALYSIS_USER_PROMPT = (chunkText: string, documentContext?: string) => `Analyze this document chunk:
${documentContext ? `Context: ${documentContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "summary": "2-3 sentence summary",
  "themes": [
    {
      "name": "theme name",
      "confidence": 0.0-1.0,
      "evidence": "supporting text"
    }
  ],
  "quotes": [
    {
      "text": "significant quote",
      "context": "surrounding context",
      "significance": "why this matters",
      "confidence": 0.0-1.0
    }
  ],
  "keywords": [
    {
      "term": "keyword",
      "frequency": 1,
      "category": "community|technical|emotional|general"
    }
  ],
  "insights": [
    {
      "text": "actionable insight",
      "category": "opportunity|challenge|recommendation",
      "importance": 1-10
    }
  ]
}

Focus on 3-5 key themes, 2-4 important quotes, and 3-5 actionable insights.`;

export const SUMMARY_SYSTEM_PROMPT = 'You are an expert at creating clear, comprehensive document summaries.';

export const SUMMARY_USER_PROMPT = (text: string, title?: string) => `Generate a comprehensive summary of this document${title ? ` titled "${title}"` : ''}.
The summary should:
1. Capture the main themes and arguments
2. Highlight key findings or recommendations
3. Note any significant patterns or trends
4. Be 3-5 paragraphs long

Document text:
${text}`;

export const THEME_System_PROMPT = 'You are an expert at identifying themes in documents. Always respond with valid JSON.';

export const THEME_USER_PROMPT = (text: string, themes: string[]) => `Analyze this text and identify which of these themes are present:
${themes.join(', ')}

For each theme found, provide:
1. Theme name (from the list above)
2. Confidence score (0.0-1.0)
3. Supporting evidence from the text

Text to analyze:
${text}

Respond in JSON format: [{"name": "theme", "confidence": 0.0-1.0, "evidence": "supporting text"}]`;

export const INSIGHTS_SYSTEM_PROMPT = 'You are a strategic analyst generating actionable insights from documents. Always respond with valid JSON.';

export const INSIGHTS_USER_PROMPT = (text: string, themes: string[]) => `Based on this text and the identified themes (${themes.join(', ')}), generate strategic insights.

Each insight should:
1. Be actionable and specific
2. Relate to one of the themes
3. Have an importance score (1-10)

Text:
${text}

Respond in JSON format: [{"text": "insight", "category": "theme", "importance": 1-10}]`;

export const SUCCESS_PATTERNS_SYSTEM_PROMPT = `You are an expert in community development and program evaluation, specializing in identifying successful interventions and programs that have achieved positive outcomes in Aboriginal and Torres Strait Islander communities.

Analyze documents to identify success patterns - specific approaches, programs, or interventions that have demonstrated positive results and could potentially be replicated in other communities.

Focus on:
- Programs or initiatives that achieved their intended outcomes
- Approaches that overcame significant challenges
- Interventions that showed measurable community impact
- Strategies that engaged community members effectively
- Methods that respected cultural protocols and values
- Solutions that addressed specific community needs

Always consider cultural safety, community ownership, and the importance of local adaptation.`;

export const SUCCESS_PATTERNS_USER_PROMPT = (chunkText: string, documentContext?: string, communityContext?: string) => `Analyze this text to identify success patterns:
${documentContext ? `Context: ${documentContext}\n\n` : ''}
${communityContext ? `Community: ${communityContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "successPatterns": [
    {
      "pattern": "specific description of successful approach/program",
      "communities": ["communities where this was successful"],
      "replicability": 0.0-1.0,
      "requirements": ["requirements needed to implement"],
      "evidence": ["evidence supporting this as a success"],
      "outcomes": ["positive outcomes achieved"]
    }
  ]
}

Only identify patterns with clear evidence of success and positive outcomes.`;

export const COMMUNITY_INTELLIGENCE_SYSTEM_PROMPT = `You are a community intelligence analyst specializing in Aboriginal community development and the Barkly Regional Deal. 
Your role is to extract comprehensive community intelligence from documents, identifying needs, gaps, opportunities, success patterns, and risks.
Focus on the five community priorities: youth safety, learning, employment pathways, cultural strengthening, and service delivery.
Always maintain cultural sensitivity and respect for Aboriginal knowledge systems.
Respond in JSON format only.`;

export const COMMUNITY_INTELLIGENCE_USER_PROMPT = (chunkText: string, documentContext?: string, communityContext?: string) => `Analyze this document chunk for comprehensive community intelligence:
${documentContext ? `Document Context: ${documentContext}\n\n` : ''}
${communityContext ? `Community Context: ${communityContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "summary": "2-3 sentence summary",
  "themes": [
    {
      "name": "theme name",
      "confidence": 0.0-1.0,
      "evidence": "supporting text"
    }
  ],
  "quotes": [
    {
      "text": "significant quote",
      "context": "surrounding context", 
      "significance": "why this matters",
      "confidence": 0.0-1.0
    }
  ],
  "keywords": [
    {
      "term": "keyword",
      "frequency": 1,
      "category": "community|technical|emotional|general"
    }
  ],
  "insights": [
    {
      "text": "actionable insight",
      "category": "opportunity|challenge|recommendation",
      "importance": 1-10
    }
  ],
  "communityNeeds": [
    {
      "need": "specific community need",
      "urgency": "low|medium|high|critical",
      "community": "community name or 'regional'",
      "evidence": ["supporting evidence from text"],
      "confidence": 0.0-1.0,
      "category": "housing|youth_development|health|employment|culture|justice|environment|education"
    }
  ],
  "serviceGaps": [
    {
      "service": "missing or inadequate service",
      "location": "where the gap exists",
      "impact": 1-10,
      "recommendations": ["suggested solutions"],
      "urgency": "low|medium|high|critical",
      "evidence": ["supporting evidence"]
    }
  ],
  "successPatterns": [
    {
      "pattern": "what's working well",
      "communities": ["communities where this works"],
      "replicability": 0.0-1.0,
      "requirements": ["what's needed to replicate"],
      "evidence": ["supporting evidence"],
      "outcomes": ["positive results achieved"]
    }
  ],
  "riskFactors": [
    {
      "risk": "potential issue or concern",
      "probability": 0.0-1.0,
      "impact": 1-10,
      "mitigation": ["suggested mitigation strategies"],
      "evidence": ["supporting evidence"],
      "communities": ["affected communities"]
    }
  ],
  "opportunities": [
    {
      "opportunity": "potential for positive change",
      "potential": 1-10,
      "requirements": ["what's needed to realize"],
      "timeline": "timeframe estimate",
      "evidence": ["supporting evidence"],
      "communities": ["communities that could benefit"]
    }
  ],
  "assets": [
    {
      "asset": "community strength or resource",
      "type": "human|physical|cultural|social|economic",
      "strength": 1-10,
      "communities": ["communities with this asset"],
      "evidence": ["supporting evidence"],
      "potential": ["how this could be leveraged"]
    }
  ]
}

Focus on identifying 2-3 items per intelligence category where evidence exists in the text.`;
