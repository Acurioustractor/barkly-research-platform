import { supabase } from './supabase';

export interface MediaProcessingJob {
  id: string;
  storyId: string;
  mediaType: 'audio' | 'video' | 'image';
  originalUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingSteps: ProcessingStep[];
  outputs: MediaOutput[];
  metadata: MediaMetadata;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  output?: any;
  error?: string;
}

export interface MediaOutput {
  type: 'transcript' | 'summary' | 'thumbnail' | 'compressed' | 'captions' | 'analysis';
  url?: string;
  content?: string;
  metadata?: any;
  confidence?: number;
}

export interface MediaMetadata {
  duration?: number;
  fileSize: number;
  format: string;
  resolution?: { width: number; height: number };
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  language?: string;
  extractedText?: string;
  keyframes?: number[];
  audioFeatures?: AudioFeatures;
}

export interface AudioFeatures {
  tempo?: number;
  pitch?: number;
  volume?: number;
  silenceSegments?: { start: number; end: number }[];
  speechSegments?: { start: number; end: number; confidence: number }[];
  emotions?: { emotion: string; confidence: number; timestamp: number }[];
}

export interface StoryAnalysis {
  id: string;
  storyId: string;
  analysisType: 'content' | 'sentiment' | 'themes' | 'cultural' | 'accessibility';
  results: any;
  confidence: number;
  createdAt: Date;
  version: string;
}

/**
 * Process multimedia content for a story
 */
export async function processStoryMedia(
  storyId: string,
  mediaFiles: { type: 'audio' | 'video' | 'image'; url: string; metadata: any }[]
): Promise<string[]> {
  try {
    const jobIds: string[] = [];

    for (const media of mediaFiles) {
      const jobId = await createProcessingJob(storyId, media);
      jobIds.push(jobId);
      
      // Start processing asynchronously
      processMediaAsync(jobId);
    }

    return jobIds;
  } catch (error) {
    console.error('Error processing story media:', error);
    throw error;
  }
}

/**
 * Create a media processing job
 */
async function createProcessingJob(
  storyId: string,
  media: { type: 'audio' | 'video' | 'image'; url: string; metadata: any }
): Promise<string> {
  try {
    const processingSteps = getProcessingSteps(media.type);
    
    const job = {
      story_id: storyId,
      media_type: media.type,
      original_url: media.url,
      status: 'pending',
      processing_steps: processingSteps,
      outputs: [],
      metadata: media.metadata,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('media_processing_jobs')
      .insert([job])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create processing job: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error creating processing job:', error);
    throw error;
  }
}

/**
 * Get processing steps for media type
 */
function getProcessingSteps(mediaType: 'audio' | 'video' | 'image'): ProcessingStep[] {
  const baseSteps = [
    { name: 'metadata_extraction', status: 'pending' as const, progress: 0 },
    { name: 'content_analysis', status: 'pending' as const, progress: 0 }
  ];

  switch (mediaType) {
    case 'audio':
      return [
        ...baseSteps,
        { name: 'transcription', status: 'pending' as const, progress: 0 },
        { name: 'speaker_detection', status: 'pending' as const, progress: 0 },
        { name: 'sentiment_analysis', status: 'pending' as const, progress: 0 },
        { name: 'cultural_analysis', status: 'pending' as const, progress: 0 }
      ];
    
    case 'video':
      return [
        ...baseSteps,
        { name: 'thumbnail_generation', status: 'pending' as const, progress: 0 },
        { name: 'transcription', status: 'pending' as const, progress: 0 },
        { name: 'scene_detection', status: 'pending' as const, progress: 0 },
        { name: 'caption_generation', status: 'pending' as const, progress: 0 },
        { name: 'cultural_analysis', status: 'pending' as const, progress: 0 }
      ];
    
    case 'image':
      return [
        ...baseSteps,
        { name: 'object_detection', status: 'pending' as const, progress: 0 },
        { name: 'text_extraction', status: 'pending' as const, progress: 0 },
        { name: 'cultural_sensitivity_check', status: 'pending' as const, progress: 0 }
      ];
    
    default:
      return baseSteps;
  }
}

/**
 * Process media asynchronously
 */
async function processMediaAsync(jobId: string): Promise<void> {
  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing');

    // Get job details
    const job = await getProcessingJob(jobId);
    if (!job) {
      throw new Error('Processing job not found');
    }

    // Process each step
    for (let i = 0; i < job.processingSteps.length; i++) {
      const step = job.processingSteps[i];
      
      try {
        await updateStepStatus(jobId, i, 'processing');
        
        const result = await executeProcessingStep(job, step);
        
        await updateStepStatus(jobId, i, 'completed', result);
        await updateStepProgress(jobId, i, 100);
        
        // Add output if generated
        if (result) {
          await addJobOutput(jobId, result);
        }
        
      } catch (stepError) {
        console.error(`Error in processing step ${step.name}:`, stepError);
        await updateStepStatus(jobId, i, 'failed', undefined, stepError.toString());
      }
    }

    // Mark job as completed
    await updateJobStatus(jobId, 'completed');
    
    // Trigger story analysis update
    await updateStoryAnalysis(job.storyId);
    
  } catch (error) {
    console.error('Error in media processing:', error);
    await updateJobStatus(jobId, 'failed', error.toString());
  }
}

