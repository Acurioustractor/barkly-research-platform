import { CommunityProject, CommunityTheme, Quote, Service, SystemConnection } from '@/data/schemas';

/**
 * Mock data for the Barkly Youth case study
 * This represents structured data that would be extracted from the PDF documents
 */

// Sample quotes from youth participants
const youthQuotes: Quote[] = [
  {
    id: 'quote-1',
    text: "Sometimes I feel like nobody listens to us young people. We have ideas about how to make things better, but we don't get asked.",
    participantPseudonym: 'Jamie',
    context: 'Discussion about youth engagement in community decisions',
    theme: ['youth-voice', 'empowerment', 'community-engagement'],
    culturallySensitive: false,
    permissions: {
      canShare: true,
      canAttribute: true,
    }
  },
  {
    id: 'quote-2',
    text: "I want to learn about my culture from my Elders, but I also need to prepare for jobs that might not exist yet.",
    participantPseudonym: 'Alex',
    context: 'Conversation about balancing traditional knowledge and modern skills',
    theme: ['cultural-identity', 'education', 'future-aspirations'],
    culturallySensitive: false,
    permissions: {
      canShare: true,
      canAttribute: true,
    }
  },
  {
    id: 'quote-3',
    text: "The youth programs are good when they happen, but they keep stopping and starting. We need something that stays.",
    participantPseudonym: 'Sam',
    context: 'Focus group on youth services',
    theme: ['service-continuity', 'youth-programs', 'sustainability'],
    culturallySensitive: false,
    permissions: {
      canShare: true,
      canAttribute: true,
    }
  },
  {
    id: 'quote-4',
    text: "When I'm on country with my family, I feel strong. In town, it's different - there's not many places where we can just be ourselves.",
    participantPseudonym: 'Taylor',
    context: 'Individual interview about identity and belonging',
    theme: ['cultural-identity', 'safe-spaces', 'connection-to-country'],
    culturallySensitive: false,
    permissions: {
      canShare: true,
      canAttribute: true,
    }
  }
];

// Community member quotes
const communityQuotes: Quote[] = [
  {
    id: 'quote-5',
    text: "Our young people are clever, but they need opportunities to show it. The system isn't set up for our way of learning.",
    participantPseudonym: 'Community Elder Mary',
    context: 'Elder consultation session',
    theme: ['education', 'cultural-approaches', 'youth-potential'],
    culturallySensitive: false,
    permissions: {
      canShare: true,
      canAttribute: true,
    }
  },
  {
    id: 'quote-6',
    text: "We see the struggles our youth face. They're caught between two worlds, and we need to help them walk in both.",
    participantPseudonym: 'Uncle Bob',
    context: 'Community meeting about youth support',
    theme: ['cultural-identity', 'intergenerational-support', 'two-ways-learning'],
    culturallySensitive: false,
    permissions: {
      canShare: true,
      canAttribute: true,
    }
  }
];

// Services in the Barkly region
const services: Service[] = [
  {
    id: 'service-1',
    name: 'Barkly Youth Hub',
    type: 'Youth Service',
    provider: 'Regional Youth Services',
    location: 'Tennant Creek',
    culturallyAppropriate: true,
    youthSpecific: true,
    accessibility: {
      physical: true,
      cultural: true,
      linguistic: true,
      financial: true
    }
  },
  {
    id: 'service-2',
    name: 'Desert Edge Education',
    type: 'Education Support',
    provider: 'NT Department of Education',
    location: 'Multiple locations',
    culturallyAppropriate: false,
    youthSpecific: true,
    accessibility: {
      physical: true,
      cultural: false,
      linguistic: false,
      financial: true
    }
  },
  {
    id: 'service-3',
    name: 'Strong Families Program',
    type: 'Family Support',
    provider: 'Aboriginal Health Service',
    location: 'Tennant Creek',
    culturallyAppropriate: true,
    youthSpecific: false,
    accessibility: {
      physical: true,
      cultural: true,
      linguistic: true,
      financial: true
    }
  }
];

