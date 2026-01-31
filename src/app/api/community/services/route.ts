import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const category = searchParams.get('category');
    const availability = searchParams.get('availability');
    const culturallySafe = searchParams.get('culturallySafe');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('community_services')
      .select(`
        id,
        name,
        description,
        category,
        location,
        contact_phone,
        contact_email,
        hours,
        availability,
        culturally_safe,
        languages,
        website,
        created_at,
        updated_at
      `)
      .eq('community_id', communityId)
      .eq('active', true)
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    if (availability) {
      query = query.eq('availability', availability);
    }

    if (culturallySafe === 'true') {
      query = query.eq('culturally_safe', true);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const services = data?.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      location: service.location,
      contact: service.contact_phone || service.contact_email || 'Contact not available',
      hours: service.hours || 'Hours not specified',
      availability: service.availability || 'unknown',
      culturallySafe: service.culturally_safe || false,
      languages: service.languages || [],
      website: service.website
    })) || [];

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Services API error:', error);
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
      name,
      description,
      category,
      location,
      contact_phone,
      contact_email,
      hours,
      availability,
      culturally_safe,
      languages,
      website,
      community_id
    } = body;

    if (!name || !description || !community_id) {
      return NextResponse.json(
        { error: 'Name, description, and community_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('community_services')
      .insert([{
        name,
        description,
        category: category || 'general',
        location,
        contact_phone,
        contact_email,
        hours,
        availability: availability || 'available',
        culturally_safe: culturally_safe || false,
        languages: languages || [],
        website,
        community_id,
        active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (error) {
    console.error('Services POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}