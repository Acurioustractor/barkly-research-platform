'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/core/Card';
import { Badge } from '@/components/core/Badge';
import { Button } from '@/components/core/Button';


// Dynamically import Leaflet components with better SSR handling
const LeafletMap = dynamic(() => import('./LeafletMapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
});

interface ServiceLocation {
  id: string;
  name: string;
  type: 'available' | 'gap' | 'planned';
  category: string;
  coordinates: [number, number];
  description: string;
  contact?: string;
  hours?: string;
  priority?: number;
  status: string;
  lastUpdated: string;
  address?: string;
  website?: string;
  services?: string[];
  eligibility?: string;
  cost?: string;
  accessibility?: string;
  culturalSafety?: string;
  language?: string[];
  referralRequired?: boolean;
  documentSource?: string;
  estimatedCost?: string;
  potentialFunding?: string;
  timeline?: string;
  funding?: string;
}

export default function TennantCreekServicesMap() {
  const [services, setServices] = useState<ServiceLocation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceLocation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tennant Creek coordinates
  const tennantCreekCenter: [number, number] = [-19.6544, 134.1870];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Small delay to ensure proper hydration
    const timer = setTimeout(() => {
    
    // Load service data from processed documents
    const loadServicesData = async () => {
      try {
        console.log('[ServicesMap] Fetching real services data from API...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/api/services/map-data', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(`[ServicesMap] Loaded ${data.services.length} services from processed documents`);
            setServices(data.services);
            setIsLoaded(true);
            return;
          }
        }
        console.warn('[ServicesMap] API failed, falling back to mock data');
      } catch (error) {
        console.error('[ServicesMap] Failed to fetch services:', error);
        console.warn('[ServicesMap] Using fallback mock data');
      }

      // Fallback to mock data if API fails
      const servicesData: ServiceLocation[] = [
        // Available Services (Green markers)
        {
          id: 'tc-hospital',
          name: 'Tennant Creek Hospital',
          type: 'available',
          category: 'healthcare',
          coordinates: [-19.6500, 134.1850],
          description: 'Main hospital providing emergency and general medical services including emergency department, maternity services, and general medicine.',
          contact: '(08) 8962 4399',
          hours: '24/7 Emergency Department, Mon-Fri 8am-5pm General Services',
          address: 'Schmidt Street, Tennant Creek NT 0860',
          status: 'Operating',
          services: ['Emergency Medicine', 'General Medicine', 'Maternity', 'Outpatient Services', 'Mental Health Support'],
          accessibility: 'Wheelchair accessible, hearing loop available',
          culturalSafety: 'Aboriginal Health Workers on staff, cultural protocols respected',
          language: ['English', 'Warumungu', 'Interpreter services available'],
          cost: 'Medicare bulk billing, emergency treatment always provided',
          referralRequired: false,
          documentSource: 'Hospital Services Directory 2024',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'youth-centre',
          name: 'Youth Drop-in Centre',
          type: 'available',
          category: 'youth',
          coordinates: [-19.6580, 134.1890],
          description: 'Safe space for young people aged 12-25 providing recreational activities, peer support, and life skills development.',
          contact: '(08) 8962 1234',
          hours: 'Mon-Fri 9am-5pm, Sat 10am-3pm',
          address: 'Davidson Street, Tennant Creek NT 0860',
          status: 'Operating',
          services: ['Drop-in Space', 'Recreational Activities', 'Peer Support', 'Life Skills Programs', 'Homework Support', 'Cultural Activities'],
          eligibility: 'Young people aged 12-25, no referral needed',
          accessibility: 'Fully accessible, safe transport available',
          culturalSafety: 'Indigenous youth workers, culturally appropriate programs',
          language: ['English', 'Warumungu', 'Warlpiri'],
          cost: 'Free of charge',
          referralRequired: false,
          documentSource: 'Youth Roundtable Minutes March 2024',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'centrelink',
          name: 'Centrelink Office',
          type: 'available',
          category: 'government',
          coordinates: [-19.6520, 134.1880],
          description: 'Government services and payment support',
          contact: '132 850',
          hours: 'Mon-Fri 8:30am-4:30pm',
          status: 'Operating',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'barkly-arts',
          name: 'Barkly Regional Arts',
          type: 'available',
          category: 'cultural',
          coordinates: [-19.6560, 134.1860],
          description: 'Arts programs and cultural activities',
          contact: '(08) 8962 2961',
          hours: 'Mon-Fri 9am-5pm',
          status: 'Operating',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'community-health',
          name: 'Community Health Centre',
          type: 'available',
          category: 'healthcare',
          coordinates: [-19.6530, 134.1840],
          description: 'Primary healthcare and community health services',
          contact: '(08) 8962 4300',
          hours: 'Mon-Fri 8am-5pm',
          status: 'Operating',
          lastUpdated: '2025-01-01'
        },

        // Service Gaps (Red markers)
        {
          id: 'youth-safe-house',
          name: 'Youth Safe House',
          type: 'gap',
          category: 'youth',
          coordinates: [-19.6570, 134.1900],
          description: 'CRITICAL NEED: Emergency accommodation for young people in crisis situations, with 24/7 support and case management.',
          priority: 94,
          status: 'Critical Gap - No Current Service Available',
          services: ['Emergency Accommodation', '24/7 Support', 'Case Management', 'Crisis Counselling', 'Family Mediation', 'Transition Planning'],
          eligibility: 'Young people aged 12-25 in crisis or unsafe situations',
          estimatedCost: '$2.5M setup cost + $800K annual operating',
          potentialFunding: 'NT Government Youth Housing Initiative, Federal Homelessness Program',
          culturalSafety: 'Indigenous-led service model proposed, Elder advisory group',
          documentSource: 'Youth Roundtable Priority Analysis 2024',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'mental-health',
          name: 'Mental Health Counselling',
          type: 'gap',
          category: 'healthcare',
          coordinates: [-19.6540, 134.1870],
          description: 'Culturally appropriate mental health and counselling services',
          priority: 87,
          status: 'High Priority Gap',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'after-hours-gp',
          name: 'After-hours GP Service',
          type: 'gap',
          category: 'healthcare',
          coordinates: [-19.6510, 134.1860],
          description: 'Medical services outside business hours',
          priority: 72,
          status: 'Service Gap',
          lastUpdated: '2025-01-01'
        },

        // Planned Services (Orange markers)
        {
          id: 'new-youth-centre',
          name: 'New Youth Centre',
          type: 'planned',
          category: 'youth',
          coordinates: [-19.6590, 134.1920],
          description: 'Expanded youth facilities and programs - Opening 2025',
          status: 'Funded - Construction Starting',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'cultural-hub',
          name: 'Cultural Mentoring Hub',
          type: 'planned',
          category: 'cultural',
          coordinates: [-19.6550, 134.1890],
          description: 'Elder-guided cultural learning and mentoring programs',
          status: 'Planning Phase',
          lastUpdated: '2025-01-01'
        }
      ];

      setServices(servicesData);
      setIsLoaded(true);
    };

    loadServicesData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isMounted]);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'available': return '#10b981'; // Green
      case 'gap': return '#ef4444';       // Red  
      case 'planned': return '#f97316';   // Orange
      default: return '#6b7280';          // Gray
    }
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Services', count: services.length },
    { id: 'healthcare', label: 'Healthcare', count: services.filter(s => s.category === 'healthcare').length },
    { id: 'government', label: 'Government', count: services.filter(s => s.category === 'government').length },
    { id: 'youth', label: 'Youth Services', count: services.filter(s => s.category === 'youth').length },
    { id: 'cultural', label: 'Cultural', count: services.filter(s => s.category === 'cultural').length },
    { id: 'education', label: 'Education', count: services.filter(s => s.category === 'education').length },
    { id: 'employment', label: 'Employment', count: services.filter(s => s.category === 'employment').length },
    { id: 'community', label: 'Community', count: services.filter(s => s.category === 'community').length },
  ];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleServiceClick = (service: ServiceLocation) => {
    setSelectedService(service);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedService(null);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="bg-muted/30 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="h-6 bg-muted rounded w-48 mx-auto mb-2"></div>
                <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Fullscreen Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Tennant Creek Services Map</h1>
              
              {/* Fullscreen Category Filters */}
              <div className="flex gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {category.label} ({category.count})
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exitFullscreen}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exit Fullscreen
              </Button>
            </div>
          </div>
        </div>

        {/* Fullscreen Map */}
        <div className="h-full pt-20">
          {isMounted && isLoaded ? (
            <LeafletMap 
              services={filteredServices} 
              center={tennantCreekCenter}
              isFullscreen={true}
              onServiceClick={handleServiceClick}
            />
          ) : (
            <div className="h-full bg-muted/30 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading fullscreen map...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Fullscreen Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur border rounded-lg p-4 max-w-sm">
          <h3 className="font-semibold mb-2 text-sm">Map Legend</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span><strong>Available</strong> - Currently operating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span><strong>Gaps</strong> - Community needs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span><strong>Planned</strong> - Coming soon</span>
            </div>
          </div>
        </div>

        {/* Fullscreen Sidebar */}
        {sidebarOpen && selectedService && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-xl overflow-y-auto">
            {/* Sidebar Header */}
            <div className="sticky top-0 bg-background border-b p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    selectedService.type === 'available' ? 'bg-green-500' :
                    selectedService.type === 'gap' ? 'bg-red-500' : 'bg-orange-500'
                  }`}></div>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedService.name}</h2>
                    <p className="text-sm text-muted-foreground capitalize">{selectedService.category}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSidebar}
                  className="p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="p-4 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    selectedService.type === 'available' ? 'success' :
                    selectedService.type === 'gap' ? 'destructive' : 'warning'
                  }
                >
                  {selectedService.type === 'available' ? 'Available Service' :
                   selectedService.type === 'gap' ? 'Service Gap' : 'Planned Service'}
                </Badge>
                {selectedService.priority && (
                  <Badge variant="outline">{selectedService.priority}% Priority</Badge>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedService.description}</p>
              </div>

              {/* Contact Information */}
              {(selectedService.contact || selectedService.address || selectedService.hours) && (
                <div>
                  <h3 className="font-medium mb-3">Contact & Location</h3>
                  <div className="space-y-2 text-sm">
                    {selectedService.address && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{selectedService.address}</span>
                      </div>
                    )}
                    {selectedService.contact && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${selectedService.contact.replace(/[^\d+]/g, '')}`} className="text-primary hover:underline">
                          {selectedService.contact}
                        </a>
                      </div>
                    )}
                    {selectedService.hours && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{selectedService.hours}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Services Offered */}
              {selectedService.services && selectedService.services.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Services Offered</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedService.services.map((service, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility & Cost */}
              {(selectedService.eligibility || selectedService.cost) && (
                <div>
                  <h3 className="font-medium mb-3">Access Information</h3>
                  <div className="space-y-3">
                    {selectedService.eligibility && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Eligibility</h4>
                        <p className="text-sm">{selectedService.eligibility}</p>
                      </div>
                    )}
                    {selectedService.cost && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Cost</h4>
                        <p className="text-sm">{selectedService.cost}</p>
                      </div>
                    )}
                    {selectedService.referralRequired !== undefined && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Referral Required</h4>
                        <p className="text-sm">{selectedService.referralRequired ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cultural Safety & Accessibility */}
              {(selectedService.culturalSafety || selectedService.accessibility || selectedService.language) && (
                <div>
                  <h3 className="font-medium mb-3">Cultural Safety & Accessibility</h3>
                  <div className="space-y-3">
                    {selectedService.culturalSafety && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Cultural Safety</h4>
                        <p className="text-sm">{selectedService.culturalSafety}</p>
                      </div>
                    )}
                    {selectedService.accessibility && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Accessibility</h4>
                        <p className="text-sm">{selectedService.accessibility}</p>
                      </div>
                    )}
                    {selectedService.language && selectedService.language.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Languages</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedService.language.map((lang, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Funding Information */}
              {(selectedService.estimatedCost || selectedService.potentialFunding || selectedService.timeline) && (
                <div>
                  <h3 className="font-medium mb-3">
                    {selectedService.type === 'gap' ? 'Funding Requirements' : 'Implementation Details'}
                  </h3>
                  <div className="space-y-3">
                    {selectedService.estimatedCost && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Estimated Cost</h4>
                        <p className="text-sm">{selectedService.estimatedCost}</p>
                      </div>
                    )}
                    {selectedService.potentialFunding && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Potential Funding</h4>
                        <p className="text-sm">{selectedService.potentialFunding}</p>
                      </div>
                    )}
                    {selectedService.timeline && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Timeline</h4>
                        <p className="text-sm">{selectedService.timeline}</p>
                      </div>
                    )}
                    {selectedService.funding && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Funding Status</h4>
                        <p className="text-sm">{selectedService.funding}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Source */}
              {selectedService.documentSource && (
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Data Source</h4>
                  <p className="text-xs text-muted-foreground">{selectedService.documentSource}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date(selectedService.lastUpdated).toLocaleDateString()}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t space-y-2">
                {selectedService.type === 'available' && (
                  <Button className="w-full" variant="primary">
                    Get Directions
                  </Button>
                )}
                {selectedService.type === 'gap' && (
                  <Button className="w-full" variant="outline">
                    Support This Initiative
                  </Button>
                )}
                <Button className="w-full" variant="ghost" size="sm">
                  Share This Information
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Fullscreen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          {isMounted && isLoaded ? (
            <LeafletMap 
              services={filteredServices} 
              center={tennantCreekCenter}
              isFullscreen={false}
              onServiceClick={handleServiceClick}
            />
          ) : (
            <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading interactive map...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Map Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span><strong>Available Services</strong> - Currently operating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span><strong>Service Gaps</strong> - Community needs without adequate services</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span><strong>Planned Services</strong> - Coming soon or in development</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <p>Data extracted from community consultations, service directories, and planning documents. 
            Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Service Details Sidebar */}
      {sidebarOpen && selectedService && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-xl overflow-y-auto">
          {/* Sidebar Header */}
          <div className="sticky top-0 bg-background border-b p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedService.type === 'available' ? 'bg-green-500' :
                  selectedService.type === 'gap' ? 'bg-red-500' : 'bg-orange-500'
                }`}></div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedService.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{selectedService.category}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                className="p-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="p-4 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  selectedService.type === 'available' ? 'success' :
                  selectedService.type === 'gap' ? 'destructive' : 'warning'
                }
              >
                {selectedService.type === 'available' ? 'Available Service' :
                 selectedService.type === 'gap' ? 'Service Gap' : 'Planned Service'}
              </Badge>
              {selectedService.priority && (
                <Badge variant="outline">{selectedService.priority}% Priority</Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{selectedService.description}</p>
            </div>

            {/* Contact Information */}
            {(selectedService.contact || selectedService.address || selectedService.hours) && (
              <div>
                <h3 className="font-medium mb-3">Contact & Location</h3>
                <div className="space-y-2 text-sm">
                  {selectedService.address && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedService.address}</span>
                    </div>
                  )}
                  {selectedService.contact && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${selectedService.contact.replace(/[^\d+]/g, '')}`} className="text-primary hover:underline">
                        {selectedService.contact}
                      </a>
                    </div>
                  )}
                  {selectedService.hours && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{selectedService.hours}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Offered */}
            {selectedService.services && selectedService.services.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Services Offered</h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedService.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility & Cost */}
            {(selectedService.eligibility || selectedService.cost) && (
              <div>
                <h3 className="font-medium mb-3">Access Information</h3>
                <div className="space-y-3">
                  {selectedService.eligibility && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Eligibility</h4>
                      <p className="text-sm">{selectedService.eligibility}</p>
                    </div>
                  )}
                  {selectedService.cost && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Cost</h4>
                      <p className="text-sm">{selectedService.cost}</p>
                    </div>
                  )}
                  {selectedService.referralRequired !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Referral Required</h4>
                      <p className="text-sm">{selectedService.referralRequired ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cultural Safety & Accessibility */}
            {(selectedService.culturalSafety || selectedService.accessibility || selectedService.language) && (
              <div>
                <h3 className="font-medium mb-3">Cultural Safety & Accessibility</h3>
                <div className="space-y-3">
                  {selectedService.culturalSafety && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Cultural Safety</h4>
                      <p className="text-sm">{selectedService.culturalSafety}</p>
                    </div>
                  )}
                  {selectedService.accessibility && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Accessibility</h4>
                      <p className="text-sm">{selectedService.accessibility}</p>
                    </div>
                  )}
                  {selectedService.language && selectedService.language.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Languages</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedService.language.map((lang, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Funding Information (for gaps and planned services) */}
            {(selectedService.estimatedCost || selectedService.potentialFunding || selectedService.timeline) && (
              <div>
                <h3 className="font-medium mb-3">
                  {selectedService.type === 'gap' ? 'Funding Requirements' : 'Implementation Details'}
                </h3>
                <div className="space-y-3">
                  {selectedService.estimatedCost && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Estimated Cost</h4>
                      <p className="text-sm">{selectedService.estimatedCost}</p>
                    </div>
                  )}
                  {selectedService.potentialFunding && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Potential Funding</h4>
                      <p className="text-sm">{selectedService.potentialFunding}</p>
                    </div>
                  )}
                  {selectedService.timeline && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Timeline</h4>
                      <p className="text-sm">{selectedService.timeline}</p>
                    </div>
                  )}
                  {selectedService.funding && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Funding Status</h4>
                      <p className="text-sm">{selectedService.funding}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data Source */}
            {selectedService.documentSource && (
              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Data Source</h4>
                <p className="text-xs text-muted-foreground">{selectedService.documentSource}</p>
                <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date(selectedService.lastUpdated).toLocaleDateString()}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t space-y-2">
              {selectedService.type === 'available' && (
                <Button className="w-full" variant="primary">
                  Get Directions
                </Button>
              )}
              {selectedService.type === 'gap' && (
                <Button className="w-full" variant="outline">
                  Support This Initiative
                </Button>
              )}
              <Button className="w-full" variant="ghost" size="sm">
                Share This Information
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}