/**
 * Execute a processing step
 */
async function executeProcessingStep(
  job: MediaProcessingJob,
  step: ProcessingStep
): Promise<MediaOutput | null> {
  switch (step.name) {
    case 'metadata_extraction':
      return await extractMetadata(job);
    
    case 'transcription':
      return await transcribeAudio(job);
    
    case 'thumbnail_generation':
      return await generateThumbnail(job);
    
    case 'content_analysis':
      return await analyzeContent(job);
    
    case 'cultural_analysis':
      return await analyzeCulturalContent(job);
    
    case 'sentiment_analysis':
      return await analyzeSentiment(job);
    
    case 'speaker_detection':
      return await detectSpeakers(job);
    
    case 'scene_detection':
      return await detectScenes(job);
    
    case 'caption_generation':
      return await generateCaptions(job);
    
    case 'object_detection':
      return await detectObjects(job);
    
    case 'text_extraction':
      return await extractTextFromImage(job);
    
    case 'cultural_sensitivity_check':
      return await checkCulturalSensitivity(job);
    
    default:
      console.warn(`Unknown processing step: ${step.name}`);
      return null;
  }
}

/**
 * Extract metadata from media file
 */
async function extractMetadata(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would integrate with actual media processing library
  const metadata = {
    duration: job.mediaType === 'image' ? undefined : Math.floor(Math.random() * 300) + 30,
    fileSize: job.metadata.fileSize || 1024000,
    format: job.metadata.format || 'unknown',
    resolution: job.mediaType !== 'audio' ? { width: 1920, height: 1080 } : undefined,
    bitrate: 128000,
    sampleRate: job.mediaType !== 'image' ? 44100 : undefined,
    channels: job.mediaType === 'audio' ? 2 : undefined
  };

  return {
    type: 'analysis',
    content: JSON.stringify(metadata),
    metadata: metadata,
    confidence: 1.0
  };
}

/**
 * Transcribe audio content
 */
async function transcribeAudio(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would integrate with speech-to-text service
  const mockTranscript = `This is a mock transcript for ${job.mediaType} content. 
    In a real implementation, this would use services like OpenAI Whisper, 
    Google Speech-to-Text, or Azure Speech Services to transcribe the audio content.
    The transcript would include timestamps and speaker identification.`;

  return {
    type: 'transcript',
    content: mockTranscript,
    metadata: {
      language: 'en',
      confidence: 0.95,
      wordCount: mockTranscript.split(' ').length,
      timestamps: [
        { word: 'This', start: 0.0, end: 0.5 },
        { word: 'is', start: 0.5, end: 0.7 }
        // ... more timestamps
      ]
    },
    confidence: 0.95
  };
}

