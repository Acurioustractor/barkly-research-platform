import { StoryArc, StoryChapter, AdventurePath, NarrativeExperience } from '@/data/schemas';

/**
 * Storytelling data for the Barkly Youth project
 * Interactive narratives that bring the research to life
 */

// Story chapters for the main narrative
const chapters: StoryChapter[] = [
  {
    id: 'chapter-1',
    title: 'Dawn in the Barkly',
    narrative: `The sun rises over the red earth of the Barkly, painting the sky in shades of pink and gold. In Tennant Creek, young people are already stirring - some heading to school, others to the youth center, many just finding their own spaces to be.

This is their story. A story of strength, challenge, and possibility. A story that needs to be heard.`,
    culturalContext: 'The Barkly region has been home to Aboriginal peoples for over 40,000 years. Today\'s youth carry this legacy while navigating modern challenges.',
    dataPoints: [
      {
        id: 'dp-1',
        type: 'statistic',
        value: '65%',
        label: 'of Barkly youth are Aboriginal or Torres Strait Islander',
        visualizationType: 'number'
      },
      {
        id: 'dp-2',
        type: 'statistic',
        value: '6',
        label: 'major language groups in the region',
        visualizationType: 'number'
      }
    ],
    visualMetaphor: {
      type: 'sunrise',
      description: 'A new day brings new possibilities',
      culturalSignificance: 'Dawn ceremonies mark important transitions'
    },
    themes: ['identity', 'place', 'belonging'],
    nextChoices: [
      {
        id: 'choice-1a',
        text: 'Follow Maya to school',
        consequence: 'Learn about education experiences',
        nextChapterId: 'chapter-2a',
        impact: {
          type: 'neutral',
          description: 'Explore the education journey'
        }
      },
      {
        id: 'choice-1b',
        text: 'Join Jake at the youth center',
        consequence: 'Discover youth programs and services',
        nextChapterId: 'chapter-2b',
        impact: {
          type: 'neutral',
          description: 'See youth services in action'
        }
      },
      {
        id: 'choice-1c',
        text: 'Walk with Sarah to the river',
        consequence: 'Understand connection to country',
        nextChapterId: 'chapter-2c',
        impact: {
          type: 'neutral',
          description: 'Explore cultural connections'
        }
      }
    ]
  },
  {
    id: 'chapter-2a',
    title: 'Maya\'s Classroom',
    narrative: `Maya enters the classroom, switching between Warumungu with her friends and English with her teacher. She's clever - everyone says so - but sometimes the way they teach here doesn't match the way she learns best.

"When my nana teaches me," she says quietly, "she shows me, then we do it together. Here they just talk and expect us to know."`,
    culturalContext: 'Traditional Aboriginal education is based on observation, practice, and gradual mastery - different from western classroom approaches.',
    dataPoints: [
      {
        id: 'dp-3',
        type: 'quote',
        value: 'Our young people are clever, but they need opportunities to show it.',
        label: 'Elder Mary'
      },
      {
        id: 'dp-4',
        type: 'statistic',
        value: '45%',
        label: 'school attendance rate',
        context: 'Compared to 90% nationally',
        visualizationType: 'comparison'
      }
    ],
    themes: ['education', 'cultural-learning', 'potential'],
    previousChapterId: 'chapter-1',
    nextChoices: [
      {
        id: 'choice-2a',
        text: 'Talk with Maya\'s teacher',
        consequence: 'Understand educator perspectives',
        nextChapterId: 'chapter-3a',
        impact: {
          type: 'positive',
          description: 'Bridge understanding between cultures'
        }
      },
      {
        id: 'choice-2b',
        text: 'Visit Maya\'s nana',
        consequence: 'Learn about traditional education',
        nextChapterId: 'chapter-3b',
        impact: {
          type: 'positive',
          description: 'Deepen cultural knowledge'
        }
      }
    ]
  },
  {
    id: 'chapter-2b',
    title: 'Jake at the Youth Hub',
    narrative: `The youth center is buzzing with energy. Jake's working on beats in the music room, laying down tracks that blend traditional rhythms with modern hip-hop. 

"This place gets us," he explains, adjusting his headphones. "But it almost closed down three times last year. Every time funding runs out, we hold our breath."`,
    dataPoints: [
      {
        id: 'dp-5',
        type: 'quote',
        value: 'The youth programs are good when they happen, but they keep stopping and starting.',
        label: 'Sam, age 16'
      },
      {
        id: 'dp-6',
        type: 'milestone',
        value: '3',
        label: 'times the center nearly closed in 12 months',
        visualizationType: 'timeline'
      }
    ],
    themes: ['youth-services', 'sustainability', 'belonging'],
    previousChapterId: 'chapter-1',
    nextChoices: [
      {
        id: 'choice-2c',
        text: 'Learn about the funding challenges',
        consequence: 'Understand systemic barriers',
        nextChapterId: 'chapter-3c',
        impact: {
          type: 'negative',
          description: 'Confront difficult realities'
        }
      },
      {
        id: 'choice-2d',
        text: 'Explore youth-led solutions',
        consequence: 'Discover youth innovation',
        nextChapterId: 'chapter-3d',
        impact: {
          type: 'positive',
          description: 'See youth agency in action'
        }
      }
    ]
  },
  {
    id: 'chapter-2c',
    title: 'Sarah\'s Sacred Space',
    narrative: `Down by the river, away from town, Sarah feels the tension leave her shoulders. Her aunty is teaching her about the plants here, the stories in the land, the responsibilities she carries.

"When I'm here, I'm strong," Sarah says, her feet in the cool water. "In town, it's different. There's not many places where we can just be ourselves."`,
    culturalWarning: {
      present: true,
      message: 'This chapter contains references to sacred knowledge. Some content has been generalized to respect cultural protocols.',
      type: 'sacred-knowledge'
    },
    dataPoints: [
      {
        id: 'dp-7',
        type: 'observation',
        value: 'Cultural connection correlates with wellbeing',
        label: 'Research finding',
        visualizationType: 'icon'
      }
    ],
    themes: ['identity', 'connection-to-country', 'safe-spaces'],
    previousChapterId: 'chapter-1',
    nextChoices: [
      {
        id: 'choice-2e',
        text: 'Learn about creating cultural spaces in town',
        consequence: 'Explore practical solutions',
        nextChapterId: 'chapter-3e',
        impact: {
          type: 'positive',
          description: 'Build cultural safety'
        }
      }
    ]
  }
];

