'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen,
  Network,
  Map,
  Timeline,
  Users,
  Eye,
  Share2,
  Filter,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Maximize2,
  Settings,
  Globe,
  Shield,
  Crown,
  Heart,
  MessageSquare,
  TrendingUp,
  MapPin,
  Clock,
  Lightbulb,
  Target,
  ArrowRight,
  Zap,
  BarChart3
} from 'lucide-react';

interface StoryNode {
  id: string;
  title: string;
  content: string;
  author: string;
  perspective: 'individual' | 'family' | 'community' | 'organizational' | 'systemic';
  themes: string[];
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  metadata: {
    impactLevel: 'low' | 'medium' | 'high';
    engagementScore: number;
    viewCount: number;
  };
}

interface StoryConnection {
  id: string;
  fromStoryId: string;
  toStoryId: string;
  connectionType: 'causal' | 'temporal' | 'thematic' | 'geographic' | 'stakeholder';
  strength: number;
  description: string;
}

interface OutcomePathway {
  id: string;
  title: string;
  description: string;
  pathwaySteps: any[];
  outcomes: any[];
  stakeholders: string[];
  impactMetrics: {
    reach: number;
    depth: number;
    sustainability: number;
  };
}

interface StoryExploration {
  id: string;
  title: string;
  description: string;
  centralTheme: string;
  storyNodes: StoryNode[];
  connections: StoryConnection[];
  pathways: OutcomePathway[];
  perspectives: {
    individual: StoryNode[];
    family: StoryNode[];
    community: StoryNode[];
    organizational: StoryNode[];
    systemic: StoryNode[];
  };
  timeline: {
    events: any[];
    milestones: any[];
  };
  interactiveElements: {
    filters: any[];
    visualizations: any[];
    narrativeFlows: any[];
  };
}

