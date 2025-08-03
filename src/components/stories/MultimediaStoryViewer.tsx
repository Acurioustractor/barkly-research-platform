'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  ClosedCaptioning,
  FileText,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  Clock,
  User,
  Globe,
  Users,
  Shield,
  AlertTriangle,
  Headphones,
  Video,
  Image,
  BookOpen,
  Settings,
  Accessibility
} from 'lucide-react';

interface MultimediaStoryViewerProps {
  story: {
    id: string;
    title: string;
    content: string;
    authorName: string;
    authorRole?: string;
    category: string;
    mediaType: 'text' | 'audio' | 'video' | 'multimedia';
    culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
    themes: string[];
    culturalThemes: string[];
    traditionalKnowledge: boolean;
    publishedAt: Date;
    duration?: number;
    language?: string;
    dialect?: string;
    location?: string;
    mediaUrls?: {
      audio: Array<{ url: string; filename: string; duration?: number }>;
      video: Array<{ url: string; filename: string; duration?: number }>;
      images: Array<{ url: string; filename: string; alt?: string }>;
      documents: Array<{ url: string; filename: string; type: string }>;
    };
    accessibility?: {
      hasTranscript: boolean;
      hasCaptions: boolean;
      hasSignLanguage: boolean;
      accessibilityNotes?: string;
    };
    engagement?: {
      views: number;
      likes: number;
      shares: number;
      comments: number;
    };
  };
  userRole?: string;
  onEngagement?: (type: 'like' | 'share' | 'comment') => void;
  showControls?: boolean;
}

