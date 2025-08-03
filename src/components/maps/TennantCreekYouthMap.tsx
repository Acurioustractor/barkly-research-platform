'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

// Mock data for Tennant Creek youth services and demographics
const TENNANT_CREEK_DATA = {
  center: { lat: -19.6497, lng: 134.1836 },
  zoom: 13,
  
  districts: [
    {
      id: 'town-center',
      name: 'Town Center',
      coordinates: [
        { lat: -19.6450, lng: 134.1800 },
        { lat: -19.6450, lng: 134.1900 },
        { lat: -19.6500, lng: 134.1900 },
        { lat: -19.6500, lng: 134.1800 }
      ],
      youthPopulation: 156,
      serviceCount: 8,
      needIntensity: 'medium',
      status: 'well-served'
    },
    {
      id: 'north-residential',
      name: 'North Residential',
      coordinates: [
        { lat: -19.6400, lng: 134.1750 },
        { lat: -19.6400, lng: 134.1950 },
        { lat: -19.6450, lng: 134.1950 },
        { lat: -19.6450, lng: 134.1750 }
      ],
      youthPopulation: 234,
      serviceCount: 2,
      needIntensity: 'high',
      status: 'underserved'
    },
    {
      id: 'south-residential',
      name: 'South Residential',
      coordinates: [
        { lat: -19.6500, lng: 134.1750 },
        { lat: -19.6500, lng: 134.1950 },
        { lat: -19.6600, lng: 134.1950 },
        { lat: -19.6600, lng: 134.1750 }
      ],
      youthPopulation: 189,
      serviceCount: 5,
      needIntensity: 'medium',
      status: 'developing'
    },
    {
      id: 'east-area',
      name: 'East Area',
      coordinates: [
        { lat: -19.6450, lng: 134.1900 },
        { lat: -19.6450, lng: 134.2000 },
        { lat: -19.6550, lng: 134.2000 },
        { lat: -19.6550, lng: 134.1900 }
      ],
      youthPopulation: 268,
      serviceCount: 1,
      needIntensity: 'critical',
      status: 'service-desert'
    }
  ],

  services: [
    {
      id: 'tc-high-school',
      name: 'Tennant Creek High School',
      type: 'education',
      location: { lat: -19.6480, lng: 134.1850 },
      youthServed: 450,
      effectiveness: 85,
      programs: ['Secondary Education', 'VET Programs', 'Student Support']
    },
    {
      id: 'youth-center',
      name: 'Tennant Creek Youth Center',
      type: 'recreation',
      location: { lat: -19.6470, lng: 134.1830 },
      youthServed: 120,
      effectiveness: 92,
      programs: ['After School Programs', 'Holiday Activities', 'Mentoring']
    },
    {
      id: 'batchelor-institute',
      name: 'Batchelor Institute',
      type: 'training',
      location: { lat: -19.6460, lng: 134.1870 },
      youthServed: 85,
      effectiveness: 78,
      programs: ['Trade Training', 'Certificate Courses', 'Adult Education']
    },
    {
      id: 'health-clinic',
      name: 'Youth Health Clinic',
      type: 'health',
      location: { lat: -19.6490, lng: 134.1840 },
      youthServed: 200,
      effectiveness: 88,
      programs: ['Mental Health', 'Sexual Health', 'Drug & Alcohol Support']
    },
    {
      id: 'sports-complex',
      name: 'Sports Complex',
      type: 'sport',
      location: { lat: -19.6520, lng: 134.1880 },
      youthServed: 180,
      effectiveness: 95,
      programs: ['Basketball', 'Football', 'Athletics', 'Swimming']
    }
  ],

  needs: [
    {
      type: 'employment',
      intensity: 'critical',
      areas: ['east-area', 'north-residential'],
      description: 'Youth employment and job training programs urgently needed'
    },
    {
      type: 'mental-health',
      intensity: 'high',
      areas: ['north-residential', 'south-residential'],
      description: 'Additional mental health services required for youth'
    },
    {
      type: 'transport',
      intensity: 'high',
      areas: ['east-area', 'south-residential'],
      description: 'Transport barriers preventing access to town center services'
    },
    {
      type: 'after-school',
      intensity: 'medium',
      areas: ['north-residential', 'east-area'],
      description: 'After-school programs needed in residential areas'
    }
  ],

  successStories: [
    {
      id: 'basketball-program',
      title: 'Basketball Mentorship Program',
      location: { lat: -19.6520, lng: 134.1880 },
      impact: 'high',
      description: '90% retention rate, 15 youth gained employment through program connections',
      expandable: true
    },
    {
      id: 'cultural-arts',
      title: 'Cultural Arts Workshop',
      location: { lat: -19.6470, lng: 134.1830 },
      impact: 'medium',
      description: 'Strong cultural connection, improved school attendance',
      expandable: true
    }
  ],

  opportunities: [
    {
      type: 'funding',
      title: 'Youth Employment Funding Available',
      amount: '$150,000',
      deadline: '2025-09-30',
      matchedNeeds: ['employment'],
      areas: ['east-area', 'north-residential']
    },
    {
      type: 'space',
      title: 'Community Hall Available',
      location: { lat: -19.6440, lng: 134.1920 },
      description: 'Underutilized space perfect for youth programs',
      areas: ['north-residential']
    }
  ]
};

interface MapLayer {
  id: string;
  name: string;
  active: boolean;
  color: string;
}