/**
 * Generate thumbnail for video
 */
async function generateThumbnail(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would generate actual thumbnail
  const thumbnailUrl = `${job.originalUrl.replace(/\.[^/.]+$/, '')}_thumbnail.jpg`;
  
  return {
    type: 'thumbnail',
    url: thumbnailUrl,
    metadata: {
      width: 320,
      height: 240,
      timestamp: 5.0 // 5 seconds into video
    },
    confidence: 1.0
  };
}

/**
 * Analyze content for themes and topics
 */
async function analyzeContent(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would use AI for content analysis
  const analysis = {
    themes: ['community', 'health', 'education', 'culture'],
    topics: ['community wellbeing', 'traditional knowledge', 'youth development'],
    keyPhrases: ['community gathering', 'traditional practices', 'cultural preservation'],
    sentiment: 'positive',
    emotionalTone: ['hopeful', 'proud', 'connected'],
    culturalElements: ['traditional language', 'ceremony references', 'land connection']
  };

  return {
    type: 'analysis',
    content: JSON.stringify(analysis),
    metadata: analysis,
    confidence: 0.85
  };
}

/**
 * Analyze cultural content and sensitivity
 */
async function analyzeCulturalContent(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would check for cultural sensitivity
  const culturalAnalysis = {
    culturalSafetyLevel: 'community',
    traditionalKnowledgeDetected: false,
    sacredContentWarnings: [],
    culturalProtocols: ['respect for elders', 'community sharing'],
    recommendedRestrictions: [],
    requiresElderReview: false,
    culturalThemes: ['community connection', 'cultural pride']
  };

  return {
    type: 'analysis',
    content: JSON.stringify(culturalAnalysis),
    metadata: culturalAnalysis,
    confidence: 0.80
  };
}

/**
 * Analyze sentiment and emotional content
 */
async function analyzeSentiment(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would use sentiment analysis
  const sentimentAnalysis = {
    overallSentiment: 'positive',
    sentimentScore: 0.75,
    emotions: [
      { emotion: 'joy', confidence: 0.8, segments: [{ start: 0, end: 30 }] },
      { emotion: 'pride', confidence: 0.7, segments: [{ start: 45, end: 90 }] }
    ],
    emotionalJourney: [
      { timestamp: 0, sentiment: 'neutral' },
      { timestamp: 30, sentiment: 'positive' },
      { timestamp: 60, sentiment: 'very_positive' }
    ]
  };

  return {
    type: 'analysis',
    content: JSON.stringify(sentimentAnalysis),
    metadata: sentimentAnalysis,
    confidence: 0.82
  };
}

/**
 * Detect speakers in audio
 */
async function detectSpeakers(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would use speaker diarization
  const speakerAnalysis = {
    speakerCount: 2,
    speakers: [
      {
        id: 'speaker_1',
        segments: [{ start: 0, end: 45 }, { start: 90, end: 120 }],
        characteristics: { gender: 'female', ageGroup: 'adult' }
      },
      {
        id: 'speaker_2',
        segments: [{ start: 45, end: 90 }],
        characteristics: { gender: 'male', ageGroup: 'elder' }
      }
    ]
  };

  return {
    type: 'analysis',
    content: JSON.stringify(speakerAnalysis),
    metadata: speakerAnalysis,
    confidence: 0.88
  };
}

/**
 * Detect scenes in video
 */
async function detectScenes(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would detect scene changes
  const sceneAnalysis = {
    sceneCount: 3,
    scenes: [
      { start: 0, end: 30, description: 'Indoor conversation', confidence: 0.9 },
      { start: 30, end: 90, description: 'Outdoor community gathering', confidence: 0.85 },
      { start: 90, end: 120, description: 'Traditional ceremony', confidence: 0.92 }
    ]
  };

  return {
    type: 'analysis',
    content: JSON.stringify(sceneAnalysis),
    metadata: sceneAnalysis,
    confidence: 0.89
  };
}

