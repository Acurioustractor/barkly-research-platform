import { supabase } from '@/lib/db/supabase';

export interface StorySubmission {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  authorName: string;
  authorRole?: string;
  category: string;
  mediaType: 'text' | 'audio' | 'video' | 'multimedia';
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  themes: string[];
  communityId: string;
  userId?: string;
  
  // Multimedia content
  audioFiles?: File[];
  videoFiles?: File[];
  imageFiles?: File[];
  documentFiles?: File[];
  
  // Metadata
  duration?: number; // for audio/video in seconds
  language?: string;
  dialect?: string;
  location?: string;
  recordedAt?: Date;
  
  // Community priorities and themes
  communityPriorities: string[];
  culturalThemes: string[];
  traditionalKnowledge: boolean;
  requiresElderReview: boolean;
  
  // Accessibility
  hasTranscript?: boolean;
  hasSubtitles?: boolean;
  hasSignLanguage?: boolean;
  accessibilityNotes?: string;
  
  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'needs_review';
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: Date;
  
  // Engagement
  isInspiring: boolean;
  allowComments: boolean;
  allowSharing: boolean;
  
  // Publishing
  published: boolean;
  publishedAt?: Date;
  scheduledFor?: Date;
}

export interface StoryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  communityId: string;
  isActive: boolean;
  sortOrder: number;
  culturalSafety: string;
  requiresApproval: boolean;
}

export interface CommunityTheme {
  id: string;
  name: string;
  description: string;
  color: string;
  communityId: string;
  isActive: boolean;
  isPriority: boolean;
  relatedTopics: string[];
}

export interface StoryModerationQueue {
  id: string;
  storyId: string;
  story: StorySubmission;
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  culturalReviewRequired: boolean;
  elderReviewRequired: boolean;
  technicalReviewRequired: boolean;
  estimatedReviewTime: number; // minutes
}

/**
 * Submit a new story with multimedia support
 */
