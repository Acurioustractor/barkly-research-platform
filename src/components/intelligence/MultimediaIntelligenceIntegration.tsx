'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Headphones, 
  Video, 
  Image,
  FileText,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface MultimediaIntelligenceIntegrationProps {
  communityId: string;
  timeRange?: { start: Date; end: Date };
}

interface StoryAnalysis {
  id: string;
  storyId: string;
  title: string;
  mediaType: string;
  analysisResults: {
    themes: string[];
    sentiment: string;
    culturalElements: string[];
    keyInsights: string[];
    emotionalJourney: Array<{ timestamp: number; emotion: string; intensity: number }>;
    communityRelevance: number;
    traditionalKnowledgeScore: number;
  };
  processingStatus: 'completed' | 'processing' | 'failed';
  confidence: number;
  createdAt: Date;
}

interface CommunityInsights {
  totalStories: number;
  multimediaStories: number;
  processingComplete: number;
  topThemes: Array<{ theme: string; count: number; sentiment: number }>;
  emotionalTrends: Array<{ date: string; joy: number; pride: number; concern: number }>;
  culturalPreservation: {
    traditionalKnowledgeStories: number;
    languageUsage: Record<string, number>;
    culturalPractices: string[];
  };
  communityVoice: {
    participationRate: number;
    diversityScore: number;
    engagementTrends: Array<{ date: string; engagement: number }>;
  };
}

