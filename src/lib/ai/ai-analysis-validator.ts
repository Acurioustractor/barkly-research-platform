/**
 * AI Analysis Quality Validation System
 * Validates the quality and consistency of AI-generated analysis results
 */

import { prisma } from '@/lib/database-safe';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-1 quality score
  issues: string[];
  recommendations: string[];
  metrics: {
    completeness: number;
    coherence: number;
    accuracy: number;
    relevance: number;
    consistency: number;
  };
}

export interface ThemeValidation {
  theme: string;
  confidence: number;
  validation: ValidationResult;
}

export interface QuoteValidation {
  quote: string;
  context: string;
  speaker?: string;
  validation: ValidationResult;
}

export interface InsightValidation {
  insight: string;
  type: string;
  validation: ValidationResult;
}

export interface SystemEntityValidation {
  entity: string;
  type: string;
  validation: ValidationResult;
}

export class AIAnalysisValidator {
  private minValidationScore = 0.6;
  private consistencyThreshold = 0.8;
  
  /**
   * Validate extracted themes for quality and consistency
   */
  async validateThemes(themes: Array<{
    theme: string;
    confidence: number;
    evidence?: string;
    documentId?: string;
  }>): Promise<ThemeValidation[]> {
    const validations: ThemeValidation[] = [];
    
    for (const theme of themes) {
      const validation = await this.validateTheme(theme);
      validations.push({
        theme: theme.theme,
        confidence: theme.confidence,
        validation
      });
    }
    
    // Cross-validate for consistency
    const consistencyValidation = this.validateThemeConsistency(validations);
    
    return validations.map(v => ({
      ...v,
      validation: {
        ...v.validation,
        metrics: {
          ...v.validation.metrics,
          consistency: consistencyValidation.get(v.theme) || 0
        }
      }
    }));
  }
  
  /**
   * Validate extracted quotes for accuracy and relevance
   */
  async validateQuotes(quotes: Array<{
    text: string;
    context: string;
    speaker?: string;
    page?: number;
    confidence: number;
    documentId?: string;
  }>): Promise<QuoteValidation[]> {
    const validations: QuoteValidation[] = [];
    
    for (const quote of quotes) {
      const validation = await this.validateQuote(quote);
      validations.push({
        quote: quote.text,
        context: quote.context,
        speaker: quote.speaker,
        validation
      });
    }
    
    return validations;
  }
  
  /**
   * Validate generated insights for quality and coherence
   */
  async validateInsights(insights: Array<{
    insight: string;
    type: string;
    confidence: number;
    evidence?: string;
    documentId?: string;
  }>): Promise<InsightValidation[]> {
    const validations: InsightValidation[] = [];
    
    for (const insight of insights) {
      const validation = await this.validateInsight(insight);
      validations.push({
        insight: insight.insight,
        type: insight.type,
        validation
      });
    }
    
    return validations;
  }
  
  /**
   * Validate system entities for completeness and accuracy
   */
  async validateSystemEntities(entities: Array<{
    name: string;
    type: string;
    description: string;
    confidence: number;
    evidence?: string;
    documentId?: string;
  }>): Promise<SystemEntityValidation[]> {
    const validations: SystemEntityValidation[] = [];
    
    for (const entity of entities) {
      const validation = await this.validateSystemEntity(entity);
      validations.push({
        entity: entity.name,
        type: entity.type,
        validation
      });
    }
    
    return validations;
  }
  
