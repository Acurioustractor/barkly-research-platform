'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, MapPin, Users, Heart, Calendar, AlertCircle, Home, BookOpen, 
  Activity, Shield, Target, TrendingUp, TrendingDown, Zap 
} from 'lucide-react';

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });

// Tennant Creek coordinates
const TENNANT_CREEK_CENTER: [number, number] = [-19.6530, 134.1805];

// Enhanced district data with intelligence
const DISTRICTS = [
  {
    id: 'town-center',
    name: 'Town Center',
    coordinates: [
      [-19.6450, 134.1800],
      [-19.6450, 134.1900],
      [-19.6500, 134.1900],
      [-19.6500, 134.1800]
    ] as [number, number][],
    youthPopulation: 156,
    serviceCount: 8,
    needIntensity: 'medium',
    status: 'well-served',
    healthScore: 78,
    trends: {
      serviceAccess: 'stable',
      youthEngagement: 'improving',
      communityConnection: 'strong'
    },
    keyNeeds: ['After-hours programs', 'Youth employment'],
    keyAssets: ['Multiple services', 'Good transport', 'Community hub'],
    recentChanges: ['New youth center programs', 'Increased funding'],
    opportunities: ['Hub expansion potential', 'Service coordination']
  },
  {
    id: 'north-residential',
    name: 'North Residential',
    coordinates: [
      [-19.6400, 134.1750],
      [-19.6400, 134.1950],
      [-19.6450, 134.1950],
      [-19.6450, 134.1750]
    ] as [number, number][],
    youthPopulation: 234,
    serviceCount: 2,
    needIntensity: 'high',
    status: 'underserved',
    healthScore: 45,
    trends: {
      serviceAccess: 'declining',
      youthEngagement: 'concerning',
      communityConnection: 'weak'
    },
    keyNeeds: ['Local youth programs', 'Transport to services', 'Safe spaces'],
    keyAssets: ['High youth population', 'Community willingness'],
    recentChanges: ['Service closure', 'Increased need reports'],
    opportunities: ['Mobile services', 'Community space available']
  },
  {
    id: 'south-residential',
    name: 'South Residential',
    coordinates: [
      [-19.6500, 134.1750],
      [-19.6500, 134.1950],
      [-19.6600, 134.1950],
      [-19.6600, 134.1750]
    ] as [number, number][],
    youthPopulation: 189,
    serviceCount: 5,
    needIntensity: 'medium',
    status: 'developing',
    healthScore: 62,
    trends: {
      serviceAccess: 'improving',
      youthEngagement: 'stable',
      communityConnection: 'moderate'
    },
    keyNeeds: ['Mental health services', 'Recreation facilities'],
    keyAssets: ['Sports programs', 'Active families'],
    recentChanges: ['New basketball program', 'Improved transport'],
    opportunities: ['Program expansion', 'Peer mentoring']
  },
  {
    id: 'east-area',
    name: 'East Area',
    coordinates: [
      [-19.6450, 134.1900],
      [-19.6450, 134.2000],
      [-19.6550, 134.2000],
      [-19.6550, 134.1900]
    ] as [number, number][],
    youthPopulation: 268,
    serviceCount: 1,
    needIntensity: 'critical',
    status: 'service-desert',
    healthScore: 28,
    trends: {
      serviceAccess: 'critical',
      youthEngagement: 'declining',
      communityConnection: 'fragmented'
    },
    keyNeeds: ['Any youth services', 'Employment programs', 'Crisis support'],
    keyAssets: ['Large youth population', 'Potential service site'],
    recentChanges: ['Funding opportunity identified', 'Community consultation'],
    opportunities: ['New service hub', 'Employment program funding']
  }
];

