import { 
  NarrativeExperience, 
  StoryArc, 
  StoryChapter, 
  AdventurePath 
} from '@/data/schemas';

/**
 * Utility functions to transform and process storytelling data
 * Helps with navigation, progress tracking, and content filtering
 */

export class StoryTransformer {
  /**
   * Get all chapters from a narrative experience
   */
  static getAllChapters(narrative: NarrativeExperience): StoryChapter[] {
    const chapters: StoryChapter[] = [];
    
    narrative.storyArcs.forEach(arc => {
      chapters.push(...arc.chapters);
    });
    
    return chapters;
  }

  /**
   * Find a chapter by ID
   */
  static findChapter(
    narrative: NarrativeExperience, 
    chapterId: string
  ): StoryChapter | undefined {
    return this.getAllChapters(narrative).find(chapter => chapter.id === chapterId);
  }

  /**
   * Get available next chapters from current chapter
   */
  static getNextChapters(
    narrative: NarrativeExperience,
    currentChapterId: string
  ): StoryChapter[] {
    const currentChapter = this.findChapter(narrative, currentChapterId);
    if (!currentChapter) return [];
    
    const nextChapterIds = currentChapter.nextChoices.map(choice => choice.nextChapterId);
    return nextChapterIds
      .map(id => this.findChapter(narrative, id))
      .filter((chapter): chapter is StoryChapter => chapter !== undefined);
  }

  /**
   * Build a chapter path (breadcrumb trail)
   */
  static buildChapterPath(
    narrative: NarrativeExperience,
    currentChapterId: string
  ): StoryChapter[] {
    const path: StoryChapter[] = [];
    let chapter = this.findChapter(narrative, currentChapterId);
    
    while (chapter) {
      path.unshift(chapter);
      if (chapter.previousChapterId) {
        chapter = this.findChapter(narrative, chapter.previousChapterId);
      } else {
        break;
      }
    }
    
    return path;
  }

  /**
   * Calculate reading progress for a story arc
   */
  static calculateProgress(
    arc: StoryArc,
    visitedChapterIds: Set<string>
  ): number {
    const totalChapters = arc.chapters.length;
    const visitedChapters = arc.chapters.filter(
      chapter => visitedChapterIds.has(chapter.id)
    ).length;
    
    return totalChapters > 0 ? (visitedChapters / totalChapters) * 100 : 0;
  }

  /**
   * Get chapters by theme
   */
  static getChaptersByTheme(
    narrative: NarrativeExperience,
    theme: string
  ): StoryChapter[] {
    return this.getAllChapters(narrative).filter(
      chapter => chapter.themes.includes(theme)
    );
  }

  /**
   * Check if content has cultural warnings
   */
  static hasCulturalWarnings(chapter: StoryChapter): boolean {
    return chapter.culturalWarning?.present ?? false;
  }

  /**
   * Filter chapters for audience
   */
  static filterChaptersForAudience(
    narrative: NarrativeExperience,
    audienceType: string
  ): StoryChapter[] {
    const appropriateAudience = narrative.culturalGuidance.appropriateAudience;
    
    if (!appropriateAudience.includes(audienceType)) {
      return []; // Not appropriate for this audience
    }
    
    // Filter out chapters with restrictions
    return this.getAllChapters(narrative).filter(chapter => {
      // Add more sophisticated filtering based on audience
      if (audienceType === 'children' && chapter.culturalWarning?.present) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get all unique themes from narrative
   */
  static getAllThemes(narrative: NarrativeExperience): string[] {
    const themes = new Set<string>();
    
    this.getAllChapters(narrative).forEach(chapter => {
      chapter.themes.forEach(theme => themes.add(theme));
    });
    
    return Array.from(themes);
  }

  /**
   * Calculate time to complete narrative
   */
  static estimateReadingTime(narrative: NarrativeExperience): number {
    // Rough estimate: 200 words per minute, average 300 words per chapter
    const totalChapters = this.getAllChapters(narrative).length;
    const averageWordsPerChapter = 300;
    const readingSpeed = 200;
    
    return Math.ceil((totalChapters * averageWordsPerChapter) / readingSpeed);
  }

  /**
   * Get adventure path outcomes based on choices
   */
  static evaluateAdventureOutcome(
    path: AdventurePath,
    userChoices: string[]
  ): typeof path.possibleEndings[0] | undefined {
    // This is a simplified evaluation - in reality would be more complex
    const positiveChoices = userChoices.filter(choiceId => {
      const choice = path.choices.find(c => c.id === choiceId);
      return choice?.impact?.type === 'positive';
    }).length;
    
    const choiceRatio = userChoices.length > 0 
      ? positiveChoices / userChoices.length 
      : 0;
    
    if (choiceRatio >= 0.8) {
      return path.possibleEndings.find(ending => ending.type === 'positive');
    } else if (choiceRatio >= 0.5) {
      return path.possibleEndings.find(ending => ending.type === 'realistic');
    } else {
      return path.possibleEndings.find(ending => ending.type === 'challenging');
    }
  }

  /**
   * Generate chapter summary for preview
   */
  static generateChapterSummary(chapter: StoryChapter) {
    const firstSentence = chapter.narrative.split('.')[0] + '.';
    const dataPointsCount = chapter.dataPoints.length;
    const hasWarning = chapter.culturalWarning?.present ?? false;
    
    return {
      id: chapter.id,
      title: chapter.title,
      preview: firstSentence,
      themes: chapter.themes,
      dataPoints: dataPointsCount,
      choices: chapter.nextChoices.length,
      hasWarning,
      estimatedReadTime: Math.ceil(chapter.narrative.split(' ').length / 200)
    };
  }

  /**
   * Transform story data for different reading levels
   */
  static adaptReadingLevel(
    chapter: StoryChapter,
    level: 'basic' | 'intermediate' | 'advanced'
  ): StoryChapter {
    // This is a placeholder - in reality would use NLP to adjust text
    const adaptedChapter = { ...chapter };
    
    if (level === 'basic') {
      // Simplify language, shorter sentences
      adaptedChapter.narrative = chapter.narrative
        .split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0 && sentence.length < 100)
        .join('. ') + '.';
    }
    
    return adaptedChapter;
  }
}