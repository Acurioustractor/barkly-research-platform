import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const type = searchParams.get('type');
    const urgent = searchParams.get('urgent');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('community_opportunities')
      .select(`
        id,
        title,
        description,
        type,
        organization,
        deadline,
        location,
        requirements,
        contact_info,
        is_urgent,
        is_active,
        created_at,
        updated_at
      `)
      .eq('community_id', communityId)
      .order('is_urgent', { ascending: false })
      .order('deadline', { ascending: true, nullsFirst: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (urgent === 'true') {
      query = query.eq('is_urgent', true);
    }

    if (active !== 'false') {
      query = query.eq('is_active', true);
    }

    // Filter out expired opportunities
    const now = new Date().toISOString();
    query = query.or(`deadline.is.null,deadline.gte.${now}`);

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const opportunities = data?.map(opportunity => ({
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      type: opportunity.type || 'general',
      organization: opportunity.organization || 'Unknown',
      deadline: opportunity.deadline ? new Date(opportunity.deadline) : undefined,
      location: opportunity.location || 'Location TBD',
      requirements: opportunity.requirements || [],
      contact: opportunity.contact_info || 'Contact not available',
      isUrgent: opportunity.is_urgent || false
    })) || [];

    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type,
      organization,
      deadline,
      location,
      requirements,
      contact_info,
      is_urgent,
      community_id
    } = body;

    if (!title || !description || !community_id) {
      return NextResponse.json(
        { error: 'Title, description, and community_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('community_opportunities')
      .insert([{
        title,
        description,
        type: type || 'general',
        organization: organization || 'Unknown',
        deadline: deadline ? new Date(deadline).toISOString() : null,
        location: location || 'Location TBD',
        requirements: requirements || [],
        contact_info: contact_info || '',
        is_urgent: is_urgent || false,
        is_active: true,
        community_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create opportunity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (error) {
    console.error('Opportunities POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}