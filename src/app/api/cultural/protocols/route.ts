import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { getCulturalProtocols, checkProtocolCompliance } from '@/lib/community/cultural-safety-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const contentType = searchParams.get('contentType');
    const protocolType = searchParams.get('protocolType');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // Get cultural protocols using the service
    let protocols = [];
    
    if (contentType) {
      protocols = await getCulturalProtocols(contentType, communityId || undefined);
    } else {
      // Get all protocols
      let query = supabase
        .from('cultural_protocols')
        .select('*')
        .order('protocol_name');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      if (communityId) {
        query = query.or(`community_id.eq.${communityId},community_id.is.null`);
      }

      if (protocolType) {
        query = query.eq('protocol_type', protocolType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch protocols: ${error.message}`);
      }

      protocols = data?.map(protocol => ({
        id: protocol.id,
        protocolName: protocol.protocol_name,
        protocolType: protocol.protocol_type,
        description: protocol.description,
        applicableContent: protocol.applicable_content || [],
        restrictions: protocol.restrictions || [],
        requiredApprovals: protocol.required_approvals || [],
        consequences: protocol.consequences || [],
        isActive: protocol.is_active
      })) || [];
    }

    return NextResponse.json({ protocols });
  } catch (error) {
    console.error('Cultural protocols API error:', error);
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
      case 'createProtocol':
        const {
          protocolName,
          protocolType,
          description,
          applicableContent,
          restrictions,
          requiredApprovals,
          consequences,
          communityId
        } = data;

        if (!protocolName || !protocolType || !description) {
          return NextResponse.json(
            { error: 'Protocol name, type, and description are required' },
            { status: 400 }
          );
        }

        const { data: newProtocol, error: createError } = await supabase
          .from('cultural_protocols')
          .insert([{
            protocol_name: protocolName,
            protocol_type: protocolType,
            description,
            applicable_content: applicableContent || [],
            restrictions: restrictions || [],
            required_approvals: requiredApprovals || [],
            consequences: consequences || [],
            community_id: communityId,
            is_active: true,
            created_by: data.createdBy || 'system'
          }])
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create protocol: ${createError.message}`);
        }

        return NextResponse.json({ 
          protocol: newProtocol,
          message: 'Cultural protocol created successfully' 
        }, { status: 201 });

      case 'updateProtocol':
        const { protocolId, updates } = data;
        
        if (!protocolId || !updates) {
          return NextResponse.json(
            { error: 'Protocol ID and updates are required' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('cultural_protocols')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', protocolId);

        if (updateError) {
          throw new Error(`Failed to update protocol: ${updateError.message}`);
        }

        return NextResponse.json({ 
          message: 'Protocol updated successfully' 
        });

      case 'checkCompliance':
        const { content, contentType, communityId: checkCommunityId } = data;
        
        if (!content || !contentType) {
          return NextResponse.json(
            { error: 'Content and content type are required' },
            { status: 400 }
          );
        }

        const compliance = await checkProtocolCompliance(
          content,
          contentType,
          checkCommunityId
        );

        return NextResponse.json({ compliance });

      case 'deactivateProtocol':
        const { protocolId: deactivateId, reason } = data;
        
        if (!deactivateId) {
          return NextResponse.json(
            { error: 'Protocol ID is required' },
            { status: 400 }
          );
        }

        const { error: deactivateError } = await supabase
          .from('cultural_protocols')
          .update({
            is_active: false,
            deactivation_reason: reason,
            deactivated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', deactivateId);

        if (deactivateError) {
          throw new Error(`Failed to deactivate protocol: ${deactivateError.message}`);
        }

        return NextResponse.json({ 
          message: 'Protocol deactivated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cultural protocols POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}