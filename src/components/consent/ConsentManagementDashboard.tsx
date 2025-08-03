'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Bell
} from 'lucide-react';

interface ConsentRecord {
  id: string;
  contentId: string;
  contentType: string;
  consentType: string;
  grantor: string;
  grantorRole: string;
  consentScope: string[];
  permissions: {
    canShare: boolean;
    canModify: boolean;
    canRepublish: boolean;
    canUseForResearch: boolean;
    canUseCommercially: boolean;
  };
  restrictions: string[];
  expiryDate?: Date;
  status: string;
  grantedAt: Date;
  communityId?: string;
}

interface CollectiveConsent {
  id: string;
  contentId: string;
  collectiveType: string;
  collectiveName: string;
  authorizedRepresentatives: string[];
  consentDecision: string;
  conditions: string[];
  decisionDate: Date;
  validUntil?: Date;
  communityId: string;
}

interface ConsentTemplate {
  id: string;
  templateName: string;
  contentType: string;
  defaultPermissions: any;
  requiredFields: string[];
  culturalConsiderations: string[];
  expiryPeriod?: number;
  requiresWitness: boolean;
  requiresCulturalAuthority: boolean;
}

interface ConsentManagementDashboardProps {
  userRole: 'admin' | 'moderator' | 'community_leader' | 'elder';
  userId: string;
  communityId?: string;
}

