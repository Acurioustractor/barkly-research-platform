import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Users, Heart, Calendar, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Tennant Creek coordinates
const TENNANT_CREEK_CENTER = [-19.6530, 134.1805];

// Youth services data extracted from the documents
const youthServices = [
  {
    id: 1,
    name: "Tennant Creek Youth Centre",
    type: "Youth Hub",
    lat: -19.6490,
    lng: 134.1890,
    status: "active",
    coverage: "high",
    description: "Drop-in centre with recreational facilities, ninja warrior course, music and art workshops",
    operatingHours: "After school and evenings",
    youthServed: 120,
    gaps: ["Weekend programs", "Late night services"],
    stories: [{
      id: "story1",
      title: "Safe Place at Night",
      quote: "We give the information to these governments... You've got to put the tick there and say yes.",
      author: "Community Member",
      content: "Young people have told us they need somewhere safe to go at night. The Youth Centre provides activities but closes too early.",
      image: "/api/placeholder/400/300"
    }]
  },
  {
    id: 2,
    name: "Clontarf Foundation Academy",
    type: "Education/Mentoring",
    lat: -19.6420,
    lng: 134.1750,
    status: "active",
    coverage: "medium",
    description: "School-based program for Aboriginal boys using sport and mentoring",
    operatingHours: "School hours",
    youthServed: 45,
    gaps: ["Female students", "After hours support"],
    stories: [{
      id: "story2",
      title: "Building Future Leaders",
      quote: "Sport brings us together, but it's the mentoring that changes lives",
      author: "Clontarf Participant",
      content: "The academy helps boys stay engaged at school through football and leadership camps."
    }]
  },
  {
    id: 3,
    name: "Stars Foundation",
    type: "Education/Mentoring",
    lat: -19.6440,
    lng: 134.1780,
    status: "active",
    coverage: "medium",
    description: "In-school mentoring for Aboriginal girls to improve attendance and confidence",
    operatingHours: "School hours",
    youthServed: 38,
    gaps: ["Holiday programs", "Family engagement"],
    stories: [{
      id: "story3",
      title: "Empowering Young Women",
      quote: "Stars gives me someone to talk to when things get hard",
      author: "Year 10 Student",
      content: "Full-time mentors support girls with everything from homework to life skills."
    }]
  },
  {
    id: 4,
    name: "Night Patrol",
    type: "Safety/Outreach",
    lat: -19.6550,
    lng: 134.1820,
    status: "struggling",
    coverage: "low",
    description: "Indigenous-led patrol providing safe transport and intervention",
    operatingHours: "8pm - 2am",
    youthServed: 200,
    gaps: ["Funding uncertainty", "Limited coverage", "Staff shortages"],
    stories: [{
      id: "story4",
      title: "Keeping Kids Safe After Dark",
      quote: "A lot of young people [even as young as 6] are on the street at night",
      author: "Night Patrol Officer",
      content: "We need more resources to cover all areas where youth gather at night."
    }]
  },
  {
    id: 5,
    name: "Anyinginyi Health - Stronger Families",
    type: "Health/Wellbeing",
    lat: -19.6480,
    lng: 134.1850,
    status: "active",
    coverage: "medium",
    description: "Trauma counseling and family support services",
    operatingHours: "Business hours",
    youthServed: 65,
    gaps: ["After hours crisis support", "Youth-specific programs"],
    stories: [{
      id: "story5",
      title: "Healing Together",
      quote: "Services might say young people are safe, but that doesn't mean young people FEEL safe",
      author: "Youth Roundtable Report",
      content: "Culturally safe counseling helps families heal from trauma together."
    }]
  },
  {
    id: 6,
    name: "CatholicCare Youth Outreach",
    type: "Social Services",
    lat: -19.6510,
    lng: 134.1795,
    status: "active",
    coverage: "medium",
    description: "Case management and activities for at-risk youth",
    operatingHours: "Business hours + some evenings",
    youthServed: 55,
    gaps: ["Weekend coverage", "Remote outreach"],
    stories: [{
      id: "story6",
      title: "Wrap-Around Support",
      quote: "Young people want more guidance/mentoring/support from adults",
      author: "Youth Survey Response",
      content: "Providing holistic support for youth facing multiple challenges."
    }]
  },
  {
    id: 7,
    name: "Proposed Safe Night Hub",
    type: "Crisis Support",
    lat: -19.6560,
    lng: 134.1770,
    status: "planned",
    coverage: "none",
    description: "$3M Crisis Youth Funding - Community voted for Hub model",
    operatingHours: "Proposed: 3pm-8am weekdays, 24hrs weekends",
    youthServed: 0,
    gaps: ["Not yet operational", "Location to be determined"],
    stories: [{
      id: "story7",
      title: "A Vision for Night Safety",
      quote: "27 people voted for a 'Hub' and 13 for a 'Shelter'",
      author: "Youth Roundtable Vote",
      content: "The community chose a drop-in Hub model over residential shelter to provide safe spaces at night."
    }]
  }
];

