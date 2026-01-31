import { supabase } from '@/lib/db/supabase';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'workshop' | 'meeting' | 'ceremony' | 'training' | 'consultation' | 'celebration';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  currentAttendees: number;
  communityId: string;
  organizerId: string;
  organizerName: string;
  
  // Cultural considerations
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  requiresElderPresence: boolean;
  culturalProtocols: string[];
  traditionalElements: string[];
  
  // Workshop-specific fields
  facilitators: string[];
  materials: string[];
  learningObjectives: string[];
  prerequisites: string[];
  
  // Registration settings
  requiresRegistration: boolean;
  registrationDeadline?: Date;
  registrationQuestions: RegistrationQuestion[];
  
  // Knowledge capture
  knowledgeCaptureEnabled: boolean;
  captureSettings: {
    allowRecording: boolean;
    allowPhotos: boolean;
    allowNotes: boolean;
    requiresConsent: boolean;
  };
  
  // Metadata
  tags: string[];
  relatedDocuments: string[];
  relatedStories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number';
  options?: string[];
  required: boolean;
  culturalConsideration?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  communityRole?: string;
  responses: Record<string, any>;
  status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  registeredAt: Date;
  confirmedAt?: Date;
  attendedAt?: Date;
  culturalConsiderations?: string[];
}