export async function submitStory(storyData: Partial<StorySubmission>): Promise<string> {
  try {
    // Validate required fields
    if (!storyData.title || !storyData.content || !storyData.communityId) {
      throw new Error('Title, content, and community ID are required');
    }

    // Process multimedia files if present
    const mediaUrls = await processMultimediaFiles(storyData);

    // Determine moderation requirements
    const moderationRequirements = determineModerationRequirements(storyData);

    // Create story record
    const storyRecord = {
      title: storyData.title,
      content: storyData.content,
      excerpt: storyData.excerpt || storyData.content.substring(0, 200) + '...',
      author_name: storyData.authorName || 'Anonymous',
      author_role: storyData.authorRole,
      category: storyData.category || 'general',
      media_type: storyData.mediaType || 'text',
      cultural_safety: storyData.culturalSafety || 'public',
      themes: storyData.themes || [],
      community_id: storyData.communityId,
      user_id: storyData.userId,
      
      // Multimedia
      media_urls: mediaUrls,
      duration: storyData.duration,
      language: storyData.language,
      dialect: storyData.dialect,
      location: storyData.location,
      recorded_at: storyData.recordedAt?.toISOString(),
      
      // Community context
      community_priorities: storyData.communityPriorities || [],
      cultural_themes: storyData.culturalThemes || [],
      traditional_knowledge: storyData.traditionalKnowledge || false,
      requires_elder_review: storyData.requiresElderReview || false,
      
      // Accessibility
      has_transcript: storyData.hasTranscript || false,
      has_subtitles: storyData.hasSubtitles || false,
      has_sign_language: storyData.hasSignLanguage || false,
      accessibility_notes: storyData.accessibilityNotes,
      
      // Moderation
      moderation_status: 'pending',
      requires_cultural_review: moderationRequirements.culturalReview,
      requires_elder_review: moderationRequirements.elderReview,
      requires_technical_review: moderationRequirements.technicalReview,
      
      // Settings
      is_inspiring: storyData.isInspiring || false,
      allow_comments: storyData.allowComments !== false,
      allow_sharing: storyData.allowSharing !== false,
      published: false,
      scheduled_for: storyData.scheduledFor?.toISOString(),
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('enhanced_community_stories')
      .insert([storyRecord])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to submit story: ${error.message}`);
    }

    // Add to moderation queue if needed
    if (moderationRequirements.needsModeration) {
      await addToModerationQueue(data.id, moderationRequirements);
    }

    // Send notifications to relevant moderators
    await notifyModerators(data.id, moderationRequirements);

    return data.id;
  } catch (error) {
    console.error('Error submitting story:', error);
    throw error;
  }
}

/**
 * Process multimedia files and upload to storage
 */
async function processMultimediaFiles(storyData: Partial<StorySubmission>): Promise<any> {
  const mediaUrls: any = {
    audio: [],
    video: [],
    images: [],
    documents: []
  };

  try {
    // Process audio files
    if (storyData.audioFiles && storyData.audioFiles.length > 0) {
      for (const file of storyData.audioFiles) {
        const url = await uploadFile(file, 'audio', storyData.communityId!);
        mediaUrls.audio.push({
          url,
          filename: file.name,
          size: file.size,
          duration: await getAudioDuration(file)
        });
      }
    }

    // Process video files
    if (storyData.videoFiles && storyData.videoFiles.length > 0) {
      for (const file of storyData.videoFiles) {
        const url = await uploadFile(file, 'video', storyData.communityId!);
        mediaUrls.video.push({
          url,
          filename: file.name,
          size: file.size,
          duration: await getVideoDuration(file)
        });
      }
    }

    // Process image files
    if (storyData.imageFiles && storyData.imageFiles.length > 0) {
      for (const file of storyData.imageFiles) {
        const url = await uploadFile(file, 'images', storyData.communityId!);
        mediaUrls.images.push({
          url,
          filename: file.name,
          size: file.size,
          alt: `Image from ${storyData.title}`
        });
      }
    }

    // Process document files
    if (storyData.documentFiles && storyData.documentFiles.length > 0) {
      for (const file of storyData.documentFiles) {
        const url = await uploadFile(file, 'documents', storyData.communityId!);
        mediaUrls.documents.push({
          url,
          filename: file.name,
          size: file.size,
          type: file.type
        });
      }
    }

    return mediaUrls;
  } catch (error) {
    console.error('Error processing multimedia files:', error);
    throw new Error('Failed to process multimedia files');
  }
}

/**
 * Upload file to Supabase storage
 */
async function uploadFile(file: File, type: string, communityId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${communityId}/${type}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('community-stories')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('community-stories')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Get audio duration from file
 */
async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      resolve(0); // Default if can't determine duration
    };
    audio.src = URL.createObjectURL(file);
  });
}

/**
 * Get video duration from file
 */
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.onerror = () => {
      resolve(0); // Default if can't determine duration
    };
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Determine what type of moderation is required
 */
function determineModerationRequirements(storyData: Partial<StorySubmission>): {
  needsModeration: boolean;
  culturalReview: boolean;
  elderReview: boolean;
  technicalReview: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
} {
  let needsModeration = false;
  let culturalReview = false;
  let elderReview = false;
  let technicalReview = false;
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';

  // Cultural safety requirements
  if (storyData.culturalSafety === 'sacred' || storyData.culturalSafety === 'restricted') {
    needsModeration = true;
    culturalReview = true;
    elderReview = true;
    priority = 'high';
  }

  // Traditional knowledge
  if (storyData.traditionalKnowledge || storyData.requiresElderReview) {
    needsModeration = true;
    elderReview = true;
    priority = priority === 'low' ? 'medium' : priority;
  }

  // Multimedia content
  if (storyData.mediaType !== 'text') {
    needsModeration = true;
    technicalReview = true;
    priority = priority === 'low' ? 'medium' : priority;
  }

  // Community themes that require review
  const sensitiveThemes = ['ceremony', 'sacred', 'traditional', 'cultural'];
  if (storyData.culturalThemes?.some(theme => 
    sensitiveThemes.some(sensitive => theme.toLowerCase().includes(sensitive))
  )) {
    needsModeration = true;
    culturalReview = true;
    priority = priority === 'low' ? 'medium' : priority;
  }

  return {
    needsModeration,
    culturalReview,
    elderReview,
    technicalReview,
    priority
  };
}

/**
 * Add story to moderation queue
 */
async function addToModerationQueue(
  storyId: string, 
  requirements: any
): Promise<void> {
  try {
    const queueItem = {
      story_id: storyId,
      priority: requirements.priority,
      cultural_review_required: requirements.culturalReview,
      elder_review_required: requirements.elderReview,
      technical_review_required: requirements.technicalReview,
      estimated_review_time: calculateEstimatedReviewTime(requirements),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('story_moderation_queue')
      .insert([queueItem]);

    if (error) {
      console.error('Failed to add to moderation queue:', error);
    }
  } catch (error) {
    console.error('Error adding to moderation queue:', error);
  }
}

/**
 * Calculate estimated review time based on requirements
 */
function calculateEstimatedReviewTime(requirements: any): number {
  let time = 15; // Base 15 minutes

  if (requirements.culturalReview) time += 30;
  if (requirements.elderReview) time += 45;
  if (requirements.technicalReview) time += 20;

  return time;
}

/**
 * Notify relevant moderators
 */
async function notifyModerators(storyId: string, requirements: any): Promise<void> {
  try {
    const notifications = [];

    if (requirements.culturalReview) {
      notifications.push({
        story_id: storyId,
        moderator_type: 'cultural_authority',
        notification_type: 'cultural_review_required',
        priority: requirements.priority,
        created_at: new Date().toISOString()
      });
    }

    if (requirements.elderReview) {
      notifications.push({
        story_id: storyId,
        moderator_type: 'elder',
        notification_type: 'elder_review_required',
        priority: requirements.priority,
        created_at: new Date().toISOString()
      });
    }

    if (requirements.technicalReview) {
      notifications.push({
        story_id: storyId,
        moderator_type: 'technical_moderator',
        notification_type: 'technical_review_required',
        priority: requirements.priority,
        created_at: new Date().toISOString()
      });
    }

    if (notifications.length > 0) {
      const { error } = await supabase
        .from('moderation_notifications')
        .insert(notifications);

      if (error) {
        console.error('Failed to send moderation notifications:', error);
      }
    }
  } catch (error) {
    console.error('Error notifying moderators:', error);
  }
}

/**
 * Get story categories for a community
 */
export async function getStoryCategories(communityId: string): Promise<StoryCategory[]> {
  try {
    const { data, error } = await supabase
      .from('story_categories')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw new Error(`Failed to fetch story categories: ${error.message}`);
    }

    return data?.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      communityId: category.community_id,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      culturalSafety: category.cultural_safety,
      requiresApproval: category.requires_approval
    })) || [];
  } catch (error) {
    console.error('Error fetching story categories:', error);
    return [];
  }
}

/**
 * Get community themes for story categorization
 */
export async function getCommunityThemes(communityId: string): Promise<CommunityTheme[]> {
  try {
    const { data, error } = await supabase
      .from('community_themes')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('is_priority DESC, name ASC');

    if (error) {
      throw new Error(`Failed to fetch community themes: ${error.message}`);
    }

    return data?.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      color: theme.color,
      communityId: theme.community_id,
      isActive: theme.is_active,
      isPriority: theme.is_priority,
      relatedTopics: theme.related_topics || []
    })) || [];
  } catch (error) {
    console.error('Error fetching community themes:', error);
    return [];
  }
}

/**
 * Get moderation queue for moderators
 */
export async function getModerationQueue(
  moderatorType?: string,
  priority?: string
): Promise<StoryModerationQueue[]> {
  try {
    let query = supabase
      .from('story_moderation_queue')
      .select(`
        *,
        enhanced_community_stories (
          id,
          title,
          author_name,
          category,
          media_type,
          cultural_safety,
          traditional_knowledge,
          created_at
        )
      `)
      .order('priority DESC, created_at ASC');

    if (moderatorType) {
      switch (moderatorType) {
        case 'cultural_authority':
          query = query.eq('cultural_review_required', true);
          break;
        case 'elder':
          query = query.eq('elder_review_required', true);
          break;
        case 'technical_moderator':
          query = query.eq('technical_review_required', true);
          break;
      }
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch moderation queue: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      storyId: item.story_id,
      story: item.enhanced_community_stories,
      submittedAt: new Date(item.created_at),
      priority: item.priority,
      assignedTo: item.assigned_to,
      culturalReviewRequired: item.cultural_review_required,
      elderReviewRequired: item.elder_review_required,
      technicalReviewRequired: item.technical_review_required,
      estimatedReviewTime: item.estimated_review_time
    })) || [];
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return [];
  }
}

/**
 * Approve or reject a story
 */
export async function moderateStory(
  storyId: string,
  decision: 'approved' | 'rejected' | 'needs_revision',
  moderatorId: string,
  notes?: string
): Promise<void> {
  try {
    // Update story moderation status
    const { error: storyError } = await supabase
      .from('enhanced_community_stories')
      .update({
        moderation_status: decision,
        moderation_notes: notes,
        moderated_by: moderatorId,
        moderated_at: new Date().toISOString(),
        published: decision === 'approved',
        published_at: decision === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    if (storyError) {
      throw new Error(`Failed to update story: ${storyError.message}`);
    }

    // Remove from moderation queue
    const { error: queueError } = await supabase
      .from('story_moderation_queue')
      .delete()
      .eq('story_id', storyId);

    if (queueError) {
      console.error('Failed to remove from moderation queue:', queueError);
    }

    // Create moderation log entry
    const { error: logError } = await supabase
      .from('story_moderation_log')
      .insert([{
        story_id: storyId,
        moderator_id: moderatorId,
        decision: decision,
        notes: notes,
        created_at: new Date().toISOString()
      }]);

    if (logError) {
      console.error('Failed to create moderation log:', logError);
    }

    // Notify story author
    await notifyStoryAuthor(storyId, decision, notes);
  } catch (error) {
    console.error('Error moderating story:', error);
    throw error;
  }
}

/**
 * Notify story author of moderation decision
 */
async function notifyStoryAuthor(
  storyId: string,
  decision: string,
  notes?: string
): Promise<void> {
  try {
    // Get story details
    const { data: story, error } = await supabase
      .from('enhanced_community_stories')
      .select('user_id, title, author_name')
      .eq('id', storyId)
      .single();

    if (error || !story) {
      console.error('Failed to fetch story for notification:', error);
      return;
    }

    // Create notification
    const notification = {
      user_id: story.user_id,
      type: 'story_moderation',
      title: `Story "${story.title}" ${decision}`,
      message: decision === 'approved' 
        ? 'Your story has been approved and published!'
        : decision === 'rejected'
        ? 'Your story was not approved for publication.'
        : 'Your story needs some revisions before it can be published.',
      data: {
        storyId,
        decision,
        notes
      },
      created_at: new Date().toISOString()
    };

    const { error: notificationError } = await supabase
      .from('user_notifications')
      .insert([notification]);

    if (notificationError) {
      console.error('Failed to create user notification:', notificationError);
    }
  } catch (error) {
    console.error('Error notifying story author:', error);
  }
}