// Middle Space themes from the documents
const themes = {
  "Safe Place at Night": { color: "#ef4444", icon: "🏠" },
  "Strong Adults": { color: "#f59e0b", icon: "👥" },
  "Learning Opportunities": { color: "#3b82f6", icon: "📚" },
  "Sports & Activities": { color: "#10b981", icon: "⚽" },
  "Wellbeing/Feeling Good": { color: "#8b5cf6", icon: "❤️" }
};

// Component to control map zoom
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function TennantCreekYouthMap() {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeTheme, setActiveTheme] = useState("all");

  // Calculate heat map intensity based on coverage and gaps
  const getHeatIntensity = (service) => {
    if (service.status === "planned") return 0.3;
    if (service.status === "struggling") return 0.5;
    if (service.coverage === "high") return 1;
    if (service.coverage === "medium") return 0.7;
    return 0.4;
  };

  // Get color based on service status
  const getServiceColor = (service) => {
    if (service.status === "struggling") return "#ef4444"; // red
    if (service.status === "planned") return "#94a3b8"; // gray
    if (service.gaps.length > 2) return "#f59e0b"; // amber
    return "#10b981"; // green
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={TENNANT_CREEK_CENTER}
          zoom={14}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapController center={TENNANT_CREEK_CENTER} />
          
          {/* Service Markers with Heat Effect */}
          {youthServices.map((service) => (
            <React.Fragment key={service.id}>
              {/* Heat circle */}
              <CircleMarker
                center={[service.lat, service.lng]}
                radius={40 * getHeatIntensity(service)}
                fillColor={getServiceColor(service)}
                fillOpacity={0.2}
                stroke={false}
              />
              {/* Service marker */}
              <CircleMarker
                center={[service.lat, service.lng]}
                radius={15}
                fillColor={getServiceColor(service)}
                fillOpacity={0.8}
                color="white"
                weight={3}
                eventHandlers={{
                  click: () => setSelectedService(service)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{service.name}</h3>
                    <p className="text-sm">{service.type}</p>
                    <p className="text-xs mt-1">Youth served: {service.youthServed}</p>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
          <h3 className="font-bold mb-2">Service Status</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Active & Well-resourced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
              <span>Active with Gaps</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Struggling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <span>Planned</span>
            </div>
          </div>
        </div>

        {/* Theme Filter */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
          <h3 className="font-bold mb-2">Youth Priorities</h3>
          <div className="space-y-1">
            {Object.entries(themes).map(([theme, config]) => (
              <Button
                key={theme}
                variant={activeTheme === theme ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setActiveTheme(theme)}
              >
                <span className="mr-2">{config.icon}</span>
                <span className="text-xs">{theme}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Tennant Creek Youth Services</h1>
          <p className="text-sm opacity-90">Putting young people at the centre</p>
          <p className="text-xs mt-2 italic">"Wilya manu marlungku-ku anyul nyirrinta mappungku akila-ka"</p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {selectedService ? (
            <div className="p-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService(null)}
                className="mb-4"
              >
                ← Back to overview
              </Button>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedService.name}</CardTitle>
                      <CardDescription>{selectedService.type}</CardDescription>
                    </div>
                    <Badge variant={
                      selectedService.status === 'active' ? 'default' : 
                      selectedService.status === 'struggling' ? 'destructive' : 'secondary'
                    }>
                      {selectedService.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{selectedService.description}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{selectedService.operatingHours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{selectedService.youthServed} young people served</span>
                    </div>
                  </div>

                  {selectedService.gaps.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Service Gaps
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {selectedService.gaps.map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedService.stories.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-sm mb-3">Community Stories</h4>
                      <div className="space-y-2">
                        {selectedService.stories.map((story) => (
                          <Card 
                            key={story.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedStory(story)}
                          >
                            <CardContent className="p-4">
                              <p className="font-medium text-sm">{story.title}</p>
                              <p className="text-xs text-gray-600 mt-1">"{story.quote}"</p>
                              <p className="text-xs text-gray-500 mt-1">- {story.author}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Youth Service Landscape</h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">6</div>
                    <div className="text-sm text-gray-600">Active Services</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-amber-600">523</div>
                    <div className="text-sm text-gray-600">Youth Served</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">1</div>
                    <div className="text-sm text-gray-600">Struggling Service</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-gray-600">1</div>
                    <div className="text-sm text-gray-600">Planned Service</div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Finding */}
              <Card className="mb-6 border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">Key Finding</h3>
                  <p className="text-sm text-amber-800">
                    "There are not many programs supporting young people at night" 
                    - Youth Roundtable identified this as the most critical gap
                  </p>
                </CardContent>
              </Card>

              {/* Service List */}
              <h3 className="font-semibold mb-3">Click a service on the map to explore</h3>
              <div className="space-y-2">
                {youthServices.map((service) => (
                  <Card 
                    key={service.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getServiceColor(service) }}
                        />
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-gray-600">{service.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {service.youthServed || 'Planned'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Story Modal */}
        {selectedStory && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <Card className="max-w-lg w-full max-h-[80vh] overflow-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedStory.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedStory(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedStory.image && (
                  <img 
                    src={selectedStory.image} 
                    alt={selectedStory.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <blockquote className="border-l-4 border-orange-500 pl-4 mb-4">
                  <p className="italic text-gray-700">"{selectedStory.quote}"</p>
                  <footer className="text-sm text-gray-500 mt-2">— {selectedStory.author}</footer>
                </blockquote>
                <p className="text-gray-600">{selectedStory.content}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, MapPin, Users, Heart, Calendar, AlertCircle, Home, BookOpen, Activity, Shield, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Tennant Creek coordinates
const TENNANT_CREEK_CENTER = [-19.6530, 134.1805];

// Data extracted from the documents
const youthServices = [
  // From Services Barkley document
  {
    id: 1,
    name: "Tennant Creek Youth Centre",
    provider: "Barkly Regional Council",
    type: "Youth Hub",
    lat: -19.6490,
    lng: 134.1890,
    status: "active",
    coverage: "partial",
    description: "Drop-in centre with recreational facilities, ninja warrior obstacle course, music and art workshops, cultural events",
    operatingHours: "After school and nighttime activities",
    youthServed: 120,
    targetPop: "Young people ages 8-24, including disengaged youth",
    gaps: ["Limited late night hours", "Need more structured programs"],
    barklyDealAlignment: "Initiative 2: Youth Infrastructure - $7.6M funding",
    ctgAlignment: ["Safe kids and youth", "Learning opportunities"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "Young people engaged in activities and had a voice",
      source: "Youth Roundtable Outcome",
      date: "April 2025"
    }]
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
    description: "Indigenous Night Patrol officers engage with at-risk people, especially youth, to defuse situations and provide safe transport",
    operatingHours: "Night hours",
    youthServed: 200,
    targetPop: "At-risk youth and intoxicated persons",
    gaps: ["Funding uncertainty", "Limited coverage areas", "Staff shortages"],
    barklyDealAlignment: "Community safety investment",
    ctgAlignment: ["Safe kids and youth", "Self-determination"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "There are a lot of young people on the street, from aged 6, at night and for different reasons",
      source: "Youth Roundtable Finding",
      date: "April 2025"
    }]
  },
  {
    id: 3,
    name: "Clontarf Foundation Academy",
    provider: "Clontarf Foundation",
    type: "Education/Mentoring",
    lat: -19.6420,
    lng: 134.1750,
    status: "active",
    coverage: "medium",
    description: "School-based engagement program for Aboriginal boys using sports and mentoring",
    operatingHours: "School hours + camps",
    youthServed: 45,
    targetPop: "Aboriginal male students ages 12-18",
    gaps: ["Boys only", "Limited after-hours support"],
    ctgAlignment: ["Learning in both worlds", "Strong culture"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "More opportunities to learn skills and do work experience",
      source: "Youth Survey Response",
      date: "March 2025"
    }]
  },
  {
    id: 4,
    name: "Stars Foundation",
    provider: "Stars Foundation",
    type: "Education/Mentoring",
    lat: -19.6440,
    lng: 134.1780,
    status: "active", 
    coverage: "medium",
    description: "In-school mentoring for Aboriginal girls with full-time mentors for tutoring, goal-setting, cultural connection",
    operatingHours: "School hours",
    youthServed: 38,
    targetPop: "Aboriginal female students ages 10-18",
    gaps: ["Girls only", "No holiday programs"],
    ctgAlignment: ["Learning in both worlds", "Strong culture and wellbeing"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "We want more guidance/mentoring/support from adults",
      source: "Youth Data Summary",
      date: "March 2025"
    }]
  },
  {
    id: 5,
    name: "Anyinginyi Health - Stronger Families",
    provider: "Anyinginyi Health Aboriginal Corporation",
    type: "Health/Wellbeing",
    lat: -19.6480,
    lng: 134.1850,
    status: "active",
    coverage: "medium",
    description: "Trauma counseling, domestic violence prevention, men's health outreach, cultural healing practices",
    operatingHours: "Business hours",
    youthServed: 65,
    targetPop: "Aboriginal families including youth",
    gaps: ["After hours crisis support", "Youth-specific programs"],
    barklyDealAlignment: "Trauma-informed care initiatives",
    ctgAlignment: ["Strong culture and wellbeing", "Quality services"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "Safety means different things to different people. Services might say that young people are safe but that doesn't mean that young people FEEL safe",
      source: "Youth Roundtable Report",
      date: "April 2025"
    }]
  },
  {
    id: 6,
    name: "CatholicCare NT Youth Outreach",
    provider: "CatholicCare NT",
    type: "Social Services",
    lat: -19.6510,
    lng: 134.1795,
    status: "active",
    coverage: "medium",
    description: "Youth Outreach program providing case management for at-risk youth, counselling, parenting education",
    operatingHours: "Business hours + some evenings",
    youthServed: 55,
    targetPop: "At-risk youth and families",
    gaps: ["Weekend coverage", "Remote outreach limited"],
    barklyDealAlignment: "Youth services and trauma care",
    ctgAlignment: ["Safe kids and youth", "Quality services"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "More counselling and people to talk to about stuff",
      source: "Youth Priority",
      date: "March 2025"
    }]
  },
  {
    id: 7,
    name: "Tennant Creek High School",
    provider: "NT Department of Education",
    type: "Education",
    lat: -19.6400,
    lng: 134.1800,
    status: "active",
    coverage: "high",
    description: "Main government high school with Clontarf and Stars programs, ~200 students",
    operatingHours: "School hours",
    youthServed: 200,
    targetPop: "Youth 12-18 from TC and remote communities",
    gaps: ["Low attendance rates", "Limited vocational options"],
    barklyDealAlignment: "Initiative 18: Student Boarding Accommodation",
    ctgAlignment: ["Learning in both worlds", "Self-determination"],
    fromDoc: "Youth Case Study",
    overcrowding: { "10-14": 66, "15-19": 76 }, // % living in overcrowded houses
    stories: [{
      quote: "More ways of learning- outside, two ways, VET programs",
      source: "Youth Feedback",
      date: "March 2025"
    }]
  },
  {
    id: 8,
    name: "BRADAAG (Drug & Alcohol Services)",
    provider: "BRADAAG",
    type: "Health/Rehabilitation",
    lat: -19.6460,
    lng: 134.1830,
    status: "active",
    coverage: "low",
    description: "Residential rehabilitation, outreach, aftercare, and Sobering-Up Shelter",
    operatingHours: "24/7 shelter, business hours programs",
    youthServed: 30,
    targetPop: "Adults 18+ (youth gap identified)",
    gaps: ["No youth-specific programs", "18+ only"],
    ctgAlignment: ["Strong culture and wellbeing"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "Drinking and fighting are the worst things about living here",
      source: "Youth Survey",
      date: "March 2025"
    }]
  },
  {
    id: 9,
    name: "Barkly Youth Justice Facility (Back on Track)",
    provider: "NT Government",
    type: "Justice/Diversion",
    lat: -19.6570,
    lng: 134.1760,
    status: "planned",
    coverage: "none",
    description: "Alternative to detention facility for youth offenders to stay on country with rehabilitation programs",
    operatingHours: "24/7 (when operational)",
    youthServed: 0,
    targetPop: "Youth 10-17 in justice system",
    gaps: ["Not yet operational", "Construction timeline unclear"],
    barklyDealAlignment: "Initiative 4: Alternative to Detention - $5.55M",
    ctgAlignment: ["Safe kids and youth", "Self-determination"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "Decreased % of youth in detention/offending/reoffending",
      source: "CTG Outcome Target",
      date: "2025"
    }]
  },
  {
    id: 10,
    name: "Proposed Safe Night Hub",
    provider: "To be determined",
    type: "Crisis Support",
    lat: -19.6560,
    lng: 134.1770,
    status: "planned",
    coverage: "none",
    description: "$3M Crisis Youth Funding - Hub model chosen by community vote",
    operatingHours: "Proposed: 3pm-8am weekdays, 24hrs weekends",
    youthServed: 0,
    targetPop: "Youth of all ages needing safe space",
    gaps: ["Not operational", "Location TBD", "Operating model in design"],
    barklyDealAlignment: "Initiative 15: Crisis Youth Support",
    ctgAlignment: ["Safe kids and youth"],
    fromDoc: "Youth Roundtable",
    stories: [{
      quote: "27 people voted for a 'Hub' model and 13 for a 'Shelter'",
      source: "Youth Roundtable Vote", 
      date: "April 16, 2025"
    }]
  },
  {
    id: 11,
    name: "Student Boarding Facility (Wangkana Kari)",
    provider: "NT Government",
    type: "Education/Housing",
    lat: -19.6380,
    lng: 134.1790,
    status: "active",
    coverage: "medium",
    description: "Residential boarding for remote students attending TC High School",
    operatingHours: "24/7 during school terms",
    youthServed: 40,
    targetPop: "Remote Indigenous students 12-18",
    gaps: ["Capacity limitations", "Homesickness issues"],
    barklyDealAlignment: "Initiative 18: Student Boarding - $12.7M expansion",
    ctgAlignment: ["Learning in both worlds", "Safe kids"],
    fromDoc: "Services Barkley",
    stories: [{
      quote: "From 10-17 and even younger and older groups because they are hanging out on the streets and don't feel safe at home",
      source: "Roundtable Workshop",
      date: "April 2025"
    }]
  }
];

// Youth priorities from the documents
const youthPriorities = {
  "Safe Place at Night": { 
    color: "#ef4444", 
    icon: Home,
    description: "Somewhere safe to go at night",
    gaps: ["Limited night services", "Youth as young as 6 on streets"],
    ctgTarget: "Decreased % of youth in detention"
  },
  "Strong Adults": { 
    color: "#f59e0b", 
    icon: Users,
    description: "More guidance/mentoring/support from adults",
    gaps: ["Parent engagement", "Role models needed"],
    ctgTarget: "Increased % of kids/youth who report feeling safe and supported"
  },
  "Learning Opportunities": { 
    color: "#3b82f6", 
    icon: BookOpen,
    description: "Different ways of learning - two ways, VET, work experience",
    gaps: ["Limited vocational options", "Cultural learning"],
    ctgTarget: "Increased % of Aboriginal students completing year 12"
  },
  "Sports & Activities": { 
    color: "#10b981", 
    icon: Activity,
    description: "More sports activities and competitions with rules",
    gaps: ["Few structured programs", "Limited equipment"],
    ctgTarget: "Increased % of kids who report having someone safe to talk to"
  },
  "Wellbeing/Feeling Good": { 
    color: "#8b5cf6", 
    icon: Heart,
    description: "Counsellors and support to talk through stuff",
    gaps: ["After hours support", "Youth-specific services"],
    ctgTarget: "Reduced suicide rates"
  }
};

// Key statistics from documents
const keyStats = {
  youthSurveyed: 51,
  roundtableYouth: 25,
  avgAge: 14.3,
  indigenousPercent: 74,
  overcrowding1014: 66,
  overcrowding1519: 76,
  nightServicesGap: "Not many programs supporting young people at night",
  hubVotes: 27,
  shelterVotes: 13
};

export default function TennantCreekYouthServicesMap() {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [showStory, setShowStory] = useState(null);

  // Calculate service coverage heat intensity
  const getHeatIntensity = (service) => {
    if (service.status === "planned") return 0.2;
    if (service.status === "struggling") return 0.4;
    if (service.coverage === "high") return 1;
    if (service.coverage === "medium") return 0.7;
    if (service.coverage === "partial") return 0.5;
    return 0.3;
  };

  // Get service color based on status
  const getServiceColor = (service) => {
    if (service.status === "struggling") return "#ef4444"; // red
    if (service.status === "planned") return "#94a3b8"; // gray
    if (service.gaps.length > 2) return "#f59e0b"; // amber - has gaps
    return "#10b981"; // green - functioning well
  };

  // Filter services by priority
  const getRelevantServices = (priority) => {
    if (priority === "all") return youthServices;
    
    const priorityMap = {
      "Safe Place at Night": ["Night Patrol", "Safe Night Hub", "Youth Centre"],
      "Strong Adults": ["Clontarf", "Stars", "CatholicCare"],
      "Learning Opportunities": ["High School", "Clontarf", "Stars", "Boarding"],
      "Sports & Activities": ["Youth Centre", "Clontarf"],
      "Wellbeing/Feeling Good": ["Anyinginyi", "CatholicCare", "BRADAAG"]
    };
    
    return youthServices.filter(s => 
      priorityMap[priority]?.some(name => s.name.includes(name))
    );
  };

  const relevantServices = getRelevantServices(selectedPriority);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={TENNANT_CREEK_CENTER}
          zoom={14}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap | Barkly Youth Services Mapping'
          />
          
          {relevantServices.map((service) => (
            <React.Fragment key={service.id}>
              {/* Heat circle */}
              <CircleMarker
                center={[service.lat, service.lng]}
                radius={45 * getHeatIntensity(service)}
                fillColor={getServiceColor(service)}
                fillOpacity={0.15}
                stroke={false}
              />
              {/* Inner heat circle */}
              <CircleMarker
                center={[service.lat, service.lng]}
                radius={25 * getHeatIntensity(service)}
                fillColor={getServiceColor(service)}
                fillOpacity={0.25}
                stroke={false}
              />
              {/* Service marker */}
              <CircleMarker
                center={[service.lat, service.lng]}
                radius={14}
                fillColor={getServiceColor(service)}
                fillOpacity={0.9}
                color="white"
                weight={3}
                eventHandlers={{
                  click: () => setSelectedService(service)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <div className="text-sm">
                    <div className="font-semibold">{service.name}</div>
                    <div className="text-xs">{service.youthServed} youth served</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Map Legend */}
        <Card className="absolute bottom-4 left-4 z-[1000]">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 text-sm">Service Status</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Active & Well-resourced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>Active with Service Gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Struggling/Under-resourced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Planned/Not Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Youth Priorities Filter */}
        <Card className="absolute top-4 left-4 z-[1000]">
          <CardContent className="p-4">
            <h3 className="font-bold mb-3 text-sm">Youth Priorities (April 2025)</h3>
            <div className="space-y-2">
              <Button
                variant={selectedPriority === "all" ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setSelectedPriority("all")}
              >
                Show All Services
              </Button>
              {Object.entries(youthPriorities).map(([priority, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={priority}
                    variant={selectedPriority === priority ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setSelectedPriority(priority)}
                  >
                    <Icon className="w-3 h-3 mr-2" />
                    <span>{priority}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4">
          <h1 className="text-xl font-bold">Tennant Creek Youth Services Map</h1>
          <p className="text-sm opacity-90 mt-1">Putting Youth at the Centre</p>
          <p className="text-xs mt-2 italic">
            "Wilya manu marlungku-ku anyul nyirrinta mappungku akila-ka"
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {selectedService ? (
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService(null)}
                className="mb-3"
              >
                ← Back to overview
              </Button>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{selectedService.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {selectedService.provider} • {selectedService.type}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        selectedService.status === 'active' ? 'default' : 
                        selectedService.status === 'struggling' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {selectedService.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{selectedService.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span>{selectedService.operatingHours}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span>{selectedService.youthServed} young people served</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-xs">{selectedService.targetPop}</span>
                    </div>
                  </div>

                  {selectedService.gaps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Service Gaps
                      </h4>
                      <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                        {selectedService.gaps.map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedService.barklyDealAlignment && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium">Barkly Deal Alignment:</p>
                      <p className="text-xs text-gray-600">{selectedService.barklyDealAlignment}</p>
                    </div>
                  )}

                  {selectedService.ctgAlignment && (
                    <div>
                      <p className="text-xs font-medium">Closing the Gap:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedService.ctgAlignment.map((ctg, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ctg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedService.stories && selectedService.stories.length > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-sm mb-2">Community Voice</h4>
                      {selectedService.stories.map((story, i) => (
                        <Card 
                          key={i}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setShowStory(story)}
                        >
                          <CardContent className="p-3">
                            <p className="text-xs italic">"{story.quote}"</p>
                            <p className="text-xs text-gray-500 mt-1">
                              — {story.source}, {story.date}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="data">Key Data</TabsTrigger>
                  <TabsTrigger value="gaps">Gaps</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Youth Roundtable Findings</CardTitle>
                      <CardDescription className="text-xs">April 16, 2025</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p>{keyStats.roundtableYouth} young people participated</p>
                        <p>Average age: {keyStats.avgAge} years</p>
                        <p>{keyStats.indigenousPercent}% Indigenous participants</p>
                        <div className="pt-2">
                          <p className="font-medium">Community Decision:</p>
                          <div className="flex gap-4 mt-1">
                            <Badge variant="default">{keyStats.hubVotes} votes: Hub</Badge>
                            <Badge variant="outline">{keyStats.shelterVotes} votes: Shelter</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm text-amber-900 mb-1">Critical Finding</h3>
                      <p className="text-xs text-amber-800">
                        "{keyStats.nightServicesGap}" - Most youth services close by early evening
                      </p>
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">Click services to explore</h3>
                    <div className="space-y-1">
                      {youthServices.map((service) => (
                        <Card 
                          key={service.id}
                          className="cursor-pointer hover:shadow-md transition-all"
                          onClick={() => setSelectedService(service)}
                        >
                          <CardContent className="p-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getServiceColor(service) }}
                              />
                              <div>
                                <p className="font-medium text-xs">{service.name}</p>
                                <p className="text-xs text-gray-500">{service.type}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {service.youthServed || 'Planned'}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Overcrowding Impact</CardTitle>
                      <CardDescription className="text-xs">2021 Census Data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Ages 10-14</span>
                          <span className="font-medium">{keyStats.overcrowding1014}%</span>
                        </div>
                        <Progress value={keyStats.overcrowding1014} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Ages 15-19</span>
                          <span className="font-medium">{keyStats.overcrowding1519}%</span>
                        </div>
                        <Progress value={keyStats.overcrowding1519} className="h-2" />
                      </div>
                      <p className="text-xs text-gray-600 pt-2">
                        Youth in overcrowded housing are more likely to be on streets at night
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Service Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total youth served:</span>
                          <span className="font-medium">
                            {youthServices.reduce((sum, s) => sum + s.youthServed, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active services:</span>
                          <span className="font-medium">
                            {youthServices.filter(s => s.status === 'active').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>24/7 services:</span>
                          <span className="font-medium text-red-600">1</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="gaps" className="space-y-3">
                  {Object.entries(youthPriorities).map(([priority, config]) => {
                    const Icon = config.icon;
                    return (
                      <Card key={priority}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: config.color }} />
                            {priority}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-gray-600 mb-2">{config.description}</p>
                          <div className="space-y-1">
                            {config.gaps.map((gap, i) => (
                              <div key={i} className="flex items-start gap-1">
                                <span className="text-red-500 text-xs">•</span>
                                <span className="text-xs">{gap}</span>
                              </div>
                            ))}
                          </div>
                          {config.ctgTarget && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium">CTG Target:</p>
                              <p className="text-xs text-gray-600">{config.ctgTarget}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>

        {/* Story Modal */}
        {showStory && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Community Voice</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowStory(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="border-l-4 border-orange-500 pl-4">
                  <p className="italic text-gray-700">"{showStory.quote}"</p>
                  <footer className="text-sm text-gray-500 mt-2">
                    — {showStory.source}, {showStory.date}
                  </footer>
                </blockquote>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}