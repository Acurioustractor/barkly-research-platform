'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Mic, 
  Video, 
  Image, 
  FileText,
  Play,
  Pause,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Globe,
  BookOpen,
  Heart,
  Star
} from 'lucide-react';

interface StoryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  culturalSafety: string;
  requiresApproval: boolean;
}

interface CommunityTheme {
  id: string;
  name: string;
  description: string;
  color: string;
  isPriority: boolean;
  relatedTopics: string[];
}

interface EnhancedStorySubmissionProps {
  communityId: string;
  userId?: string;
  onSubmissionComplete?: (storyId: string) => void;
  onCancel?: () => void;
}

export default function EnhancedStorySubmission({
  communityId,
  userId,
  onSubmissionComplete,
  onCancel
}: EnhancedStorySubmissionProps) {
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    authorName: '',
    authorRole: '',
    category: '',
    mediaType: 'text' as 'text' | 'audio' | 'video' | 'multimedia',
    culturalSafety: 'public' as 'public' | 'community' | 'restricted' | 'sacred',
    themes: [] as string[],
    communityPriorities: [] as string[],
    culturalThemes: [] as string[],
    traditionalKnowledge: false,
    requiresElderReview: false,
    language: 'English',
    dialect: '',
    location: '',
    hasTranscript: false,
    hasSubtitles: false,
    hasSignLanguage: false,
    accessibilityNotes: '',
    isInspiring: false,
    allowComments: true,
    allowSharing: true,
    scheduledFor: undefined as Date | undefined
  });

  // Media files
  const [mediaFiles, setMediaFiles] = useState({
    audio: [] as File[],
    video: [] as File[],
    images: [] as File[],
    documents: [] as File[]
  });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFormData();
  }, [communityId]);

  const loadFormData = async () => {
    setLoading(true);
    try {
      // Load categories and themes
      // This would integrate with the enhanced story service
      const mockCategories: StoryCategory[] = [
        {
          id: '1',
          name: 'Personal Stories',
          description: 'Individual experiences and journeys',
          icon: 'user',
          culturalSafety: 'public',
          requiresApproval: false
        },
        {
          id: '2',
          name: 'Traditional Knowledge',
          description: 'Cultural practices and traditional wisdom',
          icon: 'book',
          culturalSafety: 'community',
          requiresApproval: true
        },
        {
          id: '3',
          name: 'Elder Wisdom',
          description: 'Stories and advice from community elders',
          icon: 'crown',
          culturalSafety: 'community',
          requiresApproval: true
        }
      ];

      const mockThemes: CommunityTheme[] = [
        {
          id: '1',
          name: 'Health and Wellbeing',
          description: 'Physical, mental, and spiritual health',
          color: '#10B981',
          isPriority: true,
          relatedTopics: ['healthcare', 'mental health', 'traditional medicine']
        },
        {
          id: '2',
          name: 'Culture and Language',
          description: 'Traditional culture and language preservation',
          color: '#EF4444',
          isPriority: true,
          relatedTopics: ['ceremony', 'language', 'traditions']
        },
        {
          id: '3',
          name: 'Youth Development',
          description: 'Programs and support for young people',
          color: '#06B6D4',
          isPriority: false,
          relatedTopics: ['youth programs', 'mentoring', 'activities']
        }
      ];

      setCategories(mockCategories);
      setThemes(mockThemes);
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type: 'audio' | 'video' | 'images' | 'documents', files: FileList) => {
    const newFiles = Array.from(files);
    setMediaFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...newFiles]
    }));

    // Update media type based on uploaded files
    if (type === 'audio' && formData.mediaType === 'text') {
      setFormData(prev => ({ ...prev, mediaType: 'audio' }));
    } else if (type === 'video' && formData.mediaType === 'text') {
      setFormData(prev => ({ ...prev, mediaType: 'video' }));
    } else if ((type === 'images' || type === 'documents') && formData.mediaType === 'text') {
      setFormData(prev => ({ ...prev, mediaType: 'multimedia' }));
    }
  };

  const removeFile = (type: 'audio' | 'video' | 'images' | 'documents', index: number) => {
    setMediaFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'audio' 
        ? { audio: true }
        : { audio: true, video: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: type === 'audio' ? 'audio/webm' : 'video/webm' 
        });
        const file = new File([blob], `recorded-${type}-${Date.now()}.webm`, {
          type: blob.type
        });

        setMediaFiles(prev => ({
          ...prev,
          [type]: [...prev[type], file]
        }));

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      setMediaRecorder(recorder);
      setRecordingType(type);
      setIsRecording(true);
      recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrors({ recording: 'Failed to start recording. Please check your microphone/camera permissions.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingType(null);
      setMediaRecorder(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Story content is required';
    }

    if (!formData.authorName.trim()) {
      newErrors.authorName = 'Author name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Check if traditional knowledge requires elder review
    if (formData.traditionalKnowledge && !formData.requiresElderReview) {
      newErrors.traditionalKnowledge = 'Traditional knowledge stories require elder review';
    }

    // Check cultural safety requirements
    const selectedCategory = categories.find(c => c.id === formData.category);
    if (selectedCategory?.requiresApproval && formData.culturalSafety === 'public') {
      newErrors.culturalSafety = 'This category requires community or restricted access';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // This would integrate with the enhanced story service
      console.log('Submitting story:', {
        ...formData,
        mediaFiles,
        communityId,
        userId
      });

      // Mock submission
      const storyId = 'mock-story-id';
      
      onSubmissionComplete?.(storyId);
    } catch (error) {
      console.error('Error submitting story:', error);
      setErrors({ submit: 'Failed to submit story. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleThemeToggle = (themeId: string, themeName: string) => {
    const isSelected = formData.culturalThemes.includes(themeName);
    
    setFormData(prev => ({
      ...prev,
      culturalThemes: isSelected
        ? prev.culturalThemes.filter(t => t !== themeName)
        : [...prev.culturalThemes, themeName]
    }));
  };

  const getCulturalSafetyIcon = (level: string) => {
    switch (level) {
      case 'public': return Globe;
      case 'community': return Users;
      case 'restricted': return Shield;
      case 'sacred': return AlertTriangle;
      default: return Globe;
    }
  };

  const getCulturalSafetyColor = (level: string) => {
    switch (level) {
      case 'public': return 'text-green-600';
      case 'community': return 'text-blue-600';
      case 'restricted': return 'text-yellow-600';
      case 'sacred': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading story submission form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
          Share Your Story
        </CardTitle>
        <p className="text-gray-600">
          Share your experiences, wisdom, and insights with the community
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="cultural">Cultural Context</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a compelling title for your story"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <Input
                    value={formData.authorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    placeholder="Enter your name"
                    className={errors.authorName ? 'border-red-500' : ''}
                  />
                  {errors.authorName && (
                    <p className="text-sm text-red-600 mt-1">{errors.authorName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Role (Optional)
                  </label>
                  <Input
                    value={formData.authorRole}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorRole: e.target.value }))}
                    placeholder="e.g., Community Elder, Youth Leader"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{category.name}</span>
                            {category.requiresApproval && (
                              <Badge variant="outline" className="text-xs">
                                Requires Approval
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cultural Safety Level *
                  </label>
                  <Select
                    value={formData.culturalSafety}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, culturalSafety: value }))}
                  >
                    <SelectTrigger className={errors.culturalSafety ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['public', 'community', 'restricted', 'sacred'].map((level) => {
                        const Icon = getCulturalSafetyIcon(level);
                        const colorClass = getCulturalSafetyColor(level);
                        return (
                          <SelectItem key={level} value={level}>
                            <div className="flex items-center">
                              <Icon className={`w-4 h-4 mr-2 ${colorClass}`} />
                              <span className="capitalize">{level}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.culturalSafety && (
                    <p className="text-sm text-red-600 mt-1">{errors.culturalSafety}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Story Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Tell your story here..."
                  rows={8}
                  className={errors.content ? 'border-red-500' : ''}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 mt-1">{errors.content}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brief Summary (Optional)
                </label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A brief summary of your story (will be auto-generated if left empty)"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Audio Recording/Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Mic className="w-5 h-5 mr-2" />
                      Audio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={isRecording && recordingType === 'audio' ? 'destructive' : 'outline'}
                        onClick={() => isRecording ? stopRecording() : startRecording('audio')}
                        disabled={isRecording && recordingType !== 'audio'}
                      >
                        {isRecording && recordingType === 'audio' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Record Audio
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Audio
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload('audio', e.target.files)}
                    />

                    {mediaFiles.audio.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Audio Files:</p>
                        {mediaFiles.audio.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile('audio', index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Video Recording/Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Video className="w-5 h-5 mr-2" />
                      Video
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={isRecording && recordingType === 'video' ? 'destructive' : 'outline'}
                        onClick={() => isRecording ? stopRecording() : startRecording('video')}
                        disabled={isRecording && recordingType !== 'video'}
                      >
                        {isRecording && recordingType === 'video' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Record Video
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/*';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFileUpload('video', files);
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>

                    {isRecording && recordingType === 'video' && (
                      <video
                        ref={videoRef}
                        className="w-full h-48 bg-black rounded"
                        muted
                      />
                    )}

                    {mediaFiles.video.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Video Files:</p>
                        {mediaFiles.video.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile('video', index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Images Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Image className="w-5 h-5 mr-2" />
                      Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) handleFileUpload('images', files);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>

                    {mediaFiles.images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Image Files:</p>
                        {mediaFiles.images.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile('images', index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="w-5 h-5 mr-2" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx,.txt';
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) handleFileUpload('documents', files);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>

                    {mediaFiles.documents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Document Files:</p>
                        {mediaFiles.documents.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile('documents', index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Accessibility Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Accessibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.hasTranscript}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          hasTranscript: checked as boolean 
                        }))}
                      />
                      <label className="text-sm">Has Transcript</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.hasSubtitles}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          hasSubtitles: checked as boolean 
                        }))}
                      />
                      <label className="text-sm">Has Subtitles</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.hasSignLanguage}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          hasSignLanguage: checked as boolean 
                        }))}
                      />
                      <label className="text-sm">Has Sign Language</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accessibility Notes
                    </label>
                    <Textarea
                      value={formData.accessibilityNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, accessibilityNotes: e.target.value }))}
                      placeholder="Any additional accessibility information"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cultural Context Tab */}
            <TabsContent value="cultural" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <Input
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    placeholder="Primary language of the story"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dialect (Optional)
                  </label>
                  <Input
                    value={formData.dialect}
                    onChange={(e) => setFormData(prev => ({ ...prev, dialect: e.target.value }))}
                    placeholder="Specific dialect or language variation"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Optional)
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where this story takes place or was recorded"
                  />
                </div>
              </div>

              {/* Community Themes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Community Themes
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.culturalThemes.includes(theme.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleThemeToggle(theme.id, theme.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: theme.color }}
                          />
                          <span className="font-medium">{theme.name}</span>
                          {theme.isPriority && (
                            <Star className="w-4 h-4 ml-2 text-yellow-500" />
                          )}
                        </div>
                        <Checkbox
                          checked={formData.culturalThemes.includes(theme.name)}
                          readOnly
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural Considerations */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.traditionalKnowledge}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      traditionalKnowledge: checked as boolean,
                      requiresElderReview: checked as boolean // Auto-enable elder review
                    }))}
                  />
                  <label className="text-sm font-medium">
                    This story contains traditional knowledge
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.requiresElderReview}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      requiresElderReview: checked as boolean 
                    }))}
                  />
                  <label className="text-sm font-medium">
                    Requires elder review before publishing
                  </label>
                </div>

                {errors.traditionalKnowledge && (
                  <p className="text-sm text-red-600">{errors.traditionalKnowledge}</p>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.isInspiring}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isInspiring: checked as boolean 
                    }))}
                  />
                  <label className="text-sm font-medium flex items-center">
                    <Heart className="w-4 h-4 mr-1 text-red-500" />
                    Mark as inspiring story
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.allowComments}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      allowComments: checked as boolean 
                    }))}
                  />
                  <label className="text-sm font-medium">
                    Allow comments on this story
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.allowSharing}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      allowSharing: checked as boolean 
                    }))}
                  />
                  <label className="text-sm font-medium">
                    Allow sharing of this story
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule for Later (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledFor ? formData.scheduledFor.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    scheduledFor: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to submit for immediate review
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            </div>
          )}

          {errors.recording && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{errors.recording}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Story
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}