export interface WorkshopSession {
  id: string;
  eventId: string;
  sessionTitle: string;
  sessionDescription: string;
  facilitator: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  materials: string[];
  objectives: string[];
  notes?: string;
  recordings?: string[];
  photos?: string[];
  documents?: string[];
  attendees: string[];
  keyInsights: string[];
  actionItems: ActionItem[];
  culturalNotes?: string[];
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  relatedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeCapture {
  id: string;
  eventId: string;
  sessionId?: string;
  captureType: 'notes' | 'recording' | 'photo' | 'document' | 'insight';
  title: string;
  content?: string;
  fileUrl?: string;
  timestamp: Date;
  capturedBy: string;
  tags: string[];
  culturalSafety: 'public' | 'community' | 'restricted' | 'sacred';
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  approved: boolean;
  metadata?: any;
}

/**
 * Create a new community event
 */
export async function createEvent(eventData: Partial<CommunityEvent>): Promise<string> {
  try {
    // Validate required fields
    if (!eventData.title || !eventData.startDate || !eventData.communityId) {
      throw new Error('Title, start date, and community ID are required');
    }

    const event = {
      title: eventData.title,
      description: eventData.description || '',
      event_type: eventData.eventType || 'workshop',
      status: eventData.status || 'draft',
      start_date: eventData.startDate.toISOString(),
      end_date: eventData.endDate?.toISOString() || eventData.startDate.toISOString(),
      location: eventData.location || '',
      is_virtual: eventData.isVirtual || false,
      virtual_link: eventData.virtualLink,
      max_attendees: eventData.maxAttendees,
      current_attendees: 0,
      community_id: eventData.communityId,
      organizer_id: eventData.organizerId || 'system',
      organizer_name: eventData.organizerName || 'System',
      
      // Cultural considerations
      cultural_safety: eventData.culturalSafety || 'public',
      requires_elder_presence: eventData.requiresElderPresence || false,
      cultural_protocols: eventData.culturalProtocols || [],
      traditional_elements: eventData.traditionalElements || [],
      
      // Workshop fields
      facilitators: eventData.facilitators || [],
      materials: eventData.materials || [],
      learning_objectives: eventData.learningObjectives || [],
      prerequisites: eventData.prerequisites || [],
      
      // Registration
      requires_registration: eventData.requiresRegistration || false,
      registration_deadline: eventData.registrationDeadline?.toISOString(),
      registration_questions: eventData.registrationQuestions || [],
      
      // Knowledge capture
      knowledge_capture_enabled: eventData.knowledgeCaptureEnabled || false,
      capture_settings: eventData.captureSettings || {
        allowRecording: false,
        allowPhotos: false,
        allowNotes: true,
        requiresConsent: true
      },
      
      // Metadata
      tags: eventData.tags || [],
      related_documents: eventData.relatedDocuments || [],
      related_stories: eventData.relatedStories || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('community_events')
      .insert([event])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Get events for a community
 */
export async function getCommunityEvents(
  communityId: string,
  filters?: {
    eventType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    culturalSafety?: string;
  }
): Promise<CommunityEvent[]> {
  try {
    let query = supabase
      .from('community_events')
      .select('*')
      .eq('community_id', communityId)
      .order('start_date', { ascending: true });

    // Apply filters
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate.toISOString());
    }
    if (filters?.culturalSafety) {
      query = query.eq('cultural_safety', filters.culturalSafety);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    return (data || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      status: event.status,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      location: event.location,
      isVirtual: event.is_virtual,
      virtualLink: event.virtual_link,
      maxAttendees: event.max_attendees,
      currentAttendees: event.current_attendees,
      communityId: event.community_id,
      organizerId: event.organizer_id,
      organizerName: event.organizer_name,
      culturalSafety: event.cultural_safety,
      requiresElderPresence: event.requires_elder_presence,
      culturalProtocols: event.cultural_protocols || [],
      traditionalElements: event.traditional_elements || [],
      facilitators: event.facilitators || [],
      materials: event.materials || [],
      learningObjectives: event.learning_objectives || [],
      prerequisites: event.prerequisites || [],
      requiresRegistration: event.requires_registration,
      registrationDeadline: event.registration_deadline ? new Date(event.registration_deadline) : undefined,
      registrationQuestions: event.registration_questions || [],
      knowledgeCaptureEnabled: event.knowledge_capture_enabled,
      captureSettings: event.capture_settings || {},
      tags: event.tags || [],
      relatedDocuments: event.related_documents || [],
      relatedStories: event.related_stories || [],
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching community events:', error);
    return [];
  }
}

/**
 * Register for an event
 */
export async function registerForEvent(
  eventId: string,
  registrationData: {
    userId?: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone?: string;
    communityRole?: string;
    responses: Record<string, any>;
    culturalConsiderations?: string[];
  }
): Promise<string> {
  try {
    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from('community_events')
      .select('max_attendees, current_attendees, requires_registration')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    if (!event.requires_registration) {
      throw new Error('This event does not require registration');
    }

    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      throw new Error('Event is at capacity');
    }

    // Create registration
    const registration = {
      event_id: eventId,
      user_id: registrationData.userId,
      attendee_name: registrationData.attendeeName,
      attendee_email: registrationData.attendeeEmail,
      attendee_phone: registrationData.attendeePhone,
      community_role: registrationData.communityRole,
      responses: registrationData.responses,
      status: 'registered',
      registered_at: new Date().toISOString(),
      cultural_considerations: registrationData.culturalConsiderations || []
    };

    const { data, error } = await supabase
      .from('event_registrations')
      .insert([registration])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to register for event: ${error.message}`);
    }

    // Update attendee count
    await supabase
      .from('community_events')
      .update({ 
        current_attendees: event.current_attendees + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    return data.id;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
}

/**
 * Create a workshop session
 */
export async function createWorkshopSession(
  sessionData: Partial<WorkshopSession>
): Promise<string> {
  try {
    if (!sessionData.eventId || !sessionData.sessionTitle || !sessionData.startTime) {
      throw new Error('Event ID, session title, and start time are required');
    }

    const session = {
      event_id: sessionData.eventId,
      session_title: sessionData.sessionTitle,
      session_description: sessionData.sessionDescription || '',
      facilitator: sessionData.facilitator || '',
      start_time: sessionData.startTime.toISOString(),
      end_time: sessionData.endTime?.toISOString() || sessionData.startTime.toISOString(),
      location: sessionData.location,
      materials: sessionData.materials || [],
      objectives: sessionData.objectives || [],
      notes: sessionData.notes,
      recordings: sessionData.recordings || [],
      photos: sessionData.photos || [],
      documents: sessionData.documents || [],
      attendees: sessionData.attendees || [],
      key_insights: sessionData.keyInsights || [],
      action_items: sessionData.actionItems || [],
      cultural_notes: sessionData.culturalNotes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('workshop_sessions')
      .insert([session])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create workshop session: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error creating workshop session:', error);
    throw error;
  }
}

/**
 * Capture knowledge during an event
 */
export async function captureKnowledge(
  captureData: Partial<KnowledgeCapture>
): Promise<string> {
  try {
    if (!captureData.eventId || !captureData.captureType || !captureData.title) {
      throw new Error('Event ID, capture type, and title are required');
    }

    const capture = {
      event_id: captureData.eventId,
      session_id: captureData.sessionId,
      capture_type: captureData.captureType,
      title: captureData.title,
      content: captureData.content,
      file_url: captureData.fileUrl,
      timestamp: captureData.timestamp?.toISOString() || new Date().toISOString(),
      captured_by: captureData.capturedBy || 'anonymous',
      tags: captureData.tags || [],
      cultural_safety: captureData.culturalSafety || 'public',
      requires_review: captureData.requiresReview || false,
      reviewed_by: captureData.reviewedBy,
      reviewed_at: captureData.reviewedAt?.toISOString(),
      approved: captureData.approved || false,
      metadata: captureData.metadata || {},
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('knowledge_captures')
      .insert([capture])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to capture knowledge: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error capturing knowledge:', error);
    throw error;
  }
}

/**
 * Get event registrations
 */
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch registrations: ${error.message}`);
    }

    return (data || []).map(reg => ({
      id: reg.id,
      eventId: reg.event_id,
      userId: reg.user_id,
      attendeeName: reg.attendee_name,
      attendeeEmail: reg.attendee_email,
      attendeePhone: reg.attendee_phone,
      communityRole: reg.community_role,
      responses: reg.responses || {},
      status: reg.status,
      registeredAt: new Date(reg.registered_at),
      confirmedAt: reg.confirmed_at ? new Date(reg.confirmed_at) : undefined,
      attendedAt: reg.attended_at ? new Date(reg.attended_at) : undefined,
      culturalConsiderations: reg.cultural_considerations || []
    }));
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return [];
  }
}

/**
 * Get workshop sessions for an event
 */
export async function getWorkshopSessions(eventId: string): Promise<WorkshopSession[]> {
  try {
    const { data, error } = await supabase
      .from('workshop_sessions')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch workshop sessions: ${error.message}`);
    }

    return (data || []).map(session => ({
      id: session.id,
      eventId: session.event_id,
      sessionTitle: session.session_title,
      sessionDescription: session.session_description,
      facilitator: session.facilitator,
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time),
      location: session.location,
      materials: session.materials || [],
      objectives: session.objectives || [],
      notes: session.notes,
      recordings: session.recordings || [],
      photos: session.photos || [],
      documents: session.documents || [],
      attendees: session.attendees || [],
      keyInsights: session.key_insights || [],
      actionItems: session.action_items || [],
      culturalNotes: session.cultural_notes || []
    }));
  } catch (error) {
    console.error('Error fetching workshop sessions:', error);
    return [];
  }
}

/**
 * Get knowledge captures for an event
 */
export async function getEventKnowledgeCaptures(
  eventId: string,
  sessionId?: string
): Promise<KnowledgeCapture[]> {
  try {
    let query = supabase
      .from('knowledge_captures')
      .select('*')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch knowledge captures: ${error.message}`);
    }

