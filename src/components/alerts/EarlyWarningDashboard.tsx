'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  Calendar,
  BarChart3,
  AlertCircle,
  Heart,
  GraduationCap,
  Home,
  Shield,
  Palette
} from 'lucide-react';
import { earlyWarningSystemService, EarlyWarningAlert } from '../../lib/early-warning-system';

interface EarlyWarningDashboardProps {
  communityId?: string;
  userRole?: 'community_member' | 'community_leader' | 'service_provider' | 'government_official';
}

interface AlertStatistics {
  total: number;
  byType: { [key: string]: number };
  bySeverity: { [key: string]: number };
  byStatus: { [key: string]: number };
  responseTime: number;
  resolutionRate: number;
}

const EarlyWarningDashboard: React.FC<EarlyWarningDashboardProps> = ({
  communityId,
  userRole = 'community_member'
}) => {
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<EarlyWarningAlert | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(loadDashboardData, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [communityId, timeframe, showResolved]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load active alerts
      const activeAlerts = await earlyWarningSystemService.getActiveAlerts(communityId);
      setAlerts(activeAlerts);
      
      // Load statistics
      const stats = await earlyWarningSystemService.getAlertStatistics(communityId, timeframe);
      setStatistics(stats);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await earlyWarningSystemService.acknowledgeAlert(alertId, 'current_user', 'Alert acknowledged');
      await loadDashboardData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string, resolution: string) => {
    try {
      await earlyWarningSystemService.resolveAlert(alertId, 'current_user', resolution);
      await loadDashboardData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'emerging_issue':
        return <AlertTriangle className="w-5 h-5" />;
      case 'service_strain':
        return <TrendingUp className="w-5 h-5" />;
      case 'funding_opportunity':
        return <BarChart3 className="w-5 h-5" />;
      case 'resource_match':
        return <Users className="w-5 h-5" />;
      case 'cultural_concern':
        return <Palette className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'healthcare':
        return <Heart className="w-4 h-4" />;
      case 'education':
        return <GraduationCap className="w-4 h-4" />;
      case 'social_services':
        return <Users className="w-4 h-4" />;
      case 'emergency_response':
        return <Shield className="w-4 h-4" />;
      case 'cultural_programs':
        return <Palette className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate':
        return 'text-red-600 bg-red-100';
      case 'short_term':
        return 'text-orange-600 bg-orange-100';
      case 'medium_term':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.alertType !== filterType) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (!showResolved && alert.status === 'resolved') return false;
    return true;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Early Warning System</h1>
          <p className="text-gray-600">
            Monitor community issues, service strain, and opportunities
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'quarter')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.bySeverity.critical || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.resolutionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.responseTime.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Types</option>
            <option value="emerging_issue">Emerging Issues</option>
            <option value="service_strain">Service Strain</option>
            <option value="funding_opportunity">Funding Opportunities</option>
            <option value="resource_match">Resource Matches</option>
            <option value="cultural_concern">Cultural Concerns</option>
          </select>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show Resolved</span>
          </label>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow border text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
            <p className="text-gray-600">
              {alerts.length === 0 
                ? "No alerts have been generated for this community."
                : "No alerts match your current filters."
              }
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getAlertIcon(alert.alertType)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeframeColor(alert.timeframe)}`}>
                          {alert.timeframe.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatTimeAgo(alert.createdAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{alert.stakeholders.length} stakeholders</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{Math.round(alert.confidence * 100)}% confidence</span>
                        </span>
                      </div>
                      
                      {alert.culturalConsiderations.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Cultural Considerations:</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.culturalConsiderations.slice(0, 3).map((consideration, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                              >
                                {consideration}
                              </span>
                            ))}
                            {alert.culturalConsiderations.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{alert.culturalConsiderations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {alert.status === 'active' && userRole !== 'community_member' && (
                      <>
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleResolveAlert(alert.id, 'Resolved by user')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    
                    {alert.status === 'acknowledged' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Acknowledged
                      </span>
                    )}
                    
                    {alert.status === 'resolved' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Alert Details</h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Alert Header */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getSeverityColor(selectedAlert.severity)}`}>
                  {getAlertIcon(selectedAlert.alertType)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedAlert.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{selectedAlert.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Severity:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getSeverityColor(selectedAlert.severity)}`}>
                        {selectedAlert.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Timeframe:</span>
                      <span className="ml-2 text-gray-600">
                        {selectedAlert.timeframe.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Confidence:</span>
                      <span className="ml-2 text-gray-600">
                        {Math.round(selectedAlert.confidence * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className="ml-2 text-gray-600 capitalize">
                        {selectedAlert.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicators */}
              {selectedAlert.indicators.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Indicators</h4>
                  <div className="space-y-3">
                    {selectedAlert.indicators.map((indicator) => (
                      <div key={indicator.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{indicator.name}</h5>
                          <span className={`px-2 py-1 rounded text-xs ${
                            indicator.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                            indicator.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {indicator.trend}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Current:</span>
                            <span className="ml-2 font-medium">{indicator.currentValue}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Threshold:</span>
                            <span className="ml-2 font-medium">{indicator.threshold}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Source:</span>
                            <span className="ml-2 font-medium">{indicator.dataSource}</span>
                          </div>
                        </div>
                        {indicator.historicalContext && (
                          <p className="text-sm text-gray-600 mt-2">{indicator.historicalContext}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedAlert.recommendations.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h4>
                  <div className="space-y-4">
                    {selectedAlert.recommendations.map((rec) => (
                      <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{rec.action}</h5>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{rec.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Timeframe:</span>
                            <span className="ml-2 text-gray-600">{rec.timeframe}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Expected Outcome:</span>
                            <span className="ml-2 text-gray-600">{rec.expectedOutcome}</span>
                          </div>
                        </div>
                        
                        {rec.stakeholders.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700">Stakeholders:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rec.stakeholders.map((stakeholder, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {stakeholder}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {rec.culturalProtocols.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700">Cultural Protocols:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rec.culturalProtocols.map((protocol, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                                >
                                  {protocol}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              {selectedAlert.evidence.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Evidence</h4>
                  <div className="space-y-3">
                    {selectedAlert.evidence.map((evidence) => (
                      <div key={evidence.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{evidence.source}</span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                              {evidence.type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {evidence.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{evidence.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-500">
                            Relevance: {Math.round(evidence.relevanceScore * 100)}%
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            evidence.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            evidence.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {evidence.verificationStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stakeholders */}
              {selectedAlert.stakeholders.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Stakeholders</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.stakeholders.map((stakeholder, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {stakeholder}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarlyWarningDashboard;