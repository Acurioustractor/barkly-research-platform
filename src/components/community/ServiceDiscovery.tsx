'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  ExternalLink,
  Filter,
  Star,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react';

interface ServiceListing {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  contact: string;
  hours: string;
  availability: 'available' | 'limited' | 'waitlist' | 'unavailable';
  culturallySafe: boolean;
  languages: string[];
  website?: string;
}

interface ServiceDiscoveryProps {
  communityId: string;
  initialCategory?: string;
}

const SERVICE_CATEGORIES = [
  { value: 'all', label: 'All Services' },
  { value: 'health', label: 'Health & Medical' },
  { value: 'education', label: 'Education & Training' },
  { value: 'employment', label: 'Employment' },
  { value: 'housing', label: 'Housing' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'cultural', label: 'Cultural Services' },
  { value: 'youth', label: 'Youth Services' },
  { value: 'elderly', label: 'Elderly Care' },
  { value: 'family', label: 'Family Services' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'substance_abuse', label: 'Substance Abuse' },
  { value: 'disability', label: 'Disability Support' },
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food Services' },
  { value: 'emergency', label: 'Emergency Services' }
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available Now' },
  { value: 'limited', label: 'Limited Availability' },
  { value: 'waitlist', label: 'Waitlist Available' }
];

export default function ServiceDiscovery({ 
  communityId, 
  initialCategory = 'all' 
}: ServiceDiscoveryProps) {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [culturallySafeOnly, setCulturallySafeOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadServices();
  }, [communityId]);

  useEffect(() => {
    applyFilters();
  }, [services, searchQuery, selectedCategory, selectedAvailability, culturallySafeOnly]);

  const loadServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/community/services?communityId=${communityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load services');
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...services];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Availability filter
    if (selectedAvailability !== 'all') {
      filtered = filtered.filter(service => service.availability === selectedAvailability);
    }

    // Cultural safety filter
    if (culturallySafeOnly) {
      filtered = filtered.filter(service => service.culturallySafe);
    }

    setFilteredServices(filtered);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'waitlist': return 'text-orange-600 bg-orange-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'limited': return <AlertCircle className="h-4 w-4" />;
      case 'waitlist': return <Clock className="h-4 w-4" />;
      case 'unavailable': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryOption = SERVICE_CATEGORIES.find(cat => cat.value === category);
    return categoryOption ? categoryOption.label : category;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading services: {error}</p>
            <Button onClick={loadServices} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Directory</h2>
          <p className="text-gray-600">
            Find local services and support in your community
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Availability
                  </label>
                  <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="culturally-safe"
                    checked={culturallySafeOnly}
                    onChange={(e) => setCulturallySafeOnly(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="culturally-safe" className="text-sm font-medium text-gray-700">
                    Culturally safe services only
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
        </p>
        {(searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all' || culturallySafeOnly) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedAvailability('all');
              setCulturallySafeOnly(false);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              No services found matching your criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedAvailability('all');
                setCulturallySafeOnly(false);
              }}
              className="mt-4"
            >
              Show All Services
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {getCategoryLabel(service.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getAvailabilityIcon(service.availability)}
                    <Badge className={getAvailabilityColor(service.availability)}>
                      {service.availability}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{service.location}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Phone className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{service.contact}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{service.hours}</span>
                  </div>
                  
                  {service.website && (
                    <div className="flex items-start space-x-2">
                      <Globe className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <a 
                        href={service.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 space-y-2">
                  {service.culturallySafe && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-green-500" />
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Culturally Safe
                      </Badge>
                    </div>
                  )}
                  
                  {service.languages.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Languages:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.languages.slice(0, 3).map((language, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                        {service.languages.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.languages.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}