    return (data || []).map(capture => ({
      id: capture.id,
      eventId: capture.event_id,
      sessionId: capture.session_id,
      captureType: capture.capture_type,
      title: capture.title,
      content: capture.content,
      fileUrl: capture.file_url,
      timestamp: new Date(capture.timestamp),
      capturedBy: capture.captured_by,
      tags: capture.tags || [],
      culturalSafety: capture.cultural_safety,
      requiresReview: capture.requires_review,
      reviewedBy: capture.reviewed_by,
      reviewedAt: capture.reviewed_at ? new Date(capture.reviewed_at) : undefined,
      approved: capture.approved,
      metadata: capture.metadata || {}
    }));
  } catch (error) {
    console.error('Error fetching knowledge captures:', error);
    return [];
  }
}

/**
 * Update event status
 */
export async function updateEventStatus(
  eventId: string,
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('community_events')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to update event status: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating event status:', error);
    throw error;
  }
}

/**
 * Mark attendee as attended
 */
export async function markAttendance(
  registrationId: string,
  attended: boolean = true
): Promise<void> {
  try {
    const updateData: any = {
      status: attended ? 'attended' : 'no_show',
      updated_at: new Date().toISOString()
    };

    if (attended) {
      updateData.attended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('event_registrations')
      .update(updateData)
      .eq('id', registrationId);

    if (error) {
      throw new Error(`Failed to mark attendance: ${error.message}`);
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
}

/**
 * Get event statistics
 */
export async function getEventStatistics(
  communityId: string,
  timeRange?: { start: Date; end: Date }
): Promise<{
  totalEvents: number;
  completedEvents: number;
  totalAttendees: number;
  averageAttendance: number;
  eventsByType: Record<string, number>;
  knowledgeCaptured: number;
  culturalEvents: number;
}> {
  try {
    let query = supabase
      .from('community_events')
      .select('*')
      .eq('community_id', communityId);

    if (timeRange) {
      query = query
        .gte('start_date', timeRange.start.toISOString())
        .lte('end_date', timeRange.end.toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch event statistics: ${error.message}`);
    }

    const stats = {
      totalEvents: events?.length || 0,
      completedEvents: events?.filter(e => e.status === 'completed').length || 0,
      totalAttendees: events?.reduce((sum, e) => sum + (e.current_attendees || 0), 0) || 0,
      averageAttendance: 0,
      eventsByType: {} as Record<string, number>,
      knowledgeCaptured: 0,
      culturalEvents: events?.filter(e => e.cultural_safety !== 'public').length || 0
    };

    // Calculate average attendance
    const completedEvents = events?.filter(e => e.status === 'completed') || [];
    if (completedEvents.length > 0) {
      stats.averageAttendance = Math.round(
        completedEvents.reduce((sum, e) => sum + (e.current_attendees || 0), 0) / completedEvents.length
      );
    }

    // Count events by type
    events?.forEach(event => {
      stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1;
    });

    // Get knowledge capture count
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      const { data: captures } = await supabase
        .from('knowledge_captures')
        .select('id')
        .in('event_id', eventIds);
      
      stats.knowledgeCaptured = captures?.length || 0;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    return {
      totalEvents: 0,
      completedEvents: 0,
      totalAttendees: 0,
      averageAttendance: 0,
      eventsByType: {},
      knowledgeCaptured: 0,
      culturalEvents: 0
    };
  }
}