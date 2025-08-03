import { supabase } from './supabase';
import { culturalSafetyService } from './cultural-safety-service';

export interface ValidationRequest {
  id: string;
  contentId: string;
  contentType: 'ai_insight' | 'analysis_result' | 'recommendation' | 'pattern' | 'prediction';
  content: ValidationContent;
  submittedBy: string;
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  communityId: string;
  communityName: string;
  requiredValidators: number;
  currentValidators: number;
  status: 'pending' | 'in_review' | 'validated' | 'rejected' | 'needs_revision';
  deadline?: Date;
  culturalSensitivity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  traditionalKnowledgeInvolved: boolean;
  elderReviewRequired: boolean;
  validations: CommunityValidation[];
  consensusReached: boolean;
  finalScore: number;
  confidence: number;
  sourceAttribution: SourceAttribution[];
  feedback: ValidationFeedback[];
  revisions: ContentRevision[];
  completedAt?: Date;
}

export interface ValidationContent {
  title: string;
  description: string;
  aiGeneratedInsight: string;
  supportingData: any[];
  methodology: string;
  assumptions: string[];
  limitations: string[];
  culturalContext?: string;
  potentialImpact: string;
  recommendedActions?: string[];
}

export interface CommunityValidation {
  id: string;
  validatorId: string;
  validatorName: string;
  validatorRole: 'community_expert' | 'elder' | 'service_provider' | 'academic' | 'community_member';
  validatorExpertise: string[];
  culturalAffiliation?: string;
  validationScore: number; // 1-5 scale
  accuracy: number; // 1-5 scale
  relevance: number; // 1-5 scale
  culturalAppropriateness: number; // 1-5 scale
  completeness: number; // 1-5 scale
  actionability: number; // 1-5 scale
  overallAssessment: 'strongly_disagree' | 'disagree' | 'neutral' | 'agree' | 'strongly_agree';
  comments: string;
  specificConcerns: string[];
  suggestedImprovements: string[];
  culturalConsiderations: string[];
  additionalSources: string[];
  confidenceLevel: number; // 0-1 scale
  validatedAt: Date;
  timeSpentMinutes: number;
}

export interface SourceAttribution {
  id: string;
  sourceType: 'document' | 'interview' | 'survey' | 'observation' | 'database' | 'expert_knowledge';
  sourceName: string;
  sourceDescription: string;
  reliability: number; // 1-5 scale
  relevance: number; // 1-5 scale
  dateCollected: Date;
  collectedBy: string;
  culturalContext?: string;
  accessLevel: 'public' | 'community' | 'restricted' | 'confidential';
  verificationStatus: 'verified' | 'pending' | 'disputed' | 'unverified';
  weight: number; // 0-1 scale for contribution to insight
}

export interface ValidationFeedback {
  id: string;
  feedbackType: 'model_improvement' | 'process_improvement' | 'cultural_guidance' | 'methodology_suggestion';
  category: string;
  feedback: string;
  priority: 'low' | 'medium' | 'high';
  submittedBy: string;
  submittedAt: Date;
  implementationStatus: 'pending' | 'in_progress' | 'implemented' | 'rejected';
  implementationNotes?: string;
}

