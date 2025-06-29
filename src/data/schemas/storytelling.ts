/**
 * Storytelling schemas for narrative-driven data presentation
 * Enables interactive, culturally sensitive story experiences
 */

export interface DataPoint {
  id: string;
  type: 'statistic' | 'quote' | 'observation' | 'milestone' | 'comparison';
  value: string | number;
  label: string;
  source?: string;
  context?: string;
  visualizationType?: 'number' | 'chart' | 'icon' | 'timeline' | 'comparison';
}

export interface Choice {
  id: string;
  text: string;
  consequence: string;
  nextChapterId: string;
  impact?: {
    type: 'positive' | 'negative' | 'neutral' | 'mixed';
    description: string;
  };
  culturalConsideration?: string;
}

export interface Consequence {
  id: string;
  choiceId: string;
  immediateEffect: string;
  longTermEffect?: string;
  affectedStakeholders: string[];
  systemicChange?: string;
  reversible: boolean;
}

export interface StoryChapter {
  id: string;
  title: string;
  narrative: string;
  culturalContext?: string;
  culturalWarning?: {
    present: boolean;
    message?: string;
    type?: 'sensitive-content' | 'sacred-knowledge' | 'gender-specific' | 'age-specific';
  };
  dataPoints: DataPoint[];
  visualMetaphor?: {
    type: string;
    description: string;
    culturalSignificance?: string;
  };
  voiceNarration?: {
    available: boolean;
    narratorType: 'elder' | 'youth' | 'community-member' | 'neutral';
    audioUrl?: string;
  };
  interactiveElements?: {
    type: 'clickable-map' | 'timeline' | 'comparison' | 'quiz' | 'reflection';
    data: Record<string, unknown>;
  }[];
  nextChoices: Choice[];
  previousChapterId?: string;
  themes: string[];
}

export interface AdventurePath {
  id: string;
  scenario: string;
  startingChapterId: string;
  possibleEndings: {
    id: string;
    type: 'positive' | 'challenging' | 'realistic' | 'aspirational';
    description: string;
    achievementCriteria: string[];
  }[];
  choices: Choice[];
  consequences: Consequence[];
  learningOutcomes: string[];
  targetAudience: string[];
  estimatedDuration: number; // in minutes
}

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  themes: string[];
  chapters: StoryChapter[];
  adventurePaths: AdventurePath[];
  culturalProtocols: string[];
  metadata: {
    author: string;
    culturalReviewers: string[];
    lastReviewed: Date;
    approvalStatus: 'approved' | 'pending' | 'requires-revision';
  };
}

export interface InteractiveScenario {
  id: string;
  title: string;
  context: string;
  rolePlay: {
    availableRoles: {
      id: string;
      name: string;
      description: string;
      perspective: string;
      constraints?: string[];
    }[];
    objectives: string[];
  };
  decisionPoints: {
    id: string;
    situation: string;
    options: {
      id: string;
      action: string;
      reasoning: string;
      culturalImplications?: string;
    }[];
    feedback: {
      immediate: string;
      reflection: string;
    };
  }[];
  debrief: {
    keyTakeaways: string[];
    realWorldApplication: string[];
    furtherResources: string[];
  };
}

export interface NarrativeExperience {
  id: string;
  projectId: string;
  title: string;
  tagline: string;
  introduction: string;
  storyArcs: StoryArc[];
  interactiveScenarios: InteractiveScenario[];
  accessibility: {
    languages: string[];
    readingLevel: 'basic' | 'intermediate' | 'advanced';
    visualDescriptions: boolean;
    audioNarration: boolean;
    signLanguage?: boolean;
  };
  culturalGuidance: {
    appropriateAudience: string[];
    restrictions?: string[];
    consultationProcess: string;
  };
}