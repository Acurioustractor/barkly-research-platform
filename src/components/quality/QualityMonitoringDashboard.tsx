'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface QualityMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  community_id?: string;
  time_period: string;
  calculated_at: string;
  details: any;
}

interface QualityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_insights: string[];
  affected_communities: string[];
  recommended_actions: string[];
  created_at: string;
  resolved_at?: string;
}

export default function QualityMonitoringDashboard() {
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [trends, setTrends] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'trends'>('overview');

  useEffect(() => {
    fetchQualityData();
  }, [selectedTimeRange, selectedCommunity]);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchAlerts(),
        fetchTrends()
      ]);
    } catch (error) {
      console.error('Error fetching quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams({
        time_range: selectedTimeRange,
        ...(selectedCommunity && { community_id: selectedCommunity })
      });

      const response = await fetch(`/api/quality/metrics?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/quality/alerts?resolved=false');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const params = new URLSearchParams({
        time_range: '90d',
        ...(selectedCommunity && { community_id: selectedCommunity })
      });

      const response = await fetch(`/api/quality/trends?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTrends(data.data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMetricValue = (metric: QualityMetric) => {
    if (metric.metric_type === 'bias') {
      return `${(metric.value * 100).toFixed(1)}%`;
    } else if (metric.metric_type === 'cultural_sensitivity') {
      return `${(metric.value * 100).toFixed(1)}%`;
    } else {
      return metric.value.toFixed(2);
    }
  };

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'accuracy':
        return <ChartBarIcon className="h-6 w-6 text-blue-500" />;
      case 'bias':
        return <ShieldCheckIcon className="h-6 w-6 text-purple-500" />;
      case 'cultural_sensitivity':
        return <EyeIcon className="h-6 w-6 text-green-500" />;
      case 'completeness':
        return <DocumentTextIcon className="h-6 w-6 text-orange-500" />;
      case 'relevance':
        return <CheckCircleIcon className="h-6 w-6 text-indigo-500" />;
      default:
        return <ChartBarIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resolveAlert = async (alertId: string, resolutionNotes: string) => {
    try {
      const response = await fetch('/api/quality/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_id: alertId,
          resolution_notes: resolutionNotes
        }),
      });

      if (response.ok) {
        // Refresh alerts
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quality Monitoring Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor AI-generated insight quality, bias detection, and community satisfaction
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>

        <select
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Communities</option>
          {/* Community options would be populated from API */}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'metrics', label: 'Quality Metrics' },
            { key: 'alerts', label: 'Alerts' },
            { key: 'trends', label: 'Trends' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.key === 'alerts' && alerts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  {getMetricIcon(metric.metric_type)}
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {metric.metric_type.replace('_', ' ')}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatMetricValue(metric)}
                      </p>
                      {getStatusIcon(metric.status)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Quality Alerts</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {alert.alert_type.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-medium text-gray-900">{alert.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(alert.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id, 'Resolved from dashboard')}
                        className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getMetricIcon(metric.metric_type)}
                    <h3 className="ml-2 text-lg font-medium text-gray-900">
                      {metric.metric_name}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-900">
                      {formatMetricValue(metric)}
                    </p>
                    <p className="ml-2 text-sm text-gray-600">
                      / {metric.metric_type === 'bias' || metric.metric_type === 'cultural_sensitivity' 
                          ? `${(metric.threshold * 100).toFixed(0)}%` 
                          : metric.threshold.toFixed(1)} threshold
                    </p>
                  </div>
                </div>

                {metric.details && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Details:</h4>
                    <div className="text-sm text-gray-600">
                      {Object.entries(metric.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <span>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quality Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No active quality alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 capitalize">
                          {alert.alert_type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="mt-2 text-lg font-medium text-gray-900">{alert.title}</h4>
                      <p className="mt-1 text-gray-600">{alert.description}</p>
                      
                      {alert.recommended_actions.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700">Recommended Actions:</h5>
                          <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                            {alert.recommended_actions.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(alert.created_at)}
                        {alert.affected_insights.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{alert.affected_insights.length} insights affected</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id, 'Resolved from dashboard')}
                      className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {Object.entries(trends).map(([metricType, trendData]) => (
            <div key={metricType} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                {metricType.replace('_', ' ')} Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [value.toFixed(3), 'Value']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
          
          {Object.keys(trends).length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No trend data available for the selected time period
            </div>
          )}
        </div>
      )}
    </div>
  );
}