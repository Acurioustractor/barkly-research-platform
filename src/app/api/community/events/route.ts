import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const category = searchParams.get('category');
    const upcoming = searchParams.get('upcoming');
    const registrationRequired = searchParams.get('registrationRequired');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('community_events')
      .select(`
        id,
        title,
        description,
        event_date,
        location,
        organizer,
        category,
        registration_required,
        cultural_protocols,
        capacity,
        registered_count,
        is_active,
        created_at,
        updated_at
      `)
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (registrationRequired === 'true') {
      query = query.eq('registration_required', true);
    }

    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('event_date', now);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const events = data?.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.event_date),
      location: event.location || 'Location TBD',
      organizer: event.organizer || 'Unknown',
      category: event.category || 'general',
      registrationRequired: event.registration_required || false,
      culturalProtocols: event.cultural_protocols || [],
      capacity: event.capacity,
      registered: event.registered_count || 0
    })) || [];

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Events API error:', error);
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
      event_date,
      location,
      organizer,
      category,
      registration_required,
      cultural_protocols,
      capacity,
      community_id
    } = body;

    if (!title || !description || !event_date || !community_id) {
      return NextResponse.json(
        { error: 'Title, description, event_date, and community_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('community_events')
      .insert([{
        title,
        description,
        event_date: new Date(event_date).toISOString(),
        location: location || 'Location TBD',
        organizer: organizer || 'Unknown',
        category: category || 'general',
        registration_required: registration_required || false,
        cultural_protocols: cultural_protocols || [],
        capacity: capacity || null,
        registered_count: 0,
        is_active: true,
        community_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}