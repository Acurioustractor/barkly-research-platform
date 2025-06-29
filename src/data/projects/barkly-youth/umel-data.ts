import { UMELFramework, MiddleSpaceData } from '@/data/schemas';

/**
 * UMEL Framework data for the Barkly Youth project
 * Demonstrates the four phases of Understanding, Measurement, Evaluation, and Learning
 */

const middleSpaceData: MiddleSpaceData = {
  id: 'middle-space-1',
  projectId: 'barkly-youth-2024',
  communityKnowledge: [
    {
      id: 'ck-1',
      source: 'elder',
      insight: 'Young people learn best when they can see the connection to their culture and country',
      context: 'Elder Mary shared this during consultation about education approaches',
      themes: ['education', 'cultural-connection'],
      culturalSignificance: 'Reflects traditional learning through observation and practice',
      verificationStatus: 'verified'
    },
    {
      id: 'ck-2',
      source: 'youth',
      insight: 'We want to be involved in making decisions, not just told what to do',
      context: 'Common theme from youth workshops',
      themes: ['youth-voice', 'agency'],
      verificationStatus: 'verified'
    },
    {
      id: 'ck-3',
      source: 'family',
      insight: 'Programs work better when the whole family is involved, not just the young person',
      context: 'Parent feedback during community meeting',
      themes: ['family-engagement', 'holistic-support'],
      verificationStatus: 'verified'
    }
  ],
  academicKnowledge: [
    {
      id: 'ak-1',
      source: 'Positive Youth Development Framework',
      theory: 'Youth thrive when they have opportunities for meaningful participation and contribution',
      relevance: 'Aligns with youth expressions of wanting agency and voice',
      limitations: ['Western framework may not fully capture Indigenous perspectives'],
      culturalAppropriateness: 'medium'
    },
    {
      id: 'ak-2',
      source: 'Two-Eyed Seeing (Etuaptmumk)',
      theory: 'Strength comes from using both Indigenous and Western ways of knowing',
      relevance: 'Directly addresses the two-worlds navigation challenge youth face',
      culturalAppropriateness: 'high'
    }
  ],
  sharedUnderstanding: [
    {
      id: 'su-1',
      communityInsight: 'Cultural connection strengthens youth identity',
      academicInsight: 'Identity formation is crucial for adolescent wellbeing',
      synthesis: 'Culturally-grounded programs that explicitly strengthen identity show better outcomes for Aboriginal youth',
      actionImplications: [
        'Embed cultural activities in all youth programs',
        'Create regular opportunities for Elder-youth connection',
        'Develop metrics that capture cultural wellbeing'
      ],
      consensusLevel: 'full'
    },
    {
      id: 'su-2',
      communityInsight: 'Youth want meaningful participation',
      academicInsight: 'Agency and voice are key to positive youth development',
      synthesis: 'Co-design approaches with youth as genuine partners lead to more effective and sustained programs',
      actionImplications: [
        'Establish youth advisory mechanisms',
        'Build youth capacity for leadership',
        'Create feedback loops that demonstrate youth input impact'
      ],
      consensusLevel: 'full'
    }
  ],
  collaborativeActions: [
    {
      id: 'action-1',
      title: 'Youth Voice Initiative',
      description: 'Establish ongoing mechanisms for youth input into regional planning and service design',
      type: 'program',
      leadOrganization: 'Barkly Regional Deal',
      communityRole: 'Youth as co-designers and decision-makers',
      timeline: {
        start: new Date('2024-07-01'),
        milestones: [
          { date: new Date('2024-08-01'), description: 'Youth advisory group established' },
          { date: new Date('2024-10-01'), description: 'First youth-led community project' }
        ]
      },
      resources: [
        { type: 'funding', description: 'Ongoing program funding', secured: false },
        { type: 'staffing', description: 'Youth coordinator position', secured: true }
      ],
      expectedOutcomes: [
        'Increased youth engagement in community decisions',
        'Improved service responsiveness to youth needs',
        'Stronger youth leadership capacity'
      ]
    }
  ],
  bridgingStrategies: [
    'Regular dialogue sessions between researchers and community',
    'Visual methods to share findings in culturally appropriate ways',
    'Youth as co-researchers to bridge generational knowledge'
  ],
  tensionsIdentified: [
    {
      description: 'Timeline pressures from funders vs community relationship building needs',
      resolution: 'Negotiated extended timeline with emphasis on process outcomes'
    }
  ]
};

