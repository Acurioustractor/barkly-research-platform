'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, Users, Heart, Calendar, AlertCircle, Home, BookOpen, 
  Activity, Shield, Target, TrendingUp, TrendingDown, Zap, RefreshCw,
  Eye, EyeOff, Filter, BarChart3, Map as MapIcon
} from 'lucide-react';

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });

// Barkly region center coordinates
const BARKLY_CENTER: [number, number] = [-19.6530, 134.1805];

interface CommunityData {
  id: string;
  name: string;
  coordinates: [number, number];
  healthScore: number;
  status: 'thriving' | 'developing' | 'struggling' | 'improving';
  indicators: {
    youthEngagement: number;
    serviceAccess: number;
    culturalConnection: number;
    economicOpportunity: number;
    safetyWellbeing: number;
  };
  metrics?: {
    totalDocuments: number;
    recentDocuments: number;
    analysisCompleteness: number;
    dataFreshness: number;
    communityEngagement: number;
  };
  insights?: {
    topNeeds: Array<{ need: string; urgency: string; count: number }>;
    keyAssets: Array<{ asset: string; type: string; strength: number }>;
    criticalGaps: Array<{ service: string; impact: number; location: string }>;
    opportunities: Array<{ opportunity: string; potential: number; timeline: string }>;
  };
  trends?: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number;
    confidence: number;
  };
  lastUpdated: Date;
}

interface ServicePoint {
  id: string;
  name: string;
  type: 'education' | 'health' | 'recreation' | 'employment' | 'cultural' | 'support';
  coordinates: [number, number];
  communityId: string;
  status: 'active' | 'limited' | 'closed';
  effectiveness?: number;
  youthServed?: number;
  capacity?: number;
  description?: string;
}

interface StoryMarker {
  id: string;
  title: string;
  coordinates: [number, number];
  communityId: string;
  type: 'success' | 'challenge' | 'opportunity' | 'voice';
  impact: 'high' | 'medium' | 'low';
  date: Date;
  summary: string;
  culturalSensitivity: 'public' | 'community' | 'restricted';
}

interface MapLayer {
  id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  icon: React.ReactNode;
}

const DEFAULT_LAYERS: MapLayer[] = [
  {
    id: 'community-health',
    name: 'Community Health',
    description: 'Real-time health indicators',
    color: '#3B82F6',
    active: true,
    icon: <Heart className="w-4 h-4" />
  },
  {
    id: 'service-points',
    name: 'Service Points',
    description: 'Available services and programs',
    color: '#10B981',
    active: true,
    icon: <MapPin className="w-4 h-4" />
  },
  {
    id: 'story-markers',
    name: 'Community Stories',
    description: 'Voices and experiences',
    color: '#F59E0B',
    active: false,
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 'need-intensity',
    name: 'Need Intensity',
    description: 'Areas requiring attention',
    color: '#EF4444',
    active: false,
    icon: <AlertCircle className="w-4 h-4" />
  },
  {
    id: 'opportunities',
    name: 'Opportunities',
    description: 'Growth and development potential',
    color: '#8B5CF6',
    active: false,
    icon: <Target className="w-4 h-4" />
  },
  {
    id: 'cultural-sites',
    name: 'Cultural Sites',
    description: 'Important cultural locations',
    color: '#F97316',
    active: false,
    icon: <BookOpen className="w-4 h-4" />
  }
];

interface CommunityIntelligenceMapProps {
  onCommunitySelect?: (community: CommunityData) => void;
  onServiceSelect?: (service: ServicePoint) => void;
  onStorySelect?: (story: StoryMarker) => void;
  className?: string;
}

