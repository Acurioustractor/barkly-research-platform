export interface AIAnalysisResult {
    summary: string;
    themes: Array<{
        name: string;
        confidence: number;
        evidence: string;
    }>;
    quotes: Array<{
        text: string;
        context: string;
        significance: string;
        confidence: number;
    }>;
    keywords: Array<{
        term: string;
        frequency: number;
        category: 'community' | 'technical' | 'emotional' | 'general';
    }>;
    insights: Array<{
        text: string;
        category: string;
        importance: number;
    }>;
}

export interface CommunityIntelligenceResult extends AIAnalysisResult {
    communityNeeds: Array<{
        need: string;
        urgency: 'low' | 'medium' | 'high' | 'critical';
        community: string;
        evidence: string[];
        confidence: number;
        category: 'housing' | 'youth_development' | 'health' | 'employment' | 'culture' | 'justice' | 'environment' | 'education';
    }>;

    serviceGaps: Array<{
        service: string;
        location: string;
        impact: number;
        recommendations: string[];
        urgency: 'low' | 'medium' | 'high' | 'critical';
        evidence: string[];
    }>;

    successPatterns: Array<{
        pattern: string;
        communities: string[];
        replicability: number;
        requirements: string[];
        evidence: string[];
        outcomes: string[];
    }>;

    riskFactors: Array<{
        risk: string;
        probability: number;
        impact: number;
        mitigation: string[];
        evidence: string[];
        communities: string[];
    }>;

    opportunities: Array<{
        opportunity: string;
        potential: number;
        requirements: string[];
        timeline: string;
        evidence: string[];
        communities: string[];
    }>;

    assets: Array<{
        asset: string;
        type: 'human' | 'physical' | 'cultural' | 'social' | 'economic';
        strength: number;
        communities: string[];
        evidence: string[];
        potential: string[];
    }>;
}

export interface ChunkAnalysisResult {
    text: string;
    startIndex: number;
    endIndex: number;
}