// Enhanced service data with intelligence
const ENHANCED_SERVICES = [
  {
    id: 1,
    name: "Tennant Creek Youth Centre",
    provider: "Barkly Regional Council",
    type: "Youth Hub",
    lat: -19.6490,
    lng: 134.1890,
    status: "active",
    coverage: "partial",
    effectiveness: 85,
    youthServed: 120,
    capacity: 150,
    waitingList: 15,
    description: "Drop-in centre with recreational facilities, ninja warrior obstacle course, music and art workshops, cultural events",
    operatingHours: "After school and nighttime activities",
    targetPop: "Young people ages 8-24, including disengaged youth",
    gaps: ["Limited late night hours", "Need more structured programs"],
    recentWins: ["New equipment installed", "Increased attendance"],
    expansion: {
      ready: true,
      funding: "$150,000 available",
      timeline: "6 months"
    },
    intelligence: {
      demandTrend: "increasing",
      satisfactionScore: 4.2,
      keySuccessFactors: ["Cultural programs", "Peer mentoring", "Flexible approach"]
    }
  },
  {
    id: 2,
    name: "Night Patrol (Julalikari)",
    provider: "Barkly Regional Council & Julalikari",
    type: "Safety/Outreach",
    lat: -19.6550,
    lng: 134.1820,
    status: "struggling",
    coverage: "low",
    effectiveness: 65,
    youthServed: 200,
    capacity: 300,
    waitingList: 0,
    description: "Indigenous Night Patrol officers engage with at-risk people, especially youth, to defuse situations and provide safe transport",
    operatingHours: "Night hours",
    targetPop: "At-risk youth and intoxicated persons",
    gaps: ["Funding uncertainty", "Limited coverage areas", "Staff shortages"],
    recentWins: ["Community support", "Reduced incidents"],
    expansion: {
      ready: false,
      funding: "Seeking $200,000",
      timeline: "12 months"
    },
    intelligence: {
      demandTrend: "critical",
      satisfactionScore: 3.8,
      keySuccessFactors: ["Community trust", "Cultural approach", "Local knowledge"]
    }
  }
  // Add more enhanced services as needed
];

// Intelligence layers configuration
const INTELLIGENCE_LAYERS = [
  {
    id: 'youth-population',
    name: 'Youth Population Density',
    description: 'Where young people live',
    color: '#3B82F6',
    active: true
  },
  {
    id: 'service-coverage',
    name: 'Service Coverage',
    description: 'Service availability heat map',
    color: '#10B981',
    active: true
  },
  {
    id: 'need-intensity',
    name: 'Need Intensity',
    description: 'Areas requiring urgent attention',
    color: '#EF4444',
    active: true
  },
  {
    id: 'success-stories',
    name: 'Success Hotspots',
    description: 'Where programs are working well',
    color: '#F59E0B',
    active: false
  },
  {
    id: 'opportunities',
    name: 'Opportunity Zones',
    description: 'Areas ready for new programs',
    color: '#8B5CF6',
    active: false
  },
  {
    id: 'transport-routes',
    name: 'Transport Access',
    description: 'How youth move around town',
    color: '#06B6D4',
    active: false
  }
];

interface EnhancedTennantCreekMapProps {
  onDistrictSelect?: (district: any) => void;
  onServiceSelect?: (service: any) => void;
}

