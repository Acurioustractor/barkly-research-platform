import { NextRequest, NextResponse } from 'next/server';
import {
  generateImpactReport,
  getImpactReport,
  getCommunityImpactReports
} from '@/lib/community/impact-report-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const reportId = searchParams.get('reportId');
    const communityId = searchParams.get('communityId');

    switch (action) {
      case 'get':
        if (!reportId) {
          return NextResponse.json(
            { success: false, error: 'Report ID is required' },
            { status: 400 }
          );
        }

        const report = await getImpactReport(reportId);
        
        if (!report) {
          return NextResponse.json(
            { success: false, error: 'Report not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: report
        });

      case 'list':
        if (!communityId) {
          return NextResponse.json(
            { success: false, error: 'Community ID is required' },
            { status: 400 }
          );
        }

        const reportType = searchParams.get('reportType') || undefined;
        const publicationStatus = searchParams.get('publicationStatus') || undefined;
        const culturalSafetyLevel = searchParams.get('culturalSafetyLevel') || undefined;

        const reports = await getCommunityImpactReports(communityId, {
          reportType,
          publicationStatus,
          culturalSafetyLevel
        });

        return NextResponse.json({
          success: true,
          data: reports
        });

      case 'templates':
        // Get available report templates
        const { supabase } = await import('@/lib/db/supabase');
        const { data: templates, error: templatesError } = await supabase
          .from('report_templates')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (templatesError) {
          throw new Error(`Failed to fetch templates: ${templatesError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: templates || []
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in impact reports GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate':
        const {
          communityId,
          title,
          reportType,
          timeframe,
          templateId,
          includeStories,
          includeCulturalContent,
          targetAudience,
          culturalSafetyLevel
        } = body;

        // Validate required fields
        if (!communityId || !title || !reportType || !timeframe) {
          return NextResponse.json(
            { success: false, error: 'Community ID, title, report type, and timeframe are required' },
            { status: 400 }
          );
        }

        if (!timeframe.startDate || !timeframe.endDate) {
          return NextResponse.json(
            { success: false, error: 'Start date and end date are required in timeframe' },
            { status: 400 }
          );
        }

        const reportConfig = {
          title,
          reportType,
          timeframe: {
            startDate: new Date(timeframe.startDate),
            endDate: new Date(timeframe.endDate)
          },
          templateId,
          includeStories: includeStories !== false,
          includeCulturalContent: includeCulturalContent === true,
          targetAudience,
          culturalSafetyLevel: culturalSafetyLevel || 'public'
        };

        const generatedReport = await generateImpactReport(communityId, reportConfig);

        return NextResponse.json({
          success: true,
          data: generatedReport,
          message: 'Impact report generated successfully'
        });

      case 'update_status':
        const { reportId, publicationStatus, culturalReviewStatus } = body;

        if (!reportId) {
          return NextResponse.json(
            { success: false, error: 'Report ID is required' },
            { status: 400 }
          );
        }

        const { supabase } = await import('@/lib/db/supabase');
        const updateData: any = { updated_at: new Date().toISOString() };

        if (publicationStatus) {
          updateData.publication_status = publicationStatus;
        }
        if (culturalReviewStatus) {
          updateData.cultural_review_status = culturalReviewStatus;
        }

        const { error: updateError } = await supabase
          .from('impact_reports')
          .update(updateData)
          .eq('id', reportId);

        if (updateError) {
          throw new Error(`Failed to update report status: ${updateError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Report status updated successfully'
        });

      case 'add_review':
        const {
          reportId: reviewReportId,
          reviewerName,
          reviewerRole,
          reviewType,
          reviewComments,
          reviewStatus,
          culturalAppropriateness,
          requiredChanges
        } = body;

        if (!reviewReportId || !reviewerName || !reviewType) {
          return NextResponse.json(
            { success: false, error: 'Report ID, reviewer name, and review type are required' },
            { status: 400 }
          );
        }

        const { supabase: reviewSupabase } = await import('@/lib/db/supabase');
        const reviewData = {
          report_id: reviewReportId,
          reviewer_name: reviewerName,
          reviewer_role: reviewerRole,
          review_type: reviewType,
          review_status: reviewStatus || 'pending',
          review_comments: reviewComments,
          cultural_appropriateness_rating: culturalAppropriateness,
          required_changes: requiredChanges || [],
          started_at: new Date().toISOString()
        };

        const { error: reviewError } = await reviewSupabase
          .from('report_reviews')
          .insert([reviewData]);

        if (reviewError) {
          throw new Error(`Failed to add review: ${reviewError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Review added successfully'
        });

      case 'track_sharing':
        const {
          reportId: shareReportId,
          sharedWith,
          sharedBy,
          sharingMethod,
          accessLevel,
          sharingPurpose
        } = body;

        if (!shareReportId || !sharedWith || !sharedBy || !sharingMethod) {
          return NextResponse.json(
            { success: false, error: 'Report ID, shared with, shared by, and sharing method are required' },
            { status: 400 }
          );
        }

        const { supabase: shareSupabase } = await import('@/lib/db/supabase');
        const sharingData = {
          report_id: shareReportId,
          shared_with: sharedWith,
          shared_by: sharedBy,
          sharing_method: sharingMethod,
          access_level: accessLevel || 'view',
          sharing_purpose: sharingPurpose,
          cultural_permissions_verified: true // Assume verified for now
        };

        const { error: sharingError } = await shareSupabase
          .from('report_sharing_log')
          .insert([sharingData]);

        if (sharingError) {
          throw new Error(`Failed to track sharing: ${sharingError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Report sharing tracked successfully'
        });

      case 'track_impact':
        const {
          reportId: impactReportId,
          impactType,
          impactDescription,
          impactValue,
          impactUnit,
          stakeholdersInvolved,
          evidenceSources,
          impactDate,
          reportedBy,
          confidenceLevel
        } = body;

        if (!impactReportId || !impactType || !impactDescription) {
          return NextResponse.json(
            { success: false, error: 'Report ID, impact type, and description are required' },
            { status: 400 }
          );
        }

        const { supabase: impactSupabase } = await import('@/lib/db/supabase');
        const impactData = {
          report_id: impactReportId,
          impact_type: impactType,
          impact_description: impactDescription,
          impact_value: impactValue,
          impact_unit: impactUnit,
          stakeholders_involved: stakeholdersInvolved || [],
          evidence_sources: evidenceSources || [],
          impact_date: impactDate || new Date().toISOString().split('T')[0],
          reported_by: reportedBy,
          confidence_level: confidenceLevel || 'medium'
        };

        const { error: impactError } = await impactSupabase
          .from('report_impact_tracking')
          .insert([impactData]);

        if (impactError) {
          throw new Error(`Failed to track impact: ${impactError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Report impact tracked successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in impact reports POST API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}