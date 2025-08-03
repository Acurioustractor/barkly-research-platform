'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Keyboard,
  Volume2,
  Palette,
  Code,
  Globe,
  RefreshCw,
  Download,
  ExternalLink,
  Info
} from 'lucide-react';
import { accessibilityService, AccessibilityAudit as AuditType, AccessibilityIssue } from '@/lib/accessibility-service';

interface AccessibilityAuditProps {
  componentId?: string;
  componentName?: string;
  autoRun?: boolean;
  className?: string;
}

export default function AccessibilityAudit({
  componentId,
  componentName = 'Page',
  autoRun = false,
  className = ''
}: AccessibilityAuditProps) {
  const [audit, setAudit] = useState<AuditType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (autoRun && componentId) {
      runAudit();
    }
  }, [componentId, autoRun]);

  const runAudit = async () => {
    if (!componentId) {
      console.warn('No component ID provided for audit');
      return;
    }

    try {
      setLoading(true);
      const auditResult = await accessibilityService.performAccessibilityAudit(
        componentId,
        componentName
      );
      setAudit(auditResult);
    } catch (error) {
      console.error('Error running accessibility audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityIcon = (severity: AccessibilityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: AccessibilityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'color-contrast':
        return <Palette className="h-4 w-4" />;
      case 'keyboard-navigation':
        return <Keyboard className="h-4 w-4" />;
      case 'screen-reader':
        return <Volume2 className="h-4 w-4" />;
      case 'focus-management':
        return <Eye className="h-4 w-4" />;
      case 'semantic-markup':
        return <Code className="h-4 w-4" />;
      case 'cultural-sensitivity':
        return <Globe className="h-4 w-4" />;
    }
  };

  const getWCAGLevel = (level: string) => {
    switch (level) {
      case 'AAA':
        return <Badge className="bg-green-100 text-green-800">WCAG AAA</Badge>;
      case 'AA':
        return <Badge className="bg-blue-100 text-blue-800">WCAG AA</Badge>;
      case 'A':
        return <Badge className="bg-yellow-100 text-yellow-800">WCAG A</Badge>;
      default:
        return <Badge variant="secondary">Not Compliant</Badge>;
    }
  };

  const exportAuditReport = () => {
    if (!audit) return;

    const reportData = {
      component: audit.componentName,
      auditDate: audit.auditDate.toISOString(),
      score: audit.score,
      wcagLevel: audit.wcagLevel,
      issues: audit.issues,
      recommendations: audit.recommendations
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-audit-${audit.componentId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const groupIssuesByType = (issues: AccessibilityIssue[]) => {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = [];
      }
      acc[issue.type].push(issue);
      return acc;
    }, {} as { [key: string]: AccessibilityIssue[] });
  };

  const groupIssuesBySeverity = (issues: AccessibilityIssue[]) => {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) {
        acc[issue.severity] = [];
      }
      acc[issue.severity].push(issue);
      return acc;
    }, {} as { [key: string]: AccessibilityIssue[] });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Accessibility Audit</CardTitle>
            {audit && getWCAGLevel(audit.wcagLevel)}
          </div>
          <div className="flex items-center space-x-2">
            {audit && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportAuditReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
            <Button
              onClick={runAudit}
              disabled={loading || !componentId}
              size="sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Running...' : 'Run Audit'}
            </Button>
          </div>
        </div>
        {audit && (
          <p className="text-sm text-gray-600">
            Last audited: {audit.auditDate.toLocaleString()} • Component: {audit.componentName}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {!componentId && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Provide a component ID to run an accessibility audit on a specific element.
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Running accessibility audit...</span>
          </div>
        )}

        {audit && !loading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Accessibility Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(audit.score)}`}>
                          {audit.score}/100
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${getScoreBackground(audit.score)}`}>
                        {audit.score >= 90 ? (
                          <CheckCircle className={`h-6 w-6 ${getScoreColor(audit.score)}`} />
                        ) : (
                          <AlertTriangle className={`h-6 w-6 ${getScoreColor(audit.score)}`} />
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={audit.score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">WCAG Compliance</p>
                        <p className="text-lg font-semibold">{audit.wcagLevel}</p>
                      </div>
                      <Shield className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Web Content Accessibility Guidelines
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Issues Found</p>
                        <p className="text-2xl font-bold">{audit.issues.length}</p>
                      </div>
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Across all severity levels
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Issues by Severity */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Issues by Severity</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(groupIssuesBySeverity(audit.issues)).map(([severity, issues]) => (
                    <div key={severity} className="text-center">
                      <div className={`p-3 rounded-lg ${getSeverityColor(severity as any)}`}>
                        {getSeverityIcon(severity as any)}
                        <p className="font-semibold mt-1">{issues.length}</p>
                        <p className="text-xs capitalize">{severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues by Type */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Issues by Type</h3>
                <div className="space-y-2">
                  {Object.entries(groupIssuesByType(audit.issues)).map(([type, issues]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(type as any)}
                        <div>
                          <p className="font-medium capitalize">{type.replace('-', ' ')}</p>
                          <p className="text-sm text-gray-600">{issues.length} issues</p>
                        </div>
                      </div>
                      <Badge variant="outline">{issues.length}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {audit.issues.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No accessibility issues found! This component meets all tested criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {audit.issues.map((issue, index) => (
                    <Card key={issue.id} className="border-l-4 border-l-orange-400">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getSeverityIcon(issue.severity)}
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {issue.type.replace('-', ' ')}
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium mb-1">{issue.description}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Element: <code className="bg-gray-100 px-1 rounded">{issue.element}</code>
                            </p>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                              <p className="text-sm">
                                <strong>Suggestion:</strong> {issue.suggestion}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>WCAG Criterion: {issue.wcagCriterion}</span>
                              {issue.culturalContext && (
                                <span>Cultural Context: {issue.culturalContext}</span>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://www.w3.org/WAI/WCAG21/Understanding/${issue.wcagCriterion.replace('.', '-')}.html`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            WCAG Docs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {audit.recommendations.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No specific recommendations at this time. Your component is performing well!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Recommended Actions</h3>
                  <div className="space-y-3">
                    {audit.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audit.culturalConsiderations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Cultural Considerations</h3>
                  <div className="space-y-3">
                    {audit.culturalConsiderations.map((consideration, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Globe className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{consideration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Audit Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Component ID:</span>
                      <code className="bg-gray-100 px-1 rounded">{audit.componentId}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Component Name:</span>
                      <span>{audit.componentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Audit Date:</span>
                      <span>{audit.auditDate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">WCAG Level:</span>
                      <span>{audit.wcagLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Score:</span>
                      <span className={getScoreColor(audit.score)}>{audit.score}/100</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Testing Coverage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Palette className="h-4 w-4" />
                        <span>Color Contrast</span>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Keyboard className="h-4 w-4" />
                        <span>Keyboard Navigation</span>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Screen Reader Support</span>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Focus Management</span>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>Semantic Markup</span>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This audit covers automated testing only. Manual testing by users with disabilities 
                  and accessibility experts is recommended for comprehensive evaluation.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        )}

        {!audit && !loading && componentId && (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Audit</h3>
            <p className="text-gray-600 mb-4">
              Click "Run Audit" to analyze the accessibility of this component.
            </p>
            <Button onClick={runAudit}>
              <Shield className="h-4 w-4 mr-2" />
              Run Accessibility Audit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}