// System connections
const systemConnections: SystemConnection[] = [
  {
    id: 'connection-1',
    from: 'Youth Hub',
    to: 'Education Services',
    type: 'supports',
    strength: 'medium',
    description: 'Youth Hub provides after-school support that complements formal education',
    evidence: ['Program attendance data', 'Youth feedback']
  },
  {
    id: 'connection-2',
    from: 'Cultural Programs',
    to: 'Youth Identity',
    type: 'enables',
    strength: 'strong',
    description: 'Cultural programs strengthen youth identity and wellbeing',
    evidence: ['Youth testimonials', 'Elder observations']
  },
  {
    id: 'connection-3',
    from: 'Funding Cycles',
    to: 'Program Continuity',
    type: 'blocks',
    strength: 'strong',
    description: 'Short-term funding cycles disrupt program continuity',
    evidence: ['Service reports', 'Community feedback']
  }
];

// Main themes identified
const themes: CommunityTheme[] = [
  {
    id: 'theme-1',
    title: 'Youth Voice and Agency',
    description: 'Young people want to be heard and involved in decisions that affect their lives',
    youthVoices: [youthQuotes[0]!, youthQuotes[2]!],
    communityVoices: [communityQuotes[0]!],
    serviceData: [],
    supportingServices: [services[0]!],
    systemConnections: [],
    culturalContext: 'In Aboriginal culture, young people traditionally learn through observation and gradual participation. Modern systems often don\'t accommodate this approach.',
    emergentPatterns: [
      'Youth feel excluded from decision-making processes',
      'Desire for meaningful participation',
      'Gap between youth aspirations and available opportunities'
    ]
  },
  {
    id: 'theme-2',
    title: 'Cultural Identity and Modern Life',
    description: 'Navigating between traditional culture and contemporary opportunities',
    youthVoices: [youthQuotes[1]!, youthQuotes[3]!],
    communityVoices: [communityQuotes[1]!],
    serviceData: [],
    supportingServices: [services[0]!, services[2]!],
    systemConnections: [systemConnections[1]!],
    culturalContext: 'The concept of "two-ways learning" - maintaining cultural knowledge while gaining western education - is central to youth development in the region.',
    emergentPatterns: [
      'Strong connection to culture as source of strength',
      'Challenge of balancing cultural and mainstream expectations',
      'Need for culturally safe spaces in town'
    ]
  },
  {
    id: 'theme-3',
    title: 'Service Continuity and Sustainability',
    description: 'The impact of inconsistent service delivery on youth outcomes',
    youthVoices: [youthQuotes[2]!],
    communityVoices: [],
    serviceData: [],
    supportingServices: services,
    systemConnections: [systemConnections[2]!],
    emergentPatterns: [
      'Stop-start nature of programs disrupts trust and engagement',
      'Short-term funding undermines long-term outcomes',
      'Need for sustained, consistent support'
    ]
  }
];

// Complete project data
export const barklyYouthProject: CommunityProject = {
  id: 'barkly-youth-2024',
  name: 'Barkly Regional Deal Youth Case Study',
  region: 'Barkly Region, Northern Territory',
  description: 'A community-led research project exploring the experiences, aspirations, and needs of young people in the Barkly region, using the UMEL framework to generate insights for improved youth services and outcomes.',
  culturalContext: {
    traditionalOwners: ['Warumungu', 'Warlpiri', 'Warlmanpa', 'Mudbura', 'Jingili', 'Wakaya'],
    languages: ['Warumungu', 'Warlpiri', 'English', 'Kriol'],
    culturalProtocols: [
      {
        id: 'protocol-1',
        name: 'Elder Consultation',
        description: 'All research activities must be approved by Elders',
        importance: 'critical',
        guidelines: [
          'Seek permission before engaging with youth',
          'Regular reporting back to Elders',
          'Respect cultural business periods'
        ]
      },
      {
        id: 'protocol-2',
        name: 'Gender Considerations',
        description: 'Some topics may be gender-specific',
        importance: 'high',
        guidelines: [
          'Male and female researchers for gender-specific discussions',
          'Respect sorry business protocols',
          'Consider appropriate meeting spaces'
        ]
      }
    ],
    acknowledgement: 'We acknowledge the Traditional Owners of the Barkly region and pay our respects to Elders past, present and emerging. We recognise their continuing connection to land, waters and community.'
  },
  methodology: {
    type: 'UMEL',
    frameworks: ['UMEL Framework', 'Participatory Action Research', 'Indigenous Research Methodologies'],
    dataSourceTypes: [
      {
        id: 'source-1',
        type: 'interview',
        description: 'One-on-one yarning sessions with young people',
        collectionMethod: 'Semi-structured interviews using yarning methodology',
        ethicalConsiderations: ['Parental consent for under 18s', 'Cultural appropriateness', 'Safe spaces']
      },
      {
        id: 'source-2',
        type: 'workshop',
        description: 'Group workshops with youth',
        collectionMethod: 'Interactive workshops with creative activities',
        ethicalConsiderations: ['Group dynamics', 'Power imbalances', 'Cultural safety']
      }
    ],
    ethicalFramework: 'AIATSIS Ethical Guidelines and NHMRC Indigenous Research Excellence'
  },
  participants: [
    {
      id: 'group-1',
      name: 'Young People (12-17 years)',
      description: 'School-aged youth from across the Barkly region',
      size: 45,
      ageRange: { min: 12, max: 17 },
      culturalBackground: ['Aboriginal', 'Torres Strait Islander'],
      consentProcess: 'Written consent from parents/guardians and verbal assent from youth'
    },
    {
      id: 'group-2',
      name: 'Young Adults (18-25 years)',
      description: 'Young adults transitioning to independence',
      size: 30,
      ageRange: { min: 18, max: 25 },
      culturalBackground: ['Aboriginal', 'Torres Strait Islander', 'Non-Indigenous'],
      consentProcess: 'Written informed consent'
    },
    {
      id: 'group-3',
      name: 'Community Elders and Family',
      description: 'Elders and family members providing context and support',
      size: 20,
      culturalBackground: ['Aboriginal'],
      consentProcess: 'Verbal consent following cultural protocols'
    }
  ],
  themes: themes,
  insights: [
    {
      id: 'insight-1',
      title: 'Youth Agency Gap',
      description: 'Young people have clear ideas about their needs but lack platforms for meaningful participation',
      type: 'finding',
      themes: ['youth-voice', 'empowerment'],
      supportingEvidence: {
        quotes: ['quote-1', 'quote-2'],
        observations: ['Youth workshop participation rates', 'Engagement patterns']
      },
      actionable: true,
      priority: 'high'
    },
    {
      id: 'insight-2',
      title: 'Two-Ways Success Model',
      description: 'Programs that successfully integrate cultural knowledge with contemporary skills show better outcomes',
      type: 'finding',
      themes: ['cultural-identity', 'education'],
      supportingEvidence: {
        quotes: ['quote-2', 'quote-4'],
        data: ['Program retention rates', 'Youth wellbeing indicators']
      },
      actionable: true,
      priority: 'high'
    }
  ],
  outcomes: [
    {
      id: 'outcome-1',
      title: 'Youth Advisory Group Established',
      description: 'Formation of a youth advisory group to input into regional planning',
      type: 'immediate',
      indicators: ['Group formed', 'Terms of reference developed', 'First meeting held'],
      achieved: false,
      timeline: {
        target: new Date('2024-06-30')
      }
    }
  ],
  timeline: [
    {
      id: 'phase-1',
      name: 'Understanding Phase',
      description: 'Initial engagement and relationship building',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'completed',
      activities: ['Elder consultations', 'Youth engagement', 'Service mapping'],
      outcomes: ['Ethics approval', 'Community partnerships', 'Research questions refined']
    },
    {
      id: 'phase-2',
      name: 'Data Collection',
      description: 'Gathering youth voices and experiences',
      startDate: new Date('2024-04-01'),
      status: 'active',
      activities: ['Youth interviews', 'Community workshops', 'Service provider consultations'],
      outcomes: ['Rich qualitative data', 'System maps', 'Emerging themes']
    }
  ],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-29'),
    version: '1.0.0',
    dataGovernance: {
      owner: 'Barkly Regional Deal',
      custodian: 'Community Research Team',
      accessLevel: 'restricted',
      retentionPolicy: 'Data to be reviewed annually with community'
    }
  }
};