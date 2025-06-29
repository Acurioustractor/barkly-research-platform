/**
 * Core data schemas for community research projects
 * These interfaces define the structure for all community data
 */

export interface CulturalProtocol {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  guidelines: string[];
}

export interface DataSourceType {
  id: string;
  type: 'interview' | 'survey' | 'observation' | 'document' | 'workshop' | 'artifact';
  description: string;
  collectionMethod: string;
  ethicalConsiderations?: string[];
}

export interface ParticipantGroup {
  id: string;
  name: string;
  description: string;
  size: number;
  ageRange?: {
    min: number;
    max: number;
  };
  culturalBackground?: string[];
  consentProcess: string;
}

export interface Quote {
  id: string;
  text: string;
  participantId?: string;
  participantPseudonym: string;
  context?: string;
  theme: string[];
  culturallySensitive: boolean;
  permissions: {
    canShare: boolean;
    canAttribute: boolean;
    restrictions?: string[];
  };
}

export interface ServiceData {
  id: string;
  serviceName: string;
  serviceType: string;
  coverage: string;
  effectiveness?: {
    rating: number;
    evidence: string[];
  };
  gaps?: string[];
  communityFeedback?: Quote[];
}

export interface Service {
  id: string;
  name: string;
  type: string;
  provider: string;
  location: string;
  culturallyAppropriate: boolean;
  youthSpecific: boolean;
  accessibility: {
    physical: boolean;
    cultural: boolean;
    linguistic: boolean;
    financial: boolean;
  };
}

export interface SystemConnection {
  id: string;
  from: string;
  to: string;
  type: 'supports' | 'blocks' | 'influences' | 'requires' | 'enables';
  strength: 'strong' | 'medium' | 'weak';
  description: string;
  evidence?: string[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'finding' | 'recommendation' | 'observation' | 'challenge' | 'opportunity';
  themes: string[];
  supportingEvidence: {
    quotes?: string[];
    data?: string[];
    observations?: string[];
  };
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface Outcome {
  id: string;
  title: string;
  description: string;
  type: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  indicators: string[];
  achieved: boolean;
  evidence?: string[];
  timeline?: {
    target: Date;
    actual?: Date;
  };
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'completed' | 'paused';
  activities: string[];
  outcomes: string[];
  learnings?: string[];
}

export interface CommunityTheme {
  id: string;
  title: string;
  description: string;
  youthVoices: Quote[];
  communityVoices: Quote[];
  serviceData: ServiceData[];
  supportingServices: Service[];
  systemConnections: SystemConnection[];
  culturalContext?: string;
  emergentPatterns?: string[];
}

export interface CommunityProject {
  id: string;
  name: string;
  region: string;
  description: string;
  culturalContext: {
    traditionalOwners: string[];
    languages: string[];
    culturalProtocols: CulturalProtocol[];
    acknowledgement: string;
  };
  methodology: {
    type: 'UMEL' | 'Participatory' | 'Community-Led' | 'Mixed';
    frameworks: string[];
    dataSourceTypes: DataSourceType[];
    ethicalFramework: string;
  };
  participants: ParticipantGroup[];
  themes: CommunityTheme[];
  insights: Insight[];
  outcomes: Outcome[];
  timeline: ProjectPhase[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    dataGovernance: {
      owner: string;
      custodian: string;
      accessLevel: 'public' | 'restricted' | 'confidential';
      retentionPolicy: string;
    };
  };
}