  /**
   * Validate overall analysis quality across all components
   */
  async validateCompleteAnalysis(analysis: {
    themes: any[];
    quotes: any[];
    insights: any[];
    entities?: any[];
    documentId: string;
  }): Promise<{
    overallScore: number;
    componentScores: {
      themes: number;
      quotes: number;
      insights: number;
      entities: number;
    };
    issues: string[];
    recommendations: string[];
    shouldReprocess: boolean;
  }> {
    const [themeValidations, quoteValidations, insightValidations, entityValidations] = await Promise.all([
      this.validateThemes(analysis.themes || []),
      this.validateQuotes(analysis.quotes || []),
      this.validateInsights(analysis.insights || []),
      this.validateSystemEntities(analysis.entities || [])
    ]);
    
    // Calculate component scores
    const componentScores = {
      themes: this.calculateAverageScore(themeValidations.map(v => v.validation.score)),
      quotes: this.calculateAverageScore(quoteValidations.map(v => v.validation.score)),
      insights: this.calculateAverageScore(insightValidations.map(v => v.validation.score)),
      entities: this.calculateAverageScore(entityValidations.map(v => v.validation.score))
    };
    
    // Calculate overall score
    const overallScore = (componentScores.themes + componentScores.quotes + componentScores.insights + componentScores.entities) / 4;
    
    // Collect issues and recommendations
    const allValidations = [
      ...themeValidations.map(v => v.validation),
      ...quoteValidations.map(v => v.validation),
      ...insightValidations.map(v => v.validation),
      ...entityValidations.map(v => v.validation)
    ];
    
    const issues = allValidations.flatMap(v => v.issues);
    const recommendations = allValidations.flatMap(v => v.recommendations);
    
    return {
      overallScore,
      componentScores,
      issues: [...new Set(issues)],
      recommendations: [...new Set(recommendations)],
      shouldReprocess: overallScore < this.minValidationScore
    };
  }
  
  /**
   * Validate a single theme
   */
  private async validateTheme(theme: {
    theme: string;
    confidence: number;
    evidence?: string;
    documentId?: string;
  }): Promise<ValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check theme length and clarity
    if (theme.theme.length < 5) {
      issues.push('Theme is too short');
      recommendations.push('Provide more descriptive themes');
    }
    
    if (theme.theme.length > 100) {
      issues.push('Theme is too long');
      recommendations.push('Condense themes to key concepts');
    }
    
    // Check for vague or generic themes
    const genericThemes = ['various', 'different', 'multiple', 'general', 'other'];
    if (genericThemes.some(generic => theme.theme.toLowerCase().includes(generic))) {
      issues.push('Theme is too generic');
      recommendations.push('Use more specific and descriptive themes');
    }
    
    // Check confidence alignment
    if (theme.confidence < 0.5 && theme.theme.length > 50) {
      issues.push('Complex theme with low confidence');
      recommendations.push('Simplify complex themes or increase confidence threshold');
    }
    
    // Validate against existing themes for consistency
    let consistencyScore = 1.0;
    if (theme.documentId) {
      consistencyScore = await this.checkThemeConsistency(theme.theme, theme.documentId);
    }
    
    // Calculate metrics
    const completeness = this.calculateThemeCompleteness(theme.theme);
    const coherence = this.calculateThemeCoherence(theme.theme);
    const accuracy = theme.confidence;
    const relevance = this.calculateThemeRelevance(theme.theme);
    
    const score = (completeness + coherence + accuracy + relevance + consistencyScore) / 5;
    