// Adventure paths for interactive scenarios
const adventurePath: AdventurePath = {
  id: 'path-1',
  scenario: 'You are a youth worker starting at a new service in the Barkly. How will you build trust and create meaningful programs?',
  startingChapterId: 'chapter-1',
  possibleEndings: [
    {
      id: 'ending-1',
      type: 'positive',
      description: 'You\'ve co-created a thriving youth program with strong community ownership',
      achievementCriteria: ['Built relationships with Elders', 'Involved youth in design', 'Secured sustainable funding']
    },
    {
      id: 'ending-2',
      type: 'realistic',
      description: 'You\'ve made progress but face ongoing challenges',
      achievementCriteria: ['Some youth engaged', 'Learning from mistakes', 'Building slowly']
    },
    {
      id: 'ending-3',
      type: 'challenging',
      description: 'Despite good intentions, the program struggles',
      achievementCriteria: ['Limited community trust', 'Funding difficulties', 'High staff turnover']
    }
  ],
  choices: [],
  consequences: [],
  learningOutcomes: [
    'Relationship building takes time and consistency',
    'Youth voice must be central from the start',
    'Cultural protocols are not optional extras',
    'Flexibility is more important than perfect plans'
  ],
  targetAudience: ['Service providers', 'Policy makers', 'Community workers'],
  estimatedDuration: 20
};

