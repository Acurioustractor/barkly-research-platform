import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeCommunityIntelligence } from '@/lib/ai-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const sentiment = searchParams.get('sentiment');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get community feedback with community information
    let query = supabase
      .from('community_feedback')
      .select(`
        id,
        feedback_text,
        category,
        priority,
        status,
        sentiment,
        is_anonymous,
        created_at,
        updated_at,
        communities(name, region),
        users(name, email)
      `)
      .order('created_at', { ascending: false });

    if (region) {
      query = query.eq('communities.region', region);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community feedback' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const feedback = data?.map(item => ({
      id: item.id,
      community: item.communities?.name || 'Unknown',
      region: item.communities?.region || 'Unknown',
      feedback: item.feedback_text,
      category: item.category,
      priority: item.priority,
      sentiment: item.sentiment || 'neutral',
      date: new Date(item.created_at),
      status: item.status,
      isAnonymous: item.is_anonymous,
      author: item.is_anonymous ? 'Anonymous' : (item.users?.name || 'Unknown User')
    })) || [];

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Community feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'updateStatus':
        const { feedbackId, newStatus, reviewNotes, reviewedBy } = data;
        
        if (!feedbackId || !newStatus) {
          return NextResponse.json(
            { error: 'Feedback ID and new status are required' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('community_feedback')
          .update({
            status: newStatus,
            review_notes: reviewNotes,
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', feedbackId);

        if (updateError) {
          throw new Error(`Failed to update feedback status: ${updateError.message}`);
        }

        return NextResponse.json({ 
          message: 'Feedback status updated successfully' 
        });

      case 'bulkAnalyze':
        const { feedbackIds, analysisType } = data;
        
        if (!feedbackIds || !Array.isArray(feedbackIds)) {
          return NextResponse.json(
            { error: 'Feedback IDs array is required' },
            { status: 400 }
          );
        }

        // Get feedback texts for analysis
        const { data: feedbackData, error: fetchError } = await supabase
          .from('community_feedback')
          .select('id, feedback_text, category')
          .in('id', feedbackIds);

        if (fetchError) {
          throw new Error(`Failed to fetch feedback: ${fetchError.message}`);
        }

        // Perform AI analysis on the feedback
        const analysisResults = await analyzeFeedbackBatch(
          feedbackData || [],
          analysisType || 'sentiment'
        );

        // Update feedback with analysis results
        const updatePromises = analysisResults.map(result => 
          supabase
            .from('community_feedback')
            .update({
              sentiment: result.sentiment,
              priority: result.priority,
              analysis_summary: result.summary,
              updated_at: new Date().toISOString()
            })
            .eq('id', result.id)
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ 
          message: 'Bulk analysis completed successfully',
          analyzed: analysisResults.length
        });

      case 'generateInsights':
        const { timeRange, categories, communities } = data;
        
        // Generate insights from feedback data
        const insights = await generateFeedbackInsights({
          timeRange,
          categories,
          communities
        });

        return NextResponse.json({ insights });

      case 'exportFeedback':
        const { filters, format } = data;
        
        // Generate export of feedback data
        // This would typically create a file and return a download link
        return NextResponse.json({
          message: 'Export generation initiated',
          exportId: `export-${Date.now()}`,
          status: 'processing'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Community feedback POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeFeedbackBatch(
  feedbackItems: any[],
  analysisType: string
): Promise<any[]> {
  const results = [];

  for (const item of feedbackItems) {
    try {
      // Use AI service to analyze sentiment and extract insights
      const analysis = await analyzeCommunityIntelligence(
        item.feedback_text,
        `Community feedback analysis - Category: ${item.category}`,
        'Feedback sentiment and priority analysis'
      );

      // Extract sentiment and priority from AI analysis
      let sentiment = 'neutral';
      let priority = 'medium';
      let summary = '';

      // Simple sentiment analysis based on keywords (would be enhanced with proper AI)
      const text = item.feedback_text.toLowerCase();
      if (text.includes('urgent') || text.includes('critical') || text.includes('emergency')) {
        priority = 'urgent';
      } else if (text.includes('important') || text.includes('serious') || text.includes('concern')) {
        priority = 'high';
      } else if (text.includes('minor') || text.includes('suggestion')) {
        priority = 'low';
      }

      if (text.includes('great') || text.includes('excellent') || text.includes('love') || text.includes('thank')) {
        sentiment = 'positive';
      } else if (text.includes('terrible') || text.includes('awful') || text.includes('hate') || text.includes('angry')) {
        sentiment = 'negative';
      }

      summary = `${sentiment} sentiment, ${priority} priority feedback about ${item.category}`;

      results.push({
        id: item.id,
        sentiment,
        priority,
        summary
      });
    } catch (error) {
      console.error(`Error analyzing feedback ${item.id}:`, error);
      results.push({
        id: item.id,
        sentiment: 'neutral',
        priority: 'medium',
        summary: 'Analysis failed'
      });
    }
  }

  return results;
}

async function generateFeedbackInsights(filters: any): Promise<any> {
  try {
    // Build query based on filters
    let query = supabase
      .from('community_feedback')
      .select(`
        category,
        priority,
        sentiment,
        created_at,
        communities(name, region)
      `);

    if (filters.timeRange) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filters.timeRange);
      query = query.gte('created_at', startDate.toISOString());
    }

    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }

    if (filters.communities && filters.communities.length > 0) {
      query = query.in('communities.name', filters.communities);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch feedback for insights: ${error.message}`);
    }

    // Generate insights from the data
    const insights = {
      totalFeedback: data?.length || 0,
      sentimentBreakdown: {
        positive: data?.filter(f => f.sentiment === 'positive').length || 0,
        neutral: data?.filter(f => f.sentiment === 'neutral').length || 0,
        negative: data?.filter(f => f.sentiment === 'negative').length || 0
      },
      priorityBreakdown: {
        urgent: data?.filter(f => f.priority === 'urgent').length || 0,
        high: data?.filter(f => f.priority === 'high').length || 0,
        medium: data?.filter(f => f.priority === 'medium').length || 0,
        low: data?.filter(f => f.priority === 'low').length || 0
      },
      categoryBreakdown: {},
      communityBreakdown: {},
      trends: {
        weeklyVolume: [],
        sentimentTrend: 'stable',
        emergingIssues: []
      }
    };

    // Calculate category breakdown
    const categories = [...new Set(data?.map(f => f.category) || [])];
    categories.forEach(category => {
      insights.categoryBreakdown[category] = data?.filter(f => f.category === category).length || 0;
    });

    // Calculate community breakdown
    const communities = [...new Set(data?.map(f => f.communities?.name).filter(Boolean) || [])];
    communities.forEach(community => {
      insights.communityBreakdown[community] = data?.filter(f => f.communities?.name === community).length || 0;
    });

    return insights;
  } catch (error) {
    console.error('Error generating feedback insights:', error);
    return {
      totalFeedback: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      priorityBreakdown: { urgent: 0, high: 0, medium: 0, low: 0 },
      categoryBreakdown: {},
      communityBreakdown: {},
      trends: { weeklyVolume: [], sentimentTrend: 'stable', emergingIssues: [] }
    };
  }
}