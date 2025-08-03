# Barkly Research Platform - Database Design & Architecture

## Overview

This document outlines the comprehensive database design for the Barkly Research Platform, ensuring alignment between backend data structures and frontend functionality while maintaining cultural protocols and community data sovereignty.

## Architecture Principles

### Cultural Data Sovereignty
- Community ownership of data with technical controls
- Granular access permissions based on cultural sensitivity
- Audit trails for all data access and modifications
- Consent management with withdrawal capabilities

### Scalable Intelligence
- AI-ready data structures for document analysis
- Flexible schema supporting diverse community data
- Real-time analytics and reporting capabilities
- Integration points for external systems

## Core Database Schema

### 1. User Management & Cultural Access

```sql
-- Users table with cultural context
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'community_member',
    community_id UUID REFERENCES communities(id),
    cultural_access_level access_level NOT NULL DEFAULT 'public',
    elder_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Communities table
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    traditional_name VARCHAR(255),
    region VARCHAR(255),
    population INTEGER,
    primary_language VARCHAR(100),
    cultural_protocols JSONB,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions and cultural access
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_type permission_type NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 2. Document Management & Cultural Protocols

```sql
-- Documents with cultural sensitivity controls
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    cultural_sensitivity cultural_sensitivity NOT NULL DEFAULT 'public',
    community_id UUID REFERENCES communities(id),
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Cultural protocol fields
    elder_approval_required BOOLEAN DEFAULT FALSE,
    elder_approved_by UUID REFERENCES users(id),
    elder_approval_date TIMESTAMP WITH TIME ZONE,
    consent_form_signed BOOLEAN DEFAULT FALSE,
    consent_withdrawal_date TIMESTAMP WITH TIME ZONE,
    
    -- Processing status
    processing_status processing_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    ai_analysis_complete BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    title TEXT,
    description TEXT,
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    document_type document_type,
    
    -- Search and analysis
    content_text TEXT,
    summary TEXT,
    key_themes TEXT[],
    entities JSONB,
    sentiment_score DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document access log for audit trail
CREATE TABLE document_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    access_type access_type NOT NULL,
    access_granted BOOLEAN NOT NULL,
    denial_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. BRD Initiative & Governance Tracking

```sql
-- BRD Initiatives (28 total initiatives)
CREATE TABLE brd_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_number INTEGER UNIQUE NOT NULL, -- 1-28
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category initiative_category NOT NULL,
    
    -- Governance
    lead_agency VARCHAR(255) NOT NULL,
    partners TEXT[],
    community_input_required BOOLEAN DEFAULT TRUE,
    youth_engagement_required BOOLEAN DEFAULT FALSE,
    
    -- Financial
    total_budget DECIMAL(12,2),
    budget_allocated DECIMAL(12,2) DEFAULT 0,
    budget_spent DECIMAL(12,2) DEFAULT 0,
    
    -- Timeline
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Status tracking
    status initiative_status DEFAULT 'planning',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Outcomes
    key_milestones JSONB,
    barriers TEXT[],
    enablers TEXT[],
    expected_outcomes TEXT[],
    actual_outcomes TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initiative progress updates
CREATE TABLE initiative_progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES brd_initiatives(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES users(id) NOT NULL,
    progress_percentage INTEGER NOT NULL,
    milestone_achieved TEXT,
    barriers_encountered TEXT[],
    enablers_identified TEXT[],
    next_steps TEXT,
    community_feedback TEXT,
    update_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Governance decisions
CREATE TABLE governance_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    decision_date DATE NOT NULL,
    decision_makers TEXT[] NOT NULL,
    community_consultation_conducted BOOLEAN DEFAULT FALSE,
    consultation_details TEXT,
    decision_outcome TEXT NOT NULL,
    implementation_date DATE,
    status decision_status DEFAULT 'pending',
    related_initiatives UUID[] DEFAULT '{}',
    impact_assessment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Youth Voice & Community Engagement

```sql
-- Youth priorities and roundtable outcomes
CREATE TABLE youth_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category youth_priority_category NOT NULL,
    priority_level priority_level DEFAULT 'medium',
    
    -- Community support
    youth_votes INTEGER DEFAULT 0,
    community_support_percentage INTEGER,
    elder_endorsement BOOLEAN DEFAULT FALSE,
    
    -- Implementation
    status priority_status DEFAULT 'identified',
    assigned_to UUID REFERENCES users(id),
    target_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    
    -- Tracking
    identified_by UUID REFERENCES users(id),
    identified_date DATE NOT NULL,
    last_reviewed DATE,
    
    -- Related initiatives
    related_brd_initiatives UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Youth roundtable sessions