export default function MultimediaStoryViewer({
  story,
  userRole,
  onEngagement,
  showControls = true
}: MultimediaStoryViewerProps) {
  const [activeTab, setActiveTab] = useState('story');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<any>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const [transcript, setTranscript] = useState(`
    Welcome to our community story sharing session. Today we're talking about our cultural traditions 
    and how they connect us to our ancestors and the land. These stories are important for preserving 
    our heritage and passing knowledge to future generations.
  `);

  const [captions, setCaptions] = useState([
    { start: 0, end: 5, text: "Welcome to our community story sharing session." },
    { start: 5, end: 10, text: "Today we're talking about our cultural traditions." },
    { start: 10, end: 15, text: "These stories connect us to our ancestors and land." }
  ]);

  useEffect(() => {
    // Load processing status if multimedia content
    if (story.mediaType !== 'text') {
      loadProcessingStatus();
    }
  }, [story.id]);

  const loadProcessingStatus = async () => {
    try {
      // This would integrate with the multimedia processing service
      const mockStatus = {
        overallStatus: 'completed',
        progress: 100,
        jobs: [
          {
            mediaType: story.mediaType,
            status: 'completed',
            outputs: [
              { type: 'transcript', available: true },
              { type: 'captions', available: story.mediaType === 'video' },
              { type: 'thumbnail', available: story.mediaType === 'video' }
            ]
          }
        ]
      };
      setProcessingStatus(mockStatus);
    } catch (error) {
      console.error('Error loading processing status:', error);
    }
  };

  const handlePlayPause = () => {
    const mediaElement = story.mediaType === 'video' ? videoRef.current : audioRef.current;
    
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const mediaElement = story.mediaType === 'video' ? videoRef.current : audioRef.current;
    
    if (mediaElement) {
      setCurrentTime(mediaElement.currentTime);
      setDuration(mediaElement.duration || 0);
    }
  };

  const handleSeek = (time: number) => {
    const mediaElement = story.mediaType === 'video' ? videoRef.current : audioRef.current;
    
    if (mediaElement) {
      mediaElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const mediaElement = story.mediaType === 'video' ? videoRef.current : audioRef.current;
    
    if (mediaElement) {
      mediaElement.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const mediaElement = story.mediaType === 'video' ? videoRef.current : audioRef.current;
    
    if (mediaElement) {
      const newMuted = !isMuted;
      mediaElement.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      case 'public': return 'text-green-600 bg-green-100';
      case 'community': return 'text-blue-600 bg-blue-100';
      case 'restricted': return 'text-yellow-600 bg-yellow-100';
      case 'sacred': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'audio': return Headphones;
      case 'video': return Video;
      case 'multimedia': return Image;
      default: return BookOpen;
    }
  };

  const getCurrentCaption = () => {
    return captions.find(caption => 
      currentTime >= caption.start && currentTime <= caption.end
    );
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{story.title}</CardTitle>
              <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>{story.authorName}</span>
                  {story.authorRole && (
                    <span className="text-gray-400 ml-1">({story.authorRole})</span>
                  )}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{story.publishedAt.toLocaleDateString()}</span>
                </div>
                {story.duration && (
                  <div className="flex items-center">
                    <Play className="w-4 h-4 mr-1" />
                    <span>{formatTime(story.duration)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getCulturalSafetyColor(story.culturalSafety)}>
                  {React.createElement(getCulturalSafetyIcon(story.culturalSafety), { 
                    className: "w-3 h-3 mr-1" 
                  })}
                  {story.culturalSafety}
                </Badge>
                
                <Badge variant="outline" className="flex items-center">
                  {React.createElement(getMediaTypeIcon(story.mediaType), { 
                    className: "w-3 h-3 mr-1" 
                  })}
                  {story.mediaType}
                </Badge>
                
                {story.traditionalKnowledge && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Traditional Knowledge
                  </Badge>
                )}
                
                <Badge variant="outline">{story.category}</Badge>
              </div>

              {story.themes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {story.themes.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {showControls && (
              <div className="flex items-center space-x-2 ml-4">
                {story.engagement && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onEngagement?.('like')}>
                      <Heart className="w-4 h-4 mr-1" />
                      {story.engagement.likes}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEngagement?.('share')}>
                      <Share2 className="w-4 h-4 mr-1" />
                      {story.engagement.shares}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEngagement?.('comment')}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {story.engagement.comments}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="story">Story</TabsTrigger>
              {story.mediaType !== 'text' && <TabsTrigger value="media">Media</TabsTrigger>}
              {story.accessibility?.hasTranscript && <TabsTrigger value="transcript">Transcript</TabsTrigger>}
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Story Content Tab */}
            <TabsContent value="story" className="space-y-4">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {story.content}
                </p>
              </div>

              {/* Images */}
              {story.mediaUrls?.images && story.mediaUrls.images.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {story.mediaUrls.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={image.alt || `Image ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedImageIndex(index)}
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {image.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {story.mediaUrls?.documents && story.mediaUrls.documents.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Documents</h4>
                  <div className="space-y-2">
                    {story.mediaUrls.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-3 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.filename}</p>
                            <p className="text-sm text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Media Tab */}
            {story.mediaType !== 'text' && (
              <TabsContent value="media" className="space-y-4">
                {/* Audio Player */}
                {(story.mediaType === 'audio' || story.mediaType === 'multimedia') && 
                 story.mediaUrls?.audio && story.mediaUrls.audio.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Headphones className="w-5 h-5 mr-2" />
                      Audio Content
                    </h4>
                    
                    {story.mediaUrls.audio.map((audio, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">{audio.filename}</span>
                          {audio.duration && (
                            <span className="text-sm text-gray-500">
                              {formatTime(audio.duration)}
                            </span>
                          )}
                        </div>
                        
                        <audio
                          ref={audioRef}
                          src={audio.url}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleTimeUpdate}
                          className="hidden"
                        />
                        
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePlayPause}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                          
                          <span className="text-sm text-gray-500 min-w-[80px]">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Player */}
                {(story.mediaType === 'video' || story.mediaType === 'multimedia') && 
                 story.mediaUrls?.video && story.mediaUrls.video.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      Video Content
                    </h4>
                    
                    {story.mediaUrls.video.map((video, index) => (
                      <div key={index} className="bg-black rounded-lg overflow-hidden">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            src={video.url}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleTimeUpdate}
                            className="w-full h-auto"
                            poster={`${video.url}_thumbnail.jpg`}
                          />
                          
                          {/* Video Controls Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePlayPause}
                                className="text-white hover:bg-white/20"
                              >
                                {isPlaying ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5" />
                                )}
                              </Button>
                              
                              <div className="flex-1">
                                <div className="w-full bg-white/30 rounded-full h-1">
                                  <div
                                    className="bg-white h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              <span className="text-white text-sm min-w-[80px]">
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCaptions(!showCaptions)}
                                className="text-white hover:bg-white/20"
                              >
                                <ClosedCaptioning className="w-5 h-5" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMute}
                                className="text-white hover:bg-white/20"
                              >
                                {isMuted ? (
                                  <VolumeX className="w-5 h-5" />
                                ) : (
                                  <Volume2 className="w-5 h-5" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleFullscreen}
                                className="text-white hover:bg-white/20"
                              >
                                {isFullscreen ? (
                                  <Minimize className="w-5 h-5" />
                                ) : (
                                  <Maximize className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Captions */}
                          {showCaptions && (
                            <div className="absolute bottom-16 left-4 right-4">
                              <div className="bg-black bg-opacity-75 text-white text-center p-2 rounded">
                                {getCurrentCaption()?.text || ''}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-900 text-white">
                          <span className="text-sm">{video.filename}</span>
                          {video.duration && (
                            <span className="text-sm text-gray-300 ml-2">
                              ({formatTime(video.duration)})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Transcript Tab */}
            {story.accessibility?.hasTranscript && (
              <TabsContent value="transcript" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Transcript
                  </h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {transcript}
                    </p>
                  </div>
                </div>
                
                {processingStatus?.overallStatus === 'completed' && (
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>Auto-generated transcript • Confidence: 95%</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Story Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{story.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Language:</span>
                      <span>{story.language || 'English'}</span>
                    </div>
                    {story.dialect && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dialect:</span>
                        <span>{story.dialect}</span>
                      </div>
                    )}
                    {story.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span>{story.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published:</span>
                      <span>{story.publishedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cultural Context</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cultural Safety:</span>
                      <Badge className={getCulturalSafetyColor(story.culturalSafety)}>
                        {story.culturalSafety}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Traditional Knowledge:</span>
                      <span>{story.traditionalKnowledge ? 'Yes' : 'No'}</span>
                    </div>
                    {story.culturalThemes.length > 0 && (
                      <div>
                        <span className="text-gray-600">Cultural Themes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {story.culturalThemes.map((theme, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {story.accessibility && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Accessibility className="w-5 h-5 mr-2" />
                      Accessibility
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transcript:</span>
                        <span>{story.accessibility.hasTranscript ? 'Available' : 'Not available'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Captions:</span>
                        <span>{story.accessibility.hasCaptions ? 'Available' : 'Not available'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sign Language:</span>
                        <span>{story.accessibility.hasSignLanguage ? 'Available' : 'Not available'}</span>
                      </div>
                      {story.accessibility.accessibilityNotes && (
                        <div>
                          <span className="text-gray-600">Notes:</span>
                          <p className="text-gray-700 mt-1">{story.accessibility.accessibilityNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {story.engagement && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Engagement</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Views:</span>
                        <span>{story.engagement.views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Likes:</span>
                        <span>{story.engagement.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shares:</span>
                        <span>{story.engagement.shares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Comments:</span>
                        <span>{story.engagement.comments.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}