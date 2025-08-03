'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff,
  Camera,
  CameraOff,
  FileText,
  Clock,
  Users,
  Plus,
  Save,
  Download,
  Share2,
  Lightbulb,
  Target,
  CheckSquare,
  AlertCircle,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  Zap,
  BookOpen,
  MessageSquare,
  Image,
  Video
} from 'lucide-react';

interface WorkshopSession {
  id: string;
  eventId: string;
  sessionTitle: string;
  facilitator: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  objectives: string[];
  materials: string[];
}

interface KnowledgeCapture {
  id: string;
  captureType: 'notes' | 'recording' | 'photo' | 'insight' | 'action_item';
  title: string;
  content?: string;
  timestamp: Date;
  capturedBy: string;
  tags: string[];
  culturalSafety: string;
}

interface ActionItem {
  id: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

interface WorkshopFacilitationToolsProps {
  session: WorkshopSession;
  userRole: 'facilitator' | 'participant' | 'observer';
  userId: string;
  userName: string;
}

export default function WorkshopFacilitationTools({
  session,
  userRole,
  userId,
  userName
}: WorkshopFacilitationToolsProps) {
  const [activeTab, setActiveTab] = useState('capture');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [knowledgeCaptures, setKnowledgeCaptures] = useState<KnowledgeCapture[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  
  // Form states
  const [newCapture, setNewCapture] = useState({
    type: 'notes' as 'notes' | 'insight' | 'action_item',
    title: '',
    content: '',
    tags: [] as string[],
    culturalSafety: 'public'
  });

  const [newActionItem, setNewActionItem] = useState({
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Refs
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Load existing captures and action items
    loadSessionData();
  }, [session.id]);

  useEffect(() => {
    // Update recording timer
    if (isRecording && recordingIntervalRef.current === null) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const loadSessionData = async () => {
    try {
      // Mock data - would integrate with actual service
      const mockCaptures: KnowledgeCapture[] = [
        {
          id: '1',
          captureType: 'notes',
          title: 'Opening Discussion Points',
          content: 'Participants shared their experiences with traditional hunting practices. Key themes: sustainability, respect for land, intergenerational knowledge transfer.',
          timestamp: new Date(),
          capturedBy: 'Facilitator',
          tags: ['traditional knowledge', 'hunting', 'sustainability'],
          culturalSafety: 'community'
        },
        {
          id: '2',
          captureType: 'insight',
          title: 'Elder Wisdom on Seasonal Practices',
          content: 'Elder Mary emphasized the importance of reading seasonal signs before hunting. This knowledge is being lost among younger generations.',
          timestamp: new Date(),
          capturedBy: 'Elder Mary',
          tags: ['elder wisdom', 'seasonal knowledge', 'intergenerational'],
          culturalSafety: 'community'
        }
      ];

      const mockActionItems: ActionItem[] = [
        {
          id: '1',
          description: 'Create digital archive of seasonal hunting calendar',
          assignedTo: 'Cultural Officer',
          dueDate: new Date('2024-03-01'),
          priority: 'high',
          status: 'pending'
        },
        {
          id: '2',
          description: 'Organize youth mentorship program with elders',
          assignedTo: 'Youth Coordinator',
          dueDate: new Date('2024-02-28'),
          priority: 'medium',
          status: 'pending'
        }
      ];

      setKnowledgeCaptures(mockCaptures);
      setActionItems(mockActionItems);
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: isVideoEnabled 
      });

      if (isVideoEnabled && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: isVideoEnabled ? 'video/webm' : 'audio/webm' 
        });
        
        // Here you would upload the blob to storage
        console.log('Recording completed:', blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check your microphone/camera permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const captureKnowledge = async () => {
    if (!newCapture.title.trim()) {
      alert('Please enter a title for the capture');
      return;
    }

    const capture: KnowledgeCapture = {
      id: Date.now().toString(),
      captureType: newCapture.type,
      title: newCapture.title,
      content: newCapture.content,
      timestamp: new Date(),
      capturedBy: userName,
      tags: newCapture.tags,
      culturalSafety: newCapture.culturalSafety
    };

    setKnowledgeCaptures(prev => [capture, ...prev]);
    
    // Reset form
    setNewCapture({
      type: 'notes',
      title: '',
      content: '',
      tags: [],
      culturalSafety: 'public'
    });

    // Here you would save to the backend
    console.log('Captured knowledge:', capture);
  };

  const addActionItem = async () => {
    if (!newActionItem.description.trim()) {
      alert('Please enter a description for the action item');
      return;
    }

    const actionItem: ActionItem = {
      id: Date.now().toString(),
      description: newActionItem.description,
      assignedTo: newActionItem.assignedTo || undefined,
      dueDate: newActionItem.dueDate ? new Date(newActionItem.dueDate) : undefined,
      priority: newActionItem.priority,
      status: 'pending'
    };

    setActionItems(prev => [actionItem, ...prev]);
    
    // Reset form
    setNewActionItem({
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium'
    });

    // Here you would save to the backend
    console.log('Added action item:', actionItem);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCaptureTypeIcon = (type: string) => {
    switch (type) {
      case 'notes': return FileText;
      case 'insight': return Lightbulb;
      case 'action_item': return Target;
      case 'recording': return Mic;
      case 'photo': return Camera;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                {session.sessionTitle}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{session.attendees.length} attendees</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{session.startTime.toLocaleTimeString()} - {session.endTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center">
                  <span>Facilitated by {session.facilitator}</span>
                </div>
              </div>
            </div>

            {/* Recording Controls */}
            {userRole === 'facilitator' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop ({formatTime(recordingTime)})
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Record
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? (
                    <Camera className="w-4 h-4" />
                  ) : (
                    <CameraOff className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Video Preview */}
        {isVideoEnabled && isRecording && (
          <CardContent>
            <video
              ref={videoRef}
              className="w-full max-w-md h-48 bg-black rounded-lg"
              muted={isMuted}
            />
          </CardContent>
        )}
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capture">Knowledge Capture</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
          <TabsTrigger value="notes">Session Notes</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        {/* Knowledge Capture Tab */}
        <TabsContent value="capture" className="space-y-6">
          {/* Capture Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Capture Knowledge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capture Type
                  </label>
                  <select
                    value={newCapture.type}
                    onChange={(e) => setNewCapture(prev => ({ 
                      ...prev, 
                      type: e.target.value as any 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="notes">Notes</option>
                    <option value="insight">Key Insight</option>
                    <option value="action_item">Action Item</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cultural Safety
                  </label>
                  <select
                    value={newCapture.culturalSafety}
                    onChange={(e) => setNewCapture(prev => ({ 
                      ...prev, 
                      culturalSafety: e.target.value 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="public">Public</option>
                    <option value="community">Community</option>
                    <option value="restricted">Restricted</option>
                    <option value="sacred">Sacred</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  value={newCapture.title}
                  onChange={(e) => setNewCapture(prev => ({ 
                    ...prev, 
                    title: e.target.value 
                  }))}
                  placeholder="Enter a descriptive title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <Textarea
                  value={newCapture.content}
                  onChange={(e) => setNewCapture(prev => ({ 
                    ...prev, 
                    content: e.target.value 
                  }))}
                  placeholder="Describe what was discussed, learned, or decided"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <Input
                  value={newCapture.tags.join(', ')}
                  onChange={(e) => setNewCapture(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                  }))}
                  placeholder="traditional knowledge, hunting, sustainability"
                />
              </div>

              <Button onClick={captureKnowledge} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Capture Knowledge
              </Button>
            </CardContent>
          </Card>

          {/* Captured Knowledge List */}
          <Card>
            <CardHeader>
              <CardTitle>Captured Knowledge ({knowledgeCaptures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeCaptures.map((capture) => (
                  <div key={capture.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getCaptureTypeIcon(capture.captureType), { 
                          className: "w-4 h-4 text-blue-600" 
                        })}
                        <h4 className="font-medium text-gray-900">{capture.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {capture.captureType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {capture.culturalSafety}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {capture.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {capture.content && (
                      <p className="text-gray-700 text-sm mb-2">{capture.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          by {capture.capturedBy}
                        </span>
                        {capture.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {capture.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {knowledgeCaptures.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No knowledge captured yet</p>
                    <p className="text-sm">Start capturing insights, notes, and key learnings</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions" className="space-y-6">
          {/* Add Action Item Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Add Action Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={newActionItem.description}
                  onChange={(e) => setNewActionItem(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="What needs to be done?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <Input
                    value={newActionItem.assignedTo}
                    onChange={(e) => setNewActionItem(prev => ({ 
                      ...prev, 
                      assignedTo: e.target.value 
                    }))}
                    placeholder="Person responsible"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={newActionItem.dueDate}
                    onChange={(e) => setNewActionItem(prev => ({ 
                      ...prev, 
                      dueDate: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newActionItem.priority}
                    onChange={(e) => setNewActionItem(prev => ({ 
                      ...prev, 
                      priority: e.target.value as any 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <Button onClick={addActionItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Action Item
              </Button>
            </CardContent>
          </Card>

          {/* Action Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Action Items ({actionItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900">{item.description}</h4>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        {item.assignedTo && (
                          <span>Assigned to: {item.assignedTo}</span>
                        )}
                        {item.dueDate && (
                          <span>Due: {item.dueDate.toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {actionItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No action items yet</p>
                    <p className="text-sm">Add tasks and follow-ups from the workshop</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Take comprehensive notes about the workshop session..."
                rows={12}
                className="w-full"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  {sessionNotes.length} characters
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyInsights.map((insight, index) => (
                  <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}

                {keyInsights.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No key insights captured yet</p>
                    <p className="text-sm">Important learnings and discoveries will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}