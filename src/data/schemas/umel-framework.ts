/**
 * UMEL (Understanding, Measurement, Evaluation, Learning) Framework
 * Indigenous-led research methodology for community-centered insights
 */

export interface UnderstandingPhase {
  id: string;
  objectives: string[];
  culturalConsiderations: string[];
  communityEngagement: {
    method: string;
    participants: string[];
    protocols: string[];
  };
  keyQuestions: string[];
  initialFindings: string[];
  challengesIdentified: string[];
}

export interface MeasurementPhase {
  id: string;
  indicators: {
    id: string;
    name: string;
    type: 'quantitative' | 'qualitative' | 'mixed';
    description: string;
    dataSource: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    culturallyAppropriate: boolean;
  }[];
  dataCollection: {
    methods: string[];
    tools: string[];
    timeline: {
      start: Date;
      end: Date;
    };
    challenges?: string[];
  };
  baseline?: {
    established: boolean;
    data: Record<string, unknown>;
    date: Date;
  };
}

export interface EvaluationPhase {
  id: string;
  approach: 'formative' | 'summative' | 'developmental' | 'mixed';
  criteria: {
    id: string;
    name: string;
    description: string;
    weight: number;
  }[];
  findings: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: {
    id: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    actionRequired: string[];
    timeline?: string;
  }[];
}

export interface LearningPhase {
  id: string;
  keyLearnings: {
    id: string;
    insight: string;
    evidence: string[];
    implications: string[];
    shareability: 'public' | 'community-only' | 'restricted';
  }[];
  knowledgeProducts: {
    type: 'report' | 'story' | 'video' | 'workshop' | 'toolkit' | 'other';
    title: string;
    description: string;
    audience: string[];
    culturalClearance: boolean;
  }[];
  capacityBuilding: {
    area: string;
    participants: string[];
    outcomes: string[];
  }[];
  futureDirections: string[];
}

export interface CommunityInsight {
  id: string;
  source: 'elder' | 'youth' | 'family' | 'service-provider' | 'community-member';
  insight: string;
  context: string;
  themes: string[];
  culturalSignificance?: string;
  verificationStatus: 'verified' | 'pending' | 'contested';
}

export interface AcademicInsight {
  id: string;
  source: string;
  theory: string;
  relevance: string;
  limitations?: string[];
  culturalAppropriateness: 'high' | 'medium' | 'low';
}

export interface SharedInsight {
  id: string;
  communityInsight: string;
  academicInsight: string;
  synthesis: string;
  actionImplications: string[];
  consensusLevel: 'full' | 'majority' | 'partial' | 'emerging';
}

export interface Action {
  id: string;
  title: string;
  description: string;
  type: 'intervention' | 'policy' | 'program' | 'research' | 'advocacy';
  leadOrganization: string;
  communityRole: string;
  timeline: {
    start: Date;
    milestones: {
      date: Date;
      description: string;
    }[];
  };
  resources: {
    type: string;
    description: string;
    secured: boolean;
  }[];
  expectedOutcomes: string[];
}

export interface MiddleSpaceData {
  id: string;
  projectId: string;
  communityKnowledge: CommunityInsight[];
  academicKnowledge: AcademicInsight[];
  sharedUnderstanding: SharedInsight[];
  collaborativeActions: Action[];
  bridgingStrategies: string[];
  tensionsIdentified?: {
    description: string;
    resolution?: string;
  }[];
}

export interface UMELFramework {
  id: string;
  projectId: string;
  understanding: UnderstandingPhase;
  measurement: MeasurementPhase;
  evaluation: EvaluationPhase;
  learning: LearningPhase;
  middleSpace: MiddleSpaceData;
  iterationCycle: number;
  status: 'active' | 'completed' | 'paused';
  nextSteps: string[];
}