export default function MultimediaIntelligenceIntegration({
  communityId,
  timeRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
}: MultimediaIntelligenceIntegrationProps) {
  const [storyAnalyses, setStoryAnalyses] = useState<StoryAnalysis[]>([]);
  const [communityInsights, setCommunityInsights] = useState<CommunityInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMultimediaIntelligence();
  }, [communityId, timeRange]);

  const loadMultimediaIntelligence = async () => {
    setLoading(true);
    try {
      // Mock data - would integrate with actual multimedia processing and AI analysis
      const mockAnalyses: StoryAnalysis[] = [
        {
          id: '1',
          storyId: 'story-1',
          title: 'Traditional Hunting Practices',
          mediaType: 'audio',
          analysisResults: {
            themes: ['traditional knowledge', 'hunting', 'land connection', 'elder wisdom'],
            sentiment: 'respectful',
            culturalElements: ['traditional practices', 'land acknowledgment', 'ancestral knowledge'],
            keyInsights: [
              'Strong connection to traditional hunting methods',
              'Emphasis on sustainable practices',
              'Intergenerational knowledge transfer'
            ],
            emotionalJourney: [
              { timestamp: 0, emotion: 'reverence', intensity: 0.8 },
              { timestamp: 30, emotion: 'pride', intensity: 0.9 },
              { timestamp: 60, emotion: 'concern', intensity: 0.6 }
            ],
            communityRelevance: 0.95,
            traditionalKnowledgeScore: 0.92
          },
          processingStatus: 'completed',
          confidence: 0.88,
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          storyId: 'story-2',
          title: 'Youth Cultural Program Success',
          mediaType: 'video',
          analysisResults: {
            themes: ['youth development', 'cultural education', 'community success', 'mentorship'],
            sentiment: 'positive',
            culturalElements: ['youth engagement', 'cultural learning', 'community celebration'],
            keyInsights: [
              'High youth engagement in cultural programs',
              'Successful mentorship model',
              'Strong community support for youth initiatives'
            ],
            emotionalJourney: [
              { timestamp: 0, emotion: 'excitement', intensity: 0.7 },
              { timestamp: 45, emotion: 'pride', intensity: 0.9 },
              { timestamp: 90, emotion: 'hope', intensity: 0.8 }
            ],
            communityRelevance: 0.87,
            traditionalKnowledgeScore: 0.45
          },
          processingStatus: 'completed',
          confidence: 0.91,
          createdAt: new Date('2024-01-20')
        }
      ];

      const mockInsights: CommunityInsights = {
        totalStories: 45,
        multimediaStories: 28,
        processingComplete: 25,
        topThemes: [
          { theme: 'Cultural Education', count: 12, sentiment: 0.8 },
          { theme: 'Traditional Knowledge', count: 10, sentiment: 0.9 },
          { theme: 'Youth Development', count: 8, sentiment: 0.7 },
          { theme: 'Community Health', count: 6, sentiment: 0.6 },
          { theme: 'Land Connection', count: 5, sentiment: 0.85 }
        ],
        emotionalTrends: [
          { date: '2024-01-01', joy: 0.6, pride: 0.8, concern: 0.3 },
          { date: '2024-01-08', joy: 0.7, pride: 0.85, concern: 0.25 },
          { date: '2024-01-15', joy: 0.75, pride: 0.9, concern: 0.2 },
          { date: '2024-01-22', joy: 0.8, pride: 0.88, concern: 0.15 }
        ],
        culturalPreservation: {
          traditionalKnowledgeStories: 15,
          languageUsage: {
            'English': 35,
            'Warumungu': 8,
            'Mixed': 2
          },
          culturalPractices: [
            'Traditional hunting',
            'Ceremony preparation',
            'Storytelling',
            'Land care practices',
            'Traditional medicine'
          ]
        },
        communityVoice: {
          participationRate: 0.68,
          diversityScore: 0.75,
          engagementTrends: [
            { date: '2024-01-01', engagement: 0.5 },
            { date: '2024-01-08', engagement: 0.6 },
            { date: '2024-01-15', engagement: 0.7 },
            { date: '2024-01-22', engagement: 0.75 }
          ]
        }
      };

      setStoryAnalyses(mockAnalyses);
      setCommunityInsights(mockInsights);
    } catch (error) {
      console.error('Error loading multimedia intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'audio': return Headphones;
      case 'video': return Video;
      case 'multimedia': return Image;
      default: return FileText;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading multimedia intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            Multimedia Intelligence Integration
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered insights from community multimedia stories
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      {communityInsights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Stories</p>
                  <p className="text-2xl font-bold text-gray-900">{communityInsights.totalStories}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Multimedia Stories</p>
                  <p className="text-2xl font-bold text-purple-600">{communityInsights.multimediaStories}</p>
                </div>
                <Video className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing Complete</p>
                  <p className="text-2xl font-bold text-green-600">{communityInsights.processingComplete}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Traditional Knowledge</p>
                  <p className="text-2xl font-bold text-orange-600">{communityInsights.culturalPreservation.traditionalKnowledgeStories}</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stories">Story Analysis</TabsTrigger>
          <TabsTrigger value="themes">Themes & Insights</TabsTrigger>
          <TabsTrigger value="cultural">Cultural Intelligence</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {communityInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Emotional Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Emotional Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {communityInsights.emotionalTrends.map((trend, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{new Date(trend.date).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600">Joy</span>
                            <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${trend.joy * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(trend.joy * 100)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-600">Pride</span>
                            <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${trend.pride * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(trend.pride * 100)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-600">Concern</span>
                            <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: `${trend.concern * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(trend.concern * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Voice Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Community Voice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Participation Rate</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(communityInsights.communityVoice.participationRate * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${communityInsights.communityVoice.participationRate * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Voice Diversity</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(communityInsights.communityVoice.diversityScore * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${communityInsights.communityVoice.diversityScore * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Language Usage</h4>
                      <div className="space-y-1">
                        {Object.entries(communityInsights.culturalPreservation.languageUsage).map(([language, count]) => (
                          <div key={language} className="flex justify-between text-sm">
                            <span>{language}</span>
                            <span className="font-medium">{count} stories</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Story Analysis Tab */}
        <TabsContent value="stories" className="space-y-4">
          <div className="space-y-4">
            {storyAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {analysis.title}
                        </h3>
                        <Badge variant="outline" className="flex items-center">
                          {React.createElement(getMediaTypeIcon(analysis.mediaType), { 
                            className: "w-3 h-3 mr-1" 
                          })}
                          {analysis.mediaType}
                        </Badge>
                        <Badge className={getSentimentColor(analysis.analysisResults.sentiment)}>
                          {analysis.analysisResults.sentiment}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><strong>Community Relevance:</strong> {Math.round(analysis.analysisResults.communityRelevance * 100)}%</p>
                          <p><strong>Traditional Knowledge:</strong> {Math.round(analysis.analysisResults.traditionalKnowledgeScore * 100)}%</p>
                        </div>
                        <div>
                          <p><strong>Analysis Confidence:</strong> {Math.round(analysis.confidence * 100)}%</p>
                          <p><strong>Processed:</strong> {analysis.createdAt.toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Themes</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.analysisResults.themes.map((theme, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analysis.analysisResults.keyInsights.map((insight, index) => (
                              <li key={index} className="flex items-start">
                                <Lightbulb className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Cultural Elements</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.analysisResults.culturalElements.map((element, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center ml-4">
                      {analysis.processingStatus === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : analysis.processingStatus === 'processing' ? (
                        <Clock className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Themes & Insights Tab */}
        <TabsContent value="themes" className="space-y-6">
          {communityInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Top Themes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {communityInsights.topThemes.map((theme, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{theme.theme}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{theme.count} stories</span>
                            <Badge className={getSentimentColor(theme.sentiment > 0.7 ? 'positive' : theme.sentiment > 0.4 ? 'neutral' : 'negative')}>
                              {Math.round(theme.sentiment * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(theme.count / communityInsights.totalStories) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start">
                        <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Cultural Preservation Strength</h4>
                          <p className="text-sm text-blue-800">
                            Strong emphasis on traditional knowledge sharing with 92% confidence in cultural authenticity across multimedia stories.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-start">
                        <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-green-900 mb-1">Youth Engagement Success</h4>
                          <p className="text-sm text-green-800">
                            Youth-focused multimedia content shows 87% positive sentiment and high community relevance scores.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-start">
                        <Target className="w-5 h-5 text-orange-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-orange-900 mb-1">Language Preservation Opportunity</h4>
                          <p className="text-sm text-orange-800">
                            Only 18% of stories include traditional language elements. Consider encouraging more bilingual content.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Cultural Intelligence Tab */}
        <TabsContent value="cultural" className="space-y-6">
          {communityInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Cultural Practices Mentioned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {communityInsights.culturalPreservation.culturalPractices.map((practice, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{practice}</span>
                        <Badge variant="outline">
                          {Math.floor(Math.random() * 8) + 1} mentions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Cultural Intelligence Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Traditional Knowledge Preservation</span>
                        <span className="text-sm text-gray-600">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Cultural Authenticity Score</span>
                        <span className="text-sm text-gray-600">88%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Intergenerational Knowledge Transfer</span>
                        <span className="text-sm text-gray-600">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Cultural Safety Compliance</span>
                        <span className="text-sm text-gray-600">96%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: '96%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}