interface DynamicStorytellingInterfaceProps {
  communityId: string;
  communityName: string;
  userRole: 'admin' | 'community_member' | 'researcher';
  culturalSafetyLevel?: 'public' | 'community' | 'restricted' | 'sacred';
}
export default function DynamicStorytellingInterface({
  communityId,
  communityName,
  userRole,
  culturalSafetyLevel = 'public'
}: DynamicStorytellingInterfaceProps) {
  const [exploration, setExploration] = useState<StoryExploration | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('network');
  const [selectedStory, setSelectedStory] = useState<StoryNode | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<OutcomePathway | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  const [narrativeMode, setNarrativeMode] = useState(false);
  const [currentNarrativeStep, setCurrentNarrativeStep] = useState(0);
  const [sessionToken] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    loadStoryExploration();
  }, [communityId]);

  const loadStoryExploration = async () => {
    setLoading(true);
    try {
      // First try to get existing explorations
      const listResponse = await fetch(`/api/storytelling/explorations?action=list&communityId=${communityId}`);
      const listResult = await listResponse.json();
      
      if (listResult.success && listResult.data.length > 0) {
        // Use the most recent exploration
        setExploration(listResult.data[0]);
      } else {
        // Create a new exploration
        const createResponse = await fetch('/api/storytelling/explorations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            communityId,
            centralTheme: 'Community Journey',
            culturalSafetyLevel,
            maxStories: 30
          }),
        });

        const createResult = await createResponse.json();
        
        if (createResult.success) {
          setExploration(createResult.data);
        } else {
          throw new Error(createResult.error || 'Failed to create story exploration');
        }
      }
    } catch (error) {
      console.error('Error loading story exploration:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackEngagement = useCallback(async (action: string, data?: any) => {
    try {
      await fetch('/api/storytelling/explorations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_session',
          explorationId: exploration?.id,
          sessionToken,
          userType: userRole,
          storiesViewed: selectedStory ? [selectedStory.id] : [],
          pathwaysExplored: selectedPathway ? [selectedPathway.id] : [],
          filtersUsed: activeFilters,
          completionStatus: 'in_progress'
        }),
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }, [exploration?.id, sessionToken, userRole, selectedStory, selectedPathway, activeFilters]);

  const getPerspectiveIcon = (perspective: string) => {
    switch (perspective) {
      case 'individual': return Users;
      case 'family': return Heart;
      case 'community': return Globe;
      case 'organizational': return Target;
      case 'systemic': return Network;
      default: return Users;
    }
  };

  const getPerspectiveColor = (perspective: string) => {
    switch (perspective) {
      case 'individual': return 'text-blue-600 bg-blue-100';
      case 'family': return 'text-green-600 bg-green-100';
      case 'community': return 'text-purple-600 bg-purple-100';
      case 'organizational': return 'text-orange-600 bg-orange-100';
      case 'systemic': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCulturalSafetyIcon = (level: string) => {
    switch (level) {
      case 'public': return Globe;
      case 'community': return Users;
      case 'restricted': return Shield;
      case 'sacred': return Crown;
      default: return Globe;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const applyFilter = (filterType: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (!newFilters[filterType]) {
        newFilters[filterType] = [];
      }
      
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(v => v !== value);
        if (newFilters[filterType].length === 0) {
          delete newFilters[filterType];
        }
      } else {
        newFilters[filterType].push(value);
      }
      
      return newFilters;
    });
    
    trackEngagement('filter_applied', { filterType, value });
  };

  const clearFilters = () => {
    setActiveFilters({});
    trackEngagement('filters_cleared');
  };

  const getFilteredStories = () => {
    if (!exploration) return [];
    
    let filtered = exploration.storyNodes;
    
    Object.entries(activeFilters).forEach(([filterType, values]) => {
      filtered = filtered.filter(story => {
        switch (filterType) {
          case 'perspective':
            return values.includes(story.perspective);
          case 'theme':
            return story.themes.some(theme => values.includes(theme));
          case 'cultural_safety':
            return values.includes(story.culturalSafety);
          case 'impact':
            return values.includes(story.metadata.impactLevel);
          default:
            return true;
        }
      });
    });
    
    return filtered;
  };

  const renderStoryCard = (story: StoryNode) => {
    const PerspectiveIcon = getPerspectiveIcon(story.perspective);
    const CulturalIcon = getCulturalSafetyIcon(story.culturalSafety);
    
    return (
      <Card 
        key={story.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedStory?.id === story.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => {
          setSelectedStory(story);
          trackEngagement('story_selected', { storyId: story.id });
        }}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-gray-900 line-clamp-2">{story.title}</h4>
            <div className="flex items-center space-x-1 ml-2">
              <Badge className={getPerspectiveColor(story.perspective)}>
                <PerspectiveIcon className="w-3 h-3 mr-1" />
                {story.perspective}
              </Badge>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">{story.content}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span>By {story.author}</span>
              <CulturalIcon className="w-3 h-3" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getImpactColor(story.metadata.impactLevel)}>
                {story.metadata.impactLevel} impact
              </Badge>
              <span>{story.metadata.viewCount} views</span>
            </div>
          </div>
          
          {story.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {story.themes.slice(0, 3).map((theme, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {theme}
                </Badge>
              ))}
              {story.themes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{story.themes.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderNetworkView = () => {
    const filteredStories = getFilteredStories();
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Story Network</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {filteredStories.length} stories
            </Badge>
            <Badge variant="outline">
              {exploration?.connections.length || 0} connections
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map(renderStoryCard)}
        </div>
        
        {filteredStories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Network className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No stories match the current filters</p>
            <Button variant="outline" onClick={clearFilters} className="mt-2">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderPerspectiveView = () => {
    if (!exploration) return null;
    
    const perspectives = Object.entries(exploration.perspectives);
    
    return (
      <div className="space-y-6">
        {perspectives.map(([perspective, stories]) => {
          const PerspectiveIcon = getPerspectiveIcon(perspective);
          const filteredStories = stories.filter(story => 
            getFilteredStories().some(filtered => filtered.id === story.id)
          );
          
          if (filteredStories.length === 0) return null;
          
          return (
            <Card key={perspective}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PerspectiveIcon className="w-5 h-5 mr-2" />
                  {perspective.charAt(0).toUpperCase() + perspective.slice(1)} Perspective
                  <Badge variant="outline" className="ml-2">
                    {filteredStories.length} stories
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStories.map(renderStoryCard)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderPathwayView = () => {
    if (!exploration) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Outcome Pathways</h3>
          <Badge variant="outline">
            {exploration.pathways.length} pathways
          </Badge>
        </div>
        
        <div className="space-y-4">
          {exploration.pathways.map((pathway) => (
            <Card 
              key={pathway.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPathway?.id === pathway.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => {
                setSelectedPathway(pathway);
                trackEngagement('pathway_selected', { pathwayId: pathway.id });
              }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{pathway.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{pathway.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{pathway.pathwaySteps.length} steps</span>
                      <span>•</span>
                      <span>{pathway.outcomes.length} outcomes</span>
                      <span>•</span>
                      <span>{pathway.stakeholders.length} stakeholders</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {pathway.impactMetrics.reach}
                      </div>
                      <div className="text-xs text-gray-500">Reach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {pathway.impactMetrics.depth}
                      </div>
                      <div className="text-xs text-gray-500">Depth</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {pathway.stakeholders.slice(0, 3).map((stakeholder, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {stakeholder}
                      </Badge>
                    ))}
                    {pathway.stakeholders.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{pathway.stakeholders.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Explore Pathway
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {exploration.pathways.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No outcome pathways identified yet</p>
            <p className="text-sm">Pathways are generated from connected stories</p>
          </div>
        )}
      </div>
    );
  };

  const renderTimelineView = () => {
    if (!exploration) return null;
    
    const events = exploration.timeline.events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Story Timeline</h3>
          <Badge variant="outline">
            {events.length} events
          </Badge>
        </div>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className="relative z-10 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <Badge className={getImpactColor(event.impact)}>
                        {event.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Timeline className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No timeline events available</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading story exploration...</p>
        </div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Stories Available
        </h3>
        <p className="text-gray-600">
          There are no stories available for exploration in this community yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
            {exploration.title}
          </h2>
          <p className="text-gray-600 mt-1">{exploration.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>{exploration.storyNodes.length} stories</span>
            <span>•</span>
            <span>{exploration.connections.length} connections</span>
            <span>•</span>
            <span>{exploration.pathways.length} pathways</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={narrativeMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setNarrativeMode(!narrativeMode);
              trackEngagement('narrative_mode_toggled', { enabled: !narrativeMode });
            }}
          >
            {narrativeMode ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {narrativeMode ? 'Exit Narrative' : 'Narrative Mode'}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h4>
            {Object.keys(activeFilters).length > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Perspective Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perspective
              </label>
              <div className="space-y-1">
                {['individual', 'family', 'community', 'organizational', 'systemic'].map(perspective => (
                  <label key={perspective} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.perspective?.includes(perspective) || false}
                      onChange={() => applyFilter('perspective', perspective)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm capitalize">{perspective}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Theme Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Themes
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...new Set(exploration.storyNodes.flatMap(s => s.themes))].slice(0, 8).map(theme => (
                  <label key={theme} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.theme?.includes(theme) || false}
                      onChange={() => applyFilter('theme', theme)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm">{theme}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Impact Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impact Level
              </label>
              <div className="space-y-1">
                {['high', 'medium', 'low'].map(impact => (
                  <label key={impact} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.impact?.includes(impact) || false}
                      onChange={() => applyFilter('impact', impact)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm capitalize">{impact}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Cultural Safety Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Safety
              </label>
              <div className="space-y-1">
                {['public', 'community', 'restricted', 'sacred'].map(safety => (
                  <label key={safety} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.cultural_safety?.includes(safety) || false}
                      onChange={() => applyFilter('cultural_safety', safety)}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm capitalize">{safety}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="network">
            <Network className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="perspectives">
            <Users className="w-4 h-4 mr-2" />
            Perspectives
          </TabsTrigger>
          <TabsTrigger value="pathways">
            <Target className="w-4 h-4 mr-2" />
            Pathways
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Timeline className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-6">
          {renderNetworkView()}
        </TabsContent>

        <TabsContent value="perspectives" className="space-y-6">
          {renderPerspectiveView()}
        </TabsContent>

        <TabsContent value="pathways" className="space-y-6">
          {renderPathwayView()}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {renderTimelineView()}
        </TabsContent>
      </Tabs>

      {/* Selected Story Detail */}
      {selectedStory && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                {selectedStory.title}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStory(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>By {selectedStory.author}</span>
                <Badge className={getPerspectiveColor(selectedStory.perspective)}>
                  {selectedStory.perspective}
                </Badge>
                <Badge className={getImpactColor(selectedStory.metadata.impactLevel)}>
                  {selectedStory.metadata.impactLevel} impact
                </Badge>
              </div>
              
              <p className="text-gray-700">{selectedStory.content}</p>
              
              {selectedStory.themes.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Themes</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedStory.themes.map((theme, index) => (
                      <Badge key={index} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View Full Story
                </Button>
                <Button variant="outline" size="sm">
                  <Network className="w-4 h-4 mr-1" />
                  Find Related
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share Story
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}