'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConsentFormProps {
  contentId: string;
  contentType: 'story' | 'document' | 'media' | 'data';
  communityId?: string;
  onConsentGranted?: (consentId: string) => void;
  onCancel?: () => void;
}

interface ConsentTemplate {
  id: string;
  templateName: string;
  contentType: string;
  defaultPermissions: {
    canShare: boolean;
    canModify: boolean;
    canRepublish: boolean;
    canUseForResearch: boolean;
    canUseCommercially: boolean;
  };
  requiredFields: string[];
  culturalConsiderations: string[];
  recommendedRestrictions: string[];
  expiryPeriod?: number;
  requiresWitness: boolean;
  requiresCulturalAuthority: boolean;
}

export default function ConsentForm({
  contentId,
  contentType,
  communityId,
  onConsentGranted,
  onCancel
}: ConsentFormProps) {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    grantor: '',
    grantorRole: '',
    consentScope: [] as string[],
    permissions: {
      canShare: false,
      canModify: false,
      canRepublish: false,
      canUseForResearch: false,
      canUseCommercially: false
    },
    restrictions: [] as string[],
    expiryDays: undefined as number | undefined,
    culturalAuthority: '',
    witnessedBy: [] as string[],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, [contentType, communityId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/consent/templates?contentType=${contentType}${communityId ? `&communityId=${communityId}` : ''}`);
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
        // Auto-select first template if available
        if (result.data.length > 0) {
          selectTemplate(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: ConsentTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      permissions: { ...template.defaultPermissions },
      restrictions: [...template.recommendedRestrictions],
      expiryDays: template.expiryPeriod
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.grantor.trim()) {
      newErrors.grantor = 'Grantor name is required';
    }

    if (!formData.grantorRole.trim()) {
      newErrors.grantorRole = 'Grantor role is required';
    }

    if (formData.consentScope.length === 0) {
      newErrors.consentScope = 'At least one consent scope must be selected';
    }

    if (selectedTemplate?.requiresWitness && formData.witnessedBy.length === 0) {
      newErrors.witnessedBy = 'Witness is required for this type of consent';
    }

    if (selectedTemplate?.requiresCulturalAuthority && !formData.culturalAuthority.trim()) {
      newErrors.culturalAuthority = 'Cultural authority approval is required';
    }

    // Check if at least one permission is granted
    const hasPermissions = Object.values(formData.permissions).some(p => p);
    if (!hasPermissions) {
      newErrors.permissions = 'At least one permission must be granted';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/consent/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          contentType,
          grantor: formData.grantor,
          grantorRole: formData.grantorRole,
          consentScope: formData.consentScope,
          permissions: formData.permissions,
          restrictions: formData.restrictions,
          expiryDays: formData.expiryDays,
          communityId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        onConsentGranted?.(result.data.consentId);
      } else {
        setErrors({ submit: result.error || 'Failed to create consent record' });
      }
    } catch (error) {
      console.error('Error submitting consent:', error);
      setErrors({ submit: 'Failed to submit consent form' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScopeChange = (scope: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      consentScope: checked 
        ? [...prev.consentScope, scope]
        : prev.consentScope.filter(s => s !== scope)
    }));
  };

  const handlePermissionChange = (permission: keyof typeof formData.permissions, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }));
  };

  const handleRestrictionsChange = (value: string) => {
    const restrictions = value.split('\n').filter(r => r.trim());
    setFormData(prev => ({
      ...prev,
      restrictions
    }));
  };

  const handleWitnessChange = (value: string) => {
    const witnesses = value.split('\n').filter(w => w.trim());
    setFormData(prev => ({
      ...prev,
      witnessedBy: witnesses
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading consent templates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          Content Consent Form
        </CardTitle>
        <p className="text-sm text-gray-600">
          Grant consent for the use of content: {contentType} ({contentId})
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consent Template
              </label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) selectTemplate(template);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a consent template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cultural Considerations */}
          {selectedTemplate?.culturalConsiderations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Cultural Considerations
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {selectedTemplate.culturalConsiderations.map((consideration, index) => (
                      <li key={index}>• {consideration}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Grantor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grantor Name *
              </label>
              <Input
                value={formData.grantor}
                onChange={(e) => setFormData(prev => ({ ...prev, grantor: e.target.value }))}
                placeholder="Enter your full name"
                className={errors.grantor ? 'border-red-500' : ''}
              />
              {errors.grantor && (
                <p className="text-sm text-red-600 mt-1">{errors.grantor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role/Relationship *
              </label>
              <Input
                value={formData.grantorRole}
                onChange={(e) => setFormData(prev => ({ ...prev, grantorRole: e.target.value }))}
                placeholder="e.g., Story contributor, Elder, Community member"
                className={errors.grantorRole ? 'border-red-500' : ''}
              />
              {errors.grantorRole && (
                <p className="text-sm text-red-600 mt-1">{errors.grantorRole}</p>
              )}
            </div>
          </div>

          {/* Consent Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consent Scope *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['sharing', 'research', 'education', 'preservation', 'community_use', 'public_display'].map((scope) => (
                <div key={scope} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.consentScope.includes(scope)}
                    onCheckedChange={(checked) => handleScopeChange(scope, checked as boolean)}
                  />
                  <label className="text-sm text-gray-700 capitalize">
                    {scope.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
            {errors.consentScope && (
              <p className="text-sm text-red-600 mt-1">{errors.consentScope}</p>
            )}
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions *
            </label>
            <div className="space-y-2">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={value}
                    onCheckedChange={(checked) => handlePermissionChange(key as keyof typeof formData.permissions, checked as boolean)}
                  />
                  <label className="text-sm text-gray-700">
                    {key.replace('can', 'Can ').replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                </div>
              ))}
            </div>
            {errors.permissions && (
              <p className="text-sm text-red-600 mt-1">{errors.permissions}</p>
            )}
          </div>

          {/* Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restrictions
            </label>
            <Textarea
              value={formData.restrictions.join('\n')}
              onChange={(e) => handleRestrictionsChange(e.target.value)}
              placeholder="Enter any restrictions (one per line)"
              rows={3}
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consent Expiry (days)
            </label>
            <Input
              type="number"
              value={formData.expiryDays || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                expiryDays: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Leave empty for no expiry"
            />
          </div>

          {/* Cultural Authority (if required) */}
          {selectedTemplate?.requiresCulturalAuthority && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cultural Authority *
              </label>
              <Input
                value={formData.culturalAuthority}
                onChange={(e) => setFormData(prev => ({ ...prev, culturalAuthority: e.target.value }))}
                placeholder="Name of cultural authority providing approval"
                className={errors.culturalAuthority ? 'border-red-500' : ''}
              />
              {errors.culturalAuthority && (
                <p className="text-sm text-red-600 mt-1">{errors.culturalAuthority}</p>
              )}
            </div>
          )}

          {/* Witnesses (if required) */}
          {selectedTemplate?.requiresWitness && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Witnesses *
              </label>
              <Textarea
                value={formData.witnessedBy.join('\n')}
                onChange={(e) => handleWitnessChange(e.target.value)}
                placeholder="Enter witness names (one per line)"
                rows={2}
                className={errors.witnessedBy ? 'border-red-500' : ''}
              />
              {errors.witnessedBy && (
                <p className="text-sm text-red-600 mt-1">{errors.witnessedBy}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information or context"
              rows={3}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Grant Consent
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}