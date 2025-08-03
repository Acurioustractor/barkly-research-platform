'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Activity,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import {
  ProgressIndicator,
  ProgressAlert,
  ProgressReport,
  MonitoringConfiguration
} from '@/lib/automated-progress-monitoring';

interface AutomatedProgressMonitoringProps {
  communityId: string;
  communityName: string;
}

export default function AutomatedProgressMonitoring({
  communityId,
  communityName
}: AutomatedProgressMonitoringProps) {
  const [indicators, setIndicators] = useState<ProgressIndicator[]>([]);
  const [alerts, setAlerts] = useState<ProgressAlert[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [currentReport, setCurrentReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadProgressData();
  }, [communityId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Load indicators, alerts, and reports in parallel
      const [indicatorsRes, alertsRes, reportsRes] = await Promise.all([
        fetch(`/api/progress/monitoring?action=indicators&communityId=${communityId}`),
        fetch(`/api/progress/monitoring?action=alerts&communityId=${communityId}&days=30`),
        fetch(`/api/progress/monitoring?action=reports&communityId=${communityId}&limit=5`)
      ]);

      const [indicatorsData, alertsData, reportsData] = await Promise.all([
        indicatorsRes.json(),
        alertsRes.json(),
        reportsRes.json()
      ]);

      setIndicators(indicatorsData.indicators || []);
      setAlerts(alertsData.alerts || []);
      setReports(reportsData.reports || []);
      
      // Set the most recent report as current
      if (reportsData.reports && reportsData.reports.length > 0) {
        setCurrentReport(reportsData.reports[0]);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIndicators = async () => {
    try {
      setUpdating(true);
      const response = await fetch('/api/progress/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-indicators',
          communityId
        })
      });

      if (response.ok) {
        await loadProgressData();
      }
    } catch (error) {
      console.error('Error updating indicators:', error);
    } finally {
      setUpdating(false);
    }
  };

  const generateReport = async () => {
    try {
      setUpdating(true);
      const response = await fetch('/api/progress/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-report',
          communityId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentReport(data.report);
        await loadProgressData();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setUpdating(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/progress/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge-alert',
          alertId,
          acknowledgedBy: 'Current User', // Would be actual user in real implementation
          notes: 'Acknowledged via dashboard'
        })
      });

      if (response.ok) {
        await loadProgressData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading progress monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progress Monitoring</h2>
          <p className="text-gray-600">{communityName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={updateIndicators}
            disabled={updating}
            variant="outline"
          >
            {updating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Update Indicators
          </Button>
          <Button
            onClick={generateReport}
            disabled={updating}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {currentReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Score</p>
                  <p className="text-2xl font-bold">{currentReport.overallScore}</p>
                </div>
                <div className="text-right">
                  {getTrendIcon(currentReport.overallTrend)}
                  <p className="text-xs text-gray-500 capitalize">
                    {currentReport.overallTrend}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Indicators</p>
                  <p className="text-2xl font-bold">{currentReport.indicatorsSummary.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {currentReport.indicatorsSummary.improving} improving, {currentReport.indicatorsSummary.declining} declining
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Alerts</p>
                  <p className="text-2xl font-bold">{currentReport.alertsSummary.total}</p>
                </div>
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {currentReport.alertsSummary.unacknowledged} unacknowledged
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Next Report</p>
                  <p className="text-sm font-medium">
                    {new Date(currentReport.nextReportDue).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {currentReport && (
            <>
              {/* Category Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(currentReport.categoryScores).map(([category, score]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize font-medium">{category}</span>
                          <span className="font-bold">{score}/100</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                      Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentReport.keyInsights.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                      Areas of Concern
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentReport.keyInsights.concerns.map((concern, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Immediate Actions</h4>
                      <ul className="space-y-1 text-sm">
                        {currentReport.recommendations.immediate.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Short-term Actions</h4>
                      <ul className="space-y-1 text-sm">
                        {currentReport.recommendations.shortTerm.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Long-term Actions</h4>
                      <ul className="space-y-1 text-sm">
                        {currentReport.recommendations.longTerm.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator) => (
              <Card key={indicator.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {indicator.name}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        {indicator.description}
                      </p>
                    </div>
                    <Badge className={`ml-2 ${getPriorityColor(indicator.priority)}`}>
                      {indicator.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getTrendIcon(indicator.trend)}
                      <span className="ml-2 text-2xl font-bold">
                        {indicator.currentValue}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">
                        {indicator.unit}
                      </span>
                    </div>
                    {indicator.changePercentage && (
                      <Badge variant="outline" className={
                        indicator.changePercentage > 0 ? 'text-green-600' : 'text-red-600'
                      }>
                        {indicator.changePercentage > 0 ? '+' : ''}
                        {indicator.changePercentage.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Category: <span className="capitalize">{indicator.category}</span></div>
                    <div>Updated: {new Date(indicator.lastUpdated).toLocaleDateString()}</div>
                    <div>Confidence: {(indicator.confidence * 100).toFixed(0)}%</div>
                  </div>

                  {indicator.culturalContext && (
                    <Alert className="mt-3">
                      <AlertDescription className="text-xs">
                        <strong>Cultural Context:</strong> {indicator.culturalContext}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                <p className="text-gray-500">All indicators are within normal ranges.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {alert.type}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="ml-2 text-green-600">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.description}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Indicator</p>
                        <p className="text-sm text-gray-600">{alert.indicatorName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Current Value</p>
                        <p className="text-sm text-gray-600">{alert.currentValue}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Change</p>
                        <p className={`text-sm ${alert.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {alert.changePercentage >= 0 ? '+' : ''}{alert.changePercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Detected</p>
                        <p className="text-sm text-gray-600">
                          {new Date(alert.detectedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {alert.suggestedActions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Suggested Actions</p>
                        <ul className="space-y-1">
                          {alert.suggestedActions.map((action, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {alert.culturalConsiderations.length > 0 && (
                      <Alert className="mt-4">
                        <AlertDescription className="text-sm">
                          <strong>Cultural Considerations:</strong>
                          <ul className="mt-1 space-y-1">
                            {alert.culturalConsiderations.map((consideration, index) => (
                              <li key={index}>• {consideration}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Reports Available</h3>
                <p className="text-gray-500">Generate your first progress report to get started.</p>
                <Button onClick={generateReport} className="mt-4">
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Progress Report
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Generated on {new Date(report.generatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          report.overallTrend === 'improving' ? 'bg-green-100 text-green-800' :
                          report.overallTrend === 'declining' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {report.overallTrend}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.overallScore}</p>
                        <p className="text-sm text-gray-600">Overall Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.indicatorsSummary.total}</p>
                        <p className="text-sm text-gray-600">Indicators</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.alertsSummary.total}</p>
                        <p className="text-sm text-gray-600">Alerts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.indicatorsSummary.improving}</p>
                        <p className="text-sm text-gray-600">Improving</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Top Improvements</h4>
                        <ul className="space-y-1 text-sm">
                          {report.progressHighlights.topImprovements.slice(0, 3).map((indicator, index) => (
                            <li key={index} className="flex items-center">
                              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                              {indicator.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Areas of Concern</h4>
                        <ul className="space-y-1 text-sm">
                          {report.progressHighlights.areasOfConcern.slice(0, 3).map((indicator, index) => (
                            <li key={index} className="flex items-center">
                              <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                              {indicator.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}