/**
 * Generate captions for video
 */
async function generateCaptions(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would generate SRT/VTT captions
  const captions = `1
00:00:00,000 --> 00:00:05,000
Welcome to our community story sharing session.

2
00:00:05,000 --> 00:00:10,000
Today we're talking about our cultural traditions.

3
00:00:10,000 --> 00:00:15,000
These stories connect us to our ancestors and land.`;

  return {
    type: 'captions',
    content: captions,
    metadata: {
      format: 'srt',
      language: 'en',
      segmentCount: 3
    },
    confidence: 0.90
  };
}

/**
 * Detect objects in images
 */
async function detectObjects(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would use computer vision
  const objectDetection = {
    objects: [
      { name: 'person', confidence: 0.95, bbox: [100, 100, 200, 300] },
      { name: 'traditional_artifact', confidence: 0.80, bbox: [300, 150, 400, 250] },
      { name: 'landscape', confidence: 0.88, bbox: [0, 0, 800, 200] }
    ],
    sceneType: 'cultural_gathering',
    culturalElements: ['traditional_clothing', 'ceremonial_items']
  };

  return {
    type: 'analysis',
    content: JSON.stringify(objectDetection),
    metadata: objectDetection,
    confidence: 0.87
  };
}

/**
 * Extract text from images
 */
async function extractTextFromImage(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would use OCR
  const textExtraction = {
    extractedText: 'Community Gathering 2024\nTraditional Knowledge Sharing\nRespect • Culture • Connection',
    textRegions: [
      { text: 'Community Gathering 2024', bbox: [100, 50, 400, 80], confidence: 0.95 },
      { text: 'Traditional Knowledge Sharing', bbox: [80, 100, 420, 130], confidence: 0.90 }
    ],
    language: 'en'
  };

  return {
    type: 'analysis',
    content: textExtraction.extractedText,
    metadata: textExtraction,
    confidence: 0.92
  };
}

/**
 * Check cultural sensitivity of images
 */
async function checkCulturalSensitivity(job: MediaProcessingJob): Promise<MediaOutput> {
  // Mock implementation - would check for culturally sensitive content
  const sensitivityCheck = {
    sensitivityLevel: 'community',
    warnings: [],
    culturalElements: ['traditional_gathering', 'community_members'],
    recommendedHandling: 'community_approval',
    accessRestrictions: []
  };

  return {
    type: 'analysis',
    content: JSON.stringify(sensitivityCheck),
    metadata: sensitivityCheck,
    confidence: 0.85
  };
}

/**
 * Update job status
 */
async function updateJobStatus(
  jobId: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (error) {
      updateData.error = error;
    }

    const { error: updateError } = await supabase
      .from('media_processing_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to update job status:', updateError);
    }
  } catch (error) {
    console.error('Error updating job status:', error);
  }
}

/**
 * Update processing step status
 */
