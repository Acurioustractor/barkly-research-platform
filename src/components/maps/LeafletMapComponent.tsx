'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Badge } from '@/components/core/Badge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
}

interface LeafletMapComponentProps {
  services: ServiceLocation[];
  center: [number, number];
  isFullscreen?: boolean;
  onServiceClick?: (service: ServiceLocation) => void;
}

export default function LeafletMapComponent({ services, center, isFullscreen = false, onServiceClick }: LeafletMapComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Add a small delay to ensure proper hydration
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);
    
    // Fix Leaflet icons when component mounts
    if (typeof window !== 'undefined') {
      // Delete existing icon definition
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      
      // Create custom icons with different colors
      const createColoredIcon = (color: string) => {
        return L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background-color: ${color};
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
          ">●</div>`,
          iconSize: [25, 25],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12]
        });
      };
      
      // Store custom icons
      (window as any).customIcons = {
        available: createColoredIcon('#10b981'),
        gap: createColoredIcon('#ef4444'),
        planned: createColoredIcon('#f97316')
      };
    }
    
    return () => clearTimeout(timer);
  }, []);

  if (!isClient || !mapReady) {
    return (
      <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const getCustomIcon = (type: string) => {
    if (typeof window !== 'undefined' && (window as any).customIcons) {
      return (window as any).customIcons[type];
    }
    return undefined;
  };

  return (
    <MapContainer
      center={center}
      zoom={isFullscreen ? 13 : 14}
      style={{ 
        height: isFullscreen ? '100vh' : '600px', 
        width: '100%' 
      }}
      className={isFullscreen ? 'z-0' : 'rounded-lg z-0'}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Town boundary circle */}
      <Circle
        center={center}
        radius={2000}
        pathOptions={{
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5'
        }}
      />

      {/* Service markers */}
      {services.map(service => (
        <Marker
          key={service.id}
          position={service.coordinates}
          icon={getCustomIcon(service.type)}
          eventHandlers={{
            click: () => {
              if (onServiceClick) {
                onServiceClick(service);
              }
            }
          }}
        >
          <Popup maxWidth={300}>
            <div className="p-2">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{service.name}</h3>
                <Badge 
                  variant={
                    service.type === 'available' ? 'success' :
                    service.type === 'gap' ? 'destructive' : 'warning'
                  }
                  className="ml-2 text-xs"
                >
                  {service.type === 'available' ? 'Available' :
                   service.type === 'gap' ? 'Needed' : 'Planned'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">{service.description}</p>
              {service.contact && (
                <p className="text-xs"><strong>Contact:</strong> {service.contact}</p>
              )}
              {service.hours && (
                <p className="text-xs"><strong>Hours:</strong> {service.hours}</p>
              )}
              {service.priority && (
                <p className="text-xs"><strong>Community Priority:</strong> {service.priority}%</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                <strong>Status:</strong> {service.status}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}