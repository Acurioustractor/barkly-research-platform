'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Book, 
  AlertTriangle,
  CheckCircle,
  Info,
  Palette,
  Languages
} from 'lucide-react';

interface CulturallyContextualizedInsightProps {
  insight: any;
  communityId: string;
  userRole?: string;
  showOriginal?: boolean;
  onAccessRequest?: (reason: string) => void;
}

interface CulturalContext {
  colorScheme: Record<string, string>;
  culturalSymbols: string[];
  layoutStyle: string;
  accessibilityNotes: string[];
}

interface AccessControl {
  visibility: 'public' | 'community' | 'restricted' | 'sacred';
  requiredPermissions: string[];
  culturalApprovals: string[];
}

interface TraditionalKnowledgeFlags {
  containsTraditionalKnowledge: boolean;
  knowledgeType: string[];
  protectionLevel: string;
  sharingProtocols: string[];
}

export default function CulturallyContextualizedInsight({
  insight,
  communityId,
  userRole,
  showOriginal = false,
  onAccessRequest
}: CulturallyContextualizedInsightProps) {
  const [contextualizedInsight, setContextualizedInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showingOriginal, setShowingOriginal] = useState(showOriginal);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    applyCulturalContext();
  }, [insight, communityId, userRole]);

  const applyCulturalContext = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cultural/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insight,
          communityId,
          userRole
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setContextualizedInsight(result.data);
        
        // Check access permissions
        const accessControl = result.data.accessControl;
        const userHasAccess = checkUserAccess(accessControl, userRole);
        setHasAccess(userHasAccess);
      } else {
        console.error('Failed to apply cultural context:', result.error);
        // Fallback to original insight
        setContextualizedInsight({
          originalInsight: insight,
          contextualizedContent: {
            title: insight.title || '',
            description: insight.description || '',
            culturalFraming: '',
            respectfulLanguage: insight.description || ''
          },
          visualizationContext: {
            colorScheme: 'earth-tones',
            culturalSymbols: [],
            layoutStyle: 'traditional',
            accessibilityNotes: []
          },
          accessControl: {
            visibility: 'public',
            requiredPermissions: [],
            culturalApprovals: []
          },
          traditionalKnowledgeFlags: {
            containsTraditionalKnowledge: false,
            knowledgeType: [],
            protectionLevel: 'none',
            sharingProtocols: []
          }
        });
      }
    } catch (error) {
      console.error('Error applying cultural context:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccess = (accessControl: AccessControl, userRole?: string): boolean => {
    if (accessControl.visibility === 'public') {
      return true;
    }

    if (!userRole) {
      return false;
    }

    // Check role-based access
    const rolePermissions = {
      'admin': ['male_access', 'female_access', 'elder_access', 'initiated_access'],
      'elder': ['elder_access', 'initiated_access'],
      'cultural_authority': ['elder_access', 'initiated_access'],
      'moderator': ['community_access'],
      'community_member': []
    };

    const userPermissions = rolePermissions[userRole as keyof typeof rolePermissions] || [];
    
    return accessControl.requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const config = {
      public: { color: 'bg-green-100 text-green-800', icon: Globe },
      community: { color: 'bg-blue-100 text-blue-800', icon: Users },
      restricted: { color: 'bg-yellow-100 text-yellow-800', icon: Shield },
      sacred: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const { color, icon: Icon } = config[visibility as keyof typeof config] || config.public;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
      </Badge>
    );
  };

  const getProtectionLevelBadge = (level: string) => {
    const config = {
      none: { color: 'bg-gray-100 text-gray-800', icon: Info },
      community: { color: 'bg-blue-100 text-blue-800', icon: Users },
      sacred: { color: 'bg-red-100 text-red-800', icon: Shield }
    };

    const { color, icon: Icon } = config[level as keyof typeof config] || config.none;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        Traditional Knowledge ({level})
      </Badge>
    );
  };

  const getCulturalColorScheme = () => {
    if (!contextualizedInsight?.visualizationContext) {
      return {
        primary: '#8B4513',
        secondary: '#D2691E',
        accent: '#CD853F',
        background: '#F5E6D3',
        text: '#3E2723'
      };
    }

    const { colorScheme } = contextualizedInsight.visualizationContext;
    
    const colorSchemes: Record<string, Record<string, string>> = {
      'earth-tones': {
        primary: '#8B4513',
        secondary: '#D2691E',
        accent: '#CD853F',
        background: '#F5E6D3',
        text: '#3E2723'
      },
      'ochre-red': {
        primary: '#CC5500',
        secondary: '#FF6600',
        accent: '#FF8C42',
        background: '#FFF8DC',
        text: '#8B0000'
      },
      'desert-sand': {
        primary: '#C19A6B',
        secondary: '#DEB887',
        accent: '#F4A460',
        background: '#FDF5E6',
        text: '#8B4513'
      },
      'river-blue': {
        primary: '#4682B4',
        secondary: '#87CEEB',
        accent: '#B0E0E6',
        background: '#F0F8FF',
        text: '#191970'
      }
    };

    return colorSchemes[colorScheme] || colorSchemes['earth-tones'];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Applying cultural context...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Restricted Content
            </h3>
            <p className="text-gray-600 mb-4">
              This content requires special permissions to view based on cultural protocols.
            </p>
            {contextualizedInsight?.accessControl?.requiredPermissions?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Required permissions:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {contextualizedInsight.accessControl.requiredPermissions.map((permission: string) => (
                    <Badge key={permission} variant="outline">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {onAccessRequest && (
              <Button
                onClick={() => onAccessRequest('Request access to restricted cultural content')}
                variant="outline"
              >
                Request Access
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = getCulturalColorScheme();
  const content = showingOriginal 
    ? contextualizedInsight?.originalInsight 
    : contextualizedInsight?.contextualizedContent;

  return (
    <Card 
      className="border-2"
      style={{ 
        borderColor: colors.accent,
        backgroundColor: colors.background 
      }}
    >
      <CardHeader 
        className="pb-3"
        style={{ backgroundColor: colors.primary, color: 'white' }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              {content?.title || 'Untitled Insight'}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {contextualizedInsight?.accessControl && 
                getVisibilityBadge(contextualizedInsight.accessControl.visibility)}
              {contextualizedInsight?.traditionalKnowledgeFlags?.containsTraditionalKnowledge &&
                getProtectionLevelBadge(contextualizedInsight.traditionalKnowledgeFlags.protectionLevel)}
            </div>
          </div>
          
          <div className="flex space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowingOriginal(!showingOriginal)}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              {showingOriginal ? (
                <>
                  <Globe className="w-4 h-4 mr-1" />
                  Cultural View
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Original
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6" style={{ color: colors.text }}>
        {/* Cultural Framing */}
        {!showingOriginal && content?.culturalFraming && (
          <div 
            className="mb-4 p-3 rounded-lg border-l-4"
            style={{ 
              backgroundColor: colors.secondary + '20',
              borderLeftColor: colors.secondary 
            }}
          >
            <div className="flex items-start">
              <Book className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors.secondary }} />
              <div>
                <p className="text-sm font-medium mb-1">Cultural Context</p>
                <p className="text-sm">{content.culturalFraming}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mb-4">
          <p className="text-base leading-relaxed">
            {showingOriginal ? content?.description : content?.respectfulLanguage}
          </p>
        </div>

        {/* Traditional Perspective */}
        {!showingOriginal && content?.traditionalPerspective && (
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ backgroundColor: colors.accent + '20' }}
          >
            <div className="flex items-start">
              <Users className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors.accent }} />
              <div>
                <p className="text-sm font-medium mb-1">Traditional Perspective</p>
                <p className="text-sm">{content.traditionalPerspective}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cultural Symbols */}
        {contextualizedInsight?.visualizationContext?.culturalSymbols?.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Palette className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
              <span className="text-sm font-medium">Cultural Elements</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualizedInsight.visualizationContext.culturalSymbols.map((symbol: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  style={{ borderColor: colors.accent, color: colors.text }}
                >
                  {symbol}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Applied Lenses */}
        {contextualizedInsight?.appliedLenses?.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Eye className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
              <span className="text-sm font-medium">Applied Cultural Lenses</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualizedInsight.appliedLenses.map((lens: any) => (
                <Badge 
                  key={lens.id} 
                  variant="outline"
                  style={{ borderColor: colors.secondary, color: colors.text }}
                >
                  {lens.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Traditional Knowledge Protocols */}
        {contextualizedInsight?.traditionalKnowledgeFlags?.sharingProtocols?.length > 0 && (
          <div 
            className="mb-4 p-3 rounded-lg border"
            style={{ 
              backgroundColor: colors.background,
              borderColor: colors.primary 
            }}
          >
            <div className="flex items-start">
              <Shield className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors.primary }} />
              <div>
                <p className="text-sm font-medium mb-2">Sharing Protocols</p>
                <ul className="text-sm space-y-1">
                  {contextualizedInsight.traditionalKnowledgeFlags.sharingProtocols.map((protocol: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{protocol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility Notes */}
        {contextualizedInsight?.visualizationContext?.accessibilityNotes?.length > 0 && (
          <div className="mt-4 pt-3 border-t" style={{ borderColor: colors.accent }}>
            <div className="flex items-center mb-2">
              <Info className="w-4 h-4 mr-2" style={{ color: colors.secondary }} />
              <span className="text-sm font-medium">Cultural Considerations</span>
            </div>
            <ul className="text-sm space-y-1">
              {contextualizedInsight.visualizationContext.accessibilityNotes.map((note: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}