import { supabase } from '@/lib/db/supabase';

export interface CulturalIntelligenceContext {
  id: string;
  insight_id: string;
  community_id: string;
  cultural_significance_level: 'low' | 'medium' | 'high' | 'sacred' | 'restricted';
  contains_traditional_knowledge: boolean;
  traditional_knowledge_type?: string;
  knowledge_sharing_restrictions?: string;
  elder_consultation_required: boolean;
  ceremony_consultation_required: boolean;
  community_consensus_required: boolean;
  cultural_authority_approval_required: boolean;
  preferred_languages: string[];
  cultural_communication_style?: string;
  visual_representation_guidelines?: string;
  seasonal_restrictions: Record<string, any>;
  ceremonial_calendar_considerations?: string;
  traditional_territory_relevance: boolean;
  sacred_site_proximity: boolean;
  territorial_boundaries_consideration?: string;
  community_specific_protocols: Record<string, any>;
  cultural_liaison_contact?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CulturalAuthorityValidation {
  id: string;
  insight_id: string;
  community_id: string;
  cultural_authority_id: string;
  authority_role: string;
  authority_specialization?: string;
  validation_type: 'cultural_accuracy' | 'protocol_compliance' | 'sharing_appropriateness' | 'traditional_knowledge_review' | 'community_impact_assessment';
  validation_status: 'pending' | 'approved' | 'approved_with_conditions' | 'requires_modification' | 'rejected';
  validation_decision: string;
  conditions_or_modifications?: string;
  cultural_guidance?: string;
  consultation_method?: string;
  consultation_date?: string;
  consultation_duration_minutes?: number;
  consultation_location?: string;
  follow_up_required: boolean;
  follow_up_timeline?: string;
  follow_up_instructions?: string;
  validation_confidence_level?: number;
  cultural_risk_assessment?: 'low' | 'medium' | 'high' | 'critical';
  community_benefit_assessment?: 'low' | 'medium' | 'high' | 'transformational';
  created_at: string;
  updated_at: string;
  validated_at?: string;
}

export interface CulturalProtocolCompliance {
  id: string;
  insight_id: string;
  community_id: string;
  protocol_name: string;
  protocol_category: 'data_sovereignty' | 'traditional_knowledge' | 'ceremonial' | 'territorial' | 'language' | 'representation' | 'consultation' | 'consent';
  compliance_status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'under_review' | 'not_applicable';
  compliance_score?: number;
  compliance_details?: string;
  protocol_requirements: string;
  evidence_of_compliance?: string;
  compliance_verification_method?: string;
  remediation_required: boolean;
  remediation_plan?: string;
  remediation_timeline?: string;
  remediation_responsible_party?: string;
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CulturalReviewWorkflow {
  id: string;
  insight_id: string;
  community_id: string;
  workflow_type: 'standard_review' | 'expedited_review' | 'ceremonial_review' | 'consensus_review';
  workflow_status: 'initiated' | 'in_progress' | 'awaiting_authority' | 'under_review' | 'completed' | 'escalated' | 'suspended';
  current_step?: string;
  completed_steps: string[];
  remaining_steps: string[];
  estimated_completion_date?: string;
  actual_completion_date?: string;
  workflow_duration_days?: number;
  assigned_cultural_authorities: string[];
  community_liaisons: string[];
  workflow_coordinator?: string;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  cultural_urgency_justification?: string;
  communication_log: Record<string, any>[];
  workflow_notes?: string;
  escalation_reason?: string;
  suspension_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CulturalImpactAssessment {
  id: string;
  insight_id: string;
  community_id: string;
  assessment_type: 'cultural_sensitivity' | 'traditional_knowledge_impact' | 'community_relations' | 'ceremonial_impact' | 'territorial_considerations' | 'intergenerational_impact';
  potential_positive_impacts?: string;
  potential_negative_impacts?: string;
  mitigation_strategies?: string;
  enhancement_opportunities?: string;
  language_preservation_impact?: 'negative' | 'neutral' | 'positive' | 'highly_positive';
  traditional_practices_impact?: 'negative' | 'neutral' | 'positive' | 'highly_positive';
  community_cohesion_impact?: 'negative' | 'neutral' | 'positive' | 'highly_positive';
  youth_engagement_impact?: 'negative' | 'neutral' | 'positive' | 'highly_positive';
  elder_respect_impact?: 'negative' | 'neutral' | 'positive' | 'highly_positive';
  overall_cultural_impact_score?: number;
  cultural_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  cultural_recommendations?: string;
  protocol_adjustments_needed?: string;
  community_consultation_recommendations?: string;
  assessed_by?: string;
  assessment_date: string;
  assessment_methodology?: string;
  confidence_level?: number;
  reviewed_by_cultural_authority?: string;
  cultural_authority_approval: boolean;
  cultural_authority_comments?: string;
  created_at: string;
  updated_at: string;
}

export interface CulturalComplianceMetrics {
  id: string;
  community_id: string;
  aggregation_date: string;
  total_insights_reviewed: number;
  culturally_compliant_insights: number;
  non_compliant_insights: number;
  partially_compliant_insights: number;
  overall_compliance_rate?: number;
  data_sovereignty_compliance_rate?: number;
  traditional_knowledge_compliance_rate?: number;
  ceremonial_compliance_rate?: number;
  consultation_compliance_rate?: number;
  total_authority_validations: number;
  approved_validations: number;
  rejected_validations: number;
  pending_validations: number;
  average_review_duration_days?: number;
  expedited_reviews_count: number;
  escalated_reviews_count: number;
  suspended_reviews_count: number;
  positive_cultural_impact_count: number;
  negative_cultural_impact_count: number;
  neutral_cultural_impact_count: number;
  cultural_authority_satisfaction_score?: number;
  community_feedback_score?: number;
  protocol_adherence_score?: number;
  created_at: string;
  updated_at: string;
}

export class CulturalIntelligenceService {
  // =============================================
  // CULTURAL INTELLIGENCE CONTEXT
  // =============================================

  static async createCulturalContext(context: Partial<CulturalIntelligenceContext>): Promise<CulturalIntelligenceContext> {
    const { data, error } = await supabase.rpc('create_cultural_intelligence_context', {
      p_insight_id: context.insight_id,
      p_community_id: context.community_id,
      p_cultural_significance_level: context.cultural_significance_level || 'medium',
      p_contains_traditional_knowledge: context.contains_traditional_knowledge || false,
      p_traditional_knowledge_type: context.traditional_knowledge_type,
      p_elder_consultation_required: context.elder_consultation_required !== false,
      p_preferred_languages: context.preferred_languages || [],
      p_community_specific_protocols: context.community_specific_protocols || {},
      p_created_by: context.created_by
    });

    if (error) {
      console.error('Error creating cultural context:', error);
      throw error;
    }

    // Fetch the created context
    const { data: createdContext, error: fetchError } = await supabase
      .from('cultural_intelligence_context')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching created cultural context:', fetchError);
      throw fetchError;
    }

    return createdContext;
  }

  static async getCulturalContext(insightId: string): Promise<CulturalIntelligenceContext | null> {
    const { data, error } = await supabase
      .from('cultural_intelligence_context')
      .select('*')
      .eq('insight_id', insightId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching cultural context:', error);
      throw error;
    }

    return data;
  }

  static async updateCulturalContext(
    contextId: string,
    updates: Partial<CulturalIntelligenceContext>
  ): Promise<CulturalIntelligenceContext> {
    const { data, error } = await supabase
      .from('cultural_intelligence_context')
      .update(updates)
      .eq('id', contextId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cultural context:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // CULTURAL AUTHORITY VALIDATIONS
  // =============================================

  static async createCulturalValidation(validation: Partial<CulturalAuthorityValidation>): Promise<CulturalAuthorityValidation> {
    const { data, error } = await supabase
      .from('cultural_authority_validations')
      .insert(validation)
      .select()
      .single();

    if (error) {
      console.error('Error creating cultural validation:', error);
      throw error;
    }

    return data;
  }

  static async getCulturalValidations(
    insightId?: string,
    communityId?: string,
    authorityId?: string,
    status?: string
  ): Promise<CulturalAuthorityValidation[]> {
    let query = supabase
      .from('cultural_authority_validations')
      .select('*')
      .order('created_at', { ascending: false });

    if (insightId) {
      query = query.eq('insight_id', insightId);
    }

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (authorityId) {
      query = query.eq('cultural_authority_id', authorityId);
    }

    if (status) {
      query = query.eq('validation_status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural validations:', error);
      throw error;
    }

    return data || [];
  }

  static async updateCulturalValidation(
    validationId: string,
    updates: Partial<CulturalAuthorityValidation>
  ): Promise<CulturalAuthorityValidation> {
    // Set validated_at timestamp if status is being updated to a final state
    if (updates.validation_status && ['approved', 'approved_with_conditions', 'rejected'].includes(updates.validation_status)) {
      updates.validated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('cultural_authority_validations')
      .update(updates)
      .eq('id', validationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cultural validation:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // CULTURAL PROTOCOL COMPLIANCE
  // =============================================

  static async createProtocolCompliance(compliance: Partial<CulturalProtocolCompliance>): Promise<CulturalProtocolCompliance> {
    const { data, error } = await supabase
      .from('cultural_protocol_compliance')
      .insert(compliance)
      .select()
      .single();

    if (error) {
      console.error('Error creating protocol compliance:', error);
      throw error;
    }

    return data;
  }

  static async getProtocolCompliance(
    insightId?: string,
    communityId?: string,
    protocolCategory?: string,
    complianceStatus?: string
  ): Promise<CulturalProtocolCompliance[]> {
    let query = supabase
      .from('cultural_protocol_compliance')
      .select('*')
      .order('created_at', { ascending: false });

    if (insightId) {
      query = query.eq('insight_id', insightId);
    }

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (protocolCategory) {
      query = query.eq('protocol_category', protocolCategory);
    }

    if (complianceStatus) {
      query = query.eq('compliance_status', complianceStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching protocol compliance:', error);
      throw error;
    }

    return data || [];
  }

  static async updateProtocolCompliance(
    complianceId: string,
    updates: Partial<CulturalProtocolCompliance>
  ): Promise<CulturalProtocolCompliance> {
    const { data, error } = await supabase
      .from('cultural_protocol_compliance')
      .update(updates)
      .eq('id', complianceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating protocol compliance:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // CULTURAL REVIEW WORKFLOWS
  // =============================================

  static async initiateCulturalReviewWorkflow(
    insightId: string,
    communityId: string,
    workflowType: string = 'standard_review',
    assignedAuthorities: string[] = [],
    priorityLevel: string = 'medium',
    workflowCoordinator?: string
  ): Promise<CulturalReviewWorkflow> {
    const { data, error } = await supabase.rpc('initiate_cultural_review_workflow', {
      p_insight_id: insightId,
      p_community_id: communityId,
      p_workflow_type: workflowType,
      p_assigned_authorities: assignedAuthorities,
      p_priority_level: priorityLevel,
      p_workflow_coordinator: workflowCoordinator
    });

    if (error) {
      console.error('Error initiating cultural review workflow:', error);
      throw error;
    }

    // Fetch the created workflow
    const { data: createdWorkflow, error: fetchError } = await supabase
      .from('cultural_review_workflows')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching created workflow:', fetchError);
      throw fetchError;
    }

    return createdWorkflow;
  }

  static async getCulturalReviewWorkflows(
    insightId?: string,
    communityId?: string,
    workflowStatus?: string,
    authorityId?: string
  ): Promise<CulturalReviewWorkflow[]> {
    let query = supabase
      .from('cultural_review_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (insightId) {
      query = query.eq('insight_id', insightId);
    }

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (workflowStatus) {
      query = query.eq('workflow_status', workflowStatus);
    }

    if (authorityId) {
      query = query.contains('assigned_cultural_authorities', [authorityId]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural review workflows:', error);
      throw error;
    }

    return data || [];
  }

  static async updateCulturalReviewWorkflow(
    workflowId: string,
    updates: Partial<CulturalReviewWorkflow>
  ): Promise<CulturalReviewWorkflow> {
    // Set completion date if workflow is being completed
    if (updates.workflow_status === 'completed' && !updates.actual_completion_date) {
      updates.actual_completion_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('cultural_review_workflows')
      .update(updates)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cultural review workflow:', error);
      throw error;
    }

    return data;
  }

  static async addWorkflowCommunication(
    workflowId: string,
    communication: {
      timestamp: string;
      from: string;
      to: string;
      message: string;
      type: string;
    }
  ): Promise<CulturalReviewWorkflow> {
    // Get current workflow
    const { data: workflow, error: fetchError } = await supabase
      .from('cultural_review_workflows')
      .select('communication_log')
      .eq('id', workflowId)
      .single();

    if (fetchError) {
      console.error('Error fetching workflow for communication update:', fetchError);
      throw fetchError;
    }

    const updatedLog = [...(workflow.communication_log || []), communication];

    return this.updateCulturalReviewWorkflow(workflowId, {
      communication_log: updatedLog
    });
  }

  // =============================================
  // CULTURAL IMPACT ASSESSMENTS
  // =============================================

  static async createCulturalImpactAssessment(assessment: Partial<CulturalImpactAssessment>): Promise<CulturalImpactAssessment> {
    const { data, error } = await supabase
      .from('cultural_impact_assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) {
      console.error('Error creating cultural impact assessment:', error);
      throw error;
    }

    return data;
  }

  static async getCulturalImpactAssessments(
    insightId?: string,
    communityId?: string,
    assessmentType?: string,
    riskLevel?: string
  ): Promise<CulturalImpactAssessment[]> {
    let query = supabase
      .from('cultural_impact_assessments')
      .select('*')
      .order('assessment_date', { ascending: false });

    if (insightId) {
      query = query.eq('insight_id', insightId);
    }

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }

    if (riskLevel) {
      query = query.eq('cultural_risk_level', riskLevel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural impact assessments:', error);
      throw error;
    }

    return data || [];
  }

  static async updateCulturalImpactAssessment(
    assessmentId: string,
    updates: Partial<CulturalImpactAssessment>
  ): Promise<CulturalImpactAssessment> {
    const { data, error } = await supabase
      .from('cultural_impact_assessments')
      .update(updates)
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cultural impact assessment:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // CULTURAL COMPLIANCE METRICS
  // =============================================

  static async getCulturalComplianceMetrics(
    communityId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<CulturalComplianceMetrics[]> {
    let query = supabase
      .from('cultural_compliance_metrics')
      .select('*')
      .order('aggregation_date', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (startDate) {
      query = query.gte('aggregation_date', startDate);
    }

    if (endDate) {
      query = query.lte('aggregation_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural compliance metrics:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // VIEWS AND SUMMARY QUERIES
  // =============================================

  static async getCulturalIntelligenceSummary(communityId?: string) {
    let query = supabase
      .from('cultural_intelligence_summary')
      .select('*');

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural intelligence summary:', error);
      throw error;
    }

    return data || [];
  }

  static async getCulturalReviewWorkload(authorityId?: string) {
    let query = supabase
      .from('cultural_review_workload')
      .select('*');

    if (authorityId) {
      query = query.eq('cultural_authority_id', authorityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural review workload:', error);
      throw error;
    }

    return data || [];
  }

  static async getCulturalComplianceDashboard(communityId?: string) {
    let query = supabase
      .from('cultural_compliance_dashboard')
      .select('*')
      .order('aggregation_date', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cultural compliance dashboard:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // COMPREHENSIVE CULTURAL REVIEW PROCESS
  // =============================================

  static async conductComprehensiveCulturalReview(
    insightId: string,
    communityId: string,
    options: {
      culturalSignificanceLevel?: string;
      containsTraditionalKnowledge?: boolean;
      traditionalKnowledgeType?: string;
      assignedAuthorities?: string[];
      workflowType?: string;
      priorityLevel?: string;
      assessmentTypes?: string[];
    } = {}
  ): Promise<{
    context: CulturalIntelligenceContext;
    workflow: CulturalReviewWorkflow;
    protocolCompliance: CulturalProtocolCompliance[];
    impactAssessments: CulturalImpactAssessment[];
  }> {
    try {
      // 1. Create cultural context
      const context = await this.createCulturalContext({
        insight_id: insightId,
        community_id: communityId,
        cultural_significance_level: options.culturalSignificanceLevel as any || 'medium',
        contains_traditional_knowledge: options.containsTraditionalKnowledge || false,
        traditional_knowledge_type: options.traditionalKnowledgeType,
        elder_consultation_required: true,
        cultural_authority_approval_required: true,
        preferred_languages: [],
        seasonal_restrictions: {},
        community_specific_protocols: {}
      });

      // 2. Initiate review workflow
      const workflow = await this.initiateCulturalReviewWorkflow(
        insightId,
        communityId,
        options.workflowType || 'standard_review',
        options.assignedAuthorities || [],
        options.priorityLevel || 'medium'
      );

      // 3. Create protocol compliance checks
      const protocolCategories = [
        'data_sovereignty',
        'traditional_knowledge',
        'consultation',
        'consent'
      ];

      const protocolCompliance = await Promise.all(
        protocolCategories.map((category: string) =>
          this.createProtocolCompliance({
            insight_id: insightId,
            community_id: communityId,
            protocol_name: `${category.replace('_', ' ')} Protocol`,
            protocol_category: category as any,
            protocol_requirements: `Ensure compliance with ${category.replace('_', ' ')} protocols`,
            compliance_status: 'under_review',
            remediation_required: false
          })
        )
      );

      // 4. Create cultural impact assessments
      const assessmentTypes = options.assessmentTypes || [
        'cultural_sensitivity',
        'community_relations',
        'intergenerational_impact'
      ];

      const impactAssessments = await Promise.all(
        assessmentTypes.map((type: string) =>
          this.createCulturalImpactAssessment({
            insight_id: insightId,
            community_id: communityId,
            assessment_type: type as any,
            cultural_risk_level: 'medium',
            cultural_authority_approval: false,
            assessment_date: new Date().toISOString()
          })
        )
      );

      return {
        context,
        workflow,
        protocolCompliance,
        impactAssessments
      };
    } catch (error) {
      console.error('Error conducting comprehensive cultural review:', error);
      throw error;
    }
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  static async batchCreateProtocolCompliance(
    complianceRecords: Partial<CulturalProtocolCompliance>[]
  ): Promise<CulturalProtocolCompliance[]> {
    const results: CulturalProtocolCompliance[] = [];

    for (const record of complianceRecords) {
      try {
        const created = await this.createProtocolCompliance(record);
        results.push(created);
      } catch (error) {
        console.error('Error in batch protocol compliance creation:', error);
        // Continue with other records
      }
    }

    return results;
  }

  static async batchUpdateValidationStatus(
    validationIds: string[],
    status: string,
    validatedBy?: string
  ): Promise<CulturalAuthorityValidation[]> {
    const results: CulturalAuthorityValidation[] = [];

    for (const validationId of validationIds) {
      try {
        const updated = await this.updateCulturalValidation(validationId, {
          validation_status: status as any,
          validated_at: new Date().toISOString()
        });
        results.push(updated);
      } catch (error) {
        console.error('Error in batch validation status update:', error);
        // Continue with other validations
      }
    }

    return results;
  }
}