async function updateStepStatus(
  jobId: string,
  stepIndex: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  output?: any,
  error?: string
): Promise<void> {
  try {
    // Get current job
    const { data: job, error: fetchError } = await supabase
      .from('media_processing_jobs')
      .select('processing_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error('Failed to fetch job for step update:', fetchError);
      return;
    }

    // Update step
    const steps = [...job.processing_steps];
    steps[stepIndex] = {
      ...steps[stepIndex],
      status,
      ...(status === 'processing' && { startedAt: new Date().toISOString() }),
      ...(status === 'completed' && { completedAt: new Date().toISOString() }),
      ...(output && { output }),
      ...(error && { error })
    };

    // Update job
    const { error: updateError } = await supabase
      .from('media_processing_jobs')
      .update({
        processing_steps: steps,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to update step status:', updateError);
    }
  } catch (error) {
    console.error('Error updating step status:', error);
  }
}

/**
 * Update step progress
 */
async function updateStepProgress(
  jobId: string,
  stepIndex: number,
  progress: number
): Promise<void> {
  try {
    // Get current job
    const { data: job, error: fetchError } = await supabase
      .from('media_processing_jobs')
      .select('processing_steps')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return;
    }

    // Update step progress
    const steps = [...job.processing_steps];
    steps[stepIndex] = {
      ...steps[stepIndex],
      progress
    };

    // Update job
    const { error: updateError } = await supabase
      .from('media_processing_jobs')
      .update({
        processing_steps: steps,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to update step progress:', updateError);
    }
  } catch (error) {
    console.error('Error updating step progress:', error);
  }
}

/**
 * Add output to job
 */
async function addJobOutput(jobId: string, output: MediaOutput): Promise<void> {
  try {
    // Get current job
    const { data: job, error: fetchError } = await supabase
      .from('media_processing_jobs')
      .select('outputs')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return;
    }

    // Add output
    const outputs = [...(job.outputs || []), output];

    // Update job
    const { error: updateError } = await supabase
      .from('media_processing_jobs')
      .update({
        outputs,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to add job output:', updateError);
    }
  } catch (error) {
    console.error('Error adding job output:', error);
  }
}

/**
 * Get processing job
 */
async function getProcessingJob(jobId: string): Promise<MediaProcessingJob | null> {
  try {
    const { data, error } = await supabase
      .from('media_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      storyId: data.story_id,
      mediaType: data.media_type,
      originalUrl: data.original_url,
      status: data.status,
      processingSteps: data.processing_steps || [],
      outputs: data.outputs || [],
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      error: data.error
    };
  } catch (error) {
    console.error('Error getting processing job:', error);
    return null;
  }
}

/**
 * Update story analysis based on processed media
 */
async function updateStoryAnalysis(storyId: string): Promise<void> {
  try {
    // Get all completed processing jobs for this story
    const { data: jobs, error } = await supabase
      .from('media_processing_jobs')
      .select('*')
      .eq('story_id', storyId)
      .eq('status', 'completed');

    if (error || !jobs || jobs.length === 0) {
      return;
    }

    // Aggregate analysis results
    const aggregatedAnalysis = aggregateAnalysisResults(jobs);

    // Store story analysis
    const { error: analysisError } = await supabase
      .from('story_analysis')
      .upsert({
        story_id: storyId,
        analysis_type: 'multimedia',
        results: aggregatedAnalysis,
        confidence: calculateOverallConfidence(jobs),
        version: '1.0',
        created_at: new Date().toISOString()
      });

    if (analysisError) {
      console.error('Failed to store story analysis:', analysisError);
    }
  } catch (error) {
    console.error('Error updating story analysis:', error);
  }
}

/**
 * Aggregate analysis results from multiple jobs
 */
function aggregateAnalysisResults(jobs: any[]): any {
  const aggregated = {
    themes: new Set<string>(),
    topics: new Set<string>(),
    culturalElements: new Set<string>(),
    sentiment: 'neutral',
    transcripts: [] as string[],
    culturalSafety: 'public',
    traditionalKnowledge: false,
    accessibility: {
      hasTranscript: false,
      hasCaptions: false,
      hasAltText: false
    }
  };

  for (const job of jobs) {
    for (const output of job.outputs || []) {
      if (output.type === 'analysis' && output.metadata) {
        const metadata = output.metadata;
        
        // Aggregate themes
        if (metadata.themes) {
          metadata.themes.forEach((theme: string) => aggregated.themes.add(theme));
        }
        
        // Aggregate topics
        if (metadata.topics) {
          metadata.topics.forEach((topic: string) => aggregated.topics.add(topic));
        }
        
        // Aggregate cultural elements
        if (metadata.culturalElements) {
          metadata.culturalElements.forEach((element: string) => aggregated.culturalElements.add(element));
        }
        
        // Update cultural safety level (take most restrictive)
        if (metadata.culturalSafetyLevel) {
          const levels = ['public', 'community', 'restricted', 'sacred'];
          const currentLevel = levels.indexOf(aggregated.culturalSafety);
          const newLevel = levels.indexOf(metadata.culturalSafetyLevel);
          if (newLevel > currentLevel) {
            aggregated.culturalSafety = metadata.culturalSafetyLevel;
          }
        }
        
        // Check for traditional knowledge
        if (metadata.traditionalKnowledgeDetected) {
          aggregated.traditionalKnowledge = true;
        }
      }
      
      // Collect transcripts
      if (output.type === 'transcript' && output.content) {
        aggregated.transcripts.push(output.content);
        aggregated.accessibility.hasTranscript = true;
      }
      
      // Check for captions
      if (output.type === 'captions') {
        aggregated.accessibility.hasCaptions = true;
      }
    }
  }

  return {
    themes: Array.from(aggregated.themes),
    topics: Array.from(aggregated.topics),
    culturalElements: Array.from(aggregated.culturalElements),
    sentiment: aggregated.sentiment,
    transcripts: aggregated.transcripts,
    culturalSafety: aggregated.culturalSafety,
    traditionalKnowledge: aggregated.traditionalKnowledge,
    accessibility: aggregated.accessibility
  };
}

/**
 * Calculate overall confidence from job results
 */
function calculateOverallConfidence(jobs: any[]): number {
  let totalConfidence = 0;
  let outputCount = 0;

  for (const job of jobs) {
    for (const output of job.outputs || []) {
      if (output.confidence) {
        totalConfidence += output.confidence;
        outputCount++;
      }
    }
  }

  return outputCount > 0 ? totalConfidence / outputCount : 0;
}

/**
 * Get processing status for a story
 */
export async function getStoryProcessingStatus(storyId: string): Promise<{
  jobs: MediaProcessingJob[];
  overallStatus: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}> {
  try {
    const { data, error } = await supabase
      .from('media_processing_jobs')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get processing status: ${error.message}`);
    }

    const jobs: MediaProcessingJob[] = (data || []).map(job => ({
      id: job.id,
      storyId: job.story_id,
      mediaType: job.media_type,
      originalUrl: job.original_url,
      status: job.status,
      processingSteps: job.processing_steps || [],
      outputs: job.outputs || [],
      metadata: job.metadata || {},
      createdAt: new Date(job.created_at),
      completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
      error: job.error
    }));

    // Calculate overall status and progress
    let overallStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'completed';
    let totalProgress = 0;

    if (jobs.length === 0) {
      overallStatus = 'completed';
      totalProgress = 100;
    } else {
      let completedJobs = 0;
      let failedJobs = 0;
      let processingJobs = 0;

      for (const job of jobs) {
        if (job.status === 'completed') {
          completedJobs++;
          totalProgress += 100;
        } else if (job.status === 'failed') {
          failedJobs++;
          totalProgress += 0;
        } else if (job.status === 'processing') {
          processingJobs++;
          // Calculate progress based on completed steps
          const completedSteps = job.processingSteps.filter(step => step.status === 'completed').length;
          const stepProgress = (completedSteps / job.processingSteps.length) * 100;
          totalProgress += stepProgress;
        } else {
          totalProgress += 0;
        }
      }

      if (failedJobs > 0 && completedJobs === 0) {
        overallStatus = 'failed';
      } else if (processingJobs > 0 || (completedJobs > 0 && completedJobs < jobs.length)) {
        overallStatus = 'processing';
      } else if (completedJobs === jobs.length) {
        overallStatus = 'completed';
      } else {
        overallStatus = 'pending';
      }

      totalProgress = totalProgress / jobs.length;
    }

    return {
      jobs,
      overallStatus,
      progress: Math.round(totalProgress)
    };
  } catch (error) {
    console.error('Error getting story processing status:', error);
    return {
      jobs: [],
      overallStatus: 'failed',
      progress: 0
    };
  }
}