export const barklyYouthUMEL: UMELFramework = {
  id: 'umel-barkly-youth-2024',
  projectId: 'barkly-youth-2024',
  understanding: {
    id: 'understanding-1',
    objectives: [
      'Understand youth experiences in the Barkly region',
      'Map existing services and support systems',
      'Identify cultural strengths and resources',
      'Explore youth aspirations and barriers'
    ],
    culturalConsiderations: [
      'Respect for Elder knowledge and guidance',
      'Appropriate gender considerations',
      'Cultural calendar and sorry business',
      'Language preferences and communication styles'
    ],
    communityEngagement: {
      method: 'Culturally responsive yarning circles and workshops',
      participants: ['Youth', 'Elders', 'Families', 'Service providers'],
      protocols: ['Elder approval', 'Safe spaces', 'Cultural mentors present']
    },
    keyQuestions: [
      'What does a good life look like for young people here?',
      'What helps and what gets in the way?',
      'How can services better support youth aspirations?',
      'What cultural strengths can be built upon?'
    ],
    initialFindings: [
      'Strong cultural identity is protective but needs nurturing',
      'Youth want agency but lack opportunities',
      'Service system is fragmented and difficult to navigate',
      'Family and community connections are crucial'
    ],
    challengesIdentified: [
      'Geographic distances and transport',
      'Language barriers in service delivery',
      'Mistrust of government services',
      'Limited local employment pathways'
    ]
  },
  measurement: {
    id: 'measurement-1',
    indicators: [
      {
        id: 'ind-1',
        name: 'Youth Wellbeing',
        type: 'mixed',
        description: 'Holistic measure including cultural, social, emotional, and physical wellbeing',
        dataSource: 'Youth self-report and family observations',
        frequency: 'quarterly',
        culturallyAppropriate: true
      },
      {
        id: 'ind-2',
        name: 'Service Engagement',
        type: 'quantitative',
        description: 'Youth participation rates in available services',
        dataSource: 'Service provider data',
        frequency: 'monthly',
        culturallyAppropriate: true
      },
      {
        id: 'ind-3',
        name: 'Cultural Connection',
        type: 'qualitative',
        description: 'Strength of connection to culture, country, and community',
        dataSource: 'Elder assessments and youth stories',
        frequency: 'quarterly',
        culturallyAppropriate: true
      }
    ],
    dataCollection: {
      methods: ['Yarning circles', 'Creative workshops', 'Digital storytelling', 'Service data analysis'],
      tools: ['Culturally adapted wellbeing survey', 'Story collection app', 'Community mapping'],
      timeline: {
        start: new Date('2024-04-01'),
        end: new Date('2024-12-31')
      },
      challenges: ['Maintaining consistency across communities', 'Technology access']
    },
    baseline: {
      established: true,
      data: {
        youthWellbeing: { average: 6.2, scale: 10 },
        serviceEngagement: { percentage: 45 },
        culturalConnection: { strong: 30, moderate: 45, weak: 25 }
      },
      date: new Date('2024-04-30')
    }
  },
  evaluation: {
    id: 'evaluation-1',
    approach: 'developmental',
    criteria: [
      {
        id: 'crit-1',
        name: 'Cultural Appropriateness',
        description: 'How well do interventions align with cultural values and practices?',
        weight: 0.3
      },
      {
        id: 'crit-2',
        name: 'Youth Engagement',
        description: 'Level of genuine youth participation and ownership',
        weight: 0.25
      },
      {
        id: 'crit-3',
        name: 'Sustainability',
        description: 'Likelihood of continued benefit beyond funding period',
        weight: 0.25
      },
      {
        id: 'crit-4',
        name: 'System Change',
        description: 'Impact on service system responsiveness',
        weight: 0.2
      }
    ],
    findings: {
      strengths: [
        'Strong community ownership of research process',
        'Youth increasingly engaged as findings reflect their voices',
        'Cultural protocols strengthened through research'
      ],
      weaknesses: [
        'Limited reach to most disengaged youth',
        'Service system change is slow',
        'Funding uncertainty affects planning'
      ],
      opportunities: [
        'Youth leadership development showing promise',
        'Cross-sector collaboration improving',
        'Digital platforms enabling new forms of connection'
      ],
      threats: [
        'Staff turnover in key organizations',
        'Competing community priorities',
        'External policy changes'
      ]
    },
    recommendations: [
      {
        id: 'rec-1',
        priority: 'high',
        description: 'Establish permanent youth voice mechanisms',
        actionRequired: ['Funding commitment', 'Organizational policy change', 'Youth capacity building'],
        timeline: '6 months'
      },
      {
        id: 'rec-2',
        priority: 'high',
        description: 'Develop cultural mentorship program',
        actionRequired: ['Elder engagement', 'Resource allocation', 'Program design with youth'],
        timeline: '3 months'
      },
      {
        id: 'rec-3',
        priority: 'medium',
        description: 'Improve service coordination',
        actionRequired: ['Inter-agency agreements', 'Shared data systems', 'Regular collaboration meetings'],
        timeline: '12 months'
      }
    ]
  },
  learning: {
    id: 'learning-1',
    keyLearnings: [
      {
        id: 'learn-1',
        insight: 'Youth voice must be embedded from the start, not added later',
        evidence: ['Higher engagement when youth involved in planning', 'Better outcomes in co-designed elements'],
        implications: ['Restructure all programs to include youth governance', 'Build youth facilitation skills'],
        shareability: 'public'
      },
      {
        id: 'learn-2',
        insight: 'Cultural safety is prerequisite for youth wellbeing',
        evidence: ['Youth wellbeing scores correlate with cultural connection', 'Safe spaces enable authentic participation'],
        implications: ['All services need cultural competency', 'Physical spaces need cultural elements'],
        shareability: 'public'
      },
      {
        id: 'learn-3',
        insight: 'Flexible, responsive approaches work better than rigid programs',
        evidence: ['Higher retention in adaptive programs', 'Community feedback on what works'],
        implications: ['Funders need to allow flexibility', 'Build in regular review cycles'],
        shareability: 'community-only'
      }
    ],
    knowledgeProducts: [
      {
        type: 'story',
        title: 'Youth Voices of the Barkly',
        description: 'Digital stories created by youth about their experiences and aspirations',
        audience: ['Community', 'Service providers', 'Policy makers'],
        culturalClearance: true
      },
      {
        type: 'toolkit',
        title: 'Two-Ways Youth Engagement Guide',
        description: 'Practical guide for services on culturally responsive youth engagement',
        audience: ['Service providers', 'Government agencies'],
        culturalClearance: true
      }
    ],
    capacityBuilding: [
      {
        area: 'Youth Research Skills',
        participants: ['15 young co-researchers'],
        outcomes: ['Confident in data collection', 'Understanding of research ethics', 'Presentation skills developed']
      },
      {
        area: 'Service Provider Cultural Competency',
        participants: ['25 service staff'],
        outcomes: ['Improved understanding of cultural protocols', 'Better engagement with families', 'Reduced cultural incidents']
      }
    ],
    futureDirections: [
      'Expand youth co-researcher model to other communities',
      'Develop longitudinal tracking of youth outcomes',
      'Create youth-led evaluation processes',
      'Build evidence for sustained funding'
    ]
  },
  middleSpace: middleSpaceData,
  iterationCycle: 1,
  status: 'active',
  nextSteps: [
    'Present findings to community for validation',
    'Co-design implementation plan with youth',
    'Secure funding for recommended actions',
    'Begin second UMEL cycle with expanded scope'
  ]
};