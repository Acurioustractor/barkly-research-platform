import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const category = searchParams.get('category');
    const mediaType = searchParams.get('mediaType');
    const culturalSafety = searchParams.get('culturalSafety');
    const inspiring = searchParams.get('inspiring');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('community_stories')
      .select(`
        id,
        title,
        excerpt,
        content,
        author_name,
        category,
        media_type,
        cultural_safety,
        themes,
        likes_count,
        is_inspiring,
        published_at,
        created_at,
        updated_at
      `)
      .eq('community_id', communityId)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    if (culturalSafety) {
      query = query.eq('cultural_safety', culturalSafety);
    }

    if (inspiring === 'true') {
      query = query.eq('is_inspiring', true);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const stories = data?.map((story: any) => ({
      id: story.id,
      title: story.title,
      excerpt: story.excerpt || story.content?.substring(0, 200) + '...',
      author: story.author_name || 'Anonymous',
      category: story.category || 'general',
      publishedAt: new Date(story.published_at || story.created_at),
      mediaType: story.media_type || 'text',
      culturalSafety: story.cultural_safety || 'public',
      themes: story.themes || [],
      likes: story.likes_count || 0,
      isInspiring: story.is_inspiring || false
    })) || [];

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Stories API error:', error);
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
      content,
      excerpt,
      author_name,
      category,
      media_type,
      cultural_safety,
      themes,
      community_id,
      user_id
    } = body;

    if (!title || !content || !community_id) {
      return NextResponse.json(
        { error: 'Title, content, and community_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('community_stories')
      .insert([{
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        author_name: author_name || 'Anonymous',
        category: category || 'general',
        media_type: media_type || 'text',
        cultural_safety: cultural_safety || 'public',
        themes: themes || [],
        community_id,
        user_id,
        published: false, // Stories need moderation before publishing
        likes_count: 0,
        is_inspiring: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create story' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      story: data,
      message: 'Story submitted for review. It will be published after moderation.'
    }, { status: 201 });
  } catch (error) {
    console.error('Stories POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}