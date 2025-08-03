import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '../../src/lib/ai-service';
import { culturalSafetyService } from '../../src/lib/cultural-safety-service';
import { enhancedStoryService } from '../../src/lib/enhanced-story-service';

// Test database configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'test-key';
const testSupabase = createClient(supabaseUrl, supabaseKey);

describe('Story Analysis Workflow Integration Tests', () => {
  let testCommunityId: string;
  let testUserId: string;
  let testStoryId: string;

  beforeAll(async () => {
    // Set up test data
    const { data: community } = await testSupabase
      .from('communities')
      .insert({
        name: 'Test Community for Story Analysis',
        description: 'Integration test community',
        location: 'Test Location'
      })
      .select()
      .single();
    
    testCommunityId = community.id;

    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: 'test-story-analysis@example.com',
        role: 'community_member',
        community_id: testCommunityId
      })
      .select()
      .single();
    
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await testSupabase.from('documents').delete().eq('community_id', testCommunityId);
    await testSupabase.from('users').delete().eq('id', testUserId);
    await testSupabase.from('communities').delete().eq('id', testCommunityId);
  });

  beforeEach(async () => {
    // Clean up any existing test stories
    await testSupabase.from('documents').delete().eq('community_id', testCommunityId);
  });

  describe('Complete Story Submission and Analysis Workflow', () => {
    it('should handle complete story submission to analysis pipeline', async () => {
      // Step 1: Submit story
      const storyData = {
        title: 'Community Healthcare Challenge',
        content: 'Our community has been struggling with access to healthcare services. The nearest clinic is 2 hours away and many elders cannot make the journey. We need mobile health services or a local clinic.',
        type: 'story',
        tags: ['healthcare', 'accessibility', 'elders'],
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'medium',
          communityConsent: true
        }
      };

      const submissionResult = await enhancedStoryService.submitStory(storyData);
      expect(submissionResult.success).toBe(true);
      expect(submissionResult.storyId).toBeDefined();
      testStoryId = submissionResult.storyId;

      // Step 2: Verify story is stored
      const { data: storedStory } = await testSupabase
        .from('documents')
        .select('*')
        .eq('id', testStoryId)
        .single();

      expect(storedStory).toBeDefined();
      expect(storedStory.title).toBe(storyData.title);
      expect(storedStory.content).toBe(storyData.content);
      expect(storedStory.status).toBe('pending_review');

      // Step 3: Cultural safety review
      const reviewResult = await culturalSafetyService.submitForReview({
        contentId: testStoryId,
        contentType: 'story',
        content: {
          title: storyData.title,
          text: storyData.content
        },
        submittedBy: testUserId,
        priority: 'medium'
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.reviewId).toBeDefined();

      // Step 4: Approve cultural safety review
      await culturalSafetyService.processReview(
        reviewResult.reviewId,
        testUserId,
        'approved',
        'Content is culturally appropriate for sharing'
      );

      // Step 5: AI Analysis
      const analysisResult = await aiService.analyzeDocument(storyData.content, 'story_analysis');
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.themes).toBeDefined();
      expect(Array.isArray(analysisResult.themes)).toBe(true);
      expect(analysisResult.themes.length).toBeGreaterThan(0);

      // Verify healthcare theme is identified
      const healthcareTheme = analysisResult.themes.find(theme => 
        theme.theme.toLowerCase().includes('healthcare') || 
        theme.keywords.some(keyword => keyword.toLowerCase().includes('health'))
      );
      expect(healthcareTheme).toBeDefined();
      expect(healthcareTheme.urgency).toBe('high');

      // Step 6: Store analysis results
      const { error: analysisError } = await testSupabase
        .from('ai_analysis')
        .insert({
          document_id: testStoryId,
          analysis_type: 'story_analysis',
          themes: analysisResult.themes,
          sentiment: analysisResult.sentiment,
          urgency: analysisResult.urgency,
          actionable_insights: analysisResult.actionable_insights,
          confidence_score: 0.85
        });

      expect(analysisError).toBeNull();

      // Step 7: Update story status
      const { error: updateError } = await testSupabase
        .from('documents')
        .update({ 
          status: 'analyzed',
          analysis_completed_at: new Date().toISOString()
        })
        .eq('id', testStoryId);

      expect(updateError).toBeNull();

      // Step 8: Verify complete workflow
      const { data: finalStory } = await testSupabase
        .from('documents')
        .select(`
          *,
          ai_analysis (*)
        `)
        .eq('id', testStoryId)
        .single();

      expect(finalStory.status).toBe('analyzed');
      expect(finalStory.ai_analysis).toBeDefined();
      expect(finalStory.ai_analysis.length).toBeGreaterThan(0);
      expect(finalStory.analysis_completed_at).toBeDefined();
    });

    it('should handle culturally sensitive content workflow', async () => {
      // Submit culturally sensitive story
      const sensitiveStoryData = {
        title: 'Traditional Healing Ceremony',
        content: 'Our elders performed a traditional healing ceremony for community members. The sacred rituals and traditional medicines helped many people recover from illness.',
        type: 'story',
        tags: ['traditional_healing', 'ceremony', 'elders'],
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: true,
          culturalSensitivity: 'high',
          communityConsent: true,
          elderApprovalRequired: true
        }
      };

      const submissionResult = await enhancedStoryService.submitStory(sensitiveStoryData);
      expect(submissionResult.success).toBe(true);
      testStoryId = submissionResult.storyId;

      // Cultural safety review should detect high sensitivity
      const reviewResult = await culturalSafetyService.submitForReview({
        contentId: testStoryId,
        contentType: 'story',
        content: {
          title: sensitiveStoryData.title,
          text: sensitiveStoryData.content
        },
        submittedBy: testUserId,
        priority: 'high'
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.culturalSensitivity).toBe('high');
      expect(reviewResult.elderReviewRequired).toBe(true);

      // Elder consultation should be initiated
      const elderConsultationResult = await culturalSafetyService.initiateElderConsultation(
        reviewResult.reviewId,
        [testUserId], // Using test user as elder for simplicity
        'Please review traditional healing content for cultural appropriateness'
      );

      expect(elderConsultationResult).toBeDefined();

      // Elder provides guidance
      await culturalSafetyService.recordElderResponse(
        elderConsultationResult.consultationId,
        testUserId,
        {
          approved: true,
          comments: 'Content can be shared but should include acknowledgment of traditional knowledge holders',
          restrictions: ['include_attribution', 'community_context_required'],
          culturalGuidance: 'Add disclaimer about traditional knowledge and respect for elders'
        }
      );

      // Final approval with conditions
      await culturalSafetyService.processReview(
        reviewResult.reviewId,
        testUserId,
        'approved',
        'Approved with elder guidance - include traditional knowledge attribution'
      );

      // Verify story is approved but marked with cultural considerations
      const { data: reviewedStory } = await testSupabase
        .from('documents')
        .select('*')
        .eq('id', testStoryId)
        .single();

      expect(reviewedStory.cultural_sensitivity).toBe('high');
      expect(reviewedStory.status).toBe('approved');
    });

    it('should handle multimedia story analysis', async () => {
      // Submit multimedia story
      const multimediaStoryData = {
        title: 'Community Garden Project Video',
        content: 'Video documentation of our successful community garden project that has provided fresh food for families.',
        type: 'multimedia',
        mediaType: 'video',
        mediaUrl: 'https://example.com/community-garden-video.mp4',
        tags: ['community_garden', 'food_security', 'sustainability'],
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'low',
          communityConsent: true
        }
      };

      const submissionResult = await enhancedStoryService.submitStory(multimediaStoryData);
      expect(submissionResult.success).toBe(true);
      testStoryId = submissionResult.storyId;

      // Multimedia processing should extract text content
      const processedContent = await enhancedStoryService.processMultimedia(testStoryId);
      expect(processedContent).toBeDefined();
      expect(processedContent.transcription).toBeDefined();

      // AI analysis of multimedia content
      const analysisResult = await aiService.analyzeDocument(
        processedContent.transcription || multimediaStoryData.content,
        'multimedia_analysis'
      );

      expect(analysisResult).toBeDefined();
      expect(analysisResult.themes).toBeDefined();

      // Should identify food security and sustainability themes
      const foodSecurityTheme = analysisResult.themes.find(theme =>
        theme.keywords.some(keyword => 
          ['food', 'garden', 'sustainability'].includes(keyword.toLowerCase())
        )
      );
      expect(foodSecurityTheme).toBeDefined();
    });
  });

  describe('Batch Processing Workflow', () => {
    it('should handle multiple story submissions and analysis', async () => {
      const stories = [
        {
          title: 'Education Funding Concerns',
          content: 'Our school needs more funding for educational resources and teacher support.',
          tags: ['education', 'funding']
        },
        {
          title: 'Transportation Issues',
          content: 'Community members struggle with transportation to access services in town.',
          tags: ['transportation', 'accessibility']
        },
        {
          title: 'Youth Program Success',
          content: 'The new youth mentorship program has been very successful in engaging young people.',
          tags: ['youth', 'programs', 'success']
        }
      ];

      const submissionPromises = stories.map(story =>
        enhancedStoryService.submitStory({
          ...story,
          type: 'story',
          communityId: testCommunityId,
          submittedBy: testUserId,
          culturalContext: {
            involvesTraditionKnowledge: false,
            culturalSensitivity: 'low',
            communityConsent: true
          }
        })
      );

      const submissionResults = await Promise.all(submissionPromises);
      
      // All submissions should succeed
      submissionResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.storyId).toBeDefined();
      });

      // Batch cultural safety review
      const reviewPromises = submissionResults.map(result =>
        culturalSafetyService.submitForReview({
          contentId: result.storyId,
          contentType: 'story',
          content: {
            title: stories.find(s => s.title)?.title || 'Test Story',
            text: stories.find(s => s.content)?.content || 'Test content'
          },
          submittedBy: testUserId,
          priority: 'medium'
        })
      );

      const reviewResults = await Promise.all(reviewPromises);
      
      reviewResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Batch approval
      const approvalPromises = reviewResults.map(result =>
        culturalSafetyService.processReview(
          result.reviewId,
          testUserId,
          'approved',
          'Batch approved for testing'
        )
      );

      await Promise.all(approvalPromises);

      // Batch AI analysis
      const analysisPromises = stories.map(story =>
        aiService.analyzeDocument(story.content, 'story_analysis')
      );

      const analysisResults = await Promise.all(analysisPromises);
      
      analysisResults.forEach(result => {
        expect(result).toBeDefined();
        expect(result.themes).toBeDefined();
        expect(Array.isArray(result.themes)).toBe(true);
      });

      // Verify all stories are processed
      const { data: processedStories } = await testSupabase
        .from('documents')
        .select('*')
        .eq('community_id', testCommunityId);

      expect(processedStories.length).toBe(stories.length);
      processedStories.forEach(story => {
        expect(['approved', 'analyzed']).toContain(story.status);
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service failures gracefully', async () => {
      // Submit story
      const storyData = {
        title: 'Test Story for AI Failure',
        content: 'This story will test AI service failure handling.',
        type: 'story',
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'low',
          communityConsent: true
        }
      };

      const submissionResult = await enhancedStoryService.submitStory(storyData);
      testStoryId = submissionResult.storyId;

      // Mock AI service failure
      const originalAnalyze = aiService.analyzeDocument;
      aiService.analyzeDocument = jest.fn().mockRejectedValue(new Error('AI service unavailable'));

      // Attempt analysis - should handle failure gracefully
      try {
        await aiService.analyzeDocument(storyData.content, 'story_analysis');
      } catch (error) {
        expect(error.message).toBe('AI service unavailable');
      }

      // Story should remain in pending state for retry
      const { data: storyStatus } = await testSupabase
        .from('documents')
        .select('status')
        .eq('id', testStoryId)
        .single();

      expect(['pending_review', 'pending_analysis']).toContain(storyStatus.status);

      // Restore original function
      aiService.analyzeDocument = originalAnalyze;
    });

    it('should handle cultural review rejection workflow', async () => {
      // Submit potentially inappropriate story
      const inappropriateStoryData = {
        title: 'Inappropriate Content Test',
        content: 'This content contains information that should not be shared publicly due to cultural sensitivity.',
        type: 'story',
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: true,
          culturalSensitivity: 'high',
          communityConsent: false
        }
      };

      const submissionResult = await enhancedStoryService.submitStory(inappropriateStoryData);
      testStoryId = submissionResult.storyId;

      // Cultural safety review
      const reviewResult = await culturalSafetyService.submitForReview({
        contentId: testStoryId,
        contentType: 'story',
        content: {
          title: inappropriateStoryData.title,
          text: inappropriateStoryData.content
        },
        submittedBy: testUserId,
        priority: 'high'
      });

      // Reject the content
      await culturalSafetyService.processReview(
        reviewResult.reviewId,
        testUserId,
        'rejected',
        'Content contains sensitive information that should not be shared publicly'
      );

      // Verify story is marked as rejected
      const { data: rejectedStory } = await testSupabase
        .from('documents')
        .select('status')
        .eq('id', testStoryId)
        .single();

      expect(rejectedStory.status).toBe('rejected');

      // AI analysis should not proceed for rejected content
      const analysisAttempt = await aiService.analyzeDocument(
        inappropriateStoryData.content,
        'story_analysis'
      );

      // Analysis may complete but should not be stored for rejected content
      expect(analysisAttempt).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume story processing', async () => {
      const storyCount = 50;
      const stories = Array.from({ length: storyCount }, (_, i) => ({
        title: `Performance Test Story ${i + 1}`,
        content: `This is performance test story number ${i + 1} for testing system scalability.`,
        type: 'story',
        tags: ['performance_test'],
        communityId: testCommunityId,
        submittedBy: testUserId,
        culturalContext: {
          involvesTraditionKnowledge: false,
          culturalSensitivity: 'low',
          communityConsent: true
        }
      }));

      const startTime = Date.now();

      // Submit all stories
      const submissionPromises = stories.map(story =>
        enhancedStoryService.submitStory(story)
      );

      const submissionResults = await Promise.all(submissionPromises);
      const submissionTime = Date.now() - startTime;

      // All submissions should succeed
      submissionResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (10 seconds for 50 stories)
      expect(submissionTime).toBeLessThan(10000);

      // Verify all stories are stored
      const { data: storedStories } = await testSupabase
        .from('documents')
        .select('id')
        .eq('community_id', testCommunityId);

      expect(storedStories.length).toBe(storyCount);

      console.log(`Performance test: ${storyCount} stories processed in ${submissionTime}ms`);
    });
  });
});