export default function CommunityIntelligenceMap({
  onCommunitySelect,
  onServiceSelect,
  onStorySelect,
  className = ''
}: CommunityIntelligenceMapProps) {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [storyMarkers, setStoryMarkers] = useState<StoryMarker[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityData | null>(null);
  const [selectedService, setSelectedService] = useState<ServicePoint | null>(null);
  const [activeLayers, setActiveLayers] = useState<MapLayer[]>(DEFAULT_LAYERS);
  const [mapView, setMapView] = useState<'overview' | 'detailed' | 'intelligence'>('intelligence');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    setIsMapLoaded(true);
    loadMapData();
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      
      // Load all map data from the API
      const mapResponse = await fetch('/api/intelligence/map-data?type=all');
      if (mapResponse.ok) {
        const mapData = await mapResponse.json();
        
        if (mapData.success) {
          setCommunities(mapData.data.communities || []);
          setServicePoints(mapData.data.services || []);
          setStoryMarkers(mapData.data.stories || []);
        }
      } else {
        // Fallback to individual API calls if combined endpoint fails
        await loadMapDataFallback();
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading map data:', error);
      // Try fallback approach
      await loadMapDataFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadMapDataFallback = async () => {
    try {
      // Load community health data
      const healthResponse = await fetch('/api/intelligence/community-health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const communitiesWithCoords = (healthData.communities || []).map((community: any, index: number) => ({
          ...community,
          coordinates: getCommunityCoordinates(community.communityId, index)
        }));
        setCommunities(communitiesWithCoords);
      }

      // Load service points
      const servicesResponse = await fetch('/api/intelligence/map-data?type=services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServicePoints(servicesData.data?.services || []);
      }
      
      // Load story markers
      const storiesResponse = await fetch('/api/intelligence/map-data?type=stories');
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        setStoryMarkers(storiesData.data?.stories || []);
      }
    } catch (error) {
      console.error('Error in fallback data loading:', error);
      // Use mock data as last resort
      setServicePoints(generateMockServicePoints());
      setStoryMarkers(generateMockStoryMarkers());
    }
  };

  // Generate coordinates for communities (would come from database in production)
  const getCommunityCoordinates = (communityId: string, index: number): [number, number] => {
    // Mock coordinates around Barkly region
    const baseCoords: [number, number][] = [
      [-19.6530, 134.1805], // Tennant Creek
      [-19.7000, 134.2000], // South area
      [-19.6000, 134.1500], // North area
      [-19.6500, 134.2500], // East area
      [-19.7500, 134.1000], // West area
    ];
    return baseCoords[index % baseCoords.length];
  };

  const generateMockServicePoints = (): ServicePoint[] => [
    {
      id: 'tc-youth-center',
      name: 'Tennant Creek Youth Centre',
      type: 'recreation',
      coordinates: [-19.6490, 134.1890],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 85,
      youthServed: 120,
      capacity: 150,
      description: 'Drop-in centre with recreational facilities and programs'
    },
    {
      id: 'barkly-health',
      name: 'Barkly Regional Health Service',
      type: 'health',
      coordinates: [-19.6520, 134.1850],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 78,
      youthServed: 200,
      description: 'Primary health care including youth mental health services'
    },
    {
      id: 'tc-high-school',
      name: 'Tennant Creek High School',
      type: 'education',
      coordinates: [-19.6480, 134.1870],
      communityId: 'tennant-creek',
      status: 'active',
      effectiveness: 82,
      youthServed: 450,
      description: 'Secondary education with VET programs'
    }
  ];

  const generateMockStoryMarkers = (): StoryMarker[] => [
    {
      id: 'basketball-success',
      title: 'Basketball Program Success',
      coordinates: [-19.6520, 134.1880],
      communityId: 'tennant-creek',
      type: 'success',
      impact: 'high',
      date: new Date('2024-01-15'),
      summary: '90% retention rate in youth basketball mentorship program',
      culturalSensitivity: 'public'
    },
    {
      id: 'transport-challenge',
      title: 'Transport Barriers',
      coordinates: [-19.6600, 134.1750],
      communityId: 'south-residential',
      type: 'challenge',
      impact: 'medium',
      date: new Date('2024-01-10'),
      summary: 'Youth struggling to access town center services due to transport',
      culturalSensitivity: 'community'
    }
  ];

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, active: !layer.active }
          : layer
      )
    );
  };

  const getHealthStatusColor = (status: string) => {
    const colors = {
      'thriving': '#10B981',
      'developing': '#3B82F6',
      'improving': '#F59E0B',
      'struggling': '#EF4444'
    };
    return colors[status as keyof typeof colors] || colors['developing'];
  };

  const getHealthStatusOpacity = (healthScore: number) => {
    return Math.max(0.3, healthScore / 100);
  };

  const getServiceStatusColor = (status: string) => {
    const colors = {
      'active': '#10B981',
      'limited': '#F59E0B',
      'closed': '#EF4444'
    };
    return colors[status as keyof typeof colors] || colors['active'];
  };

  const getStoryTypeColor = (type: string) => {
    const colors = {
      'success': '#10B981',
      'challenge': '#EF4444',
      'opportunity': '#8B5CF6',
      'voice': '#3B82F6'
    };
    return colors[type as keyof typeof colors] || colors['voice'];
  };

  const handleCommunityClick = (community: CommunityData) => {
    setSelectedCommunity(community);
    onCommunitySelect?.(community);
  };

  const handleServiceClick = (service: ServicePoint) => {
    setSelectedService(service);
    onServiceSelect?.(service);
  };

  const refreshData = () => {
    loadMapData();
  };

  const isLayerActive = (layerId: string) => {
    return activeLayers.find(l => l.id === layerId)?.active || false;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Map Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-500" />
            Barkly Community Intelligence Map
          </h2>
          <p className="text-sm text-gray-600">
            Real-time community health, services, and stories • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant={mapView === 'overview' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMapView('overview')}
            >
              Overview
            </Button>
            <Button
              variant={mapView === 'intelligence' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMapView('intelligence')}
            >
              Intelligence
            </Button>
            <Button
              variant={mapView === 'detailed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMapView('detailed')}
            >
              Detailed
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Layer Controls Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Map Layers
            </h3>
            
            <div className="space-y-3">
              {activeLayers.map(layer => (
                <div key={layer.id} className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className="mt-1 p-1 rounded hover:bg-gray-100"
                  >
                    {layer.active ? (
                      <Eye className="w-4 h-4 text-blue-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      {layer.icon}
                      <span className="font-medium text-sm">{layer.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{layer.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Community Health Summary */}
            {communities.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Community Health
                </h3>
                <div className="space-y-2">
                  {communities.map(community => (
                    <Card 
                      key={community.id}
                      className={`cursor-pointer transition-all ${
                        selectedCommunity?.id === community.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleCommunityClick(community)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{community.name}</h4>
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getHealthStatusColor(community.status) }}
                            />
                            <span className="text-xs">{community.healthScore}/100</span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${community.healthScore}%`,
                              backgroundColor: getHealthStatusColor(community.status)
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${getHealthStatusColor(community.status)}20`,
                              color: getHealthStatusColor(community.status)
                            }}
                          >
                            {community.status}
                          </Badge>
                          
                          {community.trends && (
                            <div className="flex items-center gap-1">
                              {community.trends.direction === 'improving' ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : community.trends.direction === 'declining' ? (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              ) : (
                                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                              )}
                              <span className="text-xs text-gray-500">
                                {community.trends.direction}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Community Details */}
            {selectedCommunity && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Community Analysis</h3>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{selectedCommunity.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Health Score: {selectedCommunity.healthScore}/100
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Health Indicators */}
                    <div>
                      <h5 className="text-xs font-medium mb-2">Health Indicators</h5>
                      <div className="space-y-1">
                        {Object.entries(selectedCommunity.indicators).map(([key, value]) => {
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs">{label}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1">
                                  <div 
                                    className="h-1 rounded-full"
                                    style={{ 
                                      width: `${value}%`,
                                      backgroundColor: value >= 70 ? '#10B981' : value >= 50 ? '#3B82F6' : '#EF4444'
                                    }}
                                  />
                                </div>
                                <span className="text-xs w-6">{value}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Needs */}
                    {selectedCommunity.insights?.topNeeds && selectedCommunity.insights.topNeeds.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-red-600 mb-1">🚨 Top Needs</h5>
                        <ul className="text-xs space-y-1">
                          {selectedCommunity.insights.topNeeds.slice(0, 3).map((need, i) => (
                            <li key={i} className="text-gray-600 flex justify-between">
                              <span>• {need.need}</span>
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{
                                  backgroundColor: need.urgency === 'critical' ? '#FEE2E2' : 
                                                 need.urgency === 'high' ? '#FEF3C7' : '#F3F4F6',
                                  color: need.urgency === 'critical' ? '#DC2626' : 
                                         need.urgency === 'high' ? '#D97706' : '#6B7280'
                                }}
                              >
                                {need.urgency}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Assets */}
                    {selectedCommunity.insights?.keyAssets && selectedCommunity.insights.keyAssets.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-green-600 mb-1">💪 Key Assets</h5>
                        <ul className="text-xs space-y-1">
                          {selectedCommunity.insights.keyAssets.slice(0, 3).map((asset, i) => (
                            <li key={i} className="text-gray-600 flex justify-between">
                              <span>• {asset.asset}</span>
                              <span className="text-xs font-medium">{asset.strength}/10</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isMapLoaded ? (
            <MapContainer
              center={BARKLY_CENTER}
              zoom={12}
              className="h-full w-full"
              {...({} as any)}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap | Barkly Community Intelligence'
                {...({} as any)}
              />
              
              {/* Community Health Markers */}
              {isLayerActive('community-health') && communities.map((community) => (
                <CircleMarker
                  key={community.id}
                  center={community.coordinates}
                  radius={Math.max(10, community.healthScore * 0.3)}
                  fillColor={getHealthStatusColor(community.status)}
                  fillOpacity={getHealthStatusOpacity(community.healthScore)}
                  color={getHealthStatusColor(community.status)}
                  weight={selectedCommunity?.id === community.id ? 3 : 1}
                  eventHandlers={{
                    click: () => handleCommunityClick(community)
                  }}
                  {...({} as any)}
                >
                  <Tooltip direction="top" offset={[0, -10]} {...({} as any)}>
                    <div className="text-sm">
                      <div className="font-semibold">{community.name}</div>
                      <div className="text-xs">Health Score: {community.healthScore}/100</div>
                      <div className="text-xs">Status: {community.status}</div>
                      {community.trends && (
                        <div className="text-xs">
                          Trend: {community.trends.direction} ({community.trends.velocity.toFixed(1)})
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}

              {/* Service Points */}
              {isLayerActive('service-points') && servicePoints.map((service) => (
                <CircleMarker
                  key={service.id}
                  center={service.coordinates}
                  radius={6}
                  fillColor={getServiceStatusColor(service.status)}
                  fillOpacity={0.9}
                  color="white"
                  weight={2}
                  eventHandlers={{
                    click: () => handleServiceClick(service)
                  }}
                  {...({} as any)}
                >
                  <Tooltip direction="top" offset={[0, -10]} {...({} as any)}>
                    <div className="text-sm">
                      <div className="font-semibold">{service.name}</div>
                      <div className="text-xs capitalize">{service.type} • {service.status}</div>
                      {service.youthServed && (
                        <div className="text-xs">{service.youthServed} youth served</div>
                      )}
                      {service.effectiveness && (
                        <div className="text-xs">Effectiveness: {service.effectiveness}%</div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}

              {/* Story Markers */}
              {isLayerActive('story-markers') && storyMarkers.map((story) => (
                <CircleMarker
                  key={story.id}
                  center={story.coordinates}
                  radius={4}
                  fillColor={getStoryTypeColor(story.type)}
                  fillOpacity={0.8}
                  color="white"
                  weight={1}
                  eventHandlers={{
                    click: () => onStorySelect?.(story)
                  }}
                  {...({} as any)}
                >
                  <Tooltip direction="top" offset={[0, -10]} {...({} as any)}>
                    <div className="text-sm">
                      <div className="font-semibold">{story.title}</div>
                      <div className="text-xs capitalize">{story.type} • {story.impact} impact</div>
                      <div className="text-xs">{story.summary}</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading community intelligence map...</p>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <Card className="absolute bottom-4 left-4 z-[1000]">
            <CardContent className="p-3">
              <h4 className="font-semibold text-sm mb-2">Community Health Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Thriving (80-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Developing (60-79)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Improving (40-59)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Struggling (0-39)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Intelligence Summary */}
          <Card className="absolute top-4 right-4 z-[1000] w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Live Community Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {communities.length}
                  </div>
                  <div className="text-xs text-gray-600">Communities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {servicePoints.length}
                  </div>
                  <div className="text-xs text-gray-600">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {communities.filter(c => c.status === 'struggling').length}
                  </div>
                  <div className="text-xs text-gray-600">Need Attention</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {communities.reduce((sum, c) => sum + (c.insights?.opportunities?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-gray-600">Opportunities</div>
                </div>
              </div>
              
              {communities.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-600 mb-1">Average Health Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ 
                          width: `${communities.reduce((sum, c) => sum + c.healthScore, 0) / communities.length}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(communities.reduce((sum, c) => sum + c.healthScore, 0) / communities.length)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}