// Main story arc
const mainStoryArc: StoryArc = {
  id: 'arc-1',
  title: 'Voices of the Barkly',
  description: 'Follow the journeys of young people navigating life in the Barkly region',
  themes: ['identity', 'belonging', 'agency', 'culture', 'future'],
  chapters: chapters,
  adventurePaths: [adventurePath],
  culturalProtocols: [
    'Some stories have been adapted to respect cultural sensitivities',
    'Gender-specific content is marked appropriately',
    'Sacred knowledge is not shared without permission'
  ],
  metadata: {
    author: 'Barkly Youth Research Team',
    culturalReviewers: ['Elder Mary', 'Uncle Bob', 'Aunty June'],
    lastReviewed: new Date('2024-06-15'),
    approvalStatus: 'approved'
  }
};

// Complete narrative experience
export const barklyYouthNarrative: NarrativeExperience = {
  id: 'narrative-1',
  projectId: 'barkly-youth-2024',
  title: 'Walking in Both Worlds: Barkly Youth Stories',
  tagline: 'Experience the journeys of young people navigating culture, identity, and opportunity in the Barkly region',
  introduction: `This interactive narrative brings to life the experiences of young people in the Barkly region. Based on extensive community research, these stories honor youth voices while respecting cultural protocols.

Choose your path through the stories. Listen deeply. Learn what it means to walk in both worlds.`,
  storyArcs: [mainStoryArc],
  interactiveScenarios: [
    {
      id: 'scenario-1',
      title: 'Building Trust',
      context: 'You\'re meeting with a group of young people for the first time. They seem disengaged and skeptical.',
      rolePlay: {
        availableRoles: [
          {
            id: 'role-1',
            name: 'Youth Worker',
            description: 'New to the community, eager to help',
            perspective: 'You want to make a difference but don\'t know the local context',
            constraints: ['Limited cultural knowledge', 'Pressure to show quick results']
          },
          {
            id: 'role-2',
            name: 'Young Person',
            description: 'Has seen many programs come and go',
            perspective: 'Skeptical but hopeful things might be different this time',
            constraints: ['Past disappointments', 'Peer pressure', 'Family obligations']
          }
        ],
        objectives: ['Build genuine connection', 'Understand needs and aspirations', 'Co-create next steps']
      },
      decisionPoints: [
        {
          id: 'decision-1',
          situation: 'The young people are sitting quietly, not engaging with your planned icebreaker activity.',
          options: [
            {
              id: 'option-1a',
              action: 'Push ahead with the activity',
              reasoning: 'Structure might help them engage',
              culturalImplications: 'May be seen as not reading the room or respecting their choice'
            },
            {
              id: 'option-1b',
              action: 'Ask them what they\'d prefer to do',
              reasoning: 'Give them control and choice',
              culturalImplications: 'Shows respect for their agency'
            },
            {
              id: 'option-1c',
              action: 'Share your own story first',
              reasoning: 'Vulnerability might build trust',
              culturalImplications: 'Personal sharing can build reciprocity'
            }
          ],
          feedback: {
            immediate: 'Notice how the group responds to your choice',
            reflection: 'Consider how power dynamics and cultural norms influence engagement'
          }
        }
      ],
      debrief: {
        keyTakeaways: [
          'Trust is earned through consistency and respect',
          'Youth agency must be real, not tokenistic',
          'Cultural humility is essential'
        ],
        realWorldApplication: [
          'Always start with relationship building',
          'Be prepared to throw out your plan',
          'Listen more than you speak'
        ],
        furtherResources: [
          'Two-Ways Youth Engagement Guide',
          'Cultural protocols training',
          'Youth voice resources'
        ]
      }
    }
  ],
  accessibility: {
    languages: ['English', 'Plain English', 'Warumungu translations available'],
    readingLevel: 'intermediate',
    visualDescriptions: true,
    audioNarration: true,
    signLanguage: false
  },
  culturalGuidance: {
    appropriateAudience: ['Youth workers', 'Educators', 'Policy makers', 'Community members', 'Researchers'],
    restrictions: ['Some content not suitable for children under 12'],
    consultationProcess: 'All content reviewed and approved by cultural advisors and youth representatives'
  }
};