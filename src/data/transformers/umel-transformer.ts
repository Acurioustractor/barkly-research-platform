import { 
  UMELFramework, 
  MeasurementPhase,
  EvaluationPhase,
  LearningPhase,
  MiddleSpaceData 
} from '@/data/schemas';

/**
 * Utility functions to transform and process UMEL framework data
 * Helps with analysis, visualization, and reporting
 */

export class UMELTransformer {
  /**
   * Get current phase of UMEL cycle
   */
  static getCurrentPhase(umel: UMELFramework): string {
    // Determine based on completion of phases
    // Check which phases have substantial data
    if (umel.learning.keyLearnings.length > 0) {
      return 'learning';
    } else if (umel.evaluation.findings.strengths.length > 0) {
      return 'evaluation';
    } else if (umel.measurement.indicators.length > 0 && umel.measurement.baseline?.established) {
      return 'measurement';
    } else {
      return 'understanding';
    }
  }

  /**
   * Calculate UMEL progress percentage
   */
  static calculateProgress(umel: UMELFramework): number {
    let progress = 0;
    
    // Understanding phase (25%)
    if (umel.understanding.initialFindings.length > 0) {
      progress += 25;
    }
    
    // Measurement phase (25%)
    if (umel.measurement.baseline?.established) {
      progress += 25;
    }
    
    // Evaluation phase (25%)
    if (umel.evaluation.findings.strengths.length > 0) {
      progress += 25;
    }
    
    // Learning phase (25%)
    if (umel.learning.keyLearnings.length > 0) {
      progress += 25;
    }
    
    return progress;
  }

  /**
   * Get key insights from middle space
   */
  static getMiddleSpaceInsights(middleSpace: MiddleSpaceData) {
    return {
      totalCommunityInsights: middleSpace.communityKnowledge.length,
      totalAcademicInsights: middleSpace.academicKnowledge.length,
      sharedUnderstandings: middleSpace.sharedUnderstanding.length,
      fullConsensus: middleSpace.sharedUnderstanding.filter(
        su => su.consensusLevel === 'full'
      ).length,
      activeActions: middleSpace.collaborativeActions.filter(
        action => new Date(action.timeline.start) <= new Date()
      ).length
    };
  }

  /**
   * Get actionable recommendations
   */
  static getActionableRecommendations(umel: UMELFramework) {
    return umel.evaluation.recommendations
      .filter(rec => rec.priority === 'high')
      .map(rec => ({
        ...rec,
        dependencies: rec.actionRequired,
        readiness: rec.actionRequired.length > 0 ? 'requires-planning' : 'ready'
      }));
  }

  /**
   * Extract measurement trends
   */
  static getMeasurementTrends(measurement: MeasurementPhase) {
    if (!measurement.baseline?.established) {
      return { status: 'baseline-pending', trends: [] };
    }
    
    // In a real implementation, this would compare current to baseline
    return {
      status: 'monitoring',
      baselineDate: measurement.baseline.date,
      indicators: measurement.indicators.map(indicator => ({
        name: indicator.name,
        type: indicator.type,
        frequency: indicator.frequency,
        culturallyAppropriate: indicator.culturallyAppropriate
      }))
    };
  }

  /**
   * Get learning products by audience
   */
  static getLearningProductsByAudience(
    learning: LearningPhase,
    targetAudience: string
  ) {
    return learning.knowledgeProducts.filter(
      product => product.audience.includes(targetAudience)
    );
  }

  /**
   * Generate SWOT analysis from evaluation
   */
  static generateSWOTAnalysis(evaluation: EvaluationPhase) {
    return {
      strengths: evaluation.findings.strengths,
      weaknesses: evaluation.findings.weaknesses,
      opportunities: evaluation.findings.opportunities,
      threats: evaluation.findings.threats,
      priority: this.calculateSWOTPriority(evaluation.findings)
    };
  }

  /**
   * Calculate SWOT priority based on findings
   */
  private static calculateSWOTPriority(findings: EvaluationPhase['findings']): string {
    const totalFindings = 
      findings.strengths.length + 
      findings.weaknesses.length + 
      findings.opportunities.length + 
      findings.threats.length;
    
    if (findings.threats.length / totalFindings > 0.3) {
      return 'address-threats';
    } else if (findings.opportunities.length / totalFindings > 0.3) {
      return 'leverage-opportunities';
    } else if (findings.weaknesses.length / totalFindings > 0.3) {
      return 'strengthen-weaknesses';
    } else {
      return 'build-on-strengths';
    }
  }

  /**
   * Get collaboration readiness score
   */
  static getCollaborationReadiness(middleSpace: MiddleSpaceData): number {
    let score = 0;
    
    // Community knowledge contribution (30%)
    if (middleSpace.communityKnowledge.length > 5) score += 30;
    else score += (middleSpace.communityKnowledge.length / 5) * 30;
    
    // Academic integration (20%)
    const appropriateAcademic = middleSpace.academicKnowledge.filter(
      ak => ak.culturalAppropriateness === 'high'
    ).length;
    score += (appropriateAcademic / Math.max(1, middleSpace.academicKnowledge.length)) * 20;
    
    // Shared understanding (30%)
    const consensusRate = middleSpace.sharedUnderstanding.filter(
      su => su.consensusLevel === 'full' || su.consensusLevel === 'majority'
    ).length / Math.max(1, middleSpace.sharedUnderstanding.length);
    score += consensusRate * 30;
    
    // Active collaboration (20%)
    if (middleSpace.collaborativeActions.length > 0) score += 20;
    
    return Math.round(score);
  }

  /**
   * Extract key themes across UMEL phases
   */
  static extractKeyThemes(umel: UMELFramework): string[] {
    const themes = new Set<string>();
    
    // From understanding phase
    umel.understanding.keyQuestions.forEach(q => {
      // Simple theme extraction - in reality would use NLP
      if (q.includes('youth')) themes.add('youth');
      if (q.includes('culture')) themes.add('culture');
      if (q.includes('service')) themes.add('services');
    });
    
    // From middle space
    umel.middleSpace.communityKnowledge.forEach(ck => {
      ck.themes.forEach(theme => themes.add(theme));
    });
    
    return Array.from(themes);
  }

  /**
   * Generate executive summary
   */
  static generateExecutiveSummary(umel: UMELFramework) {
    const progress = this.calculateProgress(umel);
    const currentPhase = this.getCurrentPhase(umel);
    const keyLearnings = umel.learning.keyLearnings
      .filter(kl => kl.shareability === 'public')
      .slice(0, 3);
    
    return {
      projectStatus: umel.status,
      currentPhase,
      progressPercentage: progress,
      iterationCycle: umel.iterationCycle,
      topFindings: umel.understanding.initialFindings.slice(0, 3),
      priorityRecommendations: this.getActionableRecommendations(umel).slice(0, 3),
      keyLearnings: keyLearnings.map(kl => kl.insight),
      nextSteps: umel.nextSteps.slice(0, 3)
    };
  }
}