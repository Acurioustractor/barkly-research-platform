'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Languages, 
  Shield, 
  Eye, 
  Settings,
  Plus,
  Edit,
  Save,
  AlertTriangle,
  CheckCircle,
  Globe,
  Users,
  Book
} from 'lucide-react';

interface CulturalContext {
  id: string;
  communityId: string;
  languageGroup: string;
  traditionalName: string;
  culturalProtocols: string[];
  sacredSites: string[];
  culturalPractices: string[];
  storytellingProtocols: string[];
  knowledgeKeepers: string[];
  seasonalConsiderations: string[];
  genderProtocols: string[];
  ageGroupProtocols: string[];
  visualizationPreferences: {
    colorScheme: string;
    symbolism: string[];
    avoidedSymbols: string[];
    preferredLayouts: string[];
  };
  languagePreferences: {
    primaryLanguage: string;
    secondaryLanguages: string[];
    culturalTerms: Record<string, string>;
    avoidedTerms: string[];
  };
  accessRestrictions: {
    menOnly: string[];
    womenOnly: string[];
    eldersOnly: string[];
    initiatedOnly: string[];
    communityOnly: string[];
  };
}

interface CulturalLens {
  id: string;
  name: string;
  description: string;
  communityId: string;
  filterCriteria: {
    contentTypes: string[];
    themes: string[];
    sensitivity: string;
    requiredApprovals: string[];
  };
  transformationRules: {
    terminology: Record<string, string>;
    contextualFraming: string[];
    culturalNarrative: string;
    respectfulPresentation: string[];
  };
  visualizationRules: {
    colorMappings: Record<string, string>;
    symbolReplacements: Record<string, string>;
    layoutPreferences: string[];
    culturalElements: string[];
  };
  isActive: boolean;
}

interface CulturalContextManagerProps {
  communityId: string;
  userRole: 'admin' | 'elder' | 'cultural_authority' | 'moderator';
  onContextUpdated?: () => void;
}

