import { createClient } from '@supabase/supabase-js';

export default async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  // Initialize test database
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    
    // Delete test data in correct order (respecting foreign key constraints)
    await supabase.from('ai_analysis').delete().like('document_id', 'test-%');
    await supabase.from('cultural_safety_reviews').delete().like('content_id', 'test-%');
    await supabase.from('consent_records').delete().like('user_id', 'test-%');
    await supabase.from('community_health_indicators').delete().like('community_id', 'test-%');
    await supabase.from('success_patterns').delete().like('community_id', 'test-%');
    await supabase.from('documents').delete().like('id', 'test-%');
    await supabase.from('users').delete().like('email', '%test%');
    await supabase.from('communities').delete().like('name', '%Test%');
    
    // Create test communities
    console.log('🏘️ Creating test communities...');
    const testCommunities = [
      {
        id: 'test-community-1',
        name: 'Test Community Alpha',
        description: 'Primary test community for integration tests',
        location: 'Test Location Alpha',
        cultural_protocols: {
          elder_review_required: true,
          traditional_knowledge_protection: true,
          community_consent_required: true
        }
      },
      {
        id: 'test-community-2',
        name: 'Test Community Beta',
        description: 'Secondary test community for comparison tests',
        location: 'Test Location Beta',
        cultural_protocols: {
          elder_review_required: false,
          traditional_knowledge_protection: true,
          community_consent_required: true
        }
      }
    ];
    
    const { error: communitiesError } = await supabase
      .from('communities')
      .insert(testCommunities);
    
    if (communitiesError) {
      console.warn('Warning creating test communities:', communitiesError.message);
    }
    
    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [
      {
        id: 'test-user-community-1',
        email: 'community-member@test.com',
        role: 'community_member',
        community_id: 'test-community-1',
        profile: {
          name: 'Test Community Member',
          cultural_role: 'member'
        }
      },
      {
        id: 'test-user-elder-1',
        email: 'elder@test.com',
        role: 'elder',
        community_id: 'test-community-1',
        profile: {
          name: 'Test Elder',
          cultural_role: 'elder'
        }
      },
      {
        id: 'test-user-government-1',
        email: 'government@test.com',
        role: 'government',
        community_id: null,
        profile: {
          name: 'Test Government Official',
          department: 'Indigenous Affairs'
        }
      },
      {
        id: 'test-user-worker-1',
        email: 'worker@test.com',
        role: 'worker',
        community_id: null,
        profile: {
          name: 'Test NGO Worker',
          organization: 'Test NGO'
        }
      },
      {
        id: 'test-user-moderator-1',
        email: 'moderator@test.com',
        role: 'moderator',
        community_id: 'test-community-1',
        profile: {
          name: 'Test Moderator',
          cultural_role: 'moderator'
        }
      }
    ];
    
    const { error: usersError } = await supabase
      .from('users')
      .insert(testUsers);
    
    if (usersError) {
      console.warn('Warning creating test users:', usersError.message);
    }
    
    // Create sample test stories
    console.log('📖 Creating sample test stories...');
    const testStories = [
      {
        id: 'test-story-1',
        title: 'Healthcare Access Challenge',
        content: 'Our community struggles with healthcare access. The nearest clinic is 2 hours away.',
        type: 'story',
        status: 'approved',
        community_id: 'test-community-1',
        submitted_by: 'test-user-community-1',
        tags: ['healthcare', 'access', 'rural'],
        cultural_sensitivity: 'low',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-story-2',
        title: 'Education Program Success',
        content: 'The new cultural education program has been very successful with high student engagement.',
        type: 'story',
        status: 'approved',
        community_id: 'test-community-1',
        submitted_by: 'test-user-community-1',
        tags: ['education', 'culture', 'success'],
        cultural_sensitivity: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-story-3',
        title: 'Traditional Knowledge Sharing',
        content: 'Elders shared traditional knowledge about medicinal plants with community members.',
        type: 'story',
        status: 'pending_review',
        community_id: 'test-community-1',
        submitted_by: 'test-user-community-1',
        tags: ['traditional_knowledge', 'elders', 'medicine'],
        cultural_sensitivity: 'high',
        created_at: new Date().toISOString()
      }
    ];
    
    const { error: storiesError } = await supabase
      .from('documents')
      .insert(testStories);
    
    if (storiesError) {
      console.warn('Warning creating test stories:', storiesError.message);
    }
    
    // Create sample AI analysis data
    console.log('🤖 Creating sample AI analysis data...');
    const testAnalyses = [
      {
        id: 'test-analysis-1',
        document_id: 'test-story-1',
        analysis_type: 'story_analysis',
        themes: [
          {
            theme: 'Healthcare Access',
            description: 'Community members expressing concerns about healthcare accessibility',
            urgency: 'high',
            confidence: 0.9,
            keywords: ['healthcare', 'clinic', 'access', 'distance']
          }
        ],
        sentiment: 'concerned',
        urgency: 'high',
        actionable_insights: [
          'Consider mobile health services',
          'Explore telemedicine options',
          'Advocate for local clinic establishment'
        ],
        confidence_score: 0.85,
        created_at: new Date().toISOString()
      },
      {
        id: 'test-analysis-2',
        document_id: 'test-story-2',
        analysis_type: 'story_analysis',
        themes: [
          {
            theme: 'Educational Success',
            description: 'Positive outcomes from cultural education initiatives',
            urgency: 'low',
            confidence: 0.95,
            keywords: ['education', 'culture', 'success', 'engagement']
          }
        ],
        sentiment: 'positive',
        urgency: 'low',
        actionable_insights: [
          'Expand successful program model',
          'Document best practices',
          'Share success with other communities'
        ],
        confidence_score: 0.92,
        created_at: new Date().toISOString()
      }
    ];
    
    const { error: analysesError } = await supabase
      .from('ai_analysis')
      .insert(testAnalyses);
    
    if (analysesError) {
      console.warn('Warning creating test analyses:', analysesError.message);
    }
    
    // Create sample community health indicators
    console.log('📊 Creating sample community health indicators...');
    const testHealthIndicators = [
      {
        id: 'test-health-1',
        community_id: 'test-community-1',
        indicator_type: 'healthcare_access',
        value: 65,
        trend: 'declining',
        last_updated: new Date().toISOString(),
        data_sources: ['community_stories', 'surveys'],
        metadata: {
          sample_size: 150,
          confidence_level: 0.85
        }
      },
      {
        id: 'test-health-2',
        community_id: 'test-community-1',
        indicator_type: 'education_quality',
        value: 78,
        trend: 'improving',
        last_updated: new Date().toISOString(),
        data_sources: ['community_stories', 'program_data'],
        metadata: {
          sample_size: 200,
          confidence_level: 0.9
        }
      }
    ];
    
    const { error: healthError } = await supabase
      .from('community_health_indicators')
      .insert(testHealthIndicators);
    
    if (healthError) {
      console.warn('Warning creating test health indicators:', healthError.message);
    }
    
    // Create sample success patterns
    console.log('🌟 Creating sample success patterns...');
    const testSuccessPatterns = [
      {
        id: 'test-pattern-1',
        title: 'Cultural Education Integration Success',
        description: 'Successful integration of traditional knowledge into modern education curriculum',
        category: 'education',
        community_id: 'test-community-1',
        success_metrics: {
          student_engagement: 92,
          cultural_knowledge_retention: 88,
          community_satisfaction: 95
        },
        implementation_factors: [
          'Elder involvement in curriculum design',
          'Community-led teaching approach',
          'Integration with existing education system'
        ],
        replication_potential: 'high',
        communities_implemented: ['test-community-1'],
        success_score: 92,
        created_at: new Date().toISOString()
      }
    ];
    
    const { error: patternsError } = await supabase
      .from('success_patterns')
      .insert(testSuccessPatterns);
    
    if (patternsError) {
      console.warn('Warning creating test success patterns:', patternsError.message);
    }
    
    console.log('✅ Global test setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during global test setup:', error);
    throw error;
  }
};