CREATE TABLE youth_roundtable_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_date DATE NOT NULL,
    location VARCHAR(255),
    facilitator_id UUID REFERENCES users(id),
    participant_count INTEGER NOT NULL,
    participants UUID[],
    
    -- Session content
    agenda_items TEXT[],
    key_discussions TEXT,
    priorities_identified UUID[],
    action_items TEXT[],
    next_session_date DATE,
    
    -- Documentation
    meeting_notes TEXT,
    audio_recording_path TEXT,
    cultural_protocols_followed BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Training & Employment Pipeline

```sql
-- Training pathways
CREATE TABLE training_pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    qualification_level qualification_level NOT NULL,
    sector employment_sector NOT NULL,
    duration_months INTEGER NOT NULL,
    
    -- Cultural integration
    cultural_components BOOLEAN DEFAULT FALSE,
    cultural_mentor_available BOOLEAN DEFAULT FALSE,
    two_way_learning BOOLEAN DEFAULT FALSE,
    on_country_delivery BOOLEAN DEFAULT FALSE,
    
    -- Capacity and outcomes
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    employment_rate DECIMAL(5,2),
    
    -- Status
    status pathway_status DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student journeys
CREATE TABLE student_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(255) NOT NULL, -- Anonymized for privacy
    pathway_id UUID REFERENCES training_pathways(id) NOT NULL,
    
    -- Enrollment
    enrollment_date DATE NOT NULL,
    completion_date DATE,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    
    -- Progress tracking
    current_stage journey_stage DEFAULT 'enrolled',
    progress_percentage INTEGER DEFAULT 0,
    
    -- Support systems
    cultural_mentor_id UUID REFERENCES users(id),
    mentor_relationship_quality mentor_quality,
    wrap_around_services TEXT[],
    
    -- Employment outcomes
    employment_secured BOOLEAN DEFAULT FALSE,
    employer VARCHAR(255),
    job_title VARCHAR(255),
    employment_start_date DATE,
    employment_type employment_type,
    employment_sector employment_sector,
    
    -- Cultural factors
    cultural_identity_maintained BOOLEAN DEFAULT TRUE,
    community_connection_strength connection_strength DEFAULT 'strong',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employment outcomes tracking
CREATE TABLE employment_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_journey_id UUID REFERENCES student_journeys(id),
    employer VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    employment_type employment_type NOT NULL,
    sector employment_sector NOT NULL,
    
    -- Employment details
    start_date DATE NOT NULL,
    end_date DATE,
    hourly_wage DECIMAL(8,2),
    hours_per_week INTEGER,
    
    -- Cultural support
    cultural_mentoring_available BOOLEAN DEFAULT FALSE,
    workplace_cultural_safety BOOLEAN DEFAULT FALSE,
    
    -- Retention tracking
    status employment_status DEFAULT 'active',
    retention_months INTEGER DEFAULT 0,
    career_progression BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Community Stories & Cultural Knowledge

```sql
-- Community stories with cultural protocols
CREATE TABLE community_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    storyteller_name VARCHAR(255), -- May be anonymous
    storyteller_id UUID REFERENCES users(id),
    community_id UUID REFERENCES communities(id),
    
    -- Story content
    story_text TEXT,
    audio_file_path TEXT,
    video_file_path TEXT,
    image_paths TEXT[],
    
    -- Cultural classification
    cultural_sensitivity cultural_sensitivity NOT NULL DEFAULT 'public',
    story_category story_category NOT NULL,
    themes TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    
    -- Cultural protocols
    elder_approval_required BOOLEAN DEFAULT FALSE,
    elder_approved_by UUID REFERENCES users(id),
    elder_approval_date TIMESTAMP WITH TIME ZONE,
    consent_form_signed BOOLEAN DEFAULT FALSE,
    consent_can_be_withdrawn BOOLEAN DEFAULT TRUE,
    consent_withdrawn_date TIMESTAMP WITH TIME ZONE,
    
    -- Publication
    status story_status DEFAULT 'pending_review',
    published_date TIMESTAMP WITH TIME ZONE,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    community_impact_rating INTEGER CHECK (community_impact_rating >= 1 AND community_impact_rating <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story access and sharing log
CREATE TABLE story_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES community_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    access_type access_type NOT NULL,
    access_granted BOOLEAN NOT NULL,
    cultural_protocol_check BOOLEAN DEFAULT TRUE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Systems Change & Policy Impact

```sql
-- Systems change initiatives
CREATE TABLE systems_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    target_system VARCHAR(255) NOT NULL,
    change_category change_category NOT NULL,
    change_type change_type NOT NULL,
    
    -- Impact assessment
    impact_level impact_level DEFAULT 'medium',
    expected_beneficiaries INTEGER,
    actual_beneficiaries INTEGER,
    
    -- Implementation
    status change_status DEFAULT 'identified',
    progress_percentage INTEGER DEFAULT 0,
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Stakeholders
    lead_organization VARCHAR(255),
    key_stakeholders TEXT[],
    community_involvement_level involvement_level DEFAULT 'consulted',
    
    -- Barriers and enablers
    barriers TEXT[],
    enablers TEXT[],
    lessons_learned TEXT[],
    
    -- Outcomes
    expected_outcomes TEXT[],
    actual_outcomes TEXT[],
    success_metrics JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy impact tracking
CREATE TABLE policy_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_area VARCHAR(255) NOT NULL,
    policy_title VARCHAR(500) NOT NULL,
    change_description TEXT NOT NULL,
    
    -- Scope and impact
    impact_level impact_level NOT NULL,
    geographic_scope geographic_scope DEFAULT 'regional',
    beneficiaries INTEGER,
    
    -- Implementation
    status policy_status DEFAULT 'proposed',
    implementation_date DATE,
    review_date DATE,
    
    -- Community engagement
    community_consultation_conducted BOOLEAN DEFAULT FALSE,
    consultation_method TEXT,
    community_feedback_incorporated BOOLEAN DEFAULT FALSE,
    
    -- Related systems changes
    related_systems_changes UUID[],
    related_brd_initiatives UUID[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. AI Analysis & Intelligence

```sql
-- AI analysis results
CREATE TABLE ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type analysis_type NOT NULL,
    analysis_version VARCHAR(50) NOT NULL,
    
    -- Analysis results
    themes JSONB,
    entities JSONB,
    sentiment_analysis JSONB,
    key_insights TEXT[],
    summary TEXT,
    confidence_score DECIMAL(3,2),
    
    -- Cultural considerations
    cultural_content_detected BOOLEAN DEFAULT FALSE,
    cultural_review_required BOOLEAN DEFAULT FALSE,
    cultural_sensitivity_override cultural_sensitivity,
    
    -- Processing metadata
    processing_time_seconds INTEGER,
    model_used VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-document analysis and patterns
CREATE TABLE document_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_a_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    document_b_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    relationship_strength DECIMAL(3,2) NOT NULL,
    shared_themes TEXT[],
    shared_entities JSONB,
    analysis_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform analytics and insights
CREATE TABLE platform_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(12,2) NOT NULL,
    metric_type metric_type NOT NULL,
    dimension_filters JSONB,
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Custom Types and Enums

```sql
-- User and access types
CREATE TYPE user_role AS ENUM ('community_member', 'youth_member', 'elder', 'researcher', 'admin', 'government_partner');
CREATE TYPE access_level AS ENUM ('public', 'community', 'sacred');
CREATE TYPE permission_type AS ENUM ('view', 'edit', 'delete', 'approve', 'admin');
CREATE TYPE access_type AS ENUM ('view', 'download', 'edit', 'share');

-- Document types
CREATE TYPE cultural_sensitivity AS ENUM ('public', 'community', 'sacred');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'requires_review');
CREATE TYPE document_type AS ENUM ('policy', 'research', 'report', 'community_story', 'meeting_notes', 'other');

-- BRD and governance types
CREATE TYPE initiative_category AS ENUM ('economic', 'social', 'governance', 'infrastructure', 'cultural');
CREATE TYPE initiative_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE decision_status AS ENUM ('pending', 'approved', 'implemented', 'under_review');

-- Youth and community types
CREATE TYPE youth_priority_category AS ENUM ('safe_house', 'wellbeing', 'education', 'sports', 'employment', 'cultural');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE priority_status AS ENUM ('identified', 'planning', 'in_progress', 'completed', 'deferred');

-- Training and employment types
CREATE TYPE qualification_level AS ENUM ('certificate_i', 'certificate_ii', 'certificate_iii', 'certificate_iv', 'diploma', 'degree');
CREATE TYPE employment_sector AS ENUM ('construction', 'community_services', 'retail', 'government', 'mining', 'tourism', 'other');
CREATE TYPE pathway_status AS ENUM ('active', 'completed', 'suspended', 'cancelled');
CREATE TYPE journey_stage AS ENUM ('enrolled', 'in_progress', 'completed', 'employed', 'withdrawn');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'casual', 'apprenticeship', 'traineeship');
CREATE TYPE employment_status AS ENUM ('active', 'completed', 'terminated', 'transitioned');
CREATE TYPE mentor_quality AS ENUM ('excellent', 'good', 'fair', 'poor', 'not_applicable');
CREATE TYPE connection_strength AS ENUM ('strong', 'moderate', 'weak', 'disconnected');

-- Story and cultural types
CREATE TYPE story_category AS ENUM ('success_story', 'cultural_knowledge', 'challenge', 'innovation', 'healing');
CREATE TYPE story_status AS ENUM ('pending_review', 'approved', 'published', 'archived', 'withdrawn');

-- Systems change types
CREATE TYPE change_category AS ENUM ('policy', 'service_delivery', 'funding', 'governance', 'cultural_competency');
CREATE TYPE change_type AS ENUM ('structural', 'procedural', 'cultural', 'resource');
CREATE TYPE change_status AS ENUM ('identified', 'in_progress', 'implemented', 'evaluated', 'failed');
CREATE TYPE impact_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE involvement_level AS ENUM ('led', 'partnered', 'consulted', 'informed');
CREATE TYPE policy_status AS ENUM ('proposed', 'approved', 'implemented', 'evaluated', 'repealed');
CREATE TYPE geographic_scope AS ENUM ('local', 'regional', 'territory', 'national');

-- AI and analysis types
CREATE TYPE analysis_type AS ENUM ('theme_extraction', 'entity_recognition', 'sentiment_analysis', 'summary_generation', 'relationship_mapping');
CREATE TYPE relationship_type AS ENUM ('similar_theme', 'shared_entity', 'temporal_sequence', 'causal_relationship', 'contradictory');
CREATE TYPE metric_type AS ENUM ('count', 'percentage', 'average', 'sum', 'ratio');
```

## Data Relationships & Integration Points

### Frontend-Backend Alignment

1. **Cultural Access Control**: Database permissions directly enforce frontend access restrictions
2. **Real-Time Updates**: Database triggers update frontend caches for immediate reflection
3. **Search Integration**: Full-text search indexes support frontend search functionality
4. **Analytics Pipeline**: Aggregated views provide data for frontend dashboards
5. **Audit Compliance**: All user actions logged for cultural protocol compliance

### API Integration Points

1. **Document Processing**: Upload → Cultural Classification → AI Analysis → Frontend Display
2. **Initiative Tracking**: Progress Updates → Stakeholder Notifications → Dashboard Updates
3. **Youth Engagement**: Priority Submission → Community Voting → Implementation Tracking
4. **Story Sharing**: Cultural Review → Elder Approval → Community Publication
5. **Systems Monitoring**: Real-time Metrics → Alert Generation → Admin Dashboards

This comprehensive database design ensures our backend can support all frontend functionality while maintaining the cultural protocols and community data sovereignty principles that are central to the Barkly Research Platform's mission.