export default function ConsentManagementDashboard({ 
  userRole, 
  userId, 
  communityId 
}: ConsentManagementDashboardProps) {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [collectiveConsents, setCollectiveConsents] = useState<CollectiveConsent[]>([]);
  const [consentTemplates, setConsentTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [showNewConsentForm, setShowNewConsentForm] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  // Form states
  const [newConsentForm, setNewConsentForm] = useState({
    contentId: '',
    contentType: 'story',
    consentType: 'individual',
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
    requiresWitness: false,
    culturalAuthority: ''
  });

  useEffect(() => {
    loadConsentData();
  }, [communityId]);

  const loadConsentData = async () => {
    setLoading(true);
    try {
      // Load consent records, collective consents, templates, and statistics
      // This would integrate with the consent management service
      await Promise.all([
        loadConsentRecords(),
        loadCollectiveConsents(),
        loadConsentTemplates(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading consent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConsentRecords = async () => {
    // Mock data - would integrate with actual service
    setConsentRecords([
      {
        id: '1',
        contentId: 'story-123',
        contentType: 'story',
        consentType: 'individual',
        grantor: 'Mary Johnson',
        grantorRole: 'Story Contributor',
        consentScope: ['sharing', 'research'],
        permissions: {
          canShare: true,
          canModify: false,
          canRepublish: true,
          canUseForResearch: true,
          canUseCommercially: false
        },
        restrictions: ['No commercial use', 'Attribution required'],
        expiryDate: new Date('2025-12-31'),
        status: 'active',
        grantedAt: new Date('2024-01-15'),
        communityId: communityId
      }
    ]);
  };

  const loadCollectiveConsents = async () => {
    // Mock data - would integrate with actual service
    setCollectiveConsents([
      {
        id: '1',
        contentId: 'document-456',
        collectiveType: 'community',
        collectiveName: 'Barkly Community Council',
        authorizedRepresentatives: ['Elder Smith', 'Council Chair Jones'],
        consentDecision: 'granted',
        conditions: ['Must include cultural context', 'Review annually'],
        decisionDate: new Date('2024-02-01'),
        validUntil: new Date('2025-02-01'),
        communityId: communityId || ''
      }
    ]);
  };

  const loadConsentTemplates = async () => {
    // Mock data - would integrate with actual service
    setConsentTemplates([
      {
        id: '1',
        templateName: 'Story Sharing Template',
        contentType: 'story',
        defaultPermissions: {
          canShare: true,
          canModify: false,
          canRepublish: false,
          canUseForResearch: true,
          canUseCommercially: false
        },
        requiredFields: ['grantor', 'grantorRole', 'consentScope'],
        culturalConsiderations: ['Respect cultural protocols', 'Ensure appropriate attribution'],
        expiryPeriod: 365,
        requiresWitness: false,
        requiresCulturalAuthority: true
      }
    ]);
  };

  const loadStatistics = async () => {
    // Mock data - would integrate with actual service
    setStatistics({
      totalConsents: 45,
      activeConsents: 38,
      revokedConsents: 3,
      expiredConsents: 4,
      upcomingExpirations: 7,
      consentsByType: {
        individual: 32,
        collective: 8,
        family: 5
      },
      consentsByContent: {
        story: 25,
        document: 12,
        media: 8
      }
    });
  };

  const handleCreateConsent = async () => {
    try {
      // This would integrate with the consent management service
      console.log('Creating consent:', newConsentForm);
      
      // Reset form and reload data
      setNewConsentForm({
        contentId: '',
        contentType: 'story',
        consentType: 'individual',
        grantor: '',
        grantorRole: '',
        consentScope: [],
        permissions: {
          canShare: false,
          canModify: false,
          canRepublish: false,
          canUseForResearch: false,
          canUseCommercially: false
        },
        restrictions: [],
        expiryDays: undefined,
        requiresWitness: false,
        culturalAuthority: ''
      });
      setShowNewConsentForm(false);
      await loadConsentData();
    } catch (error) {
      console.error('Error creating consent:', error);
    }
  };

  const handleRevokeConsent = async (consentId: string, reason: string) => {
    try {
      // This would integrate with the consent management service
      console.log('Revoking consent:', consentId, reason);
      await loadConsentData();
    } catch (error) {
      console.error('Error revoking consent:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      revoked: { color: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatPermissions = (permissions: any) => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key.replace('can', '').toLowerCase());
    
    return activePermissions.length > 0 ? activePermissions.join(', ') : 'No permissions';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading consent data...</p>
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
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Consent Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage cultural content consent and permissions
          </p>
        </div>
        <Button 
          onClick={() => setShowNewConsentForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Consent
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Consents</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalConsents}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Consents</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.activeConsents}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.upcomingExpirations}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collective Consents</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.consentsByType.collective || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">Individual Consents</TabsTrigger>
          <TabsTrigger value="collective">Collective Consents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Individual Consents Tab */}
        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Individual Consent Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consentRecords.map((consent) => (
                  <div key={consent.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {consent.grantor} ({consent.grantorRole})
                          </h4>
                          {getStatusBadge(consent.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Content:</strong> {consent.contentType} ({consent.contentId})</p>
                            <p><strong>Type:</strong> {consent.consentType}</p>
                            <p><strong>Scope:</strong> {consent.consentScope.join(', ')}</p>
                          </div>
                          <div>
                            <p><strong>Permissions:</strong> {formatPermissions(consent.permissions)}</p>
                            <p><strong>Granted:</strong> {consent.grantedAt.toLocaleDateString()}</p>
                            {consent.expiryDate && (
                              <p><strong>Expires:</strong> {consent.expiryDate.toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>

                        {consent.restrictions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Restrictions:</strong> {consent.restrictions.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConsent(consent)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {consent.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeConsent(consent.id, 'User requested revocation')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {consentRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No individual consent records found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collective Consents Tab */}
        <TabsContent value="collective">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Collective Consent Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectiveConsents.map((consent) => (
                  <div key={consent.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {consent.collectiveName}
                          </h4>
                          {getStatusBadge(consent.consentDecision)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Content:</strong> {consent.contentId}</p>
                            <p><strong>Type:</strong> {consent.collectiveType}</p>
                            <p><strong>Representatives:</strong> {consent.authorizedRepresentatives.join(', ')}</p>
                          </div>
                          <div>
                            <p><strong>Decision Date:</strong> {consent.decisionDate.toLocaleDateString()}</p>
                            {consent.validUntil && (
                              <p><strong>Valid Until:</strong> {consent.validUntil.toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>

                        {consent.conditions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Conditions:</strong> {consent.conditions.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {collectiveConsents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No collective consent records found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Consent Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consentTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {template.templateName}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Content Type:</strong> {template.contentType}</p>
                            <p><strong>Expiry Period:</strong> {template.expiryPeriod} days</p>
                            <p><strong>Requires Witness:</strong> {template.requiresWitness ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p><strong>Cultural Authority:</strong> {template.requiresCulturalAuthority ? 'Required' : 'Optional'}</p>
                            <p><strong>Required Fields:</strong> {template.requiredFields.join(', ')}</p>
                          </div>
                        </div>

                        {template.culturalConsiderations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Cultural Considerations:</strong> {template.culturalConsiderations.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Consent Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Audit trail functionality coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Consent Form Modal */}
      {showNewConsentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Consent</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewConsentForm(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content ID
                    </label>
                    <Input
                      value={newConsentForm.contentId}
                      onChange={(e) => setNewConsentForm({
                        ...newConsentForm,
                        contentId: e.target.value
                      })}
                      placeholder="Enter content ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Type
                    </label>
                    <Select
                      value={newConsentForm.contentType}
                      onValueChange={(value) => setNewConsentForm({
                        ...newConsentForm,
                        contentType: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grantor Name
                    </label>
                    <Input
                      value={newConsentForm.grantor}
                      onChange={(e) => setNewConsentForm({
                        ...newConsentForm,
                        grantor: e.target.value
                      })}
                      placeholder="Enter grantor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grantor Role
                    </label>
                    <Input
                      value={newConsentForm.grantorRole}
                      onChange={(e) => setNewConsentForm({
                        ...newConsentForm,
                        grantorRole: e.target.value
                      })}
                      placeholder="Enter grantor role"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(newConsentForm.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={value}
                          onCheckedChange={(checked) => setNewConsentForm({
                            ...newConsentForm,
                            permissions: {
                              ...newConsentForm.permissions,
                              [key]: checked as boolean
                            }
                          })}
                        />
                        <label className="text-sm text-gray-700">
                          {key.replace('can', 'Can ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restrictions
                  </label>
                  <Textarea
                    placeholder="Enter any restrictions (one per line)"
                    onChange={(e) => setNewConsentForm({
                      ...newConsentForm,
                      restrictions: e.target.value.split('\n').filter(r => r.trim())
                    })}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewConsentForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateConsent}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Consent
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