export default function TennantCreekYouthMap() {
  const [activeLayers, setActiveLayers] = useState<MapLayer[]>([
    { id: 'youth-population', name: 'Youth Population', active: true, color: '#3B82F6' },
    { id: 'services', name: 'Service Locations', active: true, color: '#10B981' },
    { id: 'needs', name: 'Need Intensity', active: true, color: '#EF4444' },
    { id: 'success-stories', name: 'Success Stories', active: false, color: '#F59E0B' },
    { id: 'opportunities', name: 'Opportunities', active: false, color: '#8B5CF6' }
  ]);

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'overview' | 'detailed'>('overview');

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, active: !layer.active }
          : layer
      )
    );
  };

  const getDistrictStatus = (status: string) => {
    const statusConfig = {
      'well-served': { color: '#10B981', label: 'Well Served' },
      'developing': { color: '#F59E0B', label: 'Developing' },
      'underserved': { color: '#EF4444', label: 'Underserved' },
      'service-desert': { color: '#DC2626', label: 'Service Desert' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['developing'];
  };

  const selectedDistrict = selectedArea 
    ? TENNANT_CREEK_DATA.districts.find(d => d.id === selectedArea)
    : null;

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Tennant Creek Youth Service Map</h2>
          <p className="text-muted-foreground">
            Interactive intelligence map showing youth services, needs, and opportunities
          </p>
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
            variant={mapView === 'detailed' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMapView('detailed')}
          >
            Detailed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Map Layers</CardTitle>
            <CardDescription>Toggle data layers on/off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeLayers.map(layer => (
                <div key={layer.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={layer.id}
                    checked={layer.active}
                    onChange={() => toggleLayer(layer.id)}
                    className="rounded"
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <label htmlFor={layer.id} className="text-sm font-medium">
                    {layer.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                {/* Simplified Map Visualization */}
                <div className="absolute inset-0 p-4">
                  <div className="text-center text-gray-500 mb-4">
                    <h3 className="font-semibold">Tennant Creek Youth Service Map</h3>
                    <p className="text-sm">Interactive map visualization</p>
                  </div>
                  
                  {/* District Visualization */}
                  <div className="grid grid-cols-2 gap-2 h-64">
                    {TENNANT_CREEK_DATA.districts.map((district, index) => {
                      const status = getDistrictStatus(district.status);
                      const isSelected = selectedArea === district.id;
                      
                      return (
                        <div
                          key={district.id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-primary' : 'border-gray-300'
                          }`}
                          style={{ 
                            backgroundColor: `${status.color}20`,
                            borderColor: isSelected ? '#3B82F6' : status.color
                          }}
                          onClick={() => setSelectedArea(
                            selectedArea === district.id ? null : district.id
                          )}
                        >
                          <div className="text-xs font-semibold">{district.name}</div>
                          <div className="text-xs text-gray-600">
                            {district.youthPopulation} youth
                          </div>
                          <div className="text-xs text-gray-600">
                            {district.serviceCount} services
                          </div>
                          <div 
                            className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          
                          {/* Service markers */}
                          {activeLayers.find(l => l.id === 'services')?.active && (
                            <div className="absolute top-1 right-1">
                              {Array.from({ length: Math.min(district.serviceCount, 3) }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block ml-0.5"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Click on areas to see detailed information
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Area Intelligence Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDistrict ? selectedDistrict.name : 'Tennant Creek Overview'}
            </CardTitle>
            <CardDescription>
              {selectedDistrict ? 'Area intelligence' : 'Select an area for details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDistrict ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Youth Population</div>
                  <div className="text-2xl font-bold">{selectedDistrict.youthPopulation}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Services Available</div>
                  <div className="text-2xl font-bold">{selectedDistrict.serviceCount}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getDistrictStatus(selectedDistrict.status).color }}
                    />
                    <span className="text-sm font-medium">
                      {getDistrictStatus(selectedDistrict.status).label}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Need Intensity</div>
                  <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                    selectedDistrict.needIntensity === 'critical' ? 'bg-red-100 text-red-800' :
                    selectedDistrict.needIntensity === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedDistrict.needIntensity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedDistrict.needIntensity.charAt(0).toUpperCase() + selectedDistrict.needIntensity.slice(1)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Total Youth</div>
                  <div className="text-2xl font-bold">
                    {TENNANT_CREEK_DATA.districts.reduce((sum, d) => sum + d.youthPopulation, 0)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Total Services</div>
                  <div className="text-2xl font-bold">{TENNANT_CREEK_DATA.services.length}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Critical Needs</div>
                  <div className="text-2xl font-bold text-red-600">
                    {TENNANT_CREEK_DATA.needs.filter(n => n.intensity === 'critical').length}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🚨 Critical Needs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TENNANT_CREEK_DATA.needs
                .filter(need => need.intensity === 'critical')
                .map((need, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-800 capitalize">
                      {need.type.replace('-', ' ')}
                    </div>
                    <div className="text-sm text-red-600">
                      {need.description}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      Areas: {need.areas.map(area => 
                        TENNANT_CREEK_DATA.districts.find(d => d.id === area)?.name
                      ).join(', ')}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💪 Success Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TENNANT_CREEK_DATA.successStories.map(story => (
                <div key={story.id} className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">
                    {story.title}
                  </div>
                  <div className="text-sm text-green-600">
                    {story.description}
                  </div>
                  {story.expandable && (
                    <div className="text-xs text-green-500 mt-1">
                      ✨ Ready to expand
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💡 Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TENNANT_CREEK_DATA.opportunities.map((opportunity, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800">
                    {opportunity.title}
                  </div>
                  <div className="text-sm text-blue-600">
                    {opportunity.type === 'funding' && opportunity.amount && (
                      <span className="font-semibold">{opportunity.amount} available</span>
                    )}
                    {opportunity.description}
                  </div>
                  {opportunity.areas && (
                    <div className="text-xs text-blue-500 mt-1">
                      Target areas: {opportunity.areas.map(area => 
                        TENNANT_CREEK_DATA.districts.find(d => d.id === area)?.name
                      ).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}