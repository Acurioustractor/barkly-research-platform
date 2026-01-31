import { NextRequest, NextResponse } from 'next/server';
import { qualityMonitoringService } from '@/lib/community/quality-monitoring-service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alert_type');
    const resolved = searchParams.get('resolved');

    // Check if user has permission to view quality alerts
    const { data: user } = await supabase
      .from('users')
      .select('id, role, community_id')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canViewAlerts = 
      user.role === 'admin' || 
      user.role === 'moderator';

    if (!canViewAlerts) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view quality alerts' },
        { status: 403 }
      );
    }

    // Get alerts based on filters
    let alerts;
    if (resolved === 'false') {
      alerts = await qualityMonitoringService.getActiveAlerts(severity || undefined);
    } else {
      // Get all alerts (including resolved ones)
      let query = supabase
        .from('quality_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (alertType) {
        query = query.eq('alert_type', alertType);
      }

      if (resolved === 'true') {
        query = query.not('resolved_at', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      alerts = data || [];
    }

    // Filter alerts by user's community if not admin/moderator
    if (user.role !== 'admin' && user.role !== 'moderator' && user.community_id) {
      alerts = alerts.filter(alert => 
        alert.affected_communities.includes(user.community_id)
      );
    }

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error('Error fetching quality alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['alert_type', 'severity', 'title', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate alert type
    const validAlertTypes = ['accuracy_drop', 'bias_detected', 'cultural_concern', 'validation_failure'];
    if (!validAlertTypes.includes(body.alert_type)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(body.severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Check if user has permission to create quality alerts
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canCreateAlerts = 
      user.role === 'admin' || 
      user.role === 'moderator';

    if (!canCreateAlerts) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create quality alerts' },
        { status: 403 }
      );
    }

    const alertData = {
      alert_type: body.alert_type,
      severity: body.severity,
      title: body.title,
      description: body.description,
      affected_insights: body.affected_insights || [],
      affected_communities: body.affected_communities || [],
      recommended_actions: body.recommended_actions || []
    };

    const newAlert = await qualityMonitoringService.generateQualityAlert(alertData);

    return NextResponse.json({
      success: true,
      data: newAlert,
      message: 'Quality alert created successfully'
    });

  } catch (error) {
    console.error('Error creating quality alert:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create quality alert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alert_id, resolution_notes } = body;

    if (!alert_id) {
      return NextResponse.json(
        { error: 'alert_id is required' },
        { status: 400 }
      );
    }

    if (!resolution_notes) {
      return NextResponse.json(
        { error: 'resolution_notes is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to resolve quality alerts
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canResolveAlerts = 
      user.role === 'admin' || 
      user.role === 'moderator';

    if (!canResolveAlerts) {
      return NextResponse.json(
        { error: 'Insufficient permissions to resolve quality alerts' },
        { status: 403 }
      );
    }

    // Verify alert exists and is not already resolved
    const { data: alert } = await supabase
      .from('quality_alerts')
      .select('id, resolved_at')
      .eq('id', alert_id)
      .single();

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (alert.resolved_at) {
      return NextResponse.json(
        { error: 'Alert is already resolved' },
        { status: 400 }
      );
    }

    await qualityMonitoringService.resolveAlert(alert_id, resolution_notes);

    return NextResponse.json({
      success: true,
      message: 'Quality alert resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving quality alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve quality alert' },
      { status: 500 }
    );
  }
}