export default function CulturalContextManager({
  communityId,
  userRole,
  onContextUpdated
}: CulturalContextManagerProps) {
  const [culturalContext, setCulturalContext] = useState<CulturalContext | null>(null);
  const [culturalLenses, setCulturalLenses] = useState<CulturalLens[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('context');
  const [editingLens, setEditingLens] = useState<CulturalLens | null>(null);
  const [showNewLensForm, setShowNewLensForm] = useState(false);

  // Form states
  const [contextForm, setContextForm] = useState<Partial<CulturalContext>>({});
  const [lensForm, setLensForm] = useState<Partial<CulturalLens>>({
    name: '',
    description: '',
    filterCriteria: {
      contentTypes: [],
      themes: [],
      sensitivity: 'public',
      requiredApprovals: []
    },
    transformationRules: {
      terminology: {},
      contextualFraming: [],
      culturalNarrative: '',
      respectfulPresentation: []
    },
    visualizationRules: {
      colorMappings: {},
      symbolReplacements: {},
      layoutPreferences: [],
      culturalElements: []
    },
    isActive: true
  });

  useEffect(() => {
    loadCulturalData();
  }, [communityId]);

  const loadCulturalData = async () => {
    setLoading(true);
    try {
      // Mock data - would integrate with actual API
      const mockContext: CulturalContext = {
        id: '1',
        communityId,
        languageGroup: 'Warumungu',
        traditionalName: 'Warumungu Country',
        culturalProtocols: ['Respect for elders', 'Permission for sacred sites', 'Gender-appropriate sharing'],
        sacredSites: ['Tennant Creek', 'Devil\'s Marbles', 'Sacred water holes'],
        culturalPractices: ['Traditional hunting', 'Ceremony', 'Dreamtime stories', 'Bush medicine'],
        storytellingProtocols: ['Elder approval required', 'Seasonal restrictions apply', 'Gender-specific stories'],
        knowledgeKeepers: ['Elder Mary', 'Uncle Jim', 'Aunty Sarah'],
        seasonalConsiderations: ['Wet season ceremonies', 'Dry season hunting'],
        genderProtocols: ['Men\'s business', 'Women\'s business', 'Mixed gatherings'],
        ageGroupProtocols: ['Children\'s stories', 'Adult knowledge', 'Elder wisdom'],
        visualizationPreferences: {
          colorScheme: 'earth-tones',
          symbolism: ['boomerang', 'tracks', 'water'],
          avoidedSymbols: ['sacred symbols'],
          preferredLayouts: ['circular', 'traditional']
        },
        languagePreferences: {
          primaryLanguage: 'English',
          secondaryLanguages: ['Warumungu'],
          culturalTerms: {
            'country': 'Country',
            'community': 'mob',
            'elder': 'Old People',
            'story': 'yarn'
          },
          avoidedTerms: ['primitive', 'tribe']
        },
        accessRestrictions: {
          menOnly: ['men\'s ceremony', 'hunting knowledge'],
          womenOnly: ['women\'s ceremony', 'birthing knowledge'],
          eldersOnly: ['sacred law', 'deep knowledge'],
          initiatedOnly: ['ceremony details', 'sacred sites'],
          communityOnly: ['internal matters', 'family business']
        }
      };

      const mockLenses: CulturalLens[] = [
        {
          id: '1',
          name: 'Traditional Knowledge Lens',
          description: 'Applies traditional knowledge protocols and respectful language',
          communityId,
          filterCriteria: {
            contentTypes: ['insight', 'analysis', 'story'],
            themes: ['cultural', 'traditional', 'ceremony'],
            sensitivity: 'community',
            requiredApprovals: ['elder_review']
          },
          transformationRules: {
            terminology: {
              'aboriginal': 'First Nations',
              'tribe': 'community',
              'primitive': 'traditional'
            },
            contextualFraming: ['From a traditional perspective', 'According to cultural knowledge'],
            culturalNarrative: 'This insight reflects traditional knowledge and should be understood within cultural context',
            respectfulPresentation: ['Acknowledge traditional owners', 'Respect cultural protocols']
          },
          visualizationRules: {
            colorMappings: { 'primary': 'earth-tones' },
            symbolReplacements: {},
            layoutPreferences: ['circular', 'traditional'],
            culturalElements: ['traditional-border', 'cultural-symbols']
          },
          isActive: true
        }
      ];

      setCulturalContext(mockContext);
      setContextForm(mockContext);
      setCulturalLenses(mockLenses);
    } catch (error) {
      console.error('Error loading cultural data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContext = async () => {
    setSaving(true);
    try {
      // This would integrate with the cultural context service
      console.log('Saving cultural context:', contextForm);
      
      // Update local state
      if (contextForm.id) {
        setCulturalContext(contextForm as CulturalContext);
      }
      
      onContextUpdated?.();
    } catch (error) {
      console.error('Error saving cultural context:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLens = async () => {
    setSaving(true);
    try {
      // This would integrate with the cultural context service
      console.log('Saving cultural lens:', lensForm);
      
      if (editingLens) {
        // Update existing lens
        setCulturalLenses(prev => 
          prev.map(lens => lens.id === editingLens.id ? { ...lensForm as CulturalLens } : lens)
        );
      } else {
        // Add new lens
        const newLens = {
          ...lensForm,
          id: Date.now().toString(),
          communityId
        } as CulturalLens;
        setCulturalLenses(prev => [...prev, newLens]);
      }
      
      setEditingLens(null);
      setShowNewLensForm(false);
      setLensForm({
        name: '',
        description: '',
        filterCriteria: {
          contentTypes: [],
          themes: [],
          sensitivity: 'public',
          requiredApprovals: []
        },
        transformationRules: {
          terminology: {},
          contextualFraming: [],
          culturalNarrative: '',
          respectfulPresentation: []
        },
        visualizationRules: {
          colorMappings: {},
          symbolReplacements: {},
          layoutPreferences: [],
          culturalElements: []
        },
        isActive: true
      });
    } catch (error) {
      console.error('Error saving cultural lens:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditLens = (lens: CulturalLens) => {
    setEditingLens(lens);
    setLensForm(lens);
    setShowNewLensForm(true);
  };

  const updateArrayField = (
    field: keyof CulturalContext,
    value: string,
    action: 'add' | 'remove'
  ) => {
    setContextForm(prev => {
      const currentArray = (prev[field] as string[]) || [];
      const newArray = action === 'add' 
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const updateObjectField = (
    parentField: keyof CulturalContext,
    childField: string,
    value: any
  ) => {
    setContextForm(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any),
        [childField]: value
      }
    }));
  };

  const colorSchemeOptions = [
    { value: 'earth-tones', label: 'Earth Tones', colors: ['#8B4513', '#D2691E', '#CD853F'] },
    { value: 'ochre-red', label: 'Ochre Red', colors: ['#CC5500', '#FF6600', '#FF8C42'] },
    { value: 'desert-sand', label: 'Desert Sand', colors: ['#C19A6B', '#DEB887', '#F4A460'] },
    { value: 'river-blue', label: 'River Blue', colors: ['#4682B4', '#87CEEB', '#B0E0E6'] }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cultural context...</p>
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
            <Globe className="w-6 h-6 mr-2 text-blue-600" />
            Cultural Context Management
          </h2>
          <p className="text-gray-600 mt-1">
            Configure cultural context and intelligence filtering for the community
          </p>
        </div>
        <Button 
          onClick={handleSaveContext}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Context
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="context">Cultural Context</TabsTrigger>
          <TabsTrigger value="language">Language & Terms</TabsTrigger>
          <TabsTrigger value="visual">Visual Elements</TabsTrigger>
          <TabsTrigger value="lenses">Cultural Lenses</TabsTrigger>
        </TabsList>

        {/* Cultural Context Tab */}
        <TabsContent value="context" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language Group
                  </label>
                  <Input
                    value={contextForm.languageGroup || ''}
                    onChange={(e) => setContextForm(prev => ({ ...prev, languageGroup: e.target.value }))}
                    placeholder="e.g., Warumungu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Traditional Name
                  </label>
                  <Input
                    value={contextForm.traditionalName || ''}
                    onChange={(e) => setContextForm(prev => ({ ...prev, traditionalName: e.target.value }))}
                    placeholder="e.g., Warumungu Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Knowledge Keepers
                  </label>
                  <Textarea
                    value={contextForm.knowledgeKeepers?.join('\n') || ''}
                    onChange={(e) => setContextForm(prev => ({ 
                      ...prev, 
                      knowledgeKeepers: e.target.value.split('\n').filter(k => k.trim()) 
                    }))}
                    placeholder="Enter knowledge keepers (one per line)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cultural Protocols */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Cultural Protocols
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cultural Protocols
                  </label>
                  <Textarea
                    value={contextForm.culturalProtocols?.join('\n') || ''}
                    onChange={(e) => setContextForm(prev => ({ 
                      ...prev, 
                      culturalProtocols: e.target.value.split('\n').filter(p => p.trim()) 
                    }))}
                    placeholder="Enter cultural protocols (one per line)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storytelling Protocols
                  </label>
                  <Textarea
                    value={contextForm.storytellingProtocols?.join('\n') || ''}
                    onChange={(e) => setContextForm(prev => ({ 
                      ...prev, 
                      storytellingProtocols: e.target.value.split('\n').filter(p => p.trim()) 
                    }))}
                    placeholder="Enter storytelling protocols (one per line)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sacred Sites and Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Sacred Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sacred Sites
                  </label>
                  <Textarea
                    value={contextForm.sacredSites?.join('\n') || ''}
                    onChange={(e) => setContextForm(prev => ({ 
                      ...prev, 
                      sacredSites: e.target.value.split('\n').filter(s => s.trim()) 
                    }))}
                    placeholder="Enter sacred sites (one per line)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cultural Practices
                  </label>
                  <Textarea
                    value={contextForm.culturalPractices?.join('\n') || ''}
                    onChange={(e) => setContextForm(prev => ({ 
                      ...prev, 
                      culturalPractices: e.target.value.split('\n').filter(p => p.trim()) 
                    }))}
                    placeholder="Enter cultural practices (one per line)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Access Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Access Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Men Only Content
                  </label>
                  <Textarea
                    value={contextForm.accessRestrictions?.menOnly?.join('\n') || ''}
                    onChange={(e) => updateObjectField('accessRestrictions', 'menOnly', 
                      e.target.value.split('\n').filter(item => item.trim()))}
                    placeholder="Enter men-only content terms (one per line)"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Women Only Content
                  </label>
                  <Textarea
                    value={contextForm.accessRestrictions?.womenOnly?.join('\n') || ''}
                    onChange={(e) => updateObjectField('accessRestrictions', 'womenOnly', 
                      e.target.value.split('\n').filter(item => item.trim()))}
                    placeholder="Enter women-only content terms (one per line)"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elders Only Content
                  </label>
                  <Textarea
                    value={contextForm.accessRestrictions?.eldersOnly?.join('\n') || ''}
                    onChange={(e) => updateObjectField('accessRestrictions', 'eldersOnly', 
                      e.target.value.split('\n').filter(item => item.trim()))}
                    placeholder="Enter elders-only content terms (one per line)"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Language & Terms Tab */}
        <TabsContent value="language" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Languages className="w-5 h-5 mr-2" />
                  Language Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Language
                  </label>
                  <Input
                    value={contextForm.languagePreferences?.primaryLanguage || ''}
                    onChange={(e) => updateObjectField('languagePreferences', 'primaryLanguage', e.target.value)}
                    placeholder="e.g., English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Languages
                  </label>
                  <Textarea
                    value={contextForm.languagePreferences?.secondaryLanguages?.join('\n') || ''}
                    onChange={(e) => updateObjectField('languagePreferences', 'secondaryLanguages', 
                      e.target.value.split('\n').filter(lang => lang.trim()))}
                    placeholder="Enter secondary languages (one per line)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avoided Terms
                  </label>
                  <Textarea
                    value={contextForm.languagePreferences?.avoidedTerms?.join('\n') || ''}
                    onChange={(e) => updateObjectField('languagePreferences', 'avoidedTerms', 
                      e.target.value.split('\n').filter(term => term.trim()))}
                    placeholder="Enter terms to avoid (one per line)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Terminology</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Map standard terms to culturally appropriate alternatives
                  </p>
                  
                  {Object.entries(contextForm.languagePreferences?.culturalTerms || {}).map(([standard, cultural], index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Input
                        value={standard}
                        onChange={(e) => {
                          const newTerms = { ...contextForm.languagePreferences?.culturalTerms };
                          delete newTerms[standard];
                          newTerms[e.target.value] = cultural;
                          updateObjectField('languagePreferences', 'culturalTerms', newTerms);
                        }}
                        placeholder="Standard term"
                      />
                      <Input
                        value={cultural}
                        onChange={(e) => {
                          const newTerms = { ...contextForm.languagePreferences?.culturalTerms };
                          newTerms[standard] = e.target.value;
                          updateObjectField('languagePreferences', 'culturalTerms', newTerms);
                        }}
                        placeholder="Cultural term"
                      />
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTerms = { ...contextForm.languagePreferences?.culturalTerms, '': '' };
                      updateObjectField('languagePreferences', 'culturalTerms', newTerms);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Term Mapping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visual Elements Tab */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Color Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Color Scheme
                  </label>
                  <div className="space-y-2">
                    {colorSchemeOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          contextForm.visualizationPreferences?.colorScheme === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => updateObjectField('visualizationPreferences', 'colorScheme', option.value)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.label}</span>
                          <div className="flex space-x-1">
                            {option.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Symbols</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appropriate Symbols
                  </label>
                  <Textarea
                    value={contextForm.visualizationPreferences?.symbolism?.join('\n') || ''}
                    onChange={(e) => updateObjectField('visualizationPreferences', 'symbolism', 
                      e.target.value.split('\n').filter(symbol => symbol.trim()))}
                    placeholder="Enter appropriate symbols (one per line)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avoided Symbols
                  </label>
                  <Textarea
                    value={contextForm.visualizationPreferences?.avoidedSymbols?.join('\n') || ''}
                    onChange={(e) => updateObjectField('visualizationPreferences', 'avoidedSymbols', 
                      e.target.value.split('\n').filter(symbol => symbol.trim()))}
                    placeholder="Enter symbols to avoid (one per line)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Layouts
                  </label>
                  <Textarea
                    value={contextForm.visualizationPreferences?.preferredLayouts?.join('\n') || ''}
                    onChange={(e) => updateObjectField('visualizationPreferences', 'preferredLayouts', 
                      e.target.value.split('\n').filter(layout => layout.trim()))}
                    placeholder="Enter preferred layouts (one per line)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cultural Lenses Tab */}
        <TabsContent value="lenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cultural Lenses</h3>
            <Button
              onClick={() => setShowNewLensForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lens
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {culturalLenses.map((lens) => (
              <Card key={lens.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{lens.name}</h4>
                        <Badge variant={lens.isActive ? "default" : "secondary"}>
                          {lens.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{lens.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-gray-700">Content Types:</p>
                          <p className="text-gray-600">{lens.filterCriteria.contentTypes.join(', ') || 'All'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Themes:</p>
                          <p className="text-gray-600">{lens.filterCriteria.themes.join(', ') || 'All'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Sensitivity:</p>
                          <p className="text-gray-600 capitalize">{lens.filterCriteria.sensitivity}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLens(lens)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {culturalLenses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No cultural lenses configured</p>
                <p className="text-sm">Add a lens to start filtering intelligence through cultural context</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New/Edit Lens Modal */}
      {showNewLensForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingLens ? 'Edit Cultural Lens' : 'Create Cultural Lens'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewLensForm(false);
                    setEditingLens(null);
                  }}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lens Name
                    </label>
                    <Input
                      value={lensForm.name || ''}
                      onChange={(e) => setLensForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter lens name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sensitivity Level
                    </label>
                    <Select
                      value={lensForm.filterCriteria?.sensitivity || 'public'}
                      onValueChange={(value) => setLensForm(prev => ({
                        ...prev,
                        filterCriteria: { ...prev.filterCriteria!, sensitivity: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="sacred">Sacred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={lensForm.description || ''}
                    onChange={(e) => setLensForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this lens does"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cultural Narrative
                  </label>
                  <Textarea
                    value={lensForm.transformationRules?.culturalNarrative || ''}
                    onChange={(e) => setLensForm(prev => ({
                      ...prev,
                      transformationRules: {
                        ...prev.transformationRules!,
                        culturalNarrative: e.target.value
                      }
                    }))}
                    placeholder="Enter the cultural narrative or framing"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewLensForm(false);
                      setEditingLens(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveLens}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? 'Saving...' : 'Save Lens'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}