import { CommunityProject, CommunityTheme, Quote, Insight } from '@/data/schemas';

/**
 * Utility functions to transform and process project data
 * These helpers make it easier to work with the complex data structures
 */

export class ProjectTransformer {
  /**
   * Extract all quotes from a project
   */
  static getAllQuotes(project: CommunityProject): Quote[] {
    const quotes: Quote[] = [];
    
    project.themes.forEach(theme => {
      quotes.push(...theme.youthVoices);
      quotes.push(...theme.communityVoices);
    });
    
    // Remove duplicates based on ID
    const uniqueQuotes = quotes.filter((quote, index, self) =>
      index === self.findIndex((q) => q.id === quote.id)
    );
    
    return uniqueQuotes;
  }

  /**
   * Get quotes by theme
   */
  static getQuotesByTheme(project: CommunityProject, themeName: string): Quote[] {
    const allQuotes = this.getAllQuotes(project);
    return allQuotes.filter(quote => 
      quote.theme.some(t => t.toLowerCase().includes(themeName.toLowerCase()))
    );
  }

  /**
   * Get youth-specific quotes
   */
  static getYouthQuotes(project: CommunityProject): Quote[] {
    const quotes: Quote[] = [];
    project.themes.forEach(theme => {
      quotes.push(...theme.youthVoices);
    });
    return quotes;
  }

  /**
   * Get shareable quotes (respecting permissions)
   */
  static getShareableQuotes(project: CommunityProject): Quote[] {
    const allQuotes = this.getAllQuotes(project);
    return allQuotes.filter(quote => 
      quote.permissions.canShare && !quote.culturallySensitive
    );
  }

  /**
   * Get actionable insights
   */
  static getActionableInsights(project: CommunityProject): Insight[] {
    return project.insights.filter(insight => insight.actionable);
  }

  /**
   * Get insights by priority
   */
  static getInsightsByPriority(
    project: CommunityProject, 
    priority: 'high' | 'medium' | 'low'
  ): Insight[] {
    return project.insights.filter(insight => insight.priority === priority);
  }

  /**
   * Get active project phases
   */
  static getActivePhases(project: CommunityProject) {
    return project.timeline.filter(phase => phase.status === 'active');
  }

  /**
   * Get themes with the most quotes
   */
  static getTopThemes(project: CommunityProject, limit: number = 5): CommunityTheme[] {
    const sortedThemes = [...project.themes].sort((a, b) => {
      const aQuotes = a.youthVoices.length + a.communityVoices.length;
      const bQuotes = b.youthVoices.length + b.communityVoices.length;
      return bQuotes - aQuotes;
    });
    
    return sortedThemes.slice(0, limit);
  }

  /**
   * Calculate project completion percentage
   */
  static getProjectCompletion(project: CommunityProject): number {
    const totalPhases = project.timeline.length;
    const completedPhases = project.timeline.filter(
      phase => phase.status === 'completed'
    ).length;
    
    return totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
  }

  /**
   * Get cultural protocols summary
   */
  static getCulturalProtocolsSummary(project: CommunityProject) {
    return project.culturalContext.culturalProtocols.map(protocol => ({
      name: protocol.name,
      importance: protocol.importance,
      keyPoints: protocol.guidelines.slice(0, 2) // First two guidelines
    }));
  }

  /**
   * Transform project for public display (remove sensitive data)
   */
  static transformForPublicDisplay(project: CommunityProject): Partial<CommunityProject> {
    const publicProject = { ...project };
    
    // Filter out culturally sensitive quotes
    publicProject.themes = project.themes.map(theme => ({
      ...theme,
      youthVoices: theme.youthVoices.filter(q => !q.culturallySensitive),
      communityVoices: theme.communityVoices.filter(q => !q.culturallySensitive)
    }));
    
    // Remove restricted metadata
    if (publicProject.metadata.dataGovernance.accessLevel !== 'public') {
      publicProject.metadata.dataGovernance = {
        ...publicProject.metadata.dataGovernance,
        owner: 'Restricted',
        custodian: 'Restricted'
      };
    }
    
    return publicProject;
  }

  /**
   * Get services by accessibility
   */
  static getAccessibleServices(project: CommunityProject) {
    const allServices = project.themes.flatMap(theme => theme.supportingServices);
    
    // Remove duplicates
    const uniqueServices = allServices.filter((service, index, self) =>
      index === self.findIndex((s) => s.id === service.id)
    );
    
    return {
      fullyAccessible: uniqueServices.filter(s => 
        s.accessibility.physical && 
        s.accessibility.cultural && 
        s.accessibility.linguistic && 
        s.accessibility.financial
      ),
      culturallyAccessible: uniqueServices.filter(s => s.accessibility.cultural),
      youthSpecific: uniqueServices.filter(s => s.youthSpecific)
    };
  }

  /**
   * Generate summary statistics
   */
  static generateSummaryStats(project: CommunityProject) {
    const allQuotes = this.getAllQuotes(project);
    const youthQuotes = this.getYouthQuotes(project);
    
    return {
      totalParticipants: project.participants.reduce((sum, group) => sum + group.size, 0),
      totalThemes: project.themes.length,
      totalQuotes: allQuotes.length,
      youthQuotePercentage: allQuotes.length > 0 
        ? (youthQuotes.length / allQuotes.length) * 100 
        : 0,
      totalInsights: project.insights.length,
      actionableInsights: this.getActionableInsights(project).length,
      projectProgress: this.getProjectCompletion(project),
      languagesSupported: project.culturalContext.languages.length,
      traditionalOwnerGroups: project.culturalContext.traditionalOwners.length
    };
  }
}