export default function EnhancedTennantCreekMap({ 
  onDistrictSelect, 
  onServiceSelect 
}: EnhancedTennantCreekMapProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeLayers, setActiveLayers] = useState(INTELLIGENCE_LAYERS);
  const [mapView, setMapView] = useState<'overview' | 'detailed' | 'intelligence'>('intelligence');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    setIsMapLoaded(true);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, active: !layer.active }
          : layer
      )
    );
  };

  const getDistrictColor = (district: any) => {
    const colors = {
      'well-served': '#10B981',
      'developing': '#F59E0B', 
      'underserved': '#EF4444',
      'service-desert': '#DC2626'
    };
    return colors[district.status as keyof typeof colors] || colors['developing'];
  };

  const getDistrictOpacity = (district: any) => {
    if (district.needIntensity === 'critical') return 0.7;
    if (district.needIntensity === 'high') return 0.5;
    if (district.needIntensity === 'medium') return 0.3;
    return 0.2;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (trend === 'declining' || trend === 'concerning' || trend === 'critical') return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
  };

  const handleDistrictClick = (district: any) => {
    setSelectedDistrict(district);
    onDistrictSelect?.(district);
  };

  const handleServiceClick = (service: any) => {
    setSelectedService(service);
    onServiceSelect?.(service);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Map Controls Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tennant Creek Youth Intelligence Map</h2>
          <p className="text-sm text-gray-600">Real-time community intelligence and service mapping</p>
        </div>
        
        <div className="flex gap-2">
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

      <div className="flex-1 flex">
        {/* Layer Controls Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Intelligence Layers</h3>
            
            <div className="space-y-3">
              {activeLayers.map(layer => (
                <div key={layer.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={layer.id}
                    checked={layer.active}
                    onChange={() => toggleLayer(layer.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      <label htmlFor={layer.id} className="font-medium text-sm">
                        {layer.name}
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{layer.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* District Intelligence Summary */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">District Intelligence</h3>
              <div className="space-y-2">
                {DISTRICTS.map(district => (
                  <Card 
                    key={district.id}
                    className={`cursor-pointer transition-all ${
                      selectedDistrict?.id === district.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleDistrictClick(district)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{district.name}</h4>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getDistrictColor(district) }}
                          />
                          <span className="text-xs">{district.healthScore}/100</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Youth:</span> {district.youthPopulation}
                        </div>
                        <div>
                          <span className="text-gray-600">Services:</span> {district.serviceCount}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600">Trends:</span>
                        {getTrendIcon(district.trends.serviceAccess)}
                        {getTrendIcon(district.trends.youthEngagement)}
                        {getTrendIcon(district.trends.communityConnection)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Selected District Details */}
            {selectedDistrict && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">District Analysis</h3>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{selectedDistrict.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Health Score: {selectedDistrict.healthScore}/100
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="text-xs font-medium text-red-600 mb-1">🚨 Key Needs</h5>
                      <ul className="text-xs space-y-1">
                        {selectedDistrict.keyNeeds.map((need: string, i: number) => (
                          <li key={i} className="text-gray-600">• {need}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-green-600 mb-1">💪 Key Assets</h5>
                      <ul className="text-xs space-y-1">
                        {selectedDistrict.keyAssets.map((asset: string, i: number) => (
                          <li key={i} className="text-gray-600">• {asset}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-blue-600 mb-1">💡 Opportunities</h5>
                      <ul className="text-xs space-y-1">
                        {selectedDistrict.opportunities.map((opp: string, i: number) => (
                          <li key={i} className="text-gray-600">• {opp}</li>
                        ))}
                      </ul>
                    </div>
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
              center={TENNANT_CREEK_CENTER}
              zoom={14}
              className="h-full w-full"
              {...({} as any)}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap | Barkly Youth Intelligence'
                {...({} as any)}
              />
              
              {/* District Polygons */}
              {activeLayers.find(l => l.id === 'youth-population')?.active && 
                DISTRICTS.map((district) => (
                  <Polygon
                    key={district.id}
                    positions={district.coordinates}
                    fillColor={getDistrictColor(district)}
                    fillOpacity={getDistrictOpacity(district)}
                    color={getDistrictColor(district)}
                    weight={selectedDistrict?.id === district.id ? 3 : 1}
                    eventHandlers={{
                      click: () => handleDistrictClick(district)
                    }}
                    {...({} as any)}
                  >
                    <Tooltip direction="center" permanent={mapView === 'intelligence'} {...({} as any)}>
                      <div className="text-center">
                        <div className="font-semibold text-xs">{district.name}</div>
                        <div className="text-xs">{district.youthPopulation} youth</div>
                        <div className="text-xs">Score: {district.healthScore}/100</div>
                      </div>
                    </Tooltip>
                  </Polygon>
                ))
              }

              {/* Service Markers */}
              {activeLayers.find(l => l.id === 'service-coverage')?.active &&
                ENHANCED_SERVICES.map((service) => (
                  <React.Fragment key={service.id}>
                    {/* Service coverage circle */}
                    <CircleMarker
                      center={[service.lat, service.lng]}
                      radius={service.effectiveness * 0.5}
                      fillColor="#10B981"
                      fillOpacity={0.1}
                      stroke={false}
                      {...({} as any)}
                    />
                    
                    {/* Service marker */}
                    <CircleMarker
                      center={[service.lat, service.lng]}
                      radius={8}
                      fillColor={service.status === 'struggling' ? '#EF4444' : '#10B981'}
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
                          <div className="text-xs">{service.youthServed} youth served</div>
                          <div className="text-xs">Effectiveness: {service.effectiveness}%</div>
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  </React.Fragment>
                ))
              }
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading intelligence map...</p>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <Card className="absolute bottom-4 left-4 z-[1000]">
            <CardContent className="p-3">
              <h4 className="font-semibold text-sm mb-2">District Health</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Well Served (70-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Developing (50-69)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Underserved (30-49)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span>Service Desert (0-29)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intelligence Summary */}
          <Card className="absolute top-4 right-4 z-[1000] w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Live Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {DISTRICTS.reduce((sum, d) => sum + d.youthPopulation, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Youth</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {DISTRICTS.reduce((sum, d) => sum + d.serviceCount, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Active Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {DISTRICTS.filter(d => d.needIntensity === 'critical').length}
                  </div>
                  <div className="text-xs text-gray-600">Critical Areas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {DISTRICTS.filter(d => d.opportunities.length > 0).length}
                  </div>
                  <div className="text-xs text-gray-600">Opportunities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}