export interface ContentRevision {
  id: string;
  revisionNumber: number;
  revisedBy: string;
  revisionReason: string;
  changes: ContentChange[];
  revisedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ContentChange {
  field: string;
  oldValue: string;
  newValue: string;
  changeReason: string;
  culturalJustification?: string;
}

export interface CommunityValidator {
  id: string;
  name: string;
  role: CommunityValidation['validatorRole'];
  expertise: string[];
  communityAffiliation: string;
  culturalRole?: string;
  yearsOfExperience: number;
  validationHistory: ValidationHistory;
  availability: ValidatorAvailability;
  culturalKnowledgeAreas: string[];
  languages: string[];
  contactInfo: ContactInfo;
  isActive: boolean;
  certifications: string[];
  endorsements: ValidatorEndorsement[];
}

export interface ValidationHistory {
  totalValidations: number;
  averageScore: number;
  averageTimeSpent: number;
  specializations: { [area: string]: number };
  consensusRate: number; // How often they agree with final consensus
  qualityRating: number; // Peer rating of validation quality
}

export interface ValidatorAvailability {
  hoursPerWeek: number;
  preferredTimeSlots: string[];
  unavailableDates: Date[];
  responseTimeHours: number;
  maxConcurrentValidations: number;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  preferredMethod: 'email' | 'phone' | 'in_person';
  timezone: string;
}

export interface ValidatorEndorsement {
  endorsedBy: string;
  endorserRole: string;
  endorsementText: string;
  endorsedAt: Date;
  endorsementType: 'cultural_knowledge' | 'technical_expertise' | 'community_standing';
}

export interface ValidationMetrics {
  totalRequests: number;
  completedValidations: number;
  averageCompletionTime: number;
  consensusRate: number;
  averageConfidence: number;
  validatorParticipation: { [validatorId: string]: number };
  contentTypeBreakdown: { [contentType: string]: number };
  culturalComplianceScore: number;
  modelImprovementSuggestions: number;
  implementedImprovements: number;
}

export interface ValidationWorkflow {
  id: string;
  contentType: ValidationRequest['contentType'];
  requiredValidators: number;
  requiredExpertise: string[];
  elderReviewRequired: boolean;
  culturalReviewRequired: boolean;
  consensusThreshold: number; // 0-1 scale
  timeoutDays: number;
  escalationRules: EscalationRule[];
  isActive: boolean;
}

export interface EscalationRule {
  condition: string;
  action: 'add_validator' | 'extend_deadline' | 'escalate_to_elder' | 'mark_disputed';
  parameters: { [key: string]: any };
}

/**
 * Community Validation Service
 * Manages community expert review of AI-generated insights and content
 */
export class CommunityValidationService {
  private validators: Map<string, CommunityValidator> = new Map();
  private workflows: Map<string, ValidationWorkflow> = new Map();
  private activeValidations: Map<string, ValidationRequest> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the validation service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadValidators();
      await this.loadWorkflows();
      console.log('Community validation service initialized');
    } catch (error) {
      console.error('Error initializing validation service:', error);
    }
  }

  /**
   * Submit content for community validation
   */
  public async submitForValidation(
    contentData: Omit<ValidationRequest, 'id' | 'submittedAt' | 'currentValidators' | 'status' | 'validations' | 'consensusReached' | 'finalScore' | 'confidence' | 'sourceAttribution' | 'feedback' | 'revisions'>
  ): Promise<ValidationRequest> {
    try {
      const workflow = this.workflows.get(contentData.contentType);
      if (!workflow) {
        throw new Error(`No validation workflow found for content type: ${contentData.contentType}`);
      }

      const request: ValidationRequest = {
        ...contentData,
        id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date(),
        currentValidators: 0,
        status: 'pending',
        validations: [],
        consensusReached: false,
        finalScore: 0,
        confidence: 0,
        sourceAttribution: await this.generateSourceAttribution(contentData.content),
        feedback: [],
        revisions: []
      };

      // Save to database
      const { error } = await supabase
        .from('validation_requests')
        .insert([{
          id: request.id,
          content_id: request.contentId,
          content_type: request.contentType,
          content: request.content,
          submitted_by: request.submittedBy,
          submitted_at: request.submittedAt.toISOString(),
          priority: request.priority,
          community_id: request.communityId,
          community_name: request.communityName,
          required_validators: request.requiredValidators,
          current_validators: request.currentValidators,
          status: request.status,
          deadline: request.deadline?.toISOString(),
          cultural_sensitivity: request.culturalSensitivity,
          traditional_knowledge_involved: request.traditionalKnowledgeInvolved,
          elder_review_required: request.elderReviewRequired,
          validations: request.validations,
          consensus_reached: request.consensusReached,
          final_score: request.finalScore,
          confidence: request.confidence,
          source_attribution: request.sourceAttribution,
          feedback: request.feedback,
          revisions: request.revisions
        }]);

      if (error) {
        throw error;
      }

      // Assign validators
      await this.assignValidators(request);

      // Add to active validations
      this.activeValidations.set(request.id, request);

      console.log(`Validation request submitted: ${request.id}`);
      return request;
    } catch (error) {
      console.error('Error submitting validation request:', error);
      throw error;
    }
  }

  /**
   * Assign validators to a validation request
   */
  private async assignValidators(request: ValidationRequest): Promise<void> {
    try {
      const workflow = this.workflows.get(request.contentType);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Find suitable validators
      const suitableValidators = await this.findSuitableValidators(
        workflow.requiredExpertise,
        request.communityId,
        workflow.requiredValidators,
        request.elderReviewRequired
      );

      // Notify validators
      for (const validator of suitableValidators) {
        await this.notifyValidator(validator, request);
      }

      // Update request status
      await this.updateValidationStatus(request.id, 'in_review');

      console.log(`Assigned ${suitableValidators.length} validators to request ${request.id}`);
    } catch (error) {
      console.error('Error assigning validators:', error);
    }
  }

  /**
   * Submit a validation from a community validator
   */
  public async submitValidation(
    requestId: string,
    validation: Omit<CommunityValidation, 'id' | 'validatedAt'>
  ): Promise<void> {
    try {
      const request = await this.getValidationRequest(requestId);
      if (!request) {
        throw new Error('Validation request not found');
      }

      const newValidation: CommunityValidation = {
        ...validation,
        id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        validatedAt: new Date()
      };

      request.validations.push(newValidation);
      request.currentValidators = request.validations.length;
      request.updatedAt = new Date();

      // Update in database
      const { error } = await supabase
        .from('validation_requests')
        .update({
          validations: request.validations,
          current_validators: request.currentValidators,
          updated_at: request.updatedAt.toISOString()
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Check if validation is complete
      await this.checkValidationCompletion(request);

      console.log(`Validation submitted for request ${requestId} by ${validation.validatorName}`);
    } catch (error) {
      console.error('Error submitting validation:', error);
      throw error;
    }
  }

  /**
   * Check if validation is complete and calculate final scores
   */
  private async checkValidationCompletion(request: ValidationRequest): Promise<void> {
    try {
      const workflow = this.workflows.get(request.contentType);
      if (!workflow) {
        return;
      }

      // Check if we have enough validations
      if (request.validations.length < workflow.requiredValidators) {
        return;
      }

      // Calculate consensus and final scores
      const consensus = this.calculateConsensus(request.validations, workflow.consensusThreshold);
      const finalScore = this.calculateFinalScore(request.validations);
      const confidence = this.calculateConfidence(request.validations, consensus.reached);

      request.consensusReached = consensus.reached;
      request.finalScore = finalScore;
      request.confidence = confidence;
      request.status = consensus.reached ? 'validated' : 'needs_revision';
      request.completedAt = new Date();

      // Update in database
      const { error } = await supabase
        .from('validation_requests')
        .update({
          consensus_reached: request.consensusReached,
          final_score: request.finalScore,
          confidence: request.confidence,
          status: request.status,
          completed_at: request.completedAt?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) {
        throw error;
      }

      // Process feedback for model improvement
      await this.processFeedbackForModelImprovement(request);

      // Notify stakeholders of completion
      await this.notifyValidationCompletion(request);

      console.log(`Validation completed for request ${request.id}: ${request.status}`);
    } catch (error) {
      console.error('Error checking validation completion:', error);
    }
  }

  /**
   * Add feedback for model improvement
   */
  public async addValidationFeedback(
    requestId: string,
    feedback: Omit<ValidationFeedback, 'id' | 'submittedAt' | 'implementationStatus'>
  ): Promise<void> {
    try {
      const request = await this.getValidationRequest(requestId);
      if (!request) {
        throw new Error('Validation request not found');
      }

      const newFeedback: ValidationFeedback = {
        ...feedback,
        id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date(),
        implementationStatus: 'pending'
      };

      request.feedback.push(newFeedback);

      // Update in database
      const { error } = await supabase
        .from('validation_requests')
        .update({
          feedback: request.feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Queue feedback for processing
      await this.queueFeedbackForProcessing(newFeedback);

      console.log(`Feedback added to validation request ${requestId}`);
    } catch (error) {
      console.error('Error adding validation feedback:', error);
      throw error;
    }
  }

  /**
   * Revise content based on validation feedback
   */
  public async reviseContent(
    requestId: string,
    revision: Omit<ContentRevision, 'id' | 'revisionNumber' | 'revisedAt'>
  ): Promise<void> {
    try {
      const request = await this.getValidationRequest(requestId);
      if (!request) {
        throw new Error('Validation request not found');
      }

      const newRevision: ContentRevision = {
        ...revision,
        id: `revision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        revisionNumber: request.revisions.length + 1,
        revisedAt: new Date()
      };

      // Apply changes to content
      for (const change of newRevision.changes) {
        if (change.field in request.content) {
          (request.content as any)[change.field] = change.newValue;
        }
      }

      request.revisions.push(newRevision);
      request.status = 'pending'; // Reset to pending for re-validation
      request.validations = []; // Clear previous validations
      request.currentValidators = 0;
      request.consensusReached = false;

      // Update in database
      const { error } = await supabase
        .from('validation_requests')
        .update({
          content: request.content,
          revisions: request.revisions,
          status: request.status,
          validations: request.validations,
          current_validators: request.currentValidators,
          consensus_reached: request.consensusReached,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Re-assign validators for revised content
      await this.assignValidators(request);

      console.log(`Content revised for validation request ${requestId}`);
    } catch (error) {
      console.error('Error revising content:', error);
      throw error;
    }
  }

  /**
   * Get validation request by ID
   */
  public async getValidationRequest(requestId: string): Promise<ValidationRequest | null> {
    try {
      const { data, error } = await supabase
        .from('validation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapDatabaseToValidationRequest(data);
    } catch (error) {
      console.error('Error getting validation request:', error);
      return null;
    }
  }

  /**
   * Get validation requests by status
   */
  public async getValidationRequestsByStatus(
    status: ValidationRequest['status'],
    communityId?: string
  ): Promise<ValidationRequest[]> {
    try {
      let query = supabase
        .from('validation_requests')
        .select('*')
        .eq('status', status)
        .order('submitted_at', { ascending: false });

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(this.mapDatabaseToValidationRequest) || [];
    } catch (error) {
      console.error('Error getting validation requests by status:', error);
      return [];
    }
  }

  /**
   * Get validation metrics
   */
  public async getValidationMetrics(
    timeframe: 'week' | 'month' | 'quarter' = 'month',
    communityId?: string
  ): Promise<ValidationMetrics> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('validation_requests')
        .select('*')
        .gte('submitted_at', startDate.toISOString());

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const requests = data?.map(this.mapDatabaseToValidationRequest) || [];

      // Calculate metrics
      const totalRequests = requests.length;
      const completedValidations = requests.filter(r => r.status === 'validated').length;
      const averageCompletionTime = this.calculateAverageCompletionTime(requests);
      const consensusRate = completedValidations > 0 ? 
        requests.filter(r => r.consensusReached).length / completedValidations : 0;
      const averageConfidence = this.calculateAverageConfidence(requests);

      return {
        totalRequests,
        completedValidations,
        averageCompletionTime,
        consensusRate,
        averageConfidence,
        validatorParticipation: this.calculateValidatorParticipation(requests),
        contentTypeBreakdown: this.calculateContentTypeBreakdown(requests),
        culturalComplianceScore: this.calculateCulturalComplianceScore(requests),
        modelImprovementSuggestions: this.countModelImprovementSuggestions(requests),
        implementedImprovements: this.countImplementedImprovements(requests)
      };
    } catch (error) {
      console.error('Error getting validation metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private async loadValidators(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('community_validators')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      data?.forEach(validator => {
        this.validators.set(validator.id, this.mapDatabaseToValidator(validator));
      });
    } catch (error) {
      console.error('Error loading validators:', error);
    }
  }

  private async loadWorkflows(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('validation_workflows')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      data?.forEach(workflow => {
        this.workflows.set(workflow.content_type, this.mapDatabaseToWorkflow(workflow));
      });
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }

  private async generateSourceAttribution(content: ValidationContent): Promise<SourceAttribution[]> {
    // This would analyze the content and generate source attributions
    // For now, return empty array
    return [];
  }

  private async findSuitableValidators(
    requiredExpertise: string[],
    communityId: string,
    requiredCount: number,
    elderReviewRequired: boolean
  ): Promise<CommunityValidator[]> {
    const suitableValidators: CommunityValidator[] = [];
    
    for (const validator of this.validators.values()) {
      if (validator.communityAffiliation === communityId || validator.communityAffiliation === 'all') {
        const hasRequiredExpertise = requiredExpertise.some(expertise => 
          validator.expertise.includes(expertise)
        );
        
        if (hasRequiredExpertise) {
          suitableValidators.push(validator);
        }
      }
    }

    // Ensure elder is included if required
    if (elderReviewRequired) {
      const elders = suitableValidators.filter(v => v.role === 'elder');
      if (elders.length === 0) {
        // Find any available elder
        const availableElders = Array.from(this.validators.values())
          .filter(v => v.role === 'elder' && v.isActive);
        if (availableElders.length > 0) {
          suitableValidators.push(availableElders[0]);
        }
      }
    }

    // Return top validators based on availability and expertise
    return suitableValidators
      .sort((a, b) => b.validationHistory.qualityRating - a.validationHistory.qualityRating)
      .slice(0, requiredCount);
  }

  private async notifyValidator(validator: CommunityValidator, request: ValidationRequest): Promise<void> {
    // Implementation would send notification to validator
    console.log(`Notifying validator ${validator.name} of validation request ${request.id}`);
  }

  private async updateValidationStatus(requestId: string, status: ValidationRequest['status']): Promise<void> {
    const { error } = await supabase
      .from('validation_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      throw error;
    }
  }

  private calculateConsensus(validations: CommunityValidation[], threshold: number): { reached: boolean; score: number } {
    if (validations.length === 0) {
      return { reached: false, score: 0 };
    }

    const scores = validations.map(v => v.validationScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consensus reached if standard deviation is below threshold
    const consensusReached = standardDeviation <= (1 - threshold);
    
    return { reached: consensusReached, score: averageScore };
  }

  private calculateFinalScore(validations: CommunityValidation[]): number {
    if (validations.length === 0) {
      return 0;
    }

    // Weighted average based on validator expertise and cultural role
    let totalWeight = 0;
    let weightedSum = 0;

    for (const validation of validations) {
      let weight = 1;
      
      // Give more weight to elders and experts
      if (validation.validatorRole === 'elder') {
        weight = 1.5;
      } else if (validation.validatorRole === 'community_expert') {
        weight = 1.3;
      }
      
      // Adjust for confidence level
      weight *= validation.confidenceLevel;
      
      weightedSum += validation.validationScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(validations: CommunityValidation[], consensusReached: boolean): number {
    if (validations.length === 0) {
      return 0;
    }

    const averageConfidence = validations.reduce((sum, v) => sum + v.confidenceLevel, 0) / validations.length;
    const consensusBonus = consensusReached ? 0.1 : 0;
    
    return Math.min(averageConfidence + consensusBonus, 1);
  }

  private async processFeedbackForModelImprovement(request: ValidationRequest): Promise<void> {
    // Extract feedback from validations for model improvement
    for (const validation of request.validations) {
      if (validation.suggestedImprovements.length > 0) {
        for (const improvement of validation.suggestedImprovements) {
          await this.addValidationFeedback(request.id, {
            feedbackType: 'model_improvement',
            category: 'validation_suggestion',
            feedback: improvement,
            priority: 'medium',
            submittedBy: validation.validatorId
          });
        }
      }
    }
  }

  private async notifyValidationCompletion(request: ValidationRequest): Promise<void> {
    // Implementation would notify stakeholders
    console.log(`Validation completed for request ${request.id}: ${request.status}`);
  }

  private async queueFeedbackForProcessing(feedback: ValidationFeedback): Promise<void> {
    // Implementation would queue feedback for AI model improvement
    console.log(`Queuing feedback for processing: ${feedback.feedback}`);
  }

  private calculateAverageCompletionTime(requests: ValidationRequest[]): number {
    const completedRequests = requests.filter(r => r.completedAt);
    if (completedRequests.length === 0) return 0;

    const totalTime = completedRequests.reduce((sum, r) => {
      const completionTime = r.completedAt!.getTime() - r.submittedAt.getTime();
      return sum + (completionTime / (1000 * 60 * 60)); // Convert to hours
    }, 0);

    return totalTime / completedRequests.length;
  }

  private calculateAverageConfidence(requests: ValidationRequest[]): number {
    const completedRequests = requests.filter(r => r.status === 'validated');
    if (completedRequests.length === 0) return 0;

    return completedRequests.reduce((sum, r) => sum + r.confidence, 0) / completedRequests.length;
  }

  private calculateValidatorParticipation(requests: ValidationRequest[]): { [validatorId: string]: number } {
    const participation: { [validatorId: string]: number } = {};
    
    for (const request of requests) {
      for (const validation of request.validations) {
        participation[validation.validatorId] = (participation[validation.validatorId] || 0) + 1;
      }
    }
    
    return participation;
  }

  private calculateContentTypeBreakdown(requests: ValidationRequest[]): { [contentType: string]: number } {
    const breakdown: { [contentType: string]: number } = {};
    
    for (const request of requests) {
      breakdown[request.contentType] = (breakdown[request.contentType] || 0) + 1;
    }
    
    return breakdown;
  }

  private calculateCulturalComplianceScore(requests: ValidationRequest[]): number {
    const culturallyReviewedRequests = requests.filter(r => 
      r.validations.some(v => v.validatorRole === 'elder' || v.culturalAffiliation)
    );
    
    if (culturallyReviewedRequests.length === 0) return 0;
    
    const averageCulturalScore = culturallyReviewedRequests.reduce((sum, r) => {
      const culturalScores = r.validations
        .filter(v => v.validatorRole === 'elder' || v.culturalAffiliation)
        .map(v => v.culturalAppropriateness);
      
      const avgScore = culturalScores.length > 0 
        ? culturalScores.reduce((s, score) => s + score, 0) / culturalScores.length 
        : 0;
      
      return sum + avgScore;
    }, 0);
    
    return (averageCulturalScore / culturallyReviewedRequests.length) * 20; // Convert to 0-100 scale
  }

  private countModelImprovementSuggestions(requests: ValidationRequest[]): number {
    return requests.reduce((count, r) => 
      count + r.feedback.filter(f => f.feedbackType === 'model_improvement').length, 0
    );
  }

  private countImplementedImprovements(requests: ValidationRequest[]): number {
    return requests.reduce((count, r) => 
      count + r.feedback.filter(f => f.implementationStatus === 'implemented').length, 0
    );
  }

  private mapDatabaseToValidationRequest(data: any): ValidationRequest {
    return {
      id: data.id,
      contentId: data.content_id,
      contentType: data.content_type,
      content: data.content,
      submittedBy: data.submitted_by,
      submittedAt: new Date(data.submitted_at),
      priority: data.priority,
      communityId: data.community_id,
      communityName: data.community_name,
      requiredValidators: data.required_validators,
      currentValidators: data.current_validators,
      status: data.status,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      culturalSensitivity: data.cultural_sensitivity,
      traditionalKnowledgeInvolved: data.traditional_knowledge_involved,
      elderReviewRequired: data.elder_review_required,
      validations: data.validations || [],
      consensusReached: data.consensus_reached,
      finalScore: data.final_score,
      confidence: data.confidence,
      sourceAttribution: data.source_attribution || [],
      feedback: data.feedback || [],
      revisions: data.revisions || [],
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  private mapDatabaseToValidator(data: any): CommunityValidator {
    return {
      id: data.id,
      name: data.name,
      role: data.role,
      expertise: data.expertise || [],
      communityAffiliation: data.community_affiliation,
      culturalRole: data.cultural_role,
      yearsOfExperience: data.years_of_experience,
      validationHistory: data.validation_history || {
        totalValidations: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        specializations: {},
        consensusRate: 0,
        qualityRating: 0
      },
      availability: data.availability || {
        hoursPerWeek: 0,
        preferredTimeSlots: [],
        unavailableDates: [],
        responseTimeHours: 24,
        maxConcurrentValidations: 3
      },
      culturalKnowledgeAreas: data.cultural_knowledge_areas || [],
      languages: data.languages || [],
      contactInfo: data.contact_info || {},
      isActive: data.is_active,
      certifications: data.certifications || [],
      endorsements: data.endorsements || []
    };
  }

  private mapDatabaseToWorkflow(data: any): ValidationWorkflow {
    return {
      id: data.id,
      contentType: data.content_type,
      requiredValidators: data.required_validators,
      requiredExpertise: data.required_expertise || [],
      elderReviewRequired: data.elder_review_required,
      culturalReviewRequired: data.cultural_review_required,
      consensusThreshold: data.consensus_threshold,
      timeoutDays: data.timeout_days,
      escalationRules: data.escalation_rules || [],
      isActive: data.is_active
    };
  }
}

// Export singleton instance
export const communityValidationService = new CommunityValidationService();