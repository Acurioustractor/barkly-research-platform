'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  BarChart3,
  Users,
  MessageSquare,
  Eye,
  Download,
  Share2,
  Settings,
  Calendar,
  Globe,
  Shield,
  Crown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  Target,
  Heart,
  Award,
  MapPin
} from 'lucide-react';

interface ImpactReport {
  id: string;
  title: string;
  subtitle?: string;
  communityName: string;
  reportType: string;
  timeframe: {
    startDate: Date;
    endDate: Date;
    description: string;
  };
  executiveSummary: {
    keyAchievements: string[];
    majorChallenges: string[];
    impactHighlights: string[];
    futureDirections: string[];
    culturalSignificance: string[];
  };
  metrics: {
    primary: any[];
    secondary: any[];
  };
  stories: {
    featured: any[];
    supporting: any[];
    culturalStories: any[];
  };
  voices: {
    testimonials: any[];
    elderWisdom: any[];
    youthPerspectives: any[];
    leadershipInsights: any[];
  };
  generatedAt: Date;
  publicationStatus: string;
  culturalReviewStatus: string;
  culturalSafetyLevel: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  target_audience: string;
  report_type: string;
  sections: any[];
  cultural_protocols: string[];
  approval_required: boolean;
}

interface ImpactReportGeneratorProps {
  communityId: string;
  communityName: string;
  userRole: 'admin' | 'coordinator' | 'community_member';
}