    return {
      isValid: score >= this.minValidationScore,
      score,
      issues,
      recommendations,
      metrics: {
        completeness,
        coherence,
        accuracy,
        relevance,
        consistency: consistencyScore
      }
    };
  }
  
  /**
   * Validate a single quote
   */
  private async validateQuote(quote: {
    text: string;
    context: string;
    speaker?: string;
    page?: number;
    confidence: number;
    documentId?: string;
  }): Promise<ValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check quote length
    if (quote.text.length < 10) {
      issues.push('Quote is too short');
      recommendations.push('Extract longer, more meaningful quotes');
    }
    
    if (quote.text.length > 500) {
      issues.push('Quote is too long');
      recommendations.push('Extract shorter, more focused quotes');
    }
    
    // Check for proper quote formatting
    if (!quote.text.match(/^[A-Z"]/) || !quote.text.match(/[.!?"]$/)) {
      issues.push('Quote formatting may be incorrect');
      recommendations.push('Ensure quotes are properly formatted');
    }
    
    // Check context quality
    if (quote.context.length < 20) {
      issues.push('Context is too brief');
      recommendations.push('Provide more comprehensive context');
    }
    
    // Check speaker attribution
    if (quote.speaker && quote.speaker.length < 2) {
      issues.push('Speaker attribution is too brief');
      recommendations.push('Provide full speaker identification');
    }
    
    // Calculate metrics
    const completeness = this.calculateQuoteCompleteness(quote);
    const coherence = this.calculateQuoteCoherence(quote.text, quote.context);
    const accuracy = quote.confidence;
    const relevance = this.calculateQuoteRelevance(quote.text);
    
    const score = (completeness + coherence + accuracy + relevance) / 4;
    
    return {
      isValid: score >= this.minValidationScore,
      score,
      issues,
      recommendations,
      metrics: {
        completeness,
        coherence,
        accuracy,
        relevance,
        consistency: 1.0 // Quotes don't need consistency validation
      }
    };
  }
  
  /**
   * Validate a single insight
   */
  private async validateInsight(insight: {
    insight: string;
    type: string;
    confidence: number;
    evidence?: string;
    documentId?: string;
  }): Promise<ValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check insight length and depth
    if (insight.insight.length < 20) {
      issues.push('Insight is too brief');
      recommendations.push('Provide more detailed insights');
    }
    
    if (insight.insight.length > 300) {
      issues.push('Insight is too verbose');
      recommendations.push('Condense insights to key points');
    }
    
    // Check for actionable insights
    const actionWords = ['should', 'could', 'recommend', 'suggest', 'propose', 'implement', 'consider'];
    const hasActionableContent = actionWords.some(word => insight.insight.toLowerCase().includes(word));
    
    if (!hasActionableContent && insight.type === 'recommendation') {
      issues.push('Recommendation lacks actionable content');
      recommendations.push('Include specific actionable recommendations');
    }
    
    // Check evidence quality
    if (insight.evidence && insight.evidence.length < 10) {
      issues.push('Evidence is insufficient');
      recommendations.push('Provide stronger evidence for insights');
    }
    
    // Calculate metrics
    const completeness = this.calculateInsightCompleteness(insight);
    const coherence = this.calculateInsightCoherence(insight.insight);
    const accuracy = insight.confidence;
    const relevance = this.calculateInsightRelevance(insight.insight, insight.type);
    
    const score = (completeness + coherence + accuracy + relevance) / 4;
    
    return {
      isValid: score >= this.minValidationScore,
      score,
      issues,
      recommendations,
      metrics: {
        completeness,
        coherence,
        accuracy,
        relevance,
        consistency: 1.0 // Insights evaluated individually
      }
    };
  }
  
  /**
   * Validate a single system entity
   */
  private async validateSystemEntity(entity: {
    name: string;
    type: string;
    description: string;
    confidence: number;
    evidence?: string;
    documentId?: string;
  }): Promise<ValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check entity name quality
    if (entity.name.length < 3) {
      issues.push('Entity name is too short');
      recommendations.push('Use more descriptive entity names');
    }
    
    if (entity.name.length > 100) {
      issues.push('Entity name is too long');
      recommendations.push('Use concise entity names');
    }
    
    // Check description quality
    if (entity.description.length < 10) {
      issues.push('Entity description is too brief');
      recommendations.push('Provide more detailed entity descriptions');
    }
    
    // Check entity type validity
    const validTypes = ['SERVICE', 'THEME', 'OUTCOME', 'FACTOR'];
    if (!validTypes.includes(entity.type)) {
      issues.push(`Invalid entity type: ${entity.type}`);
      recommendations.push('Use valid entity types: SERVICE, THEME, OUTCOME, FACTOR');
    }
    
    // Calculate metrics
    const completeness = this.calculateEntityCompleteness(entity);
    const coherence = this.calculateEntityCoherence(entity.name, entity.description);
    const accuracy = entity.confidence;
    const relevance = this.calculateEntityRelevance(entity.name, entity.type);
    
    const score = (completeness + coherence + accuracy + relevance) / 4;
    
    return {
      isValid: score >= this.minValidationScore,
      score,
      issues,
      recommendations,
      metrics: {
        completeness,
        coherence,
        accuracy,
        relevance,
        consistency: 1.0 // Entity consistency checked separately
      }
    };
  }
  
  /**
   * Check theme consistency across documents
   */
  private async checkThemeConsistency(theme: string, documentId: string): Promise<number> {
    try {
      if (!prisma) return 1.0;
      
      // Get similar themes from database
      const similarThemes = await prisma.documentTheme.findMany({
        where: {
          documentId: { not: documentId },
          theme: { contains: theme.substring(0, 20) }
        },
        take: 10
      });
      
      if (similarThemes.length === 0) return 1.0;
      
      // Calculate similarity scores
      const similarities = similarThemes.map(t => 
        this.calculateTextSimilarity(theme, t.theme)
      );
      
      return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    } catch (error) {
      console.error('Error checking theme consistency:', error);
      return 0.8; // Default consistency score
    }
  }
  
  /**
   * Validate consistency across all themes
   */
  private validateThemeConsistency(validations: ThemeValidation[]): Map<string, number> {
    const consistencyMap = new Map<string, number>();
    
    for (let i = 0; i < validations.length; i++) {
      const theme1 = validations[i];
      if (!theme1) continue;
      
      let totalSimilarity = 0;
      let count = 0;
      
      for (let j = 0; j < validations.length; j++) {
        if (i !== j) {
          const theme2 = validations[j];
          if (theme2) {
            const similarity = this.calculateTextSimilarity(theme1.theme, theme2.theme);
            totalSimilarity += similarity;
            count++;
          }
        }
      }
      
      const avgSimilarity = count > 0 ? totalSimilarity / count : 1.0;
      consistencyMap.set(theme1.theme, avgSimilarity);
    }
    
    return consistencyMap;
  }
  
  /**
   * Calculate text similarity between two strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Calculate theme-specific metrics
   */
  private calculateThemeCompleteness(theme: string): number {
    const minLength = 5;
    const maxLength = 100;
    const length = theme.length;
    
    if (length < minLength) return 0.3;
    if (length > maxLength) return 0.7;
    
    return Math.min(1.0, length / 50);
  }
  
  private calculateThemeCoherence(theme: string): number {
    // Check for coherent noun phrases
    const words = theme.split(/\s+/);
    const hasCoherentStructure = words.length >= 2 && words.length <= 6;
    
    return hasCoherentStructure ? 0.8 : 0.5;
  }
  
  private calculateThemeRelevance(theme: string): number {
    // Check for youth-related keywords
    const youthKeywords = ['youth', 'young', 'teen', 'adolescent', 'student', 'child', 'community'];
    const hasYouthRelevance = youthKeywords.some(keyword => 
      theme.toLowerCase().includes(keyword)
    );
    
    return hasYouthRelevance ? 0.9 : 0.7;
  }
  
  /**
   * Calculate quote-specific metrics
   */
  private calculateQuoteCompleteness(quote: {
    text: string;
    context: string;
    speaker?: string;
  }): number {
    let score = 0.5; // Base score
    
    if (quote.text.length >= 20) score += 0.2;
    if (quote.context.length >= 50) score += 0.2;
    if (quote.speaker && quote.speaker.length >= 2) score += 0.1;
    
    return Math.min(1.0, score);
  }
  
  private calculateQuoteCoherence(text: string, context: string): number {
    // Check if quote seems to flow naturally from context
    const contextWords = new Set(context.toLowerCase().split(/\s+/));
    const quoteWords = new Set(text.toLowerCase().split(/\s+/));
    
    const overlap = [...contextWords].filter(word => quoteWords.has(word)).length;
    const totalWords = contextWords.size + quoteWords.size;
    
    return Math.min(1.0, (overlap / totalWords) * 4);
  }
  
  private calculateQuoteRelevance(text: string): number {
    // Check for meaningful content
    const meaningfulWords = text.split(/\s+/).filter(word => 
      word.length > 3 && !['that', 'this', 'with', 'from', 'they', 'there', 'where'].includes(word.toLowerCase())
    );
    
    return Math.min(1.0, meaningfulWords.length / 10);
  }
  
  /**
   * Calculate insight-specific metrics
   */
  private calculateInsightCompleteness(insight: {
    insight: string;
    type: string;
    evidence?: string;
  }): number {
    let score = 0.5; // Base score
    
    if (insight.insight.length >= 30) score += 0.2;
    if (insight.evidence && insight.evidence.length >= 20) score += 0.2;
    if (insight.type && insight.type.length >= 3) score += 0.1;
    
    return Math.min(1.0, score);
  }
  
  private calculateInsightCoherence(insight: string): number {
    // Check for logical structure
    const sentences = insight.split(/[.!?]+/).filter(s => s.trim());
    const hasLogicalFlow = sentences.length >= 1 && sentences.length <= 4;
    
    return hasLogicalFlow ? 0.8 : 0.5;
  }
  
  private calculateInsightRelevance(insight: string, type: string): number {
    const typeKeywords = {
      'recommendation': ['should', 'recommend', 'suggest', 'propose'],
      'observation': ['shows', 'indicates', 'reveals', 'demonstrates'],
      'analysis': ['because', 'therefore', 'consequently', 'as a result']
    };
    
    const keywords = typeKeywords[type as keyof typeof typeKeywords] || [];
    const hasRelevantKeywords = keywords.some(keyword => 
      insight.toLowerCase().includes(keyword)
    );
    
    return hasRelevantKeywords ? 0.9 : 0.6;
  }
  
  /**
   * Calculate entity-specific metrics
   */
  private calculateEntityCompleteness(entity: {
    name: string;
    type: string;
    description: string;
  }): number {
    let score = 0.3; // Base score
    
    if (entity.name.length >= 5) score += 0.2;
    if (entity.description.length >= 20) score += 0.3;
    if (entity.type.length >= 3) score += 0.2;
    
    return Math.min(1.0, score);
  }
  
  private calculateEntityCoherence(name: string, description: string): number {
    // Check if description relates to name
    const nameWords = new Set(name.toLowerCase().split(/\s+/));
    const descWords = new Set(description.toLowerCase().split(/\s+/));
    
    const overlap = [...nameWords].filter(word => descWords.has(word)).length;
    const coherence = overlap > 0 ? 0.8 : 0.5;
    
    return coherence;
  }
  
  private calculateEntityRelevance(name: string, type: string): number {
    const typeRelevance = {
      'SERVICE': 0.9,
      'THEME': 0.8,
      'OUTCOME': 0.9,
      'FACTOR': 0.7
    };
    
    return typeRelevance[type as keyof typeof typeRelevance] || 0.5;
  }
  
  /**
   * Calculate average score from array of scores
   */
  private calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  /**
   * Get validation configuration
   */
  getValidationConfig(): {
    minValidationScore: number;
    consistencyThreshold: number;
  } {
    return {
      minValidationScore: this.minValidationScore,
      consistencyThreshold: this.consistencyThreshold
    };
  }
  
  /**
   * Update validation configuration
   */
  updateValidationConfig(config: {
    minValidationScore?: number;
    consistencyThreshold?: number;
  }): void {
    if (config.minValidationScore !== undefined) {
      this.minValidationScore = config.minValidationScore;
    }
    if (config.consistencyThreshold !== undefined) {
      this.consistencyThreshold = config.consistencyThreshold;
    }
  }
}