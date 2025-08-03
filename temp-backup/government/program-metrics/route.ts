import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const programType = searchParams.get('programType');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get program data with metrics
    let query = supabase
      .from('government_programs')
      .select(`
        id,
        program_name,
        program_type,
        description,
        start_date,
        end_date,
        budget,
        status,
        effectiveness_score,
        reach_count,
        satisfaction_score,
        outcomes,
        challenges,
        recommendations,
        communities(name, region),
        program_metrics(
          metric_type,
          metric_value,
          measurement_date
        )
      `)
      .eq('active', true)
      .order('effectiveness_score', { ascending: false });

    if (region) {
      query = query.eq('communities.region', region);
    }

    if (programType) {
      query = query.eq('program_type', programType);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch program metrics' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const metrics = data?.map(program => ({
      id: program.id,
      programName: program.program_name,
      programType: program.program_type,
      description: program.description,
      effectiveness: program.effectiveness_score || 0,
      reach: program.reach_count || 0,
      satisfaction: program.satisfaction_score || 0,
      outcomes: program.outcomes || [],
      challenges: program.challenges || [],
      recommendations: program.recommendations || [],
      budget: program.budget,
      status: program.status,
      startDate: program.start_date,
      endDate: program.end_date,
      community: program.communities?.name || 'Unknown',
      region: program.communities?.region || 'Unknown',
      detailedMetrics: program.program_metrics || []
    })) || [];

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Program metrics API error:', error);
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
      case 'updateMetrics':
        const { programId, metrics } = data;
        
        if (!programId || !metrics) {
          return NextResponse.json(
            { error: 'Program ID and metrics are required' },
            { status: 400 }
          );
        }

        // Update program metrics
        const { error: updateError } = await supabase
          .from('government_programs')
          .update({
            effectiveness_score: metrics.effectiveness,
            reach_count: metrics.reach,
            satisfaction_score: metrics.satisfaction,
            updated_at: new Date().toISOString()
          })
          .eq('id', programId);

        if (updateError) {
          throw new Error(`Failed to update program metrics: ${updateError.message}`);
        }

        // Insert detailed metrics if provided
        if (metrics.detailed && Array.isArray(metrics.detailed)) {
          const detailedMetrics = metrics.detailed.map((metric: any) => ({
            program_id: programId,
            metric_type: metric.type,
            metric_value: metric.value,
            measurement_date: metric.date || new Date().toISOString(),
            notes: metric.notes
          }));

          const { error: metricsError } = await supabase
            .from('program_metrics')
            .insert(detailedMetrics);

          if (metricsError) {
            console.error('Failed to insert detailed metrics:', metricsError);
            // Don't fail the whole request for this
          }
        }

        return NextResponse.json({ 
          message: 'Program metrics updated successfully' 
        });

      case 'addProgram':
        const { 
          programName, 
          programType, 
          description, 
          communityId, 
          budget, 
          startDate, 
          endDate 
        } = data;

        if (!programName || !programType || !communityId) {
          return NextResponse.json(
            { error: 'Program name, type, and community ID are required' },
            { status: 400 }
          );
        }

        const { data: newProgram, error: insertError } = await supabase
          .from('government_programs')
          .insert([{
            program_name: programName,
            program_type: programType,
            description: description || '',
            community_id: communityId,
            budget: budget || 0,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            status: 'planning',
            active: true,
            effectiveness_score: 0,
            reach_count: 0,
            satisfaction_score: 0
          }])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to create program: ${insertError.message}`);
        }

        return NextResponse.json({ 
          program: newProgram,
          message: 'Program created successfully' 
        }, { status: 201 });

      case 'generateReport':
        const { programIds, reportType, dateRange } = data;
        
        // Generate comprehensive program report
        // This would typically involve complex data aggregation
        // For now, return a success response
        return NextResponse.json({
          message: 'Program report generation initiated',
          reportId: `report-${Date.now()}`,
          status: 'processing'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Program metrics POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate program effectiveness
export async function calculateProgramEffectiveness(programId: string): Promise<number> {
  try {
    // Get program outcomes and metrics
    const { data: program, error } = await supabase
      .from('government_programs')
      .select(`
        *,
        program_metrics(metric_type, metric_value),
        community_feedback(rating, feedback_text)
      `)
      .eq('id', programId)
      .single();

    if (error || !program) {
      return 0;
    }

    let effectivenessScore = 0;
    let factors = 0;

    // Factor 1: Outcome achievement (40% weight)
    if (program.outcomes && program.outcomes.length > 0) {
      const outcomeScore = Math.min(program.outcomes.length * 20, 100);
      effectivenessScore += outcomeScore * 0.4;
      factors++;
    }

    // Factor 2: Community satisfaction (30% weight)
    if (program.community_feedback && program.community_feedback.length > 0) {
      const avgRating = program.community_feedback.reduce(
        (sum: number, feedback: any) => sum + (feedback.rating || 0), 0
      ) / program.community_feedback.length;
      const satisfactionScore = (avgRating / 5) * 100;
      effectivenessScore += satisfactionScore * 0.3;
      factors++;
    }

    // Factor 3: Reach vs target (20% weight)
    if (program.reach_count && program.target_reach) {
      const reachScore = Math.min((program.reach_count / program.target_reach) * 100, 100);
      effectivenessScore += reachScore * 0.2;
      factors++;
    }

    // Factor 4: Budget efficiency (10% weight)
    if (program.budget && program.budget > 0) {
      const costPerPerson = program.budget / Math.max(program.reach_count, 1);
      const efficiencyScore = Math.max(100 - (costPerPerson / 1000), 0); // Arbitrary efficiency calculation
      effectivenessScore += efficiencyScore * 0.1;
      factors++;
    }

    return factors > 0 ? Math.round(effectivenessScore / factors) : 0;
  } catch (error) {
    console.error('Error calculating program effectiveness:', error);
    return 0;
  }
}