export default function ImpactReportGenerator({
  communityId,
  communityName,
  userRole
}: ImpactReportGeneratorProps) {
  const [reports, setReports] = useState<ImpactReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [selectedReport, setSelectedReport] = useState<ImpactReport | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Form state for report generation
  const [reportForm, setReportForm] = useState({
    title: '',
    reportType: 'annual',
    templateId: '',
    startDate: '',
    endDate: '',
    includeStories: true,
    includeCulturalContent: false,
    targetAudience: 'community',
    culturalSafetyLevel: 'public'
  });

  useEffect(() => {
    loadReports();
    loadTemplates();
  }, [communityId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/impact?action=list&communityId=${communityId}`);
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data.map((report: any) => ({
          ...report,
          timeframe: {
            ...report.timeframe,
            startDate: new Date(report.timeframe.startDate),
            endDate: new Date(report.timeframe.endDate)
          },
          generatedAt: new Date(report.generatedAt)
        })));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/reports/impact?action=templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const generateReport = async () => {
    if (!reportForm.title || !reportForm.startDate || !reportForm.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/reports/impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          communityId,
          title: reportForm.title,
          reportType: reportForm.reportType,
          timeframe: {
            startDate: reportForm.startDate,
            endDate: reportForm.endDate
          },
          templateId: reportForm.templateId || undefined,
          includeStories: reportForm.includeStories,
          includeCulturalContent: reportForm.includeCulturalContent,
          targetAudience: reportForm.targetAudience,
          culturalSafetyLevel: reportForm.culturalSafetyLevel
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadReports();
        setShowGenerator(false);
        setReportForm({
          title: '',
          reportType: 'annual',
          templateId: '',
          startDate: '',
          endDate: '',
          includeStories: true,
          includeCulturalContent: false,
          targetAudience: 'community',
          culturalSafetyLevel: 'public'
        });
        alert('Impact report generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      internal: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      public: { color: 'bg-green-100 text-green-800', icon: Globe },
      restricted: { color: 'bg-yellow-100 text-yellow-800', icon: Shield }
    };

    const { color, icon: Icon } = config[status as keyof typeof config] || config.draft;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCulturalReviewBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      reviewed: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const { color, icon: Icon } = config[status as keyof typeof config] || config.pending;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCulturalSafetyIcon = (level: string) => {
    switch (level) {
      case 'public': return Globe;
      case 'community': return Users;
      case 'restricted': return Shield;
      case 'sacred': return Crown;
      default: return Globe;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'annual': return Calendar;
      case 'quarterly': return BarChart3;
      case 'project': return Target;
      case 'thematic': return BookOpen;
      case 'funder': return Award;
      case 'government': return MapPin;
      default: return FileText;
    }
  };

  const renderReportCard = (report: ImpactReport) => {
    const TypeIcon = getReportTypeIcon(report.reportType);
    const CulturalIcon = getCulturalSafetyIcon(report.culturalSafetyLevel);
    
    return (
      <Card key={report.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <TypeIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{report.subtitle}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span>{report.timeframe.description}</span>
                <span>•</span>
                <span className="capitalize">{report.reportType} Report</span>
                <span>•</span>
                <div className="flex items-center">
                  <CulturalIcon className="w-4 h-4 mr-1" />
                  <span className="capitalize">{report.culturalSafetyLevel}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                {getStatusBadge(report.publicationStatus)}
                {getCulturalReviewBadge(report.culturalReviewStatus)}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-medium text-blue-900">{report.metrics.primary.length}</div>
                  <div className="text-blue-600">Key Metrics</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-medium text-green-900">
                    {report.stories.featured.length + report.stories.supporting.length}
                  </div>
                  <div className="text-green-600">Stories</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-medium text-purple-900">
                    {Object.values(report.voices).flat().length}
                  </div>
                  <div className="text-purple-600">Voices</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="font-medium text-orange-900">
                    {report.executiveSummary.keyAchievements.length}
                  </div>
                  <div className="text-orange-600">Achievements</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(report)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 border-t pt-3">
            Generated {report.generatedAt.toLocaleDateString()} at {report.generatedAt.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderReportGenerator = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-600" />
          Generate New Impact Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Title *
            </label>
            <Input
              value={reportForm.title}
              onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter report title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type *
            </label>
            <select
              value={reportForm.reportType}
              onChange={(e) => setReportForm(prev => ({ ...prev, reportType: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="annual">Annual Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="project">Project Report</option>
              <option value="thematic">Thematic Report</option>
              <option value="funder">Funder Report</option>
              <option value="government">Government Report</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <Input
              type="date"
              value={reportForm.startDate}
              onChange={(e) => setReportForm(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <Input
              type="date"
              value={reportForm.endDate}
              onChange={(e) => setReportForm(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Template (Optional)
          </label>
          <select
            value={reportForm.templateId}
            onChange={(e) => setReportForm(prev => ({ ...prev, templateId: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a template (optional)</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.target_audience}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <select
              value={reportForm.targetAudience}
              onChange={(e) => setReportForm(prev => ({ ...prev, targetAudience: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="community">Community</option>
              <option value="government">Government</option>
              <option value="funders">Funders</option>
              <option value="researchers">Researchers</option>
              <option value="media">Media</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cultural Safety Level
            </label>
            <select
              value={reportForm.culturalSafetyLevel}
              onChange={(e) => setReportForm(prev => ({ ...prev, culturalSafetyLevel: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="public">Public</option>
              <option value="community">Community</option>
              <option value="restricted">Restricted</option>
              <option value="sacred">Sacred</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeStories"
              checked={reportForm.includeStories}
              onChange={(e) => setReportForm(prev => ({ ...prev, includeStories: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeStories" className="text-sm font-medium text-gray-700">
              Include Community Stories
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeCulturalContent"
              checked={reportForm.includeCulturalContent}
              onChange={(e) => setReportForm(prev => ({ ...prev, includeCulturalContent: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeCulturalContent" className="text-sm font-medium text-gray-700">
              Include Cultural Content (requires elder review)
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowGenerator(false)}
          >
            Cancel
          </Button>
          
          <Button
            onClick={generateReport}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderReportPreview = (report: ImpactReport) => (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
              <p className="text-lg text-gray-600 mt-1">{report.subtitle}</p>
              <p className="text-sm text-gray-500 mt-2">{report.timeframe.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(report.publicationStatus)}
              {getCulturalReviewBadge(report.culturalReviewStatus)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Generated: {report.generatedAt.toLocaleDateString()}</span>
            <span>•</span>
            <span>Community: {report.communityName}</span>
            <span>•</span>
            <span className="capitalize">Type: {report.reportType}</span>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Achievements</h4>
            <ul className="space-y-1">
              {report.executiveSummary.keyAchievements.map((achievement, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Impact Highlights</h4>
            <ul className="space-y-1">
              {report.executiveSummary.impactHighlights.map((highlight, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Heart className="w-4 h-4 text-red-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Cultural Significance</h4>
            <ul className="space-y-1">
              {report.executiveSummary.culturalSignificance.map((significance, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Crown className="w-4 h-4 text-purple-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{significance}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.metrics.primary.slice(0, 6).map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{metric.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {metric.category}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {metric.value} {metric.unit}
                </div>
                <div className="text-xs text-gray-600">
                  {metric.trend === 'improving' && (
                    <span className="text-green-600">↗ Improving</span>
                  )}
                  {metric.trend === 'declining' && (
                    <span className="text-red-600">↘ Declining</span>
                  )}
                  {metric.trend === 'stable' && (
                    <span className="text-gray-600">→ Stable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Stories */}
      {report.stories.featured.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Featured Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.stories.featured.slice(0, 3).map((story, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-1">{story.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-3">{story.content}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>By {story.author}</span>
                    <span>•</span>
                    <span className="capitalize">{story.category}</span>
                    <span>•</span>
                    <span className="capitalize">{story.culturalSafety}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Voices */}
      {Object.values(report.voices).flat().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Community Voices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(report.voices).flat().slice(0, 4).map((voice: any, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <blockquote className="text-gray-700 italic mb-2">
                    "{voice.quote}"
                  </blockquote>
                  <div className="text-sm text-gray-600">
                    — {voice.speakerName}, {voice.speakerRole}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Report contains {report.metrics.primary.length} metrics, {report.stories.featured.length + report.stories.supporting.length} stories, and {Object.values(report.voices).flat().length} community voices
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Report
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading impact reports...</p>
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
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Impact Reports
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive reports combining quantitative data with community stories
          </p>
        </div>
        
        {(userRole === 'admin' || userRole === 'coordinator') && (
          <Button 
            onClick={() => setShowGenerator(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        )}
      </div>

      {/* Main Content */}
      {selectedReport ? (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReport(null)}
            >
              ← Back to Reports
            </Button>
          </div>
          {renderReportPreview(selectedReport)}
        </div>
      ) : showGenerator ? (
        renderReportGenerator()
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reports">All Reports ({reports.length})</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Impact Reports Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first impact report to showcase community progress and outcomes.
                  </p>
                  {(userRole === 'admin' || userRole === 'coordinator') && (
                    <Button 
                      onClick={() => setShowGenerator(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate First Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map(renderReportCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {template.target_audience}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.report_type}
                      </Badge>
                    </div>
                    {template.approval_required && (
                      <div className="mt-2">
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Approval Required
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}