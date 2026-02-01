'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/core/Alert';
import {
  Eye,
  Ear,
  Keyboard,
  MousePointer,
  Type,
  Palette,
  Volume2,
  Settings,
  Check,
  AlertTriangle,
  Info,
  Globe,
  Users,
  Heart,
  Zap,
  Monitor,
  Smartphone
} from 'lucide-react';
import { accessibilityService, AccessibilityPreferences } from '@/lib/community/accessibility-service';

interface AccessibilityControlsProps {
  userId: string;
  onPreferencesChange?: (preferences: AccessibilityPreferences) => void;
  className?: string;
}

export default function AccessibilityControls({
  userId,
  onPreferencesChange,
  className = ''
}: AccessibilityControlsProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPrefs = await accessibilityService.loadUserPreferences(userId);

      if (userPrefs) {
        setPreferences(userPrefs);
      } else {
        // Create default preferences
        const defaultPrefs: AccessibilityPreferences = {
          userId,
          highContrast: false,
          reducedMotion: false,
          largeText: false,
          screenReader: false,
          keyboardNavigation: false,
          audioDescriptions: false,
          captionsEnabled: false,
          colorBlindnessType: 'none',
          fontSize: 'medium',
          language: 'en',
          culturalAccessibility: {
            preferredLanguage: 'en',
            culturalContext: 'general',
            traditionalInterface: false,
            elderFriendlyMode: false,
            youthMode: false
          },
          assistiveTechnology: {
            voiceControl: false,
            switchNavigation: false,
            eyeTracking: false
          }
        };
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: AccessibilityPreferences) => {
    try {
      setSaving(true);
      await accessibilityService.saveUserPreferences(newPreferences);
      setPreferences(newPreferences);
      onPreferencesChange?.(newPreferences);

      // Announce change to screen readers
      accessibilityService.announceToScreenReader(
        'Accessibility preferences have been saved',
        'polite'
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      accessibilityService.announceToScreenReader(
        'Error saving accessibility preferences',
        'assertive'
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: value };

    if (previewMode) {
      // Apply immediately for preview
      setPreferences(newPreferences);
      accessibilityService.saveUserPreferences(newPreferences);
    } else {
      setPreferences(newPreferences);
    }
  };

  const updateCulturalPreference = <K extends keyof AccessibilityPreferences['culturalAccessibility']>(
    key: K,
    value: AccessibilityPreferences['culturalAccessibility'][K]
  ) => {
    if (!preferences) return;

    const newCulturalPrefs = { ...preferences.culturalAccessibility, [key]: value };
    updatePreference('culturalAccessibility', newCulturalPrefs);
  };

  const updateAssistiveTechPreference = <K extends keyof AccessibilityPreferences['assistiveTechnology']>(
    key: K,
    value: AccessibilityPreferences['assistiveTechnology'][K]
  ) => {
    if (!preferences) return;

    const newAssistiveTechPrefs = { ...preferences.assistiveTechnology, [key]: value };
    updatePreference('assistiveTechnology', newAssistiveTechPrefs);
  };

  const resetToDefaults = () => {
    if (!preferences) return;

    const defaultPrefs: AccessibilityPreferences = {
      ...preferences,
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: false,
      audioDescriptions: false,
      captionsEnabled: false,
      colorBlindnessType: 'none',
      fontSize: 'medium',
      culturalAccessibility: {
        ...preferences.culturalAccessibility,
        traditionalInterface: false,
        elderFriendlyMode: false,
        youthMode: false
      },
      assistiveTechnology: {
        voiceControl: false,
        switchNavigation: false,
        eyeTracking: false
      }
    };

    setPreferences(defaultPrefs);
  };

  const applyPreset = (preset: 'low-vision' | 'motor-impairment' | 'cognitive' | 'elder-friendly' | 'youth') => {
    if (!preferences) return;

    let presetPrefs = { ...preferences };

    switch (preset) {
      case 'low-vision':
        presetPrefs = {
          ...presetPrefs,
          highContrast: true,
          largeText: true,
          fontSize: 'extra-large',
          screenReader: true,
          audioDescriptions: true
        };
        break;
      case 'motor-impairment':
        presetPrefs = {
          ...presetPrefs,
          keyboardNavigation: true,
          reducedMotion: true,
          assistiveTechnology: {
            ...presetPrefs.assistiveTechnology,
            switchNavigation: true,
            voiceControl: true
          }
        };
        break;
      case 'cognitive':
        presetPrefs = {
          ...presetPrefs,
          reducedMotion: true,
          fontSize: 'large',
          culturalAccessibility: {
            ...presetPrefs.culturalAccessibility,
            traditionalInterface: true
          }
        };
        break;
      case 'elder-friendly':
        presetPrefs = {
          ...presetPrefs,
          largeText: true,
          fontSize: 'large',
          reducedMotion: true,
          culturalAccessibility: {
            ...presetPrefs.culturalAccessibility,
            elderFriendlyMode: true,
            traditionalInterface: true
          }
        };
        break;
      case 'youth':
        presetPrefs = {
          ...presetPrefs,
          culturalAccessibility: {
            ...presetPrefs.culturalAccessibility,
            youthMode: true
          }
        };
        break;
    }

    setPreferences(presetPrefs);
  };

  if (loading || !preferences) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading accessibility preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Accessibility Settings</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Live Preview</span>
              <Switch
                checked={previewMode}
                onCheckedChange={setPreviewMode}
                aria-label="Enable live preview of accessibility changes"
              />
            </div>
            <Button
              onClick={() => savePreferences(preferences)}
              disabled={saving}
              size="sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Customize your experience to meet your accessibility needs and cultural preferences.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Quick Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('low-vision')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Eye className="h-4 w-4 mb-1" />
              <span className="text-xs">Low Vision</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('motor-impairment')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Keyboard className="h-4 w-4 mb-1" />
              <span className="text-xs">Motor</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('cognitive')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Zap className="h-4 w-4 mb-1" />
              <span className="text-xs">Cognitive</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('elder-friendly')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Heart className="h-4 w-4 mb-1" />
              <span className="text-xs">Elder</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('youth')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Users className="h-4 w-4 mb-1" />
              <span className="text-xs">Youth</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visual" className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>Visual</span>
            </TabsTrigger>
            <TabsTrigger value="interaction" className="flex items-center space-x-1">
              <MousePointer className="h-4 w-4" />
              <span>Interaction</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center space-x-1">
              <Volume2 className="h-4 w-4" />
              <span>Audio</span>
            </TabsTrigger>
            <TabsTrigger value="cultural" className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <span>Cultural</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">High Contrast Mode</label>
                <p className="text-xs text-gray-600">
                  Increases contrast between text and background colors
                </p>
              </div>
              <Switch
                checked={preferences.highContrast}
                onCheckedChange={(checked: boolean) => updatePreference('highContrast', checked)}
                aria-describedby="high-contrast-description"
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Large Text</label>
                <p className="text-xs text-gray-600">
                  Makes all text larger and easier to read
                </p>
              </div>
              <Switch
                checked={preferences.largeText}
                onCheckedChange={(checked: boolean) => updatePreference('largeText', checked)}
              />
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Font Size</label>
              <Select
                value={preferences.fontSize}
                onValueChange={(value: any) => updatePreference('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Blindness Support */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color Vision Support</label>
              <Select
                value={preferences.colorBlindnessType}
                onValueChange={(value: any) => updatePreference('colorBlindnessType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Color Vision Issues</SelectItem>
                  <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                  <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                  <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                  <SelectItem value="achromatopsia">Achromatopsia (Complete color blindness)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Reduce Motion</label>
                <p className="text-xs text-gray-600">
                  Minimizes animations and transitions
                </p>
              </div>
              <Switch
                checked={preferences.reducedMotion}
                onCheckedChange={(checked: boolean) => updatePreference('reducedMotion', checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="interaction" className="space-y-4">
            {/* Keyboard Navigation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Enhanced Keyboard Navigation</label>
                <p className="text-xs text-gray-600">
                  Improves keyboard-only navigation experience
                </p>
              </div>
              <Switch
                checked={preferences.keyboardNavigation}
                onCheckedChange={(checked: boolean) => updatePreference('keyboardNavigation', checked)}
              />
            </div>

            {/* Voice Control */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Voice Control Support</label>
                <p className="text-xs text-gray-600">
                  Enables voice commands for navigation
                </p>
              </div>
              <Switch
                checked={preferences.assistiveTechnology.voiceControl}
                onCheckedChange={(checked: boolean) => updateAssistiveTechPreference('voiceControl', checked)}
              />
            </div>

            {/* Switch Navigation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Switch Navigation</label>
                <p className="text-xs text-gray-600">
                  Support for switch-based input devices
                </p>
              </div>
              <Switch
                checked={preferences.assistiveTechnology.switchNavigation}
                onCheckedChange={(checked: boolean) => updateAssistiveTechPreference('switchNavigation', checked)}
              />
            </div>

            {/* Eye Tracking */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Eye Tracking Support</label>
                <p className="text-xs text-gray-600">
                  Optimizes interface for eye tracking devices
                </p>
              </div>
              <Switch
                checked={preferences.assistiveTechnology.eyeTracking}
                onCheckedChange={(checked: boolean) => updateAssistiveTechPreference('eyeTracking', checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            {/* Screen Reader */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Screen Reader Optimization</label>
                <p className="text-xs text-gray-600">
                  Optimizes content for screen reading software
                </p>
              </div>
              <Switch
                checked={preferences.screenReader}
                onCheckedChange={(checked: boolean) => updatePreference('screenReader', checked)}
              />
            </div>

            {/* Audio Descriptions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Audio Descriptions</label>
                <p className="text-xs text-gray-600">
                  Provides audio descriptions for visual content
                </p>
              </div>
              <Switch
                checked={preferences.audioDescriptions}
                onCheckedChange={(checked: boolean) => updatePreference('audioDescriptions', checked)}
              />
            </div>

            {/* Captions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Captions</label>
                <p className="text-xs text-gray-600">
                  Shows captions for audio and video content
                </p>
              </div>
              <Switch
                checked={preferences.captionsEnabled}
                onCheckedChange={(checked: boolean) => updatePreference('captionsEnabled', checked)}
              />
            </div>

            {/* Screen Reader Type */}
            {preferences.screenReader && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Screen Reader Type (Optional)</label>
                <Select
                  value={preferences.assistiveTechnology.screenReaderType || ''}
                  onValueChange={(value: string) => updateAssistiveTechPreference('screenReaderType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your screen reader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nvda">NVDA</SelectItem>
                    <SelectItem value="jaws">JAWS</SelectItem>
                    <SelectItem value="voiceover">VoiceOver</SelectItem>
                    <SelectItem value="talkback">TalkBack</SelectItem>
                    <SelectItem value="orca">Orca</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cultural" className="space-y-4">
            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Language</label>
              <Select
                value={preferences.culturalAccessibility.preferredLanguage}
                onValueChange={(value: string) => updateCulturalPreference('preferredLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cultural Context */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cultural Context</label>
              <Select
                value={preferences.culturalAccessibility.culturalContext}
                onValueChange={(value: string) => updateCulturalPreference('culturalContext', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="indigenous">Indigenous</SelectItem>
                  <SelectItem value="rural">Rural Community</SelectItem>
                  <SelectItem value="urban">Urban Community</SelectItem>
                  <SelectItem value="multicultural">Multicultural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Traditional Interface */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Traditional Interface</label>
                <p className="text-xs text-gray-600">
                  Uses familiar, traditional design patterns
                </p>
              </div>
              <Switch
                checked={preferences.culturalAccessibility.traditionalInterface}
                onCheckedChange={(checked: boolean) => updateCulturalPreference('traditionalInterface', checked)}
              />
            </div>

            {/* Elder Friendly Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Elder-Friendly Mode</label>
                <p className="text-xs text-gray-600">
                  Optimized for older adults with simplified navigation
                </p>
              </div>
              <Switch
                checked={preferences.culturalAccessibility.elderFriendlyMode}
                onCheckedChange={(checked: boolean) => updateCulturalPreference('elderFriendlyMode', checked)}
              />
            </div>

            {/* Youth Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Youth Mode</label>
                <p className="text-xs text-gray-600">
                  Optimized interface for younger users
                </p>
              </div>
              <Switch
                checked={preferences.culturalAccessibility.youthMode}
                onCheckedChange={(checked: boolean) => updateCulturalPreference('youthMode', checked)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            size="sm"
          >
            Reset to Defaults
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => savePreferences(preferences)}
              disabled={saving}
              size="sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Accessibility Status */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your accessibility preferences are automatically applied across the platform.
            Changes